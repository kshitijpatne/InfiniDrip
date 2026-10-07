import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S443-start-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
if (start.revision !== 2657 || next.revision !== 2659) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (epic.status !== 'In Progress' || v02.status !== 'In Progress') throw new Error('Epic/V02 status changed');
if (v02.evidenceRefs.filter(id => id.startsWith('E-G04-S442')).length !== 3) throw new Error('S442 evidence refs missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, epic: epic.status, v02: v02.status }));
