import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = await readBoardFile();
assert.equal(board.revision, 3261);
const commands = [
  JSON.parse(await readFile(new URL("./S537-exit-add-evidence.json", import.meta.url), "utf8")),
  JSON.parse(await readFile(new URL("./S537-exit-add-comment.json", import.meta.url), "utf8")),
];
for (const command of commands) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3263);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
console.log("S537 exit replay preflight passed at revisions 3261→3263; V03 and EPIC-17 remain In Progress.");
