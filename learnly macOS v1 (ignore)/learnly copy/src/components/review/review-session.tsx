"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buildAudioUrl } from "@/lib/demo/audio-source";
import type {
  DemoLanguage,
  SessionCardPayload,
  StudyMode,
  SupportedLanguageCode
} from "@/lib/demo/types";

// --- Session persistence (survives page refresh) ---
const SESSION_STORAGE_KEY = "learnly-active-session";

type PersistedSession = {
  sessionId: string;
  timeMode: TimeMode;
  timerMinutes: number;
  /** Epoch ms when the studying phase started */
  studyingStartedAt: number;
  cardsReviewed: number;
};

function saveActiveSession(data: PersistedSession) {
  try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

function loadActiveSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch { return null; }
}

function clearActiveSession() {
  try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* noop */ }
}

type SessionPayload = {
  sessionId: string;
  dueCount: number;
  newCount: number;
  remainingCount: number;
  languageCodes: SupportedLanguageCode[];
  mode: StudyMode;
  insights: {
    reviewsToday: number;
    newWordsToday: number;
    streakDays: number;
    retentionScore: number;
    dueByLanguage: Record<string, number>;
  };
  firstCard: SessionCardPayload | null;
};

type ReviewResponse = {
  remainingCount: number;
  insights: {
    reviewsToday: number;
    newWordsToday: number;
    streakDays: number;
    retentionScore: number;
    dueByLanguage: Record<string, number>;
  };
  nextCard: SessionCardPayload | null;
};

type Direction = "es-to-en" | "en-to-es";
type BinaryRating = 1 | 3;
type AudioMode = "term" | "example";
type AudioSpeed = "0.5" | "0.75" | "1" | "1.25" | "1.5" | "2";
type ChineseStage = "pronunciation-guess" | "pronunciation-confirm" | "definition-guess" | "definition-confirm";
type GuessChoice = "dont-know" | "think-know";
type StudyPhase = "setup" | "studying" | "complete";
type TimeMode = "timer" | "stopwatch";

const AUDIO_SPEEDS: { key: AudioSpeed; rate: number; label: string }[] = [
  { key: "0.5", rate: 0.5, label: "0.5×" },
  { key: "0.75", rate: 0.75, label: "0.75×" },
  { key: "1", rate: 1.0, label: "1×" },
  { key: "1.25", rate: 1.25, label: "1.25×" },
  { key: "1.5", rate: 1.5, label: "1.5×" },
  { key: "2", rate: 2.0, label: "2×" }
];

const AUDIO_SPEED_RATES: Record<AudioSpeed, number> = Object.fromEntries(
  AUDIO_SPEEDS.map((s) => [s.key, s.rate])
) as Record<AudioSpeed, number>;

const studyModes: Array<{ id: StudyMode; label: string; description: string }> = [
  {
    id: "everyday",
    label: "Everyday",
    description: "Due cards first, then a few fresh introductions."
  },
  {
    id: "review-only",
    label: "Review only",
    description: "Clear the due queue without adding new words."
  },
  {
    id: "new-only",
    label: "New only",
    description: "Pull only fresh ranked words from the selected languages."
  }
];

const directionOptions: Array<{ id: Direction; label: string }> = [
  { id: "es-to-en", label: "Target → English" },
  { id: "en-to-es", label: "English → Target" }
];

function getPreferredVoice(voices: SpeechSynthesisVoice[], languageCode: SupportedLanguageCode) {
  const languagePrefixes: Record<SupportedLanguageCode, string[]> = {
    es: ["es"],
    fr: ["fr"],
    de: ["de"],
    zh: ["zh", "cmn"],
    "zh-hsk1": ["zh", "cmn"],
    "zh-hsk2": ["zh", "cmn"]
  };
  const preferredNames: Record<SupportedLanguageCode, RegExp> = {
    es: /monica|mónica|paulina|jorge|helena|google español/i,
    fr: /thomas|amelie|amélie|aurelie|aurélie/i,
    de: /anna|markus|petra/i,
    zh: /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|eddy|flo|reed|rocko|sandy|shelley|grandma|grandpa|zh/i,
    "zh-hsk1": /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|eddy|flo|reed|rocko|sandy|shelley|grandma|grandpa|zh/i,
    "zh-hsk2": /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|eddy|flo|reed|rocko|sandy|shelley|grandma|grandpa|zh/i
  };
  const matching = voices.filter((voice) =>
    languagePrefixes[languageCode].some((prefix) => voice.lang.toLowerCase().startsWith(prefix))
  );

  return matching.find((voice) => preferredNames[languageCode].test(voice.name)) ?? matching[0] ?? null;
}

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

function StudyRecoveryPanel({
  title,
  body,
  actionLabel,
  onAction
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-lg tracking-[-0.04em] text-ink/88">{title}</div>
        <div className="mt-2 text-lg leading-6 text-ink/56">{body}</div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="min-h-[84px] w-full rounded-[26px] border border-[rgb(var(--color-pine)/0.2)] bg-[rgb(var(--color-pine)/0.9)] px-6 py-6 text-center text-2xl font-semibold tracking-[-0.04em] text-white dark:text-black shadow-[0_18px_40px_rgba(108,128,117,0.2)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:bg-[rgb(var(--color-pine)/0.96)]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ReviewSession({ availableLanguages }: { availableLanguages: DemoLanguage[] }) {

  // --- Phase / time state ---
  const [phase, setPhase] = useState<StudyPhase>("setup");
  const [timeMode, setTimeMode] = useState<TimeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("learnly-study-time-mode");
      if (saved === "timer" || saved === "stopwatch") return saved;
    }
    return "timer";
  });
  const [timerMinutes, setTimerMinutes] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("learnly-study-timer-minutes");
      if (saved) {
        const n = Number(saved);
        if (n >= 1 && n <= 60) return n;
      }
    }
    return 15;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Session state ---
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [card, setCard] = useState<SessionCardPayload | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [chineseStage, setChineseStage] = useState<ChineseStage>("pronunciation-guess");
  const [chinesePronunciationKnown, setChinesePronunciationKnown] = useState<boolean | null>(null);
  const [standardGuessChoice, setStandardGuessChoice] = useState<GuessChoice | null>(null);
  const [pronunciationGuessChoice, setPronunciationGuessChoice] = useState<GuessChoice | null>(null);
  const [definitionGuessChoice, setDefinitionGuessChoice] = useState<GuessChoice | null>(null);
  const [remainingCount, setRemainingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [summary, setSummary] = useState<{ dueCount: number; newCount: number } | null>(null);
  const [insights, setInsights] = useState<SessionPayload["insights"] | null>(null);
  const [direction, setDirection] = useState<Direction>("es-to-en");
  const [languageCodes, setLanguageCodes] = useState<SupportedLanguageCode[]>(["es"]);
  const [studyMode, setStudyMode] = useState<StudyMode>("everyday");
  const [studyCardStep, setStudyCardStep] = useState<number | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioSpeed, setAudioSpeed] = useState<AudioSpeed>("1");
  const [cardsReviewedThisSession, setCardsReviewedThisSession] = useState(0);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Persist time preferences ---
  useEffect(() => {
    window.localStorage.setItem("learnly-study-time-mode", timeMode);
  }, [timeMode]);

  useEffect(() => {
    window.localStorage.setItem("learnly-study-timer-minutes", String(timerMinutes));
  }, [timerMinutes]);

  // --- Load saved direction and audio speed ---
  useEffect(() => {
    const savedDirection =
      window.localStorage.getItem("languagehack-direction") ?? window.localStorage.getItem("lemma-direction");
    if (savedDirection === "es-to-en" || savedDirection === "en-to-es") {
      setDirection(savedDirection);
    }

    const savedSpeed = window.localStorage.getItem("learnly-audio-speed");
    if (savedSpeed && AUDIO_SPEED_RATES[savedSpeed as AudioSpeed] !== undefined) {
      setAudioSpeed(savedSpeed as AudioSpeed);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("languagehack-direction", direction);
  }, [direction]);

  // --- Reset card state when direction changes mid-card ---
  useEffect(() => {
    setRevealed(false);
    setChineseStage("pronunciation-guess");
    setPronunciationGuessChoice(null);
    setDefinitionGuessChoice(null);
    setChinesePronunciationKnown(false);
    setStandardGuessChoice(null);
    setStudyCardStep(null);
  }, [direction]);

  // --- Voice synthesis setup ---
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const syncVoice = () => {
      setVoices(synth.getVoices());
    };

    syncVoice();
    synth.addEventListener("voiceschanged", syncVoice);

    return () => synth.removeEventListener("voiceschanged", syncVoice);
  }, []);

  // --- Audio helpers ---
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

  const resetCardFlow = () => {
    setRevealed(false);
    setChineseStage("pronunciation-guess");
    setChinesePronunciationKnown(null);
    setStandardGuessChoice(null);
    setPronunciationGuessChoice(null);
    setDefinitionGuessChoice(null);
    setStudyCardStep(null);
    setTranslationRevealed(false);
    setStartTime(Date.now());
  };

  // --- Audio prewarm ---
  useEffect(() => {
    if (!card || typeof window === "undefined") {
      return;
    }

    const sources = [
      buildAudioUrl(card.itemId, "term"),
      buildAudioUrl(card.itemId, "example", card.exampleIndex)
    ];

    sources.forEach((source) => {
      fetch(source, { cache: "force-cache" }).catch(() => {
        // Keep the study flow moving even if audio prewarm fails.
      });
    });
  }, [card?.itemId]);

  // --- Auto-play word audio on card change ---
  useEffect(() => {
    if (!card || typeof window === "undefined" || phase !== "studying") return;
    // Skip auto-play for Chinese cards in Target→English (pronunciation quiz)
    if (card.languageCode.startsWith("zh") && direction === "es-to-en") return;
    void playAudio("term");
  }, [card?.itemId]);

  // --- Session API ---
  const startConfiguredSession = async (
    nextLanguageCodes: SupportedLanguageCode[],
    nextStudyMode: StudyMode
  ) => {
    setLoading(true);
    setError(null);
    setCard(null);
    stopAudio();

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          languageCodes: nextLanguageCodes,
          mode: nextStudyMode
        })
      });
      if (!response.ok) {
        throw new Error("Could not start session.");
      }

      const data: SessionPayload = await response.json();
      setSessionId(data.sessionId);
      setCard(data.firstCard);
      setRemainingCount(data.remainingCount);
      setSummary({ dueCount: data.dueCount, newCount: data.newCount });
      setInsights(data.insights);
      resetCardFlow();

      // Persist so session survives page refresh
      saveActiveSession({
        sessionId: data.sessionId,
        timeMode,
        timerMinutes,
        studyingStartedAt: Date.now(),
        cardsReviewed: 0,
      });
    } catch (bootError) {
      setError(bootError instanceof Error ? bootError.message : "Could not start session.");
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch settings on mount, and resume active session if one exists ---
  useEffect(() => {
    const boot = async () => {
      try {
        // Check for an active session to resume
        const persisted = loadActiveSession();
        if (persisted) {
          const resumeResponse = await fetch(`/api/session/${persisted.sessionId}/resume`);
          if (resumeResponse.ok) {
            const data: SessionPayload = await resumeResponse.json();
            // Only resume if there are cards left
            if (data.firstCard && data.remainingCount > 0) {
              const elapsedSinceStart = Math.floor((Date.now() - persisted.studyingStartedAt) / 1000);
              setSessionId(data.sessionId);
              setCard(data.firstCard);
              setRemainingCount(data.remainingCount);
              setSummary({ dueCount: data.dueCount, newCount: data.newCount });
              setInsights(data.insights);
              setLanguageCodes(data.languageCodes);
              setStudyMode(data.mode);
              setTimeMode(persisted.timeMode);
              setTimerMinutes(persisted.timerMinutes);
              setElapsedSeconds(elapsedSinceStart);
              setCardsReviewedThisSession(persisted.cardsReviewed);
              setPhase("studying");
              resetCardFlow();
              setSettingsLoading(false);
              return;
            }
          }
          // Session expired or empty — clear it
          clearActiveSession();
        }

        // Normal boot: load settings for setup screen
        const settingsResponse = await fetch("/api/settings");
        if (!settingsResponse.ok) {
          throw new Error("Could not load study settings.");
        }

        const settings: {
          selectedLanguageCodes: SupportedLanguageCode[];
          preferredStudyMode: StudyMode;
        } = await settingsResponse.json();

        setLanguageCodes(settings.selectedLanguageCodes);
        setStudyMode(settings.preferredStudyMode);
      } catch (settingsError) {
        setError(settingsError instanceof Error ? settingsError.message : "Could not load study settings.");
      } finally {
        setSettingsLoading(false);
      }
    };

    void boot();
  }, []);

  const persistSessionPreferences = async (
    nextLanguageCodes: SupportedLanguageCode[],
    nextStudyMode: StudyMode
  ) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selectedLanguageCodes: nextLanguageCodes,
        preferredStudyMode: nextStudyMode
      })
    });

    if (!response.ok) {
      throw new Error("Could not save study settings.");
    }
  };

  const toggleLanguage = (code: SupportedLanguageCode) => {
    const next = languageCodes.includes(code)
      ? languageCodes.filter((c) => c !== code)
      : [...languageCodes, code];

    if (next.length === 0) return;
    setLanguageCodes(next);
  };

  // --- Timer / Stopwatch ---
  useEffect(() => {
    if (phase !== "studying" || paused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, paused]);

  // Check timer expiry
  useEffect(() => {
    if (phase !== "studying" || timeMode !== "timer") return;
    const totalSeconds = timerMinutes * 60;
    if (elapsedSeconds >= totalSeconds && !timerExpired) {
      setTimerExpired(true);
    }
  }, [elapsedSeconds, phase, timeMode, timerMinutes, timerExpired]);

  // When timer expires and card flow completes (next card loaded or no card), go to complete
  useEffect(() => {
    if (timerExpired && !loading) {
      clearActiveSession();
      setPhase("complete");
    }
  }, [timerExpired, loading]);

  const getDisplayTime = (): string => {
    if (timeMode === "stopwatch") {
      return formatTime(elapsedSeconds);
    }
    const remaining = Math.max(0, timerMinutes * 60 - elapsedSeconds);
    return formatTime(remaining);
  };

  // --- Start study handler ---
  const handleStartStudy = async () => {
    try {
      await persistSessionPreferences(languageCodes, studyMode);
    } catch {
      // Non-blocking — we still start the session
    }
    setElapsedSeconds(0);
    setTimerExpired(false);
    setCardsReviewedThisSession(0);
    setPaused(false);
    setPhase("studying");
    await startConfiguredSession(languageCodes, studyMode);
  };

  // --- Audio ---
  const playFallbackSpeech = (text: string, languageCode: SupportedLanguageCode) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPreferredVoice(voices, languageCode);
    utterance.lang = voice?.lang ?? getSpeechSynthesisLang(languageCode);
    utterance.rate = 0.88;
    utterance.pitch = 1;
    if (voice) {
      utterance.voice = voice;
    }

    synth.cancel();
    synth.speak(utterance);
  };

  const selectAudioSpeed = (speed: AudioSpeed) => {
    setAudioSpeed(speed);
    window.localStorage.setItem("learnly-audio-speed", speed);
  };

  const playAudio = async (mode: AudioMode) => {
    if (!card || typeof window === "undefined") {
      return;
    }

    stopAudio();

    const source = buildAudioUrl(card.itemId, mode, mode === "example" ? card.exampleIndex : undefined);
    const audio = new Audio(source);
    audio.playbackRate = AUDIO_SPEED_RATES[audioSpeed];
    audioRef.current = audio;

    try {
      await audio.play();
    } catch (error) {
      playFallbackSpeech(mode === "example" ? card.example : card.displayForm, card.languageCode);
    }
  };

  const playWordAudio = async () => {
    await playAudio("term");
  };

  const playSentenceAudio = async () => {
    await playAudio("example");
  };

  // --- Card flow logic ---
  const advanceStandardGuess = (choice: GuessChoice) => {
    setStandardGuessChoice(choice);
    setRevealed(true);
    if (choice === "dont-know") {
      setStudyCardStep(1);
    }
  };

  const advanceChinesePronunciationGuess = (choice: GuessChoice) => {
    setPronunciationGuessChoice(choice);
    if (choice === "dont-know") {
      // Skip straight to full reveal — no intermediate "continue to meaning" step
      setChinesePronunciationKnown(false);
      setDefinitionGuessChoice("dont-know");
      setChineseStage("definition-confirm");
    } else {
      setChineseStage("pronunciation-confirm");
    }
    void playAudio("term");
  };

  const advanceChineseDefinitionGuess = (choice: GuessChoice) => {
    setDefinitionGuessChoice(choice);
    setChineseStage("definition-confirm");
  };

  const advanceChineseGuess = (nextStage: ChineseStage) => {
    setChineseStage(nextStage);
  };

  const confirmChinesePronunciation = (known: boolean) => {
    setChinesePronunciationKnown(known);
    setChineseStage("definition-guess");
  };

  const confirmChineseDefinition = async (known: boolean) => {
    const rating: BinaryRating = chinesePronunciationKnown && known ? 3 : 1;
    await submitReview(rating);
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
    setCardsReviewedThisSession((prev) => {
      const next = prev + 1;
      // Update persisted session with new review count
      const persisted = loadActiveSession();
      if (persisted) saveActiveSession({ ...persisted, cardsReviewed: next });
      return next;
    });

    if (!data.nextCard) {
      // No more cards
      setCard(null);
      setRemainingCount(0);
      setInsights(data.insights);
      clearActiveSession();
      setPhase("complete");
      return;
    }

    // If timer expired, finish after this card
    if (timerExpired) {
      setCard(null);
      setRemainingCount(data.remainingCount);
      setInsights(data.insights);
      clearActiveSession();
      setPhase("complete");
      return;
    }

    setCard(data.nextCard);
    setRemainingCount(data.remainingCount);
    setInsights(data.insights);
    resetCardFlow();
  };

  // --- Keyboard shortcuts (only active during studying phase) ---
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (phase !== "studying" || !card || loading) {
        return;
      }

      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        setPaused((prev) => !prev);
        return;
      }

      if (paused) return;

      const isChineseCard = card.languageCode.startsWith("zh");
      const useChineseFlow = isChineseCard && direction === "es-to-en";
      const isNewCard = card.isNew;

      if (event.key === "Shift") {
        const answerVisible = useChineseFlow ? chineseStage === "definition-confirm" : revealed;
        if (answerVisible && !translationRevealed) {
          event.preventDefault();
          setTranslationRevealed(true);
        }
        return;
      }

      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (studyCardStep === 1) {
          void submitReview(1);
          return;
        }

        if (useChineseFlow) {
          if (chineseStage === "pronunciation-confirm" && pronunciationGuessChoice === "dont-know") {
            confirmChinesePronunciation(false);
            return;
          }

          if (chineseStage === "definition-confirm" && definitionGuessChoice === "dont-know") {
            void submitReview(1);
            return;
          }

          if (chineseStage === "pronunciation-guess") {
            advanceChineseGuess("pronunciation-confirm");
          } else if (chineseStage === "definition-guess") {
            advanceChineseGuess("definition-confirm");
          }
        } else if (!revealed) {
          setRevealed(true);
        }
        return;
      }

      if (event.code === "ArrowUp") {
        event.preventDefault();
        if (useChineseFlow && chineseStage === "pronunciation-guess") return;
        void playWordAudio();
        return;
      }

      const canPlaySentence =
        useChineseFlow ? chineseStage === "definition-confirm" : isNewCard ? revealed : revealed;

      if (event.code === "ArrowDown" && canPlaySentence) {
        event.preventDefault();
        void playSentenceAudio();
        return;
      }

      if (useChineseFlow) {
        if (chineseStage === "pronunciation-guess") {
          if (event.code === "ArrowLeft") {
            event.preventDefault();
            advanceChinesePronunciationGuess("dont-know");
          }

          if (event.code === "ArrowRight") {
            event.preventDefault();
            advanceChinesePronunciationGuess("think-know");
          }
          return;
        }

        if (chineseStage === "pronunciation-confirm") {
          if (pronunciationGuessChoice === "dont-know") {
            if (event.code === "ArrowRight") {
              event.preventDefault();
              confirmChinesePronunciation(false);
            }
            return;
          }

          if (event.code === "ArrowLeft") {
            event.preventDefault();
            setChinesePronunciationKnown(false);
            setChineseStage("definition-confirm");
            setStudyCardStep(1);
          }

          if (event.code === "ArrowRight") {
            event.preventDefault();
            confirmChinesePronunciation(true);
          }
          return;
        }

        if (chineseStage === "definition-guess") {
          if (event.code === "ArrowLeft") {
            event.preventDefault();
            advanceChineseDefinitionGuess("dont-know");
          }

          if (event.code === "ArrowRight") {
            event.preventDefault();
            advanceChineseDefinitionGuess("think-know");
          }
          return;
        }

        if (chineseStage === "definition-confirm") {
          if (studyCardStep === 1) {
            if (event.code === "ArrowRight") {
              event.preventDefault();
              void submitReview(1);
            }
            return;
          }

          if (definitionGuessChoice === "dont-know") {
            if (event.code === "ArrowRight") {
              event.preventDefault();
              void submitReview(1);
            }
            return;
          }

          if (event.code === "ArrowLeft") {
            event.preventDefault();
            setStudyCardStep(1);
          }

          if (event.code === "ArrowRight") {
            event.preventDefault();
            void confirmChineseDefinition(true);
          }
        }
        return;
      }

      if (isNewCard) {
        if (!revealed) {
          if (event.code === "ArrowLeft") {
            event.preventDefault();
            setRevealed(true);
            setStudyCardStep(1);
          }
          if (event.code === "ArrowRight") {
            event.preventDefault();
            setRevealed(true);
            void submitReview(3);
          }
          return;
        }

        if (studyCardStep === 1) {
          if (event.code === "ArrowRight") {
            event.preventDefault();
            void submitReview(1);
          }
          return;
        }
        return;
      }

      if (!revealed) {
        if (event.code === "ArrowLeft") {
          event.preventDefault();
          advanceStandardGuess("dont-know");
        }

        if (event.code === "ArrowRight") {
          event.preventDefault();
          advanceStandardGuess("think-know");
        }
        return;
      }

      if (studyCardStep === 1) {
        if (event.code === "ArrowRight") {
          event.preventDefault();
          void submitReview(1);
        }
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        setStudyCardStep(1);
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        void submitReview(3);
      }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [card, chinesePronunciationKnown, chineseStage, direction, loading, revealed, sessionId, startTime, studyCardStep, voices, audioSpeed, phase, translationRevealed, paused]);

  // --- Derived state ---
  const isChineseCard = card?.languageCode.startsWith("zh") ?? false;
  const useChineseFlow = isChineseCard && direction === "es-to-en";
  const isNewCard = card?.isNew ?? false;
  const canPlayWordAudio =
    !card ? false : !(useChineseFlow && chineseStage === "pronunciation-guess");
  const canPlaySentenceAudio =
    !card ? false : useChineseFlow ? chineseStage === "definition-confirm" : revealed;
  const showingAnswer = !card ? false : useChineseFlow ? chineseStage === "definition-confirm" : revealed;
  const showChinesePronunciation = Boolean(useChineseFlow && card?.pronunciation && chineseStage !== "pronunciation-guess");
  const chineseStudyStepActive =
    (chineseStage === "pronunciation-confirm" && pronunciationGuessChoice === "dont-know") ||
    (chineseStage === "definition-confirm" && definitionGuessChoice === "dont-know");
  const prompt = direction === "es-to-en" ? card?.displayForm : card?.primaryGloss;
  const promptLabel =
    direction === "es-to-en"
      ? `${availableLanguages.find((language) => language.code === card?.languageCode)?.name ?? "Target"} prompt`
      : "English prompt";

  // =====================================================================
  // PHASE 1: SETUP SCREEN
  // =====================================================================
  if (phase === "setup") {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="w-full max-w-lg">
          <div className="rounded-[32px] border border-line/70 dark:border-line/52 bg-panel/84 dark:bg-[linear-gradient(180deg,rgba(15,18,24,0.98),rgba(8,10,14,0.94))] p-6 shadow-[0_20px_60px_rgba(30,18,10,0.07)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.32)] sm:p-8">
            {/* Header */}
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink/38">Study session</div>
              <h1 className="mt-3 text-3xl tracking-[-0.04em] text-ink/92">Ready to study?</h1>
            </div>

            {settingsLoading ? (
              <div className="mt-8 text-center text-sm text-ink/50">Loading preferences...</div>
            ) : (
              <>
                {/* Language selection */}
                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink/38">Languages</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableLanguages.map((language) => {
                      const active = languageCodes.includes(language.code);
                      return (
                        <button
                          key={language.code}
                          type="button"
                          onClick={() => toggleLanguage(language.code)}
                          className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-[transform,opacity,box-shadow] ${
                            active
                              ? "border-clay/35 bg-clay/12 text-clay shadow-[0_16px_36px_rgba(202,114,76,0.12)]"
                              : "border-line/70 bg-paper/68 text-ink/60 hover:border-clay/28 hover:text-clay"
                          }`}
                        >
                          {language.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session mode */}
                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink/38">Session mode</div>
                  <div className="mt-3 inline-flex rounded-full border border-line/70 bg-paper/76 p-1">
                    {studyModes.map((option) => {
                      const active = option.id === studyMode;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setStudyMode(option.id)}
                          className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-[transform,opacity,box-shadow] ${
                            active
                              ? "bg-night text-white dark:bg-white dark:text-night shadow-[0_10px_24px_rgba(23,18,16,0.14)]"
                              : "text-ink/55"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time mode */}
                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink/38">Time mode</div>

                  {/* Segmented control */}
                  <div className="mt-3 inline-flex rounded-full border border-line/70 bg-paper/76 p-1">
                    {(["timer", "stopwatch"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTimeMode(mode)}
                        className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-[transform,opacity,box-shadow] ${
                          timeMode === mode
                            ? "bg-night text-white dark:bg-white dark:text-night shadow-[0_10px_24px_rgba(23,18,16,0.14)]"
                            : "text-ink/55"
                        }`}
                      >
                        {mode === "timer" ? "Timer" : "Stopwatch"}
                      </button>
                    ))}
                  </div>

                  {timeMode === "timer" ? (
                    <div className="mt-4 rounded-[20px] border border-line/70 bg-paper/68 p-4">
                      <div className="text-center text-4xl font-mono tabular-nums tracking-[-0.04em] text-ink/88">
                        {timerMinutes} min
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={60}
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(Number(e.target.value))}
                        className="mt-3 w-full accent-[rgb(var(--color-pine))]"
                      />
                      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.18em] text-ink/38">
                        <span>1 min</span>
                        <span>60 min</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[20px] border border-line/70 bg-paper/68 p-4 text-center">
                      <div className="text-sm text-ink/56">
                        Session will run until you end it or cards run out. Elapsed time will be shown.
                      </div>
                    </div>
                  )}
                </div>

                {error ? (
                  <div className="mt-4 rounded-[20px] border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                ) : null}

                {/* Start button */}
                <button
                  type="button"
                  onClick={() => void handleStartStudy()}
                  className="mt-8 w-full rounded-[26px] border border-[rgb(var(--color-clay)/0.2)] dark:border-[rgb(var(--color-accent)/0.58)] bg-[rgb(var(--color-clay)/0.92)] dark:bg-[rgb(var(--color-accent))] px-6 py-5 text-center text-2xl font-semibold tracking-[-0.04em] text-white dark:text-black shadow-[0_18px_40px_rgba(202,114,76,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,223,186,0.2),inset_0_-1px_0_rgba(124,63,0,0.3),0_16px_30px_rgba(0,0,0,0.28)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:bg-[rgb(var(--color-clay)/0.98)] dark:hover:bg-[rgb(247,145,10)]"
                >
                  Start Study
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // PHASE 3: COMPLETE SCREEN
  // =====================================================================
  if (phase === "complete") {
    const isTimerFinish = timerExpired;
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="w-full max-w-lg">
          <div className="rounded-[32px] border border-line/70 dark:border-line/52 bg-panel/84 dark:bg-[linear-gradient(180deg,rgba(15,18,24,0.98),rgba(8,10,14,0.94))] p-6 shadow-[0_20px_60px_rgba(30,18,10,0.07)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.32)] sm:p-8">
            <h2 className="text-4xl tracking-[-0.04em]">
              Great focus session!
            </h2>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-pine px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 dark:text-black/50">Time studied</div>
                <div className="mt-2 font-mono text-4xl tabular-nums tracking-[-0.04em] text-white dark:text-black">
                  {formatTime(elapsedSeconds)}
                </div>
              </div>
              <div className="rounded-[18px] bg-pine px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 dark:text-black/50">Cards reviewed</div>
                <div className="mt-2 text-4xl tracking-[-0.04em] text-white dark:text-black">{cardsReviewedThisSession}</div>
              </div>
              <div className="rounded-[18px] bg-pine px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 dark:text-black/50">Still due</div>
                <div className="mt-2 text-4xl tracking-[-0.04em] text-white dark:text-black">{remainingCount}</div>
              </div>
              {insights ? (
                <>
                  <div className="rounded-[18px] bg-pine px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 dark:text-black/50">Reviewed today</div>
                    <div className="mt-2 text-4xl tracking-[-0.04em] text-white dark:text-black">{insights.reviewsToday}</div>
                  </div>
                  <div className="rounded-[18px] bg-pine px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 dark:text-black/50">New words today</div>
                    <div className="mt-2 text-4xl tracking-[-0.04em] text-white dark:text-black">{insights.newWordsToday}</div>
                  </div>
                  {insights.dueByLanguage && Object.keys(insights.dueByLanguage).length > 0 && (
                    <div className="col-span-2 rounded-[18px] bg-pine px-4 py-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 dark:text-black/50">Still due by language</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {languageCodes.map((code) => {
                          const lang = availableLanguages.find((l) => l.code === code);
                          const due = insights.dueByLanguage[code] ?? 0;
                          return (
                            <div
                              key={code}
                              className="flex items-center gap-2 rounded-full border border-white/20 dark:border-black/20 bg-white/10 dark:bg-black/10 px-3 py-1.5"
                            >
                              <span className="text-sm font-semibold text-white dark:text-black">
                                {lang?.name ?? code}
                              </span>
                              <span className="rounded-full bg-white/20 dark:bg-black/15 px-2 py-0.5 text-xs font-bold tabular-nums text-white dark:text-black">
                                {due}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="button-primary">
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearActiveSession();
                  setPhase("setup");
                  setError(null);
                  setCard(null);
                  setSessionId(null);
                  setSummary(null);
                  setTimerExpired(false);
                  setElapsedSeconds(0);
                  setCardsReviewedThisSession(0);
                }}
                className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white dark:text-black shadow-[0_14px_36px_rgba(202,114,76,0.25)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90"
              >
                New session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // PHASE 2: STUDY SCREEN (Active Session)
  // =====================================================================
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-[var(--page-top)]">
      {/* ---- Compact top bar ---- */}
      <div className="shrink-0 bg-paper/54 px-4 py-4 sm:px-6 sm:py-5">
       <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          {/* Timer display */}
          <div className="flex items-center gap-2">
            <div
              className={`font-mono text-2xl tabular-nums tracking-[-0.02em] sm:text-3xl ${
                timeMode === "timer" && timerMinutes * 60 - elapsedSeconds <= 60
                  ? "text-red-500"
                  : "text-ink/88"
              }`}
            >
              {getDisplayTime()}
            </div>
          </div>

          {/* Progress bar + Pause + End session */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {(() => {
              const sessionDue = insights?.dueByLanguage
                ? Object.values(insights.dueByLanguage).reduce((sum, n) => sum + n, 0)
                : remainingCount;
              return (
                <div className="rounded-full bg-gold px-3 py-1.5 text-sm font-semibold tabular-nums text-white dark:text-black sm:px-4 sm:py-2">
                  {sessionDue} cards left
                </div>
              );
            })()}
            <button
              type="button"
              onClick={() => setPaused((prev) => !prev)}
              className="rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-white dark:text-black transition-[transform,opacity,box-shadow] hover:opacity-90 sm:px-3.5 sm:py-2"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => { clearActiveSession(); setPhase("complete"); }}
              className="rounded-full bg-[rgb(221,82,76)] px-3 py-1.5 text-sm font-semibold text-white dark:text-black transition-[transform,opacity,box-shadow] hover:opacity-90 sm:px-4 sm:py-2"
            >
              End
            </button>
          </div>
        </div>

        {/* Audio controls + direction toggle */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {/* Direction toggle */}
          <div className="inline-flex rounded-full border border-line/70 bg-paper/76 p-1">
            {directionOptions.map((option) => {
              const langName = card ? (availableLanguages.find((l) => l.code === card.languageCode)?.name ?? "Target") : "Target";
              const label = option.id === "es-to-en" ? `${langName} → English` : `English → ${langName}`;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDirection(option.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-[transform,opacity,box-shadow] ${
                    direction === option.id
                      ? "bg-night text-white dark:bg-white dark:text-night shadow-[0_10px_24px_rgba(23,18,16,0.14)]"
                      : "text-ink/55"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Audio controls */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-full border border-line/70 bg-paper/50 p-0.5">
              {AUDIO_SPEEDS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => selectAudioSpeed(s.key)}
                  className={`rounded-full px-1.5 py-1 text-[10px] font-semibold transition-[transform,opacity,box-shadow] ${
                    audioSpeed === s.key
                      ? "bg-clay text-white dark:text-black shadow-sm"
                      : "text-ink/58 hover:text-clay"
                  }`}
                  title={`Audio speed: ${s.label}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
       </div>
      </div>

      {/* ---- Pause overlay ---- */}
      {paused && (
        <div className="fixed inset-0 z-10 flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: "color-mix(in srgb, var(--page-top) 85%, transparent)" }}>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 dark:bg-white/5 backdrop-blur-sm">
              <svg className="h-7 w-7 text-ink/40 dark:text-white/80" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            </div>
            <div className="text-3xl font-semibold tracking-[-0.03em] text-ink/88 dark:text-white/90">Session paused</div>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="mt-8 rounded-full bg-[#FF991C] px-10 py-3.5 text-base font-semibold text-white shadow-[0_14px_36px_rgba(255,153,28,0.3)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90"
            >
              Resume
            </button>
            <div className="mt-4 text-sm text-ink/30 dark:text-white/35">Press P to resume</div>
          </div>
        </div>
      )}

      {/* ---- Main study area ---- */}
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-2 pt-6 pb-0 sm:px-3 sm:pt-10 sm:pb-0">
        {loading ? <p className="text-sm text-ink/60">Building your study queue...</p> : null}

        {error ? (
          <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading && card ? (
          <article className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Card content — scrollable if answer is long */}
            <div className="flex flex-1 flex-col items-center overflow-y-auto overscroll-contain p-4 sm:p-5">
             <div className="my-auto flex w-full flex-col items-center">
              {/* Section 1: Word + pronunciation */}
              <div className="flex w-full flex-col items-center text-center">
                <div>
                  {!useChineseFlow && direction === "en-to-es" && (
                    <div className="mb-2 text-xs uppercase tracking-[0.22em] text-ink/35">
                      {availableLanguages.find((l) => l.code === card.languageCode)?.name ?? "Language"}
                    </div>
                  )}
                  <div className="max-w-3xl text-6xl tracking-[-0.05em] sm:text-7xl">
                    {useChineseFlow ? card.displayForm : prompt}
                  </div>
                  {showChinesePronunciation ? (
                    <div className="mt-2">
                      <div className="text-2xl tracking-[-0.04em] text-ink/72 sm:text-3xl">
                        {card.pronunciation}
                      </div>
                    </div>
                  ) : (showingAnswer && card.pronunciation ? (
                    <div className="mt-2 text-sm uppercase tracking-[0.2em] text-ink/38">
                      {card.pronunciation}
                    </div>
                  ) : null)}
                </div>
              </div>

              {showingAnswer ? (
                <div className="w-full max-w-lg">
                  {/* Section 2: Translations */}
                  <div className="mt-8 text-center sm:mt-10">
                    {useChineseFlow ? (
                      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-3xl tracking-[-0.04em]">
                        <span>{card.primaryGloss}</span>
                        {card.secondaryGlosses?.slice(0, 3).map((gloss) => (
                          <span key={gloss}>{gloss}</span>
                        ))}
                      </div>
                    ) : direction === "es-to-en" ? (
                      <div className="text-3xl tracking-[-0.04em]">{card.primaryGloss}</div>
                    ) : (
                      <div className="text-4xl tracking-[-0.05em]">{card.displayForm}</div>
                    )}
                  </div>

                  {/* Section 3: Example sentence */}
                  <div className="mt-6 rounded-[24px] border border-line/70 bg-panel/76 p-5 sm:mt-8">
                    <div className="text-2xl leading-9 sm:text-3xl sm:leading-10">{card.example}</div>
                    <button
                      type="button"
                      onClick={() => !translationRevealed && setTranslationRevealed(true)}
                      className="relative mt-4 block w-full overflow-hidden rounded-[14px] border border-line/50 px-4 py-3 text-left text-base text-ink/58"
                      style={{ cursor: translationRevealed ? "default" : "pointer" }}
                    >
                      <span
                        style={{
                          opacity: translationRevealed ? 1 : 0,
                          transition: "opacity 0.4s ease-out",
                        }}
                      >
                        {card.translation}
                      </span>
                      <span
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        style={{
                          background: "repeating-linear-gradient(90deg, rgba(228,220,207,0.5) 0px, rgba(228,220,207,0.5) 2px, rgba(238,232,222,0.45) 2px, rgba(238,232,222,0.45) 8px)",
                          backdropFilter: "blur(4px)",
                          opacity: translationRevealed ? 0 : 1,
                          transform: translationRevealed ? "translateX(100%)" : "translateX(0)",
                          transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
                        }}
                      >
                        <span className="rounded-full bg-paper/90 px-3 py-1 text-xs font-medium tracking-wide text-ink/50">tap to reveal</span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
             </div>
            </div>

            {/* Rating buttons — pinned to bottom */}
            <div className="shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {useChineseFlow ? (
                <div className="space-y-4">
                  {studyCardStep !== 1 && (
                    <div className="text-center text-lg tracking-[-0.04em] text-ink/88">
                      {chineseStage === "pronunciation-guess" && "Did you know this pronunciation?"}
                      {chineseStage === "pronunciation-confirm" &&
                        (pronunciationGuessChoice === "dont-know"
                          ? "Study the pronunciation once."
                          : "Did you know the pronunciation?")}
                      {chineseStage === "definition-guess" && "What is the definition of this word?"}
                      {chineseStage === "definition-confirm" &&
                        (definitionGuessChoice === "dont-know"
                          ? ""
                          : "Did you know the definition?")}
                    </div>
                  )}
                  {(chineseStudyStepActive || studyCardStep === 1) ? (
                    <StudyRecoveryPanel
                      title="You forgot this word."
                      body="Take a moment to study it."
                      actionLabel="I'm done studying it"
                      onAction={() => void submitReview(1)}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {chineseStage === "pronunciation-guess" || chineseStage === "definition-guess" ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              chineseStage === "pronunciation-guess"
                                ? advanceChinesePronunciationGuess("dont-know")
                                : advanceChineseDefinitionGuess("dont-know")
                            }
                            className="rounded-[18px] bg-gold px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(166,145,112,0.08)]"
                          >
                            <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">← I don&apos;t know</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              chineseStage === "pronunciation-guess"
                                ? advanceChinesePronunciationGuess("think-know")
                                : advanceChineseDefinitionGuess("think-know")
                            }
                            className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(198,124,92,0.14)]"
                          >
                            <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">I think I know →</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (chineseStage === "pronunciation-confirm") {
                                setChinesePronunciationKnown(false);
                                setChineseStage("definition-confirm");
                              }
                              setStudyCardStep(1);
                            }}
                            className="rounded-[18px] bg-gold px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(166,145,112,0.08)]"
                          >
                            <span className="mt-1 block text-2xl font-semibold tracking-[-0.03em]">← No</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              chineseStage === "pronunciation-confirm"
                                ? confirmChinesePronunciation(true)
                                : void confirmChineseDefinition(true)
                            }
                            className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(198,124,92,0.14)]"
                          >
                            <span className="mt-1 block text-2xl font-semibold tracking-[-0.03em]">Yes →</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : isNewCard ? (
                !revealed ? (
                  <div className="space-y-4">
                    <div className="text-center text-lg tracking-[-0.04em] text-ink/88">Do you know this word?</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setRevealed(true); setStudyCardStep(1); }}
                        className="rounded-[18px] bg-gold px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(166,145,112,0.08)]"
                      >
                        <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">← Don&apos;t know</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRevealed(true); void submitReview(3); }}
                        className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(198,124,92,0.14)]"
                      >
                        <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">I know →</span>
                      </button>
                    </div>
                  </div>
                ) : studyCardStep === 1 ? (
                  <StudyRecoveryPanel
                    title="You forgot this word."
                    body="Take a moment to study it."
                    actionLabel="I'm done studying it"
                    onAction={() => void submitReview(1)}
                  />
                ) : null
              ) : !revealed ? (
                <div className="space-y-4">
                  <div className="text-center text-lg tracking-[-0.04em] text-ink/88">Do you think you know it?</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => advanceStandardGuess("dont-know")}
                      className="rounded-[18px] bg-gold px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(166,145,112,0.08)]"
                    >
                      <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">← I don&apos;t know</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceStandardGuess("think-know")}
                      className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(198,124,92,0.14)]"
                    >
                      <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">I think I know →</span>
                    </button>
                  </div>
                </div>
              ) : studyCardStep === 1 ? (
                <StudyRecoveryPanel
                  title="You forgot this word."
                  body="Take a moment to study it."
                  actionLabel="I'm done studying it"
                  onAction={() => void submitReview(1)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="text-center text-lg tracking-[-0.04em] text-ink/88">Did you know it?</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "← No",
                        hint: "",
                        rating: 1 as BinaryRating,
                        tone:
                          "bg-gold text-white dark:text-black hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(166,145,112,0.08)] transition-[transform,opacity,box-shadow]"
                      },
                      {
                        label: "Yes →",
                        hint: "",
                        rating: 3 as BinaryRating,
                        tone:
                          "bg-clay text-white dark:text-black hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgba(198,124,92,0.14)] transition-[transform,opacity,box-shadow]"
                      }
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => option.rating === 1 ? setStudyCardStep(1) : void submitReview(option.rating)}
                        className={`rounded-[18px] px-4 py-3 text-center ${option.tone}`}
                      >
                        <span className="block text-2xl font-semibold tracking-[-0.03em]">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio buttons — always visible */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void playWordAudio()}
                  disabled={!canPlayWordAudio}
                  className={`rounded-[20px] border border-line/70 bg-paper/76 px-4 py-4 text-base font-semibold transition-[transform,opacity,box-shadow] ${
                    canPlayWordAudio
                      ? "text-ink/68 hover:border-clay/35 hover:text-clay"
                      : "cursor-not-allowed text-ink/34 opacity-60"
                  }`}
                >
                  ↑ Word
                </button>
                <button
                  type="button"
                  onClick={() => void playSentenceAudio()}
                  disabled={!canPlaySentenceAudio}
                  className={`rounded-[20px] border border-line/70 bg-paper/76 px-4 py-4 text-base font-semibold transition-[transform,opacity,box-shadow] ${
                    canPlaySentenceAudio
                      ? "text-ink/68 hover:border-clay/35 hover:text-clay"
                      : "cursor-not-allowed text-ink/34 opacity-60"
                  }`}
                >
                  ↓ Sentence
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
