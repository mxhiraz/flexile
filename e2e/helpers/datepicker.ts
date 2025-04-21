import { type Page, expect } from "@playwright/test";
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
  // 1. Click the trigger button associated with the label
  const triggerButton = page.getByLabel(label);
  await triggerButton.click();

  // 2. Wait for the calendar popover to appear using the data-slot attribute
  const popoverLocator = page.locator('[data-slot="popover-content"]');
  await popoverLocator.waitFor({ state: "visible" });

  // --- TODO: Add month/year navigation logic if needed ---
  // This helper currently assumes the target month/year is already visible.

  // 3. Click the specific day button within the calendar popover.
  //    Using getByRole for better targeting.
  const day = String(targetDate.getDate());
  await popoverLocator.getByRole("button", { name: day, exact: true }).click();

  // 4. Wait for the trigger button text to update (ensures selection is complete and popover likely closed)
  const expectedButtonText = format(targetDate, "PPP");
  await expect(triggerButton).toContainText(expectedButtonText);
  // Optional: A small explicit wait if timing is still tricky, but expect should handle most cases.
  // await page.waitForTimeout(100);
}
