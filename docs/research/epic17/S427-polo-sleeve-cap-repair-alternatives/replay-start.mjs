import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S427-start-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = JSON.parse(await readFile(new URL('../../../../ops/control-center/data/board.json', import.meta.url), 'utf8'));
const item = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, itemStatus: item.status,
  evidenceLinked: item.evidenceRefs.includes('E-G04-S427-START'),
  holds: '34 Polo and 56 Woven faces remain held; 56 accepted / 90 held.' };
if (result.revision !== 2505 || result.itemStatus !== 'In Progress' || !result.evidenceLinked) {
  throw new Error(`Start replay invariant failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S427-start-board-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
