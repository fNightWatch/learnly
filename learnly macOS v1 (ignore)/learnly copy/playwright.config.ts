import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const appPort = process.env.PLAYWRIGHT_BASE_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${appPort}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER
  ? process.env.PLAYWRIGHT_REUSE_SERVER === "1"
  : !isCI;

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/core-loop", open: "never" }],
  ],
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `PORT=${appPort} npm run dev`,
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chrome",
      testIgnore: /.*safari-sanity\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1512, height: 982 },
      },
    },
    {
      name: "webkit",
      testMatch: /.*safari-sanity\.spec\.ts/,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1512, height: 982 },
      },
    },
  ],
});
