export type ImportanceInputs = {
  logFrequency: number;
  dispersion: number;
  spokenUtility: number;
  beginnerUtility: number;
  editorialBoost: number;
  properNounPenalty: number;
  tabooPenalty: number;
  ambiguityPenalty: number;
};

export type ExampleScoreInputs = {
  naturalness: number;
  brevity: number;
  targetClarity: number;
  learnerCoverage: number;
  translationClarity: number;
};

export function calculateImportanceScore(inputs: ImportanceInputs) {
  const score =
    0.45 * inputs.logFrequency +
    0.2 * inputs.dispersion +
    0.15 * inputs.spokenUtility +
    0.1 * inputs.beginnerUtility +
    0.1 * inputs.editorialBoost -
    0.2 * inputs.properNounPenalty -
    0.15 * inputs.tabooPenalty -
    0.1 * inputs.ambiguityPenalty;

  return Number(score.toFixed(4));
}

export function calculateExampleScore(inputs: ExampleScoreInputs) {
  const score =
    0.3 * inputs.naturalness +
    0.2 * inputs.brevity +
    0.25 * inputs.targetClarity +
    0.15 * inputs.learnerCoverage +
    0.1 * inputs.translationClarity;

  return Number(score.toFixed(4));
}
