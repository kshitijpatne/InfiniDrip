import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir = "docs/research/epic17/S635-clo-lwpolyline-cut-import";
const root = "C:/G04-CLO-DXF-Exchange/S635-cut-lwpolyline-import";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pin = async (path, digest) => { const bytes = await readFile(path); assert.equal(sha(bytes), digest, `${path} hash changed`); return bytes; };

const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, "10ed333ecb8323e7a3b1cb2a381e3c0a414af4eb");
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((subject) => /^Slice (\d+):/u.exec(subject)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 634, "S635 must be the unique next landed slice before its commit");

const [sourceBytes, derivativeBytes, projectBytes, nativeBytes, reportBytes, screenshotBytes, manifestBytes] = await Promise.all([
  pin(`${root}/Input/polo-standard-m-cm-units-header.dxf`, "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5"),
  pin(`${root}/Output/polo-cm-header-cut-lwpolyline.dxf`, "606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360"),
  pin(`${root}/Evidence/s635-cut-lwpolyline-standard-import.zprj`, "E03E0762DB05AB9D7D8B4363F7DBAEFEF5E71DF48B01563C8EAE171ADA6D8ED0"),
  readFile(`${root}/Evidence/native-input-information.json`),
  readFile(`${root}/Evidence/native-cut-contour-comparison.json`),
  pin(`${root}/Evidence/clo-standard-import-overview.jpg`, "AAA721DB50891B1DE8C7BF654EEBC386D2F8E23C17B98B9EE919ACADF162088B"),
  readFile(`${root}/Evidence/derivative-manifest.json`),
]);
assert.equal(sourceBytes.length, 24326);
assert.equal(derivativeBytes.length, 19755);
assert.equal(JSON.parse(manifestBytes).changedEntities.length, 9);
const native = JSON.parse(nativeBytes);
assert.equal(native.intended_project_sha256, sha(projectBytes));
assert.equal(native.pattern_count, 9);
assert.equal(native.errors.length, 0);
const report = JSON.parse(reportBytes);
assert.equal(report.verdict, "FAIL_STOP_BEFORE_EXPORT");
assert.equal(report.exportPerformed, false);
assert.equal(report.results.length, 9);
assert.equal(report.results.filter((result) => result.status === "PASS_EXACT_CUT_CONTOUR").length, 4);
const failures = report.results.filter((result) => result.status === "FAIL_ONE_SOURCE_VERTEX_OMITTED");
assert.deepEqual(failures.map((result) => [result.piece, result.missingVertex.sourceVertexIndex]), [
  ["back", 13],
  ["outer collar stand", 14],
  ["inner collar stand", 14],
  ["upper pointed collar", 14],
  ["under pointed collar", 14],
]);
assert(failures.every((result) => result.missingVertex.mergedChordDeviationCm > report.toleranceCm));
assert(failures.every((result) => result.missingVertex.maxRetainedVertexDeltaMm <= report.toleranceCm * 10));
const artifacts = report.renderedEvidence.artifacts;
assert.equal(artifacts.length, 11, "expected live CLO overview plus 5 SVG/PNG pairs");
for (const artifact of artifacts) await pin(artifact.path, artifact.sha256);
assert.equal((await readdir(`${root}/Output`)).filter((name) => name.toLowerCase().endsWith(".dxf")).length, 1, "failed native gate must not have a receiver export");

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3684);
assert(board.evidence.some((entry) => entry.id === "E-G04-S635-EXIT" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
const packet = await readFile(`${dir}/S635-exit-packet.md`, "utf8");
assert.match(packet, /No DXF was exported/u);
assert.match(packet, /0\.001 cm/u);
assert.match(packet, /S636/u);
assert.equal(execFileSync("git", ["diff", "--name-only", "--", "src"], { encoding: "utf8" }).trim(), "", "research slice may not change production code");
console.log("S635 exit preflight passed: exact pinned import evidence, four controls, five measured CUT omissions, 11 rendered artifacts, no export, unchanged Epic statuses/holds, refreshed origin ancestry, and no production-source changes.");
