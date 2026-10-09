import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S611-free-local-apparel-cad-alternatives";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3576, 3578].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S611-START" && uri === `${dir}/S611-start-packet.md` && verified));
if (board.revision === 3576) assert(!board.evidence.some(({ id }) => id === "E-G04-S611-EXIT"));
if (board.revision === 3578) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S611-EXIT" && uri === `${dir}/S611-exit-packet.md` && verified));
const packet = await readFile(`${dir}/S611-exit-packet.md`, "utf8");
const matrix = await readFile(`${dir}/V03-CURRENT-GATE-MATRIX-S611.md`, "utf8");
assert(packet.includes("No free/local alternative"));
assert(packet.includes("Standard DXF"));
assert(matrix.includes("All V03 holds remain"));
console.log("S611 exit preflight passed: candidate dispositions, next discriminating test, and unchanged board status verified.");
