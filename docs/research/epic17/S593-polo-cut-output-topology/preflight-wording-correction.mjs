import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = "docs/research/epic17/S593-polo-cut-output-topology";
let candidate = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(candidate.revision, 3497, "refusing stale wording correction");
for (const name of ["edit-epic-canonical-wording", "edit-item-canonical-wording", "add-wording-correction-comment"]) {
  candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${directory}/S593-${name}.json`, "utf8")));
}
assert.equal(candidate.revision, 3500);
for (const value of [candidate.epics.find(({ id }) => id === "EPIC-17"), candidate.workItems.find(({ id }) => id === "EPIC-17")]) {
  assert.match(value.description, /S459 accepts all seven recipes, 73 supported configurations and 146 front\/back faces/);
  assert.match(value.description, /S406's approved view-only collar-over-plackets order remains implemented/);
}
assert.match(candidate.epics.find(({ id }) => id === "EPIC-17").description, /Woven's 56 local faces pass the approved S457 front mask and local-Y back\/band placement/);
assert.match(candidate.workItems.find(({ id }) => id === "EPIC-17").description, /V01 and V02 are Done/);
assert.match(candidate.workItems.find(({ id }) => id === "EPIC-17").description, /Preserve V02-before-V03, legacy DXF behavior and protected export identities/);
console.log("S593 wording-correction commands pass clone preflight at 3497→3500; scope and statuses are retained.");
