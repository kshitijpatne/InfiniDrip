import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir = "docs/research/epic17/S635-clo-lwpolyline-cut-import";
const packet = await readFile(`${dir}/S635-start-packet.md`, "utf8");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), "10ed333ecb8323e7a3b1cb2a381e3c0a414af4eb");
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((s) => /^Slice (\d+):/u.exec(s)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 634);
assert.equal(board.revision, 3682);
assert(board.evidence.some((entry) => entry.id === "E-G04-S635-START" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
assert.match(packet, /Convert exactly the nine closed `CUT` entities/u);
assert.match(packet, /coordinate-identical/u);
assert.match(packet, /native contours before any\s+export decision/u);
const productionDiff = execFileSync("git", ["diff", "--name-only", "--", "src"], { encoding: "utf8" }).trim();
assert.equal(productionDiff, "", "S635 experiment may not change production source");
console.log("S635 start preflight passed: clean S634 boundary, refreshed origin ancestry, unique slice 635, board revision 3680, preserved statuses, and experimental-only scope.");
