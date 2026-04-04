import Link from "next/link";
import { notFound } from "next/navigation";
import { V2AudioButton } from "@/components/v2/v2-audio-button";
import { getWordSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

function formatStatusLabel(value: string) {
  return value.replace("-", " ");
}

export default function V2WordDetailPage({ params }: { params: { id: string } }) {
  const snapshot = getWordSnapshot(DEMO_USER_ID, params.id);

  if (!snapshot) {
    notFound();
  }

  return (
    <main className="v2-shell v2-page">
      <section className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
        <div className="space-y-6">
          <article className="v2-command rounded-[32px] px-6 py-7 sm:px-7">
            <div className="v2-label text-[rgba(248,239,228,0.42)]">Word</div>
            <h1 className="mt-5 text-6xl tracking-[-0.08em] sm:text-7xl">{snapshot.item.displayForm}</h1>
            <div className="mt-3 text-xl v2-on-dark-muted">{snapshot.item.primaryGloss}</div>

            <div className="mt-6 flex flex-wrap gap-3">
              <V2AudioButton
                itemId={snapshot.item.itemId}
                mode="term"
                label="Play word"
                fallbackText={snapshot.item.displayForm}
                languageCode={snapshot.item.languageCode}
              />
              <V2AudioButton
                itemId={snapshot.item.itemId}
                mode="example"
                label="Play sentence"
                fallbackText={snapshot.examples[0]?.sentence ?? snapshot.item.example}
                languageCode={snapshot.item.languageCode}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/v2/study" className="v2-button-primary">
                Study this word
              </Link>
              <Link href="/v2/words" className="v2-button-secondary">
                Back to Words
              </Link>
            </div>

            <div className="mt-7 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="v2-label text-[rgba(248,239,228,0.42)]">Why it is here</div>
              <p className="mt-3 text-base leading-8 v2-on-dark-muted">{snapshot.studyReason}</p>
            </div>
          </article>

          <article className="v2-card rounded-[30px] p-6">
            <div className="v2-label">
              {snapshot.examples.length > 0 ? `Sentences (${snapshot.examples.length})` : "Sentence"}
            </div>
            {snapshot.examples.length > 0 ? (
              <div className="mt-4 space-y-6">
                {snapshot.examples.map((ex, i) => (
                  <div key={i} className={i > 0 ? "border-t border-[var(--v2-line)] pt-6" : ""}>
                    <div className="text-3xl leading-[1.22] tracking-[-0.05em] text-[var(--v2-text)]">{ex.sentence}</div>
                    <div className="mt-3 text-lg v2-muted">{ex.translation}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-4 text-3xl leading-[1.22] tracking-[-0.05em] text-[var(--v2-text)]">
                  {snapshot.item.example}
                </div>
                <div className="mt-4 text-lg v2-muted">{snapshot.item.translation}</div>
              </>
            )}
            {snapshot.notes ? (
              <div className="mt-5 border-t border-[var(--v2-line)] pt-5">
                <div className="v2-label">Notes</div>
                <p className="mt-3 text-sm leading-7 v2-muted">{snapshot.notes}</p>
              </div>
            ) : null}
          </article>
        </div>

        <div className="space-y-6">
          <article className="v2-card rounded-[30px] p-6 sm:p-7">
            <div className="v2-label">Study state</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                { label: "Reps", value: snapshot.reps },
                { label: "Lapses", value: snapshot.lapses },
                { label: "Rank", value: snapshot.item.rank },
                { label: "Scheduled days", value: snapshot.scheduledDays },
                { label: "Learning steps", value: snapshot.learningSteps },
                {
                  label: "Last reviewed",
                  value: snapshot.lastReviewedAt ? new Date(snapshot.lastReviewedAt).toLocaleDateString() : "Not yet"
                }
              ].map((stat) => (
                <div key={stat.label} className="rounded-[22px] v2-inset p-4">
                  <div className="v2-label">{stat.label}</div>
                  <div className="v2-tabular mt-3 text-3xl tracking-[-0.05em] text-[var(--v2-text)]">{stat.value}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="v2-card rounded-[30px] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="v2-label">Related words</div>
              <Link href="/v2/words" className="text-sm font-medium v2-muted transition-[transform,opacity,box-shadow] hover:text-[var(--v2-text)]">
                See all
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {snapshot.relatedWords.map((item) => (
                <Link
                  key={item.itemId}
                  href={`/v2/words/${item.itemId}`}
                  className="v2-data-row block rounded-[22px] px-4 py-4 transition-[transform,opacity,box-shadow] hover:bg-[rgba(255,255,255,0.48)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-2xl tracking-[-0.05em] text-[var(--v2-text)]">{item.displayForm}</div>
                      <div className="mt-1 text-sm v2-muted">{item.primaryGloss}</div>
                    </div>
                    <div className="text-right text-[11px] uppercase tracking-[0.18em] v2-muted-soft">
                      {formatStatusLabel(item.status)} / {item.nextDueLabel}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
