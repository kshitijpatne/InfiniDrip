import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S593-polo-cut-output-topology";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3491, "refusing stale S593 start preflight");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
let candidate = board;
for (const name of ["S593-start-add-evidence.json", "S593-start-add-comment.json"]) {
  candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(candidate.revision, 3493);
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S593-START"));
console.log("S593 start commands pass clone preflight at 3491→3493; V02/V03 status is preserved.");
