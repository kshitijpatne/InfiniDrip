import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const commands = JSON.parse(await readFile(new URL('./S454-board-summary-compat-final-command.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = await readBoardFile();
console.log(JSON.stringify({ revision: board.revision, status: board.workItems.find(item => item.id === 'G04-V02').status }));
