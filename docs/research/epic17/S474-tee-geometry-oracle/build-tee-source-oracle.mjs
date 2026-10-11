import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function groupPairs(text, label) {
  const lines = text.trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label} has complete DXF group pairs`);
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    assert.match(lines[index], /^\d+$/, `${label} group code is numeric`);
    pairs.push([Number(lines[index]), lines[index + 1]]);
  }
  return pairs;
}

function requiredValue(pairs, code, label) {
  const pair = pairs.find(([candidate]) => candidate === code);
  assert.ok(pair, `${label} has group code ${code}`);
  return pair[1];
}

function bounds(points) {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function readPolylines(pairs) {
  const sectionIndex = pairs.findIndex((pair, index) =>
    pair[0] === 0 && pair[1] === "SECTION" && pairs[index + 1]?.[0] === 2 && pairs[index + 1]?.[1] === "ENTITIES");
  assert.notEqual(sectionIndex, -1, "DXF contains an ENTITIES section");
  const endSection = pairs.findIndex((pair, index) => index > sectionIndex && pair[0] === 0 && pair[1] === "ENDSEC");
  assert.notEqual(endSection, -1, "ENTITIES section ends with ENDSEC");

  const outlines = [];
  let index = sectionIndex + 2;
  while (index < endSection) {
    assert.equal(pairs[index][0], 0, `entity starts at group pair ${index}`);
    const type = pairs[index][1];
    if (type !== "POLYLINE") {
      while (index < endSection && pairs[index][0] !== 0) index += 1;
      continue;
    }

    const entityHeader = [];
    let cursor = index + 1;
    while (cursor < endSection && pairs[cursor][0] !== 0) entityHeader.push(pairs[cursor++]);
    const vertices = [];
    while (cursor < endSection && pairs[cursor][0] === 0 && pairs[cursor][1] === "VERTEX") {
      const vertexHeader = [];
      cursor += 1;
      while (cursor < endSection && pairs[cursor][0] !== 0) vertexHeader.push(pairs[cursor++]);
      const xText = requiredValue(vertexHeader, 10, "VERTEX");
      const yText = requiredValue(vertexHeader, 20, "VERTEX");
      const x = Number(xText);
      const y = Number(yText);
      assert.ok(Number.isFinite(x) && Number.isFinite(y), "VERTEX coordinates are finite numbers");
      vertices.push({ x, y, xText, yText });
    }
    assert.equal(pairs[cursor]?.[0], 0, "POLYLINE has a SEQEND entity");
    assert.equal(pairs[cursor]?.[1], "SEQEND", "POLYLINE terminates with SEQEND");
    assert.ok(vertices.length >= 3, "closed pattern outline has at least three vertices");
    const flag = Number(requiredValue(entityHeader, 70, "POLYLINE"));
    assert.equal(flag & 1, 1, "pattern outline is closed");
    outlines.push({
      layer: requiredValue(entityHeader, 8, "POLYLINE"),
      entityType: type,
      closed: true,
      vertexCount: vertices.length,
      bounds: bounds(vertices),
      vertices,
    });
    index = cursor + 1;
    while (index < endSection && pairs[index][0] !== 0) index += 1;
  }
  return outlines;
}

export async function extractTeeOracle() {
  const fixtureRoot = resolve(here, "../S473-clo-local-roundtrip-preflight/inputs");
  const sourcePath = resolve(fixtureRoot, "tee-standard-m.dxf");
  const manifestPath = resolve(here, "../S463-v03-receiver-fixture-pack/fixture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const fixture = manifest.fixtures.find((entry) => entry.file === "fixtures/tee-standard-m.dxf");
  assert.ok(fixture, "S463 manifest identifies standard-M Tee input");
  const sourceBytes = await readFile(sourcePath);
  assert.equal(hash(sourceBytes), fixture.sha256, "S473 input matches S463 fixture hash");
  assert.equal(sourceBytes.byteLength, fixture.bytes, "S473 input matches S463 fixture length");

  const pairs = groupPairs(sourceBytes.toString("utf8"), "Tee DXF");
  assert.deepEqual(pairs.slice(0, 2), [[0, "SECTION"], [2, "ENTITIES"]]);
  assert.deepEqual(pairs.slice(-2), [[0, "ENDSEC"], [0, "EOF"]]);
  const outlines = readPolylines(pairs);
  assert.equal(outlines.length, fixture.expectedClosedOutlineCount);
  assert.deepEqual(fixture.pieceNames, ["front", "back", "sleeve"]);

  for (let index = 0; index < outlines.length; index += 1) {
    const pieceIndex = Math.floor(index / 2);
    const expectedLayer = index % 2 === 0 ? "CUT" : "SEW";
    assert.equal(outlines[index].layer, expectedLayer, `outline ${index} layer/order`);
    outlines[index] = {
      index,
      sourcePieceOrdinal: pieceIndex,
      sourcePieceName: fixture.pieceNames[pieceIndex],
      ...outlines[index],
    };
  }

  return {
    oracleVersion: 1,
    source: {
      fixture: "docs/research/epic17/S463-v03-receiver-fixture-pack/fixtures/tee-standard-m.dxf",
      preparedCopy: "docs/research/epic17/S473-clo-local-roundtrip-preflight/inputs/tee-standard-m.dxf",
      sha256: fixture.sha256,
      bytes: fixture.bytes,
      generatedFromCommit: manifest.generatedFromCommit,
      recipe: fixture.recipe,
      size: fixture.size,
      units: "centimeters by source contract; not declared in DXF stream",
      coordinateQuantumCm: 0.001,
      pieceNames: fixture.pieceNames,
    },
    outlineCount: outlines.length,
    outlines,
    scope: "Source-side serialized geometry only; receiver output comparison pending.",
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === resolve(fileURLToPath(import.meta.url))) {
  const oracle = await extractTeeOracle();
  await writeFile(resolve(here, "tee-expected-geometry.json"), `${JSON.stringify(oracle, null, 2)}\n`);
  console.log(JSON.stringify({
    oracle: "tee-expected-geometry.json",
    sourceSha256: oracle.source.sha256,
    outlines: oracle.outlineCount,
    vertices: oracle.outlines.map(({ sourcePieceName, layer, vertexCount, bounds: extent }) =>
      ({ sourcePieceName, layer, vertexCount, bounds: extent })),
  }, null, 2));
}
