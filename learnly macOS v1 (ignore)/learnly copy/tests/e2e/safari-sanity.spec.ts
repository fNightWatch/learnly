import { expect, test } from "@playwright/test";
import { attachBrowserGuards } from "./support/browser-guards";
import { gotoAndWait, preparePageWithFixture } from "./support/fixture-driver";

test("safari sanity covers home, dashboard, and study setup", async ({ page }) => {
  const guards = attachBrowserGuards(page);
  await preparePageWithFixture(page, "fresh", {
    selectedLanguages: ["es"],
    dashboardLanguages: ["es"],
  });

  await gotoAndWait(page, "/");
  await expect(page.getByRole("heading", { name: /Build lasting vocabulary/i })).toBeVisible();

  await gotoAndWait(page, "/dashboard");
  await expect(page.getByText("Reviews Due")).toBeVisible();

  await gotoAndWait(page, "/study?new");
  await expect(page.getByRole("heading", { name: /Ready to study\?/i })).toBeVisible();

  await guards.expectHealthy();
  guards.detach();
});
