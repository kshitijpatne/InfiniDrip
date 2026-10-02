import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const [commandsPath, outputPath, boardPath = DEFAULT_BOARD_PATH] = process.argv.slice(2);
if (!commandsPath || !outputPath) throw new Error("Usage: node audit-uiq-command-identities.mjs <commands.json> <output.json> [board.json]");
const commands = JSON.parse(await readFile(commandsPath, "utf8"));
const board = await readBoardFile(boardPath);
const uiqIds = commands.filter((command) => command.type === "createItem").map((command) => command.workItem.id);
const expectedComment = commands.find((command) => command.type === "addComment");
const skipped = [];
const missing = [];

for (const command of commands) {
  if (command.type === "createItem") {
    const item = board.workItems.find((entry) => entry.id === command.workItem.id);
    if (!item) { missing.push(command); continue; }
    for (const [key, value] of Object.entries(command.workItem)) assert.deepEqual(item[key], value, `${item.id}.${key} differs from the approved command`);
    assert.equal(item.status, "Backlog", `${item.id} must remain registered but unstarted`);
    skipped.push({ type: command.type, id: item.id, result: "identical" });
  } else if (command.type === "addEvidence" && command.evidence) {
    const evidence = board.evidence.find((entry) => entry.id === command.evidence.id);
    const item = board.workItems.find((entry) => entry.id === command.itemId);
    if (!evidence || !item) { missing.push(command); continue; }
    for (const [key, value] of Object.entries(command.evidence)) assert.deepEqual(evidence[key], value, `${evidence.id}.${key} differs from the approved command`);
    assert.ok(item.evidenceRefs.includes(evidence.id), `${item.id} is missing ${evidence.id}`);
    skipped.push({ type: command.type, id: evidence.id, itemId: item.id, result: "identical" });
  } else if (command.type === "addEvidence" && command.evidenceId) {
    const item = board.workItems.find((entry) => entry.id === command.itemId);
    const evidence = board.evidence.find((entry) => entry.id === command.evidenceId);
    if (!item || !evidence || !item.evidenceRefs.includes(evidence.id)) { missing.push(command); continue; }
    skipped.push({ type: command.type, id: evidence.id, itemId: item.id, result: "identical" });
  } else if (command.type === "addComment") {
    const item = board.workItems.find((entry) => entry.id === command.itemId);
    if (!item?.comments.some((comment) => comment.actor === command.actor && comment.text === command.text)) { missing.push(command); continue; }
    skipped.push({ type: command.type, itemId: item.id, result: "identical" });
  } else {
    throw new Error(`Unexpected UIQ command type: ${command.type}`);
  }
}

// Exercise the entire approved batch through the actual validated layer on a
// disposable clone stripped only of the exact identities being replayed.
const shadow = structuredClone(board);
shadow.workItems = shadow.workItems.filter((item) => !uiqIds.includes(item.id));
shadow.evidence = shadow.evidence.filter((item) => item.id !== "E-UIQ-APPROVAL");
for (const item of shadow.workItems) item.evidenceRefs = item.evidenceRefs.filter((id) => id !== "E-UIQ-APPROVAL");
for (const epic of shadow.epics) epic.evidenceRefs = epic.evidenceRefs.filter((id) => id !== "E-UIQ-APPROVAL");
const epic17 = shadow.workItems.find((item) => item.id === "EPIC-17");
if (expectedComment) epic17.comments = epic17.comments.filter((comment) => !(comment.actor === expectedComment.actor && comment.text === expectedComment.text));
let preflight = shadow;
for (const command of commands) preflight = applyBoardCommand(preflight, command, { now: "2026-10-02T12:15:48.000Z" });

assert.equal(commands.length, 29);
assert.equal(skipped.length + missing.length, commands.length);
assert.equal(preflight.workItems.filter((item) => uiqIds.includes(item.id)).length, 14);
assert.ok(preflight.workItems.filter((item) => uiqIds.includes(item.id)).every((item) => item.status === "Backlog"));
assert.equal(preflight.workItems.find((item) => item.id === "EPIC-17").dependencies.some((id) => uiqIds.includes(id)), false);
assert.ok(Number.isInteger(board.revision), "canonical board revision is readable");

const output = {
  canonicalBoardRevision: board.revision,
  commands: commands.length,
  canonicalIdentitySkipped: skipped.length,
  missingCommands: missing.length,
  disposableClonePreflight: { applied: commands.length, startRevision: shadow.revision, endRevision: preflight.revision, layer: "applyBoardCommand" },
  uiqItems: preflight.workItems.filter((item) => uiqIds.includes(item.id)).map((item) => ({ id: item.id, status: item.status, dependencies: item.dependencies })),
  epic17Dependencies: board.workItems.find((item) => item.id === "EPIC-17").dependencies,
  canonicalReplayMutations: 0,
};
assert.equal(missing.length, 0, "all canonical commands should already be identical");
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
