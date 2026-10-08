import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
for (const name of ["S544-exit-add-evidence.json", "S544-exit-add-comment.json"]) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command, { now: "2026-10-08T22:12:13.000Z" });
}
assert.equal(board.revision, 3291);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S544 exit preflight passed at revision 3291; no file written.");
