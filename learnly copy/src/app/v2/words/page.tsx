import Link from "next/link";
import { getWordsSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

function formatStatusLabel(value: string) {
  return value.replace("-", " ");
}

const sectionLabels: Record<string, string> = {
  "review-now": "Due now",
  learning: "Learning",
  "review-later": "Stable"
};

export default function V2WordsPage() {
  const snapshot = getWordsSnapshot(DEMO_USER_ID);
  const sections = snapshot.sections.filter((section) => section.id !== "not-introduced");
  const studiedWords = sections.flatMap((section) => section.items);

  return (
    <main className="v2-shell v2-page">
      <section className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
        <div className="space-y-5">
          <div className="v2-eyebrow">Words</div>
          <h1 className="max-w-3xl text-5xl leading-[0.92] sm:text-6xl">Every studied word stays visible.</h1>
          <p className="max-w-2xl text-lg leading-8 v2-muted">
            Lemma keeps a real ledger of what has been introduced, what is fragile, and what is already stable in
            long-term review.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/v2/study" className="v2-button-primary">
              Start Study
            </Link>
            <Link href="/v2/dashboard" className="v2-button-secondary">
              Open Dashboard
            </Link>
          </div>
        </div>

        <section className="v2-card rounded-[30px] p-5 sm:p-6">
          <div className="grid gap-5 border-b border-[var(--v2-line)] pb-5 sm:grid-cols-3">
            {[
              { label: "Tracked words", value: studiedWords.length },
              { label: "Due now", value: snapshot.studyPlan.dueNow },
              { label: "Daily goal", value: snapshot.dailyGoal }
            ].map((item) => (
              <div key={item.label}>
                <div className="v2-label">{item.label}</div>
                <div className="v2-tabular mt-3 text-4xl tracking-[-0.06em]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="v2-label">Why this page exists</div>
            <p className="mt-3 max-w-3xl text-base leading-8 v2-muted">
              The study loop stays intentionally small, but the memory state should never be hidden. This page is where
              you inspect the actual words already moving through the system.
            </p>
          </div>
        </section>
      </section>

      <section className="sticky top-[98px] z-20 mt-8 -mx-2 flex flex-wrap gap-5 border-b border-[var(--v2-line)] bg-[linear-gradient(180deg,rgba(248,243,235,0.96),rgba(248,243,235,0.84))] px-2 pb-3 pt-3 backdrop-blur-md">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex items-center gap-3 border-b border-transparent pb-2 text-sm font-medium tracking-[0.02em] v2-muted transition-[transform,opacity,box-shadow] hover:border-[rgba(37,26,18,0.12)] hover:text-[var(--v2-text)]"
          >
            <span>{sectionLabels[section.id] ?? section.title}</span>
            <span className="v2-tabular text-[var(--v2-text)]">{section.items.length}</span>
          </a>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-[30px] v2-card">
        {sections.map((section, index) => (
          <article
            key={section.id}
            id={section.id}
            className={index === 0 ? "" : "border-t border-[var(--v2-line)]"}
          >
            <div className="px-6 py-6 sm:px-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="v2-label">{sectionLabels[section.id] ?? section.title}</div>
                  <div className="mt-3 text-3xl tracking-[-0.05em]">{section.title}</div>
                  <p className="mt-3 max-w-3xl text-sm leading-7 v2-muted">{section.description}</p>
                </div>
                <div className="v2-tabular text-sm v2-muted">{section.items.length} words</div>
              </div>
            </div>

            {section.items.length > 0 ? (
              <div className="v2-data-table">
                <div className="hidden grid-cols-[1.45fr_0.85fr_0.9fr_0.7fr_0.6fr_0.9fr] gap-4 px-6 py-3 md:grid md:px-7">
                  {["Word", "State", "Next due", "Strength", "Reps", "Lists"].map((label) => (
                    <div key={label} className="v2-label">
                      {label}
                    </div>
                  ))}
                </div>

                {section.items.map((item) => (
                  <Link key={item.itemId} href={`/v2/words/${item.itemId}`} className="v2-data-row block px-6 py-4 md:px-7">
                    <div className="grid gap-3 md:grid-cols-[1.45fr_0.85fr_0.9fr_0.7fr_0.6fr_0.9fr] md:items-center md:gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-2xl tracking-[-0.05em]">{item.displayForm}</div>
                          <div className="rounded-full border border-[var(--v2-line)] bg-[rgba(255,255,255,0.56)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] v2-muted">
                            {item.pos}
                          </div>
                        </div>
                        <div className="mt-1 text-sm v2-muted">{item.primaryGloss}</div>
                      </div>

                      <div className="text-sm">
                        <div className="capitalize text-[var(--v2-text)]">{formatStatusLabel(item.status)}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] v2-muted-soft">
                          {item.lapses > 0 ? `${item.lapses} lapse${item.lapses === 1 ? "" : "s"}` : "clean"}
                        </div>
                      </div>

                      <div className="text-sm v2-muted">{item.nextDueLabel}</div>
                      <div className="v2-tabular text-sm v2-muted">
                        {typeof item.retrievabilityPercent === "number" ? `${item.retrievabilityPercent}%` : "New"}
                      </div>
                      <div className="v2-tabular text-sm v2-muted">{item.reps}</div>
                      <div className="flex flex-wrap gap-2">
                        {item.listTitles.slice(0, 2).map((title) => (
                          <span
                            key={title}
                            className="rounded-full border border-[var(--v2-line)] bg-[rgba(255,255,255,0.5)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] v2-muted"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-6 text-sm v2-muted md:px-7">No words in this section yet.</div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
