import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S615-standard-dxf-explicit-scale";
const packet = await readFile(`${dir}/S615-start-packet.md`, "utf8");
assert(packet.includes("1000%") && packet.includes("0.001 cm"));
assert(packet.includes("does not rescale the emitted file after export"));
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3591, 3593].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision === 3591) for (const name of ["S615-start-add-evidence.json", "S615-start-add-comment.json"]) board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
assert.equal(board.revision, 3593);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S615-START" && uri === `${dir}/S615-start-packet.md` && verified));
console.log("S615 start preflight passed: single-scale diagnostic and unchanged acceptance; command layer validates 3591→3593.");
