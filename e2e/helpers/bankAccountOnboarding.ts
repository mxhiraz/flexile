import { type Locator, type Page } from "..";
import { selectComboboxOption } from ".";
import { withinModal } from "..";

type BankAccountFormValues = {
  legalName: string;
  city: string;
  country: string;
  streetAddress: string;
  state: string;
  zipCode: string;
  routingNumber: string;
  accountNumber: string;
};
export async function fillOutUsdBankAccountForm(page: Page, formValues: BankAccountFormValues) {
  await withinModal(
    async (modal) => {
      await selectComboboxOption(page, "Currency", "USD (United States Dollar)", modal);
      await modal.getByLabel("Full name of the account holder").fill(formValues.legalName);
      await modal.getByLabel("Routing number").fill(formValues.routingNumber);
      await modal.getByLabel("Account number").fill(formValues.accountNumber);
      await modal.getByRole("button", { name: "Continue" }).click();
      await modal.getByLabel("Country").click();
      await page.getByRole("option", { name: formValues.country, exact: true }).click();
      await modal.getByLabel("City").fill(formValues.city);
      await modal.getByLabel("Street address, apt number").fill(formValues.streetAddress);
      await modal.getByLabel("State").click();
      await page.getByRole("option", { name: formValues.state, exact: true }).click();
      await modal.getByLabel("ZIP code").fill(formValues.zipCode);
    },
    { page, title: "Bank account" }
  );
}
