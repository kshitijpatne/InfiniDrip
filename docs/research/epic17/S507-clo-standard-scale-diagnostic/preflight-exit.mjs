import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const startCommands = JSON.parse(await readFile(new URL("./S507-start-board-commands.json", import.meta.url), "utf8"));
const exitCommands = JSON.parse(await readFile(new URL("./S507-exit-board-commands.json", import.meta.url), "utf8"));
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const command of [...startCommands, ...exitCommands]) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3143);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V01")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
console.log("S507 exit preflight passed at revision 3143; V03 remains In Progress and V01/V02 remain Done; no file written.");
