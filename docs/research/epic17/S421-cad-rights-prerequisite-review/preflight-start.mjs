import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const commands = JSON.parse(await readFile(new URL('./S421-start-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
const revisions = [];
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T09:29:56.000Z' });
  revisions.push(candidate.revision);
}
const v03 = candidate.workItems.find(({ id }) => id === 'G04-V03');
const out = {
  sourceRevision: board.revision,
  commandCount: commands.length,
  resultingRevision: candidate.revision,
  revisions,
  v03Status: v03.status,
  noReceiverSelectedOrImplemented: true,
  allEpicStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status),
  allWorkItemStatusesUnchanged: board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  canonicalBoardWritten: false,
};
if (out.v03Status !== 'Backlog' || !out.allEpicStatusesUnchanged || !out.allWorkItemStatusesUnchanged) throw new Error('Preflight invariant failed');
await writeFile(new URL('./S421-start-preflight.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out));
