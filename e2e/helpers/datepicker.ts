import { type Page, expect } from "@playwright/test";
import { format, getMonth, getYear } from "date-fns";

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

  // --- Navigation Logic ---
  const targetMonth = getMonth(targetDate);
  const targetYear = getYear(targetDate);

  // Update captionLocator to use the table's aria-label
  const captionTableLocator = popoverLocator.locator('table[role="grid"]');
  const prevButtonLocator = popoverLocator.getByLabel(/previous month/iu);
  const nextButtonLocator = popoverLocator.getByLabel(/next month/iu);

  let attempts = 0;
  const maxAttempts = 24; // Max 2 years navigation

  while (attempts < maxAttempts) {
    // Read the aria-label from the table
    const captionText = await captionTableLocator.getAttribute("aria-label");
    if (!captionText) throw new Error("Could not find calendar caption aria-label.");

    // Attempt to parse the current date from the caption aria-label
    let currentDate: Date;
    try {
      currentDate = new Date(captionText.trim());
      if (isNaN(currentDate.getTime())) throw new Error("Invalid Date");
    } catch (_e) {
      throw new Error(`Could not parse calendar caption aria-label: "${captionText}"`);
    }

    const currentMonth = getMonth(currentDate);
    const currentYear = getYear(currentDate);

    if (currentYear === targetYear && currentMonth === targetMonth) {
      break;
    }

    if (currentYear < targetYear || (currentYear === targetYear && currentMonth < targetMonth)) {
      await nextButtonLocator.click();
    } else {
      await prevButtonLocator.click();
    }

    await page.waitForTimeout(50);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error(`Could not navigate to target date ${targetDate.toDateString()} after ${maxAttempts} attempts.`);
  }
  // --- End Navigation Logic ---

  const day = String(targetDate.getDate());
  await popoverLocator.getByText(day, { exact: true }).click();

  // Press Escape key to ensure the popover closes
  await page.keyboard.press("Escape");

  const expectedButtonText = format(targetDate, "PPP");
  await expect(triggerButton).toContainText(expectedButtonText);
}
