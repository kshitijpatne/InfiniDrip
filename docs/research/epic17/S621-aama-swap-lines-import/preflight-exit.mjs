import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S621-aama-swap-lines-import";
const sha = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");
const expected = new Map([
  [`${root}/Input/polo-source-m-cut-lines.dxf`, "a95e2cbafaa14555421517505ca83225e9e0acb26dbadb4b7fa62ac5a0d1b675"],
  [`${root}/Project/clo-aama-swap-lines-import.zprj`, "4b75d868ee9f4cee883811da484de33c6ea0cc5af333970dbb7c8e46d3e49642"],
  [`${root}/Evidence/preexport-input-information.json`, "9b9120d5b0fb2abd09a54633e8e28a859a00affa0c6c5f4df523b8c2bb86e164"],
  [`${root}/Evidence/preexport-cut-sew-comparison.json`, "c2581a0e779c10ff58288bfb2b42674268ef0b37c68d0e22d7d6e696d712271b"],
  [`${root}/Evidence/clo-swap-import-render.pdf`, "f103bed72cad87728473fbf97260f9a82de54e4cdb15a2d1d2ed7593c2dda82d"],
]);
for (const [file, hash] of expected) assert.equal(await sha(file), hash, `hash mismatch: ${file}`);
const info = JSON.parse((await readFile(`${root}/Evidence/preexport-input-information.json`)).toString("utf8"));
const report = JSON.parse((await readFile(`${root}/Evidence/preexport-cut-sew-comparison.json`)).toString("utf8"));
assert.equal(info.pattern_count, 9);
assert.equal(info.errors.length, 0);
assert.equal(info.import_profile.swap_cutting_and_sewing, true);
assert.equal(report.summary.sewPasses, 9);
assert.equal(report.summary.cutPasses, 0);
assert.equal(report.noSwapBaseline.pointListsIdenticalByPattern.length, 9);
assert(report.noSwapBaseline.pointListsIdenticalByPattern.every(Boolean));
assert.equal(report.pieces.filter((piece) => piece.cutPass).length, 0);
assert.equal((await readdir(`${root}/Output`)).length, 0, "unexpected DXF output after pre-export gate failure");
console.log("S621 exit preflight passed: hashes, 9/9 SEW, 0/9 CUT, unchanged native point lists, one-page render and no DXF export.");
