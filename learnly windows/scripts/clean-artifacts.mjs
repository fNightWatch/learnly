import { readdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const removeRuntimeOutput = args.has("--with-next");
const removeLocalState = args.has("--with-state");

const IGNORED_DIRECTORIES = new Set([".git", "node_modules"]);
const removableFiles = new Set([".DS_Store", "Thumbs.db"]);

const removedPaths = [];

function shouldRemoveDirectory(name) {
  if (name === "__MACOSX") return true;
  if (name === ".next") return removeRuntimeOutput;
  if (name === ".learnly") return removeLocalState;
  return false;
}

function shouldRemoveFile(name) {
  return removableFiles.has(name) || name.startsWith("._") || name.endsWith(".tsbuildinfo");
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (shouldRemoveDirectory(entry.name)) {
        rmSync(fullPath, { recursive: true, force: true });
        removedPaths.push(path.relative(root, fullPath) || ".");
        continue;
      }

      walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (shouldRemoveFile(entry.name)) {
      rmSync(fullPath, { force: true });
      removedPaths.push(path.relative(root, fullPath) || ".");
    }
  }
}

walk(root);

if (removedPaths.length === 0) {
  console.log("No archive junk or stale build artifacts found.");
  process.exit(0);
}

console.log("Removed:");
for (const removedPath of removedPaths.sort()) {
  console.log(`- ${removedPath}`);
}
