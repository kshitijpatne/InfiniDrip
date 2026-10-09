import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3556, 3558].includes(board.revision));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S606-START" && uri === "docs/research/epic17/S606-clo-inputinfo-grade-identity/S606-start-packet.md" && verified));
if (board.revision === 3556) assert(!board.evidence.some(({ id }) => id === "E-G04-S606-EXIT"));
if (board.revision === 3558) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S606-EXIT" && uri === "docs/research/epic17/S606-clo-inputinfo-grade-identity/S606-exit-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S606-clo-inputinfo-grade-identity/S606-exit-packet.md", "utf8");
assert(packet.includes("0.0000682394 mm"));
assert(packet.includes("API documentation does not specify coordinate units"));
console.log("S606 exit preflight passed; start evidence and admitted statuses are intact.");
