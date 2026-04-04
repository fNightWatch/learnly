import { SiteHeader } from "@/components/site/site-header";
import { WordsList } from "@/components/words/words-list";
import { getWordsSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

export default function WordsPage() {
  const snapshot = getWordsSnapshot(DEMO_USER_ID);

  return (
    <div className="words-page">
      <SiteHeader />
      <main className="shell page-shell">
        <section className="space-y-5">
          <div className="eyebrow">Words</div>
          <h1 className="max-w-3xl text-5xl leading-[0.94] text-ink sm:text-6xl">
            Your vocabulary
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-ink/66">
            Filter, sort, and browse your studied words across all active languages.
          </p>
        </section>

        <section className="mt-8">
          <WordsList
            sections={snapshot.sections}
            availableLanguages={snapshot.availableLanguages}
            activeLanguageCodes={snapshot.activeLanguageCodes}
            studyPlan={snapshot.studyPlan}
          />
        </section>
      </main>
    </div>
  );
}
