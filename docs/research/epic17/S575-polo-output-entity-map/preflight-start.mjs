import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const evidence = board.evidence.find(({ id }) => id === "E-G04-S575-START");
const workItem = board.workItems.find(({ id }) => id === "G04-V03");
const commentPresent = workItem?.comments.some(({ text }) => text.startsWith("S575 maps source CUT paths"));
if (board.revision === 3413) {
  for (const name of ["S575-start-add-evidence.json", "S575-start-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL("./" + name, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command, { now: "2026-10-09T04:36:23.000Z" });
  }
} else {
  assert.ok([3415, 3417].includes(board.revision), "unexpected board revision for S575 admission");
  assert.ok(evidence, "S575 start evidence must already be recorded");
  assert.ok(workItem?.evidenceRefs.includes("E-G04-S575-START"));
  assert.ok(commentPresent, "S575 start comment must already be recorded");
}
assert.ok([3415, 3417].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S575-START"));
console.log(`S575 start preflight passed; admission entries are present at board revision ${board.revision}; status remains In Progress.`);
