"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import type {
  DashboardRangeDays,
  DashboardSnapshot,
  ReviewsDueDatum,
  StudyConsistencyDatum,
  SupportedLanguageCode,
  VocabularyGrowthDatum
} from "@/lib/demo/types";

const ranges: readonly DashboardRangeDays[] = [7, 30];

function getLanguageSelectionKey(languageCodes: SupportedLanguageCode[]) {
  return languageCodes.join("|");
}

function RangeSelect({
  value,
  onChange
}: {
  value: DashboardRangeDays;
  onChange: (value: DashboardRangeDays) => void;
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
              ? "bg-[rgb(var(--color-gold))] text-white dark:text-black"
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

function getReviewsAxisLabel(index: number) {
  return `${index + 1}d`;
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
  const rawMax = Math.max(...visible.map((entry) => entry.value), 1);
  const axisStep = rawMax <= 8 ? 2 : rawMax <= 24 ? 4 : rawMax <= 80 ? 10 : rawMax <= 200 ? 20 : 50;
  const axisMax = Math.max(axisStep, Math.ceil(rawMax / axisStep) * axisStep);
  const plotHeight = range <= 7 ? 122 : 138;
  const labelReserve = 24;
  const chartHeight = plotHeight + labelReserve;

  return (
    <div className="mt-5">
      <div className="relative rounded-[14px]">
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-10"
          style={{ paddingTop: `${labelReserve}px` }}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-t border-line/40" />
          ))}
        </div>
        <div className="relative flex items-end gap-1.5 border-b border-line/70 pb-2 px-1">
          {visible.map((entry, index) => {
            const rawHeight = entry.value === 0 ? 0 : (entry.value / axisMax) * plotHeight;
            const barHeight = entry.value === 0 ? 3 : Math.max(2, rawHeight);
            const labelBottom = Math.min(barHeight + 6, plotHeight + 4);
            const isFirst = index === 0;
            const isLast = index === visible.length - 1;
            const needsEdgeInset = (isFirst || isLast) && String(entry.value).length >= 3;
            const labelPositionClass = needsEdgeInset
              ? isFirst
                ? "left-2 text-left"
                : "right-2 text-right"
              : "left-1/2 -translate-x-1/2 text-center";

            return (
              <div key={`${entry.label}-${index}`} className="flex min-w-0 flex-1 items-end">
                <div className="relative flex w-full items-end" style={{ height: `${chartHeight}px` }}>
                  {entry.value > 0 ? (
                    <div
                      className={`pointer-events-none absolute z-[1] text-[11px] font-medium text-ink/54 sm:text-sm ${labelPositionClass}`}
                      style={{ bottom: `${labelBottom}px` }}
                    >
                      {entry.value}
                    </div>
                  ) : null}
                  <div
                    className="w-full rounded-t-[10px]"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor:
                        entry.value === 0
                          ? "rgb(var(--color-mist) / 0.5)"
                          : index === 0
                            ? "rgb(var(--color-gold))"
                            : "rgb(var(--color-clay) / 0.86)"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex gap-1.5 border-b border-line/70 pb-4 text-[11px] text-ink/48 sm:text-sm px-1">
        {visible.map((entry, index) => (
          <div key={`${entry.shortLabel}-${index}`} className="min-w-0 flex-1 text-center">
            {shouldShowLabel(range, index, visible.length) ? getReviewsAxisLabel(index) : ""}
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
          <div className="pointer-events-none absolute inset-0 bottom-10">
            {Array.from({ length: 3 }).map((_, index) =>
              index === 2 ? null : (
                <div
                  key={index}
                  className="absolute left-0 right-0 border-t border-line/40"
                  style={{ top: `${(index / 2) * 100}%` }}
                />
              )
            )}
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
                          backgroundColor: "rgb(var(--color-gold))"
                        }}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-1.5 text-[11px] text-ink/48 sm:gap-2 sm:text-sm">
            {visible.map((entry, index) => (
              <div key={`${entry.shortLabel}-${index}`} className="min-w-0 flex-1 text-center">
                {shouldShowGrowthLabel(range, index, visible.length)
                  ? getGrowthAxisLabel(entry, index, visible.length)
                  : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsistencyGrid({ data }: { data: StudyConsistencyDatum[] }) {
  return (
    <div className="grid grid-cols-7 gap-x-2 gap-y-2 sm:gap-x-2.5 sm:gap-y-2.5">
      {data.map((entry, index) => (
        <div
          key={`${entry.label}-${index}`}
          title={entry.label}
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-[background-color,border-color,box-shadow] sm:h-5.5 sm:w-5.5 ${
            entry.active
              ? "border-[rgb(var(--color-clay)/0.58)] bg-[rgb(var(--color-clay)/0.92)] shadow-[0_1px_6px_rgb(var(--color-clay)/0.28)] text-white dark:text-black"
              : "border-[rgb(var(--color-line)/0.68)] bg-[rgb(var(--color-paper)/0.56)] dark:border-[rgb(255_255_255/0.2)] dark:bg-[rgb(255_255_255/0.08)]"
          } ${entry.isToday ? "ring-2 ring-clay/35 dark:ring-clay/55" : ""}`}
        >
          {entry.active ? <span className="text-[11px] font-semibold leading-none sm:text-xs">✓</span> : null}
        </div>
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
    <section className="relative min-w-0 overflow-hidden">
      <div className="dashboard-today-hero h-full min-h-[104px] rounded-[20px] border px-4 py-2.5 sm:min-h-[116px] sm:px-4 sm:py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/70 dark:text-black/55">Today</div>
          <div className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.07em] text-white dark:text-black sm:text-[50px]">
            {dashboard.dueCount}
          </div>
        </div>
        <div className="mt-1 text-[1.15rem] font-medium leading-none tracking-[-0.04em] text-white/95 dark:text-black/85 sm:text-[1.24rem]">
          cards due today
        </div>
      </div>
    </section>
  );
}

function TodayMiniStack({ dashboard }: { dashboard: DashboardSnapshot }) {
  return (
    <section className="min-w-0">
      <div className="grid h-full min-h-[104px] grid-rows-2 gap-1.5 sm:min-h-[116px] sm:gap-2">
        <div className="dashboard-today-mini flex flex-col justify-center rounded-[14px] border px-3 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38 dark:text-white/82">Reviewed</div>
          <div className="mt-0.5 flex items-end gap-1.5">
            <div className="text-[27px] leading-none tracking-[-0.05em] text-ink/92 dark:text-white">{dashboard.reviewsToday}</div>
            <div className="pb-[2px] text-[11px] uppercase tracking-[0.14em] text-ink/42 dark:text-white/88">today</div>
          </div>
        </div>
        <div className="dashboard-today-mini flex flex-col justify-center rounded-[14px] border px-3 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38 dark:text-white/82">New words</div>
          <div className="mt-0.5 flex items-end gap-1.5">
            <div className="text-[27px] leading-none tracking-[-0.05em] text-ink/92 dark:text-white">{dashboard.introducedToday}</div>
            <div className="pb-[2px] text-[11px] uppercase tracking-[0.14em] text-ink/42 dark:text-white/88">today</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QueueCard({
  dashboard,
  saveError,
  onToggleLanguage,
  onActivateAll
}: {
  dashboard: DashboardSnapshot;
  saveError: string | null;
  onToggleLanguage: (code: SupportedLanguageCode) => void;
  onActivateAll: () => void;
}) {
  const allActive = dashboard.activeLanguageCodes.length === dashboard.availableLanguages.length;
  const activeChipClass =
    "border-[rgb(255_153_28/0.62)] bg-[#FF991C] text-white dark:text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.36)] hover:brightness-[0.98]";
  const inactiveChipClass =
    "border-line/70 bg-paper/68 text-ink/60 hover:border-clay/24 hover:bg-clay/6 hover:text-ink/78";

  return (
    <section className="min-w-0 h-full">
      <div className="h-full min-h-[104px] rounded-[18px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.46))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] sm:min-h-[116px] sm:px-3.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink/38">Languages</div>
            <div className="mt-0.5 text-[0.98rem] leading-5 tracking-[-0.04em] text-ink/92 sm:text-[1.02rem]">Choose what to show today</div>
          </div>
          <button
            type="button"
            onClick={onActivateAll}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] transition-[transform,opacity,box-shadow] ${
              allActive ? activeChipClass : inactiveChipClass
            }`}
          >
            All
          </button>
        </div>

        <div className="mt-1.5">
          <div className="flex flex-wrap gap-1">
            {dashboard.availableLanguages.map((language) => {
              const active = dashboard.activeLanguageCodes.includes(language.code);

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => onToggleLanguage(language.code)}
                  className={`rounded-full border px-2.5 py-1 text-[0.92rem] font-semibold transition-[transform,opacity,box-shadow] ${
                    active ? activeChipClass : inactiveChipClass
                  }`}
                >
                  {language.name}
                </button>
              );
            })}
          </div>
        </div>

        {saveError ? <div className="mt-3 text-xs text-red-600">{saveError}</div> : null}
      </div>
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
    <section>
      <div className="rounded-[20px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.46))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] sm:px-5 sm:py-5">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[28px] font-semibold tracking-[-0.05em] text-ink/92 sm:text-[30px]">Reviews Due</div>
            <RangeSelect value={range} onChange={onRangeChange} />
          </div>
          <div className="mt-1 text-sm text-ink/48">Projected workload across {activeLanguageLabels}.</div>
        </div>
        <ReviewsDueChart data={dashboard.reviewsDueSeries} range={range} />
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
    <section>
      <div className="rounded-[20px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.46))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] sm:px-5 sm:py-5">
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
                style={{ backgroundColor: "rgb(var(--color-gold))" }}
              />
              learning
            </span>
          </div>
        </div>
        <VocabularyGrowthChart data={dashboard.vocabularyGrowthSeries} range={range} />
        <div className="mt-2.5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { label: "Active words", value: dashboard.activeWords, unit: null },
              { label: "Learning rate", value: dashboard.averageNewPerDay, unit: "words/day" },
              { label: "Lifetime reviews", value: dashboard.totalReviews, unit: null }
            ].map((stat) => (
              <div
                key={stat.label}
                className="min-w-[170px] flex-1 rounded-[12px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.42))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]"
              >
                <div className="text-[9px] uppercase tracking-[0.15em] text-ink/36">{stat.label}</div>
                <div className="mt-1 flex items-end gap-1">
                  <div className="text-[1.15rem] leading-none tracking-[-0.03em] text-ink/90">{stat.value}</div>
                  {stat.unit && <div className="pb-[1px] text-[9px] uppercase tracking-[0.12em] text-ink/45">{stat.unit}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StreakCard({ dashboard }: { dashboard: DashboardSnapshot }) {
  const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <section>
      <div className="rounded-[20px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.46))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] sm:px-5 sm:py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,250px)_minmax(0,1fr)] lg:items-stretch">
          <div className="rounded-[16px] border border-[rgb(255_153_28/0.62)] bg-[#FF991C] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.36)] dark:border-[rgb(255_153_28/0.72)] dark:bg-[#FF991C]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white dark:text-black">Streak</div>
            <div className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/22 ring-1 ring-white/45 dark:bg-black/14 dark:ring-black/28">
              <span className="text-[1.1rem] leading-none text-white dark:text-black">🔥</span>
            </div>
            <div className="mt-2.5 flex items-end gap-2">
              <div className="text-[58px] leading-none tracking-[-0.07em] text-white dark:text-black">{dashboard.streakDays}</div>
              <div className="pb-2 text-[1.05rem] tracking-[-0.02em] text-white dark:text-black">
                {dashboard.streakDays === 1 ? "day streak" : "days streak"}
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-[16px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.44))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.36)] dark:border-[rgb(255_255_255/0.14)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] sm:px-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/42 dark:text-white/74">Last 5 weeks</div>
            <div className="mb-2 grid grid-cols-7 gap-x-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-ink/42 dark:text-white/70 sm:gap-x-2.5">
              {weekdayLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>
            <ConsistencyGrid data={dashboard.consistencySeries} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CorpusCard({ dashboard }: { dashboard: DashboardSnapshot }) {
  return (
    <section>
      <div className="rounded-[20px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0.46))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] sm:px-5 sm:py-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink/38">Corpus</div>
        <div className="mt-2.5 flex items-stretch gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { label: "Ranked words", value: dashboard.corpusSize },
            { label: "Examples", value: `${dashboard.exampleCoveragePercent}%` },
            { label: "Audio coverage", value: `${dashboard.audioCoveragePercent}%` }
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-[170px] flex-1 items-end justify-between gap-3 rounded-[12px] border border-line/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.42))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]"
            >
              <div className="text-[13px] text-ink/56">{stat.label}</div>
              <div className="text-[34px] leading-none tracking-[-0.05em] text-ink/92">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardShell({ dashboard: initialDashboard }: { dashboard: DashboardSnapshot }) {
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(initialDashboard);
  const [range, setRange] = useState<DashboardRangeDays>(initialDashboard.dashboardRangeDays);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const rangeTouchedRef = useRef(false);
  const snapshotCacheRef = useRef<Record<string, DashboardSnapshot>>({
    [getLanguageSelectionKey(initialDashboard.activeLanguageCodes)]: initialDashboard
  });

  useEffect(() => {
    setDashboard(initialDashboard);
    setRange(initialDashboard.dashboardRangeDays);
    rangeTouchedRef.current = false;
    snapshotCacheRef.current[getLanguageSelectionKey(initialDashboard.activeLanguageCodes)] = initialDashboard;

    // Fetch fresh dashboard data on mount to reconcile stale Next.js router cache
    let cancelled = false;
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh: DashboardSnapshot | null) => {
        if (cancelled || !fresh) return;
        snapshotCacheRef.current[getLanguageSelectionKey(fresh.activeLanguageCodes)] = fresh;
        setDashboard(fresh);
        if (!rangeTouchedRef.current) {
          setRange(fresh.dashboardRangeDays);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialDashboard]);


  const filterByLanguages = (nextLanguageCodes: SupportedLanguageCode[]) => {
    setSaveError(null);

    const cachedSnapshot = snapshotCacheRef.current[getLanguageSelectionKey(nextLanguageCodes)];
    if (cachedSnapshot) {
      setDashboard(cachedSnapshot);
    } else {
      // Optimistic local update
      setDashboard({ ...dashboard, activeLanguageCodes: nextLanguageCodes });
    }

    // Persist dashboard language selection from dashboard itself.
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardLanguageCodes: nextLanguageCodes })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { dashboard?: DashboardSnapshot } | null) => {
        if (requestId !== requestIdRef.current) return;
        const fresh = payload?.dashboard ?? null;
        if (!fresh) {
          setSaveError("Could not refresh dashboard for those language filters.");
          return;
        }
        snapshotCacheRef.current[getLanguageSelectionKey(fresh.activeLanguageCodes)] = fresh;
        setDashboard(fresh);
        setSaveError(null);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setSaveError("Could not refresh dashboard for those language filters.");
      });
  };

  const toggleLanguage = (code: SupportedLanguageCode) => {
    const nextLanguageCodes = dashboard.activeLanguageCodes.includes(code)
      ? dashboard.activeLanguageCodes.filter((candidate) => candidate !== code)
      : [...dashboard.activeLanguageCodes, code];

    if (nextLanguageCodes.length === 0) {
      return;
    }

    filterByLanguages(nextLanguageCodes);
  };

  const activateAllLanguages = () => {
    if (dashboard.activeLanguageCodes.length === dashboard.availableLanguages.length) {
      filterByLanguages([]);
      return;
    }
    const allLanguageCodes = dashboard.availableLanguages.map((language) => language.code);
    filterByLanguages(allLanguageCodes);
  };

  const handleRangeChange = (nextRange: DashboardRangeDays) => {
    rangeTouchedRef.current = true;
    setRange(nextRange);
    setDashboard((current) => ({ ...current, dashboardRangeDays: nextRange }));
    snapshotCacheRef.current[getLanguageSelectionKey(dashboard.activeLanguageCodes)] = {
      ...dashboard,
      dashboardRangeDays: nextRange
    };

    void fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardRangeDays: nextRange })
    }).catch(() => {});
  };

  const activeLanguageLabels = dashboard.availableLanguages
    .filter((language) => dashboard.activeLanguageCodes.includes(language.code))
    .map((language) => language.name)
    .join(" + ") || "no active languages selected";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-stretch gap-3 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.46fr)_minmax(0,0.92fr)] xl:gap-4">
        <TodayCard dashboard={dashboard} />
        <TodayMiniStack dashboard={dashboard} />
        <div className="col-span-2 xl:col-span-1">
          <QueueCard
            dashboard={dashboard}
            saveError={saveError}
            onToggleLanguage={toggleLanguage}
            onActivateAll={activateAllLanguages}
          />
        </div>
      </div>

      <ReviewsSection
        dashboard={dashboard}
        range={range}
        onRangeChange={handleRangeChange}
        activeLanguageLabels={activeLanguageLabels}
      />
      <StreakCard dashboard={dashboard} />
      <VocabularySection dashboard={dashboard} range={range} />
      <CorpusCard dashboard={dashboard} />
    </div>
  );
}
