import { NextResponse } from "next/server";
import { z } from "zod";
import { submitReview } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  sessionId: z.string().min(1),
  itemId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(3)]),
  elapsedMs: z.number().int().min(0)
});

export async function POST(request: Request) {
  const json = await request.json();
  const payload = reviewSchema.parse(json);
  const result = submitReview({
    userId: DEMO_USER_ID,
    ...payload
  });

  return NextResponse.json(result);
}
