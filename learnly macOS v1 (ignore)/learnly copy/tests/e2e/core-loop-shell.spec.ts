import { expect, test } from "@playwright/test";
import { attachBrowserGuards } from "./support/browser-guards";
import {
  gotoAndWait,
  preparePageWithFixture,
} from "./support/fixture-driver";

test.describe("core loop shell", () => {
  test("home loads and the primary CTA routes into study setup", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/");
    await expect(page.getByRole("heading", { name: /Build lasting vocabulary/i })).toBeVisible();
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Words" })).toBeVisible();

    await page.getByRole("link", { name: /Start Studying/i }).click();
    await page.waitForURL(/\/study(?:\?new)?$/);
    await expect(page.getByRole("heading", { name: /Ready to study\?/i })).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("theme toggle persists across home, dashboard, and study", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
      theme: "light",
    });

    await gotoAndWait(page, "/");
    const toggle = page.getByRole("button", { name: /Switch to dark mode/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toBe("dark");
    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("languagehack-theme")))
      .toBe("dark");

    await gotoAndWait(page, "/dashboard");
    await expect(page.getByText("Reviews Due")).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toBe("dark");

    await gotoAndWait(page, "/study?new");
    await expect(page.getByRole("heading", { name: /Ready to study\?/i })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.dataset.theme))
      .toBe("dark");

    await guards.expectHealthy();
    guards.detach();
  });
});
