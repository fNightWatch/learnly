import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

function MiniDueCurve({
  values
}: {
  values: Array<{ label: string; shortLabel: string; value: number }>;
}) {
  const maxValue = Math.max(...values.map((entry) => entry.value), 1);

  return (
    <div className="rounded-[24px] v2-inset p-4 sm:p-5">
      <div className="v2-label">Next 7 days</div>
      <div className="mt-5">
        <div className="relative">
          <div className="v2-chart-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} />
            ))}
          </div>
          <div className="relative flex h-40 items-end gap-2 border-b border-[var(--v2-line)] pb-2">
            {values.map((entry, index) => (
              <div key={`${entry.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="v2-tabular text-[11px] text-[var(--v2-muted-soft)]">
                  {entry.value > 0 ? entry.value : ""}
                </div>
                <div
                  className="w-full rounded-t-[14px]"
                  style={{
                    height: `${Math.max(6, (entry.value / maxValue) * 100)}%`,
                    background:
                      index === 0
                        ? "linear-gradient(180deg, rgba(242,179,84,0.95), rgba(235,145,81,0.82))"
                        : "linear-gradient(180deg, rgba(27,21,19,0.24), rgba(27,21,19,0.12))"
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {values.map((entry, index) => (
            <div key={`${entry.shortLabel}-${index}`} className="text-center text-[10px] uppercase tracking-[0.18em] text-[var(--v2-muted-soft)]">
              {entry.shortLabel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function V2HomePage() {
  const dashboard = getDashboardSnapshot(DEMO_USER_ID);
  const previewSeries = dashboard.reviewsDueSeries.slice(0, 7);
  const focusItem = dashboard.focusItem;

  return (
    <main className="v2-shell v2-page">
      <section className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-end">
        <div className="space-y-8">
          <div className="v2-eyebrow">Focused Spanish study</div>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl leading-[0.9] sm:text-6xl lg:text-[5.35rem]">
              Learn the Spanish words that matter first.
            </h1>
            <p className="max-w-2xl text-lg leading-8 v2-muted">
              Lemma gives you one daily queue, one fast study mode, and one visible record of every word you have
              already learned.
            </p>
            <p className="max-w-2xl text-base leading-7 v2-muted-soft">
              It is built for self-directed learners who want order, not course clutter, lesson trees, or noisy
              flashcards.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/v2/study" className="v2-button-primary">
              Start Study
            </Link>
            <Link href="/v2/dashboard" className="v2-button-secondary">
              Open Dashboard
            </Link>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { label: "Due today", value: dashboard.dueCount, note: "ready for recall" },
              { label: "Tracked words", value: dashboard.activeWords, note: "already in memory" },
              { label: "Current streak", value: `${dashboard.streakDays}d`, note: "days in a row" }
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] v2-inset px-5 py-4">
                <div className="v2-label">{item.label}</div>
                <div className="v2-tabular mt-3 text-4xl tracking-[-0.08em] text-[var(--v2-text)]">{item.value}</div>
                <div className="mt-2 text-sm v2-muted">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="v2-card rounded-[34px] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="v2-label">Today&apos;s queue</div>
              <h2 className="mt-3 text-3xl sm:text-[2.35rem]">Your next session, already arranged.</h2>
            </div>
            <Link href="/v2/words" className="text-sm font-medium text-[var(--v2-muted)] transition-[transform,opacity,box-shadow] hover:text-[var(--v2-text)]">
              View words
            </Link>
          </div>

          <div className="mt-5 v2-command rounded-[30px] p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="v2-label">Planned today</div>
                <div className="v2-tabular mt-4 text-6xl tracking-[-0.08em] sm:text-7xl">
                  {dashboard.studyPlan.totalCards}
                </div>
              </div>
              <div className="grid gap-3 text-right sm:text-left">
                <div>
                  <div className="v2-label">Due now</div>
                  <div className="v2-tabular mt-2 text-2xl">{dashboard.dueCount}</div>
                </div>
                <div>
                  <div className="v2-label">New today</div>
                  <div className="v2-tabular mt-2 text-2xl">{dashboard.studyPlan.newCards}</div>
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-base leading-7 v2-on-dark-muted">
              About {dashboard.studyPlan.estimatedMinutes} minutes of study, with the next review window{" "}
              {dashboard.nextDueLabel.toLowerCase()}.
            </p>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[24px] v2-inset p-5">
              <div className="v2-label">Focus word</div>
              <div className="mt-4 text-4xl tracking-[-0.06em] text-[var(--v2-text)]">
                {focusItem?.displayForm ?? "ser"}
              </div>
              <div className="mt-2 text-base v2-muted">{focusItem?.primaryGloss ?? "to be"}</div>
              <p className="mt-4 text-sm leading-7 v2-muted">
                {focusItem?.reason ?? "High-utility Spanish word ready to move through the daily queue."}
              </p>
              <div className="mt-5 border-t border-[var(--v2-line)] pt-4">
                <div className="v2-label">Tomorrow estimate</div>
                <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em] text-[var(--v2-text)]">
                  {dashboard.studyPlan.tomorrowDueEstimate}
                </div>
              </div>
            </div>

            <MiniDueCurve values={previewSeries} />
          </div>
        </section>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="v2-card rounded-[32px] p-6 sm:p-8">
          <div className="v2-label">What Lemma actually does</div>
          <h2 className="mt-4 max-w-3xl text-4xl leading-[0.94] sm:text-[3rem]">
            A ranked queue, a fast study sheet, and a ledger of what you know.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 v2-muted">
            The product stays intentionally small: one dashboard for workload, one study screen for recall, and one
            words view for everything already in rotation.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Useful Spanish first",
                body: "Words are introduced from a ranked corpus instead of a course storyline."
              },
              {
                step: "02",
                title: "Simple daily recall",
                body: "Study stays binary and fast so the memory decision is clearer than the interface."
              },
              {
                step: "03",
                title: "Readable memory record",
                body: "Every studied word keeps its own due date, strength, reps, and sentence context."
              }
            ].map((item) => (
              <div key={item.step} className="rounded-[24px] v2-inset p-5">
                <div className="v2-label">{item.step}</div>
                <div className="mt-4 text-2xl tracking-[-0.05em] text-[var(--v2-text)]">{item.title}</div>
                <p className="mt-3 text-sm leading-7 v2-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="v2-card rounded-[32px] p-6 sm:p-8">
          <div className="v2-label">Why people keep opening it</div>
          <div className="mt-6 space-y-5">
            {[
              {
                title: "No lesson tree",
                body: "There is no course path. The dashboard simply tells you what is due and what is growing."
              },
              {
                title: "No grading theater",
                body: "Study is just reveal, listen, and decide whether you knew it."
              },
              {
                title: "No hidden vocabulary state",
                body: "The words view stays visible so you can inspect the exact words already in rotation."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] v2-inset-soft px-5 py-4">
                <div className="text-xl tracking-[-0.04em] text-[var(--v2-text)]">{item.title}</div>
                <p className="mt-2 text-sm leading-7 v2-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
