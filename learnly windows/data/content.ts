// These generated corpus files live outside src/ to avoid burdening tsc/webpack.
// Only consumed by the seed script (scripts/seed-corpus.ts).
import { chineseHskCorpus } from "./generated/chinese-hsk-corpus";
import { chineseHsk1NewCorpus } from "./generated/chinese-hsk1-new-corpus";
import { chineseHsk2NewCorpus } from "./generated/chinese-hsk2-new-corpus";
import { chineseHsk3NewCorpus } from "./generated/chinese-hsk3-new-corpus";
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
  },
  {
    code: "zh-hsk1",
    name: "HSK 1",
    nativeName: "HSK 一级",
    descriptor: "New HSK Level 1 (500 words)",
    speakerLabel: "Mainland Mandarin",
    audioVoice: "Tingting"
  },
  {
    code: "zh-hsk2",
    name: "HSK 2",
    nativeName: "HSK 二级",
    descriptor: "New HSK Level 2 (772 words)",
    speakerLabel: "Mainland Mandarin",
    audioVoice: "Tingting"
  },
  {
    code: "zh-hsk3",
    name: "HSK 3",
    nativeName: "HSK 三级",
    descriptor: "New HSK Level 3 (325 words)",
    speakerLabel: "Mainland Mandarin",
    audioVoice: "Tingting"
  }
];

export const demoCorpus = [
  ...spanishFrequencyCorpus,
  ...chineseHskCorpus,
  ...chineseHsk1NewCorpus,
  ...chineseHsk2NewCorpus,
  ...chineseHsk3NewCorpus,
  ...frenchStarterCorpus,
  ...germanStarterCorpus
];

export const spanishLaunchList = spanishFrequencyCorpus;

export function getLanguageByCode(code: SupportedLanguageCode) {
  return demoLanguages.find((language) => language.code === code) ?? null;
}
