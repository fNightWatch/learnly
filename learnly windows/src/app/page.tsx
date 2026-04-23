import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteSnapshot, getRecentStudiedWords } from "@/lib/demo/store";
import { brand } from "@/lib/site/brand";
import { DEMO_USER_ID } from "@/lib/demo/user";

function MiniForecast({
  values
}: {
  values: Array<{ label: string; value: number }>;
}) {
  const maxValue = Math.max(...values.map((entry) => entry.value), 1);

  return (
    <div className="mt-5">
      <div className="flex h-28 items-end gap-2">
        {values.map((entry, index) => (
          <div key={`${entry.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="text-xs text-ink/40">{entry.value > 0 ? entry.value : ""}</div>
            <div
              className={`w-full rounded-t-[16px] ${index === 0 ? "bg-clay/90" : "bg-pine/72"}`}
              style={{
                height: `${Math.max(10, (entry.value / maxValue) * 100)}%`
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 text-xs text-ink/42 sm:text-sm">
        {values.map((entry, index) => (
          <div key={`${entry.label}-tick-${index}`} className="min-w-0 flex-1 text-center">
            {entry.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function HomePage() {
  const snapshot = getSiteSnapshot(DEMO_USER_ID);
  const dashboard = snapshot.dashboard;
  const featuredCard = snapshot.featuredCard;
  const studiedWords = getRecentStudiedWords(DEMO_USER_ID, dashboard.activeLanguageCodes, 4);
  const previewSeries = dashboard.reviewsDueSeries.slice(0, 7);

  return (
    <>
      <SiteHeader />
      <main className="shell page-shell">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.98fr] lg:items-center">
          <div className="space-y-8">
            {brand.descriptor ? <div className="eyebrow">{brand.descriptor}</div> : null}
            <div className="space-y-5">
              <h1 className="max-w-5xl text-5xl leading-[0.92] text-ink sm:text-6xl lg:text-7xl">
                Study the right words first. Keep them in memory.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-ink/66 sm:text-xl">
                LanguageHack turns ranked language lists into one daily study system. Start with a 1,000-word Spanish
                core or work through Chinese HSK levels, then review with examples, pronunciation, and a dashboard
                that shows exactly what is due, what is new, and what is holding.
              </p>
              <p className="max-w-3xl text-sm uppercase tracking-[0.2em] text-ink/42">
                Spanish core live. Chinese HSK 1-6 added. French and German starter decks are available now.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Active corpus", value: dashboard.corpusSize },
                { label: "Languages", value: dashboard.activeLanguageCodes.length },
                { label: "Examples", value: `${dashboard.exampleCoveragePercent}%` },
                { label: "Studied now", value: dashboard.activeWords }
              ].map((item) => (
                <div key={item.label} className="card px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-ink/38">{item.label}</div>
                  <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/92">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 top-10 h-40 rounded-full bg-clay/14 blur-3xl" />
            <div className="grid gap-4">
              <div className="card relative overflow-hidden px-6 py-6 sm:px-7 sm:py-7">
                <div className="absolute -right-10 top-6 h-32 w-32 rounded-full bg-pine/10 blur-3xl" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-ink/42">Today’s queue</div>
                    <div className="mt-3 text-5xl tracking-[-0.05em] text-ink/92">{dashboard.studyPlan.totalCards}</div>
                    <div className="mt-2 text-base text-ink/62">
                      {dashboard.dueCount} due, {dashboard.studyPlan.newCards} new, about{" "}
                      {dashboard.studyPlan.estimatedMinutes} minutes
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dashboard.availableLanguages
                        .filter((language) => dashboard.activeLanguageCodes.includes(language.code))
                        .map((language) => (
                          <span
                            key={language.code}
                            className="rounded-full border border-line/70 bg-paper/72 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink/48"
                          >
                            {language.name}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="rounded-full border border-line/70 bg-paper/72 px-4 py-2 text-sm text-ink/62">
                    {dashboard.nextDueLabel}
                  </div>
                </div>

                {featuredCard ? (
                  <div className="mt-6 rounded-[24px] border border-line/70 bg-paper/72 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-ink/40">Queue preview</div>
                        <div className="mt-2 text-3xl tracking-[-0.05em] text-ink/92">{featuredCard.displayForm}</div>
                        <div className="mt-2 text-base text-ink/62">{featuredCard.primaryGloss}</div>
                      </div>
                      <div className="rounded-full border border-line/70 bg-panel/74 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink/46">
                        {featuredCard.pos}
                      </div>
                    </div>
                    <div className="mt-5 border-t border-line/70 pt-5">
                      <div className="text-sm leading-7 text-ink/84">{featuredCard.example}</div>
                      <div className="mt-2 text-sm leading-7 text-ink/56">{featuredCard.translation}</div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 rounded-[24px] border border-line/70 bg-paper/72 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.22em] text-ink/40">Next 7 days</div>
                    <div className="text-sm text-ink/54">Projected workload</div>
                  </div>
                  <MiniForecast values={previewSeries} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Frequency first",
                    body: "Start with the highest-value vocabulary instead of guessing what matters most."
                  },
                  {
                    title: "One visible queue",
                    body: "See what is due, what is new, and what tomorrow will look like without digging through menus."
                  },
                  {
                    title: "Sentence-backed audio",
                    body: "Study words with example sentences and pronunciation so form, meaning, and sound stay linked."
                  }
                ].map((item) => (
                  <article key={item.title} className="card px-5 py-5">
                    <div className="text-xl tracking-[-0.04em] text-ink/92">{item.title}</div>
                    <p className="mt-3 text-sm leading-7 text-ink/62">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <article className="card overflow-hidden">
            <div className="border-b border-line/70 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-ink/38">Studied words</div>
                  <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/92">What is already in your ledger</div>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-ink/62">
                    Your ledger shows the words already introduced into the active memory graph. It is the clean record
                    behind every queue forecast, streak, and study session.
                  </p>
                </div>
                <Link href="/words" className="button-secondary">
                  Open Words
                </Link>
              </div>
            </div>
            <div>
              {studiedWords.map((item) => (
                <Link
                  key={item.itemId}
                  href={`/words/${item.itemId}`}
                  className="grid gap-3 border-b border-line/55 px-6 py-4 transition-[transform,opacity,box-shadow] last:border-b-0 hover:bg-paper/52 sm:grid-cols-[1.1fr_0.9fr_0.8fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xl tracking-[-0.04em] text-ink/92">{item.displayForm}</div>
                      <div className="rounded-full border border-line/60 bg-paper/64 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-ink/42">
                        {dashboard.availableLanguages.find((language) => language.code === item.languageCode)?.name ?? "Language"}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-ink/58">{item.primaryGloss}</div>
                  </div>
                  <div className="text-sm text-ink/56">
                    <div className="uppercase tracking-[0.18em] text-ink/36">State</div>
                    <div className="mt-1 capitalize text-ink/84">{item.status.replace("-", " ")}</div>
                  </div>
                  <div className="text-sm text-ink/56">
                    <div className="uppercase tracking-[0.18em] text-ink/36">Next due</div>
                    <div className="mt-1 text-ink/84">{item.nextDueLabel}</div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
