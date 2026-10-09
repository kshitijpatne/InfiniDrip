import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.ok([3453, 3455, 3457].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision >= 3455) assert.ok(board.evidence.some(({ id }) => id === "E-G04-S585-START"));
if (board.revision === 3457) assert.ok(board.evidence.some(({ id }) => id === "E-G04-S585-EXIT"));
console.log(`S585 start board preflight passed at revision ${board.revision}.`);
