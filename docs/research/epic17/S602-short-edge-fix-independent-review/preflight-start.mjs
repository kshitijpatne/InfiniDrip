import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3538, 3540, 3542].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision === 3538) assert(!board.evidence.some(({ id }) => id === "E-G04-S602-START"));
if ([3540, 3542].includes(board.revision)) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S602-START" && uri === "docs/research/epic17/S602-short-edge-fix-independent-review/S602-start-packet.md" && verified));
execFileSync(process.execPath, ["--check", "docs/research/epic17/S602-short-edge-fix-independent-review/preflight-start.mjs"]);
console.log(`S602 start preflight passed at current board revision ${board.revision}; admitted statuses are preserved.`);
