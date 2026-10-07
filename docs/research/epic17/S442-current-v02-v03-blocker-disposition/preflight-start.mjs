import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { assertValidBoard } from '../../../../ops/control-center/board-core.mjs';

const base = JSON.parse(execFileSync('git', ['show', '9f0adbb4ec2cd0567c2380104a7f8b56d91b5922:ops/control-center/data/board.json'], { encoding: 'utf8' }));
const start = assertValidBoard(base, 'Committed S441 board baseline');
const commands = JSON.parse(await readFile(new URL('./S442-start-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
if (start.revision !== 2652 || next.revision !== 2654) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (epic.status !== 'In Progress' || v02.status !== 'In Progress') throw new Error('Epic or V02 status changed');
if (v02.evidenceRefs.filter(id => id.startsWith('E-G04-S441')).length !== 7) throw new Error('S441 evidence links missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, epic: epic.status, v02: v02.status }));
