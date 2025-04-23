import { type Page } from "@playwright/test";
import { withinModal } from "@test/index";
import { differenceInMonths, format } from "date-fns";

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
  await withinModal(
    async (modal) => {
      const selectedMonth = new Date((await modal.getByRole("grid").getAttribute("aria-label")) ?? "");
      const diff = differenceInMonths(targetDate, selectedMonth);
      for (let i = 0; i <= Math.abs(diff); i++) {
        await modal.getByLabel(`Go to the ${diff > 0 ? "Next" : "Previous"} Month`).click();
      }
      await modal.getByLabel(format(targetDate, "PPPP")).click();
    },
    { page },
  );
}
