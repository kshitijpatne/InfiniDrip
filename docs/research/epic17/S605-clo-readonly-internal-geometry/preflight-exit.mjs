import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3552, 3554].includes(board.revision), "refusing stale S605 exit state");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S605-START" && uri === "docs/research/epic17/S605-clo-readonly-internal-geometry/S605-start-packet.md" && verified));
if (board.revision === 3552) assert(!board.evidence.some(({ id }) => id === "E-G04-S605-EXIT"));
if (board.revision === 3554) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S605-EXIT" && uri === "docs/research/epic17/S605-clo-readonly-internal-geometry/S605-exit-packet.md" && verified));
for (const id of ["EPIC-17", "G04-V03"]) assert.equal(board.workItems.find(({ id: workId }) => workId === id)?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
const packet = await readFile("docs/research/epic17/S605-clo-readonly-internal-geometry/S605-exit-packet.md", "utf8");
assert.match(packet, /NameError\("name.*utility_api.*not defined"\)/);
assert.match(packet, /empty outline-point list/);
assert.match(packet, /At S606, return to the current V03 acceptance matrix/);
assert.match(packet, /0\.001 cm/);
console.log("S605 exit preflight passed; exact runtime failure, holds, unchanged gates, and S606 next action are recorded.");
