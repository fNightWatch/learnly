import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

const startSessionSchema = z.object({
  languageCodes: z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2"])).min(1).max(5).optional(),
  mode: z.enum(["everyday", "review-only", "new-only"]).optional()
});

export async function POST(request: Request) {
  const rawBody = await request.text();
  const parsed = rawBody ? startSessionSchema.parse(JSON.parse(rawBody)) : {};
  const payload = startSession(DEMO_USER_ID, parsed);
  return NextResponse.json(payload);
}
