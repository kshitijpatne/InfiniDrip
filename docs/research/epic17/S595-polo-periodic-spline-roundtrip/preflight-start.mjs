import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = "docs/research/epic17/S595-polo-periodic-spline-roundtrip";
let candidate = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(candidate.revision, 3506, "refusing stale S595 start preflight");
assert.equal(candidate.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
for (const name of ["S595-start-add-evidence.json", "S595-start-add-comment.json"]) candidate = applyBoardCommand(candidate, JSON.parse(await readFile(`${directory}/${name}`, "utf8")));
assert.equal(candidate.revision, 3508);
assert.ok(candidate.evidence.some(({ id }) => id === "E-G04-S595-START"));
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(candidate.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S595 start commands pass clone preflight at 3506→3508; statuses are preserved.");
