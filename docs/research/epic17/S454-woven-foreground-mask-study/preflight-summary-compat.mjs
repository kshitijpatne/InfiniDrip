import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S454-board-summary-compat-command.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
if (start.revision !== 2742 || next.revision !== 2745) throw new Error(`Unexpected board transition ${start.revision}->${next.revision}`);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const epicCard = next.workItems.find(item => item.id === 'EPIC-17');
const g04 = next.workItems.find(item => item.id === 'G04-V02');
if (!epic.description.includes('Latest integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces')) throw new Error('Epic regression wording missing');
if (!epicCard.description.includes('Latest verified tally remains 56 accepted / 90 held across 73 configurations / 146 faces')) throw new Error('Epic card regression wording missing');
if (!g04.description.includes('All 56 Woven and 34 Polo faces remain held')
  || !g04.description.includes('S381 found no evidence supporting a false Woven back-hem gap')
  || !g04.description.includes('S419 tested a 2–3-arc Polo H locator across 17 options')) throw new Error('G04 compatibility wording missing');
if (next.epics.find(item => item.id === 'EPIC-17')?.status !== 'In Progress') throw new Error('Epic status changed');
console.log(JSON.stringify({ from: start.revision, to: next.revision, status: 'In Progress', regressionWording: 'preserved' }));
