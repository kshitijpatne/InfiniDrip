import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { validateBoard } from "../../../../ops/control-center/board-core.mjs";

const start = JSON.parse(await readFile(new URL("./S526-start-board-commands.json", import.meta.url), "utf8"));
const exit = JSON.parse(await readFile(new URL("./S526-exit-board-commands.json", import.meta.url), "utf8"));
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const [label, commands] of [["start", start], ["exit", exit]]) for (const command of commands) {
  if (command.expectedRevision !== undefined) assert.equal(command.expectedRevision, board.revision, `${label} expected revision`);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3219);
assert.equal(validateBoard(board).valid, true);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.epics.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
console.log("S526 start+exit board replay and validation pass at revision 3219; no file written.");
