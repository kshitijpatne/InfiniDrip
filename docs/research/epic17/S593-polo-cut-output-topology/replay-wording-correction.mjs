import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S593-polo-cut-output-topology";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3497, "refusing stale S593 wording-correction replay");
for (const name of ["edit-epic-canonical-wording", "edit-item-canonical-wording", "add-wording-correction-comment"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/S593-${name}.json`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3500);
for (const value of [after.epics.find(({ id }) => id === "EPIC-17"), after.workItems.find(({ id }) => id === "EPIC-17")]) {
  assert.match(value.description, /S459 accepts all seven recipes, 73 supported configurations and 146 front\/back faces/);
  assert.match(value.description, /S406's approved view-only collar-over-plackets order remains implemented/);
}
console.log("S593 board wording correction replay passed at revision 3500.");
