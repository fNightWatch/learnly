import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearnerSettings, updateLearnerSettings } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  dailyGoal: z.number().int().min(1).max(25).optional(),
  selectedLanguageCodes: z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2"])).min(1).max(5).optional(),
  dashboardLanguageCodes: z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2"])).min(1).max(5).optional(),
  preferredStudyMode: z.enum(["everyday", "review-only", "new-only"]).optional()
});

export async function GET() {
  return NextResponse.json(getLearnerSettings(DEMO_USER_ID));
}

export async function PUT(request: Request) {
  const json = await request.json();
  const payload = settingsSchema.parse(json);
  const result = updateLearnerSettings(DEMO_USER_ID, payload);
  return NextResponse.json({
    settings: result.settings,
    dashboard: result.dashboard
  });
}
