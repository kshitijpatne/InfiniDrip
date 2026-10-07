import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S426-exit-board-commands.json', import.meta.url), 'utf8'));
const reconcile = JSON.parse(await readFile(new URL('./S426-board-summary-reconciliation-commands.json', import.meta.url), 'utf8'));
const boardPath = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(boardPath, 'utf8'));
if (board.revision < 2501) {
  for (const command of commands) await executeBoardCommand(command);
  board = JSON.parse(await readFile(boardPath, 'utf8'));
}
if (board.revision < 2503) {
  for (const command of reconcile) await executeBoardCommand(command);
  board = JSON.parse(await readFile(boardPath, 'utf8'));
}
if (board.revision !== 2503) throw new Error(`Expected the validated S426 exit board at 2503, found ${board.revision}`);
const epic = board.epics.find(({ id }) => id === 'EPIC-17');
const summary = board.workItems.find(({ id }) => id === 'EPIC-17');
const item = board.workItems.find(({ id }) => id === 'G04-V02');
const result = {
  revision: board.revision,
  epicStatus: epic.status,
  summaryStatus: summary.status,
  itemStatus: item.status,
  itemEvidence: item.evidenceRefs.filter((id) => ['E-G04-S426-EXIT', 'E-G04-S426-RENDERED'].includes(id)),
  epicEvidence: epic.evidenceRefs.includes('E-G04-S426-EXIT'),
  holds: '34 Polo and 56 Woven faces remain held; 56 accepted / 90 held.',
};
  if (result.revision !== 2503 || result.epicStatus !== 'In Progress' || result.summaryStatus !== 'In Progress'
  || result.itemStatus !== 'In Progress' || result.itemEvidence.length !== 2 || !result.epicEvidence) {
  throw new Error(`Exit replay invariant failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S426-board-exit-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
