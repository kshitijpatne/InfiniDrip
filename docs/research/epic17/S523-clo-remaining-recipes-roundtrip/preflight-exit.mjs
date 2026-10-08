import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const file of ["S523-start-board-commands.json", "S523-exit-board-commands.json"]) {
  const commands = JSON.parse(await readFile(new URL(`./${file}`, import.meta.url), "utf8"));
  for (const command of commands) {
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command);
  }
}
assert.equal(board.revision, 3207);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S523-EXIT"));
console.log("S523 start+exit command preflight passed at revision 3207; no file written.");
