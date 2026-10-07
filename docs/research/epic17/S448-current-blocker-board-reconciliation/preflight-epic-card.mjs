import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S448-epic-card-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2697 || next.revision !== 2698) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
const card = next.workItems.find(item => item.id === 'EPIC-17');
for (const phrase of ['Current S448 tally is 56 accepted', 'Latest verified tally remains 56 accepted', 'S426\'s corrected full-label replay reports zero source-label or marker-label overlaps', 'Preserve all-seven V02, V02-before-V03']) {
  if (!card.description.includes(phrase)) throw new Error(`Epic card phrase missing: ${phrase}`);
}
console.log(JSON.stringify({ from: start.revision, to: next.revision, cardSummary: 'current' }));
