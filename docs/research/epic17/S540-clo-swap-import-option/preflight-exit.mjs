import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const expected = board.revision;
for (const path of [
  "docs/research/epic17/S540-clo-swap-import-option/S540-exit-add-evidence.json",
  "docs/research/epic17/S540-clo-swap-import-option/S540-exit-add-comment.json",
]) {
  board = applyBoardCommand(board, JSON.parse(await readFile(path, "utf8")), {
    now: "2026-10-08T21:58:04.000Z",
  });
}
if (expected !== 3273 || board.revision !== 3275) throw new Error("Unexpected S540 exit revision");
if (board.workItems.find(({ id }) => id === "G04-V03")?.status !== "In Progress") {
  throw new Error("S540 must preserve G04-V03 status");
}
console.log(JSON.stringify({ startRevision: expected, previewRevision: board.revision, v03: "In Progress" }));
