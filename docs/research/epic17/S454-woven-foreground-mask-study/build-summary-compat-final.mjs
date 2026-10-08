import { writeFile } from 'node:fs/promises';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const board = await readBoardFile();
if (board.revision !== 2747) throw new Error(`Expected board revision 2747, found ${board.revision}`);
const g04 = board.workItems.find(item => item.id === 'G04-V02');
const commands = [{ type: 'editItem', expectedRevision: 2747, itemId: 'G04-V02',
  patch: { description: `${g04.description} latest verified integrated tally is 56 accepted / 90 held across 73 configurations / 146 faces.` } }];
await writeFile(new URL('./S454-board-summary-compat-final-command.json', import.meta.url), `${JSON.stringify(commands, null, 2)}\n`);
console.log(JSON.stringify({ boardRevision: board.revision, commands: commands.length }));
