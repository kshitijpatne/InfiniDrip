import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const folder = new URL('./', import.meta.url);
const commands = JSON.parse(await readFile(new URL('S432-start-board-commands.json', folder), 'utf8'));
const path = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(path, 'utf8'));
for (const command of commands) {
  board = JSON.parse(await readFile(path, 'utf8'));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
board = JSON.parse(await readFile(path, 'utf8'));
const epic = board.epics.find(({ id }) => id === 'EPIC-17');
const result = { revision: board.revision, epicStatus: epic.status,
  v01Status: board.workItems.find(({ id }) => id === 'G04-V01').status,
  v02Status: board.workItems.find(({ id }) => id === 'G04-V02').status,
  v03Status: board.workItems.find(({ id }) => id === 'G04-V03').status };
if (result.revision !== 2552 || result.epicStatus !== 'In Progress' || result.v01Status !== 'Done'
  || result.v02Status !== 'In Progress' || result.v03Status !== 'Backlog') throw new Error(`S432 start replay failed: ${JSON.stringify(result)}`);
await writeFile(new URL('S432-start-board-result.json', folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
