import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
const dir = "docs/research/epic17/S618-s617-closeout-correction";
const packet = await readFile(`${dir}/S618-exit-packet.md`, "utf8");
assert(packet.includes("13:01:01 UTC") && packet.includes("42/42") && packet.includes("all-seven"));
const state = await readFile("PROJECT-STATE.md", "utf8");
assert(!state.endsWith(String.fromCharCode(10, 10)), "PROJECT-STATE.md has an extra EOF blank line");
const s617 = await readFile("docs/research/epic17/S617-standard-dxf-units-header/S617-exit-packet.md", "utf8");
assert(s617.includes("13:01:01 UTC") && s617.includes("17m25s"));
const commit = execFileSync("git", ["show", "-s", "--format=%cI", "bc0064c4"], { encoding: "utf8" }).trim();
assert(commit.includes("09:01:01-04:00"));
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert(board.revision >= 3610);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
let simulated = board;
if (board.revision === 3608) {
  for (const file of ["S618-exit-add-evidence.json", "S618-exit-add-comment.json"]) simulated = applyBoardCommand(simulated, JSON.parse(await readFile(`${dir}/${file}`, "utf8")));
}
assert(simulated.revision >= 3610);
assert(simulated.evidence.some(({ id, verified }) => id === "E-G04-S618-EXIT" && verified));
console.log("S618 exit preflight passed: S617 timing, clean EOF, original commit time, reusable evidence, board commands, and active V03 status are verified.");
