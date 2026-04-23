"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  applyThemePalette,
  getStoredThemePalette,
  themePalettes,
  type ThemePaletteKey
} from "@/lib/site/theme-palette";

type LanguageOption = { code: string; name: string };
type AssumedWordListOption = {
  id: string;
  title: string;
  description: string;
  itemCount: number;
};
type StudyMode = "everyday" | "review-only" | "new-only";
type ChineseReviewFlow = "two-click" | "four-click";
type SettingsPage =
  | "menu"
  | "daily-goal"
  | "study-languages"
  | "assumed-words"
  | "study-mode"
  | "chinese-flow"
  | "theme";

interface SettingsData {
  dailyGoal: number;
  selectedLanguageCodes: string[];
  preferredStudyMode: StudyMode;
  chineseReviewFlow: ChineseReviewFlow;
  assumedWordListIds: string[];
}

const studyModes: { id: StudyMode; label: string }[] = [
  { id: "everyday", label: "Everyday" },
  { id: "review-only", label: "Review only" },
  { id: "new-only", label: "New only" }
];

const chineseReviewFlows: { id: ChineseReviewFlow; label: string; helper: string }[] = [
  { id: "two-click", label: "2 click", helper: "Same flow as non-Chinese cards" },
  { id: "four-click", label: "4 click", helper: "Current Chinese pronunciation + definition flow" }
];

export function SettingsOverlay({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [assumedWordLists, setAssumedWordLists] = useState<AssumedWordListOption[]>([]);
  const [palette, setPalette] = useState<ThemePaletteKey>("classic");
  const [page, setPage] = useState<SettingsPage>("menu");
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!open) return;
    setPage("menu");
    try {
      const nextPalette = getStoredThemePalette();
      setPalette(nextPalette);
      document.documentElement.dataset.palette = nextPalette;
    } catch {
      setPalette("classic");
      document.documentElement.dataset.palette = "classic";
    }

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: SettingsData & {
        availableLanguages?: { code: string; name: string }[];
        availableAssumedWordLists?: AssumedWordListOption[];
      }) => {
      setSettings({
        dailyGoal: s.dailyGoal,
        selectedLanguageCodes: s.selectedLanguageCodes,
        preferredStudyMode: s.preferredStudyMode,
        chineseReviewFlow: s.chineseReviewFlow === "two-click" ? "two-click" : "four-click",
        assumedWordListIds: Array.isArray(s.assumedWordListIds) ? s.assumedWordListIds : []
      });
      setLanguages(
        (s.availableLanguages ?? []).map((l) => ({
          code: l.code,
          name: l.name
        }))
      );
      setAssumedWordLists(s.availableAssumedWordLists ?? []);
    });
  }, [open]);

  const applyPalette = useCallback((nextPalette: ThemePaletteKey) => {
    setPalette(nextPalette);
    applyThemePalette(nextPalette);
  }, []);

  const save = useCallback((patch: Partial<SettingsData>) => {
    const cur = settingsRef.current;
    if (!cur) return;
    setSettings({ ...cur, ...patch });
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handle);
    };
  }, [open, onClose]);

  if (!open || !settings) return null;

  const toggleLang = (list: string[], code: string) =>
    list.includes(code) ? (list.length > 1 ? list.filter((c) => c !== code) : list) : [...list, code];
  const toggleValue = (list: string[], value: string) =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  const selectedLanguageNames = languages
    .filter((lang) => settings.selectedLanguageCodes.includes(lang.code))
    .map((lang) => lang.name);
  const selectedLanguagesSummary =
    selectedLanguageNames.length <= 2
      ? selectedLanguageNames.join(", ")
      : `${selectedLanguageNames.slice(0, 2).join(", ")} +${selectedLanguageNames.length - 2}`;
  const paletteLabel = themePalettes.find((preset) => preset.key === palette)?.name ?? "Classic";
  const studyModeLabel =
    studyModes.find((mode) => mode.id === settings.preferredStudyMode)?.label ?? "Everyday";
  const chineseFlowLabel =
    chineseReviewFlows.find((mode) => mode.id === settings.chineseReviewFlow)?.label ?? "4 click";
  const selectedAssumedLists = assumedWordLists.filter((list) =>
    settings.assumedWordListIds.includes(list.id)
  );
  const selectedAssumedWordCount = selectedAssumedLists.reduce(
    (total, list) => total + list.itemCount,
    0
  );
  const assumedWordSummary =
    selectedAssumedLists.length === 0
      ? "No assumed lists selected"
      : selectedAssumedLists.length <= 2
        ? `${selectedAssumedLists.map((list) => list.title).join(", ")} · ${selectedAssumedWordCount} words`
        : `${selectedAssumedLists.length} lists · ${selectedAssumedWordCount} words`;
  const pageTitle: Record<Exclude<SettingsPage, "menu">, string> = {
    "daily-goal": "Daily new words",
    "study-languages": "Study languages",
    "assumed-words": "Assumed words",
    "study-mode": "Preferred study mode",
    "chinese-flow": "Chinese review flow",
    theme: "Theme palette"
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-8"
      style={{
        backgroundColor: "var(--page-top)"
      }}
    >
      <div className="relative w-full max-w-md px-4">
        {page === "menu" ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 dark:bg-white/5">
              <svg className="h-7 w-7 text-ink/40 dark:text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div className="text-3xl font-semibold tracking-[-0.03em] text-ink/88 dark:text-white/90">
              Settings
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage("menu")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line/70 bg-panel/78 text-ink/58 transition-[transform,opacity,box-shadow] hover:bg-panel dark:border-line/50 dark:text-white/65"
              aria-label="Back to settings"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/38 dark:text-white/40">Settings</div>
              <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink/88 dark:text-white/90">
                {pageTitle[page]}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          {page === "menu" ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPage("theme")}
                className="flex w-full items-center justify-between rounded-[16px] border border-line/70 bg-panel/78 px-4 py-3 text-left transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:bg-panel dark:border-line/50"
              >
                <div>
                  <div className="text-sm font-semibold text-ink/88 dark:text-white/88">Theme</div>
                  <div className="mt-1 text-xs text-ink/46 dark:text-white/52">{paletteLabel}</div>
                </div>
                <span className="text-ink/38 dark:text-white/50">›</span>
              </button>
              <button
                type="button"
                onClick={() => setPage("daily-goal")}
                className="flex w-full items-center justify-between rounded-[16px] border border-line/70 bg-panel/78 px-4 py-3 text-left transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:bg-panel dark:border-line/50"
              >
                <div>
                  <div className="text-sm font-semibold text-ink/88 dark:text-white/88">Daily new words</div>
                  <div className="mt-1 text-xs text-ink/46 dark:text-white/52">{settings.dailyGoal} per day</div>
                </div>
                <span className="text-ink/38 dark:text-white/50">›</span>
              </button>
              <button
                type="button"
                onClick={() => setPage("study-languages")}
                className="flex w-full items-center justify-between rounded-[16px] border border-line/70 bg-panel/78 px-4 py-3 text-left transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:bg-panel dark:border-line/50"
              >
                <div>
                  <div className="text-sm font-semibold text-ink/88 dark:text-white/88">Study languages</div>
                  <div className="mt-1 text-xs text-ink/46 dark:text-white/52">
                    {selectedLanguagesSummary || "No languages selected"}
                  </div>
                </div>
                <span className="text-ink/38 dark:text-white/50">›</span>
              </button>
              <button
                type="button"
                onClick={() => setPage("study-mode")}
                className="flex w-full items-center justify-between rounded-[16px] border border-line/70 bg-panel/78 px-4 py-3 text-left transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:bg-panel dark:border-line/50"
              >
                <div>
                  <div className="text-sm font-semibold text-ink/88 dark:text-white/88">Preferred study mode</div>
                  <div className="mt-1 text-xs text-ink/46 dark:text-white/52">{studyModeLabel}</div>
                </div>
                <span className="text-ink/38 dark:text-white/50">›</span>
              </button>
              <button
                type="button"
                onClick={() => setPage("assumed-words")}
                className="flex w-full items-center justify-between rounded-[16px] border border-line/70 bg-panel/78 px-4 py-3 text-left transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:bg-panel dark:border-line/50"
              >
                <div>
                  <div className="text-sm font-semibold text-ink/88 dark:text-white/88">Assumed words</div>
                  <div className="mt-1 text-xs text-ink/46 dark:text-white/52">{assumedWordSummary}</div>
                </div>
                <span className="text-ink/38 dark:text-white/50">›</span>
              </button>
              <button
                type="button"
                onClick={() => setPage("chinese-flow")}
                className="flex w-full items-center justify-between rounded-[16px] border border-line/70 bg-panel/78 px-4 py-3 text-left transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:bg-panel dark:border-line/50"
              >
                <div>
                  <div className="text-sm font-semibold text-ink/88 dark:text-white/88">Chinese review flow</div>
                  <div className="mt-1 text-xs text-ink/46 dark:text-white/52">{chineseFlowLabel}</div>
                </div>
                <span className="text-ink/38 dark:text-white/50">›</span>
              </button>
            </div>
          ) : null}

          {page === "daily-goal" ? (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
                Daily new words
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    settings.dailyGoal > 1 &&
                    void save({ dailyGoal: settings.dailyGoal - 1 })
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line/70 bg-panel/78 text-lg font-semibold text-ink/60 transition-[transform,opacity,box-shadow] hover:bg-panel dark:border-line/50 dark:text-white/60"
                >
                  −
                </button>
                <div className="min-w-[3rem] text-center text-2xl font-semibold tabular-nums text-ink/88 dark:text-white/90">
                  {settings.dailyGoal}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    settings.dailyGoal < 25 &&
                    void save({ dailyGoal: settings.dailyGoal + 1 })
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line/70 bg-panel/78 text-lg font-semibold text-ink/60 transition-[transform,opacity,box-shadow] hover:bg-panel dark:border-line/50 dark:text-white/60"
                >
                  +
                </button>
              </div>
            </div>
          ) : null}

          {page === "study-languages" ? (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
                Study languages
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {languages.map((lang) => {
                  const active = settings.selectedLanguageCodes.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() =>
                        void save({
                          selectedLanguageCodes: toggleLang(
                            settings.selectedLanguageCodes,
                            lang.code
                          )
                        })
                      }
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-[transform,opacity,box-shadow] ${
                        active
                          ? "border-clay/40 bg-clay/12 text-clay dark:border-clay/50 dark:bg-clay/20"
                          : "border-line/70 bg-panel/78 text-ink/50 hover:border-clay/30 hover:text-clay dark:border-line/50 dark:text-white/50"
                      }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {page === "assumed-words" ? (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
                Assumed words
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/56 dark:text-white/56">
                Pick the lists we should treat as already familiar. For now, assumed words can only
                be configured by whole list.
              </p>
              <div className="mt-4 space-y-2">
                {assumedWordLists.map((list) => {
                  const active = settings.assumedWordListIds.includes(list.id);
                  return (
                    <button
                      key={list.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        void save({
                          assumedWordListIds: toggleValue(settings.assumedWordListIds, list.id)
                        })
                      }
                      className={`flex w-full items-start justify-between gap-4 rounded-[18px] border px-4 py-3 text-left transition-[transform,opacity,box-shadow] ${
                        active
                          ? "border-clay/40 bg-clay/12 dark:border-clay/50 dark:bg-clay/20"
                          : "border-line/70 bg-panel/78 hover:border-clay/30 hover:bg-panel dark:border-line/50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink/88 dark:text-white/88">
                          {list.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-ink/48 dark:text-white/52">
                          {list.description}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="rounded-full border border-line/70 bg-paper/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/56 dark:border-line/40 dark:bg-white/8 dark:text-white/58">
                          {list.itemCount} words
                        </span>
                        {active ? (
                          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-white dark:text-black">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {page === "study-mode" ? (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
                Preferred study mode
              </div>
              <div className="mt-3 flex items-center gap-1 rounded-full border border-line/60 bg-paper/40 p-1 dark:border-line/40">
                {studyModes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => void save({ preferredStudyMode: m.id })}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-[transform,opacity,box-shadow] ${
                      settings.preferredStudyMode === m.id
                        ? "bg-ink text-white dark:bg-white dark:text-black"
                        : "text-ink/58 hover:text-ink dark:text-white/50 dark:hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {page === "chinese-flow" ? (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
                Chinese review flow
              </div>
              <div className="mt-3 flex items-center gap-1 rounded-full border border-line/60 bg-paper/40 p-1 dark:border-line/40">
                {chineseReviewFlows.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => void save({ chineseReviewFlow: mode.id })}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-[transform,opacity,box-shadow] ${
                      settings.chineseReviewFlow === mode.id
                        ? "bg-ink text-white dark:bg-white dark:text-black"
                        : "text-ink/58 hover:text-ink dark:text-white/50 dark:hover:text-white"
                    }`}
                    title={mode.helper}
                    aria-label={`${mode.label}: ${mode.helper}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {page === "theme" ? (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-white/40">
                Theme palette
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {themePalettes.map((preset) => {
                  const active = palette === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPalette(preset.key)}
                      className={`rounded-[16px] border px-3 py-3 text-left transition-[transform,opacity,box-shadow] ${
                        active
                          ? "border-ink/25 bg-panel/94 dark:border-white/24 dark:bg-white/8"
                          : "border-line/70 bg-panel/76 hover:border-line dark:border-line/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-ink/86 dark:text-white/88">
                          {preset.name}
                        </span>
                        {active ? (
                          <span className="rounded-full border border-line/70 bg-paper/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ink/62 dark:border-line/40 dark:bg-white/8 dark:text-white/65">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {preset.swatches.map((tone) => (
                          <span
                            key={`${preset.key}-${tone}`}
                            className="h-6 rounded-full border border-black/8 dark:border-white/10"
                            style={{ backgroundColor: tone }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-full px-10 py-3.5 text-base font-semibold text-white dark:text-black transition-[transform,opacity,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-95"
          style={{
            backgroundColor: "rgb(var(--color-accent))",
            boxShadow: "0 14px 36px rgb(var(--color-accent) / 0.3)"
          }}
        >
          Done
        </button>
        <div className="mt-4 text-center text-sm text-ink/30 dark:text-white/35">
          Press Esc to close
        </div>
      </div>
    </div>,
    document.body
  );
}
