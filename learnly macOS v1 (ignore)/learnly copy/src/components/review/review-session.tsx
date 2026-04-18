"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { buildAudioUrl } from "@/lib/demo/audio-source";
import { SettingsOverlay } from "@/components/settings/settings-overlay";
import { ChineseSentencePreview } from "@/components/words/chinese-sentence-preview";
import type {
  ChineseReviewFlow,
  DemoLanguage,
  SessionCardPayload,
  StudyMode,
  SupportedLanguageCode
} from "@/lib/demo/types";

// --- Session persistence (survives page refresh) ---
const SESSION_STORAGE_KEY = "learnly-active-session";
const COMPLETE_STORAGE_KEY = "learnly-last-complete-session";

type PersistedSession = {
  sessionId: string;
  timeMode: TimeMode;
  timerMinutes: number;
  /** Epoch ms when the studying phase started */
  studyingStartedAt: number;
  cardsReviewed: number;
  /** Tracks auto-direction rotation so refresh resumes the same card mode */
  autoDirectionCounter?: number;
  /** Effective direction of the currently visible card */
  currentDirection?: "es-to-en" | "en-to-es";
  /** Item id for the currently visible card */
  currentCardItemId?: string | null;
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

function saveCompletedSession(data: PersistedCompletion) {
  try { sessionStorage.setItem(COMPLETE_STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

function loadCompletedSession(): PersistedCompletion | null {
  try {
    const raw = sessionStorage.getItem(COMPLETE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCompletion;
  } catch { return null; }
}

function clearCompletedSession() {
  try { sessionStorage.removeItem(COMPLETE_STORAGE_KEY); } catch { /* noop */ }
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

type PersistedCompletion = {
  elapsedSeconds: number;
  cardsReviewed: number;
  insights: SessionPayload["insights"] | null;
  completedAt: number;
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

type Direction = "es-to-en" | "en-to-es" | "auto";
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
  { id: "auto", label: "Auto" },
  { id: "es-to-en", label: "Target → English" },
  { id: "en-to-es", label: "English → Target" }
];

const positiveDecisionClass =
  "rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-clay)/0.22)]";

function resolveAutoDirection(counter: number): "es-to-en" | "en-to-es" {
  return counter % 3 === 2 ? "en-to-es" : "es-to-en";
}

function getPreferredVoice(voices: SpeechSynthesisVoice[], languageCode: SupportedLanguageCode) {
  const languagePrefixes: Record<SupportedLanguageCode, string[]> = {
    es: ["es"],
    fr: ["fr"],
    de: ["de"],
    zh: ["zh", "cmn"],
    "zh-hsk1": ["zh", "cmn"],
    "zh-hsk2": ["zh", "cmn"],
    "zh-hsk3": ["zh", "cmn"]
  };
  const preferredNames: Record<SupportedLanguageCode, RegExp> = {
    es: /monica|mónica|paulina|jorge|helena|google español/i,
    fr: /thomas|amelie|amélie|aurelie|aurélie/i,
    de: /anna|markus|petra/i,
    zh: /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|flo|sandy|shelley|zh/i,
    "zh-hsk1": /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|flo|sandy|shelley|zh/i,
    "zh-hsk2": /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|flo|sandy|shelley|zh/i,
    "zh-hsk3": /tingting|ting-ting|meijia|mei-jia|sinji|sin-ji|li-mu|yu-shu|google 中文|flo|sandy|shelley|zh/i
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
    case "zh-hsk3":
      return "zh-CN";
    default:
      return "en-US";
  }
}

function StudyRecoveryPanel({
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
  compactSideActions
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  compact?: boolean;
  compactSideActions?: ReactNode;
}) {
  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="text-center text-[15px] text-ink/86 whitespace-nowrap overflow-hidden text-ellipsis">
          {title} <span className="text-ink/58">{body}</span>
        </div>
        <div className={`grid items-stretch gap-2 ${compactSideActions ? "grid-cols-[minmax(0,1fr)_124px]" : ""}`}>
          <button
            type="button"
            onClick={onAction}
            className="flex h-[88px] items-center justify-center rounded-[20px] border border-[rgb(var(--color-gold)/0.45)] bg-[rgb(var(--color-gold))] px-5 py-3 text-center text-[24px] font-semibold tracking-[-0.04em] whitespace-nowrap text-white dark:text-black shadow-[0_12px_24px_rgb(var(--color-gold)/0.24)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:bg-[rgb(var(--color-gold))]"
          >
            {actionLabel}
          </button>
          {compactSideActions ? (
            <div className="grid h-[88px] w-[124px] grid-rows-2 gap-2">
              {compactSideActions}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="text-lg tracking-[-0.04em] text-ink/88">{title}</div>
        <div className="mt-2 text-lg leading-6 text-ink/56">{body}</div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="w-full rounded-[26px] border border-[rgb(var(--color-gold)/0.45)] bg-[rgb(var(--color-gold))] px-6 py-6 text-center text-2xl font-semibold tracking-[-0.04em] text-white dark:text-black shadow-[0_18px_40px_rgb(var(--color-gold)/0.28)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:bg-[rgb(var(--color-gold))]"
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
  const router = useRouter();

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
  const [direction, setDirection] = useState<Direction>("auto");
  const autoCountRef = useRef(0);
  const [languageCodes, setLanguageCodes] = useState<SupportedLanguageCode[]>(["es"]);
  const [studyMode, setStudyMode] = useState<StudyMode>("everyday");
  const [chineseReviewFlow, setChineseReviewFlow] = useState<ChineseReviewFlow>("four-click");
  const [studyCardStep, setStudyCardStep] = useState<number | null>(null);
  const [compactRecoveryLayout, setCompactRecoveryLayout] = useState(false);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioSpeed, setAudioSpeed] = useState<AudioSpeed>("1");
  const [cardsReviewedThisSession, setCardsReviewedThisSession] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [directionExpanded, setDirectionExpanded] = useState(false);
  const [speedExpanded, setSpeedExpanded] = useState(false);
  const resumeDirectionOverrideRef = useRef<"es-to-en" | "en-to-es" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const compactRecoveryLayoutRef = useRef(false);
  const compactEnteredViewportHeightRef = useRef<number | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const examplePanelRef = useRef<HTMLDivElement | null>(null);
  const actionDockRef = useRef<HTMLDivElement | null>(null);

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
    resumeDirectionOverrideRef.current = null;
  }, [direction]);

  // --- Per-language audio speed ---
  useEffect(() => {
    if (!card?.languageCode) return;
    const saved = window.localStorage.getItem(`learnly-audio-speed-${card.languageCode}`);
    if (saved && AUDIO_SPEED_RATES[saved as AudioSpeed] !== undefined) {
      setAudioSpeed(saved as AudioSpeed);
    } else {
      setAudioSpeed("1");
    }
  }, [card?.languageCode]);

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

  const setCompletionRoute = (complete: boolean) => {
    router.replace(complete ? "/study?complete=1" : "/study", { scroll: false });
  };

  const resetCardFlow = (options?: { preserveAutoDirectionCounter?: boolean; preserveDirectionOverride?: boolean }) => {
    setRevealed(false);
    setChineseStage("pronunciation-guess");
    setChinesePronunciationKnown(null);
    setStandardGuessChoice(null);
    setPronunciationGuessChoice(null);
    setDefinitionGuessChoice(null);
    setStudyCardStep(null);
    setTranslationRevealed(false);
    setStartTime(Date.now());
    if (!options?.preserveDirectionOverride) {
      resumeDirectionOverrideRef.current = null;
    }
    if (!options?.preserveAutoDirectionCounter) {
      autoCountRef.current += 1;
    }
  };

  // Resolve "auto" direction to an actual direction, alternating each card
  const effectiveDirection: "es-to-en" | "en-to-es" =
    direction === "auto"
      ? resumeDirectionOverrideRef.current ?? resolveAutoDirection(autoCountRef.current)
      : direction;

  // --- Audio preload (ready-to-play elements, not just HTTP cache) ---
  useEffect(() => {
    if (!card || typeof window === "undefined") return;
    const map = preloadedAudioRef.current;
    map.forEach((a) => { a.src = ""; });
    map.clear();
    const sources = [
      { key: "term", url: buildAudioUrl(card.itemId, "term") },
      { key: "example", url: buildAudioUrl(card.itemId, "example", card.exampleIndex) }
    ];
    for (const { key, url } of sources) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;
      map.set(key, audio);
    }
    return () => { map.forEach((a) => { a.src = ""; }); map.clear(); };
  }, [card?.itemId]);

  // --- Auto-play word audio on card change ---
  useEffect(() => {
    if (!card || typeof window === "undefined" || phase !== "studying") return;
    // Skip auto-play for Chinese cards in Target→English (pronunciation quiz)
    if (card.languageCode.startsWith("zh") && effectiveDirection === "es-to-en") return;
    // Skip auto-play in English→Target mode — audio should only play after a button press
    if (effectiveDirection === "en-to-es") return;
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
        autoDirectionCounter: autoCountRef.current,
        currentDirection: direction === "auto" ? resolveAutoDirection(autoCountRef.current) : direction,
        currentCardItemId: data.firstCard?.itemId ?? null
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
        // If ?new is in the URL, always start fresh (user clicked "Start Study")
        const isNewSession = typeof window !== "undefined" && window.location.search.includes("new");
        if (isNewSession) {
          clearActiveSession();
          clearCompletedSession();
          // Clean the URL without reloading
          window.history.replaceState({}, "", window.location.pathname);
        }

        // Check for an active session to resume
        const persisted = !isNewSession ? loadActiveSession() : null;
        if (persisted) {
          const resumeResponse = await fetch(`/api/session/${persisted.sessionId}/resume`);
          if (resumeResponse.ok) {
            const data: SessionPayload = await resumeResponse.json();
            // Only resume if there are cards left
            if (data.firstCard && data.remainingCount > 0) {
              const restoredAutoCounter =
                typeof persisted.autoDirectionCounter === "number"
                  ? persisted.autoDirectionCounter
                  : persisted.cardsReviewed + 1;
              autoCountRef.current = restoredAutoCounter;
              resumeDirectionOverrideRef.current =
                persisted.currentDirection &&
                (persisted.currentCardItemId === undefined || persisted.currentCardItemId === data.firstCard.itemId)
                  ? persisted.currentDirection
                  : null;
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
              resetCardFlow({ preserveAutoDirectionCounter: true, preserveDirectionOverride: true });
              setSettingsLoading(false);
              return;
            }
          }
          // Session expired or empty — clear it
          clearActiveSession();
        }

        const persistedComplete = !isNewSession ? loadCompletedSession() : null;
        if (persistedComplete) {
          setElapsedSeconds(persistedComplete.elapsedSeconds);
          setCardsReviewedThisSession(persistedComplete.cardsReviewed);
          setInsights(persistedComplete.insights);
          setPhase("complete");
          setSettingsLoading(false);
          return;
        }
        if (typeof window !== "undefined" && window.location.search.includes("complete=1")) {
          window.history.replaceState({}, "", window.location.pathname);
        }

        // Normal boot: load settings for setup screen
        const settingsResponse = await fetch("/api/settings");
        if (!settingsResponse.ok) {
          throw new Error("Could not load study settings.");
        }

        const settings: {
          selectedLanguageCodes: SupportedLanguageCode[];
          preferredStudyMode: StudyMode;
          chineseReviewFlow?: ChineseReviewFlow;
        } = await settingsResponse.json();

        setLanguageCodes(settings.selectedLanguageCodes);
        setStudyMode(settings.preferredStudyMode);
        setChineseReviewFlow(settings.chineseReviewFlow === "two-click" ? "two-click" : "four-click");
      } catch (settingsError) {
        setError(settingsError instanceof Error ? settingsError.message : "Could not load study settings.");
      } finally {
        setSettingsLoading(false);
      }
    };

    void boot();
  }, []);

  useEffect(() => {
    if (settingsOpen || typeof window === "undefined") return;

    const syncChineseFlow = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const settings: { chineseReviewFlow?: ChineseReviewFlow } = await response.json();
        setChineseReviewFlow(settings.chineseReviewFlow === "two-click" ? "two-click" : "four-click");
      } catch {
        // Keep current runtime value if sync fails.
      }
    };

    void syncChineseFlow();
  }, [settingsOpen]);

  useEffect(() => {
    if (phase !== "studying" || !sessionId || !card) return;
    const persisted = loadActiveSession();
    if (!persisted || persisted.sessionId !== sessionId) return;

    saveActiveSession({
      ...persisted,
      autoDirectionCounter: autoCountRef.current,
      currentDirection:
        direction === "auto"
          ? resumeDirectionOverrideRef.current ?? resolveAutoDirection(autoCountRef.current)
          : direction,
      currentCardItemId: card.itemId
    });
  }, [phase, sessionId, card?.itemId, direction]);

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
    if (phase !== "studying" || paused || settingsOpen) {
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
  }, [phase, paused, settingsOpen]);

  // Check timer expiry
  useEffect(() => {
    if (phase !== "studying" || timeMode !== "timer") return;
    const totalSeconds = timerMinutes * 60;
    if (elapsedSeconds >= totalSeconds && !timerExpired) {
      setTimerExpired(true);
    }
  }, [elapsedSeconds, phase, timeMode, timerMinutes, timerExpired]);

  // When timer expires, we wait until the user finishes the current card.
  // The submitReview function checks timerExpired and ends the session after submission.

  const getDisplayTime = (): string => {
    if (timeMode === "stopwatch") {
      return formatTime(elapsedSeconds);
    }
    const remaining = Math.max(0, timerMinutes * 60 - elapsedSeconds);
    return formatTime(remaining);
  };

  // --- Start study handler ---
  const handleStartStudy = async () => {
    clearCompletedSession();
    setCompletionRoute(false);
    // Persist preferences in background so session start never feels delayed.
    void persistSessionPreferences(languageCodes, studyMode).catch(() => {
      // Non-blocking — we still start the session
    });
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
    if (card?.languageCode) {
      window.localStorage.setItem(`learnly-audio-speed-${card.languageCode}`, speed);
    }
  };

  const playAudio = async (mode: AudioMode) => {
    if (!card || typeof window === "undefined") {
      return;
    }

    stopAudio();

    const preloaded = preloadedAudioRef.current.get(mode);
    let audio: HTMLAudioElement;
    if (preloaded && preloaded.readyState >= 2) {
      audio = preloaded;
      preloadedAudioRef.current.delete(mode);
    } else {
      audio = new Audio(buildAudioUrl(card.itemId, mode, mode === "example" ? card.exampleIndex : undefined));
    }
    audio.playbackRate = AUDIO_SPEED_RATES[audioSpeed];
    audio.currentTime = 0;
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

  const shouldPlayWordOnFirstDecision = () => {
    if (!card) return false;
    if (effectiveDirection === "en-to-es") return true;
    return card.languageCode.startsWith("zh") && chineseReviewFlow === "two-click" && effectiveDirection === "es-to-en";
  };

  // --- Card flow logic ---
  const advanceStandardGuess = (choice: GuessChoice) => {
    setStandardGuessChoice(choice);
    setRevealed(true);
    if (choice === "dont-know") {
      setStudyCardStep(1);
    }
    // Keep first-decision audio parity for English→Target and Chinese 2-click Target→English.
    if (shouldPlayWordOnFirstDecision()) {
      void playAudio("term");
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
    const nextCardsReviewed = cardsReviewedThisSession + 1;
    setCardsReviewedThisSession(nextCardsReviewed);

    if (!data.nextCard) {
      // No more cards
      setCard(null);
      setRemainingCount(0);
      setInsights(data.insights);
      saveCompletedSession({
        elapsedSeconds,
        cardsReviewed: nextCardsReviewed,
        insights: data.insights,
        completedAt: Date.now()
      });
      clearActiveSession();
      setPhase("complete");
      setCompletionRoute(true);
      return;
    }

    // If timer expired, finish after this card
    if (timerExpired) {
      setCard(null);
      setRemainingCount(data.remainingCount);
      setInsights(data.insights);
      saveCompletedSession({
        elapsedSeconds,
        cardsReviewed: nextCardsReviewed,
        insights: data.insights,
        completedAt: Date.now()
      });
      clearActiveSession();
      setPhase("complete");
      setCompletionRoute(true);
      return;
    }

    setCard(data.nextCard);
    setRemainingCount(data.remainingCount);
    setInsights(data.insights);
    resetCardFlow();

    // Keep resume behavior stable: persist both review count and auto-direction rotation.
    const persisted = loadActiveSession();
    if (persisted) {
      saveActiveSession({
        ...persisted,
        cardsReviewed: nextCardsReviewed,
        autoDirectionCounter: autoCountRef.current,
        currentDirection: direction === "auto" ? resolveAutoDirection(autoCountRef.current) : direction,
        currentCardItemId: data.nextCard.itemId
      });
    }
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

      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        setSettingsOpen((prev) => !prev);
        return;
      }

      if (paused || settingsOpen) return;

      const isChineseCard = card.languageCode.startsWith("zh");
      const useChineseFlow = isChineseCard && chineseReviewFlow === "four-click" && effectiveDirection === "es-to-en";
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
            if (shouldPlayWordOnFirstDecision()) void playWordAudio();
          }
          if (event.code === "ArrowRight") {
            event.preventDefault();
            setRevealed(true);
            if (shouldPlayWordOnFirstDecision()) {
              void playWordAudio();
            } else {
              void submitReview(3);
            }
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

        // New card revealed with confirm step (en-to-es "I know" path)
        if (event.code === "ArrowLeft") {
          event.preventDefault();
          setStudyCardStep(1);
        }
        if (event.code === "ArrowRight") {
          event.preventDefault();
          void submitReview(3);
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
  }, [card, chinesePronunciationKnown, chineseReviewFlow, chineseStage, direction, loading, revealed, sessionId, startTime, studyCardStep, voices, audioSpeed, phase, translationRevealed, paused]);

  // --- Derived state ---
  const isChineseCard = card?.languageCode.startsWith("zh") ?? false;
  const useChineseFlow = isChineseCard && chineseReviewFlow === "four-click" && effectiveDirection === "es-to-en";
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
  const showingRecoveryPanel = useChineseFlow
    ? chineseStudyStepActive || studyCardStep === 1
    : Boolean(revealed && studyCardStep === 1);
  const prompt = effectiveDirection === "es-to-en" ? card?.displayForm : card?.primaryGloss;
  const promptLabel =
    effectiveDirection === "es-to-en"
      ? `${availableLanguages.find((language) => language.code === card?.languageCode)?.name ?? "Target"} prompt`
      : "English prompt";
  const activeStudyPrompt = (() => {
    if (!card || showingRecoveryPanel) return null;

    if (useChineseFlow) {
      if (chineseStage === "pronunciation-guess") return "Do you think you know the pronunciation?";
      if (chineseStage === "pronunciation-confirm") {
        return pronunciationGuessChoice === "dont-know" ? "Study the pronunciation once." : "Did you know the pronunciation?";
      }
      if (chineseStage === "definition-guess") return "What is the definition of this word?";
      if (chineseStage === "definition-confirm") {
        return definitionGuessChoice === "dont-know" ? null : "Did you know the definition?";
      }
      return null;
    }

    if (isNewCard) {
      if (!revealed) return "Do you know this word?";
      if (studyCardStep === 1) return null;
      return "Did you know it?";
    }

    if (!revealed) return "Do you think you know it?";
    if (studyCardStep === 1) return null;
    return "Did you know it?";
  })();
  const shouldCenterMainContent = !compactRecoveryLayout;

  useEffect(() => {
    compactRecoveryLayoutRef.current = compactRecoveryLayout;
  }, [compactRecoveryLayout]);

  useEffect(() => {
    if (typeof window === "undefined" || !showingRecoveryPanel) {
      compactRecoveryLayoutRef.current = false;
      compactEnteredViewportHeightRef.current = null;
      setCompactRecoveryLayout(false);
      return;
    }

    let rafId = 0;

    const evaluateRecoveryLayout = () => {
      const scrollEl = contentScrollRef.current;
      const exampleEl = examplePanelRef.current;
      const actionEl = actionDockRef.current;
      const viewportHeight = window.innerHeight;

      const contentOverflows = Boolean(scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 2);
      let exampleTopClipped = false;
      let exampleDockGap = Number.POSITIVE_INFINITY;
      if (exampleEl && actionEl) {
        const exampleRect = exampleEl.getBoundingClientRect();
        const actionRect = actionEl.getBoundingClientRect();
        exampleTopClipped = exampleRect.top < 8;
        exampleDockGap = actionRect.top - exampleRect.bottom;
      }

      const current = compactRecoveryLayoutRef.current;
      const shouldEnterCompact = contentOverflows || exampleTopClipped || exampleDockGap < 12;

      if (!current) {
        if (shouldEnterCompact) {
          compactRecoveryLayoutRef.current = true;
          compactEnteredViewportHeightRef.current = viewportHeight;
          setCompactRecoveryLayout(true);
        }
        return;
      }

      // Exit only after clear height recovery to avoid oscillation while dragging around the boundary.
      const enteredAt = compactEnteredViewportHeightRef.current ?? viewportHeight;
      const hasRecoveredHeight = viewportHeight >= enteredAt + 72;
      const hasSafeSpacing = !contentOverflows && !exampleTopClipped && exampleDockGap > 36;
      if (hasRecoveredHeight && hasSafeSpacing) {
        compactRecoveryLayoutRef.current = false;
        compactEnteredViewportHeightRef.current = null;
        setCompactRecoveryLayout(false);
      }
    };

    const scheduleEvaluate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        evaluateRecoveryLayout();
      });
    };

    scheduleEvaluate();
    window.addEventListener("resize", scheduleEvaluate);
    window.addEventListener("orientationchange", scheduleEvaluate);
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", scheduleEvaluate);
      window.removeEventListener("orientationchange", scheduleEvaluate);
    };
  }, [showingRecoveryPanel, card?.itemId, translationRevealed, revealed, studyCardStep, chineseStudyStepActive]);

  const compactRecoverySideActions = (
    <>
      <button
        type="button"
        onClick={() => void playWordAudio()}
        disabled={!canPlayWordAudio}
        className={`h-[43px] rounded-[14px] border border-line/70 bg-paper/76 px-3 py-2 text-sm font-semibold transition-[transform,opacity,box-shadow] ${
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
        className={`h-[43px] rounded-[14px] border border-line/70 bg-paper/76 px-3 py-2 text-sm font-semibold transition-[transform,opacity,box-shadow] ${
          canPlaySentenceAudio
            ? "text-ink/68 hover:border-clay/35 hover:text-clay"
            : "cursor-not-allowed text-ink/34 opacity-60"
        }`}
      >
        ↓ Sentence
      </button>
    </>
  );

  // =====================================================================
  // PHASE 1: SETUP SCREEN
  // =====================================================================
  if (phase === "setup") {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="w-full max-w-lg">
          <div className="study-header-shell rounded-[32px] p-6 sm:p-8">
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
                              ? "border-[rgb(255_153_28/0.62)] bg-[#FF991C] text-white dark:text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.36)] hover:brightness-[0.98]"
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
                              ? "bg-[rgb(var(--color-gold))] text-white dark:text-black"
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
                            ? "bg-[rgb(var(--color-gold))] text-white dark:text-black"
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
                        className="timer-range mt-3 w-full"
                        style={{
                          ["--fill" as string]: `${((timerMinutes - 1) / 59) * 100}%`
                        }}
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
                  className="mt-8 w-full rounded-[26px] border border-[rgb(var(--color-clay)/0.2)] dark:border-[rgb(var(--color-accent)/0.58)] bg-[rgb(var(--color-clay)/0.92)] dark:bg-[rgb(var(--color-accent))] px-6 py-5 text-center text-2xl font-semibold tracking-[-0.04em] text-white dark:text-black shadow-[0_18px_40px_rgba(202,114,76,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.24),0_16px_30px_rgba(0,0,0,0.28)] transition-[transform,opacity,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-95"
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
    const dueByLanguage = insights?.dueByLanguage ?? {};
    const combinedDue = availableLanguages.reduce((sum, language) => sum + (dueByLanguage[language.code] ?? 0), 0);
    const reviewedToday = insights?.reviewsToday ?? 0;
    const newWordsToday = insights?.newWordsToday ?? 0;
    const streakDays = insights?.streakDays ?? 0;
    const retentionScore = insights?.retentionScore ?? 0;
    const blueMetricCardClass =
      "complete-filled complete-blue-metric min-h-[110px] rounded-[22px] px-4 py-3.5";
    const dueChipClass =
      "complete-due-chip inline-flex w-full min-h-[42px] items-center justify-between gap-3 rounded-[14px] border px-3.5 py-2";
    const dueCountBadgeClass =
      "complete-due-count inline-flex min-w-[2.1rem] items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums text-white dark:text-black";

    return (
      <div className="flex justify-center px-4 py-2">
        <div className="w-full max-w-lg">
          <div className="rounded-[34px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.46))] p-6 shadow-[0_24px_64px_rgba(30,18,10,0.08)] dark:border-line/65 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] dark:shadow-[0_10px_26px_rgba(0,0,0,0.34)] sm:p-8">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              <div className={blueMetricCardClass}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">Cards reviewed this session</div>
                <div className="mt-2 text-[44px] leading-none tracking-[-0.06em] text-white dark:text-black">{cardsReviewedThisSession}</div>
              </div>

              <div className={blueMetricCardClass}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">Time studied</div>
                <div className="mt-2 font-mono text-[44px] leading-none tabular-nums tracking-[-0.06em] text-white dark:text-black">
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              <div className={blueMetricCardClass}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">Reviewed today</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <div className="text-[40px] leading-none tracking-[-0.06em] text-white dark:text-black">{reviewedToday}</div>
                  <div className="pb-1 text-[11px] uppercase tracking-[0.16em] text-white dark:text-black">today</div>
                </div>
              </div>

              <div className={blueMetricCardClass}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">New words today</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <div className="text-[40px] leading-none tracking-[-0.06em] text-white dark:text-black">{newWordsToday}</div>
                  <div className="pb-1 text-[11px] uppercase tracking-[0.16em] text-white dark:text-black">today</div>
                </div>
              </div>

              <div className={blueMetricCardClass}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">Current streak</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <div className="text-[40px] leading-none tracking-[-0.06em] text-white dark:text-black">{streakDays}</div>
                  <div className="pb-1 text-[11px] uppercase tracking-[0.16em] text-white dark:text-black">
                    {streakDays === 1 ? "day" : "days"}
                  </div>
                </div>
              </div>

              <div className={blueMetricCardClass}>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">Retention</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <div className="text-[40px] leading-none tracking-[-0.06em] text-white dark:text-black">{retentionScore}</div>
                  <div className="pb-1 text-[11px] uppercase tracking-[0.16em] text-white dark:text-black">%</div>
                </div>
              </div>

              <div className="complete-filled complete-blue-block col-span-2 rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white dark:text-black">Still due by language</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className={dueChipClass}>
                    <span className="text-[15px] font-semibold tracking-[-0.01em] text-white dark:text-black">Combined</span>
                    <span className={dueCountBadgeClass}>{combinedDue}</span>
                  </div>
                  {availableLanguages.map((language) => {
                    const due = dueByLanguage[language.code] ?? 0;
                    return (
                      <div key={language.code} className={dueChipClass}>
                        <span className="text-[15px] font-semibold tracking-[-0.01em] text-white dark:text-black">{language.name}</span>
                        <span className={dueCountBadgeClass}>{due}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--page-top)]">
      {/* ---- Compact top bar ---- */}
      <div className="shrink-0 bg-paper/54 px-4 py-4 sm:px-6 sm:py-5">
       <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          {/* Timer display */}
          <div className="flex items-center gap-2">
            <div
              className={`font-mono text-2xl tabular-nums tracking-[-0.02em] sm:text-3xl ${
                timeMode === "timer" && timerMinutes * 60 - elapsedSeconds <= 60
                  ? "text-[#F56762]"
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
                <div className="rounded-full bg-[rgb(var(--color-gold))] px-3 py-1.5 text-sm font-semibold tabular-nums text-white dark:text-black sm:px-4 sm:py-2">
                  {sessionDue} cards left
                </div>
              );
            })()}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--color-gold))] text-white dark:text-black transition-[transform,opacity,box-shadow] hover:opacity-90 sm:h-9 sm:w-9"
              title="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setPaused((prev) => !prev)}
              className="rounded-full bg-[rgb(var(--color-gold))] px-3 py-1.5 text-sm font-semibold text-white dark:text-black transition-[transform,opacity,box-shadow] hover:opacity-90 sm:px-3.5 sm:py-2"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => {
                saveCompletedSession({
                  elapsedSeconds,
                  cardsReviewed: cardsReviewedThisSession,
                  insights,
                  completedAt: Date.now()
                });
                clearActiveSession();
                setPhase("complete");
                setCompletionRoute(true);
              }}
              className="rounded-full bg-[#F56762] px-3 py-1.5 text-sm font-semibold text-white dark:text-black transition-[transform,opacity,box-shadow] hover:opacity-90 sm:px-4 sm:py-2"
            >
              End
            </button>
          </div>
        </div>

        {/* Direction + speed controls — collapsible pills */}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {/* Direction toggle */}
          <div
            className="relative"
            onMouseEnter={() => {
              setDirectionExpanded(true);
              setSpeedExpanded(false);
            }}
            onMouseLeave={() => setDirectionExpanded(false)}
          >
            {directionExpanded ? (
              <div className="inline-flex rounded-full border border-line/70 bg-paper/76 p-1">
                {directionOptions.map((option) => {
                  const langName = card ? (availableLanguages.find((l) => l.code === card.languageCode)?.name ?? "Target") : "Target";
                  const label = option.id === "auto" ? "Auto" : option.id === "es-to-en" ? `${langName} → En` : `En → ${langName}`;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => { setDirection(option.id); setDirectionExpanded(false); }}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                        direction === option.id
                          ? "bg-night text-white dark:bg-white dark:text-night shadow-[0_10px_24px_rgba(23,18,16,0.14)]"
                          : "text-ink/55 hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDirectionExpanded((prev) => !prev)}
                className="rounded-full border border-line/70 bg-paper/76 px-3.5 py-2 text-[12px] font-semibold text-ink/70 transition-all hover:border-clay/30 hover:text-clay"
              >
                {(() => {
                  const langName = card ? (availableLanguages.find((l) => l.code === card.languageCode)?.name ?? "Target") : "Target";
                  return direction === "auto" ? "Auto" : direction === "es-to-en" ? `${langName} → En` : `En → ${langName}`;
                })()}
              </button>
            )}
          </div>

          {/* Speed toggle */}
          <div
            className="relative"
            onMouseEnter={() => {
              setSpeedExpanded(true);
              setDirectionExpanded(false);
            }}
            onMouseLeave={() => setSpeedExpanded(false)}
          >
            {speedExpanded ? (
              <div className="inline-flex items-center gap-0.5 rounded-full border border-line/70 bg-paper/50 p-0.5">
                {AUDIO_SPEEDS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { selectAudioSpeed(s.key); setSpeedExpanded(false); }}
                    className={`rounded-full px-1.5 py-1 text-[10px] font-semibold transition-all ${
                      audioSpeed === s.key
                        ? "bg-[rgb(var(--color-gold))] text-white dark:text-black shadow-sm"
                        : "text-ink/58 hover:text-gold"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSpeedExpanded((prev) => !prev)}
                className="rounded-full border border-line/70 bg-paper/50 px-3 py-1.5 text-[11px] font-semibold text-gold transition-all hover:border-gold/30"
              >
                {AUDIO_SPEEDS.find((s) => s.key === audioSpeed)?.label ?? "1×"}
              </button>
            )}
          </div>
        </div>
       </div>
      </div>

      {/* ---- Settings overlay ---- */}
      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
              className="mt-8 rounded-full px-10 py-3.5 text-base font-semibold text-white dark:text-black transition-[transform,opacity,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-95"
              style={{
                backgroundColor: "rgb(var(--color-accent))",
                boxShadow: "0 14px 36px rgb(var(--color-accent) / 0.3)"
              }}
            >
              Resume
            </button>
            <div className="mt-4 text-sm text-ink/30 dark:text-white/35">Press P to resume</div>
          </div>
        </div>
      )}

      {/* ---- Main study area ---- */}
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-2 pt-3 short:pt-1 pb-0 sm:px-3 sm:pt-6 sm:pb-0">
        {loading ? <p className="text-sm text-ink/60">Building your study queue...</p> : null}

        {error ? (
          <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading && card ? (
          <article className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Card content — scrollable if answer is long */}
            <div
              ref={contentScrollRef}
              className={`flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain ${
                compactRecoveryLayout ? "px-3 pt-1 pb-2 sm:px-4 sm:pt-2 sm:pb-3" : "p-4 sm:p-5"
              }`}
            >
             <div
               className={`flex min-h-full w-full flex-col items-center ${
                 shouldCenterMainContent
                   ? "justify-center"
                   : compactRecoveryLayout
                     ? "my-auto -translate-y-3 sm:-translate-y-4"
                     : "my-auto"
               }`}
             >
              {/* Section 1: Word + pronunciation */}
              <div className="flex w-full flex-col items-center text-center">
                <div>
                  {!useChineseFlow && effectiveDirection === "en-to-es" && (
                    <div className="mb-2 text-xs uppercase tracking-[0.22em] text-ink/35">
                      {availableLanguages.find((l) => l.code === card.languageCode)?.name ?? "Language"}
                    </div>
                  )}
                  <div className="max-w-3xl pt-1 text-6xl leading-[1.12] tracking-[-0.05em] sm:text-7xl">
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
                  <div className={`text-center ${compactRecoveryLayout ? "mt-5 sm:mt-6" : "mt-8 sm:mt-10"}`}>
                    {useChineseFlow ? (
                      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-3xl tracking-[-0.04em]">
                        <span>{card.primaryGloss}</span>
                        {card.secondaryGlosses?.slice(0, 3).map((gloss) => (
                          <span key={gloss}>{gloss}</span>
                        ))}
                      </div>
                    ) : effectiveDirection === "es-to-en" ? (
                      <div className="text-3xl tracking-[-0.04em]">{card.primaryGloss}</div>
                    ) : (
                      <div className="text-4xl tracking-[-0.05em]">{card.displayForm}</div>
                    )}
                  </div>

                  {/* Section 3: Example sentence */}
                  <div
                    ref={examplePanelRef}
                    className={`rounded-[24px] border border-line/70 bg-panel/76 p-5 ${
                      compactRecoveryLayout ? "mt-4 sm:mt-5" : "mt-6 sm:mt-8"
                    }`}
                  >
                    <div className="text-2xl leading-9 sm:text-3xl sm:leading-10">
                      {card.exampleTokens ? (
                        <ChineseSentencePreview
                          tokens={card.exampleTokens}
                          sessionId={sessionId}
                          onLearned={(result) => {
                            if (result.sessionInjected) {
                              setRemainingCount((count) => count + 1);
                            }
                          }}
                        />
                      ) : (
                        card.example
                      )}
                    </div>
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
                        <span className="rounded-full bg-paper/90 px-3 py-1 text-xs font-medium tracking-wide text-ink/50">tap or press shift</span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

             </div>
            </div>

            {/* Rating buttons — pinned to bottom */}
            <div
              ref={actionDockRef}
              className={`shrink-0 ${
                compactRecoveryLayout
                  ? "px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-2 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                  : "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              }`}
            >
              {activeStudyPrompt ? (
                <div className="mb-3 text-center text-lg tracking-[-0.04em] text-ink/88">
                  {activeStudyPrompt}
                </div>
              ) : null}
              {useChineseFlow ? (
                <div className="space-y-4">
                  {(chineseStudyStepActive || studyCardStep === 1) ? (
                    <StudyRecoveryPanel
                      title="You forgot this word."
                      body="Take a moment to study it."
                      actionLabel="I'm done studying it"
                      onAction={() => void submitReview(1)}
                      compact={compactRecoveryLayout}
                      compactSideActions={compactRecoveryLayout ? compactRecoverySideActions : undefined}
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
                            className="rounded-[18px] bg-[rgb(var(--color-gold))] px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-gold)/0.2)]"
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
                            className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-clay)/0.22)]"
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
                            className="rounded-[18px] bg-[rgb(var(--color-gold))] px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-gold)/0.2)]"
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
                            className={positiveDecisionClass}
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
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRevealed(true);
                          setStudyCardStep(1);
                          if (shouldPlayWordOnFirstDecision()) void playAudio("term");
                        }}
                        className="rounded-[18px] bg-[rgb(var(--color-gold))] px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-gold)/0.2)]"
                      >
                        <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">← Don&apos;t know</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRevealed(true);
                          if (shouldPlayWordOnFirstDecision()) {
                            void playAudio("term");
                          } else {
                            void submitReview(3);
                          }
                        }}
                        className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-clay)/0.22)]"
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
                    compact={compactRecoveryLayout}
                    compactSideActions={compactRecoveryLayout ? compactRecoverySideActions : undefined}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStudyCardStep(1)}
                        className="rounded-[18px] bg-[rgb(var(--color-gold))] px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-gold)/0.2)]"
                      >
                        <span className="block text-2xl font-semibold tracking-[-0.03em]">← No</span>
                      </button>
                    <button
                      type="button"
                      onClick={() => void submitReview(3)}
                      className={positiveDecisionClass}
                    >
                      <span className="block text-2xl font-semibold tracking-[-0.03em]">Yes →</span>
                    </button>
                    </div>
                  </div>
                )
              ) : !revealed ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => advanceStandardGuess("dont-know")}
                      className="rounded-[18px] bg-[rgb(var(--color-gold))] px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-gold)/0.2)]"
                    >
                      <span className="mt-1 block text-xl font-semibold tracking-[-0.03em]">← I don&apos;t know</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceStandardGuess("think-know")}
                      className="rounded-[18px] bg-clay px-4 py-3 text-center text-white dark:text-black transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-clay)/0.22)]"
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
                  compact={compactRecoveryLayout}
                  compactSideActions={compactRecoveryLayout ? compactRecoverySideActions : undefined}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "← No",
                        hint: "",
                        rating: 1 as BinaryRating,
                        tone:
                          "bg-[rgb(var(--color-gold))] text-white dark:text-black hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-gold)/0.2)] transition-[transform,opacity,box-shadow]"
                      },
                      {
                        label: "Yes →",
                        hint: "",
                        rating: 3 as BinaryRating,
                        tone:
                          "bg-clay text-white dark:text-black hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_12px_28px_rgb(var(--color-clay)/0.22)] transition-[transform,opacity,box-shadow]"
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
              <div className={`mt-3 short:mt-2 grid grid-cols-2 gap-2 ${compactRecoveryLayout ? "hidden" : ""}`}>
                <button
                  type="button"
                  onClick={() => void playWordAudio()}
                  disabled={!canPlayWordAudio}
                  className={`rounded-[20px] border border-line/70 bg-paper/76 px-4 py-4 short:py-2.5 text-base short:text-sm font-semibold transition-[transform,opacity,box-shadow] ${
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
                  className={`rounded-[20px] border border-line/70 bg-paper/76 px-4 py-4 short:py-2.5 text-base short:text-sm font-semibold transition-[transform,opacity,box-shadow] ${
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
