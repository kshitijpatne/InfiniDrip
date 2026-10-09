import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3560, 3562].includes(board.revision));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S607-START" && uri === "docs/research/epic17/S607-clo-waistband-sew-grade-trial/S607-start-packet.md" && verified));
if (board.revision === 3560) assert(!board.evidence.some(({ id }) => id === "E-G04-S607-EXIT"));
if (board.revision === 3562) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S607-EXIT" && uri === "docs/research/epic17/S607-clo-waistband-sew-grade-trial/S607-exit-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const packet = await readFile("docs/research/epic17/S607-clo-waistband-sew-grade-trial/S607-exit-packet.md", "utf8");
assert(/S607 therefore fails its selection\s+precondition/.test(packet));
assert(packet.includes("No grade value"));
console.log("S607 exit preflight passed; UI failure is preserved and no gate/status changed.");
