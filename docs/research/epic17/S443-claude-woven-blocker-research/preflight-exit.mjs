import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S443-exit-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
const v03 = next.workItems.find(item => item.id === 'G04-V03');
if (start.revision !== 2659 || next.revision !== 2663) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (epic.status !== 'In Progress' || v02.status !== 'In Progress' || v03.status !== 'Backlog') throw new Error('Epic/V02/V03 status changed');
for (const id of ['E-G04-S443-EXIT', 'E-G04-S443-CLAUDE-RESULT', 'E-G04-S443-CLAUDE-STATUS']) {
  if (!v02.evidenceRefs.includes(id)) throw new Error(`Missing evidence ${id}`);
}
if (!v02.description.includes('56 accepted / 90 held')) throw new Error('Accepted/held tally changed');
console.log(JSON.stringify({ from: start.revision, to: next.revision, epic: epic.status, v02: v02.status, v03: v03.status,
  tally: '56 accepted / 90 held' }));
