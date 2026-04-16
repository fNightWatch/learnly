import { NextRequest, NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import type { SupportedLanguageCode } from "@/lib/demo/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const languagesParam = request.nextUrl.searchParams.get("languages");
  const languageCodes = languagesParam
    ? (languagesParam.split(",") as SupportedLanguageCode[])
    : undefined;
  return NextResponse.json(getDashboardSnapshot(DEMO_USER_ID, { languageCodes }));
}
