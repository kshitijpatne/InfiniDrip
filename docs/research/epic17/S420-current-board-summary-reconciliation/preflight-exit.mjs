import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const startCommands = JSON.parse(await readFile(new URL('./S420-start-board-commands.json', import.meta.url), 'utf8'));
const commands = JSON.parse(await readFile(new URL('./S420-exit-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
const revisions = [];
for (const command of [...startCommands, ...commands]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T09:23:40.000Z' });
  revisions.push(candidate.revision);
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const v02 = candidate.workItems.find(({ id }) => id === 'G04-V02');
const summary = candidate.workItems.find(({ id }) => id === 'EPIC-17');
const output = {
  sourceRevision: board.revision,
  commandCount: startCommands.length + commands.length,
  resultingRevision: candidate.revision,
  revisions,
  epicStatus: epic.status,
  epicDescriptionIncludesS419: epic.description.includes('S419'),
  summaryDescriptionIncludesS419: summary.description.includes('S419'),
  v02Status: v02.status,
  v02DescriptionIncludesS420: v02.description.includes('S420'),
  allEpicStatusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status),
  allWorkItemStatusesUnchanged: board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  canonicalBoardWritten: false,
};
if (!output.epicDescriptionIncludesS419 || !output.summaryDescriptionIncludesS419 || !output.v02DescriptionIncludesS420 || !output.allEpicStatusesUnchanged || !output.allWorkItemStatusesUnchanged) throw new Error('Preflight invariant failed');
await writeFile(new URL('./S420-exit-preflight.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output));
