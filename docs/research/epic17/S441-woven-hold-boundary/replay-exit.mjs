import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S441-exit-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = await readBoardFile();
const epic = board.epics.find(item => item.id === 'EPIC-17');
const v02 = board.workItems.find(item => item.id === 'G04-V02');
if (board.revision !== 2652 || epic.status !== 'In Progress' || v02.status !== 'In Progress') throw new Error('S441 exit replay did not preserve expected revision/status');
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v02: v02.status, accepted: 56, held: 90 }));
