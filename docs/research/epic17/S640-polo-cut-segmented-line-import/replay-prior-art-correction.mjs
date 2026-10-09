import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S640-polo-cut-segmented-line-import";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3705, "refusing stale S640 prior-art correction");
execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/S640-prior-art-correction.json`], { stdio: "inherit" });
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3706);
assert(board.workItems.find((item) => item.id === "G04-V03")?.comments.at(-1)?.text.includes("S620/S621 already tested"));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
console.log("S640 prior-art correction passed through the validated command layer at board revision 3706.");
