import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir = "docs/research/epic17/S638-v03-profile-rights-reconciliation";
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, "f4097e2a5bdedf6df1d7589dff83e753097b4a1f");
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((subject) => /^Slice (\d+):/u.exec(subject)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 637, "S638 must be the unique next landed slice before its commit");
const matrix = await readFile(`${dir}/V03-CURRENT-GATE-MATRIX-S638.md`, "utf8");
for (const phrase of [
  "withdrawn in 2019", "November 13, 2002", "Updated 2026-09-28",
  "0.012736–0.013970 cm", "32 exact-locus quarter-ARCs",
  "Open / blocking", "no acceptance gate is cleared", "without asserting ANSI/AAMA 292 or ASTM D6673 conformance",
]) assert(matrix.includes(phrase), `current V03 matrix missing verified statement: ${phrase}`);
assert.match(matrix, /S635\/S636[\s\S]*?same five miss vertices/u);
assert.match(matrix, /S637[\s\S]*?omits seven placket buttons and the stand mark/u);
const packet = await readFile(`${dir}/S638-exit-packet.md`, "utf8");
assert.match(packet, /WORK FINISHED/u);
assert.match(packet, /effective 2002-11-13/u);
assert.match(packet, /withdrawn in 2019/u);
assert.match(packet, /42\/42/u);
assert.match(packet, /maintainer to confirm/u);
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3694, 3696].includes(board.revision), "board moved unexpectedly during S638 closeout");
assert(board.evidence.some((entry) => entry.id === "E-G04-S638-START" && entry.verified));
if (board.revision === 3696) assert(board.evidence.some((entry) => entry.id === "E-G04-S638-EXIT" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
assert.equal(execFileSync("git", ["diff", "--name-only", "--", "src"], { encoding: "utf8" }).trim(), "");
console.log("S638 exit preflight passed: unique slice, official profile/rights evidence, current empirical gate matrix, outside-agent finished review, and unchanged work status/holds.");
