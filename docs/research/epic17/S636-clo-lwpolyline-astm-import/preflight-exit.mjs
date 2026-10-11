import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir = "docs/research/epic17/S636-clo-lwpolyline-astm-import";
const root = "C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pin = async (path, digest) => { const bytes = await readFile(path); assert.equal(sha(bytes), digest, `${path} hash changed`); return bytes; };

const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, "3f3c6b9b4034ac615e03a7c448f127cbc4c9d260");
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((subject) => /^Slice (\d+):/u.exec(subject)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 635, "S636 must be the unique next landed slice before its commit");

const source = await pin(`${root}/Input/polo-standard-m-cm-units-header.dxf`, "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5");
const derivative = await pin(`${root}/Input/polo-cm-header-cut-lwpolyline.dxf`, "606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360");
assert.equal(source.length, 24326);
assert.equal(derivative.length, 19755);
const project = await pin(`${root}/Evidence/s636-lwpolyline-astm-import.zprj`, "E206A23C3158B24751F91664D5749DD01D3834EB31FC45085A7B90337BF9B008");
const nativeBytes = await pin(`${root}/Evidence/native-input-information.json`, "9FD7325C408BD2A6E32E12238E70F14AD5659F5C56511D846D589943D719588B");
const reportBytes = await pin(`${root}/Evidence/native-cut-contour-comparison.json`, "832565017ED363CD7FF2912E4BC102C76ABF3E4F5C78E15B112AFF53FFEE9748");
const screenshot = await pin(`${root}/Evidence/clo-astm-import-overview.png`, "0BD6FA4B97B755932C786B88AB235140BE94E1890B1EC3C97DA360620652B993");
const renderManifest = await pin(`${root}/Evidence/render-manifest.json`, "573407773B2546AA2F4E54F5FCDC3AD883958A3BF75FC3113C276CD0806A3103");
const reconciliation = await pin(`${root}/Evidence/s635-s636-matrix-reconciliation.json`, "A4D6820ABBD053AE686C2F999F7D692E705D540054FD3097DFFA6B741B598AB3");
const native = JSON.parse(nativeBytes.toString("utf8"));
assert.equal(native.intended_project_sha256, sha(project));
assert.equal(native.pattern_count, 9);
assert.equal(native.errors.length, 0);
const report = JSON.parse(reportBytes.toString("utf8"));
assert.equal(report.verdict, "FAIL_STOP_BEFORE_EXPORT");
assert.equal(report.exportPerformed, false);
assert.equal(report.toleranceCm, 0.001);
assert.equal(report.results.filter((row) => row.status === "PASS_EXACT_CUT_CONTOUR").length, 4);
const failed = report.results.filter((row) => row.status !== "PASS_EXACT_CUT_CONTOUR");
assert.deepEqual(failed.map((row) => [row.piece, row.missingVertex.sourceVertexIndex]), [
  ["back", 13], ["outer collar stand", 14], ["inner collar stand", 14],
  ["upper pointed collar", 14], ["under pointed collar", 14],
]);
assert(failed.every((row) => row.missingVertex.mergedChordDeviationCm > report.toleranceCm));
assert.equal(report.renderedEvidence.artifacts.length, 11, "overview plus five SVG/PNG pairs must be pinned");
for (const artifact of report.renderedEvidence.artifacts) await pin(artifact.path, artifact.sha256);
assert.equal(JSON.parse(renderManifest.toString("utf8")).renderer.engine, "Playwright Chromium headless");
assert.equal(JSON.parse(reconciliation.toString("utf8")).identicalNativeResults, true);
assert.equal((await readdir(`${root}/Output`)).filter((name) => name.toLowerCase().endsWith(".dxf")).length, 0, "failed native geometry gate forbids a receiver export");

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3688);
assert(board.evidence.some((entry) => entry.id === "E-G04-S636-EXIT" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
assert.equal(execFileSync("git", ["diff", "--name-only", "--", "src"], { encoding: "utf8" }).trim(), "", "research-only slice may not change production source");
const packet = await readFile(`${dir}/S636-exit-packet.md`, "utf8");
assert.match(packet, /same four passes and five failures/u);
assert.match(packet, /DXF export or round-trip was attempted/u);
console.log("S636 exit preflight passed: refreshed origin ancestry, unique slice, hash-pinned 9-piece native query, four CUT controls/five measured misses, rendered evidence, identical Standard/ASTM CUT result, no export, unchanged Epic statuses/holds, and no production-source changes.");
