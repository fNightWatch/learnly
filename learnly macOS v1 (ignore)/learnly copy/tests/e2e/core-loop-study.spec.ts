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

  test("study answer state opens the Chinese sentence preview from interactive tokens", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
      chineseReviewFlow: "two-click",
      direction: "es-to-en",
    });

    await gotoAndWait(page, "/study?new");
    await page.getByRole("button", { name: "Start Study" }).click();
    await page.getByRole("button", { name: /I think I know/i }).click();

    const previewToken = page.locator('button[aria-haspopup="dialog"]').first();
    await expect(previewToken).toBeVisible();
    await previewToken.hover();
    await expect(page.getByText(/HSK [123]/).first()).toBeVisible();

    await guards.expectHealthy();
    guards.detach();
  });

  test("word detail preview can learn a Chinese sentence token and then suppress the CTA", async ({ page }) => {
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
    });

    await gotoAndWait(page, "/words/new-hsk-1-0001");
    await page.getByRole("button", { name: "妈妈" }).click();
    await expect(page.getByRole("button", { name: "Learn" })).toBeVisible();
    await page.getByRole("button", { name: "Learn" }).click();
    await expect(page.getByRole("button", { name: "Learn" })).toHaveCount(0);
    await expect(page.getByText("Learning")).toBeVisible();

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

  test("mobile word detail opens the Chinese sentence preview in a compact bottom sheet", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const guards = attachBrowserGuards(page);
    await preparePageWithFixture(page, "fresh", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
    });

    await gotoAndWait(page, "/words/new-hsk-1-0001");
    await page.getByRole("button", { name: "妈妈" }).click();
    const learnButton = page.getByRole("button", { name: "Learn" });
    await expect(learnButton).toBeVisible();

    const learnBox = await learnButton.boundingBox();
    expect(learnBox, "mobile preview CTA should have a box").not.toBeNull();
    expect(learnBox?.y ?? 0).toBeGreaterThan(MOBILE_VIEWPORT.height / 2);

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
