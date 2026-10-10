import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3907, "repair must begin after the recorded S666 exit commands");
const oldDescription = board.epics.find(({ id }) => id === "EPIC-17").description;
const epicDescription = oldDescription.replace("V01/V02 are Done", "V01 and V02 are Done; V01/V02 are Done");
assert.notEqual(epicDescription, oldDescription);
assert.match(epicDescription, /V01 and V02 are Done/);
const commands = [
  {
    type: "editEpic", epicId: "EPIC-17", actor: "Codex", role: "maintainer",
    reason: "Preserve the Control Center summary's protected V01/V02 wording after S666's current-state reconciliation.",
    patch: { description: epicDescription },
  },
  { type: "editItem", itemId: "EPIC-17", patch: { description: epicDescription } },
];
for (let index = 0; index < commands.length; index += 1) {
  const command = { ...commands[index], expectedRevision: board.revision };
  board = applyBoardCommand(board, command, { now: "2026-10-10T09:35:20.000Z" });
  await writeFile(new URL(`S666-exit-repair-command-${String(index + 1).padStart(2, "0")}.json`, dir), `${JSON.stringify(command, null, 2)}\n`);
}
assert.equal(board.revision, 3909);
assert.match(board.epics.find(({ id }) => id === "EPIC-17").description, /V01 and V02 are Done/);
console.log("S666 summary repair preflight passed: revisions 3907→3909; protected status wording retained.");
