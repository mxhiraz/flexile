import { companiesFactory } from "@test/factories/companies";
import { companyAdministratorsFactory } from "@test/factories/companyAdministrators";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { expect, test } from "@test/index";

test.describe("Role field conditional rendering", () => {
  test("shows plain input when no existing roles", async ({ page }) => {
    const { company } = await companiesFactory.create();
    const { user: admin } = await usersFactory.create();
    await companyAdministratorsFactory.create({
      companyId: company.id,
      userId: admin.id,
    });

    await login(page, admin);
    await page.getByRole("link", { name: "People" }).click();
    await page.getByRole("button", { name: "Invite contractor" }).click();

    const roleField = page.getByLabel("Role");
    await expect(roleField).toBeVisible();

    await roleField.fill("New Role");
    await expect(roleField).toHaveValue("New Role");

    await roleField.click();
    await expect(page.getByRole("option")).toHaveCount(0);
  });

  test("shows dropdown when existing roles are present", async ({ page }) => {
    const { company } = await companiesFactory.create();
    const { user: admin } = await usersFactory.create();
    await companyAdministratorsFactory.create({
      companyId: company.id,
      userId: admin.id,
    });

    await companyContractorsFactory.create({
      companyId: company.id,
      role: "Developer",
    });

    await companyContractorsFactory.create({
      companyId: company.id,
      role: "Designer",
    });

    await login(page, admin);
    await page.getByRole("link", { name: "People" }).click();
    await page.getByRole("button", { name: "Invite contractor" }).click();

    const roleField = page.getByLabel("Role");
    await expect(roleField).toBeVisible();

    await roleField.click();
    await expect(page.getByRole("option", { name: "Developer" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Designer" })).toBeVisible();

    await page.getByRole("option", { name: "Developer" }).click();
    await expect(roleField).toHaveValue("Developer");
  });

  test("transitions from plain input to dropdown when roles are added", async ({ page }) => {
    const { company } = await companiesFactory.create();
    const { user: admin } = await usersFactory.create();
    await companyAdministratorsFactory.create({
      companyId: company.id,
      userId: admin.id,
    });

    await login(page, admin);
    await page.getByRole("link", { name: "People" }).click();

    await page.getByRole("button", { name: "Invite contractor" }).click();

    const dialog = page.getByRole("dialog", { name: "Who's joining?" });
    const roleField = dialog.getByLabel("Role");
    await roleField.click();
    await expect(page.getByRole("option")).toHaveCount(0);

    await dialog.getByLabel("Email").fill("test@example.com");
    await roleField.fill("Developer");
    await dialog.getByLabel("Start date").fill("2025-01-01");
    await dialog.getByRole("button", { name: "Send invite" }).click();

    await expect(page.getByText("Invite sent")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    await expect(dialog).not.toBeVisible();

    await page.getByRole("button", { name: "Invite contractor" }).click();
    const newDialog = page.getByRole("dialog", { name: "Who's joining?" });
    const newRoleField = newDialog.getByLabel("Role");
    await newRoleField.click();
    await expect(page.getByRole("option", { name: "Developer" })).toBeVisible();
  });
});
