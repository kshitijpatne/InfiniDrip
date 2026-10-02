import { readFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S384-exit-board-commands.json', import.meta.url), 'utf8'));
const results = [];
for (const command of commands) {
  const board = await executeBoardCommand(command);
  results.push({ type: command.type, revision: board.revision, itemId: command.itemId ?? command.epicId });
}
console.log(JSON.stringify(results, null, 2));
