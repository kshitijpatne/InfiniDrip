import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
for (const name of ["S548-start-add-evidence.json", "S548-start-add-comment.json"]) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command, { now: "2026-10-08T22:51:10.000Z" });
}
assert.equal(board.revision, 3305);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S548-START"));
console.log("S548 start preflight passed at revision 3305; no file written.");
