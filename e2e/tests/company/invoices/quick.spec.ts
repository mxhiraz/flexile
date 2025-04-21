import { db, takeOrThrow } from "@test/db";
import { companiesFactory } from "@test/factories/companies";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { companyInvestorsFactory } from "@test/factories/companyInvestors";
import { equityAllocationsFactory } from "@test/factories/equityAllocations";
import { equityGrantsFactory } from "@test/factories/equityGrants";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { selectDateFromDatePicker } from "@test/helpers/datepicker";
import { expect, test } from "@test/index";
import { desc, eq } from "drizzle-orm";
import { PayRateType } from "@/db/enums";
import { companies, companyContractors, equityAllocations, invoices, users } from "@/db/schema";

test.describe("quick invoicing", () => {
  let company: typeof companies.$inferSelect;
  let contractorUser: typeof users.$inferSelect;
  let companyContractor: typeof companyContractors.$inferSelect;

  test.beforeEach(async ({ page }) => {
    company = (await companiesFactory.createCompletedOnboarding()).company;
    contractorUser = (
      await usersFactory.createWithBusinessEntity({
        zipCode: "22222",
        streetAddress: "1st St.",
      })
    ).user;
    companyContractor = (
      await companyContractorsFactory.create({
        companyId: company.id,
        userId: contractorUser.id,
        payRateInSubunits: 6000, // $60/hr
        payRateType: PayRateType.Hourly,
      })
    ).companyContractor;

    await login(page, contractorUser);
  });

  test.describe("when equity compensation is disabled", () => {
    test("allows filling out the form and previewing the invoice for hourly rate", async ({ page }) => {
      await page.getByLabel("Hours worked").fill("10:30");

      await selectDateFromDatePicker(page, "Invoice date", new Date(2024, 7, 8));

      await expect(page.getByText("Total invoice amount")).toBeVisible();
      await expect(page.getByText("Total to invoice")).toBeVisible();
      await expect(page.getByRole("link", { name: "Preview" })).toHaveAttribute("href", /invoices\/new/u);
    });

    test("allows filling out the form and previewing the invoice for project-based rate", async ({ page }) => {
      await db
        .update(companyContractors)
        .set({ payRateType: PayRateType.ProjectBased })
        .where(eq(companyContractors.id, companyContractor.id));

      await page.reload();

      await page.getByLabel("Amount to bill").fill("1234.56");

      await selectDateFromDatePicker(page, "Invoice date", new Date(2024, 7, 8));

      await expect(page.getByText("Total to invoice")).toBeVisible();
      await expect(page.getByRole("link", { name: "Preview" })).toHaveAttribute("href", /invoices\/new/u);
    });
  });

  test.describe("equity compensation", () => {
    test.beforeEach(async () => {
      await db.update(companies).set({ equityCompensationEnabled: true }).where(eq(companies.id, company.id));
      const companyInvestor = (
        await companyInvestorsFactory.create({
          companyId: company.id,
          userId: contractorUser.id,
        })
      ).companyInvestor;
      await equityGrantsFactory.createActive(
        { companyInvestorId: companyInvestor.id, sharePriceUsd: "8.23" },
        { year: 2024 },
      );
    });

    test("handles equity compensation when allocation is set", async ({ page }) => {
      await equityAllocationsFactory.create({
        companyContractorId: companyContractor.id,
        equityPercentage: 32,
        year: 2024,
      });

      await page.getByLabel("Hours worked").fill("10:30");

      await selectDateFromDatePicker(page, "Invoice date", new Date(2024, 7, 8));

      await expect(page.getByText("Total invoice amount")).toBeVisible();
      await expect(page.getByText("Swapped for equity (not paid in cash): $201.60")).toBeVisible();
      await expect(page.getByText("Net amount in cash$428.40")).toBeVisible();

      await page.getByRole("button", { name: "Send for approval" }).click();

      await expect(page.getByText("Lock 32% in equity for all 2024?")).toBeVisible();
      await expect(
        page.getByText("By submitting this invoice, your current equity selection of 32% will be locked for all 2024"),
      ).toBeVisible();
      await expect(
        page.getByText("You won't be able to choose a different allocation until the next options grant for 2025"),
      ).toBeVisible();
      await page.getByRole("button", { name: "Confirm 32% equity selection" }).click();

      await expect(page.getByRole("cell", { name: "Aug 8, 2024" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "$630" })).toBeVisible();

      const invoice = await db.query.invoices
        .findFirst({
          orderBy: desc(invoices.id),
        })
        .then(takeOrThrow);
      expect(invoice.totalMinutes).toBe(630);
      expect(invoice.totalAmountInUsdCents).toBe(63000n);
      expect(invoice.cashAmountInCents).toBe(42840n);
      expect(invoice.equityAmountInCents).toBe(20160n);
      expect(invoice.equityPercentage).toBe(32);
    });

    test("handles equity compensation when no allocation is set", async ({ page }) => {
      await db.delete(equityAllocations).where(eq(equityAllocations.companyContractorId, companyContractor.id));
      await page.getByLabel("Hours worked").fill("10:30");

      await selectDateFromDatePicker(page, "Invoice date", new Date(2024, 7, 8));

      await expect(page.getByText("Total invoice amount")).not.toBeVisible();
      await expect(page.getByText("Net amount in cash")).not.toBeVisible();
      await expect(page.getByText("Swapped for equity")).not.toBeVisible();
      await expect(page.getByText("Total to invoice$630")).toBeVisible();

      await page.getByRole("button", { name: "Send for approval" }).click();

      await expect(page.getByRole("cell", { name: "Aug 8, 2024" })).toBeVisible();
      await expect(page.getByRole("cell", { name: "$630" })).toBeVisible();

      const invoice = await db.query.invoices
        .findFirst({
          orderBy: desc(invoices.id),
        })
        .then(takeOrThrow);
      expect(invoice.totalMinutes).toBe(630);
      expect(invoice.totalAmountInUsdCents).toBe(63000n);
      expect(invoice.cashAmountInCents).toBe(63000n);
      expect(invoice.equityAmountInCents).toBe(0n);
      expect(invoice.equityPercentage).toBe(0);
    });
  });
});
