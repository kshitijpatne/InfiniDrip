import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S456-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = await readBoardFile();
const v02 = board.workItems.find((item) => item.id === 'G04-V02');
console.log(JSON.stringify({ revision: board.revision, epic: board.workItems.find((item) => item.id === 'EPIC-17').status, v02: v02.status, v03: board.workItems.find((item) => item.id === 'G04-V03').status, closeoutEvidence: board.evidence.some((entry) => entry.id === 'E-G04-S456-S455-CLOSEOUT'), holdSummary: /56 accepted \/ 90 held/.test(v02.description) }));
