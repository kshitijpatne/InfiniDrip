import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceRoot = "C:/G04-CLO-DXF-Exchange/S524-independent-local-aama-receiver";
const semanticAuditPath = "C:/G04-CLO-DXF-Exchange/S557-mark-and-grade-evidence-audit/Evidence/semantic-layer-audit.json";
const outputRoot = "C:/G04-CLO-DXF-Exchange/S586-product-dxf-source-map/Evidence";
const fixtureCommit = "c3b3ee43ba7e0db834cee9a4e0ce5f51414f58a4";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

const manifest = JSON.parse(await readFile(`${sourceRoot}/Evidence/fixture-manifest.json`, "utf8"));
const audited = JSON.parse(await readFile(semanticAuditPath, "utf8"));
assert.equal(manifest.generatedAtCommit, fixtureCommit);
assert.equal(manifest.fixtures.length, 7);
assert.equal(audited.recipes.length, 7);
assert.equal(audited.sourceRevision, fixtureCommit);
assert.equal(audited.toleranceCm, 0.001);

// The M/default source DXFs were emitted by the same DXF and mark writers now
// in HEAD. This guards the comparison against stale fixture/writer assumptions.
execFileSync("git", ["diff", "--quiet", fixtureCommit, "HEAD", "--", "src/export/dxf.ts", "src/export/pattern-mark.ts"], { stdio: "ignore" });

function pairsFrom(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: complete group-code/value pairs`);
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    assert.match(lines[index].trim(), /^\d+$/, `${label}: group code`);
    pairs.push([Number(lines[index].trim()), lines[index + 1]]);
  }
  return pairs;
}

function inspectSource(bytes, label) {
  const pairs = pairsFrom(bytes, label);
  const sections = new Map();
  for (let index = 0; index < pairs.length; index += 1) {
    const [code, value] = pairs[index];
    if (code !== 0 || value !== "SECTION") continue;
    assert.equal(pairs[index + 1]?.[0], 2, `${label}: section name`);
    const name = pairs[++index][1];
    const records = [];
    while (index + 1 < pairs.length && !(pairs[index + 1][0] === 0 && pairs[index + 1][1] === "ENDSEC")) {
      records.push(pairs[++index]);
    }
    sections.set(name, records);
  }
  const records = sections.get("ENTITIES");
  assert.ok(records, `${label}: ENTITIES section`);
  const entities = [];
  for (let index = 0; index < records.length;) {
    if (records[index][0] !== 0) { index += 1; continue; }
    const type = records[index][1];
    const entityPairs = [records[index++]];
    while (index < records.length && records[index][0] !== 0) entityPairs.push(records[index++]);
    if (type === "POLYLINE") {
      let vertices = 0;
      while (index < records.length && records[index][0] === 0 && records[index][1] === "VERTEX") {
        vertices += 1;
        index += 1;
        while (index < records.length && records[index][0] !== 0) index += 1;
      }
      assert.ok(records[index]?.[0] === 0 && records[index][1] === "SEQEND", `${label}: POLYLINE SEQEND`);
      index += 1;
      entityPairs.push([999, `VERTEX_COUNT:${vertices}`]);
    }
    const layer = entityPairs.find(([group]) => group === 8)?.[1] ?? "(none)";
    entities.push({ type, layer, vertexCount: Number(entityPairs.find(([group]) => group === 999)?.[1]?.split(":")[1] ?? 0) });
  }
  const counts = {};
  const byLayer = {};
  for (const entity of entities) {
    counts[entity.type] = (counts[entity.type] ?? 0) + 1;
    byLayer[entity.layer] ??= {};
    byLayer[entity.layer][entity.type] = (byLayer[entity.layer][entity.type] ?? 0) + 1;
  }
  return {
    sectionNames: [...sections.keys()],
    entityCounts: counts,
    entityCountsByLiteralLayer: byLayer,
    hasAcadver: pairs.some(([group, value]) => group === 9 && value === "$ACADVER"),
    hasInsunits: pairs.some(([group, value]) => group === 9 && value === "$INSUNITS"),
    hasExplicitTextLabels: entities.some(({ type }) => ["TEXT", "MTEXT", "ATTRIB", "ATTDEF"].includes(type)),
    hasBlocksOrInserts: sections.has("BLOCKS") || entities.some(({ type }) => type === "INSERT"),
  };
}

const recipes = [];
for (const fixture of manifest.fixtures) {
  const sourceBytes = await readFile(`${sourceRoot}/Input/${fixture.file}`);
  const sourceHash = sha256(sourceBytes);
  assert.equal(sourceHash, fixture.sha256.toUpperCase(), `${fixture.recipe}: source hash`);
  const receiver = audited.recipes.find(({ recipe }) => recipe === fixture.recipe);
  assert.ok(receiver, `${fixture.recipe}: audited receiver row`);
  assert.equal(receiver.source.sha256.toUpperCase(), sourceHash, `${fixture.recipe}: receiver audit source hash`);
  const receiverBytes = await readFile(receiver.receiverFile);
  const receiverHash = sha256(receiverBytes);
  assert.equal(receiverHash, receiver.receiverSha256.toUpperCase(), `${fixture.recipe}: generation-two CLO output hash`);
  const source = inspectSource(sourceBytes, `${fixture.recipe} source`);
  assert.equal(source.hasAcadver, false, `${fixture.recipe}: no version header in legacy source`);
  assert.equal(source.hasInsunits, false, `${fixture.recipe}: no units header in legacy source`);
  assert.equal(source.hasExplicitTextLabels, false, `${fixture.recipe}: no text labels in source`);
  assert.equal(source.hasBlocksOrInserts, false, `${fixture.recipe}: no named blocks/inserts in source`);
  assert.ok(source.entityCountsByLiteralLayer.CUT?.POLYLINE > 0, `${fixture.recipe}: CUT polylines`);
  assert.ok(source.entityCountsByLiteralLayer.SEW?.POLYLINE > 0, `${fixture.recipe}: SEW polylines`);
  const cuts = receiver.sourceSemanticCoverage.find(({ sourceLayer, sourceType }) => sourceLayer === "CUT" && sourceType === "POLYLINE");
  const sews = receiver.sourceSemanticCoverage.find(({ sourceLayer, sourceType }) => sourceLayer === "SEW" && sourceType === "POLYLINE");
  const marks = receiver.sourceSemanticCoverage.filter(({ sourceLayer }) => sourceLayer.startsWith("MARK_"));
  recipes.push({
    recipe: fixture.recipe,
    size: fixture.size,
    options: fixture.options,
    sourceFile: fixture.file,
    sourceSha256: sourceHash,
    sourcePieces: fixture.pieceNames,
    source: source,
    sourceCutSew: {
      cutPolylineCount: cuts?.sourceEntityCount ?? 0,
      cutDirectGeometryMatches: cuts?.matchedCount ?? 0,
      cutWithoutDirectGeometryMatch: cuts?.missingCount ?? 0,
      sewPolylineCount: sews?.sourceEntityCount ?? 0,
      sewDirectGeometryMatches: sews?.matchedCount ?? 0,
      sewWithoutDirectGeometryMatch: sews?.missingCount ?? 0,
    },
    sourceMarks: {
      entityCount: marks.reduce((sum, row) => sum + row.sourceEntityCount, 0),
      directGeometryMatches: marks.reduce((sum, row) => sum + row.matchedCount, 0),
      withoutDirectGeometryMatch: marks.reduce((sum, row) => sum + row.missingCount, 0),
    },
    cloGenerationTwo: {
      file: receiver.receiverFile,
      sha256: receiverHash,
      format: receiver.observedExportFormat,
      insertCount: receiver.receiver.insertCount,
      blockCount: receiver.receiver.blocks.length,
      identityBySewGeometry: receiver.totals.uniquePieceIdentity,
      outputLayers: receiver.outputLayerMap.map(({ layer, outputEntityCount, sourceSemantics }) => ({ layer, outputEntityCount, sourceSemantics })),
      mixedSemanticLayerCount: receiver.totals.mixedSemanticLayerCount,
    },
  });
}

const total = (selector) => recipes.reduce((sum, row) => sum + selector(row), 0);
assert.equal(recipes.length, 7);
assert.equal(total((row) => row.sourceCutSew.cutPolylineCount), 41);
assert.equal(total((row) => row.sourceCutSew.cutDirectGeometryMatches), 36);
assert.equal(total((row) => row.sourceCutSew.cutWithoutDirectGeometryMatch), 5);
assert.equal(total((row) => row.sourceCutSew.sewPolylineCount), 41);
assert.equal(total((row) => row.sourceCutSew.sewDirectGeometryMatches), 41);
assert.equal(total((row) => row.sourceMarks.entityCount), 100);
assert.equal(total((row) => row.sourceMarks.directGeometryMatches), 22);
assert.equal(total((row) => row.sourceMarks.withoutDirectGeometryMatch), 78);
assert.equal(total((row) => row.sourceCutSew.cutWithoutDirectGeometryMatch + row.sourceCutSew.sewWithoutDirectGeometryMatch + row.sourceMarks.withoutDirectGeometryMatch), 83);
const report = {
  slice: 586,
  fixtureSourceRevision: fixtureCommit,
  currentWriterMatchesFixtureRevision: true,
  comparatorToleranceCm: audited.toleranceCm,
  writerObservations: {
    format: "legacy minimal R12-style DXF; the current implementation emits only SECTION/ENTITIES/ENDSEC/EOF",
    cutSewLayers: "CUT and SEW are explicitly assigned to outline POLYLINE group-code-8 layer values in source code and all seven files",
    markRepresentation: "MARK_<kind> layers; mark names and optional labels are not serialized; line marks are LINE, buttons CIRCLE, other point marks POINT",
    coordinateConvention: "internal centimetres, y translated into layout height minus y; outline/mark coordinates rounded to 0.001 cm",
    absentFileMetadata: ["$ACADVER header", "$INSUNITS header", "named piece blocks/inserts", "piece/revision text attributes", "serialized mark IDs/labels", "native grade/rule records"],
    gradeScope: "The current UI exports the selected-size Piece[] through exportDxf; the function has no grade/revision/profile input. The seven retained fixtures are M/default only.",
  },
  totals: {
    recipeCount: recipes.length,
    pieceCount: recipes.reduce((sum, row) => sum + row.sourcePieces.length, 0),
    cutPolylineCount: total((row) => row.sourceCutSew.cutPolylineCount),
    cutWithoutDirectGeometryMatch: total((row) => row.sourceCutSew.cutWithoutDirectGeometryMatch),
    cutDirectGeometryMatches: total((row) => row.sourceCutSew.cutDirectGeometryMatches),
    sewPolylineCount: total((row) => row.sourceCutSew.sewPolylineCount),
    sewWithoutDirectGeometryMatch: total((row) => row.sourceCutSew.sewWithoutDirectGeometryMatch),
    sewDirectGeometryMatches: total((row) => row.sourceCutSew.sewDirectGeometryMatches),
    markEntityCount: total((row) => row.sourceMarks.entityCount),
    markDirectGeometryMatches: total((row) => row.sourceMarks.directGeometryMatches),
    marksWithoutDirectGeometryMatch: total((row) => row.sourceMarks.withoutDirectGeometryMatch),
    piecesUniquelyAssociatedBySewGeometry: recipes.filter(({ cloGenerationTwo }) => cloGenerationTwo.identityBySewGeometry).reduce((sum, row) => sum + row.sourcePieces.length, 0),
    mixedCloOutputSemanticLayerCount: recipes.reduce((sum, row) => sum + row.cloGenerationTwo.mixedSemanticLayerCount, 0),
    allSourceEntitiesWithoutDirectGeometryMatch: total((row) =>
      row.sourceCutSew.cutWithoutDirectGeometryMatch +
      row.sourceCutSew.sewWithoutDirectGeometryMatch +
      row.sourceMarks.withoutDirectGeometryMatch),
  },
  limits: [
    "A direct entity geometry match is not a semantic, physical, factory, or standards-conformance claim.",
    "S557's unmatched output marks are not all proof of loss; source marks can be transformed, split, or represented differently.",
    "This map does not attribute CLO's five localized Polo CUT-corner losses to the source writer or to a specific CLO pipeline stage.",
    "The profile/grade gaps identify absent metadata in these legacy DXFs; they do not choose a new standard or semantics.",
  ],
  recipes,
};

await mkdir(outputRoot, { recursive: true });
await writeFile(`${outputRoot}/product-source-profile-map.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: `${outputRoot}/product-source-profile-map.json`, totals: report.totals, sourceHashesVerified: recipes.length, receiverHashesVerified: recipes.length }, null, 2));
