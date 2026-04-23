import { NextResponse } from "next/server";
import { z } from "zod";
import { submitReview } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import { buildServerTimingHeader, hrElapsedMs, hrNow } from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  sessionId: z.string().min(1),
  itemId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(3)]),
  elapsedMs: z.number().int().min(0),
  sessionElapsedMs: z.number().int().min(0).optional(),
  includeStudyPlan: z.boolean().optional()
});

export async function POST(request: Request) {
  const requestStart = hrNow();
  const parseStart = hrNow();
  const json = await request.json();
  const payload = reviewSchema.parse(json);
  const parseMs = hrElapsedMs(parseStart);
  const idempotencyHeader = request.headers.get("x-idempotency-key");
  const idempotencyKey = idempotencyHeader && idempotencyHeader.length <= 160
    ? idempotencyHeader
    : undefined;

  const submitStart = hrNow();
  const result = submitReview({
    userId: DEMO_USER_ID,
    ...payload,
    idempotencyKey
  });
  const submitMs = hrElapsedMs(submitStart);
  const totalMs = hrElapsedMs(requestStart);

  const response = NextResponse.json(result);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([
      { name: "parse", durationMs: parseMs },
      { name: "submit", durationMs: submitMs },
      { name: "total", durationMs: totalMs }
    ])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}
