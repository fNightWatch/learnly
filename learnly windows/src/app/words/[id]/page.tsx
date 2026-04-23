import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { getWordSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import { WordAudioButton } from "@/components/words/word-audio-button";
import { ChineseSentencePreview } from "@/components/words/chinese-sentence-preview";

export const dynamic = "force-dynamic";

function formatStatusLabel(value: string) {
  return value.replace("-", " ");
}

export default function WordDetailPage({ params }: { params: { id: string } }) {
  const snapshot = getWordSnapshot(DEMO_USER_ID, params.id);

  if (!snapshot) {
    notFound();
  }

  return (
    <div className="words-page">
      <SiteHeader />
      <main className="shell page-shell">
        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="card overflow-hidden">
            <div className="border-b border-line/70 px-6 py-6">
              <div className="text-sm uppercase tracking-[0.18em] text-ink/40">Word</div>
              <h1 className="mt-4 text-5xl tracking-[-0.05em] text-ink">{snapshot.item.displayForm}</h1>
              <div className="mt-3 text-xl text-ink/62">{snapshot.item.primaryGloss}</div>
              <div className="mt-5 flex flex-wrap gap-3">
                <WordAudioButton itemId={snapshot.item.itemId} mode="term" label="Play word" />
                <WordAudioButton itemId={snapshot.item.itemId} mode="example" label="Play sentence" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/words" className="button-secondary">
                  Back to words
                </Link>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="words-soft-panel rounded-[22px] p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink/40">Why it is here</div>
                <div className="mt-3 text-base leading-7 text-ink/66">{snapshot.studyReason}</div>
              </div>
              {snapshot.notes ? (
                <div className="words-soft-panel mt-4 rounded-[22px] p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-ink/40">Notes</div>
                  <div className="mt-3 text-base leading-7 text-ink/66">{snapshot.notes}</div>
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Status", value: formatStatusLabel(snapshot.item.status) },
                  { label: "Next due", value: snapshot.item.nextDueLabel },
                  {
                    label: "Strength",
                    value:
                      typeof snapshot.retrievabilityPercent === "number"
                        ? `${snapshot.retrievabilityPercent}%`
                        : "New"
                  },
                  { label: "Reps", value: snapshot.reps }
                ].map((stat) => (
                  <div key={stat.label} className="words-soft-card rounded-[22px] p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-ink/40">{stat.label}</div>
                    <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/90">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="space-y-6">
            <article className="card px-6 py-6">
              <div className="text-sm uppercase tracking-[0.18em] text-ink/40">
                {snapshot.examples.length > 0 ? `Sentences (${snapshot.examples.length})` : "Sentence"}
              </div>
              {snapshot.examples.length > 0 ? (
                <div className="mt-4 space-y-6">
                  {snapshot.examples.map((ex, i) => (
                    <div key={i} className={i > 0 ? "border-t border-line/40 pt-6" : ""}>
                      <div className="text-3xl leading-[1.2] tracking-[-0.04em] text-ink/92">
                        {ex.tokens ? <ChineseSentencePreview tokens={ex.tokens} /> : ex.sentence}
                      </div>
                      <div className="mt-3 text-lg text-ink/58">{ex.translation}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-4 text-3xl leading-[1.2] tracking-[-0.04em] text-ink/92">{snapshot.item.example}</div>
                  <div className="mt-4 text-lg text-ink/58">{snapshot.item.translation}</div>
                </>
              )}
            </article>

            <article className="card px-6 py-6">
              <div className="text-sm uppercase tracking-[0.18em] text-ink/40">Study state</div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Lapses", value: snapshot.lapses },
                  { label: "Scheduled days", value: snapshot.scheduledDays },
                  { label: "Learning steps", value: snapshot.learningSteps },
                  {
                    label: "Introduced",
                    value: snapshot.introducedAt ? new Date(snapshot.introducedAt).toLocaleDateString() : "Today"
                  },
                  {
                    label: "Last reviewed",
                    value: snapshot.lastReviewedAt ? new Date(snapshot.lastReviewedAt).toLocaleDateString() : "Not yet"
                  },
                  { label: "Rank", value: snapshot.item.rank }
                ].map((stat) => (
                  <div key={stat.label} className="words-soft-card rounded-[22px] p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-ink/40">{stat.label}</div>
                    <div className="mt-2 text-2xl tracking-[-0.04em] text-ink/90">{stat.value}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm uppercase tracking-[0.18em] text-ink/40">Related words</div>
                <Link href="/words" className="text-sm text-ink/52 transition-[transform,opacity,box-shadow] hover:text-clay">
                  See all words
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {snapshot.relatedWords.map((item) => (
                  <Link
                    key={item.itemId}
                    href={`/words/${item.itemId}`}
                    className="words-soft-card rounded-[22px] p-4 transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:border-clay/30"
                  >
                    <div className="text-xl tracking-[-0.03em] text-ink/92">{item.displayForm}</div>
                    <div className="mt-2 text-sm text-ink/58">{item.primaryGloss}</div>
                    <div className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/38">
                      {formatStatusLabel(item.status)} • {item.nextDueLabel}
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
