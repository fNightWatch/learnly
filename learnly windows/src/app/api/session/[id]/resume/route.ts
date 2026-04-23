import { NextResponse } from "next/server";
import { resumeSession } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const payload = resumeSession(params.id);
  if (!payload) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(payload);
}
