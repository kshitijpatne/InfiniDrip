import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const exchange = "C:/G04-CLO-DXF-Exchange";
const inputs = [
  {
    label: "Woven M source fixture",
    path: "Input/woven-shirt-standard-m.dxf",
    sha256: "9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5",
    bytes: 14923,
  },
  {
    label: "First-generation CLO export",
    path: "Output/woven-shirt-standard-m-clo-export.dxf",
    sha256: "88b01c44701f8c73e10ab898356bdaa47d0a3b317b6a0a7e33d9d260cb74502c",
    bytes: 140091,
  },
  {
    label: "Second-generation CLO export",
    path: "Output/woven-shirt-standard-m-clo-reexport-from-reimport.dxf",
    sha256: "44f3580f1175b84342f1d21ef847214cbbe5bc883c0795fdc4e69c09e2e21579",
    bytes: 140107,
  },
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: group-code/value pairs are complete`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `${label}: valid group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const value = (entity, code) => entity.find(([key]) => key === code)?.[1];
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") {
      section = undefined;
    } else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      section.entities.push(pairs.slice(start, i));
      i--;
    }
  }
  const entitiesIn = (name) => sections.find((item) => item.name === name)?.entities ?? [];
  const headerValue = (name) => {
    const index = pairs.findIndex(([code, text]) => code === 9 && text === name);
    return index < 0 ? null : pairs[index + 1]?.[1] ?? null;
  };
  const parsePolylines = (entities, block) => entities.flatMap((entity, index) => {
    if (entity[0][1] !== "POLYLINE") return [];
    const vertices = [];
    for (let i = index + 1; i < entities.length; i++) {
      const type = entities[i][0][1];
      if (type === "VERTEX") vertices.push({ x: Number(value(entities[i], 10)), y: Number(value(entities[i], 20)) });
      if (type === "SEQEND" || ["BLOCK", "POLYLINE", "ENDBLK"].includes(type)) break;
    }
    return [{
      block,
      layer: value(entity, 8) ?? "(none)",
      closed: (Number(value(entity, 70) ?? 0) & 1) === 1,
      vertices,
    }];
  });

  const sourcePolylines = parsePolylines(entitiesIn("ENTITIES"), "model");
  const blockSections = entitiesIn("BLOCKS");
  const blocks = [];
  let block;
  for (const entity of blockSections) {
    const type = entity[0][1];
    if (type === "BLOCK") {
      block = { name: value(entity, 2), entities: [] };
      blocks.push(block);
    } else if (type === "ENDBLK") {
      block = undefined;
    } else if (block) {
      block.entities.push(entity);
    }
  }
  const blockPolylines = blocks.flatMap((item) => parsePolylines(item.entities, item.name));
  const inserts = entitiesIn("ENTITIES").filter((entity) => entity[0][1] === "INSERT").map((entity) => ({
    block: value(entity, 2),
    layer: value(entity, 8) ?? "(none)",
    x: Number(value(entity, 10) ?? 0),
    y: Number(value(entity, 20) ?? 0),
    rotation: Number(value(entity, 50) ?? 0),
  }));
  const modelEntityCounts = Object.fromEntries([...new Set(entitiesIn("ENTITIES").map((entity) => entity[0][1]))]
    .sort().map((type) => [type, entitiesIn("ENTITIES").filter((entity) => entity[0][1] === type).length]));
  return {
    label,
    acadver: headerValue("$ACADVER"),
    insunits: headerValue("$INSUNITS"),
    sections: sections.map((item) => item.name),
    modelEntityCounts,
    sourcePolylines,
    blocks: blocks.map((item) => ({
      name: item.name,
      entityCounts: Object.fromEntries([...new Set(item.entities.map((entity) => entity[0][1]))]
        .sort().map((type) => [type, item.entities.filter((entity) => entity[0][1] === type).length])),
      polylines: parsePolylines(item.entities, item.name),
    })),
    blockPolylines,
    inserts,
  };
}

function cyclicDelta(a, b) {
  if (a.length !== b.length || !a.length) return Infinity;
  let best = Infinity;
  for (let start = 0; start < b.length; start++) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const point = b[(start + direction * i + b.length * 2) % b.length];
      max = Math.max(max, Math.abs(a[i].x - point.x), Math.abs(a[i].y - point.y));
    }
    best = Math.min(best, max);
  }
  return best;
}

function maximumMatching(left, right, keyFor, toleranceCm = 0.001) {
  const candidates = left.map((a) => right.flatMap((b, index) => {
    if (keyFor(a) !== keyFor(b) || a.closed !== b.closed) return [];
    const delta = cyclicDelta(a.vertices, b.vertices);
    return delta <= toleranceCm ? [{ index, delta }] : [];
  }).sort((a, b) => a.delta - b.delta));
  const rightOwner = Array(right.length).fill(-1);
  const edgeDelta = new Map();
  const assign = (leftIndex, seen) => {
    for (const candidate of candidates[leftIndex]) {
      if (seen.has(candidate.index)) continue;
      seen.add(candidate.index);
      if (rightOwner[candidate.index] < 0 || assign(rightOwner[candidate.index], seen)) {
        rightOwner[candidate.index] = leftIndex;
        edgeDelta.set(`${leftIndex}:${candidate.index}`, candidate.delta);
        return true;
      }
    }
    return false;
  };
  let matched = 0;
  for (let i = 0; i < left.length; i++) if (assign(i, new Set())) matched++;
  const matchedDeltas = [...rightOwner.entries()].flatMap(([rightIndex, leftIndex]) =>
    leftIndex < 0 ? [] : [edgeDelta.get(`${leftIndex}:${rightIndex}`)]);
  return {
    leftCount: left.length,
    rightCount: right.length,
    matchedWithin001cm: matched,
    unmatchedLeft: left.length - matched,
    maxMatchedDeltaCm: matchedDeltas.length ? Math.max(...matchedDeltas) : null,
  };
}

const documents = [];
for (const input of inputs) {
  const bytes = await readFile(`${exchange}/${input.path}`);
  assert.equal(bytes.byteLength, input.bytes, `${input.label}: byte count unchanged`);
  assert.equal(sha256(bytes), input.sha256, `${input.label}: pinned SHA-256 unchanged`);
  documents.push({ ...parse(bytes, input.label), path: input.path, bytes: bytes.byteLength, sha256: sha256(bytes) });
}
const [source, first, second] = documents;
const summarizeBlocks = (document) => document.blocks.map(({ name, entityCounts, polylines }) => ({
  name,
  entityCounts,
  polylineCount: polylines.length,
  closedPolylineCount: polylines.filter((polyline) => polyline.closed).length,
  openPolylineCount: polylines.filter((polyline) => !polyline.closed).length,
}));
const sourceTo = (target) => maximumMatching(source.sourcePolylines, target.blockPolylines, () => "all-blocks");
const sameBlockLayer = (left, right) => maximumMatching(left.blockPolylines, right.blockPolylines,
  (polyline) => `${polyline.block}\0${polyline.layer}`);

assert.equal(source.sourcePolylines.length, 24, "Woven source has 24 outlines");
assert.ok(source.sourcePolylines.every((polyline) => polyline.closed), "Woven source outlines are closed");
assert.equal(first.blocks.length, 12, "First export has 12 distinct piece blocks");
assert.equal(second.blocks.length, 12, "Second export has 12 distinct piece blocks");
assert.equal(first.inserts.length, 12, "First export inserts all 12 pieces");
assert.equal(second.inserts.length, 12, "Second export inserts all 12 pieces");
assert.deepEqual(first.blocks.map(({ name }) => name), second.blocks.map(({ name }) => name), "Piece block names persist");
assert.equal(first.blockPolylines.length, 114, "First export has expected receiver polyline multiplicity");
assert.equal(second.blockPolylines.length, 114, "Second export has expected receiver polyline multiplicity");
assert.deepEqual(first.blocks.map(({ name, entityCounts }) => ({ name, entityCounts })),
  second.blocks.map(({ name, entityCounts }) => ({ name, entityCounts })), "Per-block entity counts persist");

const sourceFirst = sourceTo(first);
const sourceSecond = sourceTo(second);
const firstSecond = sameBlockLayer(first, second);
assert.equal(sourceFirst.matchedWithin001cm, 24, "All source outlines have output geometry within 0.001 cm");
assert.equal(sourceSecond.matchedWithin001cm, 24, "All source outlines remain within 0.001 cm after the next DXF cycle");
assert.equal(firstSecond.matchedWithin001cm, 114, "All same-block, same-layer contours survive a second-generation comparison");

const result = {
  receiver: "CLO 2026.1.310 (r58944)",
  observedImportProfile: {
    format: "DXF-AAMA",
    units: "centimeters",
    scalePercent: 100,
    rotation: "Do Not Rotate",
    grain: "Maintain Original",
    importNotchesTo: "Both",
    notchPosition: "Ratio",
    outcome: "Imported; CLO displayed a no-seam-allowance notice and retained imported outlines in Custom mode.",
  },
  files: documents.map(({ label, path, bytes, sha256: digest, acadver, insunits, sections, modelEntityCounts, blocks, blockPolylines, inserts }) => ({
    label,
    path: `${exchange}/${path}`,
    bytes,
    sha256: digest,
    acadver,
    insunits,
    sections,
    modelEntityCounts,
    blockCount: blocks.length,
    insertCount: inserts.length,
    inserts,
    storedPolylineCount: blockPolylines.length,
    closedPolylineCount: blockPolylines.filter((polyline) => polyline.closed).length,
    openPolylineCount: blockPolylines.filter((polyline) => !polyline.closed).length,
    blocks: summarizeBlocks({ blocks }),
  })),
  geometryChecks: {
    sourceToFirst: sourceFirst,
    sourceToSecond: sourceSecond,
    firstToSecondSameBlockSameLayer: firstSecond,
  },
  savedNativeProject: {
    path: `${exchange}/Output/woven-shirt-standard-m-clo-second-generation-reimport.zprj`,
    bytes: 2306224,
    sha256: "8e6895521827254b8a7a9559cd2be3236c1d62b882ce5cdec40f0c47b264c489",
  },
  renderedEvidence: {
    raw: `${exchange}/Evidence/woven-second-generation-clo-2d-snapshot.png`,
    reviewComposite: `${exchange}/Evidence/woven-second-generation-clo-2d-snapshot-white.png`,
    reviewNote: "The CLO 1:1 PNG has transparent background and low-contrast thin strokes at fit-to-page size; the white composite improves inspection contrast without altering geometry.",
  },
  limitations: [
    "The source-to-output matching proves geometric candidates within 0.001 cm, not numeric DXF layer meaning or mark semantics.",
    "Both CLO exports declare AC1009 and omit $INSUNITS; the DXF-ASTM menu label does not prove standard conformance.",
    "This one standard-M fixture does not verify option, grade, other-recipe, rights, independent receiver, or industrial interoperability requirements.",
    "The CLO reimport is a receiver observation only; it makes no physical-fit, factory-acceptance, or production-readiness claim.",
  ],
};
const outputPath = `${exchange}/Evidence/woven-second-generation-roundtrip-analysis.json`;
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  outputPath,
  inputs: documents.map(({ path, bytes, sha256: digest }) => ({ path, bytes, sha256: digest })),
  receiver: result.files.slice(1).map(({ blockCount, insertCount, storedPolylineCount, closedPolylineCount, openPolylineCount, acadver, insunits }) => ({ blockCount, insertCount, storedPolylineCount, closedPolylineCount, openPolylineCount, acadver, insunits })),
  geometryChecks: result.geometryChecks,
}, null, 2));
