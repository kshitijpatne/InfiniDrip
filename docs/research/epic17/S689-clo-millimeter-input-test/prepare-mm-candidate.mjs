import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const inputPath = "C:/G04-CAD-Interchange/S683-current-package-clo-roundtrip/polo-default-M.dxf";
const outputPath = "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Input/polo-default-M-mm.dxf";
const reportPath = "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Evidence/S689-transform-report.json";
const expectedInputSha256 = "a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c";
const expectedEntities = { POLYLINE: 18, VERTEX: 610, SEQEND: 18, POINT: 21, LINE: 84, CIRCLE: 3 };
const planarCoordinateCodes = new Set([10, 11, 20, 21]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const source = await readFile(inputPath, "utf8");
const sourceSha256 = sha256(source);
if (sourceSha256 !== expectedInputSha256) throw new Error(`Unexpected S681 source hash: ${sourceSha256}`);

const newline = source.includes("\r\n") ? "\r\n" : "\n";
const lines = source.replace(/\r\n/g, "\n").split("\n");
if (lines.at(-1) === "") lines.pop();
if (lines.length % 2 !== 0) throw new Error("DXF group-code/value line count is odd");

let section = "";
let entity = "";
let unitsHeaders = 0;
const entityCounts = {};
const layerCounts = {};
const groupCodeCounts = {};
const transformed = [];
let transformedCoordinates = 0;
let transformedRadii = 0;

for (let i = 0; i < lines.length; i += 2) {
  const codeText = lines[i];
  const value = lines[i + 1];
  const code = Number(codeText);
  if (!Number.isInteger(code) || value === undefined) throw new Error(`Invalid DXF pair at line ${i + 1}`);

  if (code === 0 && value === "SECTION") {
    if (Number(lines[i + 2]) !== 2 || !lines[i + 3]) throw new Error("Malformed SECTION header");
    section = lines[i + 3];
    entity = "";
  }
  if (code === 0 && value === "ENDSEC") {
    section = "";
    entity = "";
  }
  if (section === "HEADER" && code === 9 && value === "$INSUNITS") {
    if (Number(lines[i + 2]) !== 70 || lines[i + 3] !== "5") throw new Error("Source centimeter header is missing or duplicated");
    transformed.push(codeText, value, lines[i + 2], "4");
    unitsHeaders += 1;
    i += 2;
    continue;
  }

  if (section === "ENTITIES" && code === 0 && value !== "SECTION" && value !== "ENDSEC") {
    entity = value;
    entityCounts[entity] = (entityCounts[entity] ?? 0) + 1;
  }
  if (section === "ENTITIES") {
    groupCodeCounts[code] = (groupCodeCounts[code] ?? 0) + 1;
    if (code === 8) layerCounts[value] = (layerCounts[value] ?? 0) + 1;
  }

  let nextValue = value;
  if (section === "ENTITIES" && planarCoordinateCodes.has(code)) {
    const original = Number(value);
    if (!Number.isFinite(original)) throw new Error(`Non-finite coordinate for ${entity} group ${code}`);
    nextValue = String(original * 10);
    if (Math.abs(Number(nextValue) / 10 - original) > 1e-12) throw new Error(`Coordinate scale did not round trip: ${value}`);
    transformedCoordinates += 1;
  } else if (section === "ENTITIES" && code === 40 && entity === "CIRCLE") {
    const original = Number(value);
    if (!Number.isFinite(original)) throw new Error(`Non-finite radius for ${entity}`);
    nextValue = String(original * 10);
    if (Math.abs(Number(nextValue) / 10 - original) > 1e-12) throw new Error(`Radius scale did not round trip: ${value}`);
    transformedRadii += 1;
  }
  transformed.push(codeText, nextValue);
}

if (unitsHeaders !== 1) throw new Error(`Expected one INSUNITS field, found ${unitsHeaders}`);
for (const [type, count] of Object.entries(expectedEntities)) {
  if (entityCounts[type] !== count) throw new Error(`Unexpected source entity count for ${type}: ${entityCounts[type]}`);
}
if (Object.keys(entityCounts).some((type) => !(type in expectedEntities))) {
  throw new Error(`Unexpected source entity types: ${Object.keys(entityCounts).filter((type) => !(type in expectedEntities)).join(", ")}`);
}
if (transformedCoordinates !== 2 * 610 + 2 * 21 + 4 * 84 + 2 * 3) {
  throw new Error(`Unexpected planar coordinate count: ${transformedCoordinates}`);
}
if (transformedRadii !== 3) throw new Error(`Unexpected circle radius count: ${transformedRadii}`);

const output = transformed.join(newline) + newline;
const outputSha256 = sha256(output);
await mkdir(dirname(outputPath), { recursive: true });
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(outputPath, output, "utf8");
const report = {
  source: { path: inputPath, sha256: sourceSha256, bytes: Buffer.byteLength(source) },
  candidate: { path: outputPath, sha256: outputSha256, bytes: Buffer.byteLength(output) },
  unitConversion: { from: "cm / DXF INSUNITS 5", to: "mm / DXF INSUNITS 4", coordinateScale: 10 },
  unchangedGeometryInPhysicalUnits: true,
  entityCounts,
  layerCounts,
  groupCodeCounts,
  scaledPlanarCoordinates: transformedCoordinates,
  scaledCircleRadii: transformedRadii,
  invariants: [
    "Only INSUNITS, planar coordinate values (10, 11, 20, 21), and CIRCLE radius values (40) change.",
    "Entity type/order, layers, polyline flags, bulges, vertex count, closed state and block layout remain unchanged.",
    "Every transformed coordinate and radius divided by ten equals the source value within 1e-12.",
  ],
  scope: "Diagnostic input only; not an implemented product profile or standards-conformance claim.",
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
