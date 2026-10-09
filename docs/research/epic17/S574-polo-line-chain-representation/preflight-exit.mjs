import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
for (const name of ["S574-exit-add-evidence.json", "S574-exit-add-comment.json"]) {
  const command = JSON.parse(await readFile(new URL("./" + name, import.meta.url), "utf8"));
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command, { now: "2026-10-09T04:33:00.000Z" });
}
assert.equal(board.revision, 3413);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S574-EXIT"));
console.log("S574 exit preflight passed at revision 3411; two additive commands; status remains In Progress.");
