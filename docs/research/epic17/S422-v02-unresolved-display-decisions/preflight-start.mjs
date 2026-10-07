import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const commands = JSON.parse(await readFile(new URL('./S422-start-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T09:35:06.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const item = candidate.workItems.find(({ id }) => id === 'G04-V02');
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: epic.status,
  v02Status: item.status,
  linkedStartEvidence: item.evidenceRefs.includes('E-G04-S422-START'),
  allEpicStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status),
  allWorkItemStatusesUnchanged: board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
};
if (result.sourceRevision !== 2459 || result.resultingRevision !== 2461 || result.epicStatus !== 'In Progress' || result.v02Status !== 'In Progress' || !result.linkedStartEvidence || !result.allEpicStatusesUnchanged || !result.allWorkItemStatusesUnchanged) throw new Error(`Preflight invariant failed: ${JSON.stringify(result)}`);
await writeFile(new URL('./S422-start-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
