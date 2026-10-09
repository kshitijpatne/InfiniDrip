import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const root = "C:/G04-CLO-DXF-Exchange/S637-woven-circle-arc-trial";
const dir = "docs/research/epic17/S637-woven-circle-arc-trial";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pin = async (path, digest, bytes) => {
  const content = await readFile(path);
  assert.equal(content.length, bytes, `${path} size changed`);
  assert.equal(sha(content), digest, `${path} hash changed`);
  return content;
};

const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, "04c37f4da6e4acde7add2638c63643361686c5d9");
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((subject) => /^Slice (\d+):/u.exec(subject)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 636, "S637 must be the unique next landed slice before its commit");

const reportBytes = await pin(`${root}/Evidence/derivative-report.json`, "23FD100A28C0F2882045284EE78A3B8A31AD3C2324026C4B70A891809516A41A", 1326);
const report = JSON.parse(reportBytes.toString("utf8"));
assert.equal(report.transform.sourceCircleCount, 8);
assert.equal(report.transform.derivativeArcCount, 32);
assert.equal(report.transform.sourceCircleCountRemaining, 0);
assert.equal(report.transform.allNonTargetEntityPairsUnchanged, true);
await pin(`${root}/Input/woven-source-circles.dxf`, "DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6", 17039);
await pin(`${root}/Input/woven-four-arcs-per-button.dxf`, "5AC038B23D66AA57B2C089639230055C021C461A72BD39BD5D680AFF9D9D40BA", 18764);
const project = await pin(`${root}/Project/S637-woven-circle-arc-trial.zprj`, "723F6CDDEC96172CFD322E496D937820A84893B866CA1ED164F738099880D698", 2314885);
const nativeBytes = await pin(`${root}/Evidence/native-input-information.json`, "30F0A509D59DFB83C9A20AB7E38FBDFDEC386EF7E0540EB8FC411CEDAA354B75", 516384);
const native = JSON.parse(nativeBytes.toString("utf8"));
assert.equal(native.pattern_count, 12);
assert.equal(native.errors.length, 0);
assert.equal(native.intended_project_sha256, sha(project));
for (const [pieceName, reportedCount, enumeratedCount] of [
  ["IDR_WOVEN_OUTER_WOVEN_STAND", "5", 4],
  ["IDR_WOVEN_WOVEN_BUTTON_PLACKET", "7", 6],
]) {
  const pattern = native.patterns.find((item) => item.pattern_name === pieceName);
  assert(pattern, `missing native pattern ${pieceName}`);
  const children = pattern.input_information["Pattern InputInformation"][0]["Children Information"];
  assert.equal(children[0]["Children shape count"], reportedCount);
  assert.equal(children.length - 1, enumeratedCount);
  for (const shape of children.slice(1)) {
    assert.equal(shape["Shape type"], "Base Line");
    assert(shape.LineList.slice(1).every((line) => line["Line type"] === "Straight type"));
  }
}
const snapshot = await pin(`${root}/Evidence/S637-clo-2d-snapshot.png`, "DF4AA5B3A4101578FF6DC0A62FB588F4457F0E3F0761426FCD2675D3AA37A487", 899231);
await pin(`${root}/Evidence/S637-clo-button-plackets-detail.png`, "77B79C3715FCD03740133B333479FEC688226DE96D30B3331C2CED512A178316", 336554);
assert.equal(snapshot.readUInt32BE(16), 17820);
assert.equal(snapshot.readUInt32BE(20), 4200);

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3690, 3692].includes(board.revision), "board moved unexpectedly during S637 closeout");
assert(board.evidence.some((entry) => entry.id === "E-G04-S637-START" && entry.verified));
if (board.revision === 3692)
  assert(board.evidence.some((entry) => entry.id === "E-G04-S637-EXIT" && entry.verified));
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
assert.equal(execFileSync("git", ["diff", "--name-only", "--", "src"], { encoding: "utf8" }).trim(), "", "research-only slice may not change production source");
const packet = await readFile(`${dir}/S637-exit-packet.md`, "utf8");
assert.match(packet, /did not display the expected\s+button marks/u);
assert.match(packet, /DXF export or round trip was attempted/u);
console.log("S637 exit preflight passed: unique-slice boundary, source/derivative assertions, hash-pinned one-generation CLO import/query/renders, visible-mark failure and stop-before-export, unchanged statuses/holds, no production-source changes.");
