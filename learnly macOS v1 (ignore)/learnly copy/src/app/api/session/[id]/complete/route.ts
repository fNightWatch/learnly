import { NextResponse } from "next/server";
import { z } from "zod";
import { completeSession } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import { buildServerTimingHeader, hrElapsedMs, hrNow } from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

const completeSessionSchema = z.object({
  elapsedMs: z.number().int().min(0),
});

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const requestStart = hrNow();
  const parseStart = hrNow();
  const json = await request.json();
  const payload = completeSessionSchema.parse(json);
  const parseMs = hrElapsedMs(parseStart);

  const completeStart = hrNow();
  const result = completeSession({
    userId: DEMO_USER_ID,
    sessionId: context.params.id,
    elapsedMs: payload.elapsedMs,
  });
  const completeMs = hrElapsedMs(completeStart);
  const totalMs = hrElapsedMs(requestStart);

  const response = NextResponse.json(result);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([
      { name: "parse", durationMs: parseMs },
      { name: "complete", durationMs: completeMs },
      { name: "total", durationMs: totalMs }
    ])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}
