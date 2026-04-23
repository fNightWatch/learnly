import { NextResponse } from "next/server";
import { getNextCard } from "@/lib/demo/store";
import { buildServerTimingHeader, hrElapsedMs, hrNow } from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const requestStart = hrNow();
  const card = getNextCard(params.id);
  const totalMs = hrElapsedMs(requestStart);
  const response = NextResponse.json({ nextCard: card });
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([{ name: "total", durationMs: totalMs }])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}
