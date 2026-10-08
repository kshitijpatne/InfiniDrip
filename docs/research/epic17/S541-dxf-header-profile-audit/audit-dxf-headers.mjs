import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const cases = [
  { recipe: "tee", observedUiMode: "DXF-ASTM export (S498)", file: "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Output/tee-standard-m-s498-generation-2.dxf", bytes: 67183, sha256: "bafaa58763486d1bbd6346c4b6467d59524a21e5572799789d2ae5e74e254912" },
  { recipe: "polo", observedUiMode: "DXF-ASTM export (S498)", file: "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Output/polo-standard-m-s498-generation-2.dxf", bytes: 221654, sha256: "2a878fa0d00d289cf733718debc77b755c2e033b9834e53b1a9e76d948f0a0f8" },
  { recipe: "woven", observedUiMode: "DXF-ASTM export (S498)", file: "C:/G04-CLO-DXF-Exchange/S498-practical-retest/Output/woven-shirt-standard-m-s498-generation-2.dxf", bytes: 140098, sha256: "dc1518364eaea8c2cad4c5a6355b2a9e987df56875d208e9cf2df2fc746e48d5" },
  { recipe: "fitted", observedUiMode: "DXF-AAMA export (S523)", file: "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip/Output/fitted-aama-roundtrip-02.dxf", bytes: 46358, sha256: "10dad81e5a1fd9f021616d03588dc22d12a5f4e354ec9d78f64d044e45dbd74b" },
  { recipe: "tank", observedUiMode: "DXF-AAMA export (S523)", file: "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip/Output/tank-aama-roundtrip-02.dxf", bytes: 30639, sha256: "cafaa75e579aa3bb39eb1a384a441d47f7f254b9da8d201c6afd921db21fbf85" },
  { recipe: "skirt", observedUiMode: "DXF-AAMA export (S523)", file: "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip/Output/skirt-aama-roundtrip-02.dxf", bytes: 9737, sha256: "741bcbad2ec198e893d74f94f445835b58ee34bba18e44dbc400fec5e30693fa" },
  { recipe: "trouser", observedUiMode: "DXF-AAMA export (S523)", file: "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip/Output/trouser-aama-roundtrip-02.dxf", bytes: 57892, sha256: "f421a6a2977bb053989ccb7c5255d4c7023f198b677180bc69fbd4b462ea1aee" },
];

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
function parsePairs(buffer, label) {
  const lines = buffer.toString("utf8").replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  if (lines.length % 2 !== 0) throw new Error(`${label}: incomplete DXF group pair`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    const codeText = lines[i].trim();
    if (!/^\d+$/.test(codeText)) throw new Error(`${label}: invalid group code at line ${i + 1}`);
    pairs.push([Number(codeText), lines[i + 1].trim()]);
  }
  return pairs;
}
function headerValues(pairs, label) {
  const start = pairs.findIndex((pair, i) => pair[0] === 0 && pair[1] === "SECTION" && pairs[i + 1]?.[0] === 2 && pairs[i + 1]?.[1] === "HEADER");
  if (start < 0) throw new Error(`${label}: HEADER section missing`);
  let end = pairs.findIndex((pair, i) => i > start && pair[0] === 0 && pair[1] === "ENDSEC");
  if (end < 0) throw new Error(`${label}: HEADER ENDSEC missing`);
  const header = pairs.slice(start + 2, end);
  const read = (name, valueCode) => {
    const at = header.findIndex(([code, value]) => code === 9 && value === name);
    return at < 0 ? null : header.slice(at + 1).find(([code]) => code === valueCode)?.[1] ?? null;
  };
  return { acadver: read("$ACADVER", 1), insunits: read("$INSUNITS", 70) };
}

const results = [];
for (const item of cases) {
  const bytes = await readFile(item.file);
  assert.equal(bytes.byteLength, item.bytes, `${item.recipe}: pinned byte count`);
  assert.equal(sha256(bytes), item.sha256, `${item.recipe}: pinned output hash`);
  const pairs = parsePairs(bytes, item.recipe);
  const header = headerValues(pairs, item.recipe);
  assert.ok(header.acadver, `${item.recipe}: $ACADVER must be present and parseable`);
  results.push({ ...item, ...header, groupPairCount: pairs.length });
}

const report = {
  purpose: "Hash-pinned raw-header inspection of existing second-generation recipe exports; no new CLO operation.",
  sources: {
    autodeskDxfHeader: "https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm",
    astmD6673_04: "https://store.astm.org/d6673-04.html",
    astmTextileList: "https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html",
  },
  standardFacts: {
    autodesk: { AC1009: "AutoCAD R11/R12", AC1012: "AutoCAD R13" },
    astmD6673_04: "The official product listing states that AutoCAD Version 13 DXF is to be used.",
    astmD6673_10: "The official ASTM textile standards list identifies D6673-10 as withdrawn in 2019.",
  },
  interpretations: [
    "A raw header establishes the DXF database version declared by that file, not the apparel standard's semantic conformance.",
    "An observed CLO menu label is not a normative edition or conformance certificate.",
    "Do not infer D6673-04 nonconformance solely from a header unless the exact selected profile/edition claim is established; report version incompatibility only as a conditional finding.",
  ],
  results,
};
const output = "C:/G04-CLO-DXF-Exchange/S541-dxf-header-profile-audit/Evidence/dxf-header-audit.json";
await mkdir("C:/G04-CLO-DXF-Exchange/S541-dxf-header-profile-audit/Evidence", { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, reportSha256: sha256(await readFile(output)), results: results.map(({ recipe, observedUiMode, acadver, insunits, bytes, sha256: hash }) => ({ recipe, observedUiMode, acadver, insunits, bytes, sha256: hash })) }, null, 2));
