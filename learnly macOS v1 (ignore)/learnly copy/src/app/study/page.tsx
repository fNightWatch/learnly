import { ReviewSession } from "@/components/review/review-session";
import { SiteHeader } from "@/components/site/site-header";
import { getLanguageCatalog, getLearnerSettings } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

type StudyPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function StudyPage({ searchParams }: StudyPageProps) {
  const settings = getLearnerSettings(DEMO_USER_ID);
  const selectedLanguageSet = new Set(settings.selectedLanguageCodes);
  const availableLanguages = getLanguageCatalog().filter((language) =>
    selectedLanguageSet.has(language.code)
  );
  const completeParam = searchParams?.complete;
  const newParam = searchParams?.new;
  const showCompletionCta =
    typeof completeParam === "string"
      ? completeParam === "1"
      : Array.isArray(completeParam)
        ? completeParam.includes("1")
        : false;
  const hasNewParam =
    typeof newParam === "string"
      ? true
      : Array.isArray(newParam)
        ? newParam.length > 0
        : false;
  const reviewSessionKey = `${showCompletionCta ? "complete" : "study"}-${hasNewParam ? "new" : "base"}`;

  return (
    <div className="study-page">
      <SiteHeader
        floating={false}
        showStudyCta={showCompletionCta}
        ctaLabel="New session"
        ctaHref="/study?new"
        surface="study"
      />
      <main className="shell pb-8 pt-2 sm:pt-3">
        <ReviewSession key={reviewSessionKey} availableLanguages={availableLanguages} />
      </main>
    </div>
  );
}
