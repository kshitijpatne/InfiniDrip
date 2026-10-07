import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const board = JSON.parse(execFileSync('git', ['show', 'HEAD:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const commands = JSON.parse(await readFile(new URL('./S432-start-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, cloned board is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T17:53:50.000Z' });
}
const epic = candidate.epics.find(({ id }) => id === 'EPIC-17');
const v02 = candidate.workItems.find(({ id }) => id === 'G04-V02');
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  epicStatus: epic.status, v01Status: candidate.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: v02.status, v03Status: candidate.workItems.find(({ id }) => id === 'G04-V03').status,
  linked: v02.evidenceRefs.includes('E-G04-S432-START') };
if (result.sourceRevision !== 2550 || result.resultingRevision !== 2552 || result.epicStatus !== 'In Progress'
  || result.v01Status !== 'Done' || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog' || !result.linked) {
  throw new Error(`S432 start preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S432-start-preflight.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
