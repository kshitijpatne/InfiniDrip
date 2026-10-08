import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S551-polo-unit-invariance-ui-recovery";
const toleranceCm = 0.001;
const sourcePath = `${root}/polo-standard-m-source.dxf`;
const mmInputPath = `${root}/polo-standard-m-mm-input.dxf`;
const outputPath = `${root}/polo-standard-m-mm-clo-export.dxf`;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF must contain complete group-code/value pairs");
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `invalid group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const value = (entity, group) => entity.find(([code]) => code === group)?.[1];
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") {
      section = undefined;
    } else if (section && pairs[i][0] === 0) {
      const start = i;
      i += 1;
      while (i < pairs.length && pairs[i][0] !== 0) i += 1;
      section.entities.push(pairs.slice(start, i));
      i -= 1;
    }
  }
  const entitiesFor = (items) => items.map((raw) => ({ type: raw[0][1], layer: value(raw, 8) ?? "(none)", raw }));
  const readVertices = (entity, following) => {
    if (entity[0][1] === "LWPOLYLINE") {
      const vertices = [];
      let x;
      for (const [code, raw] of entity) {
        if (code === 10) x = Number(raw);
        if (code === 20 && x !== undefined) { vertices.push({ x, y: Number(raw) }); x = undefined; }
      }
      return { vertices, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
    }
    if (entity[0][1] !== "POLYLINE") return null;
    const vertices = [];
    for (const candidate of following) {
      const raw = candidate.raw ?? candidate;
      if (!raw?.[0]) continue;
      if (raw[0][1] === "SEQEND") break;
      if (raw[0][1] === "VERTEX") vertices.push({ x: Number(value(raw, 10)), y: Number(value(raw, 20)) });
    }
    return { vertices, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
  };
  const allEntities = sections.flatMap((part) => entitiesFor(part.entities));
  const blocks = [];
  let block;
  for (const raw of sections.find((part) => part.name === "BLOCKS")?.entities ?? []) {
    if (raw[0][1] === "BLOCK") { block = { name: value(raw, 2), entities: [] }; blocks.push(block); continue; }
    if (raw[0][1] === "ENDBLK") { block = undefined; continue; }
    if (block) block.entities.push(...entitiesFor([raw]));
  }
  const contours = [];
  for (const current of blocks) {
    for (let i = 0; i < current.entities.length; i += 1) {
      const entity = current.entities[i];
      if (!["POLYLINE", "LWPOLYLINE"].includes(entity.type)) continue;
      const parsed = readVertices(entity.raw, current.entities.slice(i + 1));
      if (parsed?.closed) contours.push({ block: current.name, layer: entity.layer, ...parsed });
    }
  }
  const outlines = [];
  const entitySection = sections.find((part) => part.name === "ENTITIES");
  for (let i = 0; i < (entitySection?.entities.length ?? 0); i += 1) {
    const entity = entitySection.entities[i];
    if (!["POLYLINE", "LWPOLYLINE"].includes(entity[0][1])) continue;
    const geometry = readVertices(entity, entitySection.entities.slice(i + 1));
    if (geometry?.closed) outlines.push({ ordinal: outlines.length, type: entity[0][1], layer: value(entity, 8) ?? "(none)", ...geometry });
  }
  return { sections, allEntities, blocks, contours, outlines };
}

function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function directedDistance(source, target) {
  let maximum = 0;
  for (const p of source) {
    let nearest = Infinity;
    for (let i = 0; i < target.length; i += 1) nearest = Math.min(nearest, pointToSegmentDistance(p, target[i], target[(i + 1) % target.length]));
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
}

function symmetricDistance(source, target) {
  if (!source.length || !target.length) return Infinity;
  return Math.max(directedDistance(source, target), directedDistance(target, source));
}

const sourceBytes = await readFile(sourcePath);
const mmInputBytes = await readFile(mmInputPath);
const outputBytes = await readFile(outputPath);
assert.equal(hash(sourceBytes), "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca");
assert.equal(hash(mmInputBytes), "8fb314343cdf54557e4d331b5aabc1916dc1ab77f45ac5a791d76f9ebe6874af");

const source = parse(sourceBytes);
const output = parse(outputBytes);
assert.equal(source.outlines.length, 18, "expected 18 closed source outlines");
assert.ok(output.contours.length > 0, "expected closed receiver contours in blocks");
const mmToCm = 0.1;
const matches = source.outlines.map((outline) => {
  const candidates = output.contours.map((candidate) => {
    const pointsCm = candidate.vertices.map(({ x, y }) => ({ x: x * mmToCm, y: y * mmToCm }));
    return { block: candidate.block, layer: candidate.layer, vertexCount: candidate.vertices.length, closed: candidate.closed, symmetricVertexToPathDistanceCm: symmetricDistance(outline.vertices, pointsCm) };
  }).sort((a, b) => a.symmetricVertexToPathDistanceCm - b.symmetricVertexToPathDistanceCm);
  return { sourceOrdinal: outline.ordinal, sourceLayer: outline.layer, sourceVertexCount: outline.vertices.length, best: candidates[0] ?? null, candidatesWithinGate: candidates.filter((candidate) => candidate.symmetricVertexToPathDistanceCm <= toleranceCm).length, nearestCandidates: candidates.slice(0, 3) };
});
const cmBaselinePath = "C:/G04-CLO-DXF-Exchange/S544-aama-three-recipe-roundtrip/Evidence/three-recipe-roundtrip-analysis.json";
const cmBaseline = JSON.parse(await readFile(cmBaselinePath, "utf8")).recipes.find(({ recipe }) => recipe === "Polo");
assert.ok(cmBaseline, "expected the S545 Polo centimeter baseline");
const unitComparison = matches.map((match) => {
  const previous = [1, 2].map((generation) => cmBaseline.generations.find((item) => item.generation === generation).matches.find((item) => item.sourceOrdinal === match.sourceOrdinal));
  const residualCm = match.best?.symmetricVertexToPathDistanceCm ?? null;
  return {
    sourceOrdinal: match.sourceOrdinal,
    currentResidualCm: residualCm,
    centimeterGeneration1ResidualCm: previous[0].best?.symmetricVertexToPathDistanceCm ?? null,
    centimeterGeneration2ResidualCm: previous[1].best?.symmetricVertexToPathDistanceCm ?? null,
    deltaVsCentimeterGeneration1Cm: residualCm == null ? null : residualCm - previous[0].best.symmetricVertexToPathDistanceCm,
    deltaVsCentimeterGeneration2Cm: residualCm == null ? null : residualCm - previous[1].best.symmetricVertexToPathDistanceCm,
  };
});
const failedSourceOrdinals = matches.filter(({ best }) => best && best.symmetricVertexToPathDistanceCm > toleranceCm).map(({ sourceOrdinal }) => sourceOrdinal);
const baselineFailedSourceOrdinals = [1, 2].map((generation) => cmBaseline.generations.find((item) => item.generation === generation).matches.filter(({ best }) => best && best.symmetricVertexToPathDistanceCm > toleranceCm).map(({ sourceOrdinal }) => sourceOrdinal));
assert.deepEqual(failedSourceOrdinals, [2, 10, 12, 14, 16]);
assert.deepEqual(baselineFailedSourceOrdinals, [failedSourceOrdinals, failedSourceOrdinals]);
const report = {
  receiver: "CLO 2026.1.310 (r58944)",
  recipe: "Polo",
  size: "M/default",
  import: { fileFormat: "DXF-AAMA", unit: "Millimeter", scalePercent: 100, rotation: "Do Not Rotate", drawCurvePoints: true, optimizeAllCurvePoints: false, swapCuttingAndSewing: false, importNotchesTo: "Both", notchPosition: "Ratio" },
  export: { fileFormat: "DXF-AAMA", sizeFormat: "Graded Nest", scaleUnit: "Millimeter", scalePercent: 100, rotation: "Do Not Rotate", exportWithoutGrading: false, exportWithoutSeamAllowance: false, duplicateNotchOnSeamAllowance: true, optimizeAllCurvePoints: false },
  normalization: "DXF coordinate values in exported mm file multiplied by 0.1 to compare to the cm source. This is a geometry-equivalent representation control; no grade sizes were present in the M/default fixture.",
  toleranceCm,
  files: {
    source: { path: sourcePath, bytes: sourceBytes.byteLength, sha256: hash(sourceBytes) },
    millimeterInput: { path: mmInputPath, bytes: mmInputBytes.byteLength, sha256: hash(mmInputBytes) },
    exported: { path: outputPath, bytes: outputBytes.byteLength, sha256: hash(outputBytes) },
    importRender: { path: `${root}/polo-mm-import-render.jpg`, sha256: hash(await readFile(`${root}/polo-mm-import-render.jpg`)) },
    exportSettingsRender: { path: `${root}/polo-mm-export-settings.jpg`, sha256: hash(await readFile(`${root}/polo-mm-export-settings.jpg`)) },
    exportRender: { path: `${root}/polo-mm-export-render.jpg`, sha256: hash(await readFile(`${root}/polo-mm-export-render.jpg`)) },
  },
  sourceSections: source.sections.map(({ name }) => name),
  outputSections: output.sections.map(({ name }) => name),
  sourceClosedContours: source.outlines.length,
  outputBlocks: output.blocks.length,
  outputClosedContours: output.contours.length,
  outputInserts: output.allEntities.filter(({ type }) => type === "INSERT").length,
  summary: {
    withinGate: matches.filter(({ best }) => best && best.symmetricVertexToPathDistanceCm <= toleranceCm).length,
    overGate: matches.filter(({ best }) => best && best.symmetricVertexToPathDistanceCm > toleranceCm).length,
    missing: matches.filter(({ best }) => !best).length,
    maxResidualCm: Math.max(...matches.map(({ best }) => best?.symmetricVertexToPathDistanceCm ?? 0)),
    changedVertexCount: matches.filter(({ sourceVertexCount, best }) => best && best.vertexCount !== sourceVertexCount).length,
  },
  centimeterBaselineComparison: {
    path: cmBaselinePath,
    sameFiveFailureOrdinalsInMillimeterAndBothCentimeterGenerations: failedSourceOrdinals,
    perContour: unitComparison,
    maxAbsoluteDeltaCmAcrossThreeRuns: Math.max(...unitComparison.flatMap(({ deltaVsCentimeterGeneration1Cm, deltaVsCentimeterGeneration2Cm }) => [Math.abs(deltaVsCentimeterGeneration1Cm ?? 0), Math.abs(deltaVsCentimeterGeneration2Cm ?? 0)])),
    interpretation: "The five above-gate contour losses persist with essentially unchanged residuals after a geometry-equivalent cm-to-mm representation. Numeric unit representation alone does not explain the observed Polo corner loss.",
  },
  matches,
  limitations: ["One Polo M/default control only; not seven-recipe acceptance.", "Same CLO build imports and exports; not independent receiver validation.", "The observed CLO DXF-AAMA mode does not establish a normative edition.", "No grade sizes/options, full source mark semantics, or malformed-input behavior were tested."],
};
const reportPath = `${root}/polo-mm-roundtrip-analysis.json`;
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, summary: report.summary, sourceClosedContours: report.sourceClosedContours, outputBlocks: report.outputBlocks, outputClosedContours: report.outputClosedContours, outputInserts: report.outputInserts }, null, 2));
