import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import { buildServerTimingHeader, hrElapsedMs, hrNow } from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

const startSessionSchema = z.object({
  languageCodes: z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2", "zh-hsk3"])).min(1).max(7).optional(),
  mode: z.enum(["everyday", "review-only", "new-only"]).optional()
});

export async function POST(request: Request) {
  const requestStart = hrNow();
  const rawBody = await request.text();
  const parseStart = hrNow();
  const parsed = rawBody ? startSessionSchema.parse(JSON.parse(rawBody)) : {};
  const parseMs = hrElapsedMs(parseStart);
  const dataStart = hrNow();
  const payload = startSession(DEMO_USER_ID, parsed);
  const dataMs = hrElapsedMs(dataStart);
  const totalMs = hrElapsedMs(requestStart);
  const response = NextResponse.json(payload);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([
      { name: "parse", durationMs: parseMs },
      { name: "data", durationMs: dataMs },
      { name: "total", durationMs: totalMs }
    ])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}
