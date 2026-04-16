import { expect, test } from "@playwright/test";
import { attachBrowserGuards } from "./support/browser-guards";
import {
  MOBILE_VIEWPORT,
  SHORT_HEIGHT_MOBILE_VIEWPORT,
  gotoAndWait,
  preparePageWithFixture,
} from "./support/fixture-driver";

test.describe("core loop study", () => {
  test.fixme("study setup keeps the primary action above the fold on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/study?new");
    const startButton = page.getByRole("button", { name: "Start Study" });
    await expect(startButton).toBeVisible();

    const box = await startButton.boundingBox();
    expect(box, "start button should have a box").not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(MOBILE_VIEWPORT.height);

    await guards.expectHealthy();
    guards.detach();
  });

  test("standard study success path advances from prompt to reveal to next card", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/study?new");
    await page.getByRole("button", { name: "Start Study" }).click();

    await expect(page.getByText("Do you think you know it?")).toBeVisible();
    await page.getByRole("button", { name: /I think I know/i }).click();
    await expect(page.getByText("Did you know it?")).toBeVisible();
    await page.getByRole("button", { name: /Yes/i }).click();
    await expect(page.getByText("Do you think you know it?")).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("standard study failure path goes through recovery before submitting fail", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "recovery", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/study");

    await page.getByRole("button", { name: /I don't know/i }).click();
    await expect(page.getByText("You forgot this word.")).toBeVisible();
    await expect(page.getByRole("button", { name: "I'm done studying it" })).toBeVisible();
    await page.getByRole("button", { name: "I'm done studying it" }).click();
    await expect(page.getByText("Do you think you know it?")).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("chinese four-click flow hides pinyin before the guess and reveals it after think-know", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    const fixture = await preparePageWithFixture(page, "recovery", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
      chineseReviewFlow: "four-click",
      direction: "auto",
    });

    await gotoAndWait(page, "/study");
    await expect(page.getByText("Do you think you know the pronunciation?")).toBeVisible();
    await expect(page.getByText(fixture.session?.currentCard?.pronunciation ?? "")).toHaveCount(0);

    await page.getByRole("button", { name: /I think I know/i }).click();
    await expect(page.getByText("Did you know the pronunciation?")).toBeVisible();
    await expect(page.getByText(fixture.session?.currentCard?.pronunciation ?? "")).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("chinese two-click mode falls back to the standard binary review flow", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
      chineseReviewFlow: "two-click",
    });

    await gotoAndWait(page, "/study?new");
    await page.getByRole("button", { name: "Start Study" }).click();
    await expect(
      page.getByText(/Do you think you know it\?|Do you know this word\?/)
    ).toBeVisible();
    await expect(page.getByText("Do you think you know the pronunciation?")).toHaveCount(0);

    await guards.expectHealthy();
    guards.detach();
  });

  test("refresh restore keeps the same in-progress study card and direction", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    const fixture = await preparePageWithFixture(page, "in-progress", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
      direction: "auto",
    });

    await gotoAndWait(page, "/study");
    await expect(page.getByText(fixture.session?.currentCard?.primaryGloss ?? "")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(fixture.session?.currentCard?.primaryGloss ?? "")).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("pause, resume, and end preserve a coherent study session flow", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/study?new");
    await page.getByRole("button", { name: "Start Study" }).click();

    const resumeButton = page.getByRole("button", { name: "Resume" }).last();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(resumeButton).toBeVisible();
    await resumeButton.click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    await page.getByRole("button", { name: "End" }).click();
    await expect(page.getByRole("link", { name: "New session" })).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("short-height mobile recovery keeps recovery CTA and audio actions visible", async ({ page }) => {
    await page.setViewportSize(SHORT_HEIGHT_MOBILE_VIEWPORT);
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "recovery", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    await gotoAndWait(page, "/study");
    await page.getByRole("button", { name: /I don't know/i }).click();

    const recoveryButton = page.getByRole("button", { name: "I'm done studying it" });
    const wordAudioButton = page.getByRole("button", { name: /Word/i });
    const sentenceAudioButton = page.getByRole("button", { name: /Sentence/i });

    await expect(recoveryButton).toBeVisible();
    await expect(wordAudioButton).toBeVisible();
    await expect(sentenceAudioButton).toBeVisible();

    const recoveryBox = await recoveryButton.boundingBox();
    expect(recoveryBox, "recovery CTA should have a box").not.toBeNull();
    expect((recoveryBox?.y ?? 0) + (recoveryBox?.height ?? 0)).toBeLessThanOrEqual(
      SHORT_HEIGHT_MOBILE_VIEWPORT.height
    );

    await guards.expectHealthy();
    guards.detach();
  });
});
