import { type Page } from "@playwright/test";

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
  await page.getByLabel(label).click();

  // 2. Wait for the calendar popover to appear using the data-slot attribute
  const popoverLocator = page.locator('[data-slot="popover-content"]');
  await popoverLocator.waitFor({ state: "visible" });

  // --- TODO: Add month/year navigation logic if needed ---
  // This helper currently assumes the target month/year is already visible.

  // 3. Click the specific day button within the calendar popover.
  //    Targeting the button by its text content (day number).
  const day = String(targetDate.getDate());
  //    NOTE: If this locator fails, inspect the calendar using Playwright Trace Viewer
  //    or page.pause() to find the correct locator. It might need refinement,
  //    e.g., using getByRole('button', { name: day, exact: true }) or a CSS selector like '[class*="day_button"]'.
  await popoverLocator.getByText(day, { exact: true }).click();

  // 4. Wait for the popover to close (ensures selection is complete)
  await popoverLocator.waitFor({ state: "hidden" });
}
