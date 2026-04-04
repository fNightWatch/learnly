import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getDashboardSnapshot(DEMO_USER_ID));
}
