import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3548, 3550].includes(board.revision), "refusing stale S604 exit state");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S604-START" && uri === "docs/research/epic17/S604-clo-internal-grade-selection-research/S604-start-packet.md" && verified));
if (board.revision === 3548) assert(!board.evidence.some(({ id }) => id === "E-G04-S604-EXIT"));
if (board.revision === 3550) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S604-EXIT" && uri === "docs/research/epic17/S604-clo-internal-grade-selection-research/S604-exit-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S604-clo-internal-grade-selection-research/S604-exit-packet.md", "utf8");
assert.match(packet, /No trustworthy, version-specific selection cue was found/);
assert.match(packet, /S605: use only the documented read-only CLO geometry getters/);
for (const url of ["support.clo3d.com/hc/en-us/articles/115015798567-Set-Grading", "developer.clo3d.com/list.html"]) assert(packet.includes(url));
console.log("S604 exit preflight passed; packet citations, hold, next action, evidence and board state are intact.");
