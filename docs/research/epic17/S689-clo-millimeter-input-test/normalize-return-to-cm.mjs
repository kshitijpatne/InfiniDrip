import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const inputPath = "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Output/polo-default-M-mm-clo-standard-return.dxf";
const outputPath = "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Evidence/polo-default-M-mm-clo-standard-return-normalized-cm.dxf";
const reportPath = "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Evidence/S689-return-normalization.json";
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const input = await readFile(inputPath, "utf8");
const lines = input.replace(/\r\n/g, "\n").split("\n");
if (lines.at(-1) === "") lines.pop();
if (lines.length % 2 !== 0) throw new Error("Malformed DXF pair stream");

const allowedCoordinateCodes = new Set([10, 11, 20, 21]);
let section = "";
let inHeader = false;
let unitsHeaders = 0;
let dividedCoordinates = 0;
let dividedRadii = 0;
const output = [];
for (let i = 0; i < lines.length; i += 2) {
  const codeText = lines[i];
  const value = lines[i + 1];
  const code = Number(codeText);
  if (!Number.isInteger(code) || value === undefined) throw new Error(`Invalid DXF pair at ${i + 1}`);
  if (code === 0 && value === "SECTION") {
    if (Number(lines[i + 2]) !== 2) throw new Error("Invalid SECTION pair");
    section = lines[i + 3];
    inHeader = section === "HEADER";
  }
  if (code === 0 && value === "ENDSEC") { section = ""; inHeader = false; }
  if (inHeader && code === 9 && value === "$INSUNITS") {
    if (Number(lines[i + 2]) !== 70 || lines[i + 3] !== "4") throw new Error("Expected returned millimeter units");
    output.push(codeText, value, lines[i + 2], "5");
    unitsHeaders += 1;
    i += 2;
    continue;
  }
  const geometrySection = section === "ENTITIES" || section === "BLOCKS";
  if (geometrySection && allowedCoordinateCodes.has(code)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) throw new Error(`Invalid coordinate ${value}`);
    output.push(codeText, String(numeric / 10));
    dividedCoordinates += 1;
    continue;
  }
  if (geometrySection && code === 40) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) throw new Error(`Invalid radius ${value}`);
    output.push(codeText, String(numeric / 10));
    dividedRadii += 1;
    continue;
  }
  output.push(codeText, value);
}
if (unitsHeaders !== 1) throw new Error(`Expected exactly one unit header; got ${unitsHeaders}`);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${output.join("\r\n")}\r\n`, "utf8");
const report = {
  input: { path: inputPath, sha256: sha256(input), bytes: Buffer.byteLength(input), declaredUnits: "millimeters (4)" },
  comparisonCopy: { path: outputPath, sha256: sha256(await readFile(outputPath)), declaredUnits: "centimeters (5)" },
  transformation: "Divide every planar coordinate (10,11,20,21) and radius (40) in ENTITIES/BLOCKS by 10; change only the copy's declared unit from millimeters to centimeters.",
  dividedCoordinates,
  dividedRadii,
  purpose: "Comparison adapter only. The original CLO return remains immutable. This converts physical millimeter coordinates to centimeters for the existing fixed 0.001 cm comparator.",
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
