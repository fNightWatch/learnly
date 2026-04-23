import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAvailableAssumedWordLists,
  getLanguageCatalog,
  getLearnerSettings,
  updateLearnerSettings
} from "@/lib/demo/store";
import type { AssumedWordListOption } from "@/lib/demo/types";
import { DEMO_USER_ID } from "@/lib/demo/user";
import {
  buildServerTimingHeader,
  hrElapsedMs,
  hrNow,
  ifNoneMatchHit,
  weakEtagFromJson
} from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  dailyGoal: z.number().int().min(1).max(25).optional(),
  selectedLanguageCodes: z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2", "zh-hsk3"])).min(1).max(7).optional(),
  dashboardLanguageCodes: z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2", "zh-hsk3"])).max(7).optional(),
  dashboardRangeDays: z.union([z.literal(7), z.literal(30)]).optional(),
  preferredStudyMode: z.enum(["everyday", "review-only", "new-only"]).optional(),
  chineseReviewFlow: z.enum(["two-click", "four-click"]).optional(),
  assumedWordListIds: z.array(z.string()).max(32).optional()
}).superRefine((value, ctx) => {
  if (!value.assumedWordListIds) {
    return;
  }

  const validListIds = new Set(
    (getAvailableAssumedWordLists() as AssumedWordListOption[]).map((list) => list.id)
  );
  value.assumedWordListIds.forEach((listId, index) => {
    if (!validListIds.has(listId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assumedWordListIds", index],
        message: "Unknown assumed word list."
      });
    }
  });
});

export async function GET(request: Request) {
  const requestStart = hrNow();
  const dataStart = hrNow();
  const settings = getLearnerSettings(DEMO_USER_ID);
  const payload = {
    ...settings,
    availableLanguages: getLanguageCatalog(),
    availableAssumedWordLists: getAvailableAssumedWordLists()
  };
  const dataMs = hrElapsedMs(dataStart);
  const { etag } = weakEtagFromJson(payload);

  if (ifNoneMatchHit(request, etag)) {
    const notModified = new NextResponse(null, { status: 304 });
    notModified.headers.set("etag", etag);
    notModified.headers.set("cache-control", "private, max-age=8, stale-while-revalidate=40");
    notModified.headers.set(
      "server-timing",
      buildServerTimingHeader([
        { name: "data", durationMs: dataMs },
        { name: "total", durationMs: hrElapsedMs(requestStart) }
      ])
    );
    return notModified;
  }

  const totalMs = hrElapsedMs(requestStart);
  const response = NextResponse.json(payload);
  response.headers.set("etag", etag);
  response.headers.set("cache-control", "private, max-age=8, stale-while-revalidate=40");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([
      { name: "data", durationMs: dataMs },
      { name: "total", durationMs: totalMs }
    ])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}

export async function PUT(request: Request) {
  const requestStart = hrNow();
  const json = await request.json();
  const payload = settingsSchema.parse(json);
  const dataStart = hrNow();
  const result = updateLearnerSettings(DEMO_USER_ID, payload);
  const dataMs = hrElapsedMs(dataStart);
  const response = NextResponse.json({
    settings: result.settings,
    dashboard: result.dashboard
  });
  const totalMs = hrElapsedMs(requestStart);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([
      { name: "data", durationMs: dataMs },
      { name: "total", durationMs: totalMs }
    ])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}
