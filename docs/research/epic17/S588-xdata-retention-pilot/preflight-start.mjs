import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.ok([3465, 3467].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision >= 3467) assert.ok(board.evidence.some(({ id }) => id === "E-G04-S588-START"));
if (board.revision >= 3469) assert.ok(board.evidence.some(({ id }) => id === "E-G04-S588-EXIT"));
console.log(`S588 start preflight passed at revision ${board.revision}.`);
