"use client";

import { useRef } from "react";
import { buildAudioUrl } from "@/lib/demo/audio-source";
import type { SupportedLanguageCode } from "@/lib/demo/types";

function getSpeechSynthesisLang(languageCode: SupportedLanguageCode) {
  switch (languageCode) {
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "de":
      return "de-DE";
    case "zh":
    case "zh-hsk1":
    case "zh-hsk2":
      return "zh-CN";
    default:
      return "en-US";
  }
}

export function WordAudioButton({
  itemId,
  mode,
  label,
  fallbackText,
  languageCode
}: {
  itemId: string;
  mode: "term" | "example";
  label: string;
  fallbackText?: string;
  languageCode?: SupportedLanguageCode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (audioRef.current) {
      const objectUrl = audioRef.current.dataset.objectUrl;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }

    try {
      const response = await fetch(buildAudioUrl(itemId, mode), { cache: "force-cache" });
      if (!response.ok) {
        throw new Error("Audio unavailable");
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("audio/")) {
        throw new Error("Invalid audio response");
      }

      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      audio.dataset.objectUrl = objectUrl;
      audio.addEventListener("ended", () => URL.revokeObjectURL(objectUrl), { once: true });
      audio.addEventListener("error", () => URL.revokeObjectURL(objectUrl), { once: true });
      audioRef.current = audio;
      await audio.play();
    } catch {
      if (!fallbackText || !languageCode || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.lang = getSpeechSynthesisLang(languageCode);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
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
