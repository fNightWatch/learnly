import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString()
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0"
      }
    }
  );
}
