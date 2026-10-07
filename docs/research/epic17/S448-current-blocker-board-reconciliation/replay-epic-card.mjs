import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const command = JSON.parse(await readFile(new URL('./S448-epic-card-command.json', import.meta.url), 'utf8'));
await executeBoardCommand(command);
const board = await readBoardFile();
console.log(JSON.stringify({ revision: board.revision, epic: board.workItems.find(item => item.id === 'EPIC-17').status }));
