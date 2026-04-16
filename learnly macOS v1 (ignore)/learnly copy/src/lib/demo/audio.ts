import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { execFileSync } from "child_process";
import { AUDIO_ASSET_VERSION } from "@/lib/demo/audio-source";
import type { SupportedLanguageCode } from "@/lib/demo/types";
import { getDb } from "@/lib/db/local-client";
import { eq } from "drizzle-orm";
import * as tables from "@/lib/db/sqlite-schema";

type AudioMode = "term" | "example";

// ---------------------------------------------------------------------------
// ElevenLabs TTS configuration
// ---------------------------------------------------------------------------

const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * Per-language voice IDs from the ElevenLabs voice library.
 * Using the multilingual v2 model — a single high-quality voice handles
 * all four languages naturally when provided with the correct language_code.
 *
 * "Rachel" (21m00Tcm4TlvDq8ikWAM) is a clear, neutral female voice
 * that works well across all supported languages with eleven_multilingual_v2.
 */
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const ELEVENLABS_MODEL = "eleven_multilingual_v2";

const ELEVENLABS_LANGUAGE_CODES: Record<SupportedLanguageCode, string> = {
  es: "es",
  fr: "fr",
  de: "de",
  zh: "zh",
  "zh-hsk1": "zh",
  "zh-hsk2": "zh",
  "zh-hsk3": "zh"
};

const TERM_STABILITY = 0.75;
const TERM_SIMILARITY = 0.85;
const EXAMPLE_STABILITY = 0.5;
const EXAMPLE_SIMILARITY = 0.75;

// ---------------------------------------------------------------------------
// macOS `say` fallback configuration (used when no API key is set)
// ---------------------------------------------------------------------------

type MacOsVoice = { name: string; locale: string };

const AUDIO_DIRECTORY = path.join(process.cwd(), ".learnly", "audio-cache");
const DEFAULT_VOICE = "Samantha";
const TERM_RATE = "150";
const EXAMPLE_RATE = "168";
const FALLBACK_VOICES_BY_LANGUAGE: Record<SupportedLanguageCode, string[]> = {
  es: ["Mónica"],
  fr: ["Thomas"],
  de: ["Anna"],
  zh: [
    "Tingting",
    "Flo (Chinese (China mainland))",
    "Sandy (Chinese (China mainland))",
    "Shelley (Chinese (China mainland))",
    "Meijia",
    "Sinji"
  ],
  "zh-hsk1": [
    "Tingting",
    "Flo (Chinese (China mainland))",
    "Sandy (Chinese (China mainland))",
    "Shelley (Chinese (China mainland))",
    "Meijia",
    "Sinji"
  ],
  "zh-hsk2": [
    "Tingting",
    "Flo (Chinese (China mainland))",
    "Sandy (Chinese (China mainland))",
    "Shelley (Chinese (China mainland))",
    "Meijia",
    "Sinji"
  ],
  "zh-hsk3": [
    "Tingting",
    "Flo (Chinese (China mainland))",
    "Sandy (Chinese (China mainland))",
    "Shelley (Chinese (China mainland))",
    "Meijia",
    "Sinji"
  ]
};

let cachedMacOsVoices: MacOsVoice[] | null = null;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function ensureAudioDirectory() {
  mkdirSync(AUDIO_DIRECTORY, { recursive: true });
}

function getAudioItem(itemId: string) {
  const db = getDb();
  const row = db.select().from(tables.corpusItems).where(eq(tables.corpusItems.id, itemId)).get();
  if (!row) {
    throw new Error("Audio item not found");
  }
  return {
    id: row.id,
    languageCode: row.languageCode as SupportedLanguageCode,
    displayForm: row.displayForm,
    example: row.example,
  };
}

function getExampleSentence(itemId: string, exampleIndex: number): string | null {
  const db = getDb();
  const examples = db.select().from(tables.corpusItemExamples)
    .where(eq(tables.corpusItemExamples.itemId, itemId))
    .orderBy(tables.corpusItemExamples.sortOrder)
    .all();
  if (exampleIndex < examples.length) {
    return examples[exampleIndex].sentence;
  }
  return null;
}

function getAudioText(itemId: string, mode: AudioMode, exampleIndex?: number) {
  const item = getAudioItem(itemId);
  if (mode === "term") {
    return item.displayForm.replace(/\s+\?/g, "?");
  }
  if (typeof exampleIndex === "number") {
    const sentence = getExampleSentence(itemId, exampleIndex);
    if (sentence) return sentence.replace(/\s+\?/g, "?");
  }
  return item.example.replace(/\s+\?/g, "?");
}

// ---------------------------------------------------------------------------
// ElevenLabs TTS
// ---------------------------------------------------------------------------

function getElevenLabsApiKey(): string | null {
  return process.env.ELEVENLABS_API_KEY ?? null;
}

function getElevenLabsCachePath(itemId: string, mode: AudioMode, exampleIndex?: number) {
  const eiSuffix = typeof exampleIndex === "number" ? `-ei${exampleIndex}` : "";
  return path.join(AUDIO_DIRECTORY, `${itemId}-${mode}${eiSuffix}-elevenlabs-${AUDIO_ASSET_VERSION}.mp3`);
}

async function synthesizeWithElevenLabs(
  text: string,
  languageCode: SupportedLanguageCode,
  mode: AudioMode,
  apiKey: string
): Promise<Buffer> {
  const isTermMode = mode === "term";

  const requestBody = {
    text,
    model_id: ELEVENLABS_MODEL,
    language_code: ELEVENLABS_LANGUAGE_CODES[languageCode],
    voice_settings: {
      stability: isTermMode ? TERM_STABILITY : EXAMPLE_STABILITY,
      similarity_boost: isTermMode ? TERM_SIMILARITY : EXAMPLE_SIMILARITY,
      style: 0,
      use_speaker_boost: true
    }
  };

  const url = `${ELEVENLABS_ENDPOINT}/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS API error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getElevenLabsAudio(itemId: string, mode: AudioMode, apiKey: string, exampleIndex?: number): Promise<Buffer> {
  const cachePath = getElevenLabsCachePath(itemId, mode, exampleIndex);

  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }

  const item = getAudioItem(itemId);
  const text = getAudioText(itemId, mode, exampleIndex);
  const audioBuffer = await synthesizeWithElevenLabs(text, item.languageCode, mode, apiKey);

  const tempPath = cachePath + `.${Date.now()}.tmp`;
  await writeFile(tempPath, audioBuffer);
  renameSync(tempPath, cachePath);

  return audioBuffer;
}

// ---------------------------------------------------------------------------
// macOS `say` fallback
// ---------------------------------------------------------------------------

function normalizeVoiceKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getAvailableMacOsVoices() {
  if (cachedMacOsVoices) {
    return cachedMacOsVoices;
  }

  try {
    const output = execFileSync("say", ["-v", "?"], { encoding: "utf8" });
    cachedMacOsVoices = output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.+?)\s{2,}([A-Za-z_]+)\s+#/);
        return match ? { name: match[1].trim(), locale: match[2].trim() } : null;
      })
      .filter((voice): voice is MacOsVoice => Boolean(voice));
  } catch {
    cachedMacOsVoices = [];
  }

  return cachedMacOsVoices;
}

function resolveMacOsVoice(languageCode: SupportedLanguageCode, preferredVoice: string) {
  const availableVoices = getAvailableMacOsVoices();

  if (availableVoices.length === 0) {
    return preferredVoice;
  }

  const candidateNames = [preferredVoice, ...FALLBACK_VOICES_BY_LANGUAGE[languageCode]];
  for (const candidateName of candidateNames) {
    const match = availableVoices.find(
      (voice) => normalizeVoiceKey(voice.name) === normalizeVoiceKey(candidateName)
    );
    if (match) {
      return match.name;
    }
  }

  const localePrefixes: Record<SupportedLanguageCode, string[]> = {
    es: ["es"],
    fr: ["fr"],
    de: ["de"],
    zh: ["zh", "cmn"],
    "zh-hsk1": ["zh", "cmn"],
    "zh-hsk2": ["zh", "cmn"],
    "zh-hsk3": ["zh", "cmn"]
  };

  const preferredLocalesByLanguage: Record<SupportedLanguageCode, string[]> = {
    es: ["es_"],
    fr: ["fr_"],
    de: ["de_"],
    zh: ["zh_cn", "cmn", "zh_tw", "zh_hk"],
    "zh-hsk1": ["zh_cn", "cmn", "zh_tw", "zh_hk"],
    "zh-hsk2": ["zh_cn", "cmn", "zh_tw", "zh_hk"],
    "zh-hsk3": ["zh_cn", "cmn", "zh_tw", "zh_hk"]
  };

  const localeMatch =
    availableVoices.find((voice) => {
      const locale = voice.locale.toLowerCase();
      return preferredLocalesByLanguage[languageCode].some((prefix) => locale.startsWith(prefix));
    }) ??
    availableVoices.find((voice) =>
      localePrefixes[languageCode].some((prefix) => voice.locale.toLowerCase().startsWith(prefix))
    );

  return localeMatch?.name ?? preferredVoice;
}

function getMacOsVoice(itemId: string) {
  const item = getAudioItem(itemId);
  const db = getDb();
  const lang = db.select().from(tables.corpusLanguages).where(eq(tables.corpusLanguages.code, item.languageCode)).get();
  const preferredVoice = lang?.audioVoice ?? DEFAULT_VOICE;
  return resolveMacOsVoice(item.languageCode, preferredVoice);
}

function getMacOsCachePath(itemId: string, mode: AudioMode, voice: string, exampleIndex?: number) {
  const safeVoice = voice.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const eiSuffix = typeof exampleIndex === "number" ? `-ei${exampleIndex}` : "";
  return path.join(AUDIO_DIRECTORY, `${itemId}-${mode}${eiSuffix}-${safeVoice}-${AUDIO_ASSET_VERSION}.m4a`);
}

function getMacOsAudio(itemId: string, mode: AudioMode, exampleIndex?: number): Buffer {
  const voice = getMacOsVoice(itemId);
  const outputPath = getMacOsCachePath(itemId, mode, voice, exampleIndex);

  if (!existsSync(outputPath)) {
    const tempAiffPath = path.join(AUDIO_DIRECTORY, `${itemId}-${mode}-${Date.now()}.aiff`);
    const tempM4aPath = path.join(AUDIO_DIRECTORY, `${itemId}-${mode}-${Date.now()}.m4a`);
    const text = getAudioText(itemId, mode, exampleIndex);
    const rate = mode === "term" ? TERM_RATE : EXAMPLE_RATE;

    try {
      execFileSync("say", ["-v", voice, "-r", rate, text, "-o", tempAiffPath]);
      execFileSync("afconvert", ["-f", "m4af", "-d", "aac", tempAiffPath, tempM4aPath]);
      renameSync(tempM4aPath, outputPath);
    } finally {
      rmSync(tempAiffPath, { force: true });
      rmSync(tempM4aPath, { force: true });
    }
  }

  return readFileSync(outputPath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GeneratedAudioResult = {
  buffer: Buffer;
  contentType: string;
};

/**
 * Generate or retrieve cached audio for a vocabulary item.
 * Uses ElevenLabs when ELEVENLABS_API_KEY is set,
 * falls back to macOS `say` command otherwise.
 */
export async function getGeneratedAudio(
  itemId: string,
  mode: AudioMode,
  exampleIndex?: number
): Promise<GeneratedAudioResult> {
  ensureAudioDirectory();

  const apiKey = getElevenLabsApiKey();

  if (apiKey) {
    const buffer = await getElevenLabsAudio(itemId, mode, apiKey, exampleIndex);
    return { buffer, contentType: "audio/mpeg" };
  }

  const buffer = getMacOsAudio(itemId, mode, exampleIndex);
  return { buffer, contentType: "audio/mp4" };
}
