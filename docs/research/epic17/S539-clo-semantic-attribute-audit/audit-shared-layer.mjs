import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const exchangeRoot = "C:/G04-CLO-DXF-Exchange";
const semanticAuditPath = `${exchangeRoot}/S525-clo-semantic-layer-audit/Evidence/semantic-layer-audit.json`;
const sourceRoot = `${exchangeRoot}/S524-independent-local-aama-receiver`;
const outputRoot = `${exchangeRoot}/S539-clo-semantic-attribute-audit/Evidence`;
const toleranceCm = 0.001;
const propertyCodes = [6, 62, 420, 370, 60, 70, 39, 48, 67, 210, 220, 230, 347, 390, 410];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const get = (pairs, code) => pairs.find(([group]) => group === code)?.[1];

function parseFile(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: complete group-code/value pairs`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, `${label}: valid group code at ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1]]);
  }
  const sections = new Map();
  let current;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      assert.equal(pairs[i + 1]?.[0], 2, `${label}: section name`);
      current = [];
      sections.set(pairs[i + 1][1], current);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") current = undefined;
    else if (current) current.push(pairs[i]);
  }
  function entities(records = []) {
    const result = [];
    for (let i = 0; i < records.length;) {
      if (records[i][0] !== 0) { i++; continue; }
      const type = records[i][1];
      const entity = { type, pairs: [records[i++]], vertices: [] };
      while (i < records.length && records[i][0] !== 0) entity.pairs.push(records[i++]);
      if (type === "POLYLINE") {
        while (i < records.length && records[i][0] === 0 && records[i][1] === "VERTEX") {
          const vertex = { pairs: [records[i++]] };
          while (i < records.length && records[i][0] !== 0) vertex.pairs.push(records[i++]);
          entity.vertices.push(vertex);
        }
        if (records[i]?.[0] === 0 && records[i][1] === "SEQEND") {
          i++;
          while (i < records.length && records[i][0] !== 0) i++;
        }
        entity.closed = (Number(get(entity.pairs, 70) ?? 0) & 1) === 1;
      }
      result.push(entity);
    }
    return result;
  }
  const blockEntities = entities(sections.get("BLOCKS"));
  const blocks = [];
  let active;
  for (const entity of blockEntities) {
    if (entity.type === "BLOCK") {
      active = { name: get(entity.pairs, 2), entities: [] };
      blocks.push(active);
    } else if (entity.type === "ENDBLK") active = undefined;
    else if (active) active.entities.push(entity);
  }
  const modelEntities = entities(sections.get("ENTITIES"));
  const inserts = modelEntities.filter((e) => e.type === "INSERT");
  return { sections, blocks, modelEntities, inserts };
}

function coordinates(entity) {
  return entity.vertices.map(({ pairs }) => ({ x: Number(get(pairs, 10)), y: Number(get(pairs, 20)) }));
}
function near(a, b) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= toleranceCm; }
function samePoint(a, b) { return near(a.x, b.x) && near(a.y, b.y); }
function sameClosedPolyline(a, b) {
  if (a.type !== "POLYLINE" || b.type !== "POLYLINE" || !a.closed || !b.closed) return false;
  const left = coordinates(a); const right = coordinates(b);
  if (left.length !== right.length) return false;
  for (let offset = 0; offset < left.length; offset++) for (const direction of [1, -1]) {
    if (left.every((point, i) => samePoint(point, right[(offset + direction * i + left.length * 2) % left.length]))) return true;
  }
  return false;
}
function attrs(entity) {
  const result = {};
  for (const code of propertyCodes) {
    const values = entity.pairs.filter(([group]) => group === code).map(([, value]) => value.trim());
    if (values.length) result[String(code)] = [...new Set(values)];
  }
  const headerLayer = get(entity.pairs, 8)?.trim() ?? "(none)";
  const vertexLayers = [...new Set(entity.vertices.flatMap(({ pairs }) => pairs.filter(([code]) => code === 8).map(([, value]) => value.trim())))];
  result["vertexLayerOverrides"] = vertexLayers.filter((layer) => layer !== headerLayer).sort();
  result["xdataApps"] = [...new Set(entity.pairs.filter(([code]) => code === 1001).map(([, value]) => value.trim()))].sort();
  return result;
}
function stableString(value) { return JSON.stringify(value); }
function unique(values) { return [...new Set(values.map(stableString))].sort().map((entry) => JSON.parse(entry)); }

const audit = JSON.parse(await readFile(semanticAuditPath, "utf8"));
const fixtureManifest = JSON.parse(await readFile(`${sourceRoot}/Evidence/fixture-manifest.json`, "utf8"));
assert.equal(audit.recipes.length, 7, "S525 contains all seven recipes");
assert.equal(fixtureManifest.fixtures.length, 7, "source manifest contains all seven recipes");
const rows = [];
const roleValuesByCode = new Map();
let hashedInputs = 0;
for (const recipeAudit of audit.recipes) {
  const fixture = fixtureManifest.fixtures.find(({ recipe }) => recipe === recipeAudit.recipe);
  assert.ok(fixture, `${recipeAudit.recipe}: pinned source fixture`);
  const sourceBytes = await readFile(`${sourceRoot}/Input/${fixture.file}`);
  assert.equal(hash(sourceBytes), fixture.sha256, `${fixture.recipe}: source hash`);
  const source = parseFile(sourceBytes, `${fixture.recipe} source`);
  const receiverBytes = await readFile(recipeAudit.receiverFile);
  assert.equal(hash(receiverBytes), recipeAudit.receiverSha256, `${fixture.recipe}: receiver hash`);
  const receiver = parseFile(receiverBytes, `${fixture.recipe} receiver`);
  hashedInputs += 2;
  const sourceEntities = (source.sections.get("ENTITIES") ?? []).length;
  assert.ok(sourceEntities > 0, `${fixture.recipe}: parsed source entities`);
  const sourceModel = parseFile(sourceBytes, `${fixture.recipe} source model`).modelEntities;
  const pieces = [];
  let activePiece;
  for (const entity of sourceModel) {
    const layer = get(entity.pairs, 8)?.trim() ?? "(none)";
    if (entity.type === "POLYLINE" && layer === "CUT") {
      activePiece = { cut: entity, sew: [] };
      pieces.push(activePiece);
    } else if (activePiece && entity.type === "POLYLINE" && layer === "SEW") activePiece.sew.push(entity);
  }
  assert.equal(pieces.length, fixture.pieceCount, `${fixture.recipe}: source piece count`);
  const recipeRow = { recipe: fixture.recipe, format: recipeAudit.observedExportFormat, sourceSha256: fixture.sha256, receiverSha256: recipeAudit.receiverSha256, pieces: [] };
  for (const pieceMap of recipeAudit.pieceMap) {
    const blockName = pieceMap.sewIdentityCandidates[0]?.block;
    assert.ok(blockName, `${fixture.recipe}/${pieceMap.piece}: S525 piece mapping`);
    const block = receiver.blocks.find(({ name }) => name === blockName);
    assert.ok(block, `${fixture.recipe}/${pieceMap.piece}: receiver block ${blockName}`);
    const sourcePiece = pieces[pieceMap.sourceIndex];
    assert.ok(sourcePiece, `${fixture.recipe}/${pieceMap.piece}: source piece index`);
    assert.equal(sourcePiece.sew.length, 1, `${fixture.recipe}/${pieceMap.piece}: unique source sew contour`);
    const roles = {};
    for (const [role, sourceContour] of [["CUT", sourcePiece.cut], ["SEW", sourcePiece.sew[0]]]) {
      const directMatches = block.entities.filter((entity) => sameClosedPolyline(sourceContour, entity));
      const matches = directMatches.filter((entity) => get(entity.pairs, 8)?.trim() === "8");
      const propertyValues = matches.map((entity) => attrs(entity));
      roles[role] = { directBlockMatches: directMatches.length, layer8Matches: matches.length, properties: unique(propertyValues) };
      for (const entry of propertyValues) for (const [code, values] of Object.entries(entry)) {
        const key = `${recipeAudit.observedExportFormat}/${code}`;
        const row = roleValuesByCode.get(key) ?? { format: recipeAudit.observedExportFormat, code, CUT: [], SEW: [] };
        row[role].push(...values);
        roleValuesByCode.set(key, row);
      }
    }
    recipeRow.pieces.push({ piece: pieceMap.piece, block: blockName, roles });
  }
  rows.push(recipeRow);
}

const propertySummary = [...roleValuesByCode.values()].map((row) => ({
  format: row.format,
  property: row.code,
  distinctCUTValues: unique(row.CUT),
  distinctSEWValues: unique(row.SEW),
  disjoint: unique(row.CUT).every((cut) => !row.SEW.some((sew) => stableString(cut) === stableString(sew))),
  singleValuePerRole: unique(row.CUT).length === 1 && unique(row.SEW).length === 1,
})).sort((a, b) => `${a.format}/${a.property}`.localeCompare(`${b.format}/${b.property}`));
const result = {
  receiver: audit.receiver,
  method: `Reused S525 hash-pinned source/receiver cohort and piece map. Re-matched each source closed CUT/SEW polyline to output POLYLINE entities on numeric layer 8 in its S525 receiver block at ${toleranceCm} cm, allowing cyclic/reverse vertex order. Compared listed entity properties; no mapping is inferred from numeric layer alone.`,
  hashedSourceAndReceiverFiles: hashedInputs,
  sourceRevision: audit.sourceRevision,
  recipeCount: rows.length,
  propertyCodes: Object.fromEntries(propertyCodes.map((code) => [String(code), ({ 6:"linetype",62:"ACI color",420:"true color",370:"lineweight",60:"visibility",70:"entity flags",39:"thickness",48:"linetype scale",67:"paper-space flag",210:"extrusion X",220:"extrusion Y",230:"extrusion Z",347:"material handle",390:"plot-style handle",410:"layout" })[code]])),
  stableDiscriminatorsByObservedProfileCohort: propertySummary.filter((x) => x.disjoint && x.singleValuePerRole),
  propertySummary,
  recipes: rows,
};
await mkdir(outputRoot, { recursive: true });
const outputPath = `${outputRoot}/shared-layer-properties.json`;
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, reportSha256: hash(Buffer.from(`${JSON.stringify(result, null, 2)}\n`)), hashedInputs, recipeCount: rows.length, stableDiscriminators: result.stableDiscriminatorsByObservedProfileCohort, propertySummary }, null, 2));
