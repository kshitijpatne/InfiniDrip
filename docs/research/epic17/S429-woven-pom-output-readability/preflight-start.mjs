import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const commands = JSON.parse(await readFile(new URL('./S429-start-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, cloned board is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T16:39:35.000Z' });
}
const item = candidate.workItems.find(({ id }) => id === 'G04-V02');
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  itemStatus: item.status, startEvidenceLinked: item.evidenceRefs.includes('E-G04-S429-START'),
  allStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status) };
if (result.sourceRevision !== 2529 || result.resultingRevision !== 2531 || result.itemStatus !== 'In Progress'
  || !result.startEvidenceLinked || !result.allStatusesUnchanged) throw new Error(JSON.stringify(result));
await writeFile(new URL('./S429-start-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
