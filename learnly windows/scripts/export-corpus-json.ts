/**
 * Export the corpus data from TypeScript arrays to a JSON seed file.
 *
 * Run with: npx tsx scripts/export-corpus-json.ts
 *
 * This reads the generated TS arrays in src/lib/demo/generated/ and writes
 * a single JSON file (data/corpus-seed.json) that the seed script uses.
 */
import { writeFileSync, mkdirSync } from "fs";
import { chineseHskCorpus } from "../data/generated/chinese-hsk-corpus";
import { frenchStarterCorpus } from "../data/generated/french-starter-corpus";
import { germanStarterCorpus } from "../data/generated/german-starter-corpus";
import { spanishFrequencyCorpus } from "../data/generated/spanish-frequency-corpus";

const languages = [
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    descriptor: "Primary launch corpus",
    speakerLabel: "Latin America and Spain",
    audioVoice: "Mónica",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    descriptor: "Starter deck",
    speakerLabel: "France",
    audioVoice: "Thomas",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    descriptor: "Starter deck",
    speakerLabel: "Germany",
    audioVoice: "Anna",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    descriptor: "HSK 1-6 launch lists",
    speakerLabel: "Mainland Mandarin",
    audioVoice: "Tingting",
  },
];

const items = [
  ...spanishFrequencyCorpus,
  ...chineseHskCorpus,
  ...frenchStarterCorpus,
  ...germanStarterCorpus,
];

mkdirSync("data", { recursive: true });

writeFileSync(
  "data/corpus-seed.json",
  JSON.stringify({ languages, items })
);

console.log(`Exported ${languages.length} languages and ${items.length} items to data/corpus-seed.json`);
