import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

let board = JSON.parse(await readFile('ops/control-center/data/board.json', 'utf8'));
for (const name of ['S569-exit-add-evidence.json', 'S569-exit-add-comment.json']) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), 'utf8'));
  assert.equal(command.expectedRevision, board.revision);
  board = applyBoardCommand(board, command, { now: '2026-10-09T03:32:45.000Z' });
}
assert.equal(board.revision, 3393);
const item = board.workItems.find(({ id }) => id === 'G04-V03');
assert.equal(item?.status, 'In Progress');
assert.ok(item?.evidenceRefs.includes('E-G04-S569-EXIT'));
console.log('S569 exit preflight passed at revision 3391; two additive commands; no file written.');
