import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S588-xdata-retention-pilot";
const inputPath = `${root}/Input/polo-standard-m-lwpolyline-xdata.dxf`;
const outputPath = `${root}/Output/polo-standard-m-lwpolyline-xdata-clo.dxf`;
const inputHashExpected = "C4D0D2D29CECF261EFE40D5E56D87F537D42D2931B139D0AD7E534AC1D124293";
const appId = "INFINIDRIP_G04";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function pairsFrom(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: complete DXF group pairs`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, index) => [Number(lines[index * 2].trim()), lines[index * 2 + 1]]);
  assert(pairs.every(([code]) => Number.isInteger(code)), `${label}: valid group codes`);
  return pairs;
}

function recordsIn(pairs) {
  const records = [];
  for (let i = 0; i < pairs.length;) {
    if (pairs[i][0] !== 0) { i += 1; continue; }
    const start = i++;
    while (i < pairs.length && pairs[i][0] !== 0) i += 1;
    records.push(pairs.slice(start, i));
  }
  return records;
}

const field = (record, code) => record.find(([group]) => group === code)?.[1];
const inputBytes = await readFile(inputPath);
const outputBytes = await readFile(outputPath);
assert.equal(sha256(inputBytes), inputHashExpected, "hash-pinned XDATA input variant");
const inputPairs = pairsFrom(inputBytes, "input");
const outputPairs = pairsFrom(outputBytes, "CLO output");
const inputRecords = recordsIn(inputPairs);
const outputRecords = recordsIn(outputPairs);
const inputIds = inputRecords.flatMap((record) => record.filter(([code, value]) => code === 1000 && value.startsWith("entity.id=")).map(([, value]) => value.slice("entity.id=".length)));
const outputIds = outputRecords.flatMap((record) => record.filter(([code, value]) => code === 1000 && value.startsWith("entity.id=")).map(([, value]) => value.slice("entity.id=".length)));
assert.equal(inputIds.length, 56, "all expected source IDs are present");
assert.equal(new Set(inputIds).size, inputIds.length, "source IDs unique");
const expected = new Set(inputIds);
const observed = new Set(outputIds);
const preserved = inputIds.filter((id) => outputIds.includes(id));
const missing = inputIds.filter((id) => !observed.has(id));
const duplicated = [...new Set(outputIds.filter((id, index) => outputIds.indexOf(id) !== index))];
const unexpected = outputIds.filter((id) => !expected.has(id));
const appIds = outputPairs.filter(([code, value]) => code === 1001).map(([, value]) => value);
const layers = outputRecords.flatMap((record) => record.filter(([code]) => code === 8).map(([, value]) => value));
const acadverMarker = outputPairs.findIndex(([code, value]) => code === 9 && value === "$ACADVER");

const report = {
  slice: 588,
  receiver: "CLO 2026.1.310 (r58944)",
  profileSelectedInUI: "DXF-AAMA",
  input: { path: inputPath, bytes: inputBytes.length, sha256: sha256(inputBytes), expectedEntities: 56, expectedUniqueEntityIds: inputIds.length },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha256(outputBytes), acadver: outputPairs[acadverMarker + 1]?.[1], entityRecordCount: outputRecords.length, registeredAppIdOccurrences: appIds.filter((value) => value === appId).length, distinctLayerNames: [...new Set(layers)].sort() },
  xdata: { inputAppId: appId, outputAppIds: [...new Set(appIds)].sort(), inputIdCount: inputIds.length, retainedIdCount: preserved.length, retainedIds: preserved, missingIds: missing, duplicatedIds: duplicated, unexpectedOrReassignedIds: unexpected },
  method: "Parse code/value pairs throughout the exported DXF, including block definitions. Match custom entity.id XDATA strings to the 56 unique IDs attached to the 9 CUT, 9 SEW, and 38 mark source entities. UI completion alone is not treated as proof of retention.",
  limitations: ["The import used CLO DXF-AAMA with centimeters, 100%, no rotation, maintain original grain, and notch import to both at ratio; Import Draw Curve Points was inadvertently unchecked, unlike S536, and this deviation is recorded.", "This one-file pilot does not prove AAMA/ASTM conformance, semantic layer/mark preservation, grading, all-seven recipe compatibility, or V03 acceptance.", "Known S536 Polo CUT contour simplification remains an independent failure under the 0.001 cm gate."],
};
assert.equal(outputBytes.length > 0, true, "CLO produced an output file");
const evidence = `${root}/Evidence`;
await mkdir(evidence, { recursive: true });
await writeFile(`${evidence}/xdata-retention-report.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputBytes: outputBytes.length, outputSha256: sha256(outputBytes), outputAppIds: report.output.outputAppIds, retained: preserved.length, missing: missing.length, duplicated: duplicated.length, unexpected: unexpected.length }, null, 2));
