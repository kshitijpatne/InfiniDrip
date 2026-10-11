import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const base = "C:/G04-CLO-DXF-Exchange";
const sourcePath = `${base}/S609-clo-dxf-astm-practical-trial/Input/polo-standard-m.dxf`;
const astmPath = `${base}/S609-clo-dxf-astm-practical-trial/Output/polo-m-clo-dxf-astm.dxf`;
const aamaPath = `${base}/S536-polo-aama-vertex-preservation/Output/polo-lwpolyline-aama-output.dxf`;
const reportPath = `${base}/S610-astm-vertex-loss-source-diagnosis/Evidence/s610-vertex-loss-comparison.json`;
const s609ReportPath = `${base}/S609-clo-dxf-astm-practical-trial/Evidence/Analysis/S609-dxf-astm-roundtrip-analysis.json`;
const sha = (b) => createHash("sha256").update(b).digest("hex");

function entities(bytes, name) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${name}: incomplete DXF pair`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const sections = new Map(); let section = null;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1][1]; sections.set(section, []); i++; }
    else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = null;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      sections.get(section).push(pairs.slice(start, i)); i--;
    }
  }
  const val = (e, c) => e.find(([g]) => g === c)?.[1];
  const layer = (e) => val(e, 8) ?? "(none)";
  const vertices = (e, records, start) => {
    const pts = [];
    if (e[0][1] === "LWPOLYLINE") {
      for (const [g, raw] of e.slice(1)) {
        if (g === 10) pts.push({ x: Number(raw), y: NaN });
        else if (g === 20 && pts.length) pts.at(-1).y = Number(raw);
      }
      return { pts, next: start + 1 };
    }
    if (e[0][1] !== "POLYLINE") return null;
    let i = start + 1;
    while (i < records.length && records[i][0][1] !== "SEQEND") {
      if (records[i][0][1] === "VERTEX") pts.push({ x: Number(val(records[i], 10)), y: Number(val(records[i], 20)) });
      i++;
    }
    return { pts, next: i + 1 };
  };
  const sourceRecords = sections.get("ENTITIES") ?? [];
  const source = [];
  for (let i = 0; i < sourceRecords.length;) {
    const e = sourceRecords[i], parsed = vertices(e, sourceRecords, i);
    if (parsed) { source.push({ layer: layer(e), closed: Boolean(Number(val(e, 70) ?? 0) & 1), pts: parsed.pts }); i = parsed.next; }
    else i++;
  }
  const blockRecords = sections.get("BLOCKS") ?? [];
  const blocks = new Map(); let block = null;
  for (let i = 0; i < blockRecords.length;) {
    const e = blockRecords[i], kind = e[0][1];
    if (kind === "BLOCK") { block = val(e, 2); i++; continue; }
    if (kind === "ENDBLK") { block = null; i++; continue; }
    const parsed = vertices(e, blockRecords, i);
    if (parsed && block) {
      if (!blocks.has(block)) blocks.set(block, []);
      blocks.get(block).push({ layer: layer(e), closed: Boolean(Number(val(e, 70) ?? 0) & 1), pts: parsed.pts });
      i = parsed.next;
    } else i++;
  }
  const insert = new Map();
  for (const e of sourceRecords.filter((r) => r[0][1] === "INSERT")) insert.set(val(e, 2), {
    x: Number(val(e, 10) ?? 0), y: Number(val(e, 20) ?? 0), sx: Number(val(e, 41) ?? 1), sy: Number(val(e, 42) ?? 1), rot: Number(val(e, 50) ?? 0) * Math.PI / 180,
  });
  for (const [blockName, paths] of blocks) {
    const tr = insert.get(blockName) ?? { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
    for (const path of paths) path.pts = path.pts.map(({ x, y }) => ({ x: tr.x + x * tr.sx * Math.cos(tr.rot) - y * tr.sy * Math.sin(tr.rot), y: tr.y + x * tr.sx * Math.sin(tr.rot) + y * tr.sy * Math.cos(tr.rot) }));
  }
  return { source, blocks, acadver: val((sections.get("HEADER") ?? []).find((e) => e[0][1] === "$ACADVER") ?? [], 1) };
}

const sourceBytes = await readFile(sourcePath), astmBytes = await readFile(astmPath), aamaBytes = await readFile(aamaPath);
const s609Roundtrip = JSON.parse(await readFile(s609ReportPath, "utf8"));
assert.equal(sha(sourceBytes), "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca");
assert.equal(sha(astmBytes), "be0f11fc3fca57887bdacce366034e4cf4479c2867be4529181dec34fffcb9e0");
assert.equal(sha(aamaBytes), "06ede87a504a38b21f7af3529a16ebb064768c14def1ec59287c6ced354ef4de");
const source = entities(sourceBytes, "source"), astm = entities(astmBytes, "ASTM"), aama = entities(aamaBytes, "AAMA");
const bad = ["back", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const pieceNo = new Map([["back",1],["outer collar stand",5],["inner collar stand",6],["upper pointed collar",7],["under pointed collar",8]]);
const expectedCounts = { back:33,"outer collar stand":54,"inner collar stand":54,"upper pointed collar":44,"under pointed collar":44 };
const center = (path) => ({ x: path.pts.reduce((a, p) => a + p.x, 0) / path.pts.length, y: path.pts.reduce((a, p) => a + p.y, 0) / path.pts.length });
const rows = bad.map((name) => {
  const i = pieceNo.get(name), blockName = `${i}_M`, targetCount = expectedCounts[name];
  const astmPaths = (astm.blocks.get(blockName) ?? []).filter((p) => p.closed && p.pts.length === targetCount - 1);
  const aamaPaths = (aama.blocks.get(blockName) ?? []).filter((p) => p.closed && p.pts.length === targetCount - 1);
  assert(astmPaths.length && aamaPaths.length, `one-vertex-short contours for ${name}`);
  const referenceCenter = center(astmPaths[0]);
  const inCut = source.source.filter((p) => p.layer === "CUT" && p.closed && p.pts.length === targetCount)
    .sort((a, b) => Math.hypot(center(a).x - referenceCenter.x, center(a).y - referenceCenter.y) - Math.hypot(center(b).x - referenceCenter.x, center(b).y - referenceCenter.y))[0];
  assert(inCut, `source CUT for ${name}`);
  const astmCuts = astmPaths;
  const aamaCuts = aamaPaths;
  const measured = s609Roundtrip.results.find(({ piece }) => piece === name)?.cut;
  assert(measured && !measured.passes, `S609 measured failure witness for ${name}`);
  return { piece: name, sourceVertices: inCut.pts.length, sourceHeadTail: [inCut.pts[0], inCut.pts.at(-1)],
    s609FailureWitness: { direction: measured.direction, sourceSegmentIndex: measured.segmentIndex, sourceSampleFraction: measured.sampleFraction, sourcePointCm: measured.point, conservativeUpperBoundCm: measured.conservativeUpperBoundCm },
    astmCandidateVertexCounts: (astm.blocks.get(blockName) ?? []).filter((p) => p.closed).map(({ layer, pts }) => ({ layer, vertices: pts.length })),
    aamaCandidateVertexCounts: (aama.blocks.get(blockName) ?? []).filter((p) => p.closed).map(({ layer, pts }) => ({ layer, vertices: pts.length })),
    matchingCountAstM: astmCuts.length, matchingCountAama: aamaCuts.length,
    astmMatchingVertexSets: astmCuts.map(({ layer, pts }) => ({ layer, first: pts[0], last: pts.at(-1) })),
    aamaMatchingVertexSets: aamaCuts.map(({ layer, pts }) => ({ layer, first: pts[0], last: pts.at(-1) })) };
});
assert.equal(rows.length, 5);
const report = {
  method: "Hash-pinned R12 POLYLINE source and actual CLO output block audit. Output instances are transformed by their INSERT transforms. Piece/block indices come from the prior exact-SEW binding. This report checks the repeated missing-vertex structure; it does not assign numeric output layers manufacturing meanings or infer a CLO internal stage.",
  source: { path: sourcePath, sha256: sha(sourceBytes), bytes: sourceBytes.length, contours: source.source.length, cutContours: source.source.filter((p) => p.layer === "CUT").length },
  aamaOutput: { path: aamaPath, sha256: sha(aamaBytes), bytes: aamaBytes.length, blocks: aama.blocks.size },
  astmOutput: { path: astmPath, sha256: sha(astmBytes), bytes: astmBytes.length, blocks: astm.blocks.size },
  findings: rows,
  conclusion: "The same five piece roles have source counts 33/54/54/44/44 and a one-vertex-short closed outline in both earlier CLO DXF-AAMA output and the new DXF-ASTM output. The tested pair changed two variables together (S536 R2000 LWPOLYLINE source plus AAMA export; S609 R12 POLYLINE source plus ASTM export), so neither variable's independent effect is isolated; their combined change did not remove the defect. S609's recorded import/export optimization and removal options were off. The repeated evidence localizes a change to the tested CLO exchange path but cannot determine whether it occurs during import, internal pattern normalization, or export."
};
await mkdir(`${base}/S610-astm-vertex-loss-source-diagnosis/Evidence`, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, sourceContours: report.source.contours, aamaBlocks: report.aamaOutput.blocks, astmBlocks: report.astmOutput.blocks, missingVertexPieces: rows.map(({ piece, matchingCountAstM, matchingCountAama }) => ({ piece, matchingCountAstM, matchingCountAama })) }, null, 2));
