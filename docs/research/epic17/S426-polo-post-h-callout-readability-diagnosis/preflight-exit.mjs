import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const start = JSON.parse(await readFile(new URL('./S426-start-board-commands.json', import.meta.url), 'utf8'));
const exit = JSON.parse(await readFile(new URL('./S426-exit-board-commands.json', import.meta.url), 'utf8'));
const reconcile = JSON.parse(await readFile(new URL('./S426-board-summary-reconciliation-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of [...start, ...exit, ...reconcile]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T16:13:59.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const card = candidate.workItems.find(({ id }) => id === 'EPIC-17');
const v01 = candidate.workItems.find(({ id }) => id === 'G04-V01');
const v02 = candidate.workItems.find(({ id }) => id === 'G04-V02');
const v03 = candidate.workItems.find(({ id }) => id === 'G04-V03');
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: epic.status,
  summaryCardStatus: card.status,
  v01Status: v01.status,
  v02Status: v02.status,
  v03Status: v03.status,
  exitEvidenceLinkedToEpic: epic.evidenceRefs.includes('E-G04-S426-EXIT'),
  exitEvidenceLinkedToSummary: card.evidenceRefs.includes('E-G04-S426-EXIT'),
  exitEvidenceLinkedToV02: v02.evidenceRefs.includes('E-G04-S426-EXIT'),
  renderedEvidenceLinkedToV02: v02.evidenceRefs.includes('E-G04-S426-RENDERED'),
  holdsRecorded: /All 56 Woven and 34 Polo faces remain held/.test(v02.description),
  allStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
};
  if (result.sourceRevision !== 2491 || result.resultingRevision !== 2503 || result.epicStatus !== 'In Progress'
  || result.summaryCardStatus !== 'In Progress' || result.v01Status !== 'Done' || result.v02Status !== 'In Progress'
  || result.v03Status !== 'Backlog' || !result.exitEvidenceLinkedToEpic || !result.exitEvidenceLinkedToSummary
  || !result.exitEvidenceLinkedToV02 || !result.renderedEvidenceLinkedToV02 || !result.holdsRecorded || !result.allStatusesUnchanged) {
  throw new Error(`Preflight invariant failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S426-exit-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
