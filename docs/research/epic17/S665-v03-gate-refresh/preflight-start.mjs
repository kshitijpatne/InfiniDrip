import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3884);
for (const file of [
  "S665-start-add-v03-evidence.json",
  "S665-start-add-epic-evidence.json",
  "S665-start-link-epic-evidence.json",
  "S665-start-comment-v03.json",
  "S665-start-comment-epic.json",
]) {
  const command = JSON.parse(await readFile(new URL(file, directory), "utf8"));
  board = applyBoardCommand(board, command, { now: "2026-10-10T08:46:17.000Z" });
}
assert.equal(board.revision, 3889);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert(board.evidence.some(({ id, verified }) => id === "E-G04-S665-START" && verified));
assert(board.epics.find(({ id }) => id === "EPIC-17")?.evidenceRefs.includes("E-EPIC17-S665-START"));
console.log("S665 start preflight passed: commands 3884→3889; EPIC-17/V03 stay In Progress and V02 stays Done.");
