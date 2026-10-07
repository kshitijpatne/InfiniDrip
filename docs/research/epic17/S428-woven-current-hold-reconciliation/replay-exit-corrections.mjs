import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S428-exit-board-corrections.json', import.meta.url), 'utf8'));
const commands2 = JSON.parse(await readFile(new URL('./S428-exit-board-corrections-2.json', import.meta.url), 'utf8'));
const path = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(path, 'utf8'));
if (board.revision < 2529) {
  for (const command of [...commands, ...commands2]) {
    board = JSON.parse(await readFile(path, 'utf8'));
    if (command.expectedRevision === board.revision) await executeBoardCommand(command);
  }
  board = JSON.parse(await readFile(path, 'utf8'));
}
if (board.revision !== 2529) throw new Error(`Expected S428 corrected board revision 2529, found ${board.revision}`);
const epic = board.epics.find(({ id }) => id === 'EPIC-17');
const card = board.workItems.find(({ id }) => id === 'EPIC-17');
const result = { revision: board.revision,
  epicRetainsContinuityPhrase: epic.description.includes('The Woven body neckline remains continuous by maintainer decision.'),
  epicRetainsS406Order: epic.description.includes("S406's approved Woven collar-over-plackets display remains implemented."),
  epicRetainsS406LegacyPhrase: epic.description.includes("S406's approved view-only collar-over-plackets order remains implemented."),
  cardRetainsContinuityPhrase: card.description.includes('The maintainer keeps the Woven body neckline continuous;'),
  cardRetainsS406Order: card.description.includes("S406's approved Woven collar-over-plackets display remains implemented.") };
if (Object.values(result).some((value) => value === false)) throw new Error(JSON.stringify(result));
await writeFile(new URL('./S428-exit-board-correction-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
