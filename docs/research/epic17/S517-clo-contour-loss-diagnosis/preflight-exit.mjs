import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const name of ["S517-start-board-commands.json", "S517-exit-board-commands.json"]) {
  const commands = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  for (const command of commands) {
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command);
  }
}
assert.equal(board.revision, 3183);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S517 exit preflight passed at revision 3183; no file written.");
