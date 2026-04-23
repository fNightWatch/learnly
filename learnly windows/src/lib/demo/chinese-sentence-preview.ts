import { inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/local-client";
import * as tables from "@/lib/db/sqlite-schema";
import type {
  SentenceTokenPreview,
  SentenceTokenSense,
  SupportedLanguageCode,
  UserItemState,
} from "@/lib/demo/types";

export type HskSentencePreviewLanguage = "zh-hsk1" | "zh-hsk2" | "zh-hsk3";

type PreviewLexiconEntry = {
  itemId: string;
  languageCode: HskSentencePreviewLanguage;
  displayForm: string;
  rank: number;
  pronunciation?: string;
  primaryGloss: string;
  secondaryGlosses?: string[];
  notes?: string;
  length: number;
};

type PreviewSurfaceGroup = {
  displayForm: string;
  length: number;
  entries: PreviewLexiconEntry[];
};

type PreviewLexicon = {
  byFirstCharacter: Map<string, PreviewSurfaceGroup[]>;
};

const HSK_PREVIEW_LANGUAGES = ["zh-hsk1", "zh-hsk2", "zh-hsk3"] as const;
const HSK_PREVIEW_LANGUAGE_SET = new Set<SupportedLanguageCode>(HSK_PREVIEW_LANGUAGES);
const HSK_SCOPE: Record<HskSentencePreviewLanguage, HskSentencePreviewLanguage[]> = {
  "zh-hsk1": ["zh-hsk1"],
  "zh-hsk2": ["zh-hsk1", "zh-hsk2"],
  "zh-hsk3": ["zh-hsk1", "zh-hsk2", "zh-hsk3"],
};

const lexiconCache = new Map<HskSentencePreviewLanguage, PreviewLexicon>();

function dedupeGlosses(primaryGloss: string, secondaryGlosses?: string[]) {
  const seen = new Set<string>();
  const orderedGlosses = [primaryGloss, ...(secondaryGlosses ?? [])]
    .map((gloss) => gloss.trim())
    .filter((gloss) => gloss.length > 0)
    .filter((gloss) => {
      if (seen.has(gloss)) {
        return false;
      }
      seen.add(gloss);
      return true;
    });

  return orderedGlosses;
}

function sortEntriesForLanguage(
  sentenceLanguageCode: HskSentencePreviewLanguage,
  left: PreviewLexiconEntry,
  right: PreviewLexiconEntry
) {
  const leftExact = left.languageCode === sentenceLanguageCode ? 0 : 1;
  const rightExact = right.languageCode === sentenceLanguageCode ? 0 : 1;
  if (leftExact !== rightExact) {
    return leftExact - rightExact;
  }

  if (left.rank !== right.rank) {
    return left.rank - right.rank;
  }

  if (left.languageCode !== right.languageCode) {
    return left.languageCode.localeCompare(right.languageCode);
  }

  return left.itemId.localeCompare(right.itemId);
}

function buildPreviewLexicon(languageCode: HskSentencePreviewLanguage): PreviewLexicon {
  const scope = HSK_SCOPE[languageCode];
  const rows = getDb()
    .select({
      id: tables.corpusItems.id,
      languageCode: tables.corpusItems.languageCode,
      displayForm: tables.corpusItems.displayForm,
      rank: tables.corpusItems.rank,
      pronunciation: tables.corpusItems.pronunciation,
      primaryGloss: tables.corpusItems.primaryGloss,
      secondaryGlosses: tables.corpusItems.secondaryGlosses,
      notes: tables.corpusItems.notes,
    })
    .from(tables.corpusItems)
    .where(inArray(tables.corpusItems.languageCode, scope))
    .all();

  const groupsBySurface = new Map<string, PreviewLexiconEntry[]>();
  for (const row of rows) {
    const entry: PreviewLexiconEntry = {
      itemId: row.id,
      languageCode: row.languageCode as HskSentencePreviewLanguage,
      displayForm: row.displayForm,
      rank: row.rank,
      pronunciation: row.pronunciation ?? undefined,
      primaryGloss: row.primaryGloss,
      secondaryGlosses: row.secondaryGlosses ? JSON.parse(row.secondaryGlosses) : undefined,
      notes: row.notes ?? undefined,
      length: [...row.displayForm].length,
    };

    const existing = groupsBySurface.get(entry.displayForm) ?? [];
    existing.push(entry);
    groupsBySurface.set(entry.displayForm, existing);
  }

  const byFirstCharacter = new Map<string, PreviewSurfaceGroup[]>();
  for (const [displayForm, groupedEntries] of groupsBySurface.entries()) {
    const sortedEntries = groupedEntries
      .slice()
      .sort((left, right) => sortEntriesForLanguage(languageCode, left, right));
    const firstCharacter = [...displayForm][0];
    const surfaces = byFirstCharacter.get(firstCharacter) ?? [];
    surfaces.push({
      displayForm,
      length: [...displayForm].length,
      entries: sortedEntries,
    });
    byFirstCharacter.set(firstCharacter, surfaces);
  }

  for (const [firstCharacter, surfaces] of byFirstCharacter.entries()) {
    byFirstCharacter.set(
      firstCharacter,
      surfaces
        .slice()
        .sort((left, right) => right.length - left.length || left.displayForm.localeCompare(right.displayForm))
    );
  }

  return { byFirstCharacter };
}

function getPreviewLexicon(languageCode: HskSentencePreviewLanguage) {
  const cached = lexiconCache.get(languageCode);
  if (cached) {
    return cached;
  }

  const lexicon = buildPreviewLexicon(languageCode);
  lexiconCache.set(languageCode, lexicon);
  return lexicon;
}

function buildTokenSenses(entries: PreviewLexiconEntry[]): SentenceTokenSense[] {
  return entries.map((entry) => ({
    itemId: entry.itemId,
    languageCode: entry.languageCode,
    pronunciation: entry.pronunciation,
    primaryGloss: entry.primaryGloss,
    glosses: dedupeGlosses(entry.primaryGloss, entry.secondaryGlosses),
    notes: entry.notes,
  }));
}

function buildMatchedTokenPreview(
  entries: PreviewLexiconEntry[],
  text: string,
  stateMap: Record<string, UserItemState>
): SentenceTokenPreview {
  const senses = buildTokenSenses(entries);
  const alreadyLearning = entries.some((entry) => Boolean(stateMap[entry.itemId]));

  return {
    text,
    matched: true,
    pronunciation: entries[0]?.pronunciation,
    senses,
    learnItemId: alreadyLearning ? undefined : entries[0]?.itemId,
    alreadyLearning,
  };
}

export function isHskSentencePreviewLanguage(
  languageCode: SupportedLanguageCode
): languageCode is HskSentencePreviewLanguage {
  return HSK_PREVIEW_LANGUAGE_SET.has(languageCode);
}

export function buildChineseSentenceTokenPreviews(params: {
  sentence: string;
  languageCode: SupportedLanguageCode;
  stateMap: Record<string, UserItemState>;
}) {
  const { sentence, languageCode, stateMap } = params;
  if (!isHskSentencePreviewLanguage(languageCode) || sentence.trim().length === 0) {
    return undefined;
  }

  const lexicon = getPreviewLexicon(languageCode);
  const characters = [...sentence];
  const previews: SentenceTokenPreview[] = [];
  let plainTextBuffer = "";
  let index = 0;

  while (index < characters.length) {
    const currentCharacter = characters[index];
    const candidates = lexicon.byFirstCharacter.get(currentCharacter);
    let matchedGroup: PreviewSurfaceGroup | null = null;

    if (candidates) {
      for (const candidate of candidates) {
        const nextText = characters.slice(index, index + candidate.length).join("");
        if (nextText === candidate.displayForm) {
          matchedGroup = candidate;
          break;
        }
      }
    }

    if (!matchedGroup) {
      plainTextBuffer += currentCharacter;
      index += 1;
      continue;
    }

    if (plainTextBuffer.length > 0) {
      previews.push({
        text: plainTextBuffer,
        matched: false,
      });
      plainTextBuffer = "";
    }

    previews.push(buildMatchedTokenPreview(matchedGroup.entries, matchedGroup.displayForm, stateMap));
    index += matchedGroup.length;
  }

  if (plainTextBuffer.length > 0) {
    previews.push({
      text: plainTextBuffer,
      matched: false,
    });
  }

  return previews.length > 0 ? previews : undefined;
}
