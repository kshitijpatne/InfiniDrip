import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S454-board-summary-compat-repair-command.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
if (start.revision !== 2745 || next.revision !== 2747) throw new Error(`Unexpected board transition ${start.revision}->${next.revision}`);
const card = next.workItems.find(item => item.id === 'EPIC-17');
const g04 = next.workItems.find(item => item.id === 'G04-V02');
if (!card.description.includes("S406's approved Woven collar-over-plackets display remains implemented")) throw new Error('Epic card historical wording missing');
for (const phrase of ["S406's approved Woven collar-over-plackets order remains implemented", 'The maintainer keeps the Woven body neckline continuous', 'Preserve all-seven V02, keep V03 gated']) {
  if (!g04.description.includes(phrase)) throw new Error(`G04 regression wording missing: ${phrase}`);
}
console.log(JSON.stringify({ from: start.revision, to: next.revision, preflight: 'passed' }));
