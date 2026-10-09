import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.ok([3449, 3451].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const file = await readFile("C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Evidence/clo-after-line-chain-import.zprj");
assert.equal(createHash("sha256").update(file).digest("hex").toUpperCase(), "43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25");
console.log(`S584 pre-export project hash and board revision ${board.revision} preflight passed.`);
