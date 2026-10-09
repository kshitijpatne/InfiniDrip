import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S616-standard-dxf-units-sensitivity";
const packet = await readFile(`${dir}/S616-start-packet.md`, "utf8");
assert(packet.includes("Millimeter") && packet.includes("100%") && packet.includes("0.001 cm"));
assert(packet.includes("source/cut geometry") && packet.includes("all seven recipes"));
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3596, 3598].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
if (board.revision === 3596) {
  for (const name of ["S616-start-add-evidence.json", "S616-start-add-comment.json"]) board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3598);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S616-START" && uri === `${dir}/S616-start-packet.md` && verified));
console.log("S616 start preflight passed: mm/100% unit-selector sensitivity; current V03/all-seven gates retained; commands valid for 3596→3598.");
