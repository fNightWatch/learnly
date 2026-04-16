import { expect, test } from "@playwright/test";
import { attachBrowserGuards } from "./support/browser-guards";
import {
  MOBILE_VIEWPORT,
  gotoAndWait,
  preparePageWithFixture,
} from "./support/fixture-driver";

test.describe("core loop dashboard", () => {
  test("dashboard renders core modules and persists language filter changes", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/dashboard");
    await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Reviews Due")).toBeVisible();
    await expect(page.getByText("Vocabulary Growth")).toBeVisible();

    await page.getByRole("button", { name: "All" }).click();

    await expect
      .poll(async () => {
        const response = await page.request.get("/api/settings");
        const json = (await response.json()) as { dashboardLanguageCodes: string[] };
        return json.dashboardLanguageCodes.sort().join(",");
      })
      .toContain("fr");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect
      .poll(async () => {
        const response = await page.request.get("/api/dashboard");
        const json = (await response.json()) as { activeLanguageCodes: string[] };
        return json.activeLanguageCodes.length;
      })
      .toBeGreaterThan(1);

    await guards.expectHealthy();
    guards.detach();
  });

  test("dashboard keeps the shell and primary action visible on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/dashboard");
    await expect(page.getByRole("link", { name: "Start Study" })).toBeVisible();
    await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();

    await page.getByText("Reviews Due").scrollIntoViewIfNeeded();
    await expect(page.getByText("Reviews Due")).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });
});
