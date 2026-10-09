import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S588-xdata-retention-pilot";
const baselinePath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m-lwpolyline-r2000.dxf";
const sourcePath = `${root}/Input/polo-standard-m-lwpolyline-xdata.dxf`;
const reportPath = `${root}/Evidence/input-preflight.json`;
const baselineHash = "9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2".toUpperCase();
const sourceCommit = "c3b3ee43ba7e0db834cee9a4e0ce5f51414f58a4";
const appId = "INFINIDRIP_G04";
const pieceRoles = ["front", "back", "sleeve", "button-placket", "buttonhole-placket", "outer-collar-stand", "inner-collar-stand", "upper-pointed-collar", "under-pointed-collar"];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

await mkdir(`${root}/Input`, { recursive: true });
await mkdir(`${root}/Output`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });
const baselineBytes = await readFile(baselinePath);
assert.equal(sha256(baselineBytes), baselineHash, "S536 geometry baseline identity");
const baselinePairs = baselineBytes.toString("utf8").trimEnd().split(/\r?\n/);
assert.equal(baselinePairs.length % 2, 0, "complete baseline group pairs");
const pairs = [];
for (let index = 0; index < baselinePairs.length; index += 2) {
  const code = Number(baselinePairs[index]);
  assert(Number.isInteger(code), `invalid group code at line ${index + 1}`);
  pairs.push([code, baselinePairs[index + 1]]);
}

function splitSections(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index += 1) {
    if (values[index][0] !== 0 || values[index][1] !== "SECTION") continue;
    assert.equal(values[index + 1]?.[0], 2, "section name code");
    const name = values[index + 1][1];
    const records = [];
    index += 2;
    while (index < values.length && !(values[index][0] === 0 && values[index][1] === "ENDSEC")) records.push(values[index++]);
    assert.ok(index < values.length, `${name} ENDSEC`);
    result.set(name, records);
  }
  return result;
}
function entityRecords(values, label) {
  const records = [];
  for (let index = 0; index < values.length;) {
    assert.equal(values[index][0], 0, `${label}: entity marker at ${index}`);
    let end = index + 1;
    while (end < values.length && values[end][0] !== 0) end += 1;
    records.push(values.slice(index, end));
    index = end;
  }
  return records;
}
const field = (record, code) => record.find(([group]) => group === code)?.[1];
const baselineSections = splitSections(pairs);
assert.deepEqual([...baselineSections.keys()], ["HEADER", "ENTITIES"]);
const baselineEntities = entityRecords(baselineSections.get("ENTITIES"), "baseline");
const outlines = baselineEntities.filter((record) => record[0][1] === "LWPOLYLINE");
assert.equal(outlines.length, 18);
assert.equal(outlines.filter((record) => field(record, 8) === "CUT").length, 9);
assert.equal(outlines.filter((record) => field(record, 8) === "SEW").length, 9);
const markEntities = baselineEntities.filter((record) => ["LINE", "CIRCLE", "POINT"].includes(record[0][1]));
assert.equal(markEntities.length, 38);

let pieceIndex = -1;
let awaitingSew = false;
const markOrdinal = new Map();
const tagged = baselineEntities.map((record) => {
  const type = record[0][1];
  const layer = field(record, 8);
  let pieceRole;
  let entityRole;
  let entityId;
  let markKind;
  let ordinal;
  if (type === "LWPOLYLINE" && layer === "CUT") {
    assert.equal(awaitingSew, false, "CUT must start the next ordered piece pair");
    pieceIndex += 1;
    assert.ok(pieceIndex < pieceRoles.length, "unexpected CUT outline");
    pieceRole = pieceRoles[pieceIndex];
    entityRole = "cut-outline";
    entityId = `polo-m-${pieceRole}-cut`;
    awaitingSew = true;
  } else if (type === "LWPOLYLINE" && layer === "SEW") {
    assert.equal(awaitingSew, true, "SEW outline must follow its CUT outline");
    pieceRole = pieceRoles[pieceIndex];
    entityRole = "sew-line";
    entityId = `polo-m-${pieceRole}-sew`;
    awaitingSew = false;
  } else {
    assert.ok(pieceIndex >= 0 && awaitingSew === false, "mark must follow a complete CUT/SEW pair");
    pieceRole = pieceRoles[pieceIndex];
    markKind = layer?.startsWith("MARK_") ? layer.slice(5).toLowerCase() : "unknown";
    assert.notEqual(markKind, "unknown", `mark layer for ${type}`);
    const key = `${pieceRole}/${markKind}`;
    ordinal = markOrdinal.get(key) ?? 0;
    markOrdinal.set(key, ordinal + 1);
    entityRole = "pattern-mark";
    entityId = `polo-m-${pieceRole}-mark-${markKind}-${String(ordinal).padStart(2, "0")}`;
  }
  const metadata = [
    [1001, appId],
    [1000, "schema=infini-g04-xdata-v1"],
    [1000, `source.fixture.sha256=${baselineHash}`],
    [1000, `source.commit=${sourceCommit}`],
    [1000, "recipe=polo"],
    [1000, "size=M"],
    [1000, `piece.id=polo-m-${pieceRole}`],
    [1000, `entity.id=${entityId}`],
    [1000, `entity.role=${entityRole}`],
    [1000, `source.layer=${layer}`],
    ...(markKind ? [[1000, `mark.kind=${markKind}`], [1000, `mark.ordinal=${ordinal}`]] : []),
  ];
  assert(metadata.every(([, value]) => Buffer.byteLength(value, "utf8") <= 255), `${entityId}: XDATA string length`);
  return [...record, ...metadata];
});
assert.equal(pieceIndex + 1, pieceRoles.length);
assert.equal(awaitingSew, false);
const entityIds = tagged.map((record) => record.find(([code, value]) => code === 1000 && value.startsWith("entity.id="))?.[1]?.slice("entity.id=".length));
assert.equal(entityIds.length, 56);
assert.ok(entityIds.every(Boolean));
assert.equal(new Set(entityIds).size, entityIds.length, "all generated IDs are unique");
assert.equal(markEntities.length, 38);

const appIdSection = [
  [0, "SECTION"], [2, "TABLES"],
  [0, "TABLE"], [2, "APPID"], [5, "100"], [330, "0"], [100, "AcDbSymbolTable"], [70, "1"],
  [0, "APPID"], [2, appId], [5, "101"], [330, "100"], [100, "AcDbSymbolTableRecord"], [100, "AcDbRegAppTableRecord"], [70, "0"],
  [0, "ENDTAB"], [0, "ENDSEC"],
];
const header = baselineSections.get("HEADER");
header.push([9, "$HANDSEED"], [5, "102"]);
const variant = [
  [0, "SECTION"], [2, "HEADER"], ...header, [0, "ENDSEC"],
  ...appIdSection,
  [0, "SECTION"], [2, "ENTITIES"], ...tagged.flat(), [0, "ENDSEC"], [0, "EOF"],
];
const variantBytes = Buffer.from(`${variant.map(([code, value]) => `${code}\n${value}`).join("\n")}\n`, "utf8");
await writeFile(sourcePath, variantBytes);
const outputBytes = await readFile(sourcePath);
const outputPairsRaw = outputBytes.toString("utf8").trimEnd().split(/\r?\n/);
const outputPairs = [];
for (let index = 0; index < outputPairsRaw.length; index += 2) outputPairs.push([Number(outputPairsRaw[index]), outputPairsRaw[index + 1]]);
const outputSections = splitSections(outputPairs);
assert.deepEqual([...outputSections.keys()], ["HEADER", "TABLES", "ENTITIES"]);
const outputEntities = entityRecords(outputSections.get("ENTITIES"), "variant");
const stripped = outputEntities.map((record) => record.filter(([code], index) => {
  const firstAppId = record.findIndex(([candidate, value]) => candidate === 1001 && value === appId);
  return firstAppId < 0 || index < firstAppId;
}));
assert.deepEqual(stripped, baselineEntities, "variant changes entity geometry/order only by appended XDATA");
assert.equal(outputSections.get("TABLES").some(([code, value]) => code === 2 && value === appId), true, "registered APPID table");
const parsedIds = outputEntities.flatMap((record) => record.filter(([code, value]) => code === 1000 && value.startsWith("entity.id=")).map(([, value]) => value.slice("entity.id=".length)));
assert.deepEqual(parsedIds, entityIds, "IDs attach to source entities in source order");

const report = {
  slice: 588,
  appId,
  schema: "infini-g04-xdata-v1",
  source: { path: baselinePath, bytes: baselineBytes.length, sha256: sha256(baselineBytes), acadver: "AC1015", insunits: 4 },
  variant: { path: sourcePath, bytes: outputBytes.length, sha256: sha256(outputBytes), geometryAndEntityOrderIdentical: true, sourceEntityCount: outputEntities.length, uniqueEntityIdCount: new Set(parsedIds).size, pieceCount: pieceRoles.length, cutCount: 9, sewCount: 9, markCount: markEntities.length, registeredAppId: true },
  pieceRoles,
  entityIds,
  limits: ["Entity and mark IDs are InfiniDrip-specific XDATA, not AAMA/ASTM semantics.", "This preflight proves only the generated input; CLO must demonstrate round-trip retention.", "The prior S536 five Polo CUT residuals remain expected and are not a target of this pilot."],
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ sourcePath, sourceSha256: sha256(outputBytes), sourceEntityCount: outputEntities.length, cut: 9, sew: 9, marks: markEntities.length, uniqueIds: new Set(parsedIds).size, geometryAndEntityOrderIdentical: true, reportPath }, null, 2));
