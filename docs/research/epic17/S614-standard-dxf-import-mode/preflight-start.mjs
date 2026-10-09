import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S614-standard-dxf-import-mode";
const packet = await readFile(`${dir}/S614-start-packet.md`, "utf8");
assert(packet.includes("Standard DXF") && packet.includes("DXF-ASTM"));
assert(packet.includes("all-seven-recipe acceptance") && packet.includes("0.001 cm"));
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3586);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S614-start-add-evidence.json", "S614-start-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3588);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S614-START" && uri === `${dir}/S614-start-packet.md` && verified));
console.log("S614 start preflight passed: admitted fixed-variable CLO test, nonrelaxed gates and valid 3586→3588 command chain.");
