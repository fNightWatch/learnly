import { expect, test } from "@playwright/test";
import { loadCoreLoopFixture } from "./support/fixture-driver";

test.describe("core loop api", () => {
  test("dashboard/settings/plan/progress endpoints stay coherent", async ({ request }) => {
    loadCoreLoopFixture("fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    const settingsBefore = await request.get("/api/settings");
    expect(settingsBefore.ok()).toBeTruthy();

    const update = await request.put("/api/settings", {
      data: {
        dashboardLanguageCodes: ["es", "fr"],
        chineseReviewFlow: "two-click",
      },
    });
    expect(update.ok()).toBeTruthy();

    await expect
      .poll(async () => {
        const response = await request.get("/api/settings");
        const json = (await response.json()) as {
          dashboardLanguageCodes: string[];
          chineseReviewFlow: string;
        };
        return `${json.dashboardLanguageCodes.sort().join(",")}::${json.chineseReviewFlow}`;
      })
      .toBe("es,fr::two-click");

    const dashboard = await request.get("/api/dashboard");
    expect(dashboard.ok()).toBeTruthy();
    const dashboardJson = (await dashboard.json()) as { activeLanguageCodes: string[] };
    expect(dashboardJson.activeLanguageCodes.sort()).toEqual(["es", "fr"]);

    const progress = await request.get("/api/progress");
    expect(progress.ok()).toBeTruthy();

    const plan = await request.get("/api/plan?dailyGoal=12&mode=everyday");
    expect(plan.ok()).toBeTruthy();
  });

  test("session start, review submit, resume, and next-card flow work for the standard study path", async ({ request }) => {
    loadCoreLoopFixture("fresh", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });

    const start = await request.post("/api/session/start", {
      data: {
        languageCodes: ["es"],
        mode: "everyday",
      },
    });
    expect(start.ok()).toBeTruthy();
    const started = (await start.json()) as {
      sessionId: string;
      remainingCount: number;
      firstCard: { itemId: string };
    };

    const resume = await request.get(`/api/session/${started.sessionId}/resume`);
    expect(resume.ok()).toBeTruthy();
    const resumed = (await resume.json()) as {
      remainingCount: number;
      firstCard: { itemId: string };
    };
    expect(resumed.firstCard.itemId).toBe(started.firstCard.itemId);

    const review = await request.post("/api/reviews", {
      data: {
        sessionId: started.sessionId,
        itemId: started.firstCard.itemId,
        rating: 3,
        elapsedMs: 900,
      },
    });
    expect(review.ok()).toBeTruthy();
    const reviewed = (await review.json()) as {
      remainingCount: number;
      nextCard: { itemId: string } | null;
    };
    expect(reviewed.remainingCount).toBeLessThan(started.remainingCount);
    expect(reviewed.nextCard).not.toBeNull();

    const next = await request.get(`/api/session/${started.sessionId}/next`);
    expect(next.ok()).toBeTruthy();
    const nextJson = (await next.json()) as { nextCard: { itemId: string } | null };
    expect(nextJson.nextCard?.itemId).toBe(reviewed.nextCard?.itemId);
  });

  test("Chinese sessions include preview tokens and learn route is idempotent while injecting into the active queue", async ({ request }) => {
    loadCoreLoopFixture("fresh", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
      chineseReviewFlow: "two-click",
    });

    const start = await request.post("/api/session/start", {
      data: {
        languageCodes: ["zh-hsk1"],
        mode: "everyday",
      },
    });
    expect(start.ok()).toBeTruthy();
    const started = (await start.json()) as {
      sessionId: string;
      firstCard: {
        itemId: string;
        exampleTokens?: Array<{ matched: boolean; text: string }>;
      } | null;
    };

    expect(started.firstCard).not.toBeNull();
    expect(started.firstCard?.exampleTokens).toBeTruthy();
    expect(started.firstCard?.exampleTokens?.some((token) => token.matched)).toBeTruthy();

    const learnTargetId = "new-hsk-1-0100";
    const firstLearn = await request.post(`/api/item/${learnTargetId}/learn`, {
      data: {
        sessionId: started.sessionId,
      },
    });
    expect(firstLearn.ok()).toBeTruthy();
    const firstLearnJson = (await firstLearn.json()) as {
      itemId: string;
      introduced: boolean;
      sessionInjected: boolean;
      status: string;
    };
    expect(firstLearnJson).toEqual({
      itemId: learnTargetId,
      introduced: true,
      sessionInjected: true,
      status: "new",
    });

    const secondLearn = await request.post(`/api/item/${learnTargetId}/learn`, {
      data: {
        sessionId: started.sessionId,
      },
    });
    expect(secondLearn.ok()).toBeTruthy();
    const secondLearnJson = (await secondLearn.json()) as {
      introduced: boolean;
      sessionInjected: boolean;
      status: string;
    };
    expect(secondLearnJson.introduced).toBe(false);
    expect(secondLearnJson.sessionInjected).toBe(false);
    expect(secondLearnJson.status).toBe("new");

    const review = await request.post("/api/reviews", {
      data: {
        sessionId: started.sessionId,
        itemId: started.firstCard!.itemId,
        rating: 3,
        elapsedMs: 900,
      },
    });
    expect(review.ok()).toBeTruthy();
    const reviewed = (await review.json()) as {
      nextCard: { itemId: string } | null;
    };
    expect(reviewed.nextCard?.itemId).toBe(learnTargetId);

    const nonChineseStart = await request.post("/api/session/start", {
      data: {
        languageCodes: ["es"],
        mode: "everyday",
      },
    });
    expect(nonChineseStart.ok()).toBeTruthy();
    const nonChineseJson = (await nonChineseStart.json()) as {
      firstCard: {
        exampleTokens?: unknown;
      } | null;
    };
    expect(nonChineseJson.firstCard?.exampleTokens).toBeUndefined();
  });

  test("audio endpoints return playable payloads for standard and Chinese cards", async ({ request }) => {
    const standardFixture = loadCoreLoopFixture("recovery", {
      selectedLanguages: ["es"],
      dashboardLanguages: ["es"],
    });
    const standardCard = standardFixture.session?.currentCard;
    expect(standardCard).not.toBeNull();

    const standardAudio = await request.get(
      `/api/audio?itemId=${encodeURIComponent(standardCard!.itemId)}&mode=term`
    );
    expect(standardAudio.ok()).toBeTruthy();
    expect(standardAudio.headers()["content-type"]).toContain("audio");
    expect((await standardAudio.body()).byteLength).toBeGreaterThan(256);

    const chineseFixture = loadCoreLoopFixture("recovery", {
      selectedLanguages: ["zh-hsk1"],
      dashboardLanguages: ["zh-hsk1"],
      chineseReviewFlow: "four-click",
    });
    const chineseCard = chineseFixture.session?.currentCard;
    expect(chineseCard).not.toBeNull();

    const chineseTermAudio = await request.get(
      `/api/audio?itemId=${encodeURIComponent(chineseCard!.itemId)}&mode=term`
    );
    expect(chineseTermAudio.ok()).toBeTruthy();
    expect(chineseTermAudio.headers()["content-type"]).toContain("audio");
    expect((await chineseTermAudio.body()).byteLength).toBeGreaterThan(256);

    const chineseSentenceAudio = await request.get(
      `/api/audio?itemId=${encodeURIComponent(chineseCard!.itemId)}&mode=example&ei=${chineseCard!.exampleIndex ?? 0}`
    );
    expect(chineseSentenceAudio.ok()).toBeTruthy();
    expect(chineseSentenceAudio.headers()["content-type"]).toContain("audio");
    expect((await chineseSentenceAudio.body()).byteLength).toBeGreaterThan(256);
  });
});
