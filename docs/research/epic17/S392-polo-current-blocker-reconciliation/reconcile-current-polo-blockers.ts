import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { rolePiece } from "../../../../src/drafting/block";
import { draftPolo } from "../../../../src/drafting/polo";
import { POLO } from "../../../../src/drafting/recipe";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const root = process.cwd();
const baseline = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S331-polo-browser-final/matrix.json"), "utf8"));
const keyed = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S390-polo-centerback-glyph-candidates/polo-keyed-marker-trial-matrix.json"), "utf8"));
const s380 = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S380-polo-collar-callout-key-implementation/search-summary.json"), "utf8"));
const s385 = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S385-polo-blocker-decision-consolidation/consolidated-polo-blockers.json"), "utf8"));
const s391 = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S391-polo-keyed-marker-current-state/polo-keyed-marker-current-state-matrix.json"), "utf8"));
assert.equal(baseline.cases.length, 17);
assert.equal(keyed.rows.length, 17);
assert.equal(s391.samples.length, 17);

const close = (left: number, right: number, tolerance = 0.00002) => assert.ok(Math.abs(left - right) <= tolerance, `${left} differs from ${right}`);
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const cases = [];
for (const entry of baseline.cases) {
  const keyRow = keyed.rows.find((row: any) => row.caseId === entry.caseId);
  const markerRow = s391.samples.find((row: any) => row.caseId === entry.caseId);
  assert.ok(keyRow && markerRow, `${entry.caseId}: missing current S390/S391 row`);
  assert.deepEqual(keyRow.options, entry.options, `${entry.caseId}: current keyed options mismatch`);
  assert.deepEqual(markerRow.options, entry.options, `${entry.caseId}: current marker options mismatch`);
  assert.equal(keyRow.revisionId, `live-draft:polo:S390:${entry.caseId}`);
  assert.equal(markerRow.revisionId, keyRow.revisionId);
  assert.deepEqual(keyRow.keyedRenderIssues, [], `${entry.caseId}: current keyed output issue`);
  assert.equal(markerRow.schedule.length, 11, `${entry.caseId}: schedule row count`);
  assert.ok(markerRow.schedule.every((row: any) => row.revisionId === keyRow.revisionId), `${entry.caseId}: stale schedule`);
  assert.deepEqual(keyRow.visibleMarkerKeys, ["A", "B", "C", "D", "E", "FG", "H", "I"]);
  const currentKeyedPoms = keyRow.sourceCenteredPoms.map((pom: any) => pom.sourceId).sort();
  const priorInlineBlockers = s385.blockersBySourcePom.map((row: any) => row.sourcePomId).sort();
  assert.deepEqual(currentKeyedPoms, priorInlineBlockers, `${entry.caseId}: the ten prior source POM identities changed`);

  const block = draftPolo(STANDARD_M, entry.options);
  const revisionId = `live-draft:polo:S392:${entry.caseId}`;
  const projection = createG04TechnicalFlatProjectionMap("polo", block, revisionId);
  const faces = [];
  for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
    const assembly = assembleTechnicalFlatRoles("polo", block, kind, projection);
    const role = rolePiece(block, kind === "FRONT_FLAT" ? "front" : "back");
    const sleeve = rolePiece(block, "sleeve");
    const capName = kind === "FRONT_FLAT" ? "capLeft" : "capRight";
    const cap = pieceEdge(sleeve, capName);
    const armhole = pieceEdge(role, "armhole");
    const roleId = kind === "FRONT_FLAT" ? "front" : "back";
    const sleeveTransform = assembly.transforms.sleeve;
    const bodyTransform = assembly.transforms[roleId];
    assert.ok(sleeveTransform && bodyTransform, `${entry.caseId}/${kind}: missing rigid placement`);
    const transform = (point: { x: number; y: number }, value: typeof sleeveTransform) => transformFlatPoint(point, {
      offset: value.offset, rotationDegrees: value.rotationDegrees, mirrorX: value.mirrorX,
    });
    const capStart = transform(edgeStart(cap), sleeveTransform);
    const capEnd = transform(edgeEnd(cap), sleeveTransform);
    const armholeStart = transform(edgeStart(armhole), bodyTransform);
    const armholeEnd = transform(edgeEnd(armhole), bodyTransform);
    const directEndpointGapsCm = [distance(capStart, armholeStart), distance(capEnd, armholeEnd)];
    const reverseEndpointGapsCm = [distance(capStart, armholeEnd), distance(capEnd, armholeStart)];
    const residual = assembly.issues.find((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL" && issue.sourceId === "stitch:Sleeve-cap ease");
    const residualCm = residual ? Number(residual.message.match(/endpoints ([\d.]+) cm/)?.[1]) : 0;
    assert.ok(Number.isFinite(residualCm), `${entry.caseId}/${kind}: could not parse residual`);
    const poms = POLO.poms.filter((pom) => /Sleeve (bicep width|length \(cap–hem\)|hem)/i.test(pom.label))
      .map((pom) => ({ label: pom.label, valueCm: pom.measure(block) }));
    faces.push({ kind, revisionId, capSourceId: `pattern:polo:role:sleeve:edge:${capName}`,
      armholeSourceId: `pattern:polo:role:${roleId}:edge:armhole`,
      capLengthCm: edgeLength(cap), armholeLengthCm: edgeLength(armhole),
      edgeExcessCm: edgeLength(cap) - edgeLength(armhole),
      sourceCapEndpoints: { start: edgeStart(cap), end: edgeEnd(cap) },
      sourceArmholeEndpoints: { start: edgeStart(armhole), end: edgeEnd(armhole) },
      transformedEndpointGapsCm: { direct: directEndpointGapsCm, reversed: reverseEndpointGapsCm },
      assemblyIssue: residual ? { code: residual.code, sourceId: residual.sourceId, message: residual.message, residualCm } : null,
      rigidTransforms: { sleeve: sleeveTransform, body: bodyTransform }, sleevePoms: poms,
    });
  }
  cases.push({ caseId: entry.caseId, options: entry.options, currentKeyedRevision: keyRow.revisionId,
    keyedIssueCount: keyRow.keyedRenderIssues.length, baseIssues: keyRow.originalBaseIssues,
    keyedPomCount: keyRow.sourceCenteredPoms.length, keyedScheduleRows: keyRow.fullScheduleRows,
    markerStations: markerRow.stations.length, pairedBackUnchanged: keyRow.pairedBackUnchanged,
    faces });
}

const poms = POLO.poms.map((pom) => ({ id: `pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, label: pom.label,
  anchorRole: pom.anchorRoleId ?? null, anchorEdge: pom.anchorEdgeId ?? null,
  backAnchorRole: pom.backAnchorRoleId ?? null, backAnchorEdge: pom.backAnchorEdgeId ?? null }));
const baseOnlyC = keyed.summary.originalBaseFailures.map((row: any) => ({ caseId: row.caseId,
  issueIds: row.issues.map((issue: any) => issue.entityId),
  currentKeyedIssues: keyed.rows.find((candidate: any) => candidate.caseId === row.caseId)?.keyedRenderIssues ?? null }));
assert.equal(baseOnlyC.length, 3);
assert.ok(baseOnlyC.every((row: any) => row.issueIds.length === 1
  && row.issueIds[0] === "flat:polo:FRONT_FLAT:callout:collar-point-extension"
  && row.currentKeyedIssues.length === 0));
assert.equal(keyed.summary.keyedBaseFailures.length, 0);
assert.equal(cases.flatMap((row: any) => row.faces).filter((face: any) => face.assemblyIssue?.sourceId === "stitch:Sleeve-cap ease").length, 34);
assert.ok(cases.every((row: any) => row.keyedIssueCount === 0));
const residuals = cases.flatMap((row: any) => row.faces.map((face: any) => face.assemblyIssue?.residualCm ?? 0));
assert.ok(residuals.every((value: number) => value > 0.25));
assert.ok(residuals.every((value: number) => value === residuals[0]));
assert.equal(s391.summary.measuredStations, 136);
assert.equal(s391.browserErrors.length, 0);

const report = {
  generatedAt: new Date().toISOString(),
  source: "Current draftPolo(STANDARD_M, S331 supported option values) and current rigid assembly/projection code, compared with exact S390 actual-renderer and S391 current keyed-output artifacts.",
  configurations: cases.length, faceRows: cases.length * 2, keyedStations: s391.summary.measuredStations,
  acceptanceThresholdCm: 0.25,
  cCollisionReconciliation: {
    earlierS378BaseRows: s380.originalBaseFailures.length,
    correctedS380KeyedRows: s380.keyedBaseFailures.length,
    currentS390BaseRows: baseOnlyC,
    currentS390KeyedOutputFailures: keyed.summary.keyedBaseFailures,
    explanation: "S378/S380's two original C base collisions remain reproducible. The complete S390 Chromium measurement also exposes collarLeafDepth=max as a third unkeyed-baseline collision. All three rows fail only with the inline C callout; the approved source-centered C plus complete keyed schedule has zero keyed renderer failures across all 17 rows. They remain baseline comparator evidence, not current keyed-output blockers.",
  },
  priorInlineLeaderReconciliation: {
    priorS385PomCount: s385.remainingPathFindings.uniquePoms,
    priorS385BlockerInstances: s385.remainingPathFindings.blockerInstances,
    priorS385Crossings: s385.remainingPathFindings.geometricCrossings,
    currentSourcePomIds: keyed.rows[0].sourceCenteredPoms.map((pom: any) => pom.sourceId).sort(),
    sameTenSourcePomIds: true,
    currentRowsWithKeyedRendererIssues: keyed.rows.filter((row: any) => row.keyedRenderIssues.length > 0).length,
    currentKeyedIssueCount: 0,
    note: "S385 counts describe the prior inline-leader rendering. S390 confirms ten source POMs are represented by eight source-centered stations (including co-located/shared-key POMs) with full schedule rows; those old leader crossings are not emitted leader paths in the keyed output. Current key-to-source geometry contacts are separately reviewed in S391 and are not accepted by this reconciliation.",
    historicalSourceCrosswalk: s385.blockersBySourcePom.map((row: any) => ({
      sourcePomId: row.sourcePomId, fullText: row.fullText, oldTargetId: row.targetId,
      oldSourceEntityId: row.sourceEntityId,
      oldInterferingPaths: row.interferingPathIdsAndOccurrences,
      oldInterferingSources: row.interferingSourceIdsAndOccurrences,
      historicalMinimumClearanceCm: row.minimumClearanceCm,
      historicalMaximumClearanceCm: row.maximumClearanceCm,
      classification: "historical inline-leader finding; not a current keyed-output failure",
    })),
  },
  currentKeyStationObservations: {
    evidenceFile: "../S391-polo-keyed-marker-current-state/polo-keyed-marker-current-state-matrix.json",
    candidateCounts: { conservativePathOrMarkBboxCandidates: s391.summary.potentialPathOverlays + s391.summary.potentialIndependentMarkOverlays,
      pathCandidates: s391.summary.potentialPathOverlays, independentMarkCandidates: s391.summary.potentialIndependentMarkOverlays },
    caveat: "S391 uses conservative glyph-box/path-sample tests; counts flag contact candidates, not confirmed glyph intersections. The actual default whole view, eight marker crops and limiting I crop are reviewed in its packet.",
    byKey: ["A", "B", "C", "D", "E", "FG", "H", "I"].map((markerKey) => {
      const rows = s391.summary.potentialOverlays.filter((row: any) => row.key === markerKey);
      return { key: markerKey,
        affectedOptionRows: [...new Set(rows.map((row: any) => row.caseId))].sort(),
        candidateCount: rows.length,
        sourceEntities: [...new Set(rows.map((row: any) => row.sourceId))].sort(),
        targetEntities: [...new Set(rows.map((row: any) => row.id))].sort(),
        classification: markerKey === "D" ? "no S391 path/mark candidates" : markerKey === "H"
          ? "remaining crowded independent shoulder marks and outerStand outline; source marks are distinct and no stitch-graph join is encoded"
          : markerKey === "A" || markerKey === "B" ? "source-backed armhole/shoulder interface; keep separately keyed POM rows"
            : markerKey === "C" ? "source-backed collar/neckline interface; keyed C output passes renderer collision check"
              : markerKey === "FG" ? "source-backed neckline/placket/collar station; inspect rendered readability"
                : markerKey === "E" || markerKey === "I" ? "approved glyph offsets retain fixed source-centered rings; inspect rendered spacing against marks and paths"
                  : "review per S391 rendered evidence" };
    }),
  },
  residualSource: {
    stitchId: "stitch:Sleeve-cap ease", sourceLabel: "Sleeve-cap ease", authoredEaseCm: 1.5,
    sourcePOM: null, targetRoleEdges: ["sleeve.capLeft → front.armhole", "sleeve.capRight → back.armhole"],
    assemblyResidualsCm: [...new Set(residuals)],
    faceCountAboveGate: residuals.filter((value: number) => value > 0.25).length,
    reason: "This is an assembly stitch endpoint residual, not a POM annotation failure. Keep the source-encoded +1.5 cm ease, approved view-only projection and 0.25 cm gate distinct.",
  },
  poms,
  cases,
};
await writeFile(resolve(root, "docs/research/epic17/S392-polo-current-blocker-reconciliation/polo-current-blocker-reconciliation.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: cases.length, faces: cases.length * 2, keyedStations: report.keyedStations,
  cBaseOnly: baseOnlyC.map((row: any) => row.caseId), keyedFailures: keyed.summary.keyedBaseFailures.length,
  residuals: report.residualSource.assemblyResidualsCm, faceRowsAboveGate: report.residualSource.faceCountAboveGate,
  output: "polo-current-blocker-reconciliation.json" }, null, 2));
