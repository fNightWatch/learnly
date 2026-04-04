"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import type {
  DashboardSnapshot,
  ReviewsDueDatum,
  StudyConsistencyDatum,
  SupportedLanguageCode,
  VocabularyGrowthDatum
} from "@/lib/demo/types";

const ranges = [7, 30] as const;

function getLanguageSelectionKey(languageCodes: SupportedLanguageCode[]) {
  return languageCodes.join("|");
}

function RangeSelect({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line/70 bg-paper/74 p-1">
      {ranges.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-[transform,opacity,box-shadow] ${
            value === range
              ? "bg-night text-white dark:bg-white dark:text-night shadow-[0_10px_24px_rgba(23,18,16,0.16)]"
              : "text-ink/55 hover:text-clay"
          }`}
        >
          {range} days
        </button>
      ))}
    </div>
  );
}

function shouldShowLabel(range: number, index: number, total: number) {
  if (range <= 7) {
    return true;
  }

  return index === 0 || index === total - 1 || index % 3 === 0;
}

function getGrowthPointLabel(entry: VocabularyGrowthDatum, index: number, total: number) {
  if (entry.label) {
    return entry.label;
  }

  const daysBack = total - index - 1;

  if (daysBack <= 0) {
    return "Today";
  }

  return `${daysBack} day${daysBack === 1 ? "" : "s"} ago`;
}

function getGrowthAxisLabel(entry: VocabularyGrowthDatum, index: number, total: number) {
  if (entry.shortLabel === "Today") {
    return "Today";
  }

  if (entry.shortLabel.endsWith("days ago")) {
    return `${entry.shortLabel.split(" ")[0]}d`;
  }

  if (entry.shortLabel) {
    return entry.shortLabel;
  }

  const daysBack = total - index - 1;

  if (daysBack <= 0) {
    return "Today";
  }

  return `${daysBack}d`;
}

function shouldShowGrowthLabel(range: number, index: number, total: number) {
  if (range <= 7) {
    return true;
  }

  return index === 0 || index === total - 1 || index % 6 === 0;
}

function ReviewsDueChart({
  data,
  range
}: {
  data: ReviewsDueDatum[];
  range: number;
}) {
  const visible = data.slice(0, range);
  const maxValue = Math.max(...visible.map((entry) => entry.value), 1);

  return (
    <div className="mt-5">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bottom-10 flex flex-col justify-between">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-t border-line/40" />
          ))}
        </div>
        <div className="relative flex h-[144px] items-end gap-1.5 border-b border-line/70 pb-2 sm:h-[184px]">
          {visible.map((entry, index) => {
            const height = entry.value === 0 ? 5 : Math.max(12, (entry.value / maxValue) * 140);

            return (
              <div key={`${entry.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="text-[11px] font-medium text-ink/50 sm:text-sm">{entry.value > 0 ? entry.value : ""}</div>
                <div
                  className="w-full rounded-t-[10px]"
                  style={{
                    height,
                    backgroundColor:
                      entry.value === 0
                        ? "rgb(var(--color-mist) / 0.5)"
                        : index === 0
                          ? "rgb(var(--color-gold) / 0.96)"
                          : "rgb(var(--color-clay) / 0.86)"
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex gap-1.5 border-b border-line/70 pb-4 text-[11px] text-ink/48 sm:text-sm">
        {visible.map((entry, index) => (
          <div key={`${entry.shortLabel}-${index}`} className="min-w-0 flex-1 text-center">
            {shouldShowLabel(range, index, visible.length) ? entry.shortLabel : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function VocabularyGrowthChart({
  data,
  range
}: {
  data: VocabularyGrowthDatum[];
  range: number;
}) {
  const visible = data.slice(data.length - range);
  const maxLearned = Math.max(...visible.map((entry) => entry.learning + entry.solid), 1);
  const todayIndex = Math.max(visible.length - 1, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  useEffect(() => {
    setHoveredIndex(null);
    setPinnedIndex(null);
  }, [range, todayIndex]);

  const selectedIndex = Math.min(hoveredIndex ?? pinnedIndex ?? todayIndex, todayIndex);
  const selectedEntry = visible[selectedIndex];
  const selectedStrong = selectedEntry?.solid ?? 0;
  const selectedLearning = selectedEntry?.learning ?? 0;
  const isTodaySelected = selectedIndex === todayIndex;

  function handleBarBlur(event: FocusEvent<HTMLButtonElement>) {
    if (event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setHoveredIndex(null);
    setPinnedIndex(null);
  }

  function handleBarClick(index: number) {
    const nextPinnedIndex = pinnedIndex === index ? null : index;

    setPinnedIndex(nextPinnedIndex);
    setHoveredIndex(nextPinnedIndex === null ? null : index);
  }

  function handleBarKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Escape") {
      return;
    }

    setHoveredIndex(null);
    setPinnedIndex(null);
    event.currentTarget.blur();
  }

  return (
    <div className="mt-5">
      <div className="rounded-[24px] border border-line/70 bg-paper/58 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">{isTodaySelected ? "Today" : "Day"}</div>
            <div className="mt-2 text-xl tracking-[-0.04em] text-ink/92">
              {selectedEntry ? getGrowthPointLabel(selectedEntry, selectedIndex, visible.length) : "Today"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-line/70 bg-panel/76 px-4 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">Strong</div>
              <div className="mt-1 text-lg tracking-[-0.04em] text-ink/92">{selectedStrong}</div>
            </div>
            <div className="rounded-full border border-line/70 bg-panel/76 px-4 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">Learning</div>
              <div className="mt-1 text-lg tracking-[-0.04em] text-ink/92">{selectedLearning}</div>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="pointer-events-none absolute inset-0 bottom-10 flex flex-col justify-between">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border-t border-line/40" />
            ))}
          </div>
          <div
            className="relative flex h-[220px] items-end gap-1.5 border-b border-line/70 pb-2 sm:h-[260px] sm:gap-2"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {visible.map((entry, index) => {
              const learned = entry.learning + entry.solid;
              const learnedHeight = learned === 0 ? 8 : Math.max(18, (learned / maxLearned) * 208);

              return (
                <button
                  key={`${entry.shortLabel}-${index}`}
                  type="button"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={handleBarBlur}
                  onClick={() => handleBarClick(index)}
                  onKeyDown={handleBarKeyDown}
                  title={`${getGrowthPointLabel(entry, index, visible.length)}: ${entry.solid} strong, ${entry.learning} learning`}
                  aria-label={`${getGrowthPointLabel(entry, index, visible.length)}: ${entry.solid} strong, ${entry.learning} learning`}
                  aria-pressed={pinnedIndex === index}
                  className="flex min-w-0 flex-1 appearance-none items-end border-0 bg-transparent p-0"
                >
                  <div className="relative w-full overflow-hidden rounded-t-[12px]" style={{ height: `${learnedHeight}px` }}>
                    {entry.solid > 0 ? (
                      <div
                        className="absolute inset-x-0 bottom-0"
                        style={{
                          height: `${(entry.solid / learned) * 100}%`,
                          backgroundColor: "rgb(var(--color-pine) / 0.92)"
                        }}
                      />
                    ) : null}
                    {entry.learning > 0 ? (
                      <div
                        className="absolute inset-x-0 top-0"
                        style={{
                          height: `${(entry.learning / learned) * 100}%`,
                          backgroundColor: "rgb(var(--color-gold) / 0.82)"
                        }}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="relative mt-3 h-8 text-[11px] text-ink/48 sm:text-sm">
            {visible.map((entry, index) => {
              if (!shouldShowGrowthLabel(range, index, visible.length)) {
                return null;
              }

              const label = getGrowthAxisLabel(entry, index, visible.length);

              if (index === 0) {
                return (
                  <div key={`${entry.shortLabel}-${index}`} className="absolute left-0 top-0 whitespace-nowrap text-left">
                    {label}
                  </div>
                );
              }

              if (index === visible.length - 1) {
                return (
                  <div key={`${entry.shortLabel}-${index}`} className="absolute right-0 top-0 whitespace-nowrap text-right">
                    {label}
                  </div>
                );
              }

              return (
                <div
                  key={`${entry.shortLabel}-${index}`}
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-center"
                  style={{ left: `${((index + 0.5) / Math.max(visible.length, 1)) * 100}%` }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsistencyGrid({ data }: { data: StudyConsistencyDatum[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {data.map((entry, index) => (
        <div
          key={`${entry.label}-${index}`}
          title={entry.label}
          className={`h-3.5 w-3.5 rounded-full ${
            entry.active ? "bg-clay border-0" : "border border-line/70 bg-mist/56"
          } ${entry.isToday ? "ring-2 ring-clay/20" : ""}`}
        />
      ))}
    </div>
  );
}

function TodayCard({
  dashboard
}: {
  dashboard: DashboardSnapshot;
}) {
  return (
    <section
      className="card relative min-w-0 overflow-hidden px-4 py-3.5 backdrop-blur-none sm:px-5 sm:py-4"
    >
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/40">Today</div>
        <div className="mt-2 text-lg tracking-[-0.04em] text-ink/90 sm:text-xl">
          {dashboard.studyPlan.totalCards} cards ready today
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-[18px] border border-line/70 bg-panel/84 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">Reviewed</div>
            <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/90">{dashboard.reviewsToday}</div>
          </div>
          <div className="rounded-[18px] border border-line/70 bg-panel/84 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">New words</div>
            <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/90">{dashboard.introducedToday}</div>
          </div>
          <div className="rounded-[18px] border border-line/70 bg-panel/84 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">Still due</div>
            <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/90">{dashboard.dueCount}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QueueCard({
  dashboard,
  saveError,
  onToggleLanguage
}: {
  dashboard: DashboardSnapshot;
  saveError: string | null;
  onToggleLanguage: (code: SupportedLanguageCode) => void;
}) {
  return (
    <section className="card min-w-0 p-4 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/38">Languages</div>
          <div className="mt-2 text-base leading-6 tracking-[-0.04em] text-ink/92 sm:text-xl">Choose what to show today</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink/35">Study languages</div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {dashboard.availableLanguages.map((language) => {
            const active = dashboard.activeLanguageCodes.includes(language.code);

            return (
              <button
                key={language.code}
                type="button"
                onClick={() => onToggleLanguage(language.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-[transform,opacity,box-shadow] ${
                  active
                    ? "border-clay/30 bg-clay/10 text-ink/82"
                    : "border-line/70 bg-paper/68 text-ink/60 hover:border-clay/24 hover:bg-clay/6 hover:text-ink/78"
                }`}
              >
                {language.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { label: "Due first", value: dashboard.studyPlan.dueNow },
          { label: "Entering today", value: dashboard.studyPlan.newCards }
        ].map((stat) => (
          <div key={stat.label} className="rounded-[18px] border border-line/70 bg-paper/72 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">{stat.label}</div>
            <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/90">{stat.value}</div>
          </div>
        ))}
      </div>

      {saveError ? <div className="mt-4 text-xs text-red-600">{saveError}</div> : null}
    </section>
  );
}

function ReviewsSection({
  dashboard,
  range,
  onRangeChange,
  activeLanguageLabels
}: {
  dashboard: DashboardSnapshot;
  range: number;
  onRangeChange: (value: number) => void;
  activeLanguageLabels: string;
}) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[28px] font-semibold tracking-[-0.05em] text-ink/92 sm:text-[30px]">Reviews Due</div>
          <div className="mt-1 text-sm text-ink/48">Projected workload across {activeLanguageLabels}.</div>
        </div>
        <RangeSelect value={range} onChange={onRangeChange} />
      </div>
      <ReviewsDueChart data={dashboard.reviewsDueSeries} range={range} />
      <div className="grid gap-4 pt-4 sm:grid-cols-3">
        {[
          { label: "Due today", value: dashboard.dueCount },
          { label: "New words today", value: dashboard.studyPlan.newCards },
          { label: "Next window", value: dashboard.nextDueLabel }
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/35">{stat.label}</div>
            <div className="mt-2 text-2xl text-ink/88">{stat.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VocabularySection({
  dashboard,
  range
}: {
  dashboard: DashboardSnapshot;
  range: number;
}) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[28px] font-semibold tracking-[-0.05em] text-ink/92 sm:text-[30px]">Vocabulary Growth</div>
          <div className="mt-1 text-sm text-ink/48">How introductions are becoming durable active vocabulary.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink/46">
          <span className="rounded-full border border-line/70 bg-paper/66 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink/44">
            {range}-day view
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "rgb(var(--color-pine) / 0.92)" }}
            />
            strong
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "rgb(var(--color-gold) / 0.82)" }}
            />
            learning
          </span>
        </div>
      </div>
      <VocabularyGrowthChart data={dashboard.vocabularyGrowthSeries} range={range} />
      <div className="grid gap-4 border-t border-line/70 pt-4 sm:grid-cols-3">
        {[
          { label: "Active words", value: dashboard.activeWords },
          { label: "Coverage", value: `${dashboard.coveragePercent}%` },
          { label: "Lifetime reviews", value: dashboard.totalReviews }
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/35">{stat.label}</div>
            <div className="mt-2 text-2xl text-ink/88">{stat.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StreakCard({ dashboard }: { dashboard: DashboardSnapshot }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/38">Streak</div>
          <div className="mt-2 text-5xl tracking-[-0.06em] text-ink/92">{dashboard.streakDays}</div>
          <div className="mt-1 text-sm text-ink/55">
            {dashboard.streakDays === 1 ? "study day" : "study days"}
          </div>
        </div>
        <div className="rounded-full border border-line/70 bg-paper/72 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink/48">
          {dashboard.retentionScore}% retention
        </div>
      </div>
      <div className="mt-4">
        <ConsistencyGrid data={dashboard.consistencySeries} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line/70 pt-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/35">Reviewed today</div>
          <div className="mt-1 text-2xl text-ink/88">{dashboard.reviewsToday}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/35">Next window</div>
          <div className="mt-1 text-2xl text-ink/88">{dashboard.nextDueLabel}</div>
        </div>
      </div>
    </section>
  );
}

function CorpusCard({ dashboard }: { dashboard: DashboardSnapshot }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink/38">Corpus</div>
      <div className="mt-4 space-y-4">
        {[
          { label: "Ranked words", value: dashboard.corpusSize },
          { label: "Examples", value: `${dashboard.exampleCoveragePercent}%` },
          { label: "Audio coverage", value: `${dashboard.audioCoveragePercent}%` }
        ].map((stat) => (
          <div key={stat.label} className="flex items-end justify-between gap-4 border-b border-line/55 pb-3 last:border-b-0 last:pb-0">
            <div className="text-sm text-ink/56">{stat.label}</div>
            <div className="text-2xl tracking-[-0.05em] text-ink/92">{stat.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardShell({ dashboard: initialDashboard }: { dashboard: DashboardSnapshot }) {
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(initialDashboard);
  const [range, setRange] = useState<number>(30);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotCacheRef = useRef<Record<string, DashboardSnapshot>>({
    [getLanguageSelectionKey(initialDashboard.activeLanguageCodes)]: initialDashboard
  });

  useEffect(() => {
    setDashboard(initialDashboard);
    snapshotCacheRef.current[getLanguageSelectionKey(initialDashboard.activeLanguageCodes)] = initialDashboard;

    // Fetch fresh dashboard data on mount to reconcile stale Next.js router cache
    let cancelled = false;
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh: DashboardSnapshot | null) => {
        if (cancelled || !fresh) return;
        snapshotCacheRef.current[getLanguageSelectionKey(fresh.activeLanguageCodes)] = fresh;
        setDashboard(fresh);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialDashboard]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const persistSettings = (payload: { dashboardLanguageCodes?: SupportedLanguageCode[] }) => {
    const optimisticDashboard = dashboard;
    const nextLanguageCodes = payload.dashboardLanguageCodes ?? dashboard.activeLanguageCodes;
    const cachedSnapshot = snapshotCacheRef.current[getLanguageSelectionKey(nextLanguageCodes)];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setSaveError(null);

    setDashboard(
      cachedSnapshot
        ? cachedSnapshot
        : {
            ...dashboard,
            activeLanguageCodes: nextLanguageCodes
          }
    );

    // Save language choice immediately so it persists across navigation
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Silently ignore save-only errors; the snapshot refresh below will surface them
    });

    // Debounce the dashboard snapshot refresh to avoid rapid re-renders
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Could not update settings.");
        }

        const data: { dashboard: DashboardSnapshot } = await response.json();
        snapshotCacheRef.current[getLanguageSelectionKey(data.dashboard.activeLanguageCodes)] = data.dashboard;

        if (requestId === requestIdRef.current) {
          setDashboard(data.dashboard);
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setDashboard(optimisticDashboard);
          setSaveError(error instanceof Error ? error.message : "Could not update settings.");
        }
      }
    }, 140);
  };

  const toggleLanguage = (code: SupportedLanguageCode) => {
    const nextLanguageCodes = dashboard.activeLanguageCodes.includes(code)
      ? dashboard.activeLanguageCodes.filter((candidate) => candidate !== code)
      : [...dashboard.activeLanguageCodes, code];

    if (nextLanguageCodes.length === 0) {
      return;
    }

    persistSettings({ dashboardLanguageCodes: nextLanguageCodes });
  };

  const activeLanguageLabels = dashboard.availableLanguages
    .filter((language) => dashboard.activeLanguageCodes.includes(language.code))
    .map((language) => language.name)
    .join(" + ");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-4">
        <TodayCard dashboard={dashboard} />
        <QueueCard
          dashboard={dashboard}
          saveError={saveError}
          onToggleLanguage={toggleLanguage}
        />
      </div>

      <ReviewsSection
        dashboard={dashboard}
        range={range}
        onRangeChange={setRange}
        activeLanguageLabels={activeLanguageLabels}
      />
      <VocabularySection dashboard={dashboard} range={range} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
        <StreakCard dashboard={dashboard} />
        <CorpusCard dashboard={dashboard} />
      </div>
    </div>
  );
}
