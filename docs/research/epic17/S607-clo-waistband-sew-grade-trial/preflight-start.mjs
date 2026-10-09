import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3558, 3560].includes(board.revision));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S606-EXIT" && uri === "docs/research/epic17/S606-clo-inputinfo-grade-identity/S606-exit-packet.md" && verified));
if (board.revision === 3558) assert(!board.evidence.some(({ id }) => id === "E-G04-S607-START"));
if (board.revision === 3560) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S607-START" && uri === "docs/research/epic17/S607-clo-waistband-sew-grade-trial/S607-start-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S607-clo-waistband-sew-grade-trial/S607-start-packet.md", "utf8");
assert(packet.includes("selection identity is unambiguous"));
assert(/all five[\s\S]*source CUT and SEW contours/.test(packet));
console.log("S607 start preflight passed; S606 evidence and admitted statuses are intact.");
