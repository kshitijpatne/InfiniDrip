import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S611-free-local-apparel-cad-alternatives";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3574);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S611-start-add-evidence.json", "S611-start-add-comment.json"]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
}
assert.equal(board.revision, 3576);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S611-START" && uri === `${dir}/S611-start-packet.md` && verified));
console.log("S611 start preflight passed 3574→3576; G04 statuses unchanged.");
