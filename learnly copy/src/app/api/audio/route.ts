import { NextRequest, NextResponse } from "next/server";
import { getGeneratedAudio } from "@/lib/demo/audio";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");
  const mode = request.nextUrl.searchParams.get("mode");
  const eiParam = request.nextUrl.searchParams.get("ei");
  const exampleIndex = eiParam !== null ? parseInt(eiParam, 10) : undefined;

  if (!itemId || (mode !== "term" && mode !== "example")) {
    return NextResponse.json({ error: "Invalid audio request." }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await getGeneratedAudio(itemId, mode, exampleIndex);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not generate audio." }, { status: 500 });
  }
}
