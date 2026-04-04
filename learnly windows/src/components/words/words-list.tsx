"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type {
  RankedListEntry,
  DemoLanguage,
  SupportedLanguageCode,
  StudyPlan,
  WordsSection,
} from "@/lib/demo/types";

type SortKey = "due" | "strength" | "alpha" | "reps";
type GroupBy = "status" | "language";

function formatStatusLabel(value: string) {
  return value.replace("-", " ");
}

const LANGUAGE_EMOJI: Record<string, string> = {
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  zh: "🇨🇳",
};

function sortItems(items: RankedListEntry[], sortKey: SortKey): RankedListEntry[] {
  const sorted = [...items];
  switch (sortKey) {
    case "alpha":
      return sorted.sort((a, b) => a.displayForm.localeCompare(b.displayForm));
    case "strength":
      return sorted.sort((a, b) => (a.retrievabilityPercent ?? -1) - (b.retrievabilityPercent ?? -1));
    case "reps":
      return sorted.sort((a, b) => b.reps - a.reps);
    case "due":
    default:
      return sorted;
  }
}

export function WordsList({
  sections,
  availableLanguages,
  activeLanguageCodes,
  studyPlan,
}: {
  sections: WordsSection[];
  availableLanguages: DemoLanguage[];
  activeLanguageCodes: SupportedLanguageCode[];
  studyPlan: StudyPlan;
}) {
  const [langFilter, setLangFilter] = useState<"all" | SupportedLanguageCode>("all");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");

  const studiedSections = sections.filter((s) => s.id !== "not-introduced");
  const allStudiedWords = studiedSections.flatMap((s) => s.items);

  const filteredWords = useMemo(() => {
    const words = langFilter === "all"
      ? allStudiedWords
      : allStudiedWords.filter((w) => w.languageCode === langFilter);
    return sortItems(words, sortKey);
  }, [allStudiedWords, langFilter, sortKey]);

  // Count words per language
  const langCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of allStudiedWords) {
      counts[w.languageCode] = (counts[w.languageCode] || 0) + 1;
    }
    return counts;
  }, [allStudiedWords]);

  // Build grouped sections
  const groupedSections = useMemo(() => {
    if (groupBy === "status") {
      return studiedSections.map((section) => {
        const items = langFilter === "all"
          ? section.items
          : section.items.filter((w) => w.languageCode === langFilter);
        return { ...section, items: sortItems(items, sortKey) };
      }).filter((s) => s.items.length > 0);
    }

    // Group by language
    const langMap = new Map<string, RankedListEntry[]>();
    for (const w of filteredWords) {
      const arr = langMap.get(w.languageCode) || [];
      arr.push(w);
      langMap.set(w.languageCode, arr);
    }

    return Array.from(langMap.entries()).map(([code, items]) => {
      const lang = availableLanguages.find((l) => l.code === code);
      return {
        id: code,
        title: `${LANGUAGE_EMOJI[code] || ""} ${lang?.name ?? code}`,
        description: `${items.length} word${items.length === 1 ? "" : "s"} studied`,
        items: sortItems(items, sortKey),
      };
    });
  }, [groupBy, studiedSections, langFilter, filteredWords, sortKey, availableLanguages]);

  const activeLanguagesFiltered = availableLanguages.filter((l) =>
    activeLanguageCodes.includes(l.code)
  );

  return (
    <>
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Studied words", value: filteredWords.length },
          { label: "Due now", value: studyPlan.dueNow },
          { label: "Active languages", value: activeLanguageCodes.length },
        ].map((item) => (
          <div key={item.label} className="card px-5 py-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/40">{item.label}</div>
            <div className="mt-2 text-3xl tracking-[-0.05em] text-ink/92">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Controls */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Language filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLangFilter("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-[transform,opacity,box-shadow] ${
              langFilter === "all"
                ? "bg-night text-white dark:bg-white dark:text-night"
                : "border border-line/70 bg-panel/78 text-ink/60 hover:border-clay/30 hover:text-clay"
            }`}
          >
            All
            <span className="ml-1.5 opacity-50">{allStudiedWords.length}</span>
          </button>
          {activeLanguagesFiltered.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLangFilter(lang.code)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-[transform,opacity,box-shadow] ${
                langFilter === lang.code
                  ? "bg-night text-white dark:bg-white dark:text-night"
                  : "border border-line/70 bg-panel/78 text-ink/60 hover:border-clay/30 hover:text-clay"
              }`}
            >
              {LANGUAGE_EMOJI[lang.code]} {lang.name}
              <span className="ml-1.5 opacity-50">{langCounts[lang.code] || 0}</span>
            </button>
          ))}
        </div>

        {/* Sort & Group controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink/40">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-line/70 bg-panel/78 px-3 py-1.5 text-sm text-ink/80 outline-none transition-[transform,opacity,box-shadow] focus:border-clay/40"
            >
              <option value="due">Due date</option>
              <option value="strength">Strength</option>
              <option value="alpha">A → Z</option>
              <option value="reps">Most reviewed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink/40">Group</span>
            <div className="flex rounded-lg border border-line/70 bg-panel/78 p-0.5">
              {(["status", "language"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-[transform,opacity,box-shadow] ${
                    groupBy === g
                      ? "bg-night text-white dark:bg-white dark:text-night"
                      : "text-ink/60 hover:text-ink/80"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Word list */}
      <section className="mt-6 space-y-5">
        {groupedSections.length === 0 ? (
          <div className="card px-6 py-12 text-center text-ink/50">
            No words match the current filter.
          </div>
        ) : (
          groupedSections.map((section) => (
            <article key={section.id} id={section.id} className="card overflow-hidden">
              <div className="border-b border-line/70 px-6 py-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-3xl tracking-[-0.04em] text-ink/92">{section.title}</div>
                    <p className="mt-2 max-w-3xl text-base leading-7 text-ink/62">{section.description}</p>
                  </div>
                  <div className="words-soft-chip rounded-full px-4 py-2 text-sm text-ink/56">
                    {section.items.length} word{section.items.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              {section.items.length > 0 ? (
                <div>
                  <div className="hidden border-b border-line/70 px-6 py-3 md:grid md:grid-cols-[1.45fr_0.9fr_0.85fr_0.75fr_0.65fr] md:gap-4">
                    {["Word", "State", "Next due", "Strength", "Reps"].map((label) => (
                      <div key={label} className="text-[11px] uppercase tracking-[0.18em] text-ink/38">
                        {label}
                      </div>
                    ))}
                  </div>

                  {section.items.map((item) => (
                    <Link
                      key={item.itemId}
                      href={`/words/${item.itemId}`}
                      className="words-row block border-b border-line/50 px-6 py-4 last:border-b-0"
                    >
                      <div className="grid gap-3 md:grid-cols-[1.45fr_0.9fr_0.85fr_0.75fr_0.65fr] md:items-center md:gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-2xl tracking-[-0.04em] text-ink/92">{item.displayForm}</div>
                            {groupBy !== "language" && (
                              <div className="words-soft-chip rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-ink/44">
                                {availableLanguages.find((l) => l.code === item.languageCode)?.name ?? ""}
                              </div>
                            )}
                            <div className="rounded-full bg-panel/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-ink/46">
                              {item.pos}
                            </div>
                            {item.isFocus ? (
                              <div className="rounded-full border border-clay/18 bg-clay/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-clay">
                                focus
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-1 text-sm text-ink/58">{item.primaryGloss}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.listTitles.slice(0, 2).map((title) => (
                              <span
                                key={title}
                                className="words-soft-chip rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-ink/42"
                              >
                                {title}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-ink/60 md:text-base">
                          <div className="capitalize text-ink/84">{formatStatusLabel(item.status)}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/36">
                            {item.lapses > 0 ? `${item.lapses} lapse${item.lapses === 1 ? "" : "s"}` : "clean"}
                          </div>
                        </div>

                        <div className="text-sm text-ink/66 md:text-base">{item.nextDueLabel}</div>

                        <div className="text-sm text-ink/66 md:text-base">
                          {typeof item.retrievabilityPercent === "number"
                            ? `${item.retrievabilityPercent}%`
                            : "New"}
                        </div>

                        <div className="text-sm text-ink/66 md:text-base">{item.reps}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-6 text-sm text-ink/58">No words in this section yet.</div>
              )}
            </article>
          ))
        )}
      </section>
    </>
  );
}
