import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S612-clo-standard-dxf-import-mode";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3578);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S612-start-add-evidence.json", "S612-start-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3580);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S612-START" && uri === `${dir}/S612-start-packet.md` && verified));
console.log("S612 start preflight passed 3578→3580; G04 work-item states unchanged.");
