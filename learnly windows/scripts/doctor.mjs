import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const parent = path.dirname(root);
const require = createRequire(import.meta.url);

const findings = [];
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".next",
  ".learnly",
  "runs"
]);

function addFinding(level, message) {
  findings.push({ level, message });
}

function relativePath(targetPath) {
  return path.relative(root, targetPath) || ".";
}

function getRecommendedNodeVersion() {
  const nvmrcPath = path.join(root, ".nvmrc");
  if (!existsSync(nvmrcPath)) {
    return null;
  }

  return readFileSync(nvmrcPath, "utf8").trim() || null;
}

function checkNodeVersion() {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
  if (Number.isNaN(major) || major < 22 || major >= 25) {
    addFinding(
      "error",
      `Unsupported Node.js version ${process.version}. Use a Node 22-24 runtime for this project.`
    );
    return;
  }

  const recommendedVersion = getRecommendedNodeVersion();
  if (recommendedVersion && process.versions.node !== recommendedVersion) {
    addFinding(
      "warning",
      `Recommended Node.js version is ${recommendedVersion} from .nvmrc, current runtime is ${process.versions.node}.`
    );
  } else {
    addFinding("info", `Node.js runtime ${process.versions.node} is within the supported range.`);
  }
}

function checkPathShape() {
  if (root.includes(" ")) {
    addFinding(
      "warning",
      `Project path contains spaces (${root}). Most Node tooling is fine, but some shell and Python automations can still break.`
    );
  }

  const siblingArchive = path.join(parent, "learnly macOS v1 (ignore)");
  if (existsSync(siblingArchive)) {
    addFinding(
      "warning",
      "A sibling macOS archive copy still exists next to this workspace. Keep `learnly windows` as the canonical app path to avoid editing the wrong tree."
    );
  }
}

function checkNativeDependencies() {
  try {
    require("better-sqlite3");
    addFinding("info", "better-sqlite3 native binding loaded successfully.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addFinding(
      "error",
      `better-sqlite3 failed to load. Reinstall dependencies on this machine with \`npm ci\`. Details: ${message}`
    );
  }
}

function scanForArtifacts(directory, foundFiles, foundBuildInfo) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "__MACOSX") {
        foundFiles.push(relativePath(fullPath));
        continue;
      }

      scanForArtifacts(fullPath, foundFiles, foundBuildInfo);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (
      entry.name === ".DS_Store" ||
      entry.name === "Thumbs.db" ||
      entry.name.startsWith("._")
    ) {
      foundFiles.push(relativePath(fullPath));
      continue;
    }

    if (entry.name.endsWith(".tsbuildinfo")) {
      foundBuildInfo.push(relativePath(fullPath));
    }
  }
}

function checkArtifacts() {
  const archiveArtifacts = [];
  const buildInfoArtifacts = [];
  scanForArtifacts(root, archiveArtifacts, buildInfoArtifacts);

  if (archiveArtifacts.length > 0) {
    addFinding(
      "error",
      `Archive junk is present in the workspace: ${archiveArtifacts.join(", ")}. Run \`npm run clean:artifacts\`.`
    );
  } else {
    addFinding("info", "No macOS/Windows archive junk found in the app workspace.");
  }

  if (buildInfoArtifacts.length > 0) {
    addFinding(
      "warning",
      `Incremental TypeScript build files are present: ${buildInfoArtifacts.join(", ")}. They should stay local and can be removed with \`npm run clean:artifacts\` when switching environments.`
    );
  }

  if (existsSync(path.join(root, ".next"))) {
    addFinding(
      "warning",
      "`.next` exists. That is fine locally, but if you moved the project across OSes, clear it with `npm run clean:runtime`."
    );
  }

  if (existsSync(path.join(root, ".learnly"))) {
    addFinding(
      "warning",
      "`.learnly` exists. Local DB and audio cache are machine-local state; do not copy them between operating systems."
    );
  }
}

function printFindings() {
  for (const level of ["error", "warning", "info"]) {
    const levelFindings = findings.filter((finding) => finding.level === level);
    if (levelFindings.length === 0) {
      continue;
    }

    console.log(`${level.toUpperCase()}:`);
    for (const finding of levelFindings) {
      console.log(`- ${finding.message}`);
    }
  }
}

checkNodeVersion();
checkPathShape();
checkNativeDependencies();
checkArtifacts();
printFindings();

const hasErrors = findings.some((finding) => finding.level === "error");
if (hasErrors) {
  process.exit(1);
}
