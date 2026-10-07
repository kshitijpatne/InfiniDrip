import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S430-exit-board-commands.json', import.meta.url), 'utf8'));
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
const result = { revision: board.revision, epicStatus: epic.status, v02Status: v02.status,
  exitLinkedToEpic: epic.evidenceRefs.includes('E-G04-S430-EXIT'),
  exitLinkedToV02: v02.evidenceRefs.includes('E-G04-S430-EXIT'),
  statuses: { v01: board.workItems.find(({ id }) => id === 'G04-V01').status, v03: board.workItems.find(({ id }) => id === 'G04-V03').status },
  holds: '56 Woven and 34 Polo views remain held.' };
if (result.revision !== 2544 || result.epicStatus !== 'In Progress' || result.v02Status !== 'In Progress'
  || !result.exitLinkedToEpic || !result.exitLinkedToV02 || result.statuses.v01 !== 'Done' || result.statuses.v03 !== 'Backlog') {
  throw new Error(`S430 exit replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S430-exit-board-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
