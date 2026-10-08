import { writeFile } from 'node:fs/promises';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const board = await readBoardFile();
if (board.revision !== 2745) throw new Error(`Expected board revision 2745, found ${board.revision}`);
const epicCard = board.workItems.find(item => item.id === 'EPIC-17');
const g04 = board.workItems.find(item => item.id === 'G04-V02');
const commands = [
  {
    type: 'editItem', expectedRevision: 2745, itemId: 'EPIC-17',
    patch: { description: `${epicCard.description} S406's approved Woven collar-over-plackets display remains implemented.` },
  },
  {
    type: 'editItem', expectedRevision: 2746, itemId: 'G04-V02',
    patch: { description: `${g04.description} S406's approved Woven collar-over-plackets order remains implemented. The maintainer keeps the Woven body neckline continuous. Preserve all-seven V02, keep V03 gated.` },
  },
];
await writeFile(new URL('./S454-board-summary-compat-repair-command.json', import.meta.url), `${JSON.stringify(commands, null, 2)}\n`);
console.log(JSON.stringify({ boardRevision: board.revision, commands: commands.length }));
