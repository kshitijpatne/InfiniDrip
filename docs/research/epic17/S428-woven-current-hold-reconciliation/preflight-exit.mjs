import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const start = JSON.parse(await readFile(new URL('./S428-start-board-commands.json', import.meta.url), 'utf8'));
const exit = JSON.parse(await readFile(new URL('./S428-exit-board-commands.json', import.meta.url), 'utf8'));
const corrections = JSON.parse(await readFile(new URL('./S428-exit-board-corrections.json', import.meta.url), 'utf8'));
const corrections2 = JSON.parse(await readFile(new URL('./S428-exit-board-corrections-2.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of [...start, ...exit, ...corrections, ...corrections2]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, cloned board is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T16:34:00.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const card = candidate.workItems.find(({ id }) => id === 'EPIC-17');
const v02 = candidate.workItems.find(({ id }) => id === 'G04-V02');
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: epic.status,
  cardStatus: card.status,
  v01Status: candidate.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: v02.status,
  v03Status: candidate.workItems.find(({ id }) => id === 'G04-V03').status,
  exitLinkedToEpic: epic.evidenceRefs.includes('E-G04-S428-EXIT'),
  exitLinkedToCard: card.evidenceRefs.includes('E-G04-S428-EXIT'),
  exitLinkedToV02: v02.evidenceRefs.includes('E-G04-S428-EXIT'),
  matrixLinkedToV02: v02.evidenceRefs.includes('E-G04-S428-MATRIX'),
  frontRenderedLinkedToV02: v02.evidenceRefs.includes('E-G04-S428-RENDERED'),
  backRenderedLinkedToV02: v02.evidenceRefs.includes('E-G04-S428-BACK-RENDERED'),
  holdsRecorded: /All 56 Woven and 34 Polo faces remain held/.test(v02.description),
  historyPhrasesPreserved: epic.description.includes('The Woven body neckline remains continuous by maintainer decision.')
    && epic.description.includes("S406's approved view-only collar-over-plackets order remains implemented.")
    && card.description.includes('The maintainer keeps the Woven body neckline continuous;')
    && card.description.includes("S406's approved Woven collar-over-plackets display remains implemented."),
  allStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
};
if (result.sourceRevision !== 2514 || result.resultingRevision !== 2529 || result.epicStatus !== 'In Progress'
  || result.cardStatus !== 'In Progress' || result.v01Status !== 'Done' || result.v02Status !== 'In Progress'
  || result.v03Status !== 'Backlog' || !result.exitLinkedToEpic || !result.exitLinkedToCard || !result.exitLinkedToV02
  || !result.matrixLinkedToV02 || !result.frontRenderedLinkedToV02 || !result.backRenderedLinkedToV02
  || !result.holdsRecorded || !result.historyPhrasesPreserved || !result.allStatusesUnchanged) throw new Error(`S428 exit preflight failed: ${JSON.stringify(result)}`);
await writeFile(new URL('./S428-exit-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
