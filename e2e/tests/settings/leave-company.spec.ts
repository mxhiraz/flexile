import { db } from "@test/db";
import { companiesFactory } from "@test/factories/companies";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { companyInvestorsFactory } from "@test/factories/companyInvestors";
import { companyLawyersFactory } from "@test/factories/companyLawyers";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { expect, test } from "@test/index";
import { subDays } from "date-fns";
import { and, eq } from "drizzle-orm";
import { companyContractors, companyInvestors, companyLawyers } from "@/db/schema";

test.describe("Leave company", () => {
  test("administrator cannot see leave workspace option", async ({ page }) => {
    const { adminUser } = await companiesFactory.createCompletedOnboarding();
    await login(page, adminUser);

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page.getByText("Leave workspace")).not.toBeVisible();
  });

  test("contractor with active contract cannot see leave workspace option", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyContractorsFactory.create({
      companyId: company.id,
      userId: user.id,
      startedAt: subDays(new Date(), 1),
      endedAt: null,
      contractSignedElsewhere: false,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page.getByText("Leave workspace")).not.toBeVisible();
  });

  test("contractor with contract signed elsewhere cannot see leave workspace option", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyContractorsFactory.create({
      companyId: company.id,
      userId: user.id,
      startedAt: subDays(new Date(), 2),
      endedAt: subDays(new Date(), 1),
      contractSignedElsewhere: true,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page.getByText("Leave workspace")).not.toBeVisible();
  });

  test("contractor with ended contract can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyContractorsFactory.create({
      companyId: company.id,
      userId: user.id,
      startedAt: subDays(new Date(), 2),
      endedAt: subDays(new Date(), 1),
      contractSignedElsewhere: false,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/invoices");

    const contractor = await db.query.companyContractors.findFirst({
      where: and(eq(companyContractors.companyId, company.id), eq(companyContractors.userId, user.id)),
    });
    expect(contractor).toBeUndefined();
  });

  test("investor can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/invoices");

    const investor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, company.id), eq(companyInvestors.userId, user.id)),
    });
    expect(investor).toBeUndefined();
  });

  test("lawyer can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyLawyersFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/invoices");

    const lawyer = await db.query.companyLawyers.findFirst({
      where: and(eq(companyLawyers.companyId, company.id), eq(companyLawyers.userId, user.id)),
    });
    expect(lawyer).toBeUndefined();
  });

  test("user with multiple roles can leave successfully", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyContractorsFactory.create({
      companyId: company.id,
      userId: user.id,
      startedAt: subDays(new Date(), 2),
      endedAt: subDays(new Date(), 1),
      contractSignedElsewhere: false,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Leave" }).click();

    await expect(page).toHaveURL("/invoices");

    const contractor = await db.query.companyContractors.findFirst({
      where: and(eq(companyContractors.companyId, company.id), eq(companyContractors.userId, user.id)),
    });
    const investor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, company.id), eq(companyInvestors.userId, user.id)),
    });

    expect(contractor).toBeUndefined();
    expect(investor).toBeUndefined();
  });

  test("user can cancel leaving workspace", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });

    await login(page, user);
    await page.getByRole("link", { name: "Settings" }).click();

    await page.getByRole("button", { name: "Leave workspace" }).click();

    await expect(page.getByText("Leave this workspace?")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Leave this workspace?")).not.toBeVisible();

    const investor = await db.query.companyInvestors.findFirst({
      where: and(eq(companyInvestors.companyId, company.id), eq(companyInvestors.userId, user.id)),
    });
    expect(investor).toBeDefined();
  });
});
