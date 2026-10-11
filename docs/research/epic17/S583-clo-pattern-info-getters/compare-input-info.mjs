import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m.dxf";
const importedFixturePath = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/Input/polo-source-m-cut-lines.dxf";
const inputInfoPath = "C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/pattern-information.json";
const reportPath = "C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/source-geometry-comparison.json";
const toleranceCm = 0.001;
const sourceToInfoMmPerCm = 10;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const rows = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(rows.length % 2, 0, "DXF must contain complete group-code/value pairs");
  const pairs = [];
  for (let index = 0; index < rows.length; index += 2) {
    assert.match(rows[index].trim(), /^\d+$/, "DXF group code must be numeric");
    pairs.push([Number(rows[index].trim()), rows[index + 1].trim()]);
  }
  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const sections = [];
  let section;
  for (let index = 0; index < pairs.length; index += 1) {
    if (pairs[index][0] === 0 && pairs[index][1] === "SECTION") {
      section = { name: pairs[index + 1]?.[1], entities: [] };
      sections.push(section);
      index += 1;
    } else if (pairs[index][0] === 0 && pairs[index][1] === "ENDSEC") {
      section = undefined;
    } else if (section && pairs[index][0] === 0) {
      const start = index;
      index += 1;
      while (index < pairs.length && pairs[index][0] !== 0) index += 1;
      section.entities.push(pairs.slice(start, index));
      index -= 1;
    }
  }

  function parsePolyline(entity, following = []) {
    const type = entity[0]?.[1];
    if (type === "LWPOLYLINE") {
      const points = [];
      let x;
      for (const [code, raw] of entity) {
        if (code === 10) x = Number(raw);
        if (code === 20 && x !== undefined) {
          points.push({ x, y: Number(raw) });
          x = undefined;
        }
      }
      return { points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1, layer: value(entity, 8) ?? "(none)" };
    }
    if (type !== "POLYLINE") return undefined;
    const points = [];
    for (const candidate of following) {
      if (candidate[0]?.[1] === "SEQEND") break;
      if (candidate[0]?.[1] === "VERTEX") {
        points.push({ x: Number(value(candidate, 10)), y: Number(value(candidate, 20)) });
      }
    }
    return { points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1, layer: value(entity, 8) ?? "(none)" };
  }

  const contours = [];
  const entities = sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
  for (let index = 0; index < entities.length; index += 1) {
    const contour = parsePolyline(entities[index], entities.slice(index + 1));
    if (contour?.closed) contours.push(contour);
  }
  return { contours };
}

function maxResidualForMapping(sourcePoints, actualPoints, ySign, reverse, shift) {
  const paired = actualPoints.map((actual, pointIndex) => {
    const sourceIndex = (shift + (reverse ? sourcePoints.length - pointIndex : pointIndex)) % sourcePoints.length;
    const source = sourcePoints[sourceIndex];
    return {
      sourceIndex,
      actual,
      sourceMapped: { x: source.x * sourceToInfoMmPerCm, y: source.y * sourceToInfoMmPerCm * ySign },
    };
  });
  const tx = paired[0].actual.x - paired[0].sourceMapped.x;
  const ty = paired[0].actual.y - paired[0].sourceMapped.y;
  const residuals = paired.map(({ actual, sourceMapped }) => Math.hypot(
    actual.x - (sourceMapped.x + tx),
    actual.y - (sourceMapped.y + ty),
  ));
  return {
    maxResidualMm: Math.max(...residuals),
    rmsResidualMm: Math.sqrt(residuals.reduce((sum, residual) => sum + residual * residual, 0) / residuals.length),
    translationMm: { x: tx, y: ty },
    yAxisSign: ySign,
    reversed: reverse,
    cyclicShift: shift,
  };
}

function bestMapping(sourcePoints, actualPoints) {
  if (sourcePoints.length !== actualPoints.length || sourcePoints.length < 2) return null;
  const options = [];
  for (const ySign of [1, -1]) {
    for (const reverse of [false, true]) {
      for (let shift = 0; shift < sourcePoints.length; shift += 1) {
        options.push(maxResidualForMapping(sourcePoints, actualPoints, ySign, reverse, shift));
      }
    }
  }
  return options.sort((a, b) => a.maxResidualMm - b.maxResidualMm)[0];
}

function getActualPoints(inputInfo, patternIndex) {
  const parsed = inputInfo.patterns[patternIndex].information.GetPatternInputInformation.parsed;
  const roots = parsed?.["Pattern InputInformation"];
  if (!Array.isArray(roots) || roots.length !== 1) return null;
  const pointList = roots[0].PointList;
  if (!Array.isArray(pointList)) return null;
  return pointList
    .filter((entry) => Object.hasOwn(entry, "Point index"))
    .map((entry) => ({ x: Number(entry["Point positionX"]), y: Number(entry["Point positionY"]) }));
}

const sourceBytes = await readFile(sourcePath);
const importedFixtureBytes = await readFile(importedFixturePath);
const inputInfoBytes = await readFile(inputInfoPath);
const source = parseDxf(sourceBytes);
const inputInfo = JSON.parse(inputInfoBytes);
assert.equal(source.contours.length, 18, "expected nine literal CUT/SEW source contour pairs");
assert.equal(sha256(importedFixtureBytes), "A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675", "S574 line-chain input fixture hash changed");
assert.equal(inputInfo.pattern_count, 9);
assert.equal(inputInfo.patterns.length, 9);

const patternResults = inputInfo.patterns.map((pattern, patternIndex) => {
  const actualPoints = getActualPoints(inputInfo, patternIndex);
  assert.ok(actualPoints, `missing point list for indexed pattern ${patternIndex}`);
  const candidates = source.contours.map((contour, sourceOrdinal) => ({
      sourceOrdinal,
      literalSourceLayer: contour.layer,
      pairedPieceOrdinal: Math.floor(sourceOrdinal / 2),
      vertexCount: contour.points.length,
      mapping: bestMapping(contour.points, actualPoints),
    })).sort((a, b) => (a.mapping?.maxResidualMm ?? Infinity) - (b.mapping?.maxResidualMm ?? Infinity));
  const summarizeCandidate = ({ sourceOrdinal, literalSourceLayer, pairedPieceOrdinal, vertexCount, mapping }) => ({
    sourceOrdinal,
    literalSourceLayer,
    pairedPieceOrdinal,
    vertexCount,
    returnedPointCount: actualPoints.length,
    mapping,
    passFixed001CmGate: mapping !== null && mapping.maxResidualMm <= toleranceCm * 10,
    comparisonStatus: mapping === null ? "vertex-count-mismatch-or-insufficient-points" : "compared",
  });
  const expectedPair = candidates.filter(({ pairedPieceOrdinal }) => pairedPieceOrdinal === patternIndex);
  return {
    patternIndex,
    patternName: pattern.pattern_name,
    returnedPointCount: actualPoints.length,
    returnedPoints: actualPoints,
    expectedSourcePair: expectedPair.map(summarizeCandidate),
    bestSourceCandidates: candidates.slice(0, 4).map(summarizeCandidate),
    exactGeometryCandidates: candidates.filter(({ mapping }) => mapping !== null && mapping.maxResidualMm <= toleranceCm * 10).map(summarizeCandidate),
  };
});

const exactGeometrySummary = {
  patternsWithAtLeastOneSourceContourMatch: patternResults.filter((pattern) => pattern.exactGeometryCandidates.length > 0).length,
  patternsMatchingLiteralCut: patternResults.filter((pattern) => pattern.exactGeometryCandidates.some(({ literalSourceLayer }) => literalSourceLayer === "CUT")).length,
  patternsMatchingLiteralSew: patternResults.filter((pattern) => pattern.exactGeometryCandidates.some(({ literalSourceLayer }) => literalSourceLayer === "SEW")).length,
  candidateMatchesByPattern: patternResults.map(({ patternIndex, exactGeometryCandidates }) => ({ patternIndex, candidates: exactGeometryCandidates.map(({ sourceOrdinal, literalSourceLayer, pairedPieceOrdinal, mapping }) => ({ sourceOrdinal, literalSourceLayer, pairedPieceOrdinal, maxResidualMm: mapping.maxResidualMm, translationMm: mapping.translationMm })) })),
};

const report = {
  slice: "S583",
  receiver: "CLO 2026.1.310, observed live UI",
  source: { path: sourcePath, sha256: sha256(sourceBytes), contourCount: source.contours.length },
  importedFixture: { path: importedFixturePath, sha256: sha256(importedFixtureBytes), note: "S574 derivative changes CUT polylines to connected LINE records while preserving their exact source coordinate strings; all SEW contours and other entities are copied unchanged." },
  returnedInputInformation: { path: inputInfoPath, sha256: sha256(inputInfoBytes), patternCount: inputInfo.pattern_count },
  comparison: {
    toleranceCm,
    equivalentPointGateMm: toleranceCm * 10,
    fixedScaleMmPerSourceCm: sourceToInfoMmPerCm,
    axisTests: ["x unchanged, y unchanged", "x unchanged, y sign reversed"],
    allowedOriginHandling: "translation only; translation is derived from the first corresponding vertex for each candidate",
    allowedPathOrderHandling: "cyclic start-point shift and forward/reversed traversal",
    prohibitedFit: "no scale or arbitrary rotation fit",
    purposeAndLimit: "geometric correspondence test only; field/layer labels are not treated as CUT/SEW semantics",
  },
  exactGeometrySummary,
  patterns: patternResults,
};

await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({
  reportPath,
  sourceSha256: report.source.sha256,
  inputInfoSha256: report.returnedInputInformation.sha256,
  exactGeometrySummary,
  best: patternResults.map((pattern) => ({ patternIndex: pattern.patternIndex, ...pattern.bestSourceCandidates[0] })),
}, null, 2));
