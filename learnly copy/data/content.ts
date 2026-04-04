// These generated corpus files live outside src/ to avoid burdening tsc/webpack.
// Only consumed by the seed script (scripts/seed-corpus.ts).
import { chineseHskCorpus } from "./generated/chinese-hsk-corpus";
import { frenchStarterCorpus } from "./generated/french-starter-corpus";
import { germanStarterCorpus } from "./generated/german-starter-corpus";
import { spanishFrequencyCorpus } from "./generated/spanish-frequency-corpus";
import type { DemoLanguage, SupportedLanguageCode } from "../src/lib/demo/types";

export const demoLanguages: DemoLanguage[] = [
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    descriptor: "Primary launch corpus",
    speakerLabel: "Latin America and Spain",
    audioVoice: "Mónica"
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    descriptor: "Starter deck",
    speakerLabel: "France",
    audioVoice: "Thomas"
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    descriptor: "Starter deck",
    speakerLabel: "Germany",
    audioVoice: "Anna"
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    descriptor: "HSK 1-6 launch lists",
    speakerLabel: "Mainland Mandarin",
    audioVoice: "Tingting"
  }
];

export const demoCorpus = [
  ...spanishFrequencyCorpus,
  ...chineseHskCorpus,
  ...frenchStarterCorpus,
  ...germanStarterCorpus
];

export const spanishLaunchList = spanishFrequencyCorpus;

export function getLanguageByCode(code: SupportedLanguageCode) {
  return demoLanguages.find((language) => language.code === code) ?? null;
}
