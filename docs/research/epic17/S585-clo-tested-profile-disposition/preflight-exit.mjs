import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.ok([3455, 3457].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S585-START"));
if (board.revision === 3457) assert.ok(board.evidence.some(({ id }) => id === "E-G04-S585-EXIT"));
execFileSync(process.execPath, ["docs/research/epic17/S585-clo-tested-profile-disposition/verify-existing-evidence.mjs"], { stdio: "inherit" });
console.log(`S585 exit preflight passed at board revision ${board.revision}.`);
