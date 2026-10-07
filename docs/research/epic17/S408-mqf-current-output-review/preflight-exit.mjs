import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeBoardCommand, DEFAULT_BOARD_PATH } from '../../../../ops/control-center/board-store.mjs';

const directory = await mkdtemp(join(tmpdir(), 'infini-s408-preflight-'));
const boardPath = join(directory, 'board.json');
const commands = JSON.parse(await readFile(new URL('./S408-exit-board-commands.json', import.meta.url), 'utf8'));
try {
  await copyFile(DEFAULT_BOARD_PATH, boardPath);
  for (const command of commands) {
    const board = await executeBoardCommand(command, { boardPath });
    process.stdout.write(`preflight revision ${board.revision}\n`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
