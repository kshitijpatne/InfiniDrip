import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const folder = new URL('./', import.meta.url);
const commands = JSON.parse(await readFile(new URL('S431-exit-board-commands.json', folder), 'utf8'));
const path = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(path, 'utf8'));
for (const command of commands) {
  board = JSON.parse(await readFile(path, 'utf8'));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
board = JSON.parse(await readFile(path, 'utf8'));
const epic = board.epics.find(({ id }) => id === 'EPIC-17');
const v02 = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, epicStatus: epic.status,
  v01Status: board.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: v02.status, v03Status: board.workItems.find(({ id }) => id === 'G04-V03').status,
  exitLinkedToEpic: epic.evidenceRefs.includes('E-G04-S431-EXIT'),
  exitLinkedToV02: v02.evidenceRefs.includes('E-G04-S431-EXIT') };
if (result.revision !== 2550 || result.epicStatus !== 'In Progress' || result.v01Status !== 'Done'
  || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog'
  || !result.exitLinkedToEpic || !result.exitLinkedToV02) {
  throw new Error(`S431 exit replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('S431-exit-board-result.json', folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
