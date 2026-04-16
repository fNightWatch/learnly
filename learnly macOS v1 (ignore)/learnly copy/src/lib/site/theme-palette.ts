export type ThemePaletteKey = "classic" | "brume-menthe" | "mint-sea" | "lime-forest" | "violet-lime";

export const THEME_PALETTE_STORAGE_KEY = "languagehack-palette";
export const LEGACY_THEME_PALETTE_STORAGE_KEY = "lemma-palette";
export const DEFAULT_THEME_PALETTE: ThemePaletteKey = "classic";

export const themePalettes: Array<{
  key: ThemePaletteKey;
  name: string;
  description: string;
  swatches: [string, string, string, string];
}> = [
  {
    key: "classic",
    name: "Original",
    description: "Orange, sky, navy, coral",
    swatches: ["#FF991C", "#51A9EC", "#234C74", "#C45B4A"]
  },
  {
    key: "brume-menthe",
    name: "Brume Menthe",
    description: "Mist, mint, limonade, verveine",
    swatches: ["#35C8B4", "#A4CF4A", "#C2F2E4", "#EDF7BE"]
  },
  {
    key: "mint-sea",
    name: "Mint Sea Orange",
    description: "Mint green, sea green, orange peel",
    swatches: ["#FF9F1C", "#2EC4B6", "#CBF3F0", "#2EC4B6"]
  },
  {
    key: "lime-forest",
    name: "Lime Forest",
    description: "Lime, forest, ivory, jet",
    swatches: ["#224F10", "#B0E454", "#EAFFD0", "#0D0D0D"]
  },
  {
    key: "violet-lime",
    name: "Violet Lime",
    description: "Black, violet, lime, white",
    swatches: ["#7D39EB", "#C6FF33", "#FFFFFF", "#000000"]
  }
];

const legacyPaletteAliases: Record<string, ThemePaletteKey> = {
  brume: "brume-menthe",
  mint: "mint-sea",
  forest: "lime-forest",
  grid: "violet-lime"
};

export function isThemePaletteKey(value: string | null | undefined): value is ThemePaletteKey {
  return themePalettes.some((palette) => palette.key === value);
}

export function resolveThemePalette(value: string | null | undefined): ThemePaletteKey {
  if (isThemePaletteKey(value)) {
    return value;
  }

  if (!value) {
    return DEFAULT_THEME_PALETTE;
  }

  return legacyPaletteAliases[value] ?? DEFAULT_THEME_PALETTE;
}

export function getStoredThemePalette(): ThemePaletteKey {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PALETTE;
  }

  const saved =
    window.localStorage.getItem(THEME_PALETTE_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_THEME_PALETTE_STORAGE_KEY);

  return resolveThemePalette(saved);
}

export function applyThemePalette(palette: ThemePaletteKey) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.palette = palette;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, palette);
    window.localStorage.removeItem(LEGACY_THEME_PALETTE_STORAGE_KEY);
  }
}
