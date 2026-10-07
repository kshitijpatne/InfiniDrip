import { writeFile } from "node:fs/promises";
import { cubicLength } from "../../../../src/geometry";
import { draftPolo, POLO_BODY_POMS, POLO_OPTION_DEFINITIONS } from "../../../../src/drafting/polo";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { pieceToPath } from "../../../../src/render/shape";
import type { Piece } from "../../../../src/drafting/piece";

type Point = { x: number; y: number };
type Curve = { start: Point; control1: Point; control2: Point; end: Point };
const pt = (x: number, y: number): Point => ({ x, y });
function capCurves(span: number, height: number): readonly [Curve, Curve] {
  const half = span / 2;
  return [
    { start: pt(0, height), control1: pt(half * 0.5, height), control2: pt(half * 0.55, height * 0.15), end: pt(half, 0) },
    { start: pt(half, 0), control1: pt(span - half * 0.55, height * 0.15), control2: pt(span - half * 0.5, height), end: pt(span, height) },
  ];
}
function solveHeight(span: number, target: number): number {
  let lo = 0;
  let hi = span * 2;
  while (cubicLength(capCurves(span, hi)[0]) + cubicLength(capCurves(span, hi)[1]) < target) hi *= 2;
  for (let i = 0; i < 64; i += 1) {
    const mid = (lo + hi) / 2;
    const curves = capCurves(span, mid);
    if (cubicLength(curves[0]) + cubicLength(curves[1]) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const curve = (piece: typeof draftPolo extends (...args: never[]) => infer B ? B : never, role: string, name: string): Curve => {
  const edge = (piece as { roles: Record<string, { edges: Array<{ name: string; kind: string; curve?: Curve }> }> }).roles[role]?.edges.find((candidate) => candidate.name === name);
  if (!edge || edge.kind !== "curve" || !edge.curve) throw new Error(`Missing curve ${role}.${name}`);
  return edge.curve;
};
const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
const options: Array<{ id: string; values: Record<string, number> }> = [{ id: "default", values: {} }];
for (const option of POLO_OPTION_DEFINITIONS) {
  options.push({ id: `${option.id}-min`, values: { [option.id]: option.min } });
  options.push({ id: `${option.id}-max`, values: { [option.id]: option.max } });
}
if (options.length !== 17) throw new Error(`Expected 17 option rows, got ${options.length}`);
const widths = [43, 42.4, 42, 41, 40, 39];
const capEases = [1.5, 0, -1];
const rows = options.map(({ id, values }) => {
  const block = draftPolo(STANDARD_M, values);
  const front = curve(block, "front", "armhole");
  const back = curve(block, "back", "armhole");
  const armholeLength = cubicLength(front) + cubicLength(back);
  const receivers = [distance(front.start, front.end), distance(back.start, back.end)];
  const candidates = capEases.flatMap((easeCm) => widths.map((spanCm) => {
    const heightCm = solveHeight(spanCm, armholeLength + easeCm);
    const [left, right] = capCurves(spanCm, heightCm);
    const capHalfChordsCm = [distance(left.start, left.end), distance(right.start, right.end)];
    const residualRmsByFaceCm = capHalfChordsCm.map((chord, index) => Math.abs(chord - receivers[index]) / Math.sqrt(2));
    return { spanCm, capEaseCm: easeCm, capHeightCm: heightCm,
      capHalfLengthCm: cubicLength(left), capTotalLengthCm: cubicLength(left) + cubicLength(right),
      capHalfChordsCm, receiverHalfChordsCm: receivers, residualRmsByFaceCm,
      maxResidualRmsCm: Math.max(...residualRmsByFaceCm),
      finishedBicepPomDeltaCm: spanCm - 43,
      withinExistingSleeveBicepPomTolerance: Math.abs(spanCm - 43) <= 0.6 + 1e-9,
      withinExistingSleeveCapEaseRange: easeCm >= -1 && easeCm <= 4 };
  }));
  const rmsAtSpan = (spanCm: number): { rmsCm: number; heightCm: number } => {
    const heightCm = solveHeight(spanCm, armholeLength + 1.5);
    const [left, right] = capCurves(spanCm, heightCm);
    const differences = [distance(left.start, left.end) - receivers[0], distance(right.start, right.end) - receivers[1]];
    return { rmsCm: Math.max(...differences.map((difference) => Math.abs(difference) / Math.sqrt(2))), heightCm };
  };
  let passingSpan = 30;
  let failingSpan = 43;
  if (rmsAtSpan(passingSpan).rmsCm > 0.25) throw new Error(`Search lower bound does not pass for ${id}`);
  for (let index = 0; index < 64; index += 1) {
    const mid = (passingSpan + failingSpan) / 2;
    if (rmsAtSpan(mid).rmsCm <= 0.25) passingSpan = mid;
    else failingSpan = mid;
  }
  const threshold = rmsAtSpan(passingSpan);
  const sourceSleeve = block.roles.sleeve;
  const centerX = 43 / 2;
  const shiftX = centerX - passingSpan / 2;
  const [leftCap, rightCap] = capCurves(passingSpan, threshold.heightCm);
  const translate = (source: Curve): Curve => ({
    start: pt(source.start.x + shiftX, source.start.y),
    control1: pt(source.control1.x + shiftX, source.control1.y),
    control2: pt(source.control2.x + shiftX, source.control2.y),
    end: pt(source.end.x + shiftX, source.end.y),
  });
  const capLeft = translate(leftCap);
  const capRight = translate(rightCap);
  const candidateCapTotalLengthCm = cubicLength(capLeft) + cubicLength(capRight);
  const hem = sourceSleeve.edges.find(({ name }) => name === "hem");
  if (!hem || hem.kind !== "line") throw new Error(`Missing source hem in ${id}`);
  const leftHem = hem.end;
  const rightHem = hem.start;
  const candidatePiece: Piece = {
    ...sourceSleeve,
    edges: [
      { kind: "curve", name: "capLeft", curve: capLeft },
      { kind: "curve", name: "capRight", curve: capRight },
      { kind: "line", name: "sideRight", start: capRight.end, end: rightHem },
      { kind: "line", name: "hem", start: rightHem, end: leftHem },
      { kind: "line", name: "sideLeft", start: leftHem, end: capLeft.start },
    ],
  };
  const candidateBlock = { ...block, roles: { ...block.roles, sleeve: candidatePiece } };
  const bicepPom = POLO_BODY_POMS.find(({ label }) => label === "Sleeve bicep width");
  if (!bicepPom) throw new Error("Polo source has no Sleeve bicep width POM");
  const sourceBicepPomCm = bicepPom.measure(block);
  const candidateBicepPomCm = bicepPom.measure(candidateBlock);
  return { id, values, sourceRevision: `live-draft:polo:S427:${id}`, armholeLengthCm: armholeLength,
    sourceCapHalfLengthCm: cubicLength(curve(block, "sleeve", "capLeft")),
    sourceCapHeightCm: curve(block, "sleeve", "capLeft").start.y,
    sourceCapHalfChordsCm: [distance(curve(block, "sleeve", "capLeft").start, curve(block, "sleeve", "capLeft").end),
      distance(curve(block, "sleeve", "capRight").start, curve(block, "sleeve", "capRight").end)],
    receiverHalfChordsCm: receivers,
    sourceResidualRmsCm: receivers.map((receiver, index) => Math.abs(receiver - distance(curve(block, "sleeve", index === 0 ? "capLeft" : "capRight").start,
      curve(block, "sleeve", index === 0 ? "capLeft" : "capRight").end)) / Math.sqrt(2)),
    candidates,
    capSpanThresholdCandidate: {
      sourceCapSpanCm: 43,
      candidateCapSpanCm: passingSpan,
      capSpanChangeCm: passingSpan - 43,
      candidateCapHeightCm: threshold.heightCm,
      candidateCapEaseCm: 1.5,
      targetCapTotalLengthCm: armholeLength + 1.5,
      candidateCapTotalLengthCm,
      targetMaxResidualRmsCm: 0.25,
      measuredMaxResidualRmsCm: threshold.rmsCm,
      sourcePOM: "Sleeve bicep width",
      currentPomAnchor: "sleeve.sideLeft:end to sleeve.sideRight:start (the cap/side junction endpoints)",
      sourcePomValueCm: sourceBicepPomCm,
      candidatePomValueCm: candidateBicepPomCm,
      candidatePomDeltaCm: candidateBicepPomCm - sourceBicepPomCm,
      existingPomToleranceCm: bicepPom.tolerance,
      candidateWithinExistingPomTolerance: Math.abs(candidateBicepPomCm - sourceBicepPomCm) <= bicepPom.tolerance,
      candidatePiece,
    } };
});
const totals = rows.flatMap(({ candidates }) => candidates);
const passingAtExistingPomTolerance = totals.filter((row) => row.maxResidualRmsCm <= 0.25 && row.withinExistingSleeveBicepPomTolerance && row.capEaseCm === 1.5);
const thresholdRows = rows.map(({ capSpanThresholdCandidate }) => capSpanThresholdCandidate);
if (!rows.every(({ sourceResidualRmsCm }) => sourceResidualRmsCm.every((rms) => Math.abs(rms - 0.677835247849777) < 1e-8))
  || !thresholdRows.every((candidate) => candidate.measuredMaxResidualRmsCm <= 0.25 + 1e-8)
  || !thresholdRows.every((candidate) => Math.abs(candidate.candidateCapTotalLengthCm - candidate.targetCapTotalLengthCm) < 1e-6)
  || !thresholdRows.every((candidate) => Math.abs(candidate.candidatePomDeltaCm) > candidate.existingPomToleranceCm)
  || passingAtExistingPomTolerance.length !== 0) {
  throw new Error("Cap-span threshold candidate failed the residual/ease/POM tradeoff invariants");
}
const summary = {
  scope: "diagnostic calculations from production Polo body source; no file or source geometry changed",
  optionRows: rows.length,
  faces: rows.length * 2,
  sourceStitchGateCm: 0.25,
  existingSleeveBicepPomToleranceCm: 0.6,
  testedWidthsCm: widths,
  testedCapEasesCm: capEases,
  capSpanCandidatesPassingBothResidualAndPomTolerance: passingAtExistingPomTolerance.length,
  sampledCandidatesPassingResidualAndExistingPomTolerance: passingAtExistingPomTolerance.length,
  allSourceResidualsReproduceS423: rows.every(({ sourceResidualRmsCm }) => sourceResidualRmsCm.every((rms) => Math.abs(rms - 0.677835247849777) < 1e-8)),
  allThresholdCandidatesMeetResidualGate: thresholdRows.every((candidate) => candidate.measuredMaxResidualRmsCm <= 0.25 + 1e-8),
  allThresholdCandidatesRetain1_5cmAuthoredEase: thresholdRows.every((candidate) => Math.abs(candidate.candidateCapTotalLengthCm - candidate.targetCapTotalLengthCm) < 1e-6),
  allThresholdCandidatesExceedSleeveBicepPomTolerance: thresholdRows.every((candidate) => Math.abs(candidate.candidatePomDeltaCm) > candidate.existingPomToleranceCm),
  noSampledWidthAtCurrentCapEasePassesBoth: passingAtExistingPomTolerance.length === 0,
  rows: rows.map(({ capSpanThresholdCandidate: { candidatePiece: _piece, ...candidate }, ...row }) => ({ ...row, capSpanThresholdCandidate: candidate })),
};
await writeFile(new URL("./candidate-matrix.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`);
const preview = rows[0];
const sourceSleeve = draftPolo(STANDARD_M, {}).roles.sleeve;
const baselinePath = pieceToPath(sourceSleeve);
const candidatePath = pieceToPath(preview.capSpanThresholdCandidate.candidatePiece);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="800" viewBox="-4 -3 52 40">
<rect x="-4" y="-3" width="52" height="40" fill="white"/>
<g fill="none" stroke-linejoin="round" stroke-linecap="round">
<path d="${baselinePath}" stroke="#a4aab4" stroke-width="0.18"/>
<path d="${candidatePath}" stroke="#1769aa" stroke-width="0.20"/>
</g>
<g font-family="Arial,sans-serif" font-size="0.85" fill="#242a31">
<text x="0" y="-1.8">Polo sleeve cap span threshold trial — default</text>
<text x="0" y="35.2" fill="#727985">gray: source cap/bicep 43.00 cm · blue: cap span ${preview.capSpanThresholdCandidate.candidateCapSpanCm.toFixed(3)} cm · POM change ${preview.capSpanThresholdCandidate.candidatePomDeltaCm.toFixed(3)} cm · RMS 0.678 → ${preview.capSpanThresholdCandidate.measuredMaxResidualRmsCm.toFixed(3)} cm</text>
</g>
</svg>`;
await writeFile(new URL("./candidate-sleeve-cap-span-overlay.svg", import.meta.url), svg);
console.log(JSON.stringify({ optionRows: rows.length, faces: rows.length * 2,
  threshold: rows[0].capSpanThresholdCandidate,
  optionThresholdsIdentical: rows.every(({ capSpanThresholdCandidate: trial }) =>
    Math.abs(trial.candidateCapSpanCm - rows[0].capSpanThresholdCandidate.candidateCapSpanCm) < 1e-8),
  residualsAllPass: rows.every(({ capSpanThresholdCandidate: trial }) => trial.measuredMaxResidualRmsCm <= 0.25 + 1e-8),
  pomToleranceAllPass: rows.every(({ capSpanThresholdCandidate: trial }) => trial.candidateWithinExistingPomTolerance),
}, null, 2));
