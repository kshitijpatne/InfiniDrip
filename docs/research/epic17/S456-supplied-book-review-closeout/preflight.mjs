import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S456-board-commands.json', import.meta.url), 'utf8'));
let next = start;
if (start.revision === 2752) {
  for (const command of commands) next = applyBoardCommand(next, command);
  if (next.revision !== 2754) throw new Error(`Unexpected preflight transition ${start.revision}->${next.revision}`);
} else if (start.revision !== 2754) {
  throw new Error(`Unexpected board revision ${start.revision}; expected 2752 or completed 2754`);
}
const status = (id) => next.workItems.find((item) => item.id === id)?.status;
for (const [id, value] of [['EPIC-17','In Progress'],['G04-V01','Done'],['G04-V02','In Progress'],['G04-V03','Backlog']]) {
  if (status(id) !== value) throw new Error(`${id} status changed`);
}
const v02 = next.workItems.find((item) => item.id === 'G04-V02');
if (!v02.description.includes('56 accepted / 90 held') || !v02.description.includes('All 56 Woven and 34 Polo faces remain held')) throw new Error('Current tally/holds changed');
if (!next.evidence.some((item) => item.id === 'E-G04-S456-S455-CLOSEOUT')) throw new Error('S456 evidence missing');
if (!v02.comments.some((comment) => comment.text.includes('S456 closes the S455'))) throw new Error('S456 closeout comment missing');
console.log(JSON.stringify({ revision: next.revision, replay: start.revision === 2752 ? 'preflighted' : 'already applied', statuses: 'preserved', holds: '56 accepted / 90 held' }));
