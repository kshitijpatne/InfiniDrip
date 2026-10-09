import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S617-standard-dxf-units-header";
const packet = await readFile(`${dir}/S617-start-packet.md`, "utf8");
assert(packet.includes("$INSUNITS=5") && packet.includes("Standard-DXF import"));
assert(packet.includes("0.001 cm") && packet.includes("all-seven recipe"));
assert(packet.toLowerCase().includes("no production source") && packet.includes("C:\\G04-CLO-DXF-Exchange"));
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3601, 3603].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision === 3601) {
  for (const name of ["S617-start-add-evidence.json", "S617-start-add-comment.json"]) {
    board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
  }
}
assert.equal(board.revision, 3603);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S617-START" && uri === `${dir}/S617-start-packet.md` && verified));
console.log("S617 start preflight passed: source-backed one-variable unit-header trial; V03 gates retained; commands valid for 3601→3603.");
