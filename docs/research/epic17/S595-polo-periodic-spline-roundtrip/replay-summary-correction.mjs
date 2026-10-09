import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S595-polo-periodic-spline-roundtrip";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3514) {
  assert.match(before.epics.find(({ id }) => id === "EPIC-17")?.description, /Preserve V02-before-V03, legacy DXF behavior and protected export identities/);
  console.log("S595 summary correction already applied at revision 3514.");
  process.exit(0);
}
assert.equal(before.revision, 3512, "refusing stale summary correction replay");
for (const name of ["1", "2"]) execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/S595-summary-correction-${name}.json`], { stdio: "inherit" });
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3514);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(after.evidence.some(({ id }) => id === "E-G04-S595-EXIT"));
console.log("S595 summary correction replay passed at revision 3514; statuses and exit evidence are preserved.");
