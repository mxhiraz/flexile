import { companiesFactory } from "@test/factories/companies";
import { companyInvestorEntitiesFactory } from "@test/factories/companyInvestorEntities";
import { login } from "@test/helpers/auth";
import { expect, test } from "@test/index";

test.describe("Investors", () => {
  test("displays correct ownership percentages for investors", async ({ page }) => {
    const { company, adminUser } = await companiesFactory.createCompletedOnboarding({
      equityEnabled: true,
      fullyDilutedShares: BigInt(1000000),
    });

    await companyInvestorEntitiesFactory.create({
      companyId: company.id,
      name: "Alice Investor",
      email: "alice@example.com",
      totalShares: BigInt(100000),
      investmentAmountCents: BigInt(0),
    });

    await companyInvestorEntitiesFactory.create({
      companyId: company.id,
      name: "Bob Investor",
      email: "bob@example.com",
      totalShares: BigInt(50000),
      investmentAmountCents: BigInt(0),
    });

    await login(page, adminUser);
    await page.goto("/equity/investors");

    await expect(page.getByText("Investors")).toBeVisible();
    await expect(page.getByText("Alice Investor")).toBeVisible();
    await expect(page.getByText("Bob Investor")).toBeVisible();

    await expect(page.locator("tbody")).toContainText("10.00%");
    await expect(page.locator("tbody")).toContainText("5.00%");

    await expect(page.locator("tbody")).toContainText("100,000");
    await expect(page.locator("tbody")).toContainText("50,000");
  });

  test("recalculates ownership percentages when data changes", async ({ page }) => {
    const { company, adminUser } = await companiesFactory.createCompletedOnboarding({
      equityEnabled: true,
      fullyDilutedShares: BigInt(1000000),
    });

    await companyInvestorEntitiesFactory.create({
      companyId: company.id,
      name: "Test Investor",
      email: "test@example.com",
      totalShares: BigInt(200000),
      investmentAmountCents: BigInt(0),
    });

    await login(page, adminUser);
    await page.goto("/equity/investors");

    await expect(page.getByText("Test Investor")).toBeVisible();
    await expect(page.locator("tbody")).toContainText("20.00%");
    await expect(page.locator("tbody")).toContainText("200,000");
  });

  test("shows correct ownership percentages for both outstanding and fully diluted columns", async ({ page }) => {
    const { company, adminUser } = await companiesFactory.createCompletedOnboarding({
      equityEnabled: true,
      fullyDilutedShares: BigInt(2000000),
    });

    await companyInvestorEntitiesFactory.create({
      companyId: company.id,
      name: "Major Investor",
      email: "major@example.com",
      totalShares: BigInt(300000),
      investmentAmountCents: BigInt(0),
    });

    await login(page, adminUser);
    await page.goto("/equity/investors");

    await expect(page.getByText("Major Investor")).toBeVisible();
    await expect(page.locator("tbody")).toContainText("15.00%");
    await expect(page.locator("tbody")).toContainText("300,000");

    await expect(page.getByRole("cell", { name: "Outstanding ownership" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Fully diluted ownership" })).toBeVisible();
  });
});
