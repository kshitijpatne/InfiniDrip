import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S454-board-summary-compat-command.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = await readBoardFile();
const item = board.workItems.find(entry => entry.id === 'G04-V02');
console.log(JSON.stringify({ revision: board.revision, v02: item.status,
  compatibility: item.description.includes('All 56 Woven and 34 Polo faces remain held') }));
