import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S448-historical-summary-retention-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = await readBoardFile();
console.log(JSON.stringify({ revision: board.revision, epic: board.epics.find(item => item.id === 'EPIC-17').status,
  v02: board.workItems.find(item => item.id === 'G04-V02').status, tally: '56 accepted / 90 held' }));
