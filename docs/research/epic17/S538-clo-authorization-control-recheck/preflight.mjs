import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const boardPath = "ops/control-center/data/board.json";
const files = [
  "docs/research/epic17/S538-clo-authorization-control-recheck/S538-start-add-evidence.json",
  "docs/research/epic17/S538-clo-authorization-control-recheck/S538-start-add-comment.json",
  "docs/research/epic17/S538-clo-authorization-control-recheck/S538-exit-add-evidence.json",
  "docs/research/epic17/S538-clo-authorization-control-recheck/S538-exit-add-comment.json",
];
let board = JSON.parse(await readFile(boardPath, "utf8"));
const startRevision = board.revision;
for (const path of files) {
  const command = JSON.parse(await readFile(path, "utf8"));
  board = applyBoardCommand(board, command, { now: "2026-10-08T21:42:03.000Z" });
}
if (board.revision !== startRevision + files.length) throw new Error("Unexpected replay revision");
if (board.workItems.find(({ id }) => id === "G04-V03")?.status !== "In Progress") {
  throw new Error("S538 must preserve G04-V03 status");
}
console.log(JSON.stringify({ startRevision, previewRevision: board.revision, commands: files.length, v03: "In Progress" }));
