import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S455-start-board-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
if (start.revision !== 2748 || next.revision !== 2750) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
for (const [id, status] of [['EPIC-17','In Progress'],['G04-V01','Done'],['G04-V02','In Progress'],['G04-V03','Backlog']]) {
  if (next.workItems.find(item => item.id === id)?.status !== status) throw new Error(`${id} status changed`);
}
if (!next.workItems.find(item => item.id === 'G04-V02')?.description.includes('All 56 Woven and 34 Polo faces remain held')) throw new Error('Face-hold summary changed');
console.log(JSON.stringify({ from: start.revision, to: next.revision, statuses: 'preserved', holds: '56 accepted / 90 held' }));
