import { open, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { assertValidBoard } from "./board-core.mjs";
import { applyBoardCommand } from "./commands.mjs";

export const DEFAULT_BOARD_PATH = fileURLToPath(new URL("./data/board.json", import.meta.url));

export async function readBoardFile(boardPath = DEFAULT_BOARD_PATH) {
  const resolved = resolve(boardPath);
  let board;
  try {
    board = JSON.parse(await readFile(resolved, "utf8"));
  } catch (error) {
    throw new Error(`Could not read board ${resolved}: ${error.message}`);
  }
  return assertValidBoard(board, `Board ${resolved}`);
}

export async function writeBoardAtomic(board, boardPath = DEFAULT_BOARD_PATH, options = {}) {
  assertValidBoard(board, "Board before save");
  const resolved = resolve(boardPath);
  const temporaryPath = join(dirname(resolved), `.${basename(resolved)}.${process.pid}.${randomUUID()}.tmp`);
  const openFile = options.openFile ?? open;
  const renameFile = options.renameFile ?? rename;
  const removeFile = options.removeFile ?? rm;
  let handle;
  try {
    handle = await openFile(temporaryPath, "wx");
    await handle.writeFile(`${JSON.stringify(board, null, 2)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await renameFile(temporaryPath, resolved);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await removeFile(temporaryPath, { force: true }).catch(() => undefined);
    throw new Error(`Could not save board atomically: ${error.message}`);
  }
  return board;
}

async function acquireLock(boardPath, openFile = open) {
  const lockPath = `${resolve(boardPath)}.lock`;
  try {
    const handle = await openFile(lockPath, "wx");
    await handle.writeFile(`${process.pid}\n`, "utf8");
    return { handle, lockPath };
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error("Board is busy; retry after the current save finishes");
    throw error;
  }
}

export async function executeBoardCommand(command, options = {}) {
  const boardPath = options.boardPath ?? DEFAULT_BOARD_PATH;
  const openFile = options.openFile ?? open;
  const removeFile = options.removeFile ?? rm;
  const lock = await acquireLock(boardPath, openFile);
  try {
    const board = await readBoardFile(boardPath);
    if (command.expectedRevision !== undefined && command.expectedRevision !== board.revision) {
      throw new Error(`Board changed since revision ${command.expectedRevision}; reload revision ${board.revision} before saving`);
    }
    const nextBoard = applyBoardCommand(board, command, { now: options.now });
    return await writeBoardAtomic(nextBoard, boardPath, options);
  } finally {
    await lock.handle.close().catch(() => undefined);
    await removeFile(lock.lockPath, { force: true }).catch(() => undefined);
  }
}
