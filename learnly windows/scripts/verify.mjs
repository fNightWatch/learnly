import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
const steps = [
  ["run", "doctor"],
  ["run", "typecheck"],
  ["run", "build"]
];

if (!npmCli) {
  console.error("npm_execpath is not available. Run `npm run verify` through npm.");
  process.exit(1);
}

for (const step of steps) {
  const result = spawnSync(process.execPath, [npmCli, ...step], {
    stdio: "inherit",
    shell: false
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
}
