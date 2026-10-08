import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const name of ["S543-start-add-evidence.json", "S543-start-add-comment.json"]) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command, { now: "2026-10-08T22:06:46.000Z" });
}
assert.equal(board.revision, 3285);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S543 start preflight passed at revision 3285; no file written.");
