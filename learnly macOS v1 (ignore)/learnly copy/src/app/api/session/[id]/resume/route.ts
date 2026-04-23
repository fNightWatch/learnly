import { NextResponse } from "next/server";
import { resumeSession } from "@/lib/demo/store";
import { buildServerTimingHeader, hrElapsedMs, hrNow } from "@/lib/server/http-perf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const requestStart = hrNow();
  const payload = resumeSession(params.id);
  if (!payload) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const totalMs = hrElapsedMs(requestStart);
  const response = NextResponse.json(payload);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.headers.set(
    "server-timing",
    buildServerTimingHeader([{ name: "total", durationMs: totalMs }])
  );
  response.headers.set("x-response-time-ms", totalMs.toFixed(2));
  return response;
}
