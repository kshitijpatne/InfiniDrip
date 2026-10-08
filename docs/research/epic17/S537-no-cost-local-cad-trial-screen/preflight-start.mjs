import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = await readBoardFile();
assert.equal(board.revision, 3259);
const commands = [
  JSON.parse(await readFile(new URL("./S537-start-add-evidence.json", import.meta.url), "utf8")),
  JSON.parse(await readFile(new URL("./S537-start-add-comment.json", import.meta.url), "utf8")),
];
for (const command of commands) {
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3261);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S537 start replay preflight passed at revisions 3259→3261; V03 remains In Progress.");
