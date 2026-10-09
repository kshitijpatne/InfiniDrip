import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3546);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S603-EXIT" &&
  uri === "docs/research/epic17/S603-waistband-sew-grading-trial/S603-exit-packet.md" && verified));
assert(!board.evidence.some(({ id }) => id === "E-G04-S604-START"));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S604-clo-internal-grade-selection-research/S604-start-packet.md");
assert(packet.length > 2500);
console.log("S604 start preflight passed; S603 evidence and admitted statuses are intact.");
