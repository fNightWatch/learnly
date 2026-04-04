import { NextResponse } from "next/server";
import { getNextCard } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const card = getNextCard(params.id);
  return NextResponse.json({ nextCard: card });
}
