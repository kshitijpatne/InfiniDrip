import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S441-exit-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
const expected = ['E-G04-S441-EXIT', 'E-G04-S441-RENDER-MATRIX', 'E-G04-S441-GEOMETRY', 'E-G04-S441-RENDER-CROP', 'E-G04-S441-OPUS-ATTEMPT', 'E-G04-S441-BUILD-BASELINE'];
if (start.revision !== 2645 || next.revision !== 2652) throw new Error(`Unexpected board transition ${start.revision}->${next.revision}`);
if (epic.status !== 'In Progress' || v02.status !== 'In Progress') throw new Error('Epic/V02 status changed');
if (expected.some(id => !v02.evidenceRefs.includes(id))) throw new Error('An S441 exit evidence link is missing');
if (v02.evidenceRefs.filter(id => id.startsWith('E-G04-S440')).length !== 4) throw new Error('Existing S440 evidence links changed');
console.log(JSON.stringify({ from: start.revision, to: next.revision, epic: epic.status, v02: v02.status, evidence: expected }));
