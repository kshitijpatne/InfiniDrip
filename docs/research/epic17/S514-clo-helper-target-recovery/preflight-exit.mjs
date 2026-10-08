import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const read = async (name) => JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const name of ["S514-start-board-commands.json", "S514-exit-board-commands.json"]) {
  for (const command of await read(name)) {
    assert.equal(command.expectedRevision, board.revision);
    board = applyBoardCommand(board, command);
  }
}
assert.equal(board.revision, 3171);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
console.log("S514 exit preflight passed at revision 3171; no file written.");
