import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import board from "./data/board.json" with { type: "json" };
import { executeBoardCommand, readBoardFile, writeBoardAtomic } from "./board-store.mjs";

async function withTemporaryBoard(run) {
  const directory = await mkdtemp(join(tmpdir(), "infinidrip-board-"));
  const boardPath = join(directory, "board.json");
  await writeFile(boardPath, `${JSON.stringify(board, null, 2)}\n`, "utf8");
  try {
    await run({ directory, boardPath });
  } finally {
    assert.ok(directory.startsWith(tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
}

test("executeBoardCommand validates, persists atomically, and rejects stale revisions", async () => {
  await withTemporaryBoard(async ({ directory, boardPath }) => {
    const saved = await executeBoardCommand({
      type: "editItem",
      itemId: "SLICE-175",
      expectedRevision: board.revision,
      patch: { owner: "Maintainer" },
    }, { boardPath, now: "2026-09-22T19:00:00.000Z" });
    assert.equal(saved.revision, board.revision + 1);
    assert.equal((await readBoardFile(boardPath)).workItems.find((item) => item.id === "SLICE-175").owner, "Maintainer");
    const files = await readdir(directory);
    assert.deepEqual(files, ["board.json"]);
    await assert.rejects(() => executeBoardCommand({
      type: "editItem",
      itemId: "SLICE-175",
      expectedRevision: board.revision,
      patch: { owner: "Stale writer" },
    }, { boardPath, now: "2026-09-22T19:01:00.000Z" }), /reload revision/);
  });
});

test("writeBoardAtomic validates before opening a temporary file", async () => {
  await withTemporaryBoard(async ({ boardPath }) => {
    const malformed = structuredClone(board);
    malformed.workItems[0].status = "Unknown";
    let opened = false;
    await assert.rejects(() => writeBoardAtomic(malformed, boardPath, {
      openFile: async () => {
        opened = true;
        throw new Error("must not open");
      },
    }), /Board before save is invalid/);
    assert.equal(opened, false);
  });
});

test("writeBoardAtomic preserves the original when rename fails and removes its temporary file", async () => {
  await withTemporaryBoard(async ({ directory, boardPath }) => {
    const before = await readFile(boardPath, "utf8");
    const next = structuredClone(board);
    next.revision += 1;
    next.updatedAt = "2026-09-22T19:00:00.000Z";
    await assert.rejects(() => writeBoardAtomic(next, boardPath, {
      renameFile: async () => { throw new Error("simulated rename failure"); },
    }), /simulated rename failure/);
    assert.equal(await readFile(boardPath, "utf8"), before);
    const files = await readdir(directory);
    assert.deepEqual(files, ["board.json"]);
  });
});

test("a pre-existing lock fails visibly without changing the board", async () => {
  await withTemporaryBoard(async ({ boardPath }) => {
    const before = await readFile(boardPath, "utf8");
    await writeFile(`${boardPath}.lock`, "other-process\n", "utf8");
    await assert.rejects(() => executeBoardCommand({
      type: "editItem", itemId: "SLICE-175", patch: { owner: "Blocked writer" },
    }, { boardPath, now: "2026-09-22T19:00:00.000Z" }), /Board is busy/);
    assert.equal(await readFile(boardPath, "utf8"), before);
    await rm(`${boardPath}.lock`, { force: true });
  });
});
