"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  DashboardSnapshot,
  ReviewsDueDatum,
  StudyConsistencyDatum,
  VocabularyGrowthDatum
} from "@/lib/demo/types";

const ranges = [7, 30] as const;

function RangeSelect({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="v2-segmented">
      {ranges.map((range) => (
        <button key={range} type="button" data-active={value === range} onClick={() => onChange(range)}>
          {range} days
        </button>
      ))}
    </div>
  );
}

function shouldShowLabel(index: number, length: number, range: number) {
  if (range === 7) {
    return true;
  }

  return index === 0 || index === length - 1 || index % 3 === 0;
}

function ReviewsChart({ data, range }: { data: ReviewsDueDatum[]; range: number }) {
  const visible = data.slice(0, range);
  const maxValue = Math.max(...visible.map((entry) => entry.value), 1);

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="v2-chart-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} />
          ))}
        </div>
        <div className="relative flex h-[240px] items-end gap-2 border-b border-[var(--v2-line)] pb-3">
          {visible.map((entry, index) => {
            const height = entry.value === 0 ? 4 : Math.max(16, (entry.value / maxValue) * 188);

            return (
              <div key={`${entry.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="v2-tabular text-[11px] v2-muted-soft">{entry.value > 0 ? entry.value : ""}</div>
                <div
                  className="w-full rounded-t-[12px]"
                  style={{
                    height,
                    background:
                      index === 0
                        ? "linear-gradient(180deg, rgba(246,198,112,0.96), rgba(235,145,81,0.86))"
                        : entry.value === 0
                          ? "rgba(37,26,18,0.08)"
                          : "linear-gradient(180deg, rgba(37,26,18,0.24), rgba(37,26,18,0.14))"
                  }}
                />
                <div className="h-4 text-[10px] uppercase tracking-[0.18em] v2-muted-soft">
                  {shouldShowLabel(index, visible.length, range) ? entry.shortLabel : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GrowthChart({ data, range }: { data: VocabularyGrowthDatum[]; range: number }) {
  const visible = data.slice(data.length - range);
  const maxTotal = Math.max(...visible.map((entry) => entry.learning + entry.solid + entry.notIntroduced), 1);

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="v2-chart-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} />
          ))}
        </div>
        <div className="relative flex h-[220px] items-end gap-1.5 border-b border-[var(--v2-line)] pb-3">
          {visible.map((entry, index) => {
            const total = entry.learning + entry.solid + entry.notIntroduced;

            return (
              <div key={`${entry.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="relative w-full overflow-hidden rounded-t-[12px]"
                  style={{
                    height: `${Math.max(18, (total / maxTotal) * 188)}px`,
                    background: "rgba(37,26,18,0.08)"
                  }}
                >
                  {entry.learning > 0 ? (
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: `${(entry.learning / total) * 100}%`,
                        background: "linear-gradient(180deg, rgba(201,143,100,0.92), rgba(201,143,100,0.76))"
                      }}
                    />
                  ) : null}
                  {entry.solid > 0 ? (
                    <div
                      className="absolute inset-x-0"
                      style={{
                        bottom: `${(entry.learning / total) * 100}%`,
                        height: `${(entry.solid / total) * 100}%`,
                        background: "linear-gradient(180deg, rgba(109,134,113,0.96), rgba(147,174,151,0.86))"
                      }}
                    />
                  ) : null}
                </div>
                <div className="h-4 text-[10px] uppercase tracking-[0.18em] v2-muted-soft">
                  {shouldShowLabel(index, visible.length, range) ? entry.shortLabel : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConsistencyGrid({ data }: { data: StudyConsistencyDatum[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((entry, index) => (
        <div
          key={`${entry.label}-${index}`}
          title={entry.label}
          className="h-4 w-4 rounded-[5px] border"
          style={{
            borderColor: entry.active ? "rgba(109,134,113,0.44)" : "rgba(37,26,18,0.08)",
            background: entry.active ? "rgba(109,134,113,0.9)" : "rgba(37,26,18,0.06)",
            boxShadow: entry.isToday ? "0 0 0 3px rgba(246,198,112,0.18)" : "none"
          }}
        />
      ))}
    </div>
  );
}

export function V2DashboardShell({ dashboard }: { dashboard: DashboardSnapshot }) {
  const [range, setRange] = useState<number>(30);
  const consistency = dashboard.consistencySeries.slice(-28);

  return (
    <div className="space-y-5">
      <section className="v2-command rounded-[30px] px-5 py-6 sm:px-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.82fr_0.82fr_1.08fr] xl:items-end">
          <div>
            <div className="v2-eyebrow">Today</div>
            <div className="v2-kpi v2-tabular mt-5">{dashboard.dueCount}</div>
            <p className="mt-3 max-w-sm text-base leading-7 v2-on-dark-muted">
              reviews are waiting, with about {dashboard.studyPlan.estimatedMinutes} minutes of total study planned.
            </p>
            <div className="mt-5">
              <Link href="/v2/study" className="v2-button-primary">
                Start Study
              </Link>
            </div>
          </div>

          <div>
            <div className="v2-label">Next window</div>
            <div className="mt-3 text-3xl tracking-[-0.05em]">{dashboard.nextDueLabel}</div>
            <div className="mt-2 text-sm leading-7 v2-on-dark-faint">
              Tomorrow estimate: {dashboard.studyPlan.tomorrowDueEstimate}
            </div>
          </div>

          <div>
            <div className="v2-label">Streak</div>
            <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em]">{dashboard.streakDays} days</div>
            <div className="mt-2 text-sm leading-7 v2-on-dark-faint">
              {dashboard.retentionScore}% recall health across active words
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5">
            <div className="v2-label">Focus word</div>
            {dashboard.focusItem ? (
              <>
                <Link href={`/v2/words/${dashboard.focusItem.itemId}`} className="mt-3 block text-4xl tracking-[-0.06em] transition-[transform,opacity,box-shadow] hover:opacity-80">
                  {dashboard.focusItem.displayForm}
                </Link>
                <div className="mt-2 text-base v2-on-dark-muted">{dashboard.focusItem.primaryGloss}</div>
                <p className="mt-3 text-sm leading-7 v2-on-dark-faint">{dashboard.focusItem.reason}</p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-7 v2-on-dark-muted">Your next high-value word will appear here.</p>
            )}
          </div>
        </div>
      </section>

      <section className="v2-card rounded-[30px] p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="v2-label">Workload</div>
            <h2 className="mt-3 text-[2.4rem] leading-[0.96]">Reviews Due</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 v2-muted">
              A clean forecast of the review pressure in front of you, with today highlighted first.
            </p>
          </div>
          <RangeSelect value={range} onChange={setRange} />
        </div>

        <ReviewsChart data={dashboard.reviewsDueSeries} range={range} />

        <div className="mt-6 grid gap-4 border-t border-[var(--v2-line)] pt-5 sm:grid-cols-3">
          {[
            { label: "Due today", value: dashboard.dueCount },
            { label: "Reviews today", value: dashboard.reviewsToday },
            { label: "New today", value: dashboard.studyPlan.newCards }
          ].map((item) => (
            <div key={item.label}>
              <div className="v2-label">{item.label}</div>
              <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em]">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.84fr_1.16fr]">
        <section className="v2-card rounded-[30px] p-6">
          <div className="v2-label">Streak</div>
          <h2 className="mt-3 text-[2.15rem] leading-[0.98]">Study Rhythm</h2>
          <p className="mt-3 text-sm leading-7 v2-muted">
            The last four weeks of study activity, with today ringed so you can see continuity at a glance.
          </p>

          <div className="mt-6 flex items-start justify-between gap-6">
            <ConsistencyGrid data={consistency} />
            <div className="min-w-[108px]">
              <div className="v2-tabular text-5xl tracking-[-0.07em]">{dashboard.streakDays}</div>
              <div className="mt-2 text-sm v2-muted">days in a row</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-[var(--v2-line)] pt-5 sm:grid-cols-2">
            <div>
              <div className="v2-label">Daily goal</div>
              <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em]">{dashboard.dailyGoal}</div>
            </div>
            <div>
              <div className="v2-label">Available new</div>
              <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em]">{dashboard.newAvailableCount}</div>
            </div>
          </div>
        </section>

        <section className="v2-card rounded-[30px] p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="v2-label">Memory growth</div>
              <h2 className="mt-3 text-[2.4rem] leading-[0.96]">Vocabulary Growth</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] v2-muted">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--v2-olive)]" />
                solid
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--v2-clay)]" />
                learning
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[rgba(37,26,18,0.14)]" />
                remaining
              </span>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-7 v2-muted">
            How active study is turning into durable vocabulary instead of piling up as fragile recall.
          </p>

          <GrowthChart data={dashboard.vocabularyGrowthSeries} range={range} />

          <div className="mt-6 grid gap-4 border-t border-[var(--v2-line)] pt-5 sm:grid-cols-3">
            {[
              { label: "Active words", value: dashboard.activeWords },
              { label: "Coverage", value: `${dashboard.coveragePercent}%` },
              { label: "Lifetime reviews", value: dashboard.totalReviews }
            ].map((item) => (
              <div key={item.label}>
                <div className="v2-label">{item.label}</div>
                <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em]">{item.value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
