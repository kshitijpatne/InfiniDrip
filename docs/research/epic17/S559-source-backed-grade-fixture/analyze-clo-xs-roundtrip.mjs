import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S559-source-backed-grade-fixture";
const toleranceCm = 0.001;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: incomplete group pairs`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `${label}: invalid group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }
  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i += 1;
      section.entities.push(pairs.slice(start, i));
      i -= 1;
    }
  }
  const polylines = (entities) => entities.flatMap((raw, index) => {
    if (raw[0]?.[1] !== "POLYLINE") return [];
    const vertices = [];
    for (let i = index + 1; i < entities.length; i += 1) {
      const candidate = entities[i];
      if (candidate[0]?.[1] === "SEQEND") break;
      if (candidate[0]?.[1] === "VERTEX") vertices.push({ x: Number(value(candidate, 10)), y: Number(value(candidate, 20)) });
    }
    return [{ layer: value(raw, 8) ?? "(none)", closed: (Number(value(raw, 70) ?? 0) & 1) === 1, vertices }];
  });
  const blockSection = sections.find(({ name }) => name === "BLOCKS");
  const blocks = [];
  let current;
  for (const raw of blockSection?.entities ?? []) {
    const type = raw[0]?.[1];
    if (type === "BLOCK") { current = { name: value(raw, 2), entities: [] }; blocks.push(current); }
    else if (type === "ENDBLK") current = undefined;
    else if (current) current.entities.push(raw);
  }
  const model = sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
  const entityCounts = (entities) => Object.fromEntries([...new Set(entities.map((raw) => raw[0]?.[1]).filter(Boolean))].sort().map((type) => [type, entities.filter((raw) => raw[0]?.[1] === type).length]));
  return {
    pairs,
    sections,
    blocks: blocks.map((block) => ({ name: block.name, polylines: polylines(block.entities), entityCounts: entityCounts(block.entities) })),
    modelEntityCounts: entityCounts(model),
    allEntityCounts: entityCounts(sections.flatMap(({ entities }) => entities)),
    acadver: pairs.findIndex(([code, text]) => code === 9 && text === "$ACADVER") >= 0
      ? pairs[pairs.findIndex(([code, text]) => code === 9 && text === "$ACADVER") + 1]?.[1]
      : null,
    insunits: pairs.findIndex(([code, text]) => code === 9 && text === "$INSUNITS") >= 0
      ? pairs[pairs.findIndex(([code, text]) => code === 9 && text === "$INSUNITS") + 1]?.[1]
      : null,
    sourcePolylines: polylines(sections.find(({ name }) => name === "ENTITIES")?.entities ?? []),
  };
}

function cyclicMaxDelta(a, b) {
  if (a.length !== b.length || a.length === 0) return Infinity;
  let best = Infinity;
  for (let offset = 0; offset < b.length; offset += 1) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i += 1) {
      const other = b[(offset + direction * i + b.length * 2) % b.length];
      max = Math.max(max, Math.abs(a[i].x - other.x), Math.abs(a[i].y - other.y));
    }
    best = Math.min(best, max);
  }
  return best;
}

const inputPath = `${root}/tee-XS.dxf`;
const outputPath = `${root}/tee-XS-clo-output.dxf`;
const [inputBytes, outputBytes] = await Promise.all([readFile(inputPath), readFile(outputPath)]);
const source = parse(inputBytes, "Tee XS source");
const output = parse(outputBytes, "Tee XS CLO export");
assert.deepEqual(source.sections.map(({ name }) => name), ["ENTITIES"]);
assert.equal(source.sourcePolylines.length, 6, "Tee XS contains three CUT and three SEW outlines");
assert.ok(source.sourcePolylines.every(({ closed }) => closed));
assert.equal(output.acadver, "AC1009");
assert.ok(output.blocks.length >= 3, "CLO output must contain pattern blocks");
assert.deepEqual(output.blocks.map(({ name }) => name), ["0_M", "1_M", "2_M"], "the source XS size identity is not retained by this one-size import/export path");
const exportedPolylines = output.blocks.flatMap((block) => block.polylines.map((line) => ({ block: block.name, ...line })));
const matches = source.sourcePolylines.map((inputLine, ordinal) => {
  const candidates = exportedPolylines.map((candidate) => ({
    block: candidate.block,
    layer: candidate.layer,
    closed: candidate.closed,
    vertexCount: candidate.vertices.length,
    maxCoordinateDeltaCm: cyclicMaxDelta(inputLine.vertices, candidate.vertices),
  })).sort((a, b) => a.maxCoordinateDeltaCm - b.maxCoordinateDeltaCm);
  return {
    sourceOrdinal: ordinal,
    sourceLayer: inputLine.layer,
    sourceVertexCount: inputLine.vertices.length,
    best: candidates[0] ?? null,
    candidatesWithinTolerance: candidates.filter(({ maxCoordinateDeltaCm }) => maxCoordinateDeltaCm <= toleranceCm).length,
  };
});
const report = {
  receiver: "CLO 2026.1.310 (r58944)",
  inputProfile: "InfiniDrip legacy exporter DXF; coordinates interpreted as centimeters; DXF-AAMA import; 100%; no rotation; Draw Curve Points enabled; Optimize All Curve Points disabled; CUT/SEW swap disabled; notches Both at Ratio",
  outputProfile: "CLO DXF-AAMA export; Graded Nest selected; centimeters; 100%; no rotation; Duplicate Notch on Seam Allowance enabled; other optional toggles disabled",
  sourceSize: "Tee XS, generated from current gradeRun defaults; one size per input file",
  gradingLimitation: "Graded Nest is a CLO export setting, but this imported one-size file contains no multi-size group or grade-rule record; this is not a graded nest or grading-rule round trip. Although the source fixture is generated for XS, CLO names all three exported pattern blocks with the suffix _M. The intended XS identity therefore does not survive this interchange path.",
  toleranceCm,
  input: { path: inputPath, bytes: inputBytes.byteLength, sha256: sha256(inputBytes), sectionNames: source.sections.map(({ name }) => name), entityCounts: source.allEntityCounts, outlines: source.sourcePolylines.map(({ layer, closed, vertices }) => ({ layer, closed, vertexCount: vertices.length })) },
  output: { path: outputPath, bytes: outputBytes.byteLength, sha256: sha256(outputBytes), acadver: output.acadver, insunits: output.insunits, sectionNames: output.sections.map(({ name }) => name), modelEntityCounts: output.modelEntityCounts, allEntityCounts: output.allEntityCounts, blocks: output.blocks.map(({ name, entityCounts, polylines: lines }) => ({ name, entityCounts, closedPolylineCount: lines.filter(({ closed }) => closed).length, vertices: lines.map(({ layer, closed, vertices }) => ({ layer, closed, vertexCount: vertices.length })) })) },
  comparison: {
    sourceOutlineCount: matches.length,
    matchedWithin001cm: matches.filter(({ best }) => best && best.maxCoordinateDeltaCm <= toleranceCm).length,
    unmatched: matches.filter(({ best }) => !best).length,
    overTolerance: matches.filter(({ best }) => best && best.maxCoordinateDeltaCm > toleranceCm).length,
    ambiguous: matches.filter(({ candidatesWithinTolerance }) => candidatesWithinTolerance > 1).length,
    matches,
  },
  interpretation: "This verifies one Tee XS pattern import/export through the documented CLO DXF-AAMA UI path at the source coordinate scale. All six CUT/SEW outlines match within tolerance, but CLO exports them as _M and does not carry a grade rule or multi-size group. It does not establish cross-vendor compatibility, grade-table interchange, size identity retention, mark semantics, or all-seven conformance.",
};
assert.equal(report.comparison.matchedWithin001cm, 6, "all six Tee XS CUT/SEW outlines must match within 0.001 cm");
assert.equal(report.comparison.unmatched, 0);
assert.equal(report.comparison.overTolerance, 0);
await writeFile(`${root}/tee-xs-roundtrip-analysis.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ inputHash: report.input.sha256, outputHash: report.output.sha256, sourceOutlines: report.comparison.sourceOutlineCount, matched: report.comparison.matchedWithin001cm, outputSections: report.output.sectionNames, outputBlocks: report.output.blocks.map(({ name }) => name), outputProfileIndicators: { acadver: report.output.acadver, insunits: report.output.insunits } }, null, 2));
