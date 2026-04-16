import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import {
  DESKTOP_VIEWPORT,
  MOBILE_VIEWPORT,
  SHORT_HEIGHT_MOBILE_VIEWPORT,
  gotoAndWait,
  installFixtureStorage,
  loadCoreLoopFixture,
  type CoreLoopFixture,
} from "../../tests/e2e/support/fixture-driver";

const BASE_URL = "http://127.0.0.1:3000";

type CaptureRecord = {
  name: string;
  path: string;
  route: string;
  fixture: string;
  viewport: { width: number; height: number };
  theme: "light" | "dark";
};

function makeTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true, channel: "chrome" });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function newContext(
  fixture: CoreLoopFixture,
  viewport: { width: number; height: number },
  theme: "light" | "dark"
) {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
  });
  const page = await context.newPage();
  await installFixtureStorage(page, fixture);
  return { browser, context, page };
}

async function canReachApp() {
  try {
    const response = await fetch(`${BASE_URL}/api/settings`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < 120_000) {
    if (await canReachApp()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for the dev server on port 3000.");
}

async function ensureDevServer() {
  if (await canReachApp()) {
    return null;
  }

  const child = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "3000" },
    stdio: "ignore",
  });

  await waitForServer();
  return child;
}

async function saveScreenshot(params: {
  artifactDir: string;
  name: string;
  route: string;
  fixtureKind: "fresh" | "in-progress" | "recovery";
  fixtureOptions?: Record<string, unknown>;
  viewport: { width: number; height: number };
  theme: "light" | "dark";
  beforeShot?: (page: Page, fixture: CoreLoopFixture) => Promise<void>;
}) {
  const fixture = loadCoreLoopFixture(params.fixtureKind, {
    ...(params.fixtureOptions ?? {}),
    theme: params.theme,
  });
  const { browser, page } = await newContext(fixture, params.viewport, params.theme);

  try {
    await gotoAndWait(page, `${BASE_URL}${params.route}`);
    if (params.beforeShot) {
      await params.beforeShot(page, fixture);
      await page.waitForTimeout(250);
    }

    const relativePath = `screenshots/${params.name}.png`;
    const absolutePath = path.join(params.artifactDir, relativePath);
    await page.screenshot({
      path: absolutePath,
      fullPage: true,
    });

    return {
      name: params.name,
      path: relativePath,
      route: params.route,
      fixture: params.fixtureKind,
      viewport: params.viewport,
      theme: params.theme,
    } satisfies CaptureRecord;
  } finally {
    await browser.close();
  }
}

function buildReportTemplate(records: CaptureRecord[]) {
  const screenshotList = records
    .map((record) => `- \`${record.name}\` — [${record.path}](${record.path})`)
    .join("\n");

  return `# Core Loop QA Report

## Screenshot Set
${screenshotList}

## Functional Regressions
- None logged yet.

## UX Blockers
- None logged yet.

## Visual Inconsistencies
- None logged yet.

## Regression Summary
- Passed:
- Failed:
- Flaky / needs human judgment:

## Core-loop Scorecard
- Home clarity:
- Dashboard actionability:
- Study focus:
- Mobile viability:
- Dark-mode parity:
`;
}

async function main() {
  const artifactDir = path.join(process.cwd(), "artifacts", "core-loop-qa", makeTimestamp());
  const screenshotDir = path.join(artifactDir, "screenshots");

  mkdirSync(screenshotDir, { recursive: true });
  const devServer = await ensureDevServer();

  try {
    const captures: CaptureRecord[] = [];

    captures.push(
      await saveScreenshot({
        artifactDir,
        name: "01-home-desktop-light",
        route: "/",
        fixtureKind: "fresh",
        fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
        viewport: DESKTOP_VIEWPORT,
        theme: "light",
      })
    );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "02-home-desktop-dark",
      route: "/",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "dark",
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "03-dashboard-desktop-light",
      route: "/dashboard",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "04-dashboard-desktop-dark",
      route: "/dashboard",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "dark",
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "05-dashboard-mobile-light",
      route: "/dashboard",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: MOBILE_VIEWPORT,
      theme: "light",
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "06-study-setup-desktop-light",
      route: "/study?new",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "07-study-setup-mobile-light",
      route: "/study?new",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: MOBILE_VIEWPORT,
      theme: "light",
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "08-study-prompt-desktop-light",
      route: "/study?new",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByRole("button", { name: "Start Study" }).click();
        await page.getByText("Do you think you know it?").waitFor();
      },
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "09-study-reveal-desktop-light",
      route: "/study?new",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByRole("button", { name: "Start Study" }).click();
        await page.getByRole("button", { name: /I think I know/i }).click();
        await page.getByText("Did you know it?").waitFor();
      },
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "10-study-recovery-short-mobile-light",
      route: "/study",
      fixtureKind: "recovery",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: SHORT_HEIGHT_MOBILE_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByRole("button", { name: /I don't know/i }).click();
        await page.getByText("You forgot this word.").waitFor();
      },
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "11-study-chinese-pronunciation-guess",
      route: "/study",
      fixtureKind: "recovery",
      fixtureOptions: {
        selectedLanguages: ["zh-hsk1"],
        dashboardLanguages: ["zh-hsk1"],
        chineseReviewFlow: "four-click",
      },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByText("Do you think you know the pronunciation?").waitFor();
      },
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "12-study-chinese-pronunciation-confirm",
      route: "/study",
      fixtureKind: "recovery",
      fixtureOptions: {
        selectedLanguages: ["zh-hsk1"],
        dashboardLanguages: ["zh-hsk1"],
        chineseReviewFlow: "four-click",
      },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByRole("button", { name: /I think I know/i }).click();
        await page.getByText("Did you know the pronunciation?").waitFor();
      },
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "13-study-paused-desktop-light",
      route: "/study?new",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByRole("button", { name: "Start Study" }).click();
        await page.getByText("Do you think you know it?").waitFor();
        await page.getByRole("button", { name: "Pause" }).click();
        await page.getByRole("button", { name: "Resume" }).last().waitFor();
      },
    })
  );

  captures.push(
    await saveScreenshot({
      artifactDir,
      name: "14-study-complete-desktop-light",
      route: "/study?new",
      fixtureKind: "fresh",
      fixtureOptions: { selectedLanguages: ["es"], dashboardLanguages: ["es"] },
      viewport: DESKTOP_VIEWPORT,
      theme: "light",
      beforeShot: async (page) => {
        await page.getByRole("button", { name: "Start Study" }).click();
        await page.getByText("Do you think you know it?").waitFor();
        await page.getByRole("button", { name: "End" }).click();
        await page.getByRole("link", { name: "New session" }).waitFor();
      },
    })
  );

    writeFileSync(path.join(artifactDir, "manifest.json"), JSON.stringify(captures, null, 2));
    writeFileSync(path.join(artifactDir, "report.md"), buildReportTemplate(captures));

    process.stdout.write(`${artifactDir}\n`);
  } finally {
    if (devServer) {
      devServer.kill("SIGTERM");
    }
  }
}

void main();
