import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));
const s336 = JSON.parse(await readFile(join(folder, "source-assembly-matrix-s336.json"), "utf8"));
const s341 = JSON.parse(await readFile(new URL("../S341-integrated-browser/production-replay/matrix.json", import.meta.url), "utf8"));
const currentById = new Map(s341.cases.filter((entry) => entry.recipeId === "woven-shirt").map((entry) => [entry.caseId, entry]));
const records = s336.records.map((source) => {
  const current = currentById.get(source.caseId);
  if (!current) throw new Error(`Missing current production case ${source.caseId}`);
  const oldOptions = source.resolvedOptions;
  const differingOptions = Object.keys(oldOptions).filter((key) => current.resolvedOptions[key] !== oldOptions[key]);
  if (differingOptions.length) throw new Error(`${source.caseId} option drift: ${differingOptions.join(", ")}`);
  const collarResidual = (face) => {
    const guidance = face.guidance.split(/\n+/u).find((line) => line.includes("stitch:Outer stand ↔ woven neckline")) ?? "";
    const match = /([0-9]+(?:\.[0-9]+)?) cm apart/u.exec(guidance);
    return { held: face.svgCount === 0, issue: guidance || null, reportedResidualCm: match ? Number(match[1]) : null };
  };
  const front = current.faces.find((face) => face.kind === "FRONT_FLAT");
  const back = current.faces.find((face) => face.kind === "BACK_FLAT");
  if (!front || !back) throw new Error(`Missing current faces for ${source.caseId}`);
  return {
    caseId: source.caseId,
    revision: source.revision,
    resolvedOptions: source.resolvedOptions,
    source: {
      stitch: source.directlyEncoded.necklineStitch,
      standNecklineLengthCm: source.directlyEncoded.standLengthCm,
      frontNecklineLengthCm: source.directlyEncoded.frontNecklineLengthCm,
      backNecklineLengthCm: source.directlyEncoded.backNecklineLengthCm,
      cbToCfNormalizedStationFraction: source.directlyEncoded.backNecklineLengthCm
        / (source.directlyEncoded.frontNecklineLengthCm + source.directlyEncoded.backNecklineLengthCm),
      edges: {
        outerStandNeckline: source.sourceEdges.outerStand.neckline,
        frontNeckline: source.sourceEdges.front.neckline,
        yokeNeckline: source.sourceEdges.yoke.neckline,
      },
    },
    rigidPlacedSourceEdgeGapsCm: source.exactViewStationDistancesCm.sourceBackedWovenNecklineTraversal,
    currentProduction: { front: collarResidual(front), back: collarResidual(back),
      svgEmitted: [front.svgCount > 0, back.svgCount > 0] },
  };
});

const range = (selector) => {
  const values = records.map(selector);
  return [Math.min(...values), Math.max(...values)];
};
const report = {
  sourceEvidence: "S336 generated source/transform matrix and authored Woven pattern/stitch code; relevant source files have no edits after the S336 commit 9bce95d in current branch history.",
  productionEvidence: "S341 current-production Chromium matrix after S340.",
  configurations: records.length,
  currentFaceRequests: records.length * 2,
  optionDifferences: records.filter((record) => {
    const current = currentById.get(record.caseId);
    return Object.keys(record.resolvedOptions).some((key) => current.resolvedOptions[key] !== record.resolvedOptions[key]);
  }).map((record) => record.caseId),
  all56CurrentFacesHeld: records.every((record) => record.currentProduction.front.held && record.currentProduction.back.held),
  metricsAcrossOptionsCm: {
    frontEndGap: range((record) => record.rigidPlacedSourceEdgeGapsCm.frontStandCFToFrontCF),
    frontStationToShoulderGap: range((record) => record.rigidPlacedSourceEdgeGapsCm.frontStandShoulderStationToFrontShoulder),
    backStationToYokeShoulderGap: range((record) => record.rigidPlacedSourceEdgeGapsCm.backStandShoulderStationToYokeShoulder),
    backCenterBackGap: range((record) => record.rigidPlacedSourceEdgeGapsCm.backStandCBToYokeCB),
    currentFrontReportedEndpointResidual: range((record) => record.currentProduction.front.reportedResidualCm),
    currentBackReportedEndpointResidual: range((record) => record.currentProduction.back.reportedResidualCm),
  },
  records,
};
await writeFile(join(folder, "current-crosswalk.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: report.configurations, faceRequests: report.currentFaceRequests,
  all56CurrentFacesHeld: report.all56CurrentFacesHeld, optionDifferences: report.optionDifferences,
  metricsAcrossOptionsCm: report.metricsAcrossOptionsCm }, null, 2));
