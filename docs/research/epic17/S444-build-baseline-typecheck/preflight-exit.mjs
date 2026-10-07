import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S444-exit-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
const v03 = next.workItems.find(item => item.id === 'G04-V03');
if (start.revision !== 2665 || next.revision !== 2667) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (epic.status !== 'In Progress' || v02.status !== 'In Progress' || v03.status !== 'Backlog') throw new Error('Status changed');
if (!v02.description.includes('56 accepted / 90 held')) throw new Error('Tally changed');
if (!v02.evidenceRefs.includes('E-G04-S444-EXIT')) throw new Error('Exit evidence missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, epic: epic.status, v02: v02.status, v03: v03.status,
  tally: '56 accepted / 90 held' }));
