import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const commands = JSON.parse(await readFile(new URL('./S424-start-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T09:45:27.000Z' });
}
const item = candidate.workItems.find(({ id }) => id === 'G04-V02');
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: candidate.epics.find(({ id }) => id === 'EPIC-17').status,
  v01Status: candidate.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: item.status,
  v03Status: candidate.workItems.find(({ id }) => id === 'G04-V03').status,
  linkedStartEvidence: item.evidenceRefs.includes('E-G04-S424-START'),
  allStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
};
if (result.sourceRevision !== 2469 || result.resultingRevision !== 2471 || result.epicStatus !== 'In Progress' || result.v01Status !== 'Done' || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog' || !result.linkedStartEvidence || !result.allStatusesUnchanged) throw new Error(`Preflight invariant failed: ${JSON.stringify(result)}`);
await writeFile(new URL('./S424-start-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
