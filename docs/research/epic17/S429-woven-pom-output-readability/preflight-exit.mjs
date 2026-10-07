import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const start = JSON.parse(await readFile(new URL('./S429-start-board-commands.json', import.meta.url), 'utf8'));
const exit = JSON.parse(await readFile(new URL('./S429-exit-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of [...start, ...exit]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, cloned board is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T16:48:00.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const card = candidate.workItems.find(({ id }) => id === 'G04-V02');
const v01 = candidate.workItems.find(({ id }) => id === 'G04-V01');
const v03 = candidate.workItems.find(({ id }) => id === 'G04-V03');
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: epic.status,
  v01Status: v01.status,
  v02Status: card.status,
  v03Status: v03.status,
  exitLinkedToEpic: epic.evidenceRefs.includes('E-G04-S429-EXIT'),
  exitLinkedToV02: card.evidenceRefs.includes('E-G04-S429-EXIT'),
  matrixLinkedToV02: card.evidenceRefs.includes('E-G04-S429-MATRIX'),
  frontLinkedToV02: card.evidenceRefs.includes('E-G04-S429-FRONT-RENDERED'),
  markerLinkedToV02: card.evidenceRefs.includes('E-G04-S429-MARKER-RENDERED'),
  scheduleLinkedToV02: card.evidenceRefs.includes('E-G04-S429-SCHEDULE-RENDERED'),
  allStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  holdsPreserved: /All 56 Woven and 34 Polo faces remain held/u.test(card.description),
};
if (result.sourceRevision !== 2529 || result.resultingRevision !== 2538 || result.epicStatus !== 'In Progress'
  || result.v01Status !== 'Done' || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog'
  || Object.entries(result).some(([key, value]) => key.endsWith('LinkedToEpic') || key.endsWith('LinkedToV02') || key === 'allStatusesUnchanged' || key === 'holdsPreserved' ? value !== true : false)) {
  throw new Error(`S429 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S429-exit-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
