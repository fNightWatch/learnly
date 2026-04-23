"use client";

import { useRef } from "react";
import { buildAudioUrl } from "@/lib/demo/audio-source";

export function WordAudioButton({
  itemId,
  mode,
  label
}: {
  itemId: string;
  mode: "term" | "example";
  label: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(buildAudioUrl(itemId, mode));
    audioRef.current = audio;
    try {
      await audio.play();
    } catch (error) {
      // Keep the button quiet if the browser blocks autoplay.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handlePlay()}
      className="button-secondary"
    >
      {label}
    </button>
  );
}
