import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.ok([3459, 3461].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S586-START"));
const report = await readFile("C:/G04-CLO-DXF-Exchange/S586-product-dxf-source-map/Evidence/product-source-profile-map.json");
assert.equal(createHash("sha256").update(report).digest("hex").toUpperCase(), "DAB581580F3F21FF11E6F31E05CA979F8A3169B60D46B7405784CCBC732AB87D");
if (board.revision === 3461) assert.ok(board.evidence.some(({ id }) => id === "E-G04-S586-EXIT"));
console.log(`S586 exit preflight passed at revision ${board.revision}; report hash verified.`);
