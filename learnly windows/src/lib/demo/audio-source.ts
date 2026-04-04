export const AUDIO_ASSET_VERSION = "20260324-elevenlabs-v1";

export function buildAudioUrl(itemId: string, mode: "term" | "example", exampleIndex?: number) {
  const params = new URLSearchParams({
    itemId,
    mode,
    v: AUDIO_ASSET_VERSION
  });

  if (typeof exampleIndex === "number") {
    params.set("ei", String(exampleIndex));
  }

  return `/api/audio?${params.toString()}`;
}
