import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const expected = board.revision;
for (const path of [
  "docs/research/epic17/S540-clo-swap-import-option/S540-start-add-evidence.json",
  "docs/research/epic17/S540-clo-swap-import-option/S540-start-add-comment.json",
]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(path, "utf8")), {
    now: "2026-10-08T21:50:53.000Z",
  });
}
if (expected !== 3271 || board.revision !== 3273) throw new Error("Unexpected S540 start revision");
if (board.workItems.find(({ id }) => id === "G04-V03")?.status !== "In Progress") {
  throw new Error("S540 must preserve G04-V03 status");
}
console.log(JSON.stringify({ startRevision: expected, previewRevision: board.revision, v03: "In Progress" }));
