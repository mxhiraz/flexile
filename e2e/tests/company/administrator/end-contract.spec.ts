import { clerk } from "@clerk/testing/playwright";
import { db } from "@test/db";
import { companiesFactory } from "@test/factories/companies";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { login } from "@test/helpers/auth";
import { selectDateFromDatePicker } from "@test/helpers/datepicker";
import { mockDocuseal } from "@test/helpers/docuseal";
import { expect, test, withinModal } from "@test/index";
import { addDays, addYears, format } from "date-fns";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { assert } from "@/utils/assert";

test.describe("End contract", () => {
  test("allows admin to end contractor's contract", async ({ page, sentEmails, next }) => {
    const { company, adminUser } = await companiesFactory.createCompletedOnboarding();

    await login(page, adminUser);

    const { companyContractor } = await companyContractorsFactory.create({
      companyId: company.id,
    });
    const contractor = await db.query.users.findFirst({
      where: eq(users.id, companyContractor.userId),
    });
    assert(contractor != null, "Contractor is required");
    assert(contractor.preferredName != null, "Contractor preferred name is required");

    await page.getByRole("link", { name: "People" }).click();
    await page.getByRole("link", { name: contractor.preferredName }).click();
    await page.getByRole("button", { name: "End contract" }).click();

    const today = new Date();
    const expectedButtonText = format(today, "PPP");
    await expect(page.getByLabel("End date")).toContainText(expectedButtonText);

    await page.getByRole("button", { name: "Yes, end contract" }).click();

    await expect(page.getByText("Contractors will show up here.")).toBeVisible();
    await page.getByRole("tab", { name: "Alumni" }).click();
    await page.getByRole("link", { name: contractor.preferredName }).click();

    await expect(page.getByText(`Contract ended on ${format(new Date(), "MMM d, yyyy")}`)).toBeVisible();
    await expect(page.getByText("Alumni")).toBeVisible();
    await expect(page.getByRole("button", { name: "End contract" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).not.toBeVisible();
    expect(sentEmails).toEqual([
      expect.objectContaining({
        to: contractor.email,
        subject: `Your contract with ${company.name} has ended`,
        text: expect.stringMatching(/Your contract with .* has ended on \w{3,4} \d{1,2}, \d{4}/u),
      }),
    ]);

    // Re-invite
    await page.getByRole("link", { name: "People" }).click();
    await page.getByRole("link", { name: "Invite contractor" }).click();
    const { mockForm } = mockDocuseal(next, {
      submitters: () => ({ "Company Representative": adminUser, Signer: contractor }),
    });
    await mockForm(page);
    await page.getByLabel("Email").fill(contractor.email);
    await page.getByLabel("Average hours").fill("25");
    await selectDateFromDatePicker(page, "Start date", addYears(new Date(), 1));
    await page.getByRole("button", { name: "Send invite" }).click();
    await withinModal(
      async (modal) => {
        await modal.getByRole("button", { name: "Sign now" }).click();
        await modal.getByRole("link", { name: "Type" }).click();
        await modal.getByPlaceholder("Type signature here...").fill("Admin Admin");
        await modal.getByRole("button", { name: "Complete" }).click();
      },
      { page },
    );

    await expect(
      page.getByRole("row").filter({ hasText: contractor.preferredName }).filter({ hasText: "In Progress" }),
    ).toBeVisible();

    await clerk.signOut({ page });
    await login(page, contractor);
    await page.getByRole("link", { name: "Review & sign" }).click();
    await page.getByRole("button", { name: "Sign now" }).click();
    await page.getByRole("link", { name: "Type" }).click();
    await page.getByPlaceholder("Type signature here...").fill("Flexy Bob");
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(page.getByRole("heading", { name: "Invoicing" })).toBeVisible();
  });

  test("allows admin to end contractor's contract in the future", async ({ page, sentEmails }) => {
    const { company, adminUser } = await companiesFactory.createCompletedOnboarding();

    await login(page, adminUser);

    const { companyContractor } = await companyContractorsFactory.create({
      companyId: company.id,
    });
    const contractor = await db.query.users.findFirst({
      where: eq(users.id, companyContractor.userId),
    });
    assert(contractor != null, "Contractor is required");
    assert(contractor.preferredName != null, "Contractor preferred name is required");

    const futureDate = addDays(new Date(), 30);

    await page.getByRole("link", { name: "People" }).click();
    await page.getByRole("link", { name: contractor.preferredName }).click();
    await page.getByRole("button", { name: "End contract" }).click();

    await selectDateFromDatePicker(page, "End date", futureDate);
    await page.getByRole("button", { name: "Yes, end contract" }).click();

    await page.getByRole("link", { name: contractor.preferredName }).click();

    // Wait for the specific alert using data-slot
    const alertLocator = page.locator('[role="alert"][data-slot="alert"]');
    await expect(alertLocator).toBeVisible();
    // Target the inner div and use a more specific regex anchored to the start
    await expect(alertLocator.locator('[data-slot="alert-description"] > div')).toHaveText(
      /^Contract ends on \w{3,4} \d{1,2}, \d{4}\./u,
    );

    await expect(page.getByRole("button", { name: "End contract" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).not.toBeVisible();

    await page.getByRole("button", { name: "Cancel contract end" }).click();
    await page.getByRole("button", { name: "Yes, cancel contract end" }).click();

    await expect(page.getByText(`Contract ends on`)).not.toBeVisible();
    await expect(page.getByRole("button", { name: "End contract" })).toBeVisible();

    expect(sentEmails).toEqual([
      expect.objectContaining({
        to: contractor.email,
        subject: `Your contract with ${company.name} has ended`,
        text: expect.stringMatching(/Your contract with .* has ended on \w{3,4} \d{1,2}, \d{4}/u),
      }),
      expect.objectContaining({
        to: contractor.email,
        subject: `Your contract end with ${company.name} has been canceled`,
      }),
    ]);
  });
});
