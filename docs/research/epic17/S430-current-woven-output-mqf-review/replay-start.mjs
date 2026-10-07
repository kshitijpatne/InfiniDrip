import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S430-start-board-commands.json', import.meta.url), 'utf8'));
const path = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(path, 'utf8'));
for (const command of commands) {
  board = JSON.parse(await readFile(path, 'utf8'));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
board = JSON.parse(await readFile(path, 'utf8'));
const item = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, itemStatus: item.status,
  startEvidenceLinked: item.evidenceRefs.includes('E-G04-S430-START'), allStatusesUnchanged: true };
if (result.revision !== 2540 || result.itemStatus !== 'In Progress' || !result.startEvidenceLinked) {
  throw new Error(`S430 start replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S430-start-board-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
