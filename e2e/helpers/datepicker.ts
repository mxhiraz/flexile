import { expect, type Page } from "@playwright/test";
import { format } from "date-fns";

/**
 * Selects a date from a DatePicker component triggered by an associated label.
 * Assumes the target month is already visible in the calendar.
 *
 * @param page Playwright Page object
 * @param label The text content of the label associated with the DatePicker's trigger button.
 * @param targetDate The Date object representing the date to select.
 */
export async function selectDateFromDatePicker(page: Page, label: string, targetDate: Date) {
  const triggerButton = page.getByLabel(label);
  await triggerButton.click();

  const popoverLocator = page.locator('[data-slot="popover-content"]');
  await popoverLocator.waitFor({ state: "visible" });

  const day = String(targetDate.getDate());
  await popoverLocator.getByText(day, { exact: true }).click();

  const expectedButtonText = format(targetDate, "PPP");
  await expect(triggerButton).toContainText(expectedButtonText);
}
