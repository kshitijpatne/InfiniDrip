import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3536);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id }) => id === "E-G04-S601-START"));
const fixtures = [
  ["C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Input/polo-m-periodic-degree1-spline.dxf", 29412, "E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC"],
  ["C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Output/polo-m-periodic-degree1-spline-clo-aama.dxf", 219416, "E31F45437ECADB4ED40E7B2BFB99468509CEEBF17027C87F4E9F8150906C22F2"],
];
for (const [path, size, expected] of fixtures) {
  const content = await readFile(path);
  assert.equal((await stat(path)).size, size);
  assert.equal(createHash("sha256").update(content).digest("hex").toUpperCase(), expected);
}
console.log("S601 board start and pinned S595 source/output hashes pass.");
