import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3514, "refusing stale S596 start preflight");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const directory = "docs/research/epic17/S596-clo-periodic-import-boundary";
for (const name of ["S596-start-add-evidence.json", "S596-start-add-comment.json"]) board = applyBoardCommand(board, JSON.parse(await readFile(`${directory}/${name}`, "utf8")));
assert.equal(board.revision, 3516);
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S596-START"));
console.log("S596 start commands pass clone preflight at 3514→3516; G04 statuses remain unchanged.");
