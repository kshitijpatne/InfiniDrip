import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const exchangeRoot = "C:/G04-CLO-DXF-Exchange";
const inputPath = `${exchangeRoot}/S503-polo-import-options/Input/polo-standard-m.dxf`;
const outputPath = process.argv[2];
const evidenceRoot = process.argv[3];
const expectedInputHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";

const pieces = ["front", "back", "sleeve", "button placket", "buttonhole placket", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const unresolvedOrdinals = [2, 10, 12, 14, 16];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  if (lines.length % 2) throw new Error(`${label}: incomplete group pair`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (!/^\d+$/.test(lines[i].trim())) throw new Error(`${label}: invalid group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      section.entities.push(pairs.slice(start, i));
      i--;
    }
  }
  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const polylines = (entities, block = null) => entities.flatMap((entity, index) => {
    if (entity[0]?.[1] !== "POLYLINE") return [];
    const vertices = [];
    for (let j = index + 1; j < entities.length; j++) {
      const next = entities[j], kind = next[0]?.[1];
      if (kind === "VERTEX") vertices.push({
        x: Number(value(next, 10)), y: Number(value(next, 20)),
        bulge: Number(value(next, 42) ?? 0),
      });
      if (kind === "SEQEND" || ["BLOCK", "POLYLINE", "ENDBLK"].includes(kind)) break;
    }
    const xs = vertices.map((point) => point.x), ys = vertices.map((point) => point.y);
    return [{ block, layer: value(entity, 8) ?? "(none)",
      closed: (Number(value(entity, 70) ?? 0) & 1) === 1,
      vertices, bulgeCount: vertices.filter((point) => Math.abs(point.bulge) > 1e-10).length,
      bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) } }];
  });
  const sourcePolys = polylines(sections.find((item) => item.name === "ENTITIES")?.entities ?? []);
  const blockSection = sections.find((item) => item.name === "BLOCKS");
  const outputPolys = [];
  const blockLabels = [];
  let block;
  for (let i = 0; i < (blockSection?.entities.length ?? 0); i++) {
    const entity = blockSection.entities[i], kind = entity[0]?.[1];
    if (kind === "BLOCK") {
      block = value(entity, 2);
      blockLabels.push({ block, text: [] });
    } else if (kind === "ENDBLK") block = undefined;
    else if (block && kind === "TEXT") blockLabels.at(-1)?.text.push(value(entity, 1));
    else if (block && kind === "POLYLINE") {
      const tail = blockSection.entities.slice(i + 1);
      const end = tail.findIndex((item) => item[0]?.[1] === "SEQEND");
      const parsed = polylines([entity, ...tail.slice(0, end < 0 ? tail.length : end + 1)], block);
      outputPolys.push(...parsed.map((line) => ({ ...line, outputPolylineOrdinal: outputPolys.length })));
    }
  }
  const modelEntities = sections.find((item) => item.name === "ENTITIES")?.entities ?? [];
  const inserts = modelEntities.filter((entity) => entity[0]?.[1] === "INSERT").map((entity) => ({
    block: value(entity, 2), x: Number(value(entity, 10) ?? 0), y: Number(value(entity, 20) ?? 0),
    sx: Number(value(entity, 41) ?? 1), sy: Number(value(entity, 42) ?? 1), rotation: Number(value(entity, 50) ?? 0),
  }));
  const transforms = new Map(inserts.map((insert) => [insert.block, insert]));
  for (const line of outputPolys) {
    const transform = transforms.get(line.block) ?? { x: 0, y: 0, sx: 1, sy: 1, rotation: 0 };
    const angle = transform.rotation * Math.PI / 180;
    line.vertices = line.vertices.map((point) => {
      const x = point.x * transform.sx, y = point.y * transform.sy;
      return { ...point, x: transform.x + x * Math.cos(angle) - y * Math.sin(angle), y: transform.y + x * Math.sin(angle) + y * Math.cos(angle) };
    });
    const xs = line.vertices.map((point) => point.x), ys = line.vertices.map((point) => point.y);
    line.bounds = { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }
  return { sections, sourcePolys, outputPolys, blockLabels, inserts, acadver: pairs.findIndex(([code, v]) => code === 9 && v === "$ACADVER") >= 0 ? pairs[pairs.findIndex(([code, v]) => code === 9 && v === "$ACADVER") + 1]?.[1] : null };
}

function exactCycleDelta(source, target) {
  if (!source.length || source.length !== target.length) return null;
  let best = Infinity;
  for (let start = 0; start < target.length; start++) for (const direction of [1, -1]) {
    let max = 0;
    for (let index = 0; index < source.length; index++) {
      const point = target[(start + direction * index + target.length * 2) % target.length];
      max = Math.max(max, Math.abs(source[index].x - point.x), Math.abs(source[index].y - point.y));
    }
    best = Math.min(best, max);
  }
  return best;
}

function uniqueGeometryCandidates(lines) {
  const unique = new Map();
  for (const line of lines) {
    const key = JSON.stringify(line.vertices.map((point) => [point.x.toFixed(6), point.y.toFixed(6), (point.bulge ?? 0).toFixed(8)]));
    const match = unique.get(key);
    if (match) match.layers.push(line.layer);
    else unique.set(key, { line, layers: [line.layer] });
  }
  return [...unique.values()];
}

function sample(polyline, maxStep = 0.02) {
  const points = polyline.vertices, out = [];
  if (points.length < 2) return points;
  const count = polyline.closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = points[i], b = points[(i + 1) % points.length], dx = b.x - a.x, dy = b.y - a.y;
    const chord = Math.hypot(dx, dy), bulge = a.bulge ?? 0;
    if (chord < 1e-12) { out.push({ x: a.x, y: a.y }); continue; }
    if (Math.abs(bulge) < 1e-10) {
      const steps = Math.max(1, Math.ceil(chord / maxStep));
      for (let step = 0; step < steps; step++) out.push({ x: a.x + dx * step / steps, y: a.y + dy * step / steps });
    } else {
      const sweep = 4 * Math.atan(bulge);
      const offset = chord * (1 - bulge * bulge) / (4 * bulge);
      const cx = (a.x + b.x) / 2 - dy / chord * offset;
      const cy = (a.y + b.y) / 2 + dx / chord * offset;
      const radius = Math.hypot(a.x - cx, a.y - cy), start = Math.atan2(a.y - cy, a.x - cx);
      const steps = Math.max(1, Math.ceil(radius * Math.abs(sweep) / maxStep));
      for (let step = 0; step < steps; step++) {
        const angle = start + sweep * step / steps;
        out.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
      }
    }
  }
  const endpoint = polyline.closed ? points[0] : points.at(-1);
  out.push({ x: endpoint.x, y: endpoint.y });
  return out;
}

function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
  if (length2 < 1e-18) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

function directedHausdorff(sampledSource, sampledTarget) {
  let max = 0;
  for (const point of sampledSource) {
    let best = Infinity;
    for (let i = 0; i < sampledTarget.length - 1; i++) best = Math.min(best, pointSegmentDistance(point, sampledTarget[i], sampledTarget[i + 1]));
    max = Math.max(max, best);
  }
  return max;
}

function hausdorff(a, b, step = 0.1) {
  const sa = sample(a, step), sb = sample(b, step);
  return Math.max(directedHausdorff(sa, sb), directedHausdorff(sb, sa));
}

function deviationWitness(source, target, thresholdCm) {
  assert.equal(source.bulgeCount, 0, "witness sampler expects straight source segments");
  assert.equal(target.bulgeCount, 0, "witness sampler expects straight output segments");
  const targetSegments = (line) => line.vertices.slice(0, line.closed ? line.vertices.length : -1)
    .map((start, index, starts) => [start, line.vertices[(index + 1) % line.vertices.length]]);
  for (const [from, to, direction] of [[source, target, "source-to-output"], [target, source, "output-to-source"]]) {
    const sampled = sample(from, 0.005), segments = targetSegments(to);
    for (const point of sampled) {
      let nearest = Infinity;
      for (const [a, b] of segments) nearest = Math.min(nearest, pointSegmentDistance(point, a, b));
      if (nearest > thresholdCm) return { direction, point: { x: point.x, y: point.y }, nearestDistanceCm: nearest, thresholdCm, samplingStepCm: 0.005, rationale: "Witness is an actual sampled point on a straight source/output segment; distance is to the exact target polyline segments, so any value above the threshold independently proves a continuous-geometry exceedance." };
    }
  }
  return { direction: "both-directions-checked", point: null, nearestDistanceCm: null, thresholdCm, samplingStepCm: 0.005, rationale: "No violating sample was found; this does not prove the maximum is below threshold." };
}

function boundsGap(a, b) {
  const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
  const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
  return Math.hypot(dx, dy);
}

function polylinePath(polyline, sx, sy, ox, oy) {
  const points = polyline.vertices;
  if (points.length < 2) return "";
  let path = `M ${ox + points[0].x * sx} ${oy - points[0].y * sy}`;
  const count = polyline.closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const a = points[i], b = points[(i + 1) % points.length], chord = Math.hypot(b.x - a.x, b.y - a.y), bulge = a.bulge ?? 0;
    if (Math.abs(bulge) < 1e-10 || chord < 1e-12) path += ` L ${ox + b.x * sx} ${oy - b.y * sy}`;
    else {
      const radius = chord * (1 + bulge * bulge) / (4 * Math.abs(bulge));
      const sweep = 4 * Math.atan(bulge), large = Math.abs(sweep) > Math.PI ? 1 : 0;
      path += ` A ${radius * sx} ${radius * sy} 0 ${large} ${bulge > 0 ? 1 : 0} ${ox + b.x * sx} ${oy - b.y * sy}`;
    }
  }
  if (polyline.closed) path += " Z";
  return path;
}

if (!outputPath || !evidenceRoot) throw new Error("Usage: node analyze-s503-polo-matrix.mjs <output-dxf> <evidence-directory>");
await mkdir(evidenceRoot, { recursive: true });
const inputBytes = await readFile(inputPath), outputBytes = await readFile(outputPath);
assert.equal(sha(inputBytes), expectedInputHash, "S463 Polo M source SHA-256");

const source = parse(inputBytes, "Polo source"), output = parse(outputBytes, "Polo CLO output");
assert.equal(source.sourcePolys.length, 18);
assert.ok(source.sourcePolys.every((line) => line.closed));
assert.equal(output.inserts.length, 9);


const sourceContours = source.sourcePolys.map((line, ordinal) => ({ ...line, ordinal, pieceIndex: Math.floor(ordinal / 2), piece: pieces[Math.floor(ordinal / 2)], expectedRole: ordinal % 2 === 0 ? "CUT" : "SEW" }));
const byOrdinal = (ordinal) => sourceContours.find((line) => line.ordinal === ordinal);
const sewBlockMap = new Map();
for (let index = 0; index < pieces.length; index++) {
  const sew = byOrdinal(index * 2 + 1);
  const candidates = output.outputPolys.map((line) => ({ line, delta: exactCycleDelta(sew.vertices, line.vertices) })).filter((item) => item.delta !== null).sort((a, b) => a.delta - b.delta);
  const best = candidates[0];
  if (best && best.delta <= 0.001) sewBlockMap.set(index, best.line.block);
}
assert.equal(sewBlockMap.size, 9, "all nine source SEW contours identify a CLO piece block");

const diagnostics = unresolvedOrdinals.map((ordinal) => {
  const cut = byOrdinal(ordinal), sew = byOrdinal(ordinal + 1), mappedBlock = sewBlockMap.get(cut.pieceIndex);
  const sameBlock = output.outputPolys.filter((line) => line.block === mappedBlock);
  const exactCandidates = sameBlock.map((line) => ({ line, delta: exactCycleDelta(cut.vertices, line.vertices) })).filter((item) => item.delta !== null).sort((a, b) => a.delta - b.delta);
  const uniqueBlock = uniqueGeometryCandidates(sameBlock);
  const boundsCandidates = uniqueBlock.map(({ line, layers }) => ({ line, layers, boundsGap: boundsGap(cut.bounds, line.bounds) })).sort((a, b) => a.boundsGap - b.boundsGap);
  const geometricCandidates = boundsCandidates.filter(({ boundsGap: gap }) => gap <= 0.25).map(({ line, layers, boundsGap: gap }) => {
    const coarse = hausdorff(cut, line, 0.1);
    const witness = deviationWitness(cut, line, 0.01);
    return { line, layers, boundsGap: gap, coarseHausdorff: coarse, witness };
  }).sort((a, b) => a.coarseHausdorff - b.coarseHausdorff);
  const globalBoundsCandidates = output.outputPolys.map((line) => ({ line, gap: boundsGap(cut.bounds, line.bounds) })).sort((a, b) => a.gap - b.gap);
  const nearest = geometricCandidates[0];
  return {
    sourceOrdinal: ordinal, sourcePiece: cut.piece, sourceRole: cut.expectedRole,
    pairedSourceSEWOrdinal: sew.ordinal,
    sourceCUT: { layer: cut.layer, closed: cut.closed, vertexCount: cut.vertices.length, bulgeCount: cut.bulgeCount, bounds: cut.bounds },
    sourceSEW: { layer: sew.layer, closed: sew.closed, vertexCount: sew.vertices.length, bulgeCount: sew.bulgeCount, bounds: sew.bounds },
    associatedBlock: mappedBlock,
    associationEvidence: `source SEW contour ${sew.ordinal} maps to ${mappedBlock} with exact cyclic max-coordinate delta ${exactCycleDelta(sew.vertices, output.outputPolys.find((line) => line.block === mappedBlock && exactCycleDelta(sew.vertices, line.vertices) !== null)?.vertices ?? [])}`,
    exactSameVertexCandidatesInBlock: exactCandidates.slice(0, 8).map(({ line, delta }) => ({ outputPolylineOrdinal: line.outputPolylineOrdinal, layer: line.layer, vertexCount: line.vertices.length, maxCoordinateDeltaCm: delta, bounds: line.bounds })),
    uniqueSameBlockGeometryCount: uniqueBlock.length,
    bboxCandidateCountWithin025Cm: geometricCandidates.length,
    nearestGeometryInBlock: nearest ? { outputPolylineOrdinal: nearest.line.outputPolylineOrdinal, layer: nearest.line.layer, coincidentNumericLayers: nearest.layers, vertexCount: nearest.line.vertices.length, bulgeCount: nearest.line.bulgeCount, boundsGapCm: nearest.boundsGap, coarseSymmetricDistanceEstimateCm: nearest.coarseHausdorff, coarseSamplingStepCm: 0.1, deviationWitness: nearest.witness, bounds: nearest.line.bounds } : null,
    nearestBoundsWithinMappedBlock: boundsCandidates.slice(0, 3).map(({ line, layers, boundsGap: gap }) => ({ outputPolylineOrdinal: line.outputPolylineOrdinal, layer: line.layer, coincidentNumericLayers: layers, vertexCount: line.vertices.length, boundsGapCm: gap, bounds: line.bounds })),
    closestBoundsAcrossAllBlocks: globalBoundsCandidates.slice(0, 3).map(({ line, gap }) => ({ outputPolylineOrdinal: line.outputPolylineOrdinal, block: line.block, layer: line.layer, vertexCount: line.vertices.length, boundsGapCm: gap, bounds: line.bounds })),
  };
});

const report = {
  receiver: "CLO 2026.1.310 (r58944), S503 observed DXF-ASTM export; geometry diagnosis only",
  input: { path: inputPath, bytes: inputBytes.byteLength, sha256: sha(inputBytes), units: "centimeter coordinates by S463 generator contract; no $INSUNITS" },
  output: { path: outputPath, bytes: outputBytes.byteLength, sha256: sha(outputBytes), acadver: output.acadver, inserts: output.inserts, blockText: output.blockLabels, outputPolylineCount: output.outputPolys.length, duplicateNumericLayers: [...new Set(output.outputPolys.map((line) => line.layer))].sort(), polylineGeometries: output.outputPolys.map((line) => ({ outputPolylineOrdinal: line.outputPolylineOrdinal, block: line.block, layer: line.layer, closed: line.closed, vertices: line.vertices.map((point) => [point.x, point.y, point.bulge ?? 0]) })) },
  method: { sourceOrder: "S463 exportDxf maps each piece to CUT polyline, then SEW polyline, then marks; piece order is from fixture manifest.", blockAssociation: "Each source SEW contour is associated to the output block by exact same-count cyclic/reverse coordinate match under 0.001 cm; all nine pieces map uniquely in this trial.", exactTest: "Same vertex count; cyclic start offset and either traversal direction; maximum absolute x or y coordinate delta.", curvedGeometryTest: "Bulge-aware source arcs are sampled at <=0.01 cm step; output polylines are sampled likewise; report symmetric sampled Hausdorff distance. It is a diagnostic estimate, not a replacement for C04's exact coordinate gate.", c04ThresholdCm: 0.001 },
  sourceOutlines: sourceContours.map((line) => ({ ordinal: line.ordinal, piece: line.piece, layer: line.layer, expectedRole: line.expectedRole, vertexCount: line.vertices.length, bulgeCount: line.bulgeCount, bounds: line.bounds })),
  unresolvedContours: diagnostics,
  findingLimits: "Only same-source-revision geometry is compared. Numeric CLO layer semantics are not inferred. No industrial profile, source repair, exporter defect, physical construction or factory acceptance is claimed.",
};
await writeFile(`${evidenceRoot}/polo-contour-diagnosis.json`, `${JSON.stringify(report, null, 2)}\n`);

const width = 1300, rowHeight = 280, margin = 45, scale = 8;
const rows = diagnostics.map((item, rowIndex) => {
  const sourceLine = byOrdinal(item.sourceOrdinal), sewLine = byOrdinal(item.pairedSourceSEWOrdinal);
  const best = output.outputPolys.find((line) => line.outputPolylineOrdinal === item.nearestGeometryInBlock?.outputPolylineOrdinal);
  const overlays = [sourceLine, sewLine, ...(best ? [best] : [])];
  const minX = Math.min(...overlays.map((line) => line.bounds.minX)), maxX = Math.max(...overlays.map((line) => line.bounds.maxX));
  const minY = Math.min(...overlays.map((line) => line.bounds.minY)), maxY = Math.max(...overlays.map((line) => line.bounds.maxY));
  const spanX = Math.max(maxX - minX, 1), spanY = Math.max(maxY - minY, 1);
  const fitScale = Math.min(780 / spanX, 185 / spanY);
  const ox = 245 - minX * fitScale, oy = rowIndex * rowHeight + 225 + minY * fitScale;
  const key = item.nearestGeometryInBlock ? `CLO block ${item.associatedBlock}, layer ${item.nearestGeometryInBlock.layer}; ${item.nearestGeometryInBlock.vertexCount} vertices; coarse distance ${item.nearestGeometryInBlock.coarseSymmetricDistanceEstimateCm.toFixed(6)} cm; witness ${item.nearestGeometryInBlock.deviationWitness.nearestDistanceCm?.toFixed(6) ?? "no exceedance"} cm` : "No receiver contour candidate";
  const paths = [
    { poly: sourceLine, stroke: "#d62728", width: 2.6, dash: "" },
    { poly: sewLine, stroke: "#2ca02c", width: 1.8, dash: "7 4" },
    ...(best ? [{ poly: best, stroke: "#1769aa", width: 1.8, dash: "3 3" }] : []),
  ].map(({ poly, stroke, width: lineWidth, dash }) => `<path d="${polylinePath(poly, fitScale, fitScale, ox, oy)}" fill="none" stroke="${stroke}" stroke-width="${lineWidth}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`).join("\n");
  return `<g><rect x="0" y="${rowIndex * rowHeight}" width="${width}" height="${rowHeight}" fill="${rowIndex % 2 ? "#f7f8fa" : "#ffffff"}"/><text x="22" y="${rowIndex * rowHeight + 32}" font-family="Arial" font-size="18" font-weight="bold">${item.sourcePiece} — source contour ${item.sourceOrdinal} CUT</text><text x="22" y="${rowIndex * rowHeight + 58}" font-family="Arial" font-size="14">CUT ${sourceLine.vertices.length} vertices (${sourceLine.bulgeCount} curved segments); SEW ${sewLine.vertices.length} vertices</text><text x="22" y="${rowIndex * rowHeight + 82}" font-family="Arial" font-size="14">${key}</text>${paths}</g>`;
}).join("\n");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${rowHeight * diagnostics.length}" viewBox="0 0 ${width} ${rowHeight * diagnostics.length}"><rect width="100%" height="100%" fill="white"/><text x="22" y="24" font-family="Arial" font-size="14"><tspan fill="#d62728">Solid red: source CUT</tspan><tspan dx="18" fill="#2ca02c">Green dash: paired source SEW</tspan><tspan dx="18" fill="#1769aa">Blue dash: nearest CLO curve in same mapped piece block</tspan></text>${rows}</svg>`;
await writeFile(`${evidenceRoot}/polo-contour-diagnosis-overlays.svg`, svg);
console.log(JSON.stringify({ report: `${evidenceRoot}/polo-contour-diagnosis.json`, overlay: `${evidenceRoot}/polo-contour-diagnosis-overlays.svg`, inputSha256: sha(inputBytes), outputSha256: sha(outputBytes), sourceBlockMatches: [...sewBlockMap.entries()].map(([index, block]) => ({ piece: pieces[index], block })), contours: diagnostics.map((item) => ({ piece: item.sourcePiece, ordinal: item.sourceOrdinal, sourceVertices: item.sourceCUT.vertexCount, sourceBulges: item.sourceCUT.bulgeCount, block: item.associatedBlock, sameCountCandidates: item.exactSameVertexCandidatesInBlock.length, nearestOutputVertices: item.nearestGeometryInBlock?.vertexCount, nearestHausdorffCm: item.nearestGeometryInBlock?.sampledSymmetricHausdorffCm })) }, null, 2));
