import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S616-standard-dxf-units-sensitivity";
const root = "C:/G04-CLO-DXF-Exchange/S616-standard-dxf-units-sensitivity";
const expected = new Map([
  [`${root}/Input/polo-standard-m.dxf`, "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca"],
  [`${root}/Output/polo-m-standard-millimeter-input-astm-output.dxf`, "e15b7929bc5c850bbfe348adf2b280deeb099a0c7be6c76135566fff978f0b9e"],
  [`${root}/Evidence/source-import-millimeter-100pct.png`, "858161498a60ea1d390fedcd91b00ec38657461439f68b46adbd92d5901098d8"],
  [`${root}/Evidence/source-import-standard-millimeter-100pct.zprj`, "599e6e0b3a8ace64a78dff965496b44add9e4178a8a0d48b00639bd8e9fbb808"],
  [`${root}/Evidence/reimport-mm-source-astm-output.png`, "846493bca3729f56546985e7e2ba9289cb2c7ab2ec5ba39cc0647b2b38a43672"],
  [`${root}/Evidence/reimport-mm-source-astm-output.zprj`, "ec99bb1ce75438b811e2ec2caaa96b7755e02fc2b3e55c37ad6220f29f9fa7c9"],
]);
for (const [path, digest] of expected) {
  const bytes = await readFile(path);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), digest, `SHA-256 mismatch: ${path}`);
  assert((await stat(path)).size > 0, `empty evidence: ${path}`);
}
const packet = await readFile(`${dir}/S616-exit-packet.md`, "utf8");
const matrix = await readFile(`${dir}/V03-CURRENT-GATE-MATRIX-S616.md`, "utf8");
assert(packet.includes("every coordinate and remaining DXF line is identical"));
assert(packet.includes("0.1×") && packet.includes("0/9 CUT and 0/9 SEW"));
assert(packet.includes("remains open") && packet.toLowerCase().includes("no v03 gate clears"));
assert(matrix.includes("all-seven") && matrix.includes("Keep V03 open"));
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3598, 3601].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
let simulated = board;
if (board.revision === 3598) {
  for (const name of ["S616-exit-add-evidence.json", "S616-exit-add-comment.json", "S616-exit-add-matrix.json"]) {
    simulated = applyBoardCommand(simulated, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
  }
}
assert.equal(simulated.revision, 3601);
for (const id of ["E-G04-S616-EXIT", "E-G04-S616-MATRIX"]) assert(simulated.evidence.some((entry) => entry.id === id && entry.verified));
console.log("S616 exit preflight passed: six C: evidence hashes match; current evidence/holds and 3598→3601 validated commands are consistent.");
