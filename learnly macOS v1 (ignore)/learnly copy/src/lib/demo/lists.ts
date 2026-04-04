import { getDb } from "@/lib/db/local-client";
import { eq, like, asc } from "drizzle-orm";
import * as tables from "@/lib/db/sqlite-schema";

type CuratedList = {
  id: string;
  title: string;
  description: string;
  itemIds: string[];
};

const HSK_LEVELS = [
  { level: 1, description: "Foundational high-frequency Mandarin for the first HSK band." },
  { level: 2, description: "Essential daily Mandarin for the second HSK band." },
  { level: 3, description: "Intermediate Mandarin expanding everyday fluency for HSK 3." },
  { level: 4, description: "Upper-intermediate Mandarin for HSK 4 proficiency." },
  { level: 5, description: "Advanced Mandarin vocabulary for HSK 5." },
  { level: 6, description: "Near-native Mandarin vocabulary for HSK 6." },
];

function buildHskLists(): CuratedList[] {
  const db = getDb();
  return HSK_LEVELS.map(({ level, description }) => {
    const rows = db.select({ id: tables.corpusItems.id })
      .from(tables.corpusItems)
      .where(like(tables.corpusItems.id, `zh-hsk-${level}-%`))
      .orderBy(asc(tables.corpusItems.rank))
      .all();
    return {
      id: `hsk-${level}`,
      title: `HSK ${level}`,
      description,
      itemIds: rows.map(r => r.id),
    };
  });
}

let cached: CuratedList[] | null = null;

export function getCuratedLists(): CuratedList[] {
  if (cached) return cached;
  cached = [
    {
      id: "launch-core",
      title: "Launch Core",
      description: "The first words that define the spine of the product.",
      itemIds: ["ser", "estar", "tener", "hacer", "poder", "ir"]
    },
    {
      id: "foundation-verbs",
      title: "Foundation Verbs",
      description: "High-frequency verbs that unlock early comprehension fast.",
      itemIds: ["ser", "estar", "tener", "hacer", "poder", "ir", "decir", "ver", "querer", "dar"]
    },
    {
      id: "conversation-starters",
      title: "Conversation Starters",
      description: "Polite and useful words for basic daily exchanges.",
      itemIds: ["decir", "querer", "dar", "por_favor", "de_nada"]
    },
    {
      id: "phrase-pairings",
      title: "Useful Phrases",
      description: "Short phrases that earn their place through constant reuse.",
      itemIds: ["por_favor", "de_nada"]
    },
    ...buildHskLists()
  ];
  return cached;
}
