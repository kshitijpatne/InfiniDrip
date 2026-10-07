import { readFile, writeFile } from 'node:fs/promises';
import board from '../../../../ops/control-center/data/board.json' with { type: 'json' };
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';

const commands = JSON.parse(await readFile(new URL('./S420-start-board-commands.json', import.meta.url), 'utf8'));
let candidate = structuredClone(board);
const revisions = [];
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}, clone is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: '2026-10-07T09:23:40.000Z' });
  revisions.push(candidate.revision);
}
const out = {
  sourceRevision: board.revision,
  commandCount: commands.length,
  resultingRevision: candidate.revision,
  revisions,
  unchangedEpicsAndItemStatuses: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status) && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  canonicalBoardWritten: false,
};
await writeFile(new URL('./S420-start-preflight.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out));
