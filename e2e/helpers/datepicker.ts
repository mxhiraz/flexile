import { type Page } from "@playwright/test";
import { differenceInCalendarMonths, format } from "date-fns";

/**
 * Selects a date from a DatePicker component triggered by an associated label.
 * Assumes the target month is already visible in the calendar.
 *
 * @param page Playwright Page object
 * @param label The text content of the label associated with the DatePicker's trigger button.
 * @param targetDate The Date object representing the date to select.
 */
export async function selectDateFromDatePicker(page: Page, label: string, targetDate: Date) {
  await page.getByLabel(label).click();
  const diff = differenceInCalendarMonths(targetDate, new Date());
  for (let i = 0; i < Math.abs(diff); i++) {
    await page.getByLabel(`Go to the ${diff > 0 ? "Next" : "Previous"} Month`).click();
  }
  await page.getByLabel(format(targetDate, "PPPP")).click();
  await page.getByLabel(label).click();
}
