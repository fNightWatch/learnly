import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

type PlaywrightAnnotation = {
  type: string;
  description?: string;
};

type PlaywrightResult = {
  status: string;
  error?: { message?: string; value?: string };
  errors?: Array<{ message?: string; value?: string }>;
};

type PlaywrightTest = {
  projectName?: string;
  annotations?: PlaywrightAnnotation[];
  results?: PlaywrightResult[];
};

type PlaywrightSpec = {
  title: string;
  file?: string;
  tests?: PlaywrightTest[];
  suites?: PlaywrightSuite[];
};

type PlaywrightSuite = {
  title?: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
};

type PlaywrightJsonReport = {
  stats?: {
    expected?: number;
    unexpected?: number;
    skipped?: number;
    flaky?: number;
    duration?: number;
  };
  suites?: PlaywrightSuite[];
};

type RunSummary = {
  label: string;
  ok: boolean;
  durationMs: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  failedTests: string[];
  skippedTests: string[];
  note?: string;
};

type CaptureRecord = {
  name: string;
  path: string;
  route: string;
  fixture: string;
  viewport: { width: number; height: number };
  theme: "light" | "dark";
};

function runCommand(command: string, args: string[], env?: Record<string, string>) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function runCapture(): string {
  const result = runCommand("npm", ["run", "qa:core-loop:capture"]);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Failed to generate QA screenshots.");
  }

  const artifactDir = result.stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  if (!artifactDir) {
    throw new Error("Capture script did not return an artifact directory.");
  }

  return artifactDir;
}

function resetFixtureBaseline() {
  const result = runCommand("npm", ["run", "qa:fixture", "--", "fresh"]);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Failed to reset the core-loop fixture baseline.");
  }
}

function parsePlaywrightReport(stdout: string): PlaywrightJsonReport {
  try {
    return JSON.parse(stdout) as PlaywrightJsonReport;
  } catch (error) {
    throw new Error(`Could not parse Playwright JSON output: ${(error as Error).message}`);
  }
}

function collectSpecEntries(
  suites: PlaywrightSuite[] | undefined,
  titleTrail: string[] = []
): Array<{ title: string; test: PlaywrightTest }> {
  if (!suites?.length) {
    return [];
  }

  const entries: Array<{ title: string; test: PlaywrightTest }> = [];

  for (const suite of suites) {
    const nextTrail = suite.title ? [...titleTrail, suite.title] : titleTrail;

    for (const spec of suite.specs ?? []) {
      const specTrail = [...nextTrail, spec.title];
      for (const test of spec.tests ?? []) {
        const projectPrefix = test.projectName ? `[${test.projectName}] ` : "";
        entries.push({
          title: `${projectPrefix}${specTrail.filter(Boolean).join(" > ")}`,
          test,
        });
      }

      if (spec.suites?.length) {
        entries.push(...collectSpecEntries(spec.suites, specTrail));
      }
    }

    if (suite.suites?.length) {
      entries.push(...collectSpecEntries(suite.suites, nextTrail));
    }
  }

  return entries;
}

function buildRunSummary(label: string, stdout: string, status: number, note?: string): RunSummary {
  const report = parsePlaywrightReport(stdout);
  const entries = collectSpecEntries(report.suites);
  const failedTests: string[] = [];
  const skippedTests: string[] = [];

  for (const entry of entries) {
    const lastResult = entry.test.results?.at(-1);
    const annotationTypes = new Set((entry.test.annotations ?? []).map((annotation) => annotation.type));
    const lastStatus = lastResult?.status;

    if (lastStatus === "failed" || lastStatus === "timedOut" || lastStatus === "interrupted") {
      failedTests.push(entry.title);
      continue;
    }

    if (lastStatus === "skipped" || annotationTypes.has("fixme") || annotationTypes.has("skip")) {
      skippedTests.push(entry.title);
    }
  }

  return {
    label,
    ok: status === 0,
    durationMs: report.stats?.duration ?? 0,
    passed: report.stats?.expected ?? 0,
    failed: report.stats?.unexpected ?? failedTests.length,
    skipped: report.stats?.skipped ?? skippedTests.length,
    flaky: report.stats?.flaky ?? 0,
    failedTests,
    skippedTests,
    note,
  };
}

function runPlaywright(
  label: string,
  args: string[],
  note?: string,
  env?: Record<string, string>
): RunSummary {
  const outputPath = path.join(
    "/tmp",
    `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.json`
  );
  const quotedArgs = ["playwright", "test", ...args, "--reporter=json"]
    .map((arg) => `'${arg.replace(/'/g, `'\\''`)}'`)
    .join(" ");
  const result = runCommand(
    "/bin/zsh",
    ["-lc", `npx ${quotedArgs} > '${outputPath}'`],
    env
  );
  let stdout = "";
  try {
    stdout = readFileSync(outputPath, "utf8");
  } catch {
    stdout = "";
  }

  if (!stdout.trim()) {
    return {
      label,
      ok: false,
      durationMs: 0,
      passed: 0,
      failed: 1,
      skipped: 0,
      flaky: 0,
      failedTests: [],
      skippedTests: [],
      note: note ?? (result.stderr.trim() || "No output from Playwright."),
    };
  }

  const summary = buildRunSummary(label, stdout, result.status ?? 1, note);
  try {
    unlinkSync(outputPath);
  } catch {
    // best-effort cleanup
  }
  return summary;
}

function canRunSafari() {
  const result = runCommand("npx", ["playwright", "install", "--dry-run", "webkit"]);
  const combined = `${result.stdout}\n${result.stderr}`;
  return combined.includes("browser: webkit version");
}

function formatBulletList(items: string[], emptyText: string) {
  if (!items.length) {
    return `- ${emptyText}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatSummaryLine(summary: RunSummary) {
  const parts = [
    `${summary.label}: ${summary.ok ? "passed" : "failed"}`,
    `${summary.passed} passed`,
    `${summary.failed} failed`,
    `${summary.skipped} skipped`,
  ];

  if (summary.flaky > 0) {
    parts.push(`${summary.flaky} flaky`);
  }

  if (summary.note) {
    parts.push(summary.note);
  }

  return `- ${parts.join(" · ")}`;
}

function buildReport({
  captures,
  chrome,
  safari,
}: {
  captures: CaptureRecord[];
  chrome: RunSummary;
  safari: RunSummary | null;
}) {
  const screenshotList = captures
    .map((record) => `- \`${record.name}\` — [${record.path}](${record.path})`)
    .join("\n");

  const functionalRegressions = [
    ...chrome.failedTests,
    ...(safari?.failedTests ?? []),
  ];

  const uxBlockers = chrome.skippedTests;
  const visualInconsistencies =
    safari && !safari.ok && safari.note ? [`Safari sanity not completed: ${safari.note}`] : [];

  const summaryLines = [
    formatSummaryLine(chrome),
    safari ? formatSummaryLine(safari) : "- Safari sanity: not run",
  ].join("\n");

  return `# Core Loop QA Report

## Screenshot Set
${screenshotList}

## Functional Regressions
${formatBulletList(functionalRegressions, "None in the automated core-loop suite.")}

## UX Blockers
${formatBulletList(
  uxBlockers,
  "No automated UX blockers were flagged. Use the manual audit checklist for product-quality review."
)}

## Visual Inconsistencies
${formatBulletList(
  visualInconsistencies,
  "No automated visual inconsistencies were flagged. Manual screenshot review still required."
)}

## Regression Summary
${summaryLines}

## Core-loop Scorecard
- Home clarity: manual review required against the screenshot set.
- Dashboard actionability: manual review required against the screenshot set.
- Study focus: manual review required against the screenshot set.
- Mobile viability: ${chrome.skippedTests.length ? "needs human judgment for known blocker(s)." : "no automated blocker flagged."}
- Dark-mode parity: manual screenshot comparison required.
`;
}

async function main() {
  resetFixtureBaseline();
  const chrome = runPlaywright("Chrome core loop", ["--project=chrome"]);
  const safari = canRunSafari()
    ? runPlaywright(
        "Safari sanity",
        ["tests/e2e/safari-sanity.spec.ts", "--project=webkit"],
        "Sanity sweep for home, dashboard, and study setup."
      )
    : {
        label: "Safari sanity",
        ok: false,
        durationMs: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        failedTests: [],
        skippedTests: [],
        note: "WebKit browser is not installed in this environment.",
      };

  resetFixtureBaseline();
  const artifactDir = runCapture();
  const manifestPath = path.join(artifactDir, "manifest.json");
  const captures = JSON.parse(readFileSync(manifestPath, "utf8")) as CaptureRecord[];
  const report = buildReport({ captures, chrome, safari });
  writeFileSync(path.join(artifactDir, "report.md"), report);

  const summaryDir = path.join(artifactDir, "results");
  mkdirSync(summaryDir, { recursive: true });
  writeFileSync(
    path.join(summaryDir, "summary.json"),
    JSON.stringify({ chrome, safari }, null, 2)
  );

  process.stdout.write(`${artifactDir}\n`);

  if (!chrome.ok || (safari && !safari.ok && safari.note !== "WebKit browser is not installed in this environment.")) {
    process.exitCode = 1;
  }
}

void main();
