import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';
const commands = JSON.parse(await readFile(new URL('./S425-exit-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) await executeBoardCommand(command);
const board = JSON.parse(await readFile(new URL('../../../../ops/control-center/data/board.json', import.meta.url), 'utf8'));
const item = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, itemStatus: item.status,
  itemEvidence: item.evidenceRefs.filter((id) => id === 'E-G04-S425-EXIT' || id === 'E-G04-S425-RENDERED'),
  epicStatus: board.epics.find(({ id }) => id === 'EPIC-17').status,
  holds: '34 Polo and 56 Woven faces remain held; 56 accepted / 90 held.' };
await writeFile(new URL('./S425-board-exit-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
