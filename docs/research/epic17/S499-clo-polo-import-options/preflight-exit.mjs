import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const base = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
const start = JSON.parse(await readFile(new URL("./S499-start-board-commands.json", import.meta.url), "utf8"));
const exit = JSON.parse(await readFile(new URL("./S499-exit-board-commands.json", import.meta.url), "utf8"));
let board = base;
for (const command of [...start, ...exit]) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3107);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.epics.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
console.log(`S499 start+exit preflight passed at projected board revision ${board.revision}; no file written.`);
