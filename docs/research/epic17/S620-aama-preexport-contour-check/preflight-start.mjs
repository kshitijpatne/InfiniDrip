import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S620-aama-preexport-contour-check";
const packet = await readFile(`${dir}/S620-start-packet.md`, "utf8");
const normalizedPacket = packet.toLowerCase();
assert(normalizedPacket.includes("after-aama-import, before-export") && normalizedPacket.includes("no exchange is repeated"));
const paths = [
  ["C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Evidence/clo-after-line-chain-import.zprj", "43ab4cd6de6a823cf671bf7fe748abc4052744a396e3dbcb0fe9539055d39e25"],
  ["C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m-cut-lines.dxf", "a95e2cbafaa14555421517505ca83225e9e0acb26dbadb4b7fa62ac5a0d1b675"],
  ["C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Output/polo-line-chain-gen1.dxf", "346f38a02748f96247716d9e5a992912cc018cb2eeb4506c092c4f43eedaf1e3"],
];
for (const [path, expected] of paths) assert.equal(createHash("sha256").update(await readFile(path)).digest("hex"), expected, `hash mismatch: ${path}`);
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3614, 3616].includes(board.revision));
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
if (board.revision === 3614) {
  for (const file of ["S620-start-add-evidence.json", "S620-start-add-comment.json"]) {
    board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${file}`, "utf8")));
  }
}
assert.equal(board.revision, 3616);
assert(board.evidence.some((item) => item.id === "E-G04-S620-START" && item.verified));
console.log("S620 start preflight passed: S574 AAMA evidence hash-pinned and 3614→3616 board commands validated.");
