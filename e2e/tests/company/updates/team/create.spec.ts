import { readFile } from "fs/promises";
import { companiesFactory } from "@test/factories/companies";
import { companyContractorsFactory } from "@test/factories/companyContractors";
import { companyContractorUpdatesFactory } from "@test/factories/companyContractorUpdates";
import { companyContractorUpdateTasksFactory } from "@test/factories/companyContractorUpdateTasks";
import { githubIntegrationsFactory } from "@test/factories/githubIntegrations";
import { usersFactory } from "@test/factories/users";
import { login } from "@test/helpers/auth";
import { startsOn } from "@test/helpers/date";
import { expect, test } from "@test/index";
import { addDays, nextFriday, nextWednesday, startOfWeek, subDays } from "date-fns";
import { format } from "date-fns/format";
import { nextThursday } from "date-fns/nextThursday";
import { nextTuesday } from "date-fns/nextTuesday";
import { z } from "zod";

test.describe("Team member updates page", () => {
  test("view team updates", async ({ page, next }) => {
    const responseParser = z.object({ url: z.string(), data: z.unknown() });
    const mockResponses = await Promise.all(
      ["gh.search.json", "gh.unfurl-issue-open.json", "gh.unfurl-pr-open.json"].map(async (file) =>
        responseParser.parse(JSON.parse(await readFile(`./e2e/samples/githubApi/${file}`, "utf-8"))),
      ),
    );
    next.onFetch((request) => {
      const mockResponse = mockResponses.find((mockResponse) => request.url === mockResponse.url);
      return mockResponse ? Response.json(mockResponse.data) : "continue";
    });

    const context = page.context();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const { company } = await companiesFactory.createCompletedOnboarding({ teamUpdatesEnabled: true });
    const { user: contractorUser } = await usersFactory.create({ preferredName: "Sylvester" });
    const { companyContractor } = await companyContractorsFactory.create({
      companyId: company.id,
      userId: contractorUser.id,
    });
    await companyContractorsFactory.create({
      companyId: company.id,
    });

    await githubIntegrationsFactory.create({ companyId: company.id });

    const prevUpdate = await companyContractorUpdatesFactory.create({
      companyContractorId: companyContractor.id,
      periodStartsOn: startsOn(subDays(new Date(), 7)).toDateString(),
    });

    await login(page, contractorUser);
    await page.getByRole("link", { name: "Updates" }).click();

    const thisWeekUpdateContainer = page.locator("form ul"); 

    // Tasks are visible when they don't have any content
    await expect(thisWeekUpdateContainer.locator("li").getByPlaceholder("Describe your task").first()).toBeVisible();

    await companyContractorUpdateTasksFactory.create({
      companyContractorUpdateId: prevUpdate.id,
      name: "Last week task 1",
    });
    await companyContractorUpdateTasksFactory.create({
      companyContractorUpdateId: prevUpdate.id,
      name: "Last week task 2",
    });

    // Login and visit page
    await page.reload();

    // This week tasks
    const firstTaskItem = thisWeekUpdateContainer.locator("li").nth(0);
    const secondTaskItem = thisWeekUpdateContainer.locator("li").nth(1); // Assuming a second item is added or exists
    await firstTaskItem.getByPlaceholder("Describe your task").fill("This week task 1");
    await expect(secondTaskItem.getByPlaceholder("Describe your task")).toBeVisible(); 
    await secondTaskItem.getByPlaceholder("Describe your task").fill("This week task 2");
    await firstTaskItem.getByRole("checkbox").click();
    await expect(firstTaskItem.getByRole("checkbox")).toBeChecked();

    const taskItems = thisWeekUpdateContainer.locator("li");
    const lastTaskInput = taskItems.last().getByPlaceholder("Describe your task");
    await lastTaskInput.fill("#issues");

    const searchResultsListbox = page.locator('[cmdk-list][role="listbox"]:visible'); // More specific selector for Shadcn Command list
    await expect(searchResultsListbox).toBeVisible();
    await expect(searchResultsListbox.getByRole("option")).toHaveCount(5);
    await searchResultsListbox.getByRole("option", { name: /#3 Closed issue/u }).click(); // Use regex for flexibility
    await expect(searchResultsListbox).not.toBeVisible(); // Listbox should hide after selection
    await expect(taskItems.last().getByRole("link", { name: /#3 Closed issue/u })).toHaveAttribute(
      "href",
      "https://github.com/anti-work-test/flexile/issues/3",
    );

    const taskItemWithLink1 = thisWeekUpdateContainer.locator("li").filter({ hasText: /#3 Closed issue/u });
    await taskItemWithLink1.getByPlaceholder("Describe your task").click(); // Click into the input
    await taskItemWithLink1.evaluate(async () => {
      await navigator.clipboard.writeText(" https://github.com/antiwork/flexile/pull/3730"); // Add space to separate
    });
    await page.keyboard.press("ControlOrMeta+v");
    await expect(taskItemWithLink1.getByRole("link", { name: /#3730 Move GitHub endpoints/u })).toBeVisible();
    await expect(taskItemWithLink1.getByRole("link", { name: /#3730 Move GitHub endpoints/u })).toHaveAttribute(
      "href",
      "https://github.com/antiwork/flexile/pull/3730",
    );

    await page.locator("form").getByRole("button", { name: "Add task" }).click();
    const newTaskItem = thisWeekUpdateContainer.locator("li").last(); // Get the newly added item
    await newTaskItem.getByPlaceholder("Describe your task").click();
    await newTaskItem.evaluate(async () => {
      await navigator.clipboard.writeText("https://github.com/anti-work-test/flexile/issues/1");
    });
    await page.keyboard.press("ControlOrMeta+v");
    await expect(newTaskItem.getByRole("link", { name: /#1 Open issue/u })).toBeVisible();
    await expect(newTaskItem.getByRole("link", { name: /#1 Open issue/u })).toHaveAttribute(
      "href",
      "https://github.com/anti-work-test/flexile/issues/1",
    );

    // Fill in time off
    await expect(page.getByText("Off this week: Sylvester")).not.toBeVisible();
    await page.getByRole("button", { name: "Log time off" }).click();
    const thisWeek = startOfWeek(new Date());
    await page.getByLabel("From").fill(format(nextTuesday(thisWeek), "yyyy-MM-dd"));
    await page.getByLabel("Until").fill(format(nextWednesday(thisWeek), "yyyy-MM-dd"));
    await page.getByRole("button", { name: "Add more" }).click();
    await page
      .getByLabel("From")
      .nth(1)
      .fill(format(nextThursday(thisWeek), "yyyy-MM-dd"));
    await page
      .getByLabel("Until")
      .nth(1)
      .fill(format(nextFriday(thisWeek), "yyyy-MM-dd"));
    await page.getByRole("button", { name: "Save time off" }).click();
    await expect(page.getByRole("button", { name: "Saved!" })).toBeVisible();
    await expect(page.getByText("Off this week: Sylvester")).toBeVisible();

    // Post update
    await expect(page.getByText("Missing updates: Sylvester")).not.toBeVisible();

    // missing update shown after first update is posted
    await expect(page.getByText("Missing updates: Sylvester")).not.toBeVisible();
    await expect(page.getByText("Missing updates: ")).toBeVisible();

    // View updates
    await page.reload();

    const finalTaskItem = thisWeekUpdateContainer.locator("li").last();
    await finalTaskItem.getByRole("checkbox").click();
    await finalTaskItem.getByPlaceholder("Describe your task").pressSequentially(" last minute addition"); 
    await page.waitForTimeout(600); // Wait for potential autosave
    await page.reload();

    const reloadedUpdateContainer = page.locator("form ul");
    const updateContainer = page.locator("div:has(hgroup+form)"); // Keep this locator as is
    await expect(updateContainer.locator("h2")).toContainText("Sylvester");
    await expect(reloadedUpdateContainer).toBeVisible();

    await expect(reloadedUpdateContainer.locator("li").nth(0).getByPlaceholder("Describe your task")).toHaveValue("This week task 1");
    await expect(reloadedUpdateContainer.locator("li").nth(1).getByPlaceholder("Describe your task")).toHaveValue("This week task 2");
    await expect(reloadedUpdateContainer.locator("li").filter({ hasText: /#3 Closed issue/u }).getByRole("link", { name: /#3730 Move GitHub endpoints/u })).toBeVisible();
    await expect(reloadedUpdateContainer.locator("li").last().getByRole("link", { name: /#1 Open issue/u })).toBeVisible();
    await expect(reloadedUpdateContainer.locator("li").last().getByPlaceholder("Describe your task")).toHaveValue(/last minute addition/u); // Check appended text
    await expect(reloadedUpdateContainer.locator("li").first().getByRole("checkbox")).toBeChecked(); // First task checkbox
    await expect(reloadedUpdateContainer.locator("li").last().getByRole("checkbox")).toBeChecked(); // Last task checkbox
    await expect(reloadedUpdateContainer.getByRole("checkbox", { checked: true })).toHaveCount(2);
  });

  test("alumni contractor cannot access updates", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding({ teamUpdatesEnabled: true });
    const { user: alumniUser } = await usersFactory.create();
    await companyContractorsFactory.createInactive({
      companyId: company.id,
      userId: alumniUser.id,
    });

    await login(page, alumniUser);

    await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Updates" })).not.toBeVisible();

    await page.goto("/updates/team");
    await expect(page.getByText("Access denied")).toBeVisible();
  });

  test("contractors with a future end date can access updates", async ({ page }) => {
    const { company } = await companiesFactory.createCompletedOnboarding({ teamUpdatesEnabled: true });
    const { user: alumniUser } = await usersFactory.create();
    await companyContractorsFactory.create({
      companyId: company.id,
      userId: alumniUser.id,
      endedAt: addDays(new Date(), 1),
    });

    await login(page, alumniUser);

    await page.getByRole("link", { name: "Updates" }).click();
    await expect(page.getByText("This week:")).toBeVisible();

    const thisWeekUpdateContainer = page.locator("form ul");
    await thisWeekUpdateContainer.getByPlaceholder("Describe your task").first().fill("new task");
    await page.waitForTimeout(600); // Wait for potential autosave
    await page.reload();
    const reloadedUpdateContainer = page.locator("form ul");
    await expect(reloadedUpdateContainer.locator("li").first().getByPlaceholder("Describe your task")).toHaveValue("new task");
  });
});
