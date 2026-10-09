import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3415) {
  for (const name of ["S575-exit-add-evidence.json", "S575-exit-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL("./" + name, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command, { now: "2026-10-09T04:42:00.000Z" });
  }
} else {
  assert.equal(board.revision, 3417, "unexpected board revision for S575 exit");
  assert.ok(board.evidence.some(({ id }) => id === "E-G04-S575-EXIT"));
  const workItem = board.workItems.find(({ id }) => id === "G04-V03");
  assert.ok(workItem?.evidenceRefs.includes("E-G04-S575-EXIT"));
  assert.ok(workItem?.comments.some(({ text }) => text.includes("E-G04-S575-EXIT")));
}
assert.equal(board.revision, 3417);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S575-EXIT"));
console.log(`S575 exit preflight passed; exit evidence is present at board revision ${board.revision}; status remains In Progress.`);
