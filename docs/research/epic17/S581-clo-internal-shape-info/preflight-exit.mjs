import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const exitApplied = board.revision === 3441 && board.evidence.some(({ id }) => id === "E-G04-S581-EXIT");
assert.ok((board.revision === 3439 && !exitApplied) || exitApplied, "unexpected board revision before/after S581 exit");
const json = JSON.parse(await readFile("C:/G04-CLO-DXF-Exchange/S581-clo-internal-shape-info/Evidence/internal-shape-info.json", "utf8"));
assert.equal(json.pattern_count, 9);
assert.equal(json.patterns.length, 9);
assert.ok(json.patterns.every(({ error }) => error?.type === "AttributeError" && /GetInternalShapeInformation/.test(error.message)));
console.log(`S581 output schema, nine exact-build API failures, and board revision ${board.revision} preflight passed.`);
