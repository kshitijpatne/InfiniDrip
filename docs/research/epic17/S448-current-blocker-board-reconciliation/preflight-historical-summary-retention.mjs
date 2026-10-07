import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const commands = JSON.parse(await readFile(new URL('./S448-historical-summary-retention-commands.json', import.meta.url), 'utf8'));
let next = start;
for (const command of commands) next = applyBoardCommand(next, command);
const epic = next.epics.find(item => item.id === 'EPIC-17');
const v02 = next.workItems.find(item => item.id === 'G04-V02');
if (start.revision !== 2688 || next.revision !== 2690) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
for (const phrase of ['docs/planning/EPIC-17-ADMISSION.md', 'Latest integrated tally remains', 'S425 implements the approved Polo H display', 'The Woven body neckline remains continuous by maintainer decision', 'S406\'s approved view-only collar-over-plackets order remains implemented']) {
  if (!epic.description.includes(phrase)) throw new Error(`Epic historical context missing: ${phrase}`);
}
for (const phrase of ['Latest verified tally remains', 'S381 found no evidence supporting a false Woven back-hem gap', 'S419 tested a 2–3-arc Polo H locator across 17 options', 'All 56 Woven and 34 Polo faces remain held', '0.25 cm', 'S426\'s corrected full-label replay reports zero source-label or marker-label overlaps', 'Preserve all-seven V02, V02-before-V03']) {
  if (!v02.description.includes(phrase)) throw new Error(`V02 historical context missing: ${phrase}`);
}
console.log(JSON.stringify({ from: start.revision, to: next.revision, historicalContext: 'preserved' }));
