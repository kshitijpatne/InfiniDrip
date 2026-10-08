import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const readCommands = async (name) => JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const command of await readCommands("S511-start-board-commands.json")) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
for (const command of await readCommands("S511-exit-board-commands.json")) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3159);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V01")?.status, "Done");
console.log("S511 exit preflight passed at revision 3159; no file written.");
