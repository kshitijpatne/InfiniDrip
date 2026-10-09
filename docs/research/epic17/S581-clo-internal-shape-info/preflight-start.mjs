import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision === 3437) {
  let projected = board;
  for (const name of ["S581-start-add-evidence.json", "S581-start-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, projected.revision);
    projected = applyBoardCommand(projected, command, { now: "2026-10-09T05:22:32.000Z" });
  }
  assert.equal(projected.revision, 3439);
  assert.ok(projected.evidence.some(({ id }) => id === "E-G04-S581-START"));
} else {
  assert.equal(board.revision, 3439, "unexpected board revision at S581 start");
  assert.ok(board.evidence.some(({ id }) => id === "E-G04-S581-START"));
}
console.log(`S581 start preflight passed at board revision ${board.revision}; V02 Done, V03 In Progress.`);
