import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const directory = "docs/research/epic17/S595-polo-periodic-spline-roundtrip";
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3512, "refusing stale summary correction preflight");
for (const name of ["1", "2"]) board = applyBoardCommand(board, JSON.parse(await readFile(`${directory}/S595-summary-correction-${name}.json`, "utf8")));
assert.equal(board.revision, 3514);
assert.match(board.epics.find(({ id }) => id === "EPIC-17")?.description, /Preserve V02-before-V03, legacy DXF behavior and protected export identities/);
assert.match(board.workItems.find(({ id }) => id === "EPIC-17")?.description, /Preserve V02-before-V03, legacy DXF behavior and protected export identities/);
console.log("S595 summary-correction commands pass clone preflight at 3512→3514.");
