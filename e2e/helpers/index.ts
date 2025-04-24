import type { Locator, Page } from "@playwright/test";

export const selectComboboxOption = async (page: Page, name: string, option: string, container?: Locator) => {
  const element = container ? container : page;
  await element.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: option }).click();
};
