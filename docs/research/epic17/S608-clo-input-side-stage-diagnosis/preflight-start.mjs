import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3562, 3564].includes(board.revision));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S607-EXIT" && uri === "docs/research/epic17/S607-clo-waistband-sew-grade-trial/S607-exit-packet.md" && verified));
if (board.revision === 3562) assert(!board.evidence.some(({ id }) => id === "E-G04-S608-START"));
if (board.revision === 3564) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S608-START" && uri === "docs/research/epic17/S608-clo-input-side-stage-diagnosis/S608-start-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S608-clo-input-side-stage-diagnosis/S608-start-packet.md", "utf8");
assert(packet.includes("input-side scene, not a reimport of the failed S595 output"));
assert(packet.includes("stage not attributable"));
console.log("S608 start preflight passed; S607 evidence and admitted V03 status are intact.");
