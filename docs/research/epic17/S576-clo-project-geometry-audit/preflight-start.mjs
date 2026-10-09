import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3417) {
  for (const name of ["S576-start-add-evidence.json", "S576-start-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL("./" + name, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command, { now: "2026-10-09T04:45:56.000Z" });
  }
} else {
  assert.ok([3419, 3421].includes(board.revision), "unexpected board revision for S576 start");
  assert.ok(board.evidence.some(({ id }) => id === "E-G04-S576-START"));
  const workItem = board.workItems.find(({ id }) => id === "G04-V03");
  assert.ok(workItem?.evidenceRefs.includes("E-G04-S576-START"));
  assert.ok(workItem?.comments.some(({ text }) => text.includes("E-G04-S576-START")));
}
assert.ok([3419, 3421].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S576-START"));
console.log(`S576 start preflight passed at board revision ${board.revision}; status remains In Progress.`);
