import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, "3f3c6b9b4034ac615e03a7c448f127cbc4c9d260");
execFileSync("git", ["fetch", "origin", "main"]);
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((subject) => /^Slice (\d+):/u.exec(subject)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 635, "S636 must be the unique next slice");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3686);
assert(board.evidence.some((entry) => entry.id === "E-G04-S636-START" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
console.log("S636 verified start boundary: S635 commit, refreshed origin ancestry, unique slice, board revision 3686, and unchanged G04 statuses.");
