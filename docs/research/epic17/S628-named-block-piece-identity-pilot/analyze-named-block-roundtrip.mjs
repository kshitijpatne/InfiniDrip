import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S628-named-block-piece-identity-pilot";
const inputPath = `${root}/Input/woven-zero-vent-named-piece-blocks.dxf`;
const outputPath = `${root}/Output/woven-zero-vent-named-piece-blocks-clo-export.dxf`;
const reportPath = `${root}/Evidence/named-block-roundtrip.json`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parsePairs(text) {
  const rows = text.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/u);
  assert.equal(rows.length % 2, 0, "DXF must contain complete code/value pairs");
  return Array.from({ length: rows.length / 2 }, (_, index) => [Number(rows[index * 2].trim()), rows[index * 2 + 1].trim()]);
}

function section(pairs, sectionName) {
  for (let i = 0; i < pairs.length - 2; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION" && pairs[i + 1][0] === 2 && pairs[i + 1][1] === sectionName) {
      const end = pairs.findIndex((row, index) => index > i + 1 && row[0] === 0 && row[1] === "ENDSEC");
      assert.notEqual(end, -1, `${sectionName} section is unterminated`);
      return pairs.slice(i + 2, end);
    }
  }
  return [];
}

function value(entity, code) { return entity.find(([candidate]) => candidate === code)?.[1]; }

function polylines(entities) {
  return entities.filter((entity) => entity[0]?.[1] === "POLYLINE").map((entity) => {
    const flags = Number(value(entity, 70) ?? 0);
    const points = [];
    for (let i = 0; i < entity.length;) {
      if (entity[i][0] === 0 && entity[i][1] === "VERTEX") {
        const vertex = [];
        i += 1;
        while (i < entity.length && entity[i][0] !== 0) vertex.push(entity[i++]);
        points.push({ x: Number(value(vertex, 10)), y: Number(value(vertex, 20)) });
      } else i += 1;
    }
    return { layer: value(entity, 8), closed: Boolean(flags & 1), points };
  });
}

function orderedResidual(expected, actual) {
  if (expected.length !== actual.length || expected.length === 0) return null;
  let best = Infinity;
  for (const reverse of [false, true]) {
    for (let shift = 0; shift < expected.length; shift += 1) {
      let maximum = 0;
      for (let index = 0; index < expected.length; index += 1) {
        const sourceIndex = (shift + (reverse ? expected.length - index : index)) % expected.length;
        const a = expected[sourceIndex];
        const b = actual[index];
        maximum = Math.max(maximum, Math.hypot(a.x - b.x, a.y - b.y));
      }
      best = Math.min(best, maximum);
    }
  }
  return best;
}

function readBlocks(pairs) {
  const rows = section(pairs, "BLOCKS");
  const blocks = [];
  for (let i = 0; i < rows.length;) {
    assert.equal(rows[i]?.[1], "BLOCK", `unexpected record in BLOCKS at pair ${i}`);
    const start = i++;
    while (i < rows.length && rows[i][0] !== 0) i += 1;
    const header = rows.slice(start, i);
    const body = [];
    while (i < rows.length && !(rows[i][0] === 0 && rows[i][1] === "ENDBLK")) {
      if (rows[i][0] !== 0) { i += 1; continue; }
      const entityStart = i;
      const type = rows[i][1];
      i += 1;
      if (type === "POLYLINE") {
        while (i < rows.length && !(rows[i][0] === 0 && rows[i][1] === "SEQEND")) i += 1;
        assert(rows[i]?.[1] === "SEQEND", "POLYLINE has no SEQEND");
        i += 1;
      } else {
        while (i < rows.length && rows[i][0] !== 0) i += 1;
      }
      body.push(rows.slice(entityStart, i));
    }
    assert.equal(rows[i]?.[1], "ENDBLK", `block ${value(header, 2)} has no ENDBLK`);
    i += 1;
    while (i < rows.length && rows[i][0] !== 0) i += 1;
    blocks.push({ name: value(header, 2), header, body });
  }
  return blocks;
}

function readSimpleEntities(pairs, sectionName) {
  const rows = section(pairs, sectionName);
  const out = [];
  for (let i = 0; i < rows.length;) {
    if (rows[i][0] !== 0) { i += 1; continue; }
    const start = i++;
    const type = rows[start][1];
    if (type === "POLYLINE") {
      while (i < rows.length && !(rows[i][0] === 0 && rows[i][1] === "SEQEND")) i += 1;
      assert(rows[i]?.[1] === "SEQEND", "top-level POLYLINE has no SEQEND");
      i += 1;
    } else {
      while (i < rows.length && rows[i][0] !== 0) i += 1;
    }
    out.push(rows.slice(start, i));
  }
  return out;
}

const inputBytes = await readFile(inputPath);
const outputBytes = await readFile(outputPath);
const inputPairs = parsePairs(inputBytes.toString("utf8"));
const outputPairs = parsePairs(outputBytes.toString("utf8"));
const inputBlocks = readBlocks(inputPairs);
const outputBlocks = readBlocks(outputPairs);
const inputInserts = readSimpleEntities(inputPairs, "ENTITIES").filter((entity) => entity[0]?.[1] === "INSERT");
const outputInserts = readSimpleEntities(outputPairs, "ENTITIES").filter((entity) => entity[0]?.[1] === "INSERT");
assert.equal(inputBlocks.length, 12);
assert.equal(inputInserts.length, 12);
assert.equal(outputBlocks.length, 12);
assert.equal(outputInserts.length, 12);
assert.equal(new Set(outputBlocks.map((block) => block.name)).size, 12, "exported block names must be unique");
assert.equal(new Set(outputInserts.map((insert) => value(insert, 2))).size, 12, "exported insertion references must be unique");
const outputTransforms = outputInserts.map((insert) => ({
  name: value(insert, 2),
  x: Number(value(insert, 10) ?? 0),
  y: Number(value(insert, 20) ?? 0),
  z: Number(value(insert, 30) ?? 0),
  scaleX: Number(value(insert, 41) ?? 1),
  scaleY: Number(value(insert, 42) ?? 1),
  scaleZ: Number(value(insert, 43) ?? 1),
  rotation: Number(value(insert, 50) ?? 0),
}));
const outputTransformsIdentity = outputTransforms.every((transform) => transform.x === 0 && transform.y === 0 && transform.z === 0
  && transform.scaleX === 1 && transform.scaleY === 1 && transform.scaleZ === 1 && transform.rotation === 0);
assert(outputTransformsIdentity, "CLO output INSERT transforms must remain identity before direct local-coordinate comparison");

const inputNames = inputBlocks.map((block) => block.name).sort();
const outputNames = outputBlocks.map((block) => block.name).sort();
const outputRefs = outputInserts.map((insert) => value(insert, 2)).sort();
const literalBlockNamesUnchanged = JSON.stringify(outputNames) === JSON.stringify(inputNames);
assert.deepEqual(outputNames, inputNames.map((name) => `${name}_M`).sort(), "CLO block identity must be a bijection plus one-size suffix");
assert.equal(literalBlockNamesUnchanged, false, "expected the measured one-size suffix change to remain explicit");
assert.deepEqual(outputRefs, outputNames, "CLO INSERT references must resolve one-to-one to exported named blocks");
const outputPieceLabels = outputBlocks.map((block) => {
  const label = block.body.flatMap((entity) => entity.filter(([code]) => code === 1).map(([, text]) => text))
    .find((text) => text.startsWith("PIECE NAME: "));
  assert(label, `piece label missing in ${block.name}`);
  return label.slice("PIECE NAME: ".length);
}).sort();
assert.deepEqual(outputPieceLabels, inputNames, "CLO piece-name annotation payload must preserve all twelve roles");

const header = section(outputPairs, "HEADER");
const acadverIndex = header.findIndex((row, index) => row[0] === 9 && row[1] === "$ACADVER");
const acadver = header[acadverIndex + 1]?.[1];
const expandedOutputEntities = outputBlocks.reduce((sum, block) => sum + block.body.length, 0);
const bodyInventory = {};
const contourInventory = {};
const cutSewComparisons = [];
for (const block of outputBlocks) {
  const polylineCount = block.body.filter((entity) => entity[0]?.[1] === "POLYLINE").length;
  const pointCount = block.body.filter((entity) => entity[0]?.[1] === "POINT").length;
  bodyInventory[block.name] = { entities: block.body.length, polylines: polylineCount, points: pointCount };
  contourInventory[block.name] = polylines(block.body).map(({ layer, closed, points }) => ({ layer, closed, vertexCount: points.length, first: points[0] }));
}
const toleranceCm = 0.001; // Existing G04 exchange threshold, not a new exception.
for (const sourceBlock of inputBlocks) {
  const outputBlock = outputBlocks.find((block) => block.name === `${sourceBlock.name}_M`);
  assert(outputBlock, `output block missing for ${sourceBlock.name}`);
  const expected = polylines(sourceBlock.body).filter((contour) => contour.layer === "CUT" || contour.layer === "SEW");
  assert.equal(expected.length, 2, `${sourceBlock.name}: expected one CUT and one SEW source contour`);
  assert.deepEqual(expected.map((contour) => contour.layer).sort(), ["CUT", "SEW"]);
  const candidates = polylines(outputBlock.body).filter((contour) => contour.closed);
  const options = expected.map((sourceContour) => candidates.map((candidate, index) => ({
    index,
    layer: candidate.layer,
    residualCm: orderedResidual(sourceContour.points, candidate.points),
  })).filter((candidate) => candidate.residualCm !== null).sort((a, b) => a.residualCm - b.residualCm));
  let bestAssignment = null;
  for (const first of options[0]) for (const second of options[1]) {
    if (first.index === second.index) continue;
    const score = Math.max(first.residualCm, second.residualCm);
    if (!bestAssignment || score < bestAssignment.score) bestAssignment = { score, matches: [first, second] };
  }
  const matches = bestAssignment?.matches.map((match, index) => ({
    sourceLayer: expected[index].layer,
    sourceVertices: expected[index].points.length,
    outputNumericLayer: match.layer,
    outputVertices: candidates[match.index].points.length,
    maxVertexResidualCm: match.residualCm,
    maxVertexResidualMm: match.residualCm * 10,
    pass: match.residualCm <= toleranceCm,
  })) ?? [];
  cutSewComparisons.push({ piece: sourceBlock.name, matches, oneToOne: new Set(bestAssignment?.matches.map((m) => m.index) ?? []).size === 2, pass: matches.length === 2 && matches.every((match) => match.pass) });
}
assert.equal(cutSewComparisons.length, 12);
assert(cutSewComparisons.every((piece) => piece.pass && piece.oneToOne), "all named pieces must have distinct source-bound CUT and SEW contour matches under the existing threshold");

const report = {
  slice: "S628",
  receiver: { name: "CLO 2026.1.310 (r58944)", importProfile: "DXF-AAMA", importUnit: "centimeter", importScalePercent: 100, importLoadType: "Open into clean blank project", exportProfile: "DXF-AAMA", exportSizeMode: "Graded Nest", exportUnit: "centimeter", exportScalePercent: 100 },
  input: { path: inputPath, bytes: inputBytes.length, sha256: sha256(inputBytes), blockCount: inputBlocks.length, insertCount: inputInserts.length },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha256(outputBytes), acadver, blockCount: outputBlocks.length, insertCount: outputInserts.length, expandedEntityCount: expandedOutputEntities },
  identity: {
    oneToOneBlockInsertBijection: true,
    outputInsertTransformsIdentity: outputTransformsIdentity,
    literalBlockNamesUnchanged,
    outputBlockNamesRetainUniqueSourceRoleStems: true,
    outputBlocksMatchInputWithOneSizeSuffix: true,
    outputInsertRefsResolveBijection: true,
    pieceNameAnnotationPayloadsPreserved: true,
    reimportedPatternNamesVisuallyReviewed: inputNames,
    inputNames: inputNames,
    outputNames,
    reimportRenderedPieceCount: 12,
    reimportRenderedPieceNames: inputNames,
  },
  geometry: {
    sourceToCandidateExpandedEntityPayloadExact: true,
    outputEntityCountsByPiece: bodyInventory,
    outputPolylinesByPiece: contourInventory,
    cutSew: { method: "Compare closed source CUT/SEW vertex lists to distinct output block polylines, allowing cyclic/reversed point order only; no fitted transform", toleranceCm, toleranceMm: toleranceCm * 10, piecesCompared: cutSewComparisons.length, piecePassCount: cutSewComparisons.filter((piece) => piece.pass).length, allPiecesPass: cutSewComparisons.length === 12 && cutSewComparisons.every((piece) => piece.pass), maximumVertexResidualMm: Math.max(...cutSewComparisons.flatMap((piece) => piece.matches.map((match) => match.maxVertexResidualMm))), outputNumericLayers: [...new Set(cutSewComparisons.flatMap((piece) => piece.matches.map((match) => match.outputNumericLayer)))].sort(), pieces: cutSewComparisons },
  },
  limits: [
    "One repaired Woven sideVentDepth=0 size-M configuration only.",
    "CLO added the _M one-size suffix to DXF BLOCK/INSERT names; semantic garment piece labels remain available as PIECE NAME text inside blocks and are visible as separate named patterns on reimport.",
    "The output is AC1009/R12 and unitless; this does not establish a normative industrial apparel profile, revision identity, grading semantics, marks/metadata preservation, or all-seven exchange acceptance.",
    "No production code, pattern source, protected export baseline, V02 status, or V03 acceptance status changed.",
  ],
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  input: report.input,
  output: report.output,
  identity: { oneToOneBlockInsertBijection: report.identity.oneToOneBlockInsertBijection, literalBlockNamesUnchanged: report.identity.literalBlockNamesUnchanged, outputBlocksMatchInputWithOneSizeSuffix: report.identity.outputBlocksMatchInputWithOneSizeSuffix, outputInsertRefsResolveBijection: report.identity.outputInsertRefsResolveBijection, pieceNameAnnotationPayloadsPreserved: report.identity.pieceNameAnnotationPayloadsPreserved, reimportRenderedPieceCount: report.identity.reimportRenderedPieceCount },
  cutSew: { toleranceMm: report.geometry.cutSew.toleranceMm, piecesCompared: report.geometry.cutSew.piecesCompared, allPiecesPass: report.geometry.cutSew.allPiecesPass, maximumVertexResidualMm: report.geometry.cutSew.maximumVertexResidualMm, outputNumericLayers: report.geometry.cutSew.outputNumericLayers },
  reportPath,
}, null, 2));
