import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const DxfParser = require("C:/G04-CLO-DXF-Exchange/Tools/open-patterns-astm-parser/node_modules/dxf-parser");
const exchangeRoot = "C:/G04-CLO-DXF-Exchange/S664-getonagain-grainline-profile-trial";
const originalPath = "C:/G04-CLO-DXF-Exchange/S648-getonagain-fixture-preflight/Input/polo-m-idr-profile-r14-first.dxf";
const copiedInputPath = path.join(exchangeRoot, "Input/polo-m-idr-profile-r14-first.dxf");
const candidatePath = path.join(exchangeRoot, "Candidate/polo-m-idr-profile-r14-grainline.dxf");
const reportPath = path.join(exchangeRoot, "Evidence/S664-candidate-verification.json");
const expectedInputSha256 = "ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461";
const profileLines = [
  ["IDR_POLO_FRONT", "30C", 5.95, 68.811, 14.75, 4.468],
  ["IDR_POLO_BACK", "30D", 36.45, 72.732, 45.25, 3],
  ["IDR_POLO_SLEEVE", "30E", 84.644, 74.742, 84.644, 50.955],
  ["IDR_POLO_BUTTON_PLACKET", "30F", 114.288, 74.742, 114.288, 60.742],
  ["IDR_POLO_BUTTONHOLE_PLACKET", "310", 126.288, 74.742, 126.288, 60.742],
  ["IDR_POLO_OUTER_COLLAR_STAND", "311", 138.238, 64.676, 138.238, 62.676],
  ["IDR_POLO_INNER_COLLAR_STAND", "312", 155.881, 64.676, 155.881, 62.676],
  ["IDR_POLO_UPPER_POINTED_COLLAR", "313", 173.525, 64.676, 177.548, 56.569],
  ["IDR_POLO_UNDER_POINTED_COLLAR", "314", 193.125, 64.676, 197.148, 56.569],
];
const layerHandle = "30B";
const handseed = "315";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

function pairs(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  assert.equal(lines.length % 2, 0, "DXF must contain complete group-code/value pairs");
  return Array.from({ length: lines.length / 2 }, (_, index) => [Number(lines[index * 2].trim()), lines[index * 2 + 1].trim()]);
}

function findSequence(all, sequence, from = 0) {
  outer: for (let i = from; i <= all.length - sequence.length; i++) {
    for (let j = 0; j < sequence.length; j++) if (all[i + j][0] !== sequence[j][0] || all[i + j][1] !== sequence[j][1]) continue outer;
    return i;
  }
  return -1;
}

function insertLayer(sourceText) {
  const originalPairs = pairs(sourceText);
  const tableStart = findSequence(originalPairs, [[0, "TABLE"], [2, "LAYER"]]);
  assert.notEqual(tableStart, -1, "LAYER table exists");
  const tableEnd = originalPairs.findIndex((pair, index) => index > tableStart && pair[0] === 0 && pair[1] === "ENDTAB");
  assert.notEqual(tableEnd, -1, "LAYER table has ENDTAB");
  const countPair = originalPairs.findIndex((pair, index) => index > tableStart && index < tableEnd && pair[0] === 70);
  assert.notEqual(countPair, -1, "LAYER table record count exists");
  const layerNames = [];
  for (let i = tableStart + 2; i < tableEnd; i++) if (originalPairs[i][0] === 0 && originalPairs[i][1] === "LAYER") {
    const nameIndex = originalPairs.findIndex((pair, index) => index > i && index < tableEnd && pair[0] === 2);
    layerNames.push(originalPairs[nameIndex]?.[1]);
  }
  assert(!layerNames.includes("GRAINLINE"), "trial input must not already contain GRAINLINE");
  const newline = sourceText.includes("\r\n") ? "\r\n" : "\n";
  const lines = sourceText.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  lines[countPair * 2 + 1] = lines[countPair * 2 + 1].replace(/\d+/, String(Number(originalPairs[countPair][1]) + 1));
  const definition = [
    [0, "LAYER"], [5, layerHandle], [330, "2"], [100, "AcDbSymbolTableRecord"],
    [100, "AcDbLayerTableRecord"], [2, "GRAINLINE"], [70, "     0"], [62, "     7"],
    [6, "Continuous"], [370, "    -3"], [290, "     1"],
  ];
  lines.splice(tableEnd * 2, 0, ...definition.flatMap(([code, value]) => [String(code).padStart(3, " "), value]));
  return { lines, newline };
}

function linePairs(handle, ownerHandle, x1, y1, x2, y2) {
  return [
    [0, "LINE"], [5, handle], [330, ownerHandle], [100, "AcDbEntity"], [8, "GRAINLINE"],
    [100, "AcDbLine"], [10, x1.toFixed(3)], [20, y1.toFixed(3)], [30, "0.0"],
    [11, x2.toFixed(3)], [21, y2.toFixed(3)], [31, "0.0"],
  ];
}

function inside(point, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i];
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    if (Math.abs(cross) <= 1e-7 && point.x >= Math.min(a.x, b.x) - 1e-7 && point.x <= Math.max(a.x, b.x) + 1e-7 &&
        point.y >= Math.min(a.y, b.y) - 1e-7 && point.y <= Math.max(a.y, b.y) + 1e-7) return true;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

await mkdir(path.dirname(candidatePath), { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await mkdir(path.dirname(copiedInputPath), { recursive: true });
const inputBytes = await readFile(originalPath);
assert.equal(sha256(inputBytes), expectedInputSha256, "S648 input custody hash mismatch");
await copyFile(originalPath, copiedInputPath);
const sourceText = inputBytes.toString("utf8");
const { lines: candidateLines, newline } = insertLayer(sourceText);
let candidatePairs = pairs(`${candidateLines.join(newline)}${newline}`);
const parsedInput = new DxfParser().parseSync(sourceText);
assert.equal(parsedInput.header.$INSUNITS, 5, "input units must remain centimeters");
const pieceRows = [];
for (const [blockName, handle, x1, y1, x2, y2] of profileLines) {
  const block = parsedInput.blocks[blockName];
  assert(block, `source block missing: ${blockName}`);
  const insert = parsedInput.entities.find((entity) => entity.type === "INSERT" && entity.name === blockName);
  assert(insert, `source piece INSERT missing: ${blockName}`);
  assert.deepEqual(insert.position, { x: 0, y: 0, z: 0 }, `${blockName} INSERT must be untransformed`);
  assert.deepEqual(block.position, { x: 0, y: 0, z: 0 }, `${blockName} block base point must be zero`);
  const contour = block.entities.find((entity) => entity.type === "POLYLINE" && entity.layer === "CUT");
  assert(contour, `${blockName} CUT boundary missing`);
  const ownerHandle = block.ownerHandle;
  // Locate this named block's terminator through the raw block header; the
  // zero basepoint means the source-derived DXF coordinates are block-local.
  const raw = candidatePairs;
  const namePair = raw.findIndex((pair, index) => pair[0] === 0 && pair[1] === "BLOCK" &&
    raw.slice(index, index + 14).some((candidate) => candidate[0] === 2 && candidate[1] === blockName));
  assert.notEqual(namePair, -1, `raw BLOCK record missing: ${blockName}`);
  const nameIndex = raw.findIndex((pair, index) => index >= namePair && index < namePair + 14 && pair[0] === 2 && pair[1] === blockName);
  const endIndex = raw.findIndex((pair, index) => index > nameIndex && pair[0] === 0 && pair[1] === "ENDBLK");
  assert.notEqual(endIndex, -1, `raw ENDBLK missing: ${blockName}`);
  const entity = linePairs(handle, ownerHandle, x1, y1, x2, y2);
  candidateLines.splice(endIndex * 2, 0, ...entity.flatMap(([code, value]) => [String(code).padStart(3, " "), value]));
  candidatePairs = pairs(`${candidateLines.join(newline)}${newline}`);
  const polygon = contour.vertices.map(({ x, y }) => ({ x, y }));
  for (let step = 0; step <= 500; step++) {
    const t = step / 500;
    assert(inside({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }, polygon), `${blockName} source grainline point ${step}/500 leaves CUT`);
  }
  pieceRows.push({ blockName, lineHandle: handle, blockRecordHandle: ownerHandle, endpointsCm: [[x1, y1], [x2, y2]], cutVertexCount: contour.vertices.length, sampledPointsInside: 501 });
}

const handseedIndex = candidatePairs.findIndex((pair, index) => pair[0] === 9 && pair[1] === "$HANDSEED");
assert.notEqual(handseedIndex, -1, "$HANDSEED variable missing");
assert.equal(candidatePairs[handseedIndex + 1][0], 5, "$HANDSEED value group missing");
candidateLines[(handseedIndex + 1) * 2 + 1] = handseed;
candidatePairs = pairs(`${candidateLines.join(newline)}${newline}`);
const candidateText = `${candidateLines.join(newline)}${newline}`;
await writeFile(candidatePath, candidateText, "utf8");

const parsedCandidate = new DxfParser().parseSync(candidateText);
assert.equal(parsedCandidate.header.$INSUNITS, 5, "candidate units changed");
assert.equal(parsedCandidate.tables.layer.layers.GRAINLINE.name, "GRAINLINE", "candidate layer absent");
assert.equal(parsedCandidate.entities.filter((entity) => entity.type === "INSERT").length, 9, "piece INSERT count changed");
assert.equal(parsedCandidate.entities.length, parsedInput.entities.length, "top-level entities changed");
for (const [blockName, handle, x1, y1, x2, y2] of profileLines) {
  const before = parsedInput.blocks[blockName], after = parsedCandidate.blocks[blockName];
  const additions = after.entities.filter((entity) => entity.type === "LINE" && entity.layer === "GRAINLINE");
  assert.equal(additions.length, 1, `${blockName} must contain exactly one trial grainline`);
  assert.deepEqual(after.entities.slice(0, before.entities.length), before.entities, `${blockName} existing entity payload/order changed`);
  assert.equal(after.entities.length, before.entities.length + 1, `${blockName} entity count delta is not one`);
  const added = additions[0];
  assert.equal(added.handle.toUpperCase(), handle);
  assert.deepEqual(added.vertices.map(({ x, y }) => [x, y]), [[x1, y1], [x2, y2]]);
}

// Remove the only permitted deltas from the raw code/value stream, normalize
// the layer count and handseed edits, then require every original pair in the
// original order and with exactly the original text values.
const newHandles = new Set([layerHandle, ...profileLines.map((row) => row[1])]);
const normalized = [];
for (let i = 0; i < candidatePairs.length; i++) {
  const pair = candidatePairs[i];
  if (pair[0] === 0 && pair[1] === "LINE" && newHandles.has(candidatePairs[i + 1]?.[1]?.toUpperCase())) {
    i++;
    while (i < candidatePairs.length && candidatePairs[i][0] !== 0) i++;
    i--;
    continue;
  }
  if (pair[0] === 0 && pair[1] === "LAYER" && candidatePairs.slice(i, i + 14).find(([code]) => code === 2)?.[1] === "GRAINLINE") {
    i++;
    while (i < candidatePairs.length && candidatePairs[i][0] !== 0) i++;
    i--;
    continue;
  }
  normalized.push([...pair]);
}
const originalPairs = pairs(sourceText);
let layerTableStart = -1;
let inLayerTable = false;
for (let i = 0; i < normalized.length; i++) {
  const pair = normalized[i];
  if (pair[0] === 0 && pair[1] === "TABLE" && normalized[i + 1]?.[0] === 2 && normalized[i + 1]?.[1] === "LAYER") {
    layerTableStart = i;
    inLayerTable = true;
  } else if (inLayerTable && pair[0] === 0 && pair[1] === "ENDTAB") inLayerTable = false;
  else if (inLayerTable && i > layerTableStart && pair[0] === 70) {
    normalized[i][1] = originalPairs.find((candidate, index) => index > layerTableStart && candidate[0] === 70)?.[1] ?? "1";
    inLayerTable = false;
  }
}
let afterHandseed = false;
for (let i = 0; i < normalized.length; i++) {
  if (normalized[i][0] === 9 && normalized[i][1] === "$HANDSEED") afterHandseed = true;
  else if (afterHandseed) {
    assert.equal(normalized[i][0], 5, "original $HANDSEED value missing");
    normalized[i][1] = "30A";
    break;
  }
}
assert.equal(normalized.length, originalPairs.length, "candidate has unexpected raw DXF group-pair changes");
assert.deepEqual(normalized, originalPairs, "candidate changes pre-existing raw DXF code/value pairs beyond layer count, handseed and additions");

const report = {
  profile: "idr-pattern-exchange/2",
  receiverTrial: "GetonAgain DGS VID:20250610, AutoCAD mode, frozen S661 settings",
  inputPath: originalPath,
  copiedInputPath,
  candidatePath,
  inputBytes: inputBytes.length,
  inputSha256: sha256(inputBytes),
  candidateBytes: Buffer.byteLength(candidateText),
  candidateSha256: sha256(Buffer.from(candidateText, "utf8")),
  allowedRawPairDeltas: { layerTableCount: "1 → 2", addedLayerHandle: layerHandle, addedLineHandles: profileLines.map((row) => row[1]), handseed: `30A → ${handseed}` },
  preserved: { originalRawPairs: originalPairs.length, existingBlockEntitiesByteValueEquivalent: true, pieceInsertCount: 9, units: "centimeters ($INSUNITS=5)", cutSewMarksAndIdentityUnchanged: true },
  lines: pieceRows,
  insideSamples: `${pieceRows.length * 501}/${pieceRows.length * 501}`,
  result: "candidate structurally verified; DGS import not yet performed",
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
