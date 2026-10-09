import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3447 && board.evidence.some(({ id }) => id === "E-G04-S583-START")) {
  console.log("S583 start already applied at revision 3447.");
  process.exit(0);
}
assert.equal(board.revision, 3445, "unexpected board revision before S583 start");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S583 start board preflight passed at revision 3445.");
