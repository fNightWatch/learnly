import {
  prepareCoreLoopFixture,
  type CoreLoopFixtureKind,
  type CoreLoopFixtureOptions,
} from "./core-loop-fixtures";

function main() {
  const kind = (process.argv[2] ?? "fresh") as CoreLoopFixtureKind;
  const rawOptions = process.argv[3];
  const options = rawOptions ? (JSON.parse(rawOptions) as CoreLoopFixtureOptions) : {};
  const fixture = prepareCoreLoopFixture(kind, options);
  process.stdout.write(`${JSON.stringify(fixture, null, 2)}\n`);
  process.exit(0);
}

main();
