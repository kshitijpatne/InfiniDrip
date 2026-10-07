import { writeFile } from "node:fs/promises";
import { draftPolo, POLO_OPTION_DEFINITIONS } from "../../../../src/drafting/polo";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { cubicLength } from "../../../../src/geometry";
import { sleeve } from "../../../../src/drafting/sleeve";
import { pieceToPath } from "../../../../src/render/shape";
import type { Piece } from "../../../../src/drafting/piece";

const cases: Array<{ id: string; values: Record<string, number> }> = [{ id: "default", values: {} }];
for (const option of POLO_OPTION_DEFINITIONS) {
  cases.push({ id: `${option.id}-min`, values: { [option.id]: option.min } });
  cases.push({ id: `${option.id}-max`, values: { [option.id]: option.max } });
}
if (cases.length !== 17) throw new Error(`Expected 17 option rows, got ${cases.length}`);
const namedEdge = (piece: Piece, id: string) => {
  const found = piece.edges.find(({ name }) => name === id);
  if (!found) throw new Error(`Missing ${piece.name}.${id}`);
  return found;
};
const curveEdge = (piece: Piece, id: string) => {
  const found = namedEdge(piece, id);
  if (found.kind !== "curve") throw new Error(`Expected curve ${piece.name}.${id}`);
  return found.curve;
};
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const targetRmsCm = 0.20;
const targetChordMismatchCm = targetRmsCm * Math.sqrt(2);
const rows = cases.map(({ id, values }) => {
  const source = draftPolo(STANDARD_M, values);
  const armholeFront = curveEdge(source.roles.front, "armhole");
  const armholeBack = curveEdge(source.roles.back, "armhole");
  const targetArmhole = cubicLength(armholeFront) + cubicLength(armholeBack);
  const sourceSleeve = source.roles.sleeve;
  const sourceCap = curveEdge(sourceSleeve, "capLeft");
  const receiverChord = distance(armholeFront.start, armholeFront.end);
  const sourceChord = distance(sourceCap.start, sourceCap.end);
  const sourceMismatch = Math.abs(sourceChord - receiverChord);
  let low = 0;
  let high = STANDARD_M.bicep - 1;
  for (let index = 0; index < 60; index += 1) {
    const reduction = (low + high) / 2;
    const changedMeasurements = { ...STANDARD_M, bicep: STANDARD_M.bicep - reduction };
    const candidatePiece = sleeve(changedMeasurements, { targetArmhole }).pieces.sleeve;
    const candidateCurve = curveEdge(candidatePiece, "capLeft");
    const mismatch = Math.abs(distance(candidateCurve.start, candidateCurve.end) - receiverChord);
    if (mismatch <= targetChordMismatchCm) high = reduction;
    else low = reduction;
  }
  const reduction = high;
  const candidateMeasurements = { ...STANDARD_M, bicep: STANDARD_M.bicep - reduction };
  const candidateSleeve = sleeve(candidateMeasurements, { targetArmhole }).pieces.sleeve;
  const candidateCapLeft = curveEdge(candidateSleeve, "capLeft");
  const candidateCapRight = curveEdge(candidateSleeve, "capRight");
  const candidateArcLength = cubicLength(candidateCapLeft) + cubicLength(candidateCapRight);
  const candidateChord = distance(candidateCapLeft.start, candidateCapLeft.end);
  const candidateMismatch = Math.abs(candidateChord - receiverChord);
  const capRightChordMismatch = Math.abs(distance(candidateCapRight.start, candidateCapRight.end)
    - distance(armholeBack.start, armholeBack.end));
  return {
    id,
    values,
    sourceRevision: `live-draft:polo:S424:${id}`,
    sourceCapHalfChordCm: sourceChord,
    receivingArmholeHalfChordCm: receiverChord,
    sourceChordMismatchCm: sourceMismatch,
    requiredChordMismatchCm: targetChordMismatchCm,
    sourceHardAnchorRmsCm: sourceMismatch / Math.sqrt(2),
    candidateBicepMeasurementDecreaseCm: reduction,
    sourceBicepCircumferenceCm: STANDARD_M.bicep,
    candidateBicepCircumferenceCm: candidateMeasurements.bicep,
    sourceFinishedSleeveBicepSpanCm: STANDARD_M.bicep + STANDARD_M.ease * 0.5,
    candidateFinishedSleeveBicepSpanCm: candidateMeasurements.bicep + STANDARD_M.ease * 0.5,
    sourceCapHeightCm: sourceCap.start.y,
    candidateCapHeightCm: candidateCapLeft.start.y,
    candidateLeftChordMismatchCm: candidateMismatch,
    candidateRightChordMismatchCm: capRightChordMismatch,
    candidateHardAnchorRmsCm: Math.max(candidateMismatch, capRightChordMismatch) / Math.sqrt(2),
    unchangedAuthoredTotalCapEaseCm: candidateArcLength - targetArmhole,
    frontArmholeCm: cubicLength(armholeFront),
    backArmholeCm: cubicLength(armholeBack),
    sourceSleeve,
    candidateSleeve,
  };
});
for (const row of rows) {
  if (row.candidateHardAnchorRmsCm > targetRmsCm + 1e-8 || Math.abs(row.unchangedAuthoredTotalCapEaseCm - 1.5) > 1e-5) {
    throw new Error(`Source candidate failed target or authored ease in ${row.id}: ${JSON.stringify({ rms: row.candidateHardAnchorRmsCm, left: row.candidateLeftChordMismatchCm, right: row.candidateRightChordMismatchCm, decrease: row.candidateBicepMeasurementDecreaseCm, ease: row.unchangedAuthoredTotalCapEaseCm })}`);
  }
}
const conciseRows = rows.map(({ sourceSleeve, candidateSleeve, ...row }) => row);
const uniqueDecreases = [...new Set(rows.map(({ candidateBicepMeasurementDecreaseCm }) => candidateBicepMeasurementDecreaseCm.toFixed(6)))];
const summary = {
  diagnostic: "in-memory source-only candidate; production pattern and files are unchanged",
  optionRows: rows.length,
  faces: rows.length * 2,
  targetRmsCm,
  targetChordMismatchCm,
  minCandidateBicepDecreaseCm: Math.min(...rows.map(({ candidateBicepMeasurementDecreaseCm }) => candidateBicepMeasurementDecreaseCm)),
  maxCandidateBicepDecreaseCm: Math.max(...rows.map(({ candidateBicepMeasurementDecreaseCm }) => candidateBicepMeasurementDecreaseCm)),
  uniqueCandidateDecreasesCm: uniqueDecreases,
  allCandidatesPassTarget: rows.every(({ candidateHardAnchorRmsCm }) => candidateHardAnchorRmsCm <= targetRmsCm + 1e-8),
  allRetain1_5cmSourceCapEase: rows.every(({ unchangedAuthoredTotalCapEaseCm }) => Math.abs(unchangedAuthoredTotalCapEaseCm - 1.5) < 1e-5),
  rows: conciseRows,
};
await writeFile(new URL("./candidate-matrix.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`);

const preview = rows[0];
const width = 54;
const height = 40;
const baseline = pieceToPath(preview.sourceSleeve);
const candidate = pieceToPath(preview.candidateSleeve);
const centerShift = (preview.sourceFinishedSleeveBicepSpanCm - preview.candidateFinishedSleeveBicepSpanCm) / 2;
const metricLine = `gray: ${preview.sourceFinishedSleeveBicepSpanCm.toFixed(2)} cm span · blue: ${preview.candidateFinishedSleeveBicepSpanCm.toFixed(2)} cm span · RMS 0.678 → ${preview.candidateHardAnchorRmsCm.toFixed(3)} cm · cap ease 1.50 cm`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="800" viewBox="-4 -3 ${width} ${height}">
<rect x="-4" y="-3" width="${width}" height="${height}" fill="white"/>
<g fill="none" stroke-linejoin="round" stroke-linecap="round">
<path d="${baseline}" stroke="#a4aab4" stroke-width="0.18"/>
<path d="${candidate}" transform="translate(${centerShift} 0)" stroke="#1769aa" stroke-width="0.2"/>
</g>
<g font-family="Arial,sans-serif" font-size="0.9" fill="#242a31">
<text x="0" y="-1.8">Polo sleeve source overlay — default option</text>
<text x="0" y="35.2" fill="#727985">${metricLine}</text>
</g>
</svg>`;
await writeFile(new URL("./candidate-sleeve-overlay.svg", import.meta.url), svg);
console.log(JSON.stringify({ ...summary, rows: rows.map(({ id, candidateBicepMeasurementDecreaseCm, sourceBicepCircumferenceCm, candidateBicepCircumferenceCm, sourceFinishedSleeveBicepSpanCm, candidateFinishedSleeveBicepSpanCm, sourceHardAnchorRmsCm, candidateHardAnchorRmsCm, unchangedAuthoredTotalCapEaseCm }) => ({ id, candidateBicepMeasurementDecreaseCm, sourceBicepCircumferenceCm, candidateBicepCircumferenceCm, sourceFinishedSleeveBicepSpanCm, candidateFinishedSleeveBicepSpanCm, sourceHardAnchorRmsCm, candidateHardAnchorRmsCm, unchangedAuthoredTotalCapEaseCm })) }, null, 2));
