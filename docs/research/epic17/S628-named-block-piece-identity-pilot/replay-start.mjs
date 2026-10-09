import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S628-named-block-piece-identity-pilot";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3652 && board.evidence.some((item) => item.id === "E-G04-S628-START")) {
  console.log("S628 start replay already applied.");
  process.exit(0);
}
if (board.revision === 3653 && board.evidence.some((item) => item.id === "E-G04-S628-START")
  && board.comments.some((item) => item.text.includes("S628 asks one new, directly measurable identity question"))) {
  console.log("S628 start replay already applied.");
  process.exit(0);
}
assert.equal(board.revision, 3652, "refusing stale S628 start replay");
for (const file of ["S628-start-add-evidence.json", "S628-start-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${dir}/${file}`], { stdio: "inherit" });
}
board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3654);
assert(board.evidence.some((item) => item.id === "E-G04-S628-START" && item.verified));
assert.equal(board.workItems.find((item) => item.id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find((item) => item.id === "EPIC-17")?.status, "In Progress");
console.log("S628 validated start replay passed at revision 3654; G04 and EPIC statuses unchanged.");
