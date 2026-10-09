import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m.dxf";
const inputInfoPath = "C:/G04-CLO-DXF-Exchange/S620-aama-preexport-contour-check/Evidence/preexport-input-information.json";
const outputPath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Output/polo-line-chain-gen1.dxf";
const s574AnalysisPath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Evidence/line-chain-gen1-analysis.json";
const reportPath = "C:/G04-CLO-DXF-Exchange/S620-aama-preexport-contour-check/Evidence/preexport-cut-contour-comparison.json";
const expectedSourceHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedProjectHash = "43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25";
const expectedOutputHash = "346f38a02748f96247716d9e5a992912cc018cb2eeb4506c092c4f43eedaf1e3";
const toleranceMm = 0.01;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parseDxf(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has an incomplete group pair");
  const pairs = Array.from({ length: lines.length / 2 }, (_, index) => [Number(lines[index * 2].trim()), lines[index * 2 + 1]]);
  assert(pairs.every(([group]) => Number.isInteger(group)), "DXF has an invalid group code");
  const sections = new Map();
  let section;
  for (let index = 0; index < pairs.length; index++) {
    if (pairs[index][0] === 0 && pairs[index][1] === "SECTION") {
      section = pairs[index + 1]?.[1];
      sections.set(section, []);
      index++;
    } else if (pairs[index][0] === 0 && pairs[index][1] === "ENDSEC") section = undefined;
    else if (section && pairs[index][0] === 0) {
      const start = index++;
      while (index < pairs.length && pairs[index][0] !== 0) index++;
      sections.get(section).push(pairs.slice(start, index));
      index--;
    }
  }
  const value = (entity, group) => entity.find(([code]) => code === group)?.[1];
  const closed = (entity) => Boolean(Number(value(entity, 70) ?? 0) & 1);
  const readPolyline = (entity, records, start) => {
    const kind = entity[0]?.[1];
    const vertices = [];
    if (kind === "LWPOLYLINE") {
      for (const [group, raw] of entity.slice(1)) {
        if (group === 10) vertices.push({ x: Number(raw), y: NaN });
        else if (group === 20 && vertices.length) vertices.at(-1).y = Number(raw);
      }
      return { path: { layer: value(entity, 8) ?? "(none)", closed: closed(entity), vertices }, next: start + 1 };
    }
    if (kind !== "POLYLINE") return null;
    for (let index = start + 1; index < records.length && records[index][0]?.[1] !== "SEQEND"; index++) {
      if (records[index][0]?.[1] !== "VERTEX") continue;
      vertices.push({ x: Number(value(records[index], 10)), y: Number(value(records[index], 20)) });
    }
    let next = start + 1;
    while (next < records.length && records[next][0]?.[1] !== "SEQEND") next++;
    return { path: { layer: value(entity, 8) ?? "(none)", closed: closed(entity), vertices }, next: next + 1 };
  };

  const entities = sections.get("ENTITIES") ?? [];
  const sourcePaths = [];
  for (let index = 0; index < entities.length;) {
    const parsed = readPolyline(entities[index], entities, index);
    if (parsed) {
      sourcePaths.push({ ...parsed.path, block: null });
      index = parsed.next;
    } else index++;
  }
  const blockRecords = sections.get("BLOCKS") ?? [];
  const blocks = new Map();
  let blockName;
  for (let index = 0; index < blockRecords.length;) {
    const entity = blockRecords[index];
    const kind = entity[0]?.[1];
    if (kind === "BLOCK") {
      blockName = value(entity, 2);
      blocks.set(blockName, []);
      index++;
      continue;
    }
    if (kind === "ENDBLK") {
      blockName = undefined;
      index++;
      continue;
    }
    const parsed = readPolyline(entity, blockRecords, index);
    if (parsed && blockName) {
      blocks.get(blockName).push({ ...parsed.path, block: blockName });
      index = parsed.next;
    } else index++;
  }
  const inserts = new Map(entities.filter((entity) => entity[0]?.[1] === "INSERT").map((entity) => [value(entity, 2), {
    x: Number(value(entity, 10) ?? 0), y: Number(value(entity, 20) ?? 0),
    sx: Number(value(entity, 41) ?? 1), sy: Number(value(entity, 42) ?? 1),
    angle: Number(value(entity, 50) ?? 0) * Math.PI / 180,
  }]));
  for (const [name, paths] of blocks) {
    const insert = inserts.get(name) ?? { x: 0, y: 0, sx: 1, sy: 1, angle: 0 };
    for (const path of paths) path.vertices = path.vertices.map(({ x, y }) => ({
      x: insert.x + x * insert.sx * Math.cos(insert.angle) - y * insert.sy * Math.sin(insert.angle),
      y: insert.y + x * insert.sx * Math.sin(insert.angle) + y * insert.sy * Math.cos(insert.angle),
    }));
  }
  return { sourcePaths, blockPaths: [...blocks.values()].flat(), insertCount: inserts.size };
}

function bestExactCycleDelta(source, candidate, scale) {
  if (source.length !== candidate.length) return null;
  let best = null;
  for (const direction of [1, -1]) for (let offset = 0; offset < candidate.length; offset++) {
    const deltas = source.map((point, index) => {
      const other = candidate[(offset + direction * index + candidate.length * 2) % candidate.length];
      return Math.hypot(point.x * scale - other.x, point.y * scale - other.y);
    });
    const result = { direction, offset, maxDeltaMm: Math.max(...deltas), rmsDeltaMm: Math.sqrt(deltas.reduce((sum, delta) => sum + delta ** 2, 0) / deltas.length) };
    if (!best || result.maxDeltaMm < best.maxDeltaMm) best = result;
  }
  return best;
}

function bestOneMissing(source, candidate, scale) {
  if (source.length - candidate.length !== 1) return null;
  let best = null;
  for (let omitted = 0; omitted < source.length; omitted++) for (const direction of [1, -1]) for (let offset = 0; offset < candidate.length; offset++) {
    const deltas = candidate.map((point, index) => {
      const sourceIndex = (omitted + direction * (index + 1) + source.length * 4) % source.length;
      const original = source[sourceIndex];
      return Math.hypot(original.x * scale - point.x, original.y * scale - point.y);
    });
    const result = { omittedSourceIndex: omitted, direction, offset, maxIncludedDeltaMm: Math.max(...deltas), rmsIncludedDeltaMm: Math.sqrt(deltas.reduce((sum, delta) => sum + delta ** 2, 0) / deltas.length) };
    if (!best || result.maxIncludedDeltaMm < best.maxIncludedDeltaMm) best = result;
  }
  return best;
}

const sourceBytes = await readFile(sourcePath);
const cloBytes = await readFile(inputInfoPath);
const outputBytes = await readFile(outputPath);
const s574AnalysisBytes = await readFile(s574AnalysisPath);
assert.equal(sha(sourceBytes), expectedSourceHash, "S609 source fixture hash changed");
assert.equal(sha(outputBytes), expectedOutputHash, "S574 AAMA ASTM output fixture hash changed");
const clo = JSON.parse(cloBytes.toString("utf8"));
assert.equal(clo.intended_project_sha256, expectedProjectHash, "expected S574 pre-export project hash changed");
assert.equal(clo.pattern_count, 9, "in-app CLO getter did not return all nine expected pieces");
assert.equal(clo.errors.length, 0, "in-app CLO getter returned query or parse errors");
const s574 = JSON.parse(s574AnalysisBytes.toString("utf8"));
const dxf = parseDxf(sourceBytes);
const outputDxf = parseDxf(outputBytes);
const sourceCut = dxf.sourcePaths.filter((path) => path.layer === "CUT" && path.closed);
const sourceSew = dxf.sourcePaths.filter((path) => path.layer === "SEW" && path.closed);
assert.equal(sourceCut.length, 9, "Expected nine closed source CUT paths");
assert.equal(sourceSew.length, 9, "Expected nine closed source SEW paths");

const importedShapes = clo.patterns.flatMap((pattern) => {
  const children = pattern.input_information?.["Pattern InputInformation"]?.[0]?.["Children Information"] ?? [];
  return children.slice(1).map((shape) => ({
    patternIndex: pattern.pattern_index,
    patternName: pattern.pattern_name,
    shapeIndex: Number(shape["Shape index"]),
    shapeType: shape["Shape type"],
    points: (shape.PointList ?? []).filter((point) => point["Point positionX"] != null).map((point) => ({ x: Number(point["Point positionX"]), y: Number(point["Point positionY"]) })),
  }));
});

const results = [...sourceCut, ...sourceSew].map((source) => {
  const candidates = importedShapes.map((shape) => {
    const exact = bestExactCycleDelta(source.vertices, shape.points, 10);
    const oneMissing = bestOneMissing(source.vertices, shape.points, 10);
    const match = exact ?? oneMissing;
    return { patternIndex: shape.patternIndex, shapeIndex: shape.shapeIndex, pointCount: shape.points.length, exact, oneMissing, maxDeltaMm: match?.maxDeltaMm ?? match?.maxIncludedDeltaMm ?? null, rmsDeltaMm: match?.rmsDeltaMm ?? match?.rmsIncludedDeltaMm ?? null };
  }).filter((match) => match.maxDeltaMm != null).sort((a, b) => a.maxDeltaMm - b.maxDeltaMm);
  return {
    source: { block: source.block, layer: source.layer, closed: source.closed, pointCount: source.vertices.length },
    bestImportedMatches: candidates.slice(0, 4),
  };
});

const outputCutToImported = s574.matches.filter((result) => result.sourceLayer === "CUT").map((result) => {
  const outputContours = outputDxf.blockPaths.filter((path) => path.block === result.expectedBlock && path.closed);
  const candidates = outputContours.flatMap((output, contourIndex) => importedShapes.map((shape) => ({
    contourIndex,
    outputLayer: output.layer,
    outputPointCount: output.vertices.length,
    patternIndex: shape.patternIndex,
    shapeIndex: shape.shapeIndex,
    pointCount: shape.points.length,
    delta: bestExactCycleDelta(output.vertices, shape.points, 10),
  }))).filter((candidate) => candidate.delta).sort((a, b) => a.delta.maxDeltaMm - b.delta.maxDeltaMm);
  return {
    piece: result.expectedBlock,
    block: result.expectedBlock,
    sourceCutVertices: result.sourceVertexCount,
    outputClosedContourCount: outputContours.length,
    bestImportedContourMatches: candidates.slice(0, 9),
  };
});

const report = {
  slice: "S620",
  claim: "A geometric match between the saved pre-export project's native point lists and the exact post-export CUT contours determines whether the receiver's reduced CUT geometry was already represented before export.",
  method: "Hash-pinned source CUT/SEW paths, the pre-export CLO project, and the exported ASTM DXF were parsed. The in-app GetPatternInputInformation point lists were compared cyclically in both windings against post-export CUT contours after cm→mm conversion; source-layer contour comparisons are also retained as diagnostic context. For the AAMA output, all closed contours in each ordinal-bound block are compared because its numeric layers are not yet semantically identified.",
  toleranceMm,
  source: { path: sourcePath, sha256: sha(sourceBytes), cutPaths: sourceCut.length, sewPaths: sourceSew.length },
  preexportProject: { path: clo.intended_project, sha256: clo.intended_project_sha256, cloBuild: clo.clo_build_observed_ui, inAppPatternCount: clo.pattern_count, getterErrors: clo.errors },
  output: { path: outputPath, sha256: sha(outputBytes), analysisPath: s574AnalysisPath, analysisHash: sha(s574AnalysisBytes) },
  results,
  outputCutToImported,
  note: "GetPatternInputInformation labels returned shapes only as Base Line and does not expose original DXF layer or a documented stage contract. A pre-export-to-export geometric match can prove the exported reduced contour already existed in the pre-export project representation, but cannot alone state when or how CLO simplified it.",
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ reportPath, sourceCutPaths: sourceCut.length, sourceSewPaths: sourceSew.length, resultCount: results.length, bestMatches: results.map((result) => ({ layer: result.source.layer, sourcePoints: result.source.pointCount, best: result.bestImportedMatches[0] })) }, null, 2));
