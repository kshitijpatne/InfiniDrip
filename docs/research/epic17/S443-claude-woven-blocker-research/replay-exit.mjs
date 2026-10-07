import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S443-exit-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = await readBoardFile();
const epic = board.epics.find(item => item.id === 'EPIC-17');
const v02 = board.workItems.find(item => item.id === 'G04-V02');
const v03 = board.workItems.find(item => item.id === 'G04-V03');
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v02: v02.status, v03: v03.status,
  tally: '56 accepted / 90 held', evidence: v02.evidenceRefs.filter(id => id.includes('S443')) }));
