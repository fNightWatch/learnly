"use client";

import { useRef } from "react";

export function V2AudioButton({
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

    const audio = new Audio(`/audio/es/${itemId}-${mode}.m4a`);
    audioRef.current = audio;
    try {
      await audio.play();
    } catch (error) {
      // Keep the control quiet if playback is blocked.
    }
  };

  return (
    <button type="button" onClick={() => void handlePlay()} className="v2-button-secondary">
      {label}
    </button>
  );
}
