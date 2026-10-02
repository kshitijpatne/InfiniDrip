import { readFile } from 'node:fs/promises';
import { DEFAULT_BOARD_PATH, executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const [commandPath, boardPath = DEFAULT_BOARD_PATH] = process.argv.slice(2);
if (!commandPath) throw new Error('Provide the saved S370 command array and optional board path.');
const commands = JSON.parse(await readFile(commandPath, 'utf8'));
let board = await readBoardFile(boardPath);
for (const command of commands) {
  board = await executeBoardCommand({ ...command, expectedRevision: board.revision }, { boardPath });
  console.log(`${command.type}: board revision ${board.revision}`);
}
console.log(`Applied ${commands.length} S370 commands; final revision ${board.revision}.`);
