import { readFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const commands = JSON.parse(await readFile(new URL('./S401-start-board-commands.json', import.meta.url), 'utf8'));
for (const command of commands) {
  const board = await executeBoardCommand(command);
  process.stdout.write(`revision ${board.revision}\n`);
}
