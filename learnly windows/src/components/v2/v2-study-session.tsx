"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SessionCardPayload } from "@/lib/demo/types";
import { buildAudioUrl } from "@/lib/demo/audio-source";

type SessionPayload = {
  sessionId: string;
  dueCount: number;
  newCount: number;
  remainingCount: number;
  firstCard: SessionCardPayload | null;
};

type ReviewResponse = {
  remainingCount: number;
  nextCard: SessionCardPayload | null;
};

type Direction = "es-to-en" | "en-to-es";
type BinaryRating = 1 | 3;
type AudioSpeed = "slow" | "normal" | "fast";

const AUDIO_SPEED_RATES: Record<AudioSpeed, number> = {
  slow: 0.75,
  normal: 1.0,
  fast: 1.25
};

const AUDIO_SPEED_CYCLE: AudioSpeed[] = ["slow", "normal", "fast"];

const directionOptions: Array<{ id: Direction; label: string }> = [
  { id: "es-to-en", label: "Spanish -> English" },
  { id: "en-to-es", label: "English -> Spanish" }
];

function getPreferredSpanishVoice(voices: SpeechSynthesisVoice[]) {
  const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("es"));

  return (
    spanishVoices.find((voice) => /google español|monica|paulina|jorge|helena|español/i.test(voice.name)) ??
    spanishVoices.find((voice) => voice.lang === "es-ES") ??
    spanishVoices[0] ??
    null
  );
}

export function V2StudySession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [card, setCard] = useState<SessionCardPayload | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [summary, setSummary] = useState<{ dueCount: number; newCount: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("es-to-en");
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<AudioSpeed>("normal");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedDirection = window.localStorage.getItem("lemma-direction-v2");
    if (savedDirection === "es-to-en" || savedDirection === "en-to-es") {
      setDirection(savedDirection);
    }

    const savedSpeed = window.localStorage.getItem("learnly-audio-speed");
    if (savedSpeed === "slow" || savedSpeed === "normal" || savedSpeed === "fast") {
      setAudioSpeed(savedSpeed);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("lemma-direction-v2", direction);
  }, [direction]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const syncVoice = () => {
      setVoice(getPreferredSpanishVoice(synth.getVoices()));
    };

    syncVoice();
    synth.addEventListener("voiceschanged", syncVoice);

    return () => synth.removeEventListener("voiceschanged", syncVoice);
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const response = await fetch("/api/session/start", { method: "POST" });
        if (!response.ok) {
          throw new Error("Could not start session.");
        }

        const data: SessionPayload = await response.json();
        setSessionId(data.sessionId);
        setCard(data.firstCard);
        setRemainingCount(data.remainingCount);
        setSummary({ dueCount: data.dueCount, newCount: data.newCount });
        setStartTime(Date.now());
      } catch (bootError) {
        setError(bootError instanceof Error ? bootError.message : "Could not start session.");
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => stopAudio, []);

  const playFallbackSpeech = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang ?? "es-ES";
    utterance.rate = 0.9;
    if (voice) {
      utterance.voice = voice;
    }

    synth.cancel();
    synth.speak(utterance);
  };

  const cycleAudioSpeed = () => {
    const currentIndex = AUDIO_SPEED_CYCLE.indexOf(audioSpeed);
    const nextSpeed = AUDIO_SPEED_CYCLE[(currentIndex + 1) % AUDIO_SPEED_CYCLE.length];
    setAudioSpeed(nextSpeed);
    window.localStorage.setItem("learnly-audio-speed", nextSpeed);
  };

  const playAudio = async () => {
    if (!card || typeof window === "undefined") {
      return;
    }

    stopAudio();

    const mode = revealed ? "example" : "term";
    const source = buildAudioUrl(card.itemId, mode, mode === "example" ? card.exampleIndex : undefined);
    const audio = new Audio(source);
    audio.playbackRate = AUDIO_SPEED_RATES[audioSpeed];
    audioRef.current = audio;

    try {
      await audio.play();
    } catch (audioError) {
      playFallbackSpeech(revealed ? card.example : card.displayForm);
    }
  };

  const submitReview = async (rating: BinaryRating) => {
    if (!card || !sessionId) {
      return;
    }

    setError(null);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId,
        itemId: card.itemId,
        rating,
        elapsedMs: Date.now() - startTime
      })
    });

    if (!response.ok) {
      setError("Could not save that review.");
      return;
    }

    const data: ReviewResponse = await response.json();
    setCard(data.nextCard);
    setRemainingCount(data.remainingCount);
    setRevealed(false);
    setStartTime(Date.now());
  };

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (!card || loading) {
        return;
      }

      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        setRevealed(true);
        return;
      }

      if (event.code === "ArrowDown") {
        event.preventDefault();
        void playAudio();
        return;
      }

      if (!revealed) {
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        void submitReview(3);
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        void submitReview(1);
      }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [card, loading, revealed, voice]);

  const complete = !loading && !card;
  const prompt = direction === "es-to-en" ? card?.displayForm : card?.primaryGloss;
  const answer = direction === "es-to-en" ? card?.primaryGloss : card?.displayForm;
  const supportingLine = direction === "es-to-en" ? card?.displayForm : card?.primaryGloss;
  const promptLabel = direction === "es-to-en" ? "Spanish prompt" : "English prompt";

  return (
    <div className="mx-auto max-w-[980px] space-y-5">
      <section className="v2-card rounded-[28px] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="v2-eyebrow">Study mode</div>
            <div className="mt-3 text-sm leading-7 v2-muted">
              {summary ? `${summary.dueCount} due / ${summary.newCount} new` : "Preparing your queue"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="v2-segmented">
              {directionOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-active={direction === option.id}
                  onClick={() => setDirection(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button type="button" onClick={() => void playAudio()} className="v2-icon-button" aria-label="Play audio">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                <path d="M5 14h3l5 4V6l-5 4H5Z" />
                <path d="M16.5 9.5a4.5 4.5 0 0 1 0 5" />
                <path d="M18.8 7.2a7.8 7.8 0 0 1 0 9.6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={cycleAudioSpeed}
              className="v2-icon-button text-xs font-semibold"
              aria-label={`Audio speed: ${audioSpeed}`}
              title={`Audio speed: ${audioSpeed} (${AUDIO_SPEED_RATES[audioSpeed]}x)`}
            >
              {audioSpeed === "slow" ? "0.75×" : audioSpeed === "normal" ? "1×" : "1.25×"}
            </button>

            <div className="rounded-full border border-[var(--v2-line)] bg-[rgba(255,255,255,0.54)] px-4 py-2 text-sm v2-muted">
              {remainingCount} left
            </div>
          </div>
        </div>
      </section>

      {loading ? <div className="px-2 text-sm v2-muted">Building your study queue...</div> : null}

      {error ? (
        <div className="rounded-[24px] border border-[rgba(235,145,81,0.24)] bg-[rgba(255,183,94,0.12)] px-5 py-4 text-sm text-[var(--v2-text-soft)]">
          {error}
        </div>
      ) : null}

      {complete ? (
        <section className="v2-card rounded-[32px] px-6 py-10 text-center sm:px-8">
          <div className="v2-eyebrow">Session complete</div>
          <h1 className="mt-5 text-5xl leading-[0.92] sm:text-6xl">Today is clear.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 v2-muted">
            The queue is done. Open the dashboard to see the updated review curve and the words now moving forward.
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/v2/dashboard" className="v2-button-primary">
              Back to Dashboard
            </Link>
          </div>
        </section>
      ) : null}

      {!loading && card ? (
        <>
          <article className="v2-command rounded-[36px] px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="v2-label text-[rgba(248,239,228,0.42)]">{promptLabel}</div>
                <div className="mt-7 text-[clamp(3rem,10vw,5.9rem)] leading-none tracking-[-0.08em]">{prompt}</div>
                <div className="mt-5 flex flex-wrap gap-3 text-sm v2-on-dark-faint">
                  <span>{card.pos}</span>
                  <span>Rank {card.rank}</span>
                </div>
              </div>

              <div className="min-w-[120px] text-left sm:text-right">
                <div className="v2-label text-[rgba(248,239,228,0.42)]">Queue</div>
                <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em]">{remainingCount}</div>
                <div className="mt-2 text-sm v2-on-dark-faint">after this card</div>
              </div>
            </div>
          </article>

          <article className="v2-card rounded-[32px] px-6 py-6 sm:px-7 sm:py-7">
            {!revealed ? (
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <div className="v2-label">Reveal</div>
                  <p className="mt-3 text-base leading-8 v2-muted">
                    Listen if you need it, then reveal the answer and decide with one clean binary judgment.
                  </p>
                </div>

                <div className="space-y-3">
                  <button type="button" onClick={() => setRevealed(true)} className="v2-button-primary">
                    Reveal Answer
                  </button>
                  <div className="text-center text-[11px] uppercase tracking-[0.18em] v2-muted-soft">
                    Space reveal / down audio
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
                  <div>
                    <div className="v2-label">Answer</div>
                    <div className="mt-4 text-4xl tracking-[-0.06em] sm:text-5xl">{answer}</div>
                    <div className="mt-3 text-base v2-muted">{supportingLine}</div>
                  </div>

                  <div className="rounded-[24px] v2-inset p-5">
                    <div className="v2-label">Sentence</div>
                    <div className="mt-4 text-2xl leading-[1.32] tracking-[-0.04em] text-[var(--v2-text)]">
                      {card.example}
                    </div>
                    <div className="mt-3 text-base leading-7 v2-muted">{card.translation}</div>
                    {card.notes ? <div className="mt-4 text-sm leading-7 v2-muted">{card.notes}</div> : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void submitReview(3)}
                    className="rounded-[24px] border border-[rgba(255,255,255,0.28)] bg-[linear-gradient(135deg,var(--v2-amber),var(--v2-amber-strong))] px-5 py-5 text-left text-[var(--v2-text)] shadow-[0_18px_36px_rgba(238,143,66,0.18)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5"
                  >
                    <div className="v2-label text-[rgba(38,24,17,0.56)]">Left arrow</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Know</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void submitReview(1)}
                    className="rounded-[24px] border border-[var(--v2-line-strong)] bg-[rgba(255,255,255,0.7)] px-5 py-5 text-left text-[var(--v2-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5"
                  >
                    <div className="v2-label">Right arrow</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Don&apos;t know</div>
                  </button>
                </div>

                <div className="text-center text-[11px] uppercase tracking-[0.18em] v2-muted-soft">
                  Left know / right don&apos;t know / down audio
                </div>
              </div>
            )}
          </article>
        </>
      ) : null}
    </div>
  );
}
