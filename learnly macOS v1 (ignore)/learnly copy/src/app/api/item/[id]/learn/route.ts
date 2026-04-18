import { NextResponse } from "next/server";
import { z } from "zod";
import { learnPreviewItem } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

const learnItemSchema = z.object({
  sessionId: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawBody = await request.text();
    const payload = rawBody ? learnItemSchema.parse(JSON.parse(rawBody)) : {};
    const result = learnPreviewItem({
      userId: DEMO_USER_ID,
      itemId: params.id,
      sessionId: payload.sessionId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid learn request." }, { status: 400 });
    }

    if (error instanceof Error && error.message === "Item not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not learn item." },
      { status: 400 }
    );
  }
}
