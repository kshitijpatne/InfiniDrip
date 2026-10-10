import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3909);
const current = board.epics.find(({ id }) => id === "EPIC-17").description;
const description = current.replace("V01 and V02 are Done; V01/V02 are Done;", "V01 and V02 are Done (V01/V02);");
assert.notEqual(description, current);
assert.match(description, /V01 and V02 are Done/);
const commands = [
  { type: "editEpic", epicId: "EPIC-17", actor: "Codex", role: "maintainer", reason: "Keep the current state wording concise while preserving the canonical Control Center assertion.", patch: { description } },
  { type: "editItem", itemId: "EPIC-17", patch: { description } },
];
for (let index = 0; index < commands.length; index += 1) {
  const command = { ...commands[index], expectedRevision: board.revision };
  board = applyBoardCommand(board, command, { now: "2026-10-10T09:35:30.000Z" });
  await writeFile(new URL(`S666-final-board-wording-command-${String(index + 1).padStart(2, "0")}.json`, dir), `${JSON.stringify(command, null, 2)}\n`);
}
assert.equal(board.revision, 3911);
console.log("S666 board wording preflight passed: revisions 3909→3911.");
