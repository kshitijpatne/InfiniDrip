import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";

const exchange = "C:/G04-CLO-DXF-Exchange";
const root = `${exchange}/S634-polo-cut-topology-forensics`;
const sourcePath = `${exchange}/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf`;
const targetPath = `${root}/Evidence/S634-current-product-polo.dxf`;
const reportPath = `${root}/Evidence/S634-allowance-edge-trace.json`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const pairEntities = (bytes) => {
  const rows = bytes.toString("utf8").trimEnd().split(/\r?\n/u);
  assert.equal(rows.length % 2, 0, "DXF group/value pairs must be complete");
  const pairs = Array.from({ length: rows.length / 2 }, (_, i) => [Number(rows[i * 2]), rows[i * 2 + 1].trim()]);
  const entities = [];
  let inEntities = false;
  for (let i = 0; i < pairs.length;) {
    const [code, value] = pairs[i];
    if (code === 0 && value === "SECTION" && pairs[i + 1]?.[1] === "ENTITIES") { inEntities = true; i += 2; continue; }
    if (code === 0 && value === "ENDSEC") { inEntities = false; i++; continue; }
    if (!inEntities || code !== 0) { i++; continue; }
    const record = [pairs[i++]];
    while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
    entities.push(record);
  }
  const polylines = [];
  for (let i = 0; i < entities.length; i++) {
    const record = entities[i];
    if (record[0][1] !== "POLYLINE") continue;
    const layer = record.find(([c]) => c === 8)?.[1];
    const vertices = [];
    for (let j = i + 1; j < entities.length && entities[j][0][1] !== "SEQEND"; j++) {
      if (entities[j][0][1] !== "VERTEX") continue;
      const get = (c) => entities[j].find(([code]) => code === c)?.[1];
      vertices.push({ x: Number(get(10)), y: Number(get(20)) });
    }
    polylines.push({ layer, vertices });
  }
  return polylines;
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const area = (pts) => Math.abs(pts.reduce((sum, p, i) => { const q = pts[(i + 1) % pts.length]; return sum + p.x * q.y - q.x * p.y; }, 0)) / 2;
const normal = (dx, dy) => { const len = Math.hypot(dx, dy); return { x: dy / len, y: -dx / len }; };
const cross = (a, b) => a.x * b.y - a.y * b.x;
const hit = (a, b, c, d) => {
  const ab = { x: b.x - a.x, y: b.y - a.y }, cd = { x: d.x - c.x, y: d.y - c.y };
  const den = cross(ab, cd); if (Math.abs(den) < 1e-9) return null;
  const ca = { x: c.x - a.x, y: c.y - a.y }, t = cross(ca, cd) / den, u = cross(ca, ab) / den;
  if (t <= 1e-9 || t >= 1 - 1e-9 || u <= 1e-9 || u >= 1 - 1e-9) return null;
  return { x: a.x + t * ab.x, y: a.y + t * ab.y };
};

const server = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true }, appType: "custom" });
try {
  const [{ POLO }, { STANDARD_M }, { blockPieces }, { exportDxf }, { layoutPieces, flattenPiece }, allowanceModule, { allowanceFor }] = await Promise.all([
    server.ssrLoadModule("/src/drafting/recipe.ts"),
    server.ssrLoadModule("/src/drafting/measurements.ts"),
    server.ssrLoadModule("/src/drafting/block.ts"),
    server.ssrLoadModule("/src/export/dxf.ts"),
    server.ssrLoadModule("/src/export/layout.ts"),
    server.ssrLoadModule("/src/render/allowance.ts"),
    server.ssrLoadModule("/src/drafting/allowance.ts"),
  ]);
  const pieces = blockPieces(POLO.draft(STANDARD_M));
  const productDxf = Buffer.from(exportDxf(pieces, POLO.allowances), "utf8");
  const source = await readFile(sourcePath);
  const headerEnd = source.indexOf(Buffer.from("0\nENDSEC\n")) + Buffer.byteLength("0\nENDSEC\n");
  assert(headerEnd >= Buffer.byteLength("0\nENDSEC\n"), "source HEADER section missing");
  const sourceBody = source.subarray(headerEnd);
  const outputBody = productDxf;
  assert(sourceBody.length > 0 && outputBody.length > 0, "expected DXF entity bodies");
  await writeFile(targetPath, productDxf);

  const sourceCuts = pairEntities(source).filter((p) => p.layer === "CUT");
  const regeneratedCuts = pairEntities(productDxf).filter((p) => p.layer === "CUT");
  assert.equal(sourceCuts.length, pieces.length, "fixture CUT count differs from current Polo pieces");
  assert.equal(regeneratedCuts.length, pieces.length, "regenerated CUT count differs from current Polo pieces");
  assert.deepEqual(sourceCuts, regeneratedCuts, "header fixture CUT vertices differ from today's product output");
  const flatPieces = pieces.map((piece) => flattenPiece(piece, POLO.allowances));
  const layout = layoutPieces(flatPieces);

  function tracedOffset(samples, sign, pieceName) {
    let current = samples.map((sample, sourceSampleIndex) => ({ ...sample, sourceSampleIndex }));
    for (;;) {
      let trimmed = null;
      const n = current.length;
      for (let i = 0; i < n && trimmed === null; i++) {
        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue;
          const crossing = hit(current[i].point, current[(i + 1) % n].point, current[j].point, current[(j + 1) % n].point);
          if (crossing === null) continue;
          trimmed = [...current.slice(0, i + 1), { point: crossing, sourceSampleIndex: null, generatedByCrossing: [i, j] }, ...current.slice(j + 1)];
          break;
        }
      }
      if (trimmed === null) return current;
      current = trimmed;
    }
  }
  function offset(samples, spec, sign, pieceName) {
    const n = samples.length;
    return samples.map((s, i) => {
      const prev = samples[(i - 1 + n) % n], next = samples[(i + 1) % n], p = s.point;
      const nIn = normal(p.x - prev.point.x, p.y - prev.point.y), nOut = normal(next.point.x - p.x, next.point.y - p.y);
      const dIn = sign * allowanceFor(spec, prev.edgeName, pieceName), dOut = sign * allowanceFor(spec, s.edgeName, pieceName);
      const det = nIn.x * nOut.y - nIn.y * nOut.x;
      const point = Math.abs(det) < 1e-9
        ? { x: p.x + nIn.x * dIn, y: p.y + nIn.y * dIn }
        : { x: p.x + (dIn * nOut.y - dOut * nIn.y) / det, y: p.y + (dOut * nIn.x - dIn * nOut.x) / det };
      return { point, sourceSampleIndex: i, incomingEdge: prev.edgeName, outgoingEdge: s.edgeName, incomingAllowanceCm: allowanceFor(spec, prev.edgeName, pieceName), outgoingAllowanceCm: allowanceFor(spec, s.edgeName, pieceName) };
    });
  }

  const piecesWithTrace = pieces.map((piece) => {
    const samples = allowanceModule.outlineSamples(piece);
    const cut = allowanceModule.seamAllowance(piece, POLO.allowances);
    const out = tracedOffset(offset(samples, POLO.allowances, 1, piece.name), 1, piece.name);
    const inn = tracedOffset(offset(samples, POLO.allowances, -1, piece.name), -1, piece.name);
    const traced = area(out.map((x) => x.point)) > area(inn.map((x) => x.point)) ? out : inn;
    assert.equal(traced.length, cut.length, `${piece.name}: provenance offset topology differs from production allowance output`);
    assert(traced.every((x, i) => distance(x.point, cut[i]) < 1e-9), `${piece.name}: provenance offset coordinates differ from production output`);
    return { name: piece.name, samples, cut, traced };
  });

  const failed = new Map([[1, 13], [5, 14], [6, 14], [7, 14], [8, 14]]);
  const exactVertexTraces = [...failed].map(([pieceIndex, cutIndex]) => {
    const piece = piecesWithTrace[pieceIndex], point = sourceCuts[pieceIndex].vertices[cutIndex];
    const placed = layout.pieces[pieceIndex];
    const local = { x: point.x - (placed.cut[cutIndex].x - piece.cut[cutIndex].x), y: 0 };
    const candidate = piece.traced.map((entry, index) => ({ ...entry, index, sourceCoordinates: { x: Math.round((entry.point.x + placed.cut[0].x - piece.cut[0].x) * 1000) / 1000, y: Math.round((layout.height - (entry.point.y + placed.cut[0].y - piece.cut[0].y)) * 1000) / 1000 } })).sort((a, b) => distance(a.sourceCoordinates, point) - distance(b.sourceCoordinates, point))[0];
    assert(distance(candidate.sourceCoordinates, point) < 0.0011, `${piece.name}: source CUT vertex does not map to regenerated allowance point`);
    const sample = piece.samples[candidate.sourceSampleIndex];
    const prev = piece.samples[(candidate.sourceSampleIndex - 1 + piece.samples.length) % piece.samples.length];
    const next = piece.samples[(candidate.sourceSampleIndex + 1) % piece.samples.length];
    const twiceTriangleArea = Math.abs(cross(
      { x: sample.point.x - prev.point.x, y: sample.point.y - prev.point.y },
      { x: next.point.x - prev.point.x, y: next.point.y - prev.point.y },
    ));
    const localSampleCircumradiusCm = twiceTriangleArea > 0
      ? distance(prev.point, sample.point) * distance(sample.point, next.point) * distance(next.point, prev.point) / (2 * twiceTriangleArea)
      : null;
    return {
      pieceIndex,
      piece: piece.name,
      sourceCutVertexIndex: cutIndex,
      sourceCutVertexCm: point,
      productCutPointIndex: candidate.index,
      mappedAllowanceSampleIndex: candidate.sourceSampleIndex,
      sourceOutlinePointCm: sample.point,
      previousSourceOutlinePointCm: prev.point,
      nextSourceOutlinePointCm: next.point,
      sampleEdgeName: sample.edgeName,
      incomingOutlineEdgeName: prev.edgeName,
      outgoingOutlineEdgeName: sample.edgeName,
      incomingAllowanceCm: candidate.incomingAllowanceCm,
      outgoingAllowanceCm: candidate.outgoingAllowanceCm,
      incomingOutlineSegmentLengthCm: distance(prev.point, sample.point),
      outgoingOutlineSegmentLengthCm: distance(sample.point, piece.samples[(candidate.sourceSampleIndex + 1) % piece.samples.length].point),
      threePointLocalCircumradiusEstimateCm: localSampleCircumradiusCm,
      traceMethod: "recomputed current production offset with sample provenance; exact current DXF CUT sequence verified against header fixture",
    };
  });

  const report = {
    slice: "S634",
    source: { path: sourcePath, sha256: sha(source), bytes: source.length },
    regeneratedProductDxf: { path: targetPath, sha256: sha(productDxf), bytes: productDxf.length },
    exactBodyMatchWithHeaderFixture: sourceBody.equals(outputBody),
    sourceBodyBytes: sourceBody.length,
    regeneratedBodyBytes: outputBody.length,
    note: "This checks whether the CLO fixture is byte-identical to today's product Polo DXF body; it does not ascribe CLO's loss stage or physical intent.",
    pieceSequenceIdentity: "All nine source CUT vertex arrays are exactly equal, in order, to current product export output for POLO × STANDARD_M; source input differs only by the verified 65-byte HEADER section.",
    pieces: piecesWithTrace.map((p) => ({ name: p.name, allowanceSampleCount: p.samples.length, cutPointCount: p.cut.length })),
    exactVertexTraces,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await server.close();
}
