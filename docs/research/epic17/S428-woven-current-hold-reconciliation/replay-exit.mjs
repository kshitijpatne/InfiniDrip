import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S428-exit-board-commands.json', import.meta.url), 'utf8'));
const corrections = JSON.parse(await readFile(new URL('./S428-exit-board-corrections.json', import.meta.url), 'utf8'));
const corrections2 = JSON.parse(await readFile(new URL('./S428-exit-board-corrections-2.json', import.meta.url), 'utf8'));
const path = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(path, 'utf8'));
if (board.revision < 2529) {
  if (board.revision < 2526) for (const command of commands) await executeBoardCommand(command);
  board = JSON.parse(await readFile(path, 'utf8'));
  for (const command of [...corrections, ...corrections2]) {
    board = JSON.parse(await readFile(path, 'utf8'));
    if (command.expectedRevision === board.revision) await executeBoardCommand(command);
  }
  board = JSON.parse(await readFile(path, 'utf8'));
}
if (board.revision !== 2529) throw new Error(`Expected S428 board revision 2529, found ${board.revision}`);
const item = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, itemStatus: item.status,
  evidence: item.evidenceRefs.filter((id) => ['E-G04-S428-EXIT', 'E-G04-S428-MATRIX', 'E-G04-S428-RENDERED', 'E-G04-S428-BACK-RENDERED'].includes(id)),
  holds: '34 Polo and 56 Woven faces remain held; 56 accepted / 90 held.' };
if (result.itemStatus !== 'In Progress' || result.evidence.length !== 4) throw new Error(JSON.stringify(result));
await writeFile(new URL('./S428-exit-board-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
