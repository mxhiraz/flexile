import { companiesFactory } from "@test/factories/companies";
import { companyInvestorsFactory } from "@test/factories/companyInvestors";
import { shareClassesFactory } from "@test/factories/shareClasses";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { expect, test } from "@test/index";

test.describe("Cap Table", () => {
  const setupCompany = async () => {
    const { company, adminUser } = await companiesFactory.createCompletedOnboarding({
      capTableEnabled: true,
    });
    return { company, adminUser };
  };

  test("allows searching investors by name", async ({ page }) => {
    const { company, adminUser } = await setupCompany();

    const { user: investorUser } = await usersFactory.create({
      legalName: `SearchTest Investor ${Date.now()}`,
      preferredName: `SearchTest Investor ${Date.now()}`,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: investorUser.id,
      investmentAmountInCents: BigInt(100000),
    });

    const { user: otherInvestorUser } = await usersFactory.create({
      legalName: `Other Investor ${Date.now()}`,
      preferredName: `Other Investor ${Date.now()}`,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: otherInvestorUser.id,
      investmentAmountInCents: BigInt(50000),
    });

    await login(page, adminUser);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Cap table" }).click();

    const searchInput = page.getByPlaceholder("Search by investor...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("SearchTest");

    await expect(page.getByRole("row").filter({ hasText: "SearchTest Investor" })).toBeVisible();

    await expect(page.getByRole("row").filter({ hasText: "Other Investor" })).not.toBeVisible();

    await searchInput.clear();
    await expect(page.getByRole("row").filter({ hasText: "SearchTest Investor" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Other Investor" })).toBeVisible();
  });

  test("allows filtering by share class", async ({ page }) => {
    const { company, adminUser } = await setupCompany();

    await shareClassesFactory.create({
      companyId: company.id,
      name: "Common",
    });

    await shareClassesFactory.create({
      companyId: company.id,
      name: "Preferred",
    });

    const { user: commonInvestorUser } = await usersFactory.create({
      legalName: `Common Investor ${Date.now()}`,
      preferredName: `Common Investor ${Date.now()}`,
    });

    const { user: preferredInvestorUser } = await usersFactory.create({
      legalName: `Preferred Investor ${Date.now()}`, 
      preferredName: `Preferred Investor ${Date.now()}`,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: commonInvestorUser.id,
      investmentAmountInCents: BigInt(100000),
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: preferredInvestorUser.id,
      investmentAmountInCents: BigInt(200000),
    });

    await login(page, adminUser);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Cap table" }).click();

    const filterButton = page.getByRole("button").filter({ hasText: "Name" });
    await expect(filterButton).toBeVisible();

    await filterButton.click();

    await expect(page.getByText("Common")).toBeVisible();
    await expect(page.getByText("Preferred")).toBeVisible();

    await page.getByText("Common").click();
  });

  test("displays cap table with correct structure", async ({ page }) => {
    const { company, adminUser } = await setupCompany();

    const { user: investorUser } = await usersFactory.create({
      legalName: `Test Investor ${Date.now()}`,
      preferredName: `Test Investor ${Date.now()}`,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: investorUser.id,
      investmentAmountInCents: BigInt(100000),
    });

    await login(page, adminUser);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Cap table" }).click();

    await expect(page.getByRole("heading", { name: "Cap table" })).toBeVisible();

    await expect(page.getByPlaceholder("Search by investor...")).toBeVisible();

    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    await expect(page.getByText("Investors").first()).not.toBeVisible();

    await expect(page.getByRole("row").filter({ hasText: "Test Investor" })).toBeVisible();

    await expect(page.getByText("Share Classes")).not.toBeVisible();
  });

  test("allows selecting investors for contact functionality", async ({ page }) => {
    const { company, adminUser } = await setupCompany();

    const { user: investorUser } = await usersFactory.create({
      legalName: `Selectable Investor ${Date.now()}`,
      preferredName: `Selectable Investor ${Date.now()}`,
      email: `investor-${Date.now()}@test.com`,
    });

    await companyInvestorsFactory.create({
      companyId: company.id,
      userId: investorUser.id,
      investmentAmountInCents: BigInt(100000),
    });

    await login(page, adminUser);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Cap table" }).click();

    const investorRow = page.getByRole("row").filter({ hasText: "Selectable Investor" });
    const checkbox = investorRow.getByRole("checkbox");
    await checkbox.check();

    await expect(page.getByText("1 selected")).toBeVisible();
    await expect(page.getByRole("button", { name: "Contact selected" })).toBeVisible();
  });
});
