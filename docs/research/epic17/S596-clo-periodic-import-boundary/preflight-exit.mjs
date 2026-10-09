import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3516, "refusing stale S596 exit preflight");
const directory = "docs/research/epic17/S596-clo-periodic-import-boundary";
for (const name of ["S596-exit-add-evidence.json", "S596-exit-add-comment.json"]) board = applyBoardCommand(board, JSON.parse(await readFile(`${directory}/${name}`, "utf8")));
assert.equal(board.revision, 3518);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S596-EXIT"));
console.log("S596 exit commands pass clone preflight at 3516→3518; statuses and evidence are preserved.");
