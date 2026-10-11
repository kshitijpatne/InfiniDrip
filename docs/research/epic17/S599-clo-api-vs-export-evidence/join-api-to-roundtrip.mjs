import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const roundtripPath = "C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Evidence/Analysis/S595-roundtrip-analysis.json";
const apiReportPath = "C:/G04-CLO-DXF-Exchange/S597-clo-helper-recovery/Evidence/periodic-preexport-source-comparison.json";
const outputPath = "C:/G04-CLO-DXF-Exchange/S599-clo-api-vs-export-evidence/Evidence/api-vs-roundtrip-cut-join.json";
const expectedHashes = {
  roundtrip: "B38B6EC525B2EF51FED5EA2B7EC29533DD1800701892CE726B79247D81D361C3",
  apiReport: "ACEBFB70D57967EEEE79B51BC4BC91EF0EF1DA5D15D436682085F29D213146D9",
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const [roundtripBytes, apiBytes] = await Promise.all([readFile(roundtripPath), readFile(apiReportPath)]);
const roundtrip = JSON.parse(roundtripBytes.toString("utf8"));
const apiReport = JSON.parse(apiBytes.toString("utf8"));
assert.equal(sha(apiBytes), expectedHashes.apiReport);
assert.equal(sha(roundtripBytes), expectedHashes.roundtrip);
assert.equal(roundtrip.geometryBaseline.sha256.toUpperCase(), "9062B0D6442354165C5640EF3CA98B717AAEF6F4339EAC1DE99255D7D1750FA2");
assert.equal(roundtrip.importedFixture.sha256.toUpperCase(), "E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC");
assert.equal(roundtrip.output.sha256.toUpperCase(), "E31F45437ECADB4ED40E7B2BFB99468509CEEBF17027C87F4E9F8150906C22F2");
assert.equal(apiReport.inputs.source.sha256.toUpperCase(), roundtrip.geometryBaseline.sha256.toUpperCase());
assert.equal(apiReport.inputs.periodicFixture.sha256.toUpperCase(), roundtrip.importedFixture.sha256.toUpperCase());
assert.equal(roundtrip.results.length, 9);
assert.equal(apiReport.results.length, 9);

const apiCutMatches = new Map();
for (const piece of apiReport.results) {
  for (const match of piece.withinSourceProximityThreshold) {
    if (match.literalSourceLayer !== "CUT") continue;
    const existing = apiCutMatches.get(match.sourceOrdinal) ?? [];
    existing.push({ observationIndex: piece.index, residualMm: match.residualMm });
    apiCutMatches.set(match.sourceOrdinal, existing);
  }
}
const bySourceOrdinal = roundtrip.results.map((result, pieceIndex) => {
  const sourceOrdinal = pieceIndex * 2;
  const getterMatches = apiCutMatches.get(sourceOrdinal) ?? [];
  return {
    sourceCutContourOrdinal: sourceOrdinal,
    roundtripPieceBoundBySourceSew: result.piece,
    cloOutputCutPassesFixedGate: result.cut.passes,
    conservativeUpperBoundCm: result.cut.conservativeUpperBoundCm,
    directPreExportApiSourceCutMatches: getterMatches,
    apiHasDirectCutMatch: getterMatches.length > 0,
  };
});
const passing = bySourceOrdinal.filter(({ cloOutputCutPassesFixedGate }) => cloOutputCutPassesFixedGate);
const failing = bySourceOrdinal.filter(({ cloOutputCutPassesFixedGate }) => !cloOutputCutPassesFixedGate);
const report = {
  slice: "S599",
  purpose: "Join S597's read-only pre-export source-contour screen to S595's measured DXF-AAMA CUT round-trip by source contour ordinal and the S595 source-SEW output block binding.",
  method: { identityJoin: "S595 source piece order uses CUT/SEW source ordinal pairs and binds receiver blocks by unchanged source SEW geometry; API observation indexes are not joined to pieces.", apiMetric: "S597 symmetric vertex-to-opposing-segment source proximity screen at 0.01 mm; diagnostic only", outputGate: "S595 sampled symmetric contour upper bound, 0.001 cm maximum", roleLimit: "S597 matches retain literal source DXF layer labels only; no CUT/SEW API semantics are inferred" },
  inputs: { roundtrip: { path: roundtripPath, sha256: sha(roundtripBytes), importedFixtureSha256: roundtrip.importedFixture.sha256, outputSha256: roundtrip.output.sha256 }, apiComparison: { path: apiReportPath, sha256: sha(apiBytes), apiCaptureSha256: apiReport.inputs.api.sha256 }, source: roundtrip.geometryBaseline },
  sourceCuts: bySourceOrdinal,
  summary: {
    passingCutCount: passing.length,
    passingCutsWithDirectPreExportApiCutMatch: passing.filter(({ apiHasDirectCutMatch }) => apiHasDirectCutMatch).length,
    passingCutsWithoutDirectPreExportApiCutMatch: passing.filter(({ apiHasDirectCutMatch }) => !apiHasDirectCutMatch).map(({ roundtripPieceBoundBySourceSew }) => roundtripPieceBoundBySourceSew),
    failingCutCount: failing.length,
    failingCutsWithDirectPreExportApiCutMatch: failing.filter(({ apiHasDirectCutMatch }) => apiHasDirectCutMatch).length,
    failingCutsWithoutDirectPreExportApiCutMatch: failing.filter(({ apiHasDirectCutMatch }) => !apiHasDirectCutMatch).map(({ roundtripPieceBoundBySourceSew }) => roundtripPieceBoundBySourceSew),
    apiAbsenceUniqueToFailingCuts: passing.every(({ apiHasDirectCutMatch }) => apiHasDirectCutMatch) && failing.every(({ apiHasDirectCutMatch }) => !apiHasDirectCutMatch),
  },
  conclusion: "The getter is not a complete pre-export CUT-presence or pass/fail signal for this fixture: at least one passing output CUT lacks a direct getter match. The existing outputs can be source-correlated geometrically, but this cannot attribute failed output geometry to importer, internal model, getter, or exporter. The S595 actual DXF round-trip remains the acceptance evidence.",
};
assert.equal(report.summary.passingCutCount, 4);
assert.equal(report.summary.passingCutsWithDirectPreExportApiCutMatch, 3);
assert.equal(report.summary.passingCutsWithoutDirectPreExportApiCutMatch.length, 1);
assert.equal(report.summary.failingCutCount, 5);
assert.equal(report.summary.failingCutsWithDirectPreExportApiCutMatch, 0);
assert.equal(report.summary.apiAbsenceUniqueToFailingCuts, false);
await mkdir("C:/G04-CLO-DXF-Exchange/S599-clo-api-vs-export-evidence/Evidence", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, inputHashes: report.inputs, summary: report.summary, sourceCuts: bySourceOrdinal }, null, 2));
