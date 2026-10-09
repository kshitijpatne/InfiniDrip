import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3534, "unexpected board revision after S600 exit");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S600-EXIT" && uri === "docs/research/epic17/S600-clo-rendered-detail-review/S600-exit-packet.md" && verified));
const artifacts = [
  ["S600-polo-m-whole.pdf", 39746, "FA321866B9C54E2F6F5AAF769EE9AA708C7C608162744DC6D892E2734228A331"],
  ["S600-polo-m-whole.png", 287554, "738B98A96318AEC22E0E1A9032F0F96F1AEE3A54D2D49585203D3B1BBA2006E1"],
  ["S600-detail-left.png", 75126, "64D1B8DE4DF818410DF2F365B67282982F54A92069BF975B2C67A68E0CC039B7"],
  ["S600-detail-center.png", 65816, "20904BEB676B159DB14CC87704C8AAFE021930F983D7CE7B2E18AFB5186830A8"],
  ["S600-detail-right.png", 82432, "FA5C66D72708A60299FEF0DA05CBEF3368F78223BD54B16BA879496277F79CD4"],
  ["S600-collar-label-overlap.png", 22878, "6860A377FA73A2D05351652E7AA2FB23B38AAC7B88F4E5BA3D8D1AC218B144EB"],
];
const base = "C:/G04-CLO-DXF-Exchange/S600-clo-rendered-detail-review";
for (const [name, size, sha256] of artifacts) {
  const path = `${base}/${name}`;
  assert.equal((await stat(path)).size, size, `${name} byte length`);
  assert.equal(createHash("sha256").update(await readFile(path)).digest("hex").toUpperCase(), sha256, `${name} SHA-256`);
}
console.log("S600 exit board state and all six C:-only artifact sizes/hashes pass.");
