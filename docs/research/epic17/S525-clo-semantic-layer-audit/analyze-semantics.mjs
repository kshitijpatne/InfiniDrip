import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceRoot = "C:/G04-CLO-DXF-Exchange/S524-independent-local-aama-receiver";
const sourceManifest = JSON.parse(await readFile(`${sourceRoot}/Evidence/fixture-manifest.json`, "utf8"));
const s498 = "C:/G04-CLO-DXF-Exchange/S498-practical-retest";
const s523 = "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip";
const outputRoot = "C:/G04-CLO-DXF-Exchange/S525-clo-semantic-layer-audit";
const tolerance = 0.001;
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const value = (entity, code) => entity.pairs.find(([group]) => group === code)?.[1];

function parseSections(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: complete group-code/value pairs`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `${label}: group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const sections = [];
  let current;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      assert.equal(pairs[i + 1]?.[0], 2, `${label}: section name`);
      current = { name: pairs[i + 1][1], records: [] };
      sections.push(current);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") current = undefined;
    else if (current) current.records.push(pairs[i]);
  }
  return { pairs, sections };
}

function entitiesFrom(records) {
  const entities = [];
  for (let i = 0; i < records.length;) {
    if (records[i][0] !== 0) { i++; continue; }
    const type = records[i][1];
    const entity = { type, pairs: [records[i++]] };
    while (i < records.length && records[i][0] !== 0) entity.pairs.push(records[i++]);
    if (type === "POLYLINE") {
      entity.vertices = [];
      while (i < records.length && records[i][0] === 0 && records[i][1] === "VERTEX") {
        const vertex = { pairs: [records[i++]] };
        while (i < records.length && records[i][0] !== 0) vertex.pairs.push(records[i++]);
        entity.vertices.push({ x: Number(value(vertex, 10)), y: Number(value(vertex, 20)) });
      }
      if (records[i]?.[0] === 0 && records[i][1] === "SEQEND") {
        i++;
        while (i < records.length && records[i][0] !== 0) i++;
      }
      entity.closed = (Number(value(entity, 70) ?? 0) & 1) === 1;
    }
    entities.push(entity);
  }
  return entities;
}

function parseFile(bytes, label) {
  const parsed = parseSections(bytes, label);
  const sections = parsed.sections.map((section) => ({
    name: section.name,
    entities: entitiesFrom(section.records),
  }));
  const blockSection = sections.find(({ name }) => name === "BLOCKS");
  const blocks = [];
  let activeBlock;
  for (const entity of blockSection?.entities ?? []) {
    if (entity.type === "BLOCK") {
      activeBlock = { name: value(entity, 2), entities: [] };
      blocks.push(activeBlock);
    } else if (entity.type === "ENDBLK") activeBlock = undefined;
    else if (activeBlock) activeBlock.entities.push(entity);
  }
  const inserts = (sections.find(({ name }) => name === "ENTITIES")?.entities ?? [])
    .filter(({ type }) => type === "INSERT")
    .map((entity) => value(entity, 2));
  const modelEntities = (sections.find(({ name }) => name === "ENTITIES")?.entities ?? [])
    .filter(({ type }) => type !== "INSERT");
  return { sections, blocks, inserts, modelEntities };
}

function geometry(entity) {
  const n = (code) => Number(value(entity, code));
  if (entity.type === "POLYLINE") return { type: entity.type, closed: entity.closed, points: entity.vertices };
  if (entity.type === "LINE") return { type: entity.type, points: [{ x: n(10), y: n(20) }, { x: n(11), y: n(21) }] };
  if (entity.type === "POINT") return { type: entity.type, points: [{ x: n(10), y: n(20) }] };
  if (entity.type === "CIRCLE" || entity.type === "ARC") return {
    type: entity.type, center: { x: n(10), y: n(20) }, radius: n(40),
    startAngle: entity.type === "ARC" ? n(50) : undefined,
    endAngle: entity.type === "ARC" ? n(51) : undefined,
  };
  if (entity.type === "TEXT") return {
    type: entity.type, text: value(entity, 1), point: { x: n(10), y: n(20) },
    height: n(40), rotation: n(50),
  };
  return null;
}

function near(a, b) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance; }
function samePoint(a, b) { return near(a.x, b.x) && near(a.y, b.y); }

function sameGeometry(a, b) {
  const left = geometry(a); const right = geometry(b);
  if (!left || !right || left.type !== right.type) return false;
  if (left.points) {
    if (left.points.length !== right.points?.length) return false;
    if (left.closed !== undefined && left.closed !== right.closed) return false;
    if (left.closed) {
      const count = left.points.length;
      for (let offset = 0; offset < count; offset++) for (const direction of [1, -1]) {
        if (left.points.every((point, index) => samePoint(point, right.points[(offset + direction * index + count * 2) % count]))) return true;
      }
      return false;
    }
    const direct = left.points.every((point, index) => samePoint(point, right.points[index]));
    const reverse = left.points.every((point, index) => samePoint(point, right.points[left.points.length - 1 - index]));
    return direct || reverse;
  }
  if (left.center) return samePoint(left.center, right.center) && near(left.radius, right.radius) &&
    (left.startAngle === undefined || near(left.startAngle, right.startAngle)) &&
    (left.endAngle === undefined || near(left.endAngle, right.endAngle));
  if (left.point) return left.text === right.text && samePoint(left.point, right.point) &&
    near(left.height, right.height) && near(left.rotation ?? 0, right.rotation ?? 0);
  return false;
}

function sourcePieces(source, fixture) {
  const model = source.sections.find(({ name }) => name === "ENTITIES");
  assert.ok(model, `${fixture.recipe}: source ENTITIES`);
  const groups = [];
  let current;
  for (const entity of model.entities) {
    const layer = value(entity, 8) ?? "(none)";
    if (entity.type === "POLYLINE" && layer === "CUT") {
      current = { entities: [] };
      groups.push(current);
    }
    assert.ok(current, `${fixture.recipe}: entity precedes first CUT`);
    current.entities.push({ ...entity, layer });
  }
  assert.equal(groups.length, fixture.pieceCount, `${fixture.recipe}: CUT contour count maps to source piece count`);
  assert.deepEqual(groups.map(({ entities }) => entities.filter(({ layer, type }) => layer === "SEW" && type === "POLYLINE").length),
    Array(fixture.pieceCount).fill(1), `${fixture.recipe}: each source piece has one SEW outline`);
  return groups.map((group, index) => ({ name: fixture.pieceNames[index], index, entities: group.entities }));
}

function mappingFor(fixture, pieces, receiver) {
  const outputBlocks = receiver.blocks;
  const receiverGeometry = [
    ...outputBlocks.flatMap((block) => block.entities.map((entity) => ({ entity, location: "block", block: block.name }))),
    ...receiver.modelEntities.map((entity) => ({ entity, location: "modelspace", block: null })),
  ];
  const pieceMap = pieces.map((piece) => {
    const cut = piece.entities.filter(({ layer, type }) => layer === "CUT" && type === "POLYLINE");
    const sew = piece.entities.filter(({ layer, type }) => layer === "SEW" && type === "POLYLINE");
    const candidates = outputBlocks.map((block) => ({
      block: block.name,
      matchedCutCount: cut.filter((sourceEntity) => block.entities.some((outputEntity) => sameGeometry(sourceEntity, outputEntity))).length,
      matchedSewCount: sew.filter((sourceEntity) => block.entities.some((outputEntity) => sameGeometry(sourceEntity, outputEntity))).length,
      outputClosedPolylineCount: block.entities.filter(({ type, closed }) => type === "POLYLINE" && closed).length,
    })).filter(({ matchedCutCount, matchedSewCount }) => matchedCutCount > 0 || matchedSewCount > 0);
    const sewIdentityCandidates = candidates.filter(({ matchedSewCount }) => matchedSewCount === sew.length);
    return { piece: piece.name, sourceIndex: piece.index, cutOutlineCount: cut.length, sewOutlineCount: sew.length,
      sewIdentityCandidates, cutCandidates: candidates.filter(({ matchedCutCount }) => matchedCutCount === cut.length), candidates };
  });

  const sourceEntities = pieces.flatMap((piece) => piece.entities.map((entity) => ({ ...entity, piece: piece.name })));
  const sourceSemanticCoverage = new Map();
  for (const sourceEntity of sourceEntities) {
    const outputMatches = receiverGeometry.filter(({ entity }) => sameGeometry(sourceEntity, entity))
      .map(({ entity, location, block }) => ({ location, block, layer: value(entity, 8) ?? "(none)" }));
    const key = `${sourceEntity.layer}/${sourceEntity.type}`;
    const row = sourceSemanticCoverage.get(key) ?? { sourceLayer: sourceEntity.layer, sourceType: sourceEntity.type, sourceEntityCount: 0, matchedCount: 0, missingCount: 0, multiBlockMatchCount: 0, outputLayerMultiplicity: {} };
    row.sourceEntityCount++;
    if (!outputMatches.length) row.missingCount++;
    else {
      row.matchedCount++;
      if (new Set(outputMatches.map(({ location, block }) => `${location}/${block ?? ""}`)).size > 1) row.multiBlockMatchCount++;
      for (const { layer } of outputMatches) row.outputLayerMultiplicity[layer] = (row.outputLayerMultiplicity[layer] ?? 0) + 1;
    }
    sourceSemanticCoverage.set(key, row);
  }
  const layerMap = new Map();
  let matchedOutputEntityCount = 0;
  let ambiguousOutputEntityCount = 0;
  let unmatchedOutputEntityCount = 0;
  for (const { entity: outputEntity, location } of receiverGeometry) {
    const matches = sourceEntities.filter((sourceEntity) => sameGeometry(sourceEntity, outputEntity));
    const layer = value(outputEntity, 8) ?? "(none)";
    const row = layerMap.get(layer) ?? { layer, outputEntityCount: 0, matchedCount: 0, ambiguousCount: 0, unmatchedCount: 0, sourceSemantics: {}, sourcePieces: {}, outputTypes: {}, locations: {} };
    row.outputEntityCount++;
    row.outputTypes[outputEntity.type] = (row.outputTypes[outputEntity.type] ?? 0) + 1;
    row.locations[location] = (row.locations[location] ?? 0) + 1;
    if (!matches.length) { row.unmatchedCount++; unmatchedOutputEntityCount++; }
    else {
      row.matchedCount++; matchedOutputEntityCount++;
      const semantics = [...new Set(matches.map(({ layer: sourceLayer }) => sourceLayer))];
      const sourceNames = [...new Set(matches.map(({ piece }) => piece))];
      if (semantics.length > 1 || sourceNames.length > 1) { row.ambiguousCount++; ambiguousOutputEntityCount++; }
      for (const semantic of semantics) row.sourceSemantics[semantic] = (row.sourceSemantics[semantic] ?? 0) + 1;
      for (const piece of sourceNames) row.sourcePieces[piece] = (row.sourcePieces[piece] ?? 0) + 1;
    }
    layerMap.set(layer, row);
  }

  const uniquePieceIdentity = pieceMap.every(({ candidates }) => candidates.length === 1) &&
    new Set(pieceMap.map(({ sewIdentityCandidates }) => sewIdentityCandidates[0]?.block)).size === fixture.pieceCount &&
    pieceMap.every(({ sewIdentityCandidates }) => sewIdentityCandidates.length === 1) &&
    outputBlocks.length === fixture.pieceCount && receiver.inserts.length === fixture.pieceCount;
  const mixedSemanticLayerCount = [...layerMap.values()].filter(({ sourceSemantics }) => Object.keys(sourceSemantics).length > 1).length;
  const sourceLayerFanout = new Map();
  for (const { layer, sourceSemantics } of layerMap.values()) for (const sourceLayer of Object.keys(sourceSemantics)) {
    const layers = sourceLayerFanout.get(sourceLayer) ?? [];
    layers.push(layer);
    sourceLayerFanout.set(sourceLayer, layers);
  }
  return {
    recipe: fixture.recipe,
    source: { file: fixture.file, sha256: fixture.sha256, pieces: fixture.pieceNames, entityCounts: fixture.entityCounts },
    receiver: { blocks: outputBlocks.map((block) => ({ name: block.name, entityCount: block.entities.length })), insertBlockNames: receiver.inserts, insertCount: receiver.inserts.length, modelspaceNonInsertEntities: receiver.modelEntities.length },
    pieceMap,
    sourceSemanticCoverage: [...sourceSemanticCoverage.values()].sort((a, b) => `${a.sourceLayer}/${a.sourceType}`.localeCompare(`${b.sourceLayer}/${b.sourceType}`)),
    outputLayerMap: [...layerMap.values()].sort((a, b) => a.layer.localeCompare(b.layer, undefined, { numeric: true })),
    sourceLayerFanout: Object.fromEntries([...sourceLayerFanout].map(([sourceLayer, layers]) => [sourceLayer, [...new Set(layers)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))])),
    totals: { sourceEntities: sourceEntities.length, receiverBlockEntities: outputBlocks.reduce((sum, block) => sum + block.entities.length, 0), receiverModelspaceEntities: receiver.modelEntities.length, matchedOutputEntityCount, ambiguousOutputEntityCount, unmatchedOutputEntityCount, uniquePieceIdentity, mixedSemanticLayerCount, sourceEntitiesWithoutDirectGeometryMatch: [...sourceSemanticCoverage.values()].reduce((sum, row) => sum + row.missingCount, 0) },
  };
}

const recipes = [];
for (const fixture of sourceManifest.fixtures) {
  const sourceBytes = await readFile(`${sourceRoot}/Input/${fixture.file}`);
  assert.equal(digest(sourceBytes), fixture.sha256, `${fixture.recipe}: source hash`);
  const source = parseFile(sourceBytes, `${fixture.recipe} source`);
  const pieces = sourcePieces(source, fixture);
  let outputFile; let outputBytes; let observedExportFormat;
  if (["tee", "polo", "woven-shirt"].includes(fixture.recipe)) {
    const fileNames = { tee: "tee-standard-m-s498-generation-2.dxf", polo: "polo-standard-m-s498-generation-2.dxf", "woven-shirt": "woven-shirt-standard-m-s498-generation-2.dxf" };
    const sourceRootBytes = await readFile(`C:/G04-CLO-DXF-Exchange/Input/${fixture.file}`);
    assert.equal(digest(sourceRootBytes), fixture.sha256, `${fixture.recipe}: S498 receiver source hash`);
    outputFile = `${s498}/Output/${fileNames[fixture.recipe]}`;
    outputBytes = await readFile(outputFile);
    observedExportFormat = "DXF-ASTM";
  } else {
    const s523Manifest = JSON.parse(await readFile(`${s523}/Evidence/fixture-manifest.json`, "utf8"));
    const s523Fixture = s523Manifest.fixtures.find(({ recipe }) => recipe === fixture.recipe);
    assert.ok(s523Fixture, `${fixture.recipe}: S523 manifest entry`);
    assert.equal(s523Fixture.sha256, fixture.sha256, `${fixture.recipe}: S523 and current source hash`);
    outputFile = `${s523}/Output/${fixture.recipe}-aama-roundtrip-02.dxf`;
    outputBytes = await readFile(outputFile);
    observedExportFormat = "DXF-AAMA";
  }
  const output = parseFile(outputBytes, `${fixture.recipe} CLO generation two`);
  assert.equal(output.blocks.length, fixture.pieceCount, `${fixture.recipe}: output piece block count`);
  assert.equal(output.inserts.length, fixture.pieceCount, `${fixture.recipe}: output insert count`);
  recipes.push({ ...mappingFor(fixture, pieces, output), observedExportFormat, receiverFile: outputFile, receiverSha256: digest(outputBytes), receiverBytes: outputBytes.byteLength });
}

const result = {
  receiver: "CLO 2026.1.310 (r58944), observed generation-two outputs; format recorded per recipe",
  sourceRevision: sourceManifest.generatedAtCommit,
  toleranceCm: tolerance,
  method: "Match source entities to receiver block entities and non-INSERT modelspace entities by entity kind and geometric fields at 0.001 cm. Closed polyline vertices allow cyclic/reverse order. The report calls unmatched records 'without direct geometry match'; this alone does not prove data loss or explain converted/derived geometry. Numeric layer identity is never assumed to equal semantic name.",
  recipes,
  summary: {
    recipes: recipes.length,
    recipesWithUniquePieceIdentity: recipes.filter(({ totals }) => totals.uniquePieceIdentity).length,
    recipesWithNoMixedSemanticLayers: recipes.filter(({ totals }) => totals.mixedSemanticLayerCount === 0).length,
    mixedSemanticLayerCount: recipes.reduce((sum, { totals }) => sum + totals.mixedSemanticLayerCount, 0),
    ambiguousOutputEntityCount: recipes.reduce((sum, { totals }) => sum + totals.ambiguousOutputEntityCount, 0),
    unmatchedOutputEntityCount: recipes.reduce((sum, { totals }) => sum + totals.unmatchedOutputEntityCount, 0),
    sourceEntitiesWithoutDirectGeometryMatch: recipes.reduce((sum, { totals }) => sum + totals.sourceEntitiesWithoutDirectGeometryMatch, 0),
    uniqueSewIdentityPieces: recipes.reduce((sum, { pieceMap }) => sum + pieceMap.filter(({ sewIdentityCandidates }) => sewIdentityCandidates.length === 1).length, 0),
  },
};
await mkdir(`${outputRoot}/Evidence`, { recursive: true });
await writeFile(`${outputRoot}/Evidence/semantic-layer-audit.json`, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ summary: result.summary, recipes: recipes.map(({ recipe, observedExportFormat, totals, pieceMap, sourceSemanticCoverage, sourceLayerFanout, outputLayerMap }) => ({ recipe, observedExportFormat, totals, uniqueSewPieces: pieceMap.filter(({ sewIdentityCandidates }) => sewIdentityCandidates.length === 1).map(({ piece, sewIdentityCandidates }) => ({ piece, block: sewIdentityCandidates[0].block })), sourceSemanticCoverage, sourceLayerFanout, outputLayers: outputLayerMap.map(({ layer, outputEntityCount, sourceSemantics, ambiguousCount, unmatchedCount }) => ({ layer, outputEntityCount, sourceSemantics, ambiguousCount, unmatchedCount })) })) }, null, 2));
