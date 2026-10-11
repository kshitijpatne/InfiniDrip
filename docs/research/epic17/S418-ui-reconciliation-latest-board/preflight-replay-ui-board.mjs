import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const commandFile = 'docs/planning/UI-ENHANCEMENT-BOARD-COMMANDS.json';
const commands = JSON.parse(await readFile(commandFile, 'utf8'));
let clone = await readBoardFile();
const startingRevision = clone.revision;
const skipped = [];
const replay = [];

function equalValue(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function commandAlreadyPresent(board, command) {
  if (command.type === 'createItem') {
    const expected = command.workItem;
    const existing = board.workItems.find((item) => item.id === expected.id);
    if (!existing) return false;
    const matches = Object.entries(expected).every(([key, value]) => equalValue(existing[key], value));
    assert.ok(matches, `Existing ${expected.id} differs from the approved command; do not overwrite or reset it.`);
    return true;
  }
  if (command.type === 'addEvidence') {
    const item = board.workItems.find((candidate) => candidate.id === command.itemId);
    assert.ok(item, `Missing board target ${command.itemId}`);
    if (command.evidence) {
      const current = board.evidence.find((entry) => entry.id === command.evidence.id);
      if (current) {
        const matches = Object.entries(command.evidence).every(([key, value]) => equalValue(current[key], value));
        assert.ok(matches, `Evidence ${command.evidence.id} differs from approved content.`);
        assert.ok(item.evidenceRefs.includes(current.id), `Existing evidence ${current.id} is not linked to ${command.itemId}.`);
        return true;
      }
      return false;
    }
    assert.ok(board.evidence.some((entry) => entry.id === command.evidenceId), `Missing evidence ${command.evidenceId}`);
    return item.evidenceRefs.includes(command.evidenceId);
  }
  if (command.type === 'addComment') {
    const item = board.workItems.find((candidate) => candidate.id === command.itemId);
    assert.ok(item, `Missing board target ${command.itemId}`);
    return item.comments.some((comment) => comment.actor === command.actor && comment.text === command.text);
  }
  throw new Error(`Unexpected UI command ${command.type}; stop for review.`);
}

for (const [index, command] of commands.entries()) {
  if (commandAlreadyPresent(clone, command)) {
    skipped.push({ index, type: command.type, id: command.workItem?.id ?? command.evidence?.id ?? command.evidenceId ?? command.itemId });
  } else {
    clone = applyBoardCommand(clone, command);
    replay.push({ index, type: command.type, id: command.workItem?.id ?? command.evidence?.id ?? command.evidenceId ?? command.itemId });
  }
}

// The entire sequence has been preflighted on a clone before any canonical write.
for (const commandIndex of replay.map(({ index }) => index)) {
  const command = { ...commands[commandIndex], expectedRevision: (await readBoardFile()).revision };
  await executeBoardCommand(command);
}

const finalBoard = await readBoardFile();
assert.equal(finalBoard.workItems.find((item) => item.id === 'EPIC-17').status, 'In Progress');
assert.equal(finalBoard.workItems.find((item) => item.id === 'G04-V02').status, 'In Progress');
assert.equal(finalBoard.workItems.find((item) => item.id === 'G04-V03').status, 'Backlog');
assert.equal(finalBoard.workItems.find((item) => item.id === 'EPIC-17').dependencies.includes('UIQ-GATE'), false);
assert.equal(finalBoard.workItems.filter((item) => item.id.startsWith('UIQ-')).every((item) => item.status === 'Backlog'), true);
const result = { commands: commands.length, startingRevision, skipped: skipped.length, replayed: replay.length,
  endingRevision: finalBoard.revision, skippedEntries: skipped, replayedEntries: replay,
  epic17: finalBoard.workItems.find((item) => item.id === 'EPIC-17').status,
  g04v02: finalBoard.workItems.find((item) => item.id === 'G04-V02').status,
  uiqStatuses: finalBoard.workItems.filter((item) => item.id.startsWith('UIQ-')).map((item) => [item.id, item.status]) };
await writeFile(new URL('./S418-ui-board-reconciliation.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

