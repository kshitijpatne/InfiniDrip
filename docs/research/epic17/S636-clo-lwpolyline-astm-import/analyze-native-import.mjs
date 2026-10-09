import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import";
const sourcePath = `${root}/Input/polo-standard-m-cm-units-header.dxf`;
const derivativePath = `${root}/Input/polo-cm-header-cut-lwpolyline.dxf`;
const manifestPath = `${root}/Evidence/input-manifest.json`;
const nativePath = `${root}/Evidence/native-input-information.json`;
const nativeProjectPath = `${root}/Evidence/s636-lwpolyline-astm-import.zprj`;
const priorAnalysisPath = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Evidence/Analysis/S617-header-fine-roundtrip-analysis.json";
const evidenceRoot = `${root}/Evidence`;
const reportPath = `${evidenceRoot}/native-cut-contour-comparison.json`;
const visualRoot = `${evidenceRoot}/Rendered-CUT-comparison`;

const hashes = {
  source: "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5",
  derivative: "606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360",
  nativeProject: "E206A23C3158B24751F91664D5749DD01D3834EB31FC45085A7B90337BF9B008",
};
const toleranceCm = 0.001;
const nativeScale = 10; // DXF cm to CLO API mm, corroborated by exact controls.
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length % 2, 0, "DXF group/value pairs must be complete");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trimEnd()]);
  assert(pairs.every(([group]) => Number.isInteger(group)), "DXF contains an invalid group code");
  const sections = new Map();
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = pairs[i + 1]?.[1];
      sections.set(section, []);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      sections.get(section).push(pairs.slice(start, i));
      i--;
    }
  }
  const entities = sections.get("ENTITIES") ?? [];
  const value = (record, code) => record.find(([group]) => group === code)?.[1];
  const cuts = [];
  for (let i = 0; i < entities.length; i++) {
    const record = entities[i];
    if (value(record, 8) !== "CUT" || !["POLYLINE", "LWPOLYLINE"].includes(record[0]?.[1])) continue;
    const vertices = [];
    if (record[0][1] === "LWPOLYLINE") {
      for (let j = 1; j < record.length; j++) {
        if (record[j][0] === 10) vertices.push({ x: Number(record[j][1]), y: NaN });
        if (record[j][0] === 20 && vertices.length) vertices.at(-1).y = Number(record[j][1]);
      }
    } else {
      for (let j = i + 1; j < entities.length && entities[j][0]?.[1] !== "SEQEND"; j++) {
        if (entities[j][0]?.[1] !== "VERTEX") continue;
        vertices.push({ x: Number(value(entities[j], 10)), y: Number(value(entities[j], 20)) });
      }
    }
    cuts.push({ entityOrder: i, entityType: record[0][1], closed: Boolean(Number(value(record, 70) ?? 0) & 1), vertices });
  }
  return { cuts };
}

function closestCyclic(source, candidate, scale) {
  if (source.length !== candidate.length) return null;
  let best;
  for (const direction of [1, -1]) for (let offset = 0; offset < candidate.length; offset++) {
    const deltas = source.map((point, i) => {
      const other = candidate[(offset + direction * i + candidate.length * 2) % candidate.length];
      return Math.hypot(point.x * scale - other.x, point.y * scale - other.y);
    });
    const result = { direction, offset, maxDeltaMm: Math.max(...deltas), rmsDeltaMm: Math.sqrt(deltas.reduce((sum, delta) => sum + delta ** 2, 0) / deltas.length) };
    if (!best || result.maxDeltaMm < best.maxDeltaMm) best = result;
  }
  return best;
}

function closestWithOneOmittedSourceVertex(source, candidate, scale) {
  if (source.length !== candidate.length + 1) return null;
  let best;
  for (let omitted = 0; omitted < source.length; omitted++) {
    const retained = source.filter((_, index) => index !== omitted);
    const result = closestCyclic(retained, candidate, scale);
    if (result && (!best || result.maxDeltaMm < best.maxDeltaMm)) best = { ...result, omittedSourceVertex: omitted };
  }
  return best;
}

function pointToSegmentDistance(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function pathData(points, map) {
  return points.map((p, i) => `${i ? "L" : "M"}${map.x(p.x).toFixed(2)},${map.y(p.y).toFixed(2)}`).join(" ");
}

const [sourceBytes, derivativeBytes, nativeBytes, projectBytes, priorBytes, manifestBytes] = await Promise.all([
  readFile(sourcePath), readFile(derivativePath), readFile(nativePath), readFile(nativeProjectPath), readFile(priorAnalysisPath), readFile(manifestPath),
]);
assert.equal(sha(sourceBytes), hashes.source, "S617 source fixture changed");
assert.equal(sha(derivativeBytes), hashes.derivative, "S636 derivative changed");
assert.equal(sha(projectBytes), hashes.nativeProject, "saved CLO import project changed");
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const native = JSON.parse(nativeBytes.toString("utf8"));
const prior = JSON.parse(priorBytes.toString("utf8"));
assert.equal(manifest.sha256, hashes.derivative);
assert.equal(native.intended_project_sha256, hashes.nativeProject);
assert.equal(native.pattern_count, 9, "CLO did not return nine pattern identities");
assert.equal(native.errors.length, 0, "CLO native geometry query returned errors");
assert.equal(native.patterns.length, 9);
assert(native.patterns.every((pattern, index) => pattern.pattern_name === String(index)), "CLO pattern identities/order changed");

const source = parseDxf(sourceBytes).cuts;
const derivative = parseDxf(derivativeBytes).cuts;
assert.equal(source.length, 9, "expected nine source CUT contours");
assert.equal(derivative.length, 9, "expected nine derivative CUT contours");
assert(derivative.every((contour) => contour.entityType === "LWPOLYLINE" && contour.closed));
assert.deepEqual(derivative.map((contour) => contour.vertices), source.map((contour) => contour.vertices), "S636 derivative changed source CUT points");
assert.equal(prior.results.length, 9, "prior receiver analysis does not define nine piece identities");

const importedShapes = native.patterns.flatMap((pattern) => {
  const children = pattern.input_information?.["Pattern InputInformation"]?.[0]?.["Children Information"] ?? [];
  return children.slice(1).map((shape) => ({
    patternIndex: pattern.pattern_index,
    patternName: pattern.pattern_name,
    shapeIndex: Number(shape["Shape index"]),
    shapeType: shape["Shape type"],
    points: (shape.PointList ?? []).filter((point) => point["Point positionX"] != null).map((point) => ({ x: Number(point["Point positionX"]), y: Number(point["Point positionY"]) })),
  }));
});

const results = source.map((contour, index) => {
  assert(contour.closed, `source CUT ${index} is not closed`);
  const sameIdentity = importedShapes.filter((shape) => shape.patternIndex === index);
  const candidates = sameIdentity.map((shape) => {
    const exact = closestCyclic(contour.vertices, shape.points, nativeScale);
    const oneMissing = closestWithOneOmittedSourceVertex(contour.vertices, shape.points, nativeScale);
    return { patternIndex: shape.patternIndex, patternName: shape.patternName, shapeIndex: shape.shapeIndex, shapeType: shape.shapeType, pointCount: shape.points.length, points: shape.points, exact, oneMissing };
  });
  const exactMatches = candidates.filter((candidate) => candidate.exact).sort((a, b) => a.exact.maxDeltaMm - b.exact.maxDeltaMm);
  const reducedMatches = candidates.filter((candidate) => candidate.oneMissing).sort((a, b) => a.oneMissing.maxDeltaMm - b.oneMissing.maxDeltaMm);
  const exactPass = exactMatches.some((candidate) => candidate.exact.maxDeltaMm <= toleranceCm * 10);
  const reduced = reducedMatches[0];
  let missingVertex;
  if (!exactPass && reduced && reduced.oneMissing.maxDeltaMm <= toleranceCm * 10) {
    const i = reduced.oneMissing.omittedSourceVertex;
    const point = contour.vertices[i];
    const previous = contour.vertices[(i + contour.vertices.length - 1) % contour.vertices.length];
    const next = contour.vertices[(i + 1) % contour.vertices.length];
    missingVertex = {
      sourceVertexIndex: i,
      coordinateCm: point,
      previousSourceStepCm: Math.hypot(point.x - previous.x, point.y - previous.y),
      nextSourceStepCm: Math.hypot(next.x - point.x, next.y - point.y),
      mergedChordDeviationCm: pointToSegmentDistance(point, previous, next),
      importedShapeIndex: reduced.shapeIndex,
      maxRetainedVertexDeltaMm: reduced.oneMissing.maxDeltaMm,
      retainedVertexPassesGate: reduced.oneMissing.maxDeltaMm <= toleranceCm * 10,
      matchedDirection: reduced.oneMissing.direction,
      matchedOffset: reduced.oneMissing.offset,
    };
  }
  const status = exactPass ? "PASS_EXACT_CUT_CONTOUR" : missingVertex ? "FAIL_ONE_SOURCE_VERTEX_OMITTED" : "FAIL_NO_UNAMBIGUOUS_NATIVE_MATCH";
  return {
    cutOrdinal: index,
    sourceDxfEntityOrder: contour.entityOrder,
    piece: prior.results[index].piece,
    receiverBlock: prior.results[index].receiverBlock,
    sourceVertexCount: contour.vertices.length,
    nativeIdentity: { patternIndex: sameIdentity[0]?.patternIndex, patternName: sameIdentity[0]?.patternName, shapeCount: sameIdentity.length },
    status,
    exactCandidates: exactMatches.map(({ shapeIndex, pointCount, exact }) => ({ shapeIndex, pointCount, ...exact })),
    bestReducedCandidate: reduced ? { shapeIndex: reduced.shapeIndex, pointCount: reduced.pointCount, ...reduced.oneMissing } : null,
    missingVertex,
    _render: { source: contour.vertices, imported: exactPass ? exactMatches[0].points : reduced?.points ?? [] },
  };
});

const report = {
  slice: "S636",
  claim: "CLO 2026.1.310 Standard-DXF native input geometry was compared to the hash-pinned source CUT entities before export.",
  method: "The nine source CUT entity point arrays were first proven identical to the nine LWPOLYLINE derivative arrays. CLO GetPatternInputInformation point lists were then matched only within the corresponding numeric pattern identity, cyclically in both windings, after cm-to-mm conversion. Four exact controls calibrate scale and orientation; reduced matches identify one omitted source vertex without treating it as a pass.",
  import: {
    receiver: "CLO Standalone OnlineAuth 2026.1.310 (r58944)",
    mode: "DXF-ASTM",
    settings: "S636 live dialog: Add, DXF-ASTM, centimeter, 100%, do not rotate, maintain original grain angle; import pattern annotation, auto-trace, swap and auto-distribute off; notch import Both at Ratio; optimize and remove non-grading points off; draw curve points on. CLO displayed its notice that the DXF has no seam allowances and imports in Custom mode to preserve original shape.",
    project: { path: native.intended_project, sha256: hashes.nativeProject, bytes: projectBytes.length },
    nativeQuery: { path: nativePath, sha256: sha(nativeBytes), patternCount: native.pattern_count, errors: native.errors },
  },
  fixtures: {
    source: { path: sourcePath, sha256: sha(sourceBytes), bytes: sourceBytes.length },
    derivative: { path: derivativePath, sha256: sha(derivativeBytes), bytes: derivativeBytes.length },
    derivativeManifest: { path: manifestPath, sha256: sha(manifestBytes) },
    priorPieceIdentityReference: { path: priorAnalysisPath, sha256: sha(priorBytes) },
  },
  toleranceCm,
  results: results.map(({ _render, ...result }) => result),
  verdict: results.every((result) => result.status === "PASS_EXACT_CUT_CONTOUR") ? "PASS_EXPORT_BRANCH_ALLOWED" : "FAIL_STOP_BEFORE_EXPORT",
  exportPerformed: false,
  limitations: [
    "CLO API labels child shapes as Base Line and does not document which shape field is the physical cut outline. Correspondence is established from exact source coordinates, point order, and the numeric imported piece identity, not from that label.",
    "This controlled trial only changes CUT entity encoding. It does not diagnose CLO's internal reason for omitted points or establish standards conformance.",
  ],
};
await mkdir(visualRoot, { recursive: true });
for (const result of results.filter((item) => item.status !== "PASS_EXACT_CUT_CONTOUR")) {
  const { source: sourcePoints, imported } = result._render;
  const omittedIndex = result.missingVertex?.sourceVertexIndex;
  const previousIndex = (omittedIndex + sourcePoints.length - 1) % sourcePoints.length;
  const nextIndex = (omittedIndex + 1) % sourcePoints.length;
  const p = sourcePoints[omittedIndex], prev = sourcePoints[previousIndex], next = sourcePoints[nextIndex];
  const width = 1000, height = 440, left = 90, top = 72, plotW = 820, plotH = 300;
  const zoomCm = 0.16, scale = Math.min(plotW / (2 * zoomCm), plotH / (2 * zoomCm));
  const map = { x: (x) => left + plotW / 2 + (x - p.x) * scale, y: (y) => top + plotH / 2 - (y - p.y) * scale };
  const sourceSlice = [prev, p, next];
  const match = result.bestReducedCandidate;
  const retainedIndex = (sourceIndex) => sourcePoints.slice(0, sourceIndex).filter((_, i) => i !== omittedIndex).length;
  const importedAt = (sourceIndex) => imported[(match.offset + match.direction * retainedIndex(sourceIndex) + imported.length * 2) % imported.length];
  const nativeSlice = [importedAt(previousIndex), importedAt(nextIndex)];
  const row = `${String(result.cutOrdinal).padStart(2, "0")}-${result.piece.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/><text x="36" y="36" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="#17202a">S636 · ${result.piece} CUT · imported native geometry</text><text x="36" y="62" font-family="Arial,sans-serif" font-size="15" fill="#46515c">${result.receiverBlock} → CLO piece ${result.nativeIdentity.patternName} · source point ${omittedIndex} absent · local detail (cm)</text><path d="${pathData(sourceSlice, map)}" fill="none" stroke="#1665b5" stroke-width="4" stroke-linejoin="round"/><path d="${pathData(nativeSlice, map)}" fill="none" stroke="#d13f3f" stroke-width="2.2" stroke-dasharray="8 6" stroke-linejoin="round"/><circle cx="${map.x(p.x)}" cy="${map.y(p.y)}" r="10" fill="#fff" stroke="#dc2626" stroke-width="4"/><circle cx="${map.x(p.x)}" cy="${map.y(p.y)}" r="2.4" fill="#dc2626"/><text x="${map.x(p.x)+14}" y="${map.y(p.y)-12}" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#a61b1b">source P${omittedIndex}</text><circle cx="${map.x(prev.x)}" cy="${map.y(prev.y)}" r="4" fill="#1665b5"/><circle cx="${map.x(next.x)}" cy="${map.y(next.y)}" r="4" fill="#1665b5"/><line x1="36" y1="398" x2="76" y2="398" stroke="#1665b5" stroke-width="4"/><text x="84" y="404" font-family="Arial,sans-serif" font-size="15" fill="#263238">hash-pinned source CUT polyline</text><line x1="388" y1="398" x2="428" y2="398" stroke="#d13f3f" stroke-width="2.2" stroke-dasharray="8 6"/><text x="436" y="404" font-family="Arial,sans-serif" font-size="15" fill="#263238">actual CLO native chord</text><text x="36" y="430" font-family="Arial,sans-serif" font-size="13" fill="#46515c">Retained-vertex max error ${(result.missingVertex.maxRetainedVertexDeltaMm / 10).toFixed(8)} cm (gate ${toleranceCm} cm) · omitted-point chord deviation ${result.missingVertex.mergedChordDeviationCm.toFixed(6)} cm · view magnified for inspection only</text></svg>`;
  await writeFile(`${visualRoot}/${row}.svg`, svg, "utf8");
}
const { readdir, stat } = await import("node:fs/promises");
const overlayFiles = await readdir(visualRoot);
const renderedArtifacts = [];
for (const name of overlayFiles) {
  if (!/\.(svg|png)$/u.test(name)) continue;
  const path = `${visualRoot}/${name}`;
  const bytes = await readFile(path);
  renderedArtifacts.push({ path, sha256: sha(bytes), bytes: bytes.length });
}
const cloScreenshotPath = `${evidenceRoot}/clo-astm-import-overview.png`;
const cloScreenshot = await readFile(cloScreenshotPath);
report.renderedEvidence = {
  review: "Five actual CLO native CUT omissions are annotated against the exact source point neighborhoods. The overview screenshot shows all nine imported pieces in the live CLO Standard-DXF scene.",
  artifacts: [{ path: cloScreenshotPath, sha256: sha(cloScreenshot), bytes: cloScreenshot.length, purpose: "actual CLO DXF-ASTM imported-scene overview" }, ...renderedArtifacts],
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ reportPath, verdict: report.verdict, exportPerformed: report.exportPerformed, pointResults: report.results.map(({ piece, sourceVertexCount, nativeIdentity, status, missingVertex }) => ({ piece, sourceVertexCount, pattern: nativeIdentity.patternName, status, missingVertex })), renderedOverlays: report.renderedOverlays }, null, 2));
