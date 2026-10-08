import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const commands = JSON.parse(await readFile(new URL("./S516-start-board-commands.json", import.meta.url), "utf8"));
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const command of commands) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3177);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S516 start preflight passed at revision 3177; no file written.");
