import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S627-woven-zero-vent-source-repair";
const manifest = JSON.parse(await readFile(`${root}/Evidence/fixture-manifest.json`, "utf8"));
const conversions = JSON.parse(await readFile(`${root}/Evidence/conversion-record.json`, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const toleranceCm = 0.001;

function parseDxf(name, bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  if (lines.length % 2) throw new Error(`${name}: unmatched group/value line`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (!/^\s*\d+\s*$/.test(lines[i])) throw new Error(`${name}: invalid group code at row ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }
  const header = [];
  const entities = [];
  let section = null;
  let awaitingSectionName = false;
  let entity = null;
  let vertex = null;
  const finishVertex = () => { if (vertex && entity?.type === "POLYLINE") entity.vertices.push(vertex); vertex = null; };
  const finishEntity = () => { finishVertex(); if (entity) entities.push(entity); entity = null; };
  for (const [code, value] of pairs) {
    if (code === 0 && value === "SECTION") { finishEntity(); awaitingSectionName = true; continue; }
    if (awaitingSectionName && code === 2) { section = value; awaitingSectionName = false; continue; }
    if (section === "HEADER") {
      if (code === 0 && value === "ENDSEC") { section = null; continue; }
      header.push([code, value]);
      continue;
    }
    if (section !== "ENTITIES") continue;
    if (code === 0 && value === "ENDSEC") { finishEntity(); section = null; continue; }
    if (code === 0 && value === "VERTEX" && entity?.type === "POLYLINE") { finishVertex(); vertex = { fields: [] }; continue; }
    if (code === 0 && value === "SEQEND" && entity?.type === "POLYLINE") { finishEntity(); continue; }
    if (code === 0) {
      finishEntity();
      if (!["ENDSEC", "EOF"].includes(value)) entity = { type: value, layer: null, fields: [], vertices: [] };
      continue;
    }
    if (vertex && entity?.type === "POLYLINE") vertex.fields.push([code, value]);
    else if (entity) {
      entity.fields.push([code, value]);
      if (code === 8 && entity.layer === null) entity.layer = value;
    }
  }
  finishEntity();
  const variable = (name, valueCode) => {
    for (let i = 0; i + 1 < header.length; i += 1) if (header[i][0] === 9 && header[i][1] === name && header[i + 1][0] === valueCode) return header[i + 1][1];
    return null;
  };
  const numeric = (entity, code, index = 0) => {
    const values = entity.fields.filter(([field]) => field === code).map(([, value]) => Number(value));
    return values[index];
  };
  for (const item of entities) {
    if (item.type === "POLYLINE") {
      item.flags = Number(item.fields.find(([code]) => code === 70)?.[1] ?? 0);
      item.points = item.vertices.map((v) => ({ x: Number(v.fields.find(([code]) => code === 10)?.[1]), y: Number(v.fields.find(([code]) => code === 20)?.[1]) }));
    } else if (item.type === "LINE") item.geometry = [{ x: numeric(item, 10), y: numeric(item, 20) }, { x: numeric(item, 11), y: numeric(item, 21) }];
    else if (item.type === "POINT") item.geometry = [{ x: numeric(item, 10), y: numeric(item, 20) }];
    else if (item.type === "CIRCLE") item.geometry = [{ x: numeric(item, 10), y: numeric(item, 20) }, { radius: numeric(item, 40) }];
  }
  return { name, version: variable("$ACADVER", 1), units: variable("$INSUNITS", 70), entities };
}

function invalidGeometry(doc) {
  const invalid = [];
  for (const entity of doc.entities) {
    let coordinates;
    if (entity.type === "POLYLINE") coordinates = entity.points.flatMap(({ x, y }) => [x, y]);
    else if (entity.type === "LINE" || entity.type === "POINT") coordinates = (entity.geometry ?? []).flatMap(({ x, y }) => [x, y]);
    else if (entity.type === "CIRCLE") coordinates = (entity.geometry ?? []).flatMap((value) => "radius" in value ? [value.radius] : [value.x, value.y]);
    else continue;
    if (coordinates.length === 0 || coordinates.some((value) => !Number.isFinite(value))) {
      invalid.push({ type: entity.type, layer: entity.layer, coordinateCount: coordinates.length,
        nonFiniteCount: coordinates.filter((value) => !Number.isFinite(value)).length });
    }
  }
  return invalid;
}

const inventory = (doc) => Object.fromEntries([...doc.entities.reduce((map, item) => {
  const key = `${item.type}/${item.layer ?? "<none>"}`;
  map.set(key, (map.get(key) ?? 0) + 1);
  return map;
}, new Map())].sort(([a], [b]) => a.localeCompare(b)));
const layers = (doc) => [...new Set(doc.entities.map((item) => item.layer).filter(Boolean))].sort();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function polylineResidual(a, b) {
  if (a.points.length !== b.points.length || !a.points.length || !((a.flags & 1) && (b.flags & 1))) return Infinity;
  let best = Infinity;
  for (let start = 0; start < a.points.length; start += 1) for (const direction of [1, -1]) {
    let worst = 0;
    for (let i = 0; i < a.points.length; i += 1) {
      const index = (start + direction * i + b.points.length * 2) % b.points.length;
      worst = Math.max(worst, distance(a.points[i], b.points[index]));
    }
    best = Math.min(best, worst);
  }
  return best;
}
function entityResidual(a, b) {
  if (a.type !== b.type || a.layer !== b.layer) return Infinity;
  if (a.type === "POLYLINE") return polylineResidual(a, b);
  if (!a.geometry || !b.geometry || a.geometry.length !== b.geometry.length) return Infinity;
  if (a.type === "LINE") return Math.min(
    Math.max(distance(a.geometry[0], b.geometry[0]), distance(a.geometry[1], b.geometry[1])),
    Math.max(distance(a.geometry[0], b.geometry[1]), distance(a.geometry[1], b.geometry[0])),
  );
  if (a.type === "POINT") return distance(a.geometry[0], b.geometry[0]);
  if (a.type === "CIRCLE") return Math.max(distance(a.geometry[0], b.geometry[0]), Math.abs(a.geometry[1].radius - b.geometry[1].radius));
  return Infinity;
}
function matchGroup(source, target) {
  const edges = source.map((a) => target.map((b, j) => ({ j, residual: entityResidual(a, b) })).filter((item) => item.residual <= toleranceCm).sort((a, b) => a.residual - b.residual).map((item) => item.j));
  const assignment = Array(target.length).fill(-1);
  const visit = (i, seen) => {
    for (const j of edges[i] ?? []) {
      if (seen.has(j)) continue;
      seen.add(j);
      if (assignment[j] === -1 || visit(assignment[j], seen)) { assignment[j] = i; return true; }
    }
    return false;
  };
  let matched = 0;
  for (let i = 0; i < source.length; i += 1) if (visit(i, new Set())) matched += 1;
  const nearest = source.map((item) => Math.min(Infinity, ...target.map((candidate) => entityResidual(item, candidate))));
  return { sourceCount: source.length, targetCount: target.length, matchedWithinTolerance: matched, maxNearestCm: nearest.length ? Math.max(...nearest) : 0, unbounded: nearest.filter((value) => !Number.isFinite(value)).length };
}
function compareEntities(source, target, predicate = () => true) {
  const filteredSource = source.entities.filter(predicate);
  const filteredTarget = target.entities.filter(predicate);
  const keys = [...new Set([...filteredSource, ...filteredTarget].map((item) => `${item.type}/${item.layer ?? "<none>"}`))].sort();
  const groups = keys.map((key) => {
    const [type, layer] = [key.slice(0, key.indexOf("/")), key.slice(key.indexOf("/") + 1)];
    return { key, ...matchGroup(filteredSource.filter((item) => item.type === type && (item.layer ?? "<none>") === layer), filteredTarget.filter((item) => item.type === type && (item.layer ?? "<none>") === layer)) };
  });
  return { groups, sourceCount: filteredSource.length, targetCount: filteredTarget.length, matched: groups.reduce((sum, group) => sum + group.matchedWithinTolerance, 0), maxNearestCm: Math.max(0, ...groups.map((group) => group.maxNearestCm)), pass: groups.every((group) => group.sourceCount === group.targetCount && group.matchedWithinTolerance === group.sourceCount) };
}
function comparePair(a, b) {
  const sameInventory = JSON.stringify(inventory(a)) === JSON.stringify(inventory(b));
  const sameLayers = JSON.stringify(layers(a)) === JSON.stringify(layers(b));
  const cut = compareEntities(a, b, (item) => item.type === "POLYLINE" && item.layer === "CUT");
  const sew = compareEntities(a, b, (item) => item.type === "POLYLINE" && item.layer === "SEW");
  const marks = compareEntities(a, b, (item) => item.layer?.startsWith("MARK_"));
  return { sameInventory, sameLayers, cut, sew, marks, pass: sameInventory && sameLayers && cut.pass && sew.pass && marks.pass };
}

assert.equal(manifest.optionCaseCount, 73);
assert.equal(conversions.total, 73);
const conversionByCase = new Map(conversions.cases.map((item) => [item.caseId, item]));
const cases = [];
for (const fixture of manifest.cases) {
  const conversion = conversionByCase.get(fixture.caseId);
  assert(conversion, `${fixture.caseId}: missing conversion record`);
  if (!conversion.firstSha256 || !conversion.secondSha256) {
    cases.push({ caseId: fixture.caseId, recipeId: fixture.recipeId, firstPass: false, reopenPass: false, failure: conversion.failure, hashes: conversion });
    continue;
  }
  const inputBytes = await readFile(`${root}/Input/${fixture.file}`);
  const firstBytes = await readFile(conversion.firstPath);
  const secondBytes = await readFile(conversion.secondPath);
  assert.equal(sha(inputBytes), fixture.sha256, `${fixture.caseId}: input hash mismatch`);
  assert.equal(sha(firstBytes), conversion.firstSha256, `${fixture.caseId}: first-generation hash mismatch`);
  assert.equal(sha(secondBytes), conversion.secondSha256, `${fixture.caseId}: second-generation hash mismatch`);
  const input = parseDxf(fixture.file, inputBytes);
  const first = parseDxf(`${fixture.caseId}-r14.dxf`, firstBytes);
  const second = parseDxf(`${fixture.caseId}-r14-reopened.dxf`, secondBytes);
  const sourceInvalidGeometry = invalidGeometry(input);
  const receiverInvalidGeometry = invalidGeometry(first);
  const firstComparison = sourceInvalidGeometry.length === 0 ? comparePair(input, first) : null;
  const secondComparison = comparePair(first, second);
  const versionPass = first.version === "AC1014" && second.version === "AC1014";
  const sourcePreflightPass = sourceInvalidGeometry.length === 0;
  const firstPass = sourcePreflightPass && versionPass && firstComparison.pass;
  const reopenPass = secondComparison.pass && conversion.byteIdentical;
  cases.push({
    caseId: fixture.caseId,
    recipeId: fixture.recipeId,
    options: fixture.completeOptions,
    pieceCount: fixture.pieceCount,
    sourceVersion: input.version,
    firstVersion: first.version,
    secondVersion: second.version,
    units: { source: input.units, first: first.units, second: second.units },
    sourceInventory: inventory(input),
    firstInventory: inventory(first),
    secondInventory: inventory(second),
    firstComparison,
    secondComparison,
    sourcePreflightPass,
    sourceInvalidGeometry,
    receiverInvalidGeometry,
    byteIdentical: conversion.byteIdentical,
    firstSha256: conversion.firstSha256,
    secondSha256: conversion.secondSha256,
    firstPass,
    reopenPass,
  });
}
const report = {
  slice: "S627",
  receiver: "Open CAD Studio v2026.40.1 local Windows portable CLI",
  thresholdCm: toleranceCm,
  fixtureManifestSha256: sha(await readFile(`${root}/Evidence/fixture-manifest.json`)).toUpperCase(),
  conversionRecordSha256: sha(await readFile(`${root}/Evidence/conversion-record.json`)).toUpperCase(),
  sourceCaseCount: manifest.cases.length,
  recipeCounts: manifest.supportedRecipes,
  entityScope: "Closed CUT and SEW polylines plus all named MARK_* point, line and circle entities, matched one-to-one within each file; no piece/revision semantic IDs are inferred.",
  cases,
  summary: {
    firstPasses: cases.filter((item) => item.firstPass).length,
    reopenPasses: cases.filter((item) => item.reopenPass).length,
    byteIdenticalSecondGenerations: cases.filter((item) => item.byteIdentical).length,
    cutEntities: cases.reduce((sum, item) => sum + Object.entries(item.sourceInventory ?? {}).filter(([key]) => key.endsWith("/CUT")).reduce((n, [, count]) => n + count, 0), 0),
    markEntities: cases.reduce((sum, item) => sum + Object.entries(item.sourceInventory ?? {}).filter(([key]) => key.includes("/MARK_")).reduce((n, [, count]) => n + count, 0), 0),
    allPass: cases.length === manifest.cases.length && cases.every((item) => item.firstPass && item.reopenPass),
    missingUnitsMetadata: cases.filter((item) => item.units && item.units.source === null).length,
    invalidSourceFixtureCount: cases.filter((item) => item.sourcePreflightPass === false).length,
    receiverGeometryComparisonCount: cases.filter((item) => item.firstComparison !== null).length,
    sourceInvalidGeometryEntityCounts: cases.flatMap((item) => item.sourceInvalidGeometry ?? []).reduce((counts, item) => {
      const key = `${item.type}/${item.layer ?? "<none>"}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
  },
};
await writeFile(`${root}/Evidence/roundtrip-analysis.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ summary: report.summary, failures: cases.filter((item) => !item.firstPass || !item.reopenPass).map((item) => ({ caseId: item.caseId, sourcePreflightPass: item.sourcePreflightPass, sourceInvalidGeometry: item.sourceInvalidGeometry, firstPass: item.firstPass, reopenPass: item.reopenPass, versions: [item.firstVersion, item.secondVersion], errors: item.failure })), output: `${root}/Evidence/roundtrip-analysis.json` }, null, 2));
