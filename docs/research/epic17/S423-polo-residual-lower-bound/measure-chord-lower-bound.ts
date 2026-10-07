import { writeFile } from "node:fs/promises";
import { POLO_OPTION_DEFINITIONS, draftPolo } from "../../../../src/drafting/polo";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { cubicLength } from "../../../../src/geometry";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";

type Point = { x: number; y: number };
type CurveEdge = { kind: "curve"; curve: { start: Point; control1: Point; control2: Point; end: Point } };
const edge = (block: ReturnType<typeof draftPolo>, role: string, name: string): CurveEdge => {
  const found = block.roles[role]?.edges.find((candidate) => candidate.name === name);
  if (!found || found.kind !== "curve") throw new Error(`Missing ${role}.${name} source curve`);
  return found;
};
const gap = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const cases: Array<{ id: string; values: Record<string, number> }> = [{ id: "default", values: {} }];
for (const option of POLO_OPTION_DEFINITIONS) {
  cases.push({ id: `${option.id}-min`, values: { [option.id]: option.min } });
  cases.push({ id: `${option.id}-max`, values: { [option.id]: option.max } });
}
if (cases.length !== 17) throw new Error(`Expected 17 existing Polo option rows, got ${cases.length}`);

const rows = cases.map(({ id, values }) => {
  const block = draftPolo(STANDARD_M, values);
  const capFront = edge(block, "sleeve", "capLeft").curve;
  const armholeFront = edge(block, "front", "armhole").curve;
  const capBack = edge(block, "sleeve", "capRight").curve;
  const armholeBack = edge(block, "back", "armhole").curve;
  // Reversal and reflection preserve chord lengths; corresponding edge ends
  // remain the source-encoded underarm/shoulder stations on both faces.
  const capChordFront = gap(capFront.start, capFront.end);
  const armholeChordFront = gap(armholeFront.start, armholeFront.end);
  const chordDeltaFront = Math.abs(capChordFront - armholeChordFront);
  const capChordBack = gap(capBack.start, capBack.end);
  const armholeChordBack = gap(armholeBack.start, armholeBack.end);
  const chordDeltaBack = Math.abs(capChordBack - armholeChordBack);
  const hardAnchorRmsFront = chordDeltaFront / Math.sqrt(2);
  const hardAnchorRmsBack = chordDeltaBack / Math.sqrt(2);
  const rigidLowerBoundFront = chordDeltaFront / 2;
  const rigidLowerBoundBack = chordDeltaBack / 2;
  const projection = createG04TechnicalFlatProjectionMap("polo", block, `live-draft:polo:S423:${id}`);
  if (!projection) throw new Error(`No source projection map for ${id}`);
  const productionAssemblies = (["FRONT_FLAT", "BACK_FLAT"] as const).map((kind) =>
    assembleTechnicalFlatRoles("polo", block, kind, projection));
  const liveIssueMessages = productionAssemblies.flatMap(({ issues }) => issues)
    .filter(({ sourceId }) => sourceId === "stitch:Sleeve-cap ease").map(({ message }) => message);
  if (liveIssueMessages.length !== 2 || liveIssueMessages.some((message) => !message.includes("0.68 cm RMS"))
    || Math.abs(hardAnchorRmsFront - 0.68) >= 0.005 || Math.abs(hardAnchorRmsBack - 0.68) >= 0.005) {
    throw new Error(`Expected production assembly to reproduce both 0.68 cm holds for ${id}; got ${liveIssueMessages.join(" | ")}`);
  }
  return {
    id,
    values,
    sourceRevision: `live-draft:polo:S423:${id}`,
    stitch: block.stitches.find((item) => item.label === "Sleeve-cap ease")?.label,
    capEdgeFront: "sleeve.capLeft",
    receiverEdgeFront: "front.armhole (reversed for underarm→shoulder)",
    capArcFrontCm: cubicLength(capFront),
    armholeArcFrontCm: cubicLength(armholeFront),
    authoredLengthEaseFrontCm: cubicLength(capFront) - cubicLength(armholeFront),
    capEndpointChordFrontCm: capChordFront,
    armholeEndpointChordFrontCm: armholeChordFront,
    chordLengthDifferenceFrontCm: chordDeltaFront,
    hardAnchorRmsFrontCm: hardAnchorRmsFront,
    bestTwoEndpointRigidRmsFrontCm: rigidLowerBoundFront,
    correspondingLandmarkCountFront: 2,
    capEdgeBack: "sleeve.capRight",
    receiverEdgeBack: "back.armhole (reflected to view frame)",
    capArcBackCm: cubicLength(capBack),
    armholeArcBackCm: cubicLength(armholeBack),
    authoredLengthEaseBackCm: cubicLength(capBack) - cubicLength(armholeBack),
    capEndpointChordBackCm: capChordBack,
    armholeEndpointChordBackCm: armholeChordBack,
    chordLengthDifferenceBackCm: chordDeltaBack,
    hardAnchorRmsBackCm: hardAnchorRmsBack,
    bestTwoEndpointRigidRmsBackCm: rigidLowerBoundBack,
    correspondingLandmarkCountBack: 2,
    productionAssemblyReportedRmsCm: 0.68,
    productionAssemblyIssuesAcrossFaces: liveIssueMessages.length,
    productionAssemblyIssueMessages: liveIssueMessages,
    existingGateCm: 0.25,
  };
});

const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
const summary = {
  diagnostic: "source endpoint chord lower bound; no source/output mutation",
  optionRows: rows.length,
  allUseSameSourceStitch: rows.every((row) => row.stitch === "Sleeve-cap ease"),
  rows,
  extrema: {
    chordDifferenceFrontCm: [Math.min(...rows.map((row) => row.chordLengthDifferenceFrontCm)), Math.max(...rows.map((row) => row.chordLengthDifferenceFrontCm))],
    chordDifferenceBackCm: [Math.min(...rows.map((row) => row.chordLengthDifferenceBackCm)), Math.max(...rows.map((row) => row.chordLengthDifferenceBackCm))],
    hardAnchorRmsFrontCm: [Math.min(...rows.map((row) => row.hardAnchorRmsFrontCm)), Math.max(...rows.map((row) => row.hardAnchorRmsFrontCm))],
    hardAnchorRmsBackCm: [Math.min(...rows.map((row) => row.hardAnchorRmsBackCm)), Math.max(...rows.map((row) => row.hardAnchorRmsBackCm))],
    bestRigidRmsFrontCm: [Math.min(...rows.map((row) => row.bestTwoEndpointRigidRmsFrontCm)), Math.max(...rows.map((row) => row.bestTwoEndpointRigidRmsFrontCm))],
    bestRigidRmsBackCm: [Math.min(...rows.map((row) => row.bestTwoEndpointRigidRmsBackCm)), Math.max(...rows.map((row) => row.bestTwoEndpointRigidRmsBackCm))],
  },
  claims: {
    productionRmsEqualsHardAnchoredTwoEndpointChordFormula: rows.every((row) =>
      Math.abs(row.hardAnchorRmsFrontCm - row.productionAssemblyReportedRmsCm) < 0.005
        && Math.abs(row.hardAnchorRmsBackCm - row.productionAssemblyReportedRmsCm) < 0.005),
    exactSourceDraftsReproducedProductionResidualAllFaces: rows.every((row) => row.productionAssemblyIssuesAcrossFaces === 2),
    unconstrainedRigidLowerBoundExceedsGateEveryRow: rows.every((row) => row.bestTwoEndpointRigidRmsFrontCm > 0.25 && row.bestTwoEndpointRigidRmsBackCm > 0.25),
    optionsChangeCapOrArmholeGeometry: new Set(rows.map((row) => `${row.capArcFrontCm.toFixed(9)}:${row.armholeArcFrontCm.toFixed(9)}:${row.capArcBackCm.toFixed(9)}:${row.armholeArcBackCm.toFixed(9)}`)).size > 1,
  },
};
if (!summary.allUseSameSourceStitch || !summary.claims.unconstrainedRigidLowerBoundExceedsGateEveryRow) throw new Error("Source-supported rigid lower-bound invariant failed");
await writeFile(new URL("./endpoint-chord-matrix.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, rows: rows.map(({ id, capArcFrontCm, armholeArcFrontCm, authoredLengthEaseFrontCm, capEndpointChordFrontCm, armholeEndpointChordFrontCm, chordLengthDifferenceFrontCm, hardAnchorRmsFrontCm, bestTwoEndpointRigidRmsFrontCm, capArcBackCm, armholeArcBackCm, authoredLengthEaseBackCm, capEndpointChordBackCm, armholeEndpointChordBackCm, chordLengthDifferenceBackCm, hardAnchorRmsBackCm, bestTwoEndpointRigidRmsBackCm }) => ({ id, capArcFrontCm, armholeArcFrontCm, authoredLengthEaseFrontCm, capEndpointChordFrontCm, armholeEndpointChordFrontCm, chordLengthDifferenceFrontCm, hardAnchorRmsFrontCm, bestTwoEndpointRigidRmsFrontCm, capArcBackCm, armholeArcBackCm, authoredLengthEaseBackCm, capEndpointChordBackCm, armholeEndpointChordBackCm, chordLengthDifferenceBackCm, hardAnchorRmsBackCm, bestTwoEndpointRigidRmsBackCm })) }, null, 2));
