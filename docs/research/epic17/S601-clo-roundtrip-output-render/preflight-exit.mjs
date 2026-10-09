import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3538);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id }) => id === "E-G04-S601-EXIT"));

const fixtures = [
  ["C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Input/polo-m-periodic-degree1-spline.dxf", 29412, "E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC"],
  ["C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Output/polo-m-periodic-degree1-spline-clo-aama.dxf", 219416, "E31F45437ECADB4ED40E7B2BFB99468509CEEBF17027C87F4E9F8150906C22F2"],
  ["C:/G04-CLO-DXF-Exchange/S601-clo-roundtrip-output-render/S601-polo-m-output-reimport.zprj", 2333121, "A00394393B3D4C19F5742CC72870BC5A0EE245B3E543E9E14C686D3DBAF23B1C"],
  ["C:/G04-CLO-DXF-Exchange/S601-clo-roundtrip-output-render/S601-polo-m-output-reimport.pdf", 46744, "BE82820EC59BFC366E949CB4CAF4413699E0A6B3E2D99B6CD58C707A82704C95"],
  ["C:/G04-CLO-DXF-Exchange/S601-clo-roundtrip-output-render/S601-output-page-1.png", 198136, "51068467942697959751C18D531749FB3AA824975EAE66546F91358547F86DB5"],
];
for (const [path, size, expected] of fixtures) {
  const content = await readFile(path);
  assert.equal((await stat(path)).size, size, `size mismatch: ${path}`);
  assert.equal(createHash("sha256").update(content).digest("hex").toUpperCase(), expected, `hash mismatch: ${path}`);
}
console.log("S601 board exit and five pinned C: input/output/project/render artifacts pass.");
