import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeBoardCommand } from '../../../../ops/control-center/board-store.mjs';

const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const commands = JSON.parse(await readFile(new URL('./S393-exit-board-commands.json', import.meta.url), 'utf8'));
const board = JSON.parse(await readFile(join(repo, 'ops/control-center/data/board.json'), 'utf8'));
const scratch = await mkdtemp(join(tmpdir(), 's393-board-exit-preflight-'));
const boardPath = join(scratch, 'board.json');
try {
  await writeFile(boardPath, `${JSON.stringify(board, null, 2)}\n`, 'utf8');
  for (const command of commands) {
    const next = await executeBoardCommand(command, { boardPath });
    console.log(`${command.type}: clone revision ${next.revision}`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
