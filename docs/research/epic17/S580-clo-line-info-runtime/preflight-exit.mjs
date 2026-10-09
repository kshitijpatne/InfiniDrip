import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const workItem = () => board.workItems.find(({ id }) => id === "G04-V03");
assert.equal(workItem()?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
if (board.revision === 3435) {
  let projected = board;
  for (const name of ["S580-exit-add-evidence.json", "S580-exit-add-comment.json"]) {
    const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
    assert.equal(command.expectedRevision, projected.revision);
    projected = applyBoardCommand(projected, command, { now: "2026-10-09T05:17:35.000Z" });
  }
  assert.equal(projected.revision, 3437);
  assert.ok(projected.evidence.some(({ id }) => id === "E-G04-S580-EXIT"));
  assert.ok(projected.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S580-EXIT"));
} else {
  assert.equal(board.revision, 3437, "unexpected board revision at S580 exit");
  assert.ok(board.evidence.some(({ id }) => id === "E-G04-S580-EXIT"));
  assert.ok(workItem()?.evidenceRefs.includes("E-G04-S580-EXIT"));
  assert.ok(workItem()?.comments.some(({ text }) => text.includes("E-G04-S580-EXIT")));
}
console.log(`S580 exit preflight passed at revision ${board.revision}; status remains V02 Done, V03 In Progress.`);
