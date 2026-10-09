import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3421) {
  for (const name of ["S577-start-add-evidence.json", "S577-start-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL("./" + name, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command, { now: "2026-10-09T04:52:07.000Z" });
  }
} else {
  assert.ok([3423, 3425].includes(board.revision), "unexpected board revision for S577 start");
  assert.ok(board.evidence.some(({ id }) => id === "E-G04-S577-START"));
  const workItem = board.workItems.find(({ id }) => id === "G04-V03");
  assert.ok(workItem?.evidenceRefs.includes("E-G04-S577-START"));
  assert.ok(workItem?.comments.some(({ text }) => text.includes("E-G04-S577-START")));
}
assert.ok([3423, 3425].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log(`S577 start preflight passed at board revision ${board.revision}; status remains In Progress.`);
