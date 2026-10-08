import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S454-start-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
if (start.revision !== 2731 || next.revision !== 2733) throw new Error(`Unexpected board transition ${start.revision}->${next.revision}`);
if (next.epics.find(item => item.id === 'EPIC-17')?.status !== 'In Progress') throw new Error('Epic status changed');
if (next.workItems.find(item => item.id === 'G04-V02')?.status !== 'In Progress') throw new Error('V02 status changed');
if (next.workItems.find(item => item.id === 'G04-V03')?.status !== 'Backlog') throw new Error('V03 status changed');
if (!next.workItems.find(item => item.id === 'G04-V02')?.description.includes('56 accepted / 90 held')) throw new Error('Tally changed');
console.log(JSON.stringify({ from: start.revision, to: next.revision, tally: '56 accepted / 90 held' }));
