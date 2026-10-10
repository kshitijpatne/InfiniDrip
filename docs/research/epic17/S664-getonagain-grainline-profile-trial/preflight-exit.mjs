import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3879);
for (const file of [
  "S664-exit-add-v03-evidence.json",
  "S664-exit-add-epic-evidence.json",
  "S664-exit-link-epic-evidence.json",
  "S664-exit-comment-v03.json",
  "S664-exit-comment-epic.json",
]) {
  const command = JSON.parse(await readFile(new URL(file, directory), "utf8"));
  board = applyBoardCommand(board, command, { now: "2026-10-10T08:40:03.000Z" });
}
assert.equal(board.revision, 3884);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert(board.evidence.some(({ id, verified }) => id === "E-G04-S664-EXIT" && verified));
assert(board.evidence.some(({ id, verified }) => id === "E-EPIC17-S664-EXIT" && verified));
assert(board.epics.find(({ id }) => id === "EPIC-17")?.evidenceRefs.includes("E-EPIC17-S664-EXIT"));
console.log("S664 exit preflight passed: commands 3879→3884; EPIC-17/V03 stay In Progress, V02 stays Done, exit evidence linked.");
