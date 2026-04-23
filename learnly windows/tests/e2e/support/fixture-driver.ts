import { execFileSync } from "child_process";
import path from "path";
import type { Page } from "@playwright/test";

export type CoreLoopFixtureKind = "fresh" | "in-progress" | "recovery";

export type CoreLoopFixture = {
  kind: CoreLoopFixtureKind;
  generatedAt: string;
  routes: {
    home: "/";
    dashboard: "/dashboard";
    study: "/study";
  };
  settings: {
    dailyGoal: number;
    selectedLanguageCodes: string[];
    dashboardLanguageCodes: string[];
    preferredStudyMode: string;
    chineseReviewFlow: string;
    updatedAt: string;
  };
  dashboard: {
    activeLanguageCodes: string[];
    dueCount: number;
    newAvailableCount: number;
    activeWords: number;
    reviewsToday: number;
    introducedToday: number;
    retentionScore: number;
    preferredStudyMode: string;
  };
  storage: {
    local: Record<string, string>;
    session: Record<string, string>;
  };
  session: null | {
    sessionId: string;
    remainingCount: number;
    cardsReviewed: number;
    currentDirection: "es-to-en" | "en-to-es";
    autoDirectionCounter: number;
    firstCard: null | {
      itemId: string;
      languageCode: string;
      displayForm: string;
      primaryGloss: string;
      example: string;
      translation: string;
      exampleIndex?: number;
      pronunciation?: string;
      isNew: boolean;
    };
    currentCard: null | {
      itemId: string;
      languageCode: string;
      displayForm: string;
      primaryGloss: string;
      example: string;
      translation: string;
      exampleIndex?: number;
      pronunciation?: string;
      isNew: boolean;
    };
    lastReviewRating?: 1 | 3;
    interactionHint?: "click-dont-know" | "reload-study";
  };
};

export const DESKTOP_VIEWPORT = { width: 1512, height: 982 };
export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const SHORT_HEIGHT_MOBILE_VIEWPORT = { width: 390, height: 680 };

const TSX_BIN = path.join(process.cwd(), "node_modules", ".bin", "tsx");
const FIXTURE_SCRIPT = path.join(process.cwd(), "scripts", "qa", "demo-user-fixture.ts");

export function loadCoreLoopFixture(
  kind: CoreLoopFixtureKind,
  options: Record<string, unknown> = {}
): CoreLoopFixture {
  const stdout = execFileSync(TSX_BIN, [FIXTURE_SCRIPT, kind, JSON.stringify(options)], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  return JSON.parse(stdout) as CoreLoopFixture;
}

export async function installFixtureStorage(page: Page, fixture: CoreLoopFixture) {
  await page.addInitScript(
    ({ localState, sessionState }) => {
      for (const [key, value] of Object.entries(localState)) {
        if (window.localStorage.getItem(key) === null) {
          window.localStorage.setItem(key, value);
        }
      }

      for (const [key, value] of Object.entries(sessionState)) {
        if (value && window.sessionStorage.getItem(key) === null) {
          window.sessionStorage.setItem(key, value);
        }
      }
    },
    {
      localState: fixture.storage.local,
      sessionState: fixture.storage.session,
    }
  );
}

export async function preparePageWithFixture(
  page: Page,
  kind: CoreLoopFixtureKind,
  options: Record<string, unknown> = {}
) {
  const fixture = loadCoreLoopFixture(kind, options);
  await installFixtureStorage(page, fixture);
  return fixture;
}

export async function gotoAndWait(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}
