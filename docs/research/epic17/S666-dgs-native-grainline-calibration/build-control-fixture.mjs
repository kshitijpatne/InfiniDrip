import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = "C:/G04-CLO-DXF-Exchange/S666-dgs-native-grainline-calibration";
const inputDir = `${root}/Input`;
const evidenceDir = `${root}/Evidence`;
await mkdir(inputDir, { recursive: true });
await mkdir(`${root}/Output`, { recursive: true });
await mkdir(evidenceDir, { recursive: true });

const lines = [
  "0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1014",
  "9", "$INSUNITS", "70", "5", "9", "$INSBASE", "10", "0", "20", "0", "30", "0",
  "0", "ENDSEC", "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "2",
  "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
  "0", "LAYER", "2", "CUT", "70", "0", "62", "7", "6", "CONTINUOUS",
  "0", "ENDTAB", "0", "ENDSEC", "0", "SECTION", "2", "BLOCKS",
  "0", "BLOCK", "8", "0", "2", "*Model_Space", "70", "0", "10", "0", "20", "0", "30", "0",
  "0", "ENDBLK", "8", "0",
  "0", "BLOCK", "8", "0", "2", "IDR_CAL_CONTROL", "70", "0", "10", "0", "20", "0", "30", "0",
  "0", "POLYLINE", "8", "CUT", "66", "1", "70", "1", "10", "0", "20", "0", "30", "0",
  "0", "VERTEX", "8", "CUT", "10", "0", "20", "0", "30", "0", "70", "0",
  "0", "VERTEX", "8", "CUT", "10", "20", "20", "0", "30", "0", "70", "0",
  "0", "VERTEX", "8", "CUT", "10", "20", "20", "30", "30", "0", "70", "0",
  "0", "VERTEX", "8", "CUT", "10", "0", "20", "30", "30", "0", "70", "0",
  "0", "SEQEND", "8", "CUT", "0", "ENDBLK", "8", "0",
  "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES",
  "0", "INSERT", "8", "0", "2", "IDR_CAL_CONTROL", "10", "0", "20", "0", "30", "0",
  "1001", "INFINIDRIP", "1000", "profile=idr-pattern-exchange/2", "1000", "garment=calibration",
  "1000", "size=control", "1000", "revision=S666-control-v1", "1000", "piece=grainline_control",
  "0", "ENDSEC", "0", "EOF", "",
];
const output = lines.join("\r\n");
const inputPath = `${inputDir}/control-rectangle-20x30cm-r14.dxf`;
const manifestPath = `${evidenceDir}/S666-input-manifest.json`;
await writeFile(inputPath, output, { encoding: "ascii", flag: "wx" });
const bytes = await readFile(inputPath);
const sha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase();
assert.equal(bytes.length, Buffer.byteLength(output, "ascii"));
assert.equal((output.match(/\r\n0\r\nVERTEX\r\n/g) ?? []).length, 4);
assert.match(output, /\r\n9\r\n\$INSUNITS\r\n70\r\n5\r\n/);
assert.match(output, /\r\n1000\r\npiece=grainline_control\r\n/);
assert.equal(output.includes("GRAINLINE"), false, "input must not pre-populate a grainline");
const manifest = {
  slice: "S666",
  source: "Codex-authored synthetic DXF control piece",
  inputPath,
  bytes: bytes.length,
  sha256,
  dialect: "AC1014/R14",
  declaredUnits: "centimeters ($INSUNITS=5)",
  role: "one named INSERT/block; piece=grainline_control",
  sourceGeometry: "closed CUT POLYLINE rectangle: (0,0)-(20,0)-(20,30)-(0,30); no grainline, SEW or marks",
  intendedNativeGrainline: { x1: 10, y1: 0, x2: 10, y2: 30 },
  preflight: "PASS",
  receiverUse: "NOT YET IMPORTED",
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
console.log(JSON.stringify(manifest, null, 2));
