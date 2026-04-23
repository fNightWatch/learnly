/**
 * Export the corpus data from TypeScript arrays to a JSON seed file.
 *
 * Run with: npx tsx scripts/export-corpus-json.ts
 *
 * This reads the generated TS arrays outside src/ and writes a single JSON
 * file (data/corpus-seed.json) that both seed-db.ts and the fallback runtime
 * auto-seed can load without pulling giant corpus modules into Next.js.
 */
import { writeFileSync, mkdirSync } from "fs";
import { demoCorpus, demoLanguages } from "../data/content";

mkdirSync("data", { recursive: true });

writeFileSync(
  "data/corpus-seed.json",
  JSON.stringify({ languages: demoLanguages, items: demoCorpus })
);

console.log(
  `Exported ${demoLanguages.length} languages and ${demoCorpus.length} items to data/corpus-seed.json`
);
