import { companiesFactory } from "@test/factories/companies";
import { companyInvestorsFactory } from "@test/factories/companyInvestors";
import { dividendRoundsFactory } from "@test/factories/dividendRounds";
import { dividendsFactory } from "@test/factories/dividends";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { expect, test } from "@test/index";

test.describe("Dividend Payment Drawer", () => {
  test("opens drawer when clicking dividend row on investor page", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();
    const { companyInvestor } = await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });
    const dividendRound = await dividendRoundsFactory.create({ companyId: company.id });
    const dividend = await dividendsFactory.create({
      companyId: company.id,
      companyInvestorId: companyInvestor.id,
      dividendRoundId: dividendRound.id,
      status: "Paid",
      totalAmountInCents: 100000n,
      numberOfShares: 1000n,
    });

    await login(page, user);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Dividends" }).first().click();

    await expect(page.getByRole("cell", { name: "$1,000" })).toBeVisible();

    await page.getByRole("row").filter({ hasText: "$1,000" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Dividend payment details")).toBeVisible();
    await expect(page.getByText("Dividend summary")).toBeVisible();
    await expect(page.getByText(user.name)).toBeVisible();
    await expect(page.getByText("$1,000")).toBeVisible();
    await expect(page.getByText("1,000")).toBeVisible();
  });

  test("opens drawer when clicking dividend row on admin dividend round page", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();
    const { companyInvestor } = await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });
    const dividendRound = await dividendRoundsFactory.create({ companyId: company.id });
    const dividend = await dividendsFactory.create({
      companyId: company.id,
      companyInvestorId: companyInvestor.id,
      dividendRoundId: dividendRound.id,
      status: "Paid",
      totalAmountInCents: 50000n,
      numberOfShares: 500n,
    });

    await login(page, user);
    await page.goto(`/equity/dividend_rounds/${dividendRound.id}`);

    await expect(page.getByRole("cell", { name: "$500" })).toBeVisible();

    await page.getByRole("row").filter({ hasText: "$500" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Dividend payment details")).toBeVisible();
    await expect(page.getByText("Dividend summary")).toBeVisible();
    await expect(page.getByText(user.name)).toBeVisible();
    await expect(page.getByText("$500")).toBeVisible();
    await expect(page.getByText("500")).toBeVisible();
  });

  test("displays no payment information message when payment data is missing", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();
    const { companyInvestor } = await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });
    const dividendRound = await dividendRoundsFactory.create({ companyId: company.id });
    const dividend = await dividendsFactory.create({
      companyId: company.id,
      companyInvestorId: companyInvestor.id,
      dividendRoundId: dividendRound.id,
      status: "Issued",
      totalAmountInCents: 75000n,
      numberOfShares: 750n,
    });

    await login(page, user);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Dividends" }).first().click();

    await page.getByRole("row").filter({ hasText: "$750" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("No payment information")).toBeVisible();
    await expect(page.getByText("This dividend has not been processed for payment yet.")).toBeVisible();
    
    await expect(page.getByRole("button", { name: /retrigger payment/i })).not.toBeVisible();
  });

  test("closes drawer when clicking close button", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();
    const { companyInvestor } = await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });
    const dividendRound = await dividendRoundsFactory.create({ companyId: company.id });
    const dividend = await dividendsFactory.create({
      companyId: company.id,
      companyInvestorId: companyInvestor.id,
      dividendRoundId: dividendRound.id,
      status: "Paid",
      totalAmountInCents: 25000n,
      numberOfShares: 250n,
    });

    await login(page, user);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Dividends" }).first().click();

    await page.getByRole("row").filter({ hasText: "$250" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("displays dividend status correctly in drawer", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();
    const { companyInvestor } = await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });
    const dividendRound = await dividendRoundsFactory.create({ companyId: company.id });
    const dividend = await dividendsFactory.create({
      companyId: company.id,
      companyInvestorId: companyInvestor.id,
      dividendRoundId: dividendRound.id,
      status: "Processing",
      totalAmountInCents: 150000n,
      numberOfShares: 1500n,
    });

    await login(page, user);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Dividends" }).first().click();

    await page.getByRole("row").filter({ hasText: "$1,500" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Processing")).toBeVisible();
  });

  test("handles keyboard navigation for drawer", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding();
    const { user } = await usersFactory.create();
    const { companyInvestor } = await companyInvestorsFactory.create({
      companyId: company.id,
      userId: user.id,
    });
    const dividendRound = await dividendRoundsFactory.create({ companyId: company.id });
    const dividend = await dividendsFactory.create({
      companyId: company.id,
      companyInvestorId: companyInvestor.id,
      dividendRoundId: dividendRound.id,
      status: "Paid",
      totalAmountInCents: 200000n,
      numberOfShares: 2000n,
    });

    await login(page, user);
    await page.getByRole("button", { name: "Equity" }).click();
    await page.getByRole("link", { name: "Dividends" }).first().click();

    await page.getByRole("row").filter({ hasText: "$2,000" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
