import { expect, type Page } from "@playwright/test";
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

  // Try using role="dialog" again for the popover
  const popoverLocator = page.locator('[role="dialog"]');
  await popoverLocator.waitFor({ state: "visible" });

  // --- Navigation Logic ---
  const targetMonth = getMonth(targetDate);
  const targetYear = getYear(targetDate);

  // Locate elements within the dialog popover
  const captionTableLocator = popoverLocator.locator('table[role="grid"][aria-label]');
  const prevButtonLocator = popoverLocator.getByLabel(/previous month/iu);
  const nextButtonLocator = popoverLocator.getByLabel(/next month/iu);

  let attempts = 0;
  const maxAttempts = 600;

  while (attempts < maxAttempts) {
    // Explicitly wait for the table/caption locator before getting attribute
    await captionTableLocator.waitFor({ state: "visible", timeout: 5000 }); // Add explicit wait with timeout
    const captionText = await captionTableLocator.getAttribute("aria-label");
    if (!captionText) throw new Error("Could not find calendar caption aria-label.");

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

    // Prioritize year navigation first, keep force click
    if (currentYear !== targetYear) {
      if (currentYear > targetYear) {
        await prevButtonLocator.click({ force: true });
      } else {
        await nextButtonLocator.click({ force: true });
      }
    } else if (currentMonth !== targetMonth) {
      if (currentMonth > targetMonth) {
        await prevButtonLocator.click({ force: true });
      } else {
        await nextButtonLocator.click({ force: true });
      }
    }

    await page.waitForTimeout(100); // Slightly longer pause
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
