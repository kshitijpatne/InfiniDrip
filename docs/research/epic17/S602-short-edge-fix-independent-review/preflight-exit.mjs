import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3540, 3542].includes(board.revision));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S602-START" && uri === "docs/research/epic17/S602-short-edge-fix-independent-review/S602-start-packet.md" && verified));
if (board.revision === 3540) assert(!board.evidence.some(({ id }) => id === "E-G04-S602-EXIT"));
if (board.revision === 3542) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S602-EXIT" && uri === "docs/research/epic17/S602-short-edge-fix-independent-review/S602-exit-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S602-short-edge-fix-independent-review/S602-exit-packet.md");
assert(packet.length > 3000);
console.log(`S602 exit preflight passed; packet SHA-256 ${createHash("sha256").update(packet).digest("hex")}.`);
