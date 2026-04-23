import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudyPlan } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

const dailyGoalSchema = z.number().int().min(1).max(25).optional();
const languageCodesSchema = z.array(z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2", "zh-hsk3"])).min(1).max(7).optional();
const studyModeSchema = z.enum(["everyday", "review-only", "new-only"]).optional();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dailyGoalParam = url.searchParams.get("dailyGoal");
  const languageCodes = url.searchParams
    .getAll("languageCode")
    .filter(
      (value) =>
        value === "es" ||
        value === "fr" ||
        value === "de" ||
        value === "zh" ||
        value === "zh-hsk1" ||
        value === "zh-hsk2" ||
        value === "zh-hsk3"
    );
  const mode = url.searchParams.get("mode");
  const parsedDailyGoal = dailyGoalParam ? Number(dailyGoalParam) : undefined;
  const dailyGoal = dailyGoalSchema.parse(
    Number.isNaN(parsedDailyGoal) ? undefined : parsedDailyGoal
  );
  const parsedLanguageCodes = languageCodesSchema.parse(languageCodes.length > 0 ? languageCodes : undefined);
  const parsedMode = studyModeSchema.parse(
    mode === "everyday" || mode === "review-only" || mode === "new-only" ? mode : undefined
  );

  return NextResponse.json(
    getStudyPlan(DEMO_USER_ID, {
      dailyGoal,
      languageCodes: parsedLanguageCodes,
      mode: parsedMode
    })
  );
}
