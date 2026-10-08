import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { validateBoard } from "../../../../ops/control-center/board-core.mjs";

const names = ["S529-start-add-evidence.json", "S529-start-add-comment.json", "S529-exit-add-evidence.json", "S529-exit-add-comment.json"];
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const name of names) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  if (command.expectedRevision !== undefined) assert.equal(command.expectedRevision, board.revision, `${name} expected revision`);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3231);
assert.equal(validateBoard(board).valid, true);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.epics.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
console.log("S529 start+exit replay and validation pass at revision 3231; no file written.");
