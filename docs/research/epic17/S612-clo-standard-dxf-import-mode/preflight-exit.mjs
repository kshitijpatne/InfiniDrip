import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S612-clo-standard-dxf-import-mode";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3580);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S612-exit-add-evidence.json", "S612-exit-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3582);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S612-EXIT" && uri === `${dir}/S612-exit-packet.md` && verified));
console.log("S612 exit preflight passed 3580→3582; G04 work-item states remain unchanged.");
