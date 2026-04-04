import { ReviewSession } from "@/components/review/review-session";
import { SiteHeader } from "@/components/site/site-header";
import { getDb } from "@/lib/db/local-client";
import * as tables from "@/lib/db/sqlite-schema";
import type { DemoLanguage, SupportedLanguageCode } from "@/lib/demo/types";

function getLanguages(): DemoLanguage[] {
  const db = getDb();
  return db.select().from(tables.corpusLanguages).all().map(row => ({
    code: row.code as SupportedLanguageCode,
    name: row.name,
    nativeName: row.nativeName,
    descriptor: row.descriptor,
    speakerLabel: row.speakerLabel,
    audioVoice: row.audioVoice,
    beta: row.beta === 1 ? true : undefined,
  }));
}

export default function StudyPage() {
  const availableLanguages = getLanguages();

  return (
    <div className="study-page">
      <SiteHeader floating={false} showStudyCta={false} surface="study" />
      <main className="shell pb-8 pt-2 sm:pt-3">
        <ReviewSession availableLanguages={availableLanguages} />
      </main>
    </div>
  );
}
