import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3554);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S605-EXIT" && uri === "docs/research/epic17/S605-clo-readonly-internal-geometry/S605-exit-packet.md" && verified));
assert(!board.evidence.some(({ id }) => id === "E-G04-S606-START"));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert((await readFile("docs/research/epic17/S606-clo-inputinfo-grade-identity/S606-start-packet.md", "utf8")).length > 2000);
console.log("S606 start preflight passed; S605 evidence and admitted statuses are intact.");
