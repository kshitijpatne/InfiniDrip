import { readFile, writeFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S429-exit-board-commands.json', import.meta.url), 'utf8'));
const boardPath = new URL('../../../../ops/control-center/data/board.json', import.meta.url);
let board = JSON.parse(await readFile(boardPath, 'utf8'));
for (const command of commands) {
  board = JSON.parse(await readFile(boardPath, 'utf8'));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected board revision ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
board = JSON.parse(await readFile(boardPath, 'utf8'));
const epic = board.epics.find(({ id }) => id === 'EPIC-17');
const card = board.workItems.find(({ id }) => id === 'G04-V02');
const result = { revision: board.revision, epicStatus: epic.status, itemStatus: card.status,
  exitEvidenceLinked: epic.evidenceRefs.includes('E-G04-S429-EXIT') && card.evidenceRefs.includes('E-G04-S429-EXIT'),
  matrixEvidenceLinked: card.evidenceRefs.includes('E-G04-S429-MATRIX'),
  renderedEvidenceCount: ['E-G04-S429-FRONT-RENDERED','E-G04-S429-MARKER-RENDERED','E-G04-S429-SCHEDULE-RENDERED']
    .filter((id) => card.evidenceRefs.includes(id)).length,
  holds: '34 Polo and 56 Woven views remain held; 56 accepted / 90 held.' };
if (result.revision !== 2538 || result.epicStatus !== 'In Progress' || result.itemStatus !== 'In Progress'
  || !result.exitEvidenceLinked || !result.matrixEvidenceLinked || result.renderedEvidenceCount !== 3) {
  throw new Error(`S429 board close failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S429-exit-board-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
