import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (board.revision === 3443 && board.evidence.some(({ id }) => id === "E-G04-S582-START")) {
  console.log("S582 start already applied at revision 3443.");
  process.exit(0);
}
assert.equal(board.revision, 3441, "unexpected board revision before S582 start");
assert.ok(!board.evidence.some(({ id }) => id === "E-G04-S582-START"), "S582 start evidence already exists");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S582 start board preflight passed at revision 3441.");
