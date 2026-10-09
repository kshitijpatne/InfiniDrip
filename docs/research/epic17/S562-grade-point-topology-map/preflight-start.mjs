import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
let board = JSON.parse(await readFile('ops/control-center/data/board.json', 'utf8'));
for (const name of ['S562-start-add-evidence.json', 'S562-start-add-comment.json']) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), 'utf8'));
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command, { now: '2026-10-09T00:32:02.000Z' });
}
assert.equal(board.revision, 3363);
assert.equal(board.workItems.find(({ id }) => id === 'G04-V03')?.status, 'In Progress');
console.log('S562 start preflight passed at revision 3361; two additive commands; no file written.');
