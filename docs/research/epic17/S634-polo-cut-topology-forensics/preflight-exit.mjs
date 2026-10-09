import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir = "docs/research/epic17/S634-polo-cut-topology-forensics";
const exchange = "C:/G04-CLO-DXF-Exchange/S634-polo-cut-topology-forensics/Evidence";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pinned = async (path, digest) => { const bytes = await readFile(path); assert.equal(sha(bytes), digest); return bytes; };
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, "cf367686b74b4572662d23b9cf12c459e1de4308");
execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
const subjects = execFileSync("git", ["log", "--all", "--format=%s"], { encoding: "utf8" }).split(/\r?\n/u);
const highest = Math.max(...subjects.map((s) => /^Slice (\d+):/u.exec(s)?.[1]).filter(Boolean).map(Number));
assert.equal(highest, 633, "S634 must be the unique next landed slice");

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3678);
for (const [id, status] of [["G04-V01", "Done"], ["G04-V02", "Done"], ["G04-V03", "In Progress"], ["EPIC-17", "In Progress"]])
  assert.equal(board.workItems.find((item) => item.id === id)?.status, status);
const topology = JSON.parse(await pinned(`${exchange}/S634-topology-comparison.json`, "CA173E45C9885186F490342D212E17B78AFD0FE2F41E18940556ABF2A763DE32"));
const trace = JSON.parse(await pinned(`${exchange}/S634-allowance-edge-trace.json`, "07BB3D0D8D17579A0AD788E97475F57296EA9A26E470C874748308FFE33740D7"));
await pinned(`${exchange}/S634-current-product-polo.dxf`, "796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA");
assert.equal(trace.exactBodyMatchWithHeaderFixture, true);
assert.equal(trace.sourceBodyBytes, 24261);
assert.equal(trace.regeneratedBodyBytes, 24261);
assert.equal(trace.exactVertexTraces.length, 5);
assert.deepEqual(trace.exactVertexTraces.map((t) => [t.piece, t.sampleEdgeName, t.mappedAllowanceSampleIndex]), [
  ["back", "neckline", 13],
  ["outer collar stand", "backCollar", 14],
  ["inner collar stand", "backCollar", 14],
  ["upper pointed collar", "backCollarBase", 14],
  ["under pointed collar", "backCollarBase", 14],
]);
assert(topology.allThreeHaveSameFiveFailingRoles);
for (const output of topology.outputs) {
  const failing = output.pieces.filter((piece) => piece.selectedCutMatch.receiverVertices !== piece.sourceCutVertices || piece.selectedCutMatch.maxSequenceDeltaCm > 0.001);
  assert.deepEqual(failing.map((piece) => piece.pieceIndex), [1, 5, 6, 7, 8]);
}
const packet = await readFile(`${dir}/S634-exit-packet.md`, "utf8");
assert.match(packet, /No source repair is recommended/u);
assert.match(packet, /0\.001 cm/u);
assert.match(packet, /S635/u);
const changedProduction = execFileSync("git", ["diff", "--name-only", "--", "src"], { encoding: "utf8" }).trim();
assert.equal(changedProduction, "", "research slice must not modify product code");
console.log("S634 evidence preflight passed: pinned files, exact generated source body, five named allowance-edge traces, identical failures across three CLO outputs, board holds, origin ancestry, and clean production-source diff.");
