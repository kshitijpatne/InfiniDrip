import { readFile } from 'node:fs/promises';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const command = JSON.parse(await readFile(new URL('./S407-board-summary-correction.json', import.meta.url), 'utf8'));
const board = await executeBoardCommand(command);
process.stdout.write(`revision ${board.revision}\n`);
