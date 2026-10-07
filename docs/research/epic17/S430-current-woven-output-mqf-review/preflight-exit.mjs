import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const start = JSON.parse(await readFile(new URL('./S430-start-board-commands.json', import.meta.url), 'utf8'));
const exit = JSON.parse(await readFile(new URL('./S430-exit-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of [...start, ...exit]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, cloned board is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T16:54:00.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const v02 = candidate.workItems.find(({ id }) => id === 'G04-V02');
const statusesUnchanged = board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
  && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status);
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  epicStatus: epic.status, v01Status: candidate.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: v02.status, v03Status: candidate.workItems.find(({ id }) => id === 'G04-V03').status,
  exitLinkedToEpic: epic.evidenceRefs.includes('E-G04-S430-EXIT'), exitLinkedToV02: v02.evidenceRefs.includes('E-G04-S430-EXIT'),
  statusesUnchanged, allHoldsPresent: /56 Woven|34 Polo/u.test(v02.description) };
if (result.sourceRevision !== 2538 || result.resultingRevision !== 2544 || result.epicStatus !== 'In Progress'
  || result.v01Status !== 'Done' || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog'
  || !result.exitLinkedToEpic || !result.exitLinkedToV02 || !result.statusesUnchanged || !result.allHoldsPresent) {
  throw new Error(`S430 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S430-exit-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
