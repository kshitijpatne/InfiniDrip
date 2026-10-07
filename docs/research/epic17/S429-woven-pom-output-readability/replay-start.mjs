import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S429-start-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = JSON.parse(await readFile(new URL('../../../../ops/control-center/data/board.json', import.meta.url), 'utf8'));
const item = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, itemStatus: item.status,
  evidenceLinked: item.evidenceRefs.includes('E-G04-S429-START'), holds: '34 Polo and 56 Woven views remain held.' };
if (result.revision !== 2531 || result.itemStatus !== 'In Progress' || !result.evidenceLinked) throw new Error(JSON.stringify(result));
await writeFile(new URL('./S429-start-board-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
