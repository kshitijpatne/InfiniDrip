import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S440-exit-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
const evidence = next.evidence.filter(item => item.id.startsWith('E-G04-S440'));
if (start.revision !== 2635 || next.revision !== 2643) throw new Error(`Unexpected board transition ${start.revision}->${next.revision}`);
if (epic.status !== 'In Progress' || v02.status !== 'In Progress') throw new Error('Epic or V02 status changed');
if (evidence.length !== 4) throw new Error(`Expected four S440 evidence records, found ${evidence.length}`);
if (v02.evidenceRefs.filter(id => id.startsWith('E-G04-S440')).length !== 4) throw new Error('G04-V02 is missing S440 evidence links');
console.log(JSON.stringify({ from: start.revision, to: next.revision, epic: epic.status, v02: v02.status,
  evidence: evidence.map(item => item.id), tally: next.workItems.find(item => item.id === 'EPIC-17-SUMMARY')?.description?.match(/56 accepted \/ 90 held/)?.[0] ?? 'verify separately' }));
