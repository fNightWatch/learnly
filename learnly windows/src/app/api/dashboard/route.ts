import { NextRequest, NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import type { SupportedLanguageCode } from "@/lib/demo/types";
import {
  buildServerTimingHeader,
  hrElapsedMs,
  hrNow,
  ifNoneMatchHit,
  weakEtagFromJson
} from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestStart = hrNow();
  const languagesParam = request.nextUrl.searchParams.get("languages");
  const viewParam = request.nextUrl.searchParams.get("view");
  const dataStart = hrNow();
  const languageCodes = languagesParam
    ? (languagesParam.split(",") as SupportedLanguageCode[])
    : undefined;
  const snapshot = getDashboardSnapshot(DEMO_USER_ID, { languageCodes });
  const dataMs = hrElapsedMs(dataStart);

  const payload =
    viewParam === "summary"
      ? {
          ...snapshot,
          reviewsDueSeries: undefined,
          vocabularyGrowthSeries: undefined,
          consistencySeries: undefined
        }
      : snapshot;

  const { etag } = weakEtagFromJson(payload);
  if (ifNoneMatchHit(request, etag)) {
    const notModified = new NextResponse(null, { status: 304 });
    notModified.headers.set("etag", etag);
    notModified.headers.set("cache-control", "private, max-age=4, stale-while-revalidate=20");
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
  response.headers.set("cache-control", "private, max-age=4, stale-while-revalidate=20");
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
