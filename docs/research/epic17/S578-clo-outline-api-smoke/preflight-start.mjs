import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3425) {
  for (const name of ["S578-start-add-evidence.json", "S578-start-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL("./" + name, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command, { now: "2026-10-09T04:56:39.000Z" });
  }
} else {
  assert.ok([3427, 3429].includes(board.revision), "unexpected board revision for S578 start");
  assert.ok(board.evidence.some(({ id }) => id === "E-G04-S578-START"));
}
assert.ok([3427, 3429].includes(board.revision));
assert.equal(board.epics.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
console.log(`S578 start preflight passed at board revision ${board.revision}; Epic/V03 statuses unchanged.`);
