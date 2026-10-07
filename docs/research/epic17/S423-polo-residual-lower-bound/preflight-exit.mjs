import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const start = JSON.parse(await readFile(new URL('./S423-start-board-commands.json', import.meta.url), 'utf8'));
const exit = JSON.parse(await readFile(new URL('./S423-exit-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of [...start, ...exit]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T09:44:04.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const item = candidate.workItems.find(({ id }) => id === 'G04-V02');
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: epic.status,
  v01Status: candidate.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: item.status,
  v03Status: candidate.workItems.find(({ id }) => id === 'G04-V03').status,
  linkedItemExitEvidence: item.evidenceRefs.includes('E-G04-S423-EXIT'),
  linkedEpicExitEvidence: epic.evidenceRefs.includes('E-G04-S423-EXIT'),
  allEpicStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status),
  allWorkItemStatusesUnchanged: board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
};
if (result.sourceRevision !== 2464 || result.resultingRevision !== 2469 || result.epicStatus !== 'In Progress' || result.v01Status !== 'Done' || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog' || !result.linkedItemExitEvidence || !result.linkedEpicExitEvidence || !result.allEpicStatusesUnchanged || !result.allWorkItemStatusesUnchanged) throw new Error(`Preflight invariant failed: ${JSON.stringify(result)}`);
await writeFile(new URL('./S423-exit-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
