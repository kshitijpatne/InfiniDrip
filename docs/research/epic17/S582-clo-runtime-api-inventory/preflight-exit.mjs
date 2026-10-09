import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const exitApplied = board.revision === 3445 && board.evidence.some(({ id }) => id === "E-G04-S582-EXIT");
assert.ok((board.revision === 3443 && !exitApplied) || exitApplied, "unexpected board revision before/after S582 exit");
const data = JSON.parse(await readFile("C:/G04-CLO-DXF-Exchange/S582-clo-runtime-api-inventory/Evidence/pattern-api-names.json", "utf8"));
assert.equal(data.error, null);
assert.equal(data.public_names.length, 217);
assert.deepEqual(data.public_names, [...new Set(data.public_names)].sort());
assert.equal(data.public_names.includes("GetInternalShapeInformation"), false);
assert.equal(data.public_names.includes("GetInnerShapeList"), false);
for (const name of ["GetPatternInformation", "GetPatternInputInformation", "GetPatternInternalShapePoints", "GetPatternLineInfo", "GetPatternOutlinePoints", "GetPatternBaselinePoints"]) {
  assert.ok(data.public_names.includes(name), `${name} should be present in the captured runtime list`);
}
console.log(`S582 output inventory and board revision ${board.revision} preflight passed.`);
