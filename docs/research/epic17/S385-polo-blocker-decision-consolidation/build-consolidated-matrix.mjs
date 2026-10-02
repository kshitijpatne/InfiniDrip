import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const base = 'docs/research/epic17';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const s382 = `${base}/S382-polo-blocker-consolidation`;
const s384 = `${base}/S384-polo-anchor-topology-review`;
const [diagnosis, perPom, crossings, compare, incidence, candidate] = await Promise.all([
  read(`${s382}/diagnosis-summary.json`), read(`${s382}/per-pom-summary.json`),
  read(`${s382}/leader-crossing-matrix.json`), read(`${s382}/render-comparison.json`),
  read(`${s384}/station-path-incidence.json`),
  read(`${base}/S383-polo-keyed-callout-layout/candidate-matrix.json`),
]);

assert.equal(diagnosis.configurations, 17);
assert.equal(compare.configurations, 17);
assert.equal(compare.optionValuesIdenticalToS379, true);
assert.equal(compare.nonCLeaderGeometryIdenticalToS379, true);
assert.equal(compare.s380RevisionBoundPaths, true);
assert.equal(incidence.configurations, 17);
assert.equal(incidence.sameRevision, true);
assert.equal(crossings.summary.pathClearanceInstances, 170);
assert.equal(crossings.summary.properPathIntersections, 139);
assert.equal(crossings.summary.positiveClearancesBelow025, 31);
assert.equal(perPom.length, 10);
assert.equal(candidate.results.length, 17);

const optionRows = crossings.results.map((row) => {
  const compareRow = compare.rows.find((item) => item.caseId === row.caseId);
  const stationRow = incidence.rows.find((item) => item.caseId === row.caseId);
  const candidateRow = candidate.results.find((item) => item.caseId === row.caseId);
  assert.ok(compareRow && stationRow && candidateRow, `${row.caseId}: missing joined evidence`);
  assert.equal(row.revisionId, compareRow.currentRevision);
  assert.equal(row.revisionId, stationRow.revisionId);
  assert.equal(row.revisionId, candidateRow.revisionId);
  assert.equal(row.allSourceRevisionsMatch, true);
  assert.equal(stationRow.allPatternPathRevisionsMatch, true);
  assert.equal(row.currentBlockedSources.length, 10, `${row.caseId}: blocker count changed`);
  const active = row.currentBlockedSources.map((sourceId) => {
    const leader = row.leaders.find((item) => item.sourceId === sourceId);
    assert.ok(leader, `${row.caseId}: missing leader ${sourceId}`);
    return {
      sourcePomId: sourceId,
      targetId: leader.targetId,
      sourceEntityId: leader.sourceEntity,
      leaderId: leader.calloutId,
      nearestNonTargetPathId: leader.nearestPath,
      nearestPathSourceId: leader.nearestPathSource,
      clearanceCm: leader.minNonTargetPathClearanceCm,
      crosses: leader.crosses,
      under025: leader.within025,
    };
  });
  const keyedStations = stationRow.stations.map(({ key, pomSourceIds, currentTargetIds, station, exactIncidentPaths, pathsWithinMarkerPlusGateRadius }) => ({
    key, pomSourceIds, targetIds: currentTargetIds, station,
    exactIncidentPaths: exactIncidentPaths.map(({ entityId, sourceId, feature, layer }) => ({ entityId, sourceId, feature, layer })),
    overlappingOrNearPaths: pathsWithinMarkerPlusGateRadius.filter((path) => !currentTargetIds.includes(path.entityId)).map(({ entityId, sourceId, feature, layer, centerDistanceCm, diskEdgeClearanceCm }) => ({ entityId, sourceId, feature, layer, centerDistanceCm, diskEdgeClearanceCm })),
  }));
  return {
    caseId: row.caseId,
    options: row.optionOverrides,
    currentArtifactRevision: row.revisionId,
    correspondingS378ArtifactRevision: compareRow.priorRevision,
    currentPatternAndOptionIdentityMatchesPrior: compareRow.optionValuesIdentical && compareRow.pathIdentitiesAndGeometryEqual,
    allRenderedPatternPathsShareCurrentRevision: row.allSourceRevisionsMatch,
    activePathBlockerCount: active.length,
    activeCalloutBlockers: active,
    additionalLeaderPairsUnder025: row.leaderPairsWithin025,
    additionalLeaderToGlyphIntersections: row.textLabelIntersections,
    keyedDiagnosticStations: keyedStations,
    approvedC: {
      sourceId: compareRow.keyedC.sourceId,
      sourceEntityId: compareRow.keyedC.sourceEntityId,
      targetId: compareRow.keyedC.targetId,
      targetEdge: compareRow.keyedC.targetEdge,
      baseIssues: compareRow.keyedC.baseIssues,
      keyedIssues: compareRow.keyedC.keyedIssues,
    },
  };
});

const summary = {
  method: 'Same 17 option-value rows and source geometry are compared through actual S378/S380-renderer SVGs. Artifact run revision IDs differ by run; every current S380 path is checked against its own exact artifact revision. S379 verifies option-value and non-C leader/path identity correspondence to S378.',
  acceptanceThresholdCm: 0.25,
  comparison: {
    optionConfigurations: 17,
    correspondingS378S380OptionsEqual: compare.optionValuesIdenticalToS379,
    correspondingNonCLeaderGeometryEqual: compare.nonCLeaderGeometryIdenticalToS379,
    currentS380PathRevisionBound: compare.s380RevisionBoundPaths,
    keyedTopologyRowsSameCurrentRevision: incidence.sameRevision,
  },
  approvedCDisposition: {
    currentTextCollisionRowsCleared: diagnosis.CKey.unkeyedBaseFailureRows,
    currentKeyedRows: diagnosis.CKey.keyedRenderedRows,
    holdsReleased: diagnosis.CKey.productionHoldsReleased,
  },
  remainingPathFindings: {
    uniquePoms: diagnosis.uniquePomsFailingPathClearance,
    pomsFailingEveryConfiguration: perPom.filter((item) => item.blockedConfigurations === 17).length,
    blockerInstances: diagnosis.pathClearanceInstances,
    geometricCrossings: diagnosis.properPathIntersections,
    positiveClearanceBelowThreshold: diagnosis.positiveClearancesBelow025,
    leaderPairsBelowThreshold: diagnosis.leaderPairsWithin025,
    leaderToTextCrossings: diagnosis.leaderToTextIntersections,
  },
  independentAssemblyResidual: diagnosis.residual,
  blockersBySourcePom: perPom.map((item) => ({
    sourcePomId: item.sourceId,
    fullText: item.sourceText,
    blockedConfigurations: item.blockedConfigurations,
    targetId: item.sourceTarget,
    sourceEntityId: item.sourceEntity,
    interferingPathIdsAndOccurrences: item.nearestPathFrequency,
    interferingSourceIdsAndOccurrences: item.nearestPathSourceFrequency,
    minimumClearanceCm: item.minClearanceCm,
    maximumClearanceCm: item.maxClearanceCm,
  })),
  options: optionRows,
};
await writeFile(`${new URL('.', import.meta.url).pathname.replace(/^\//u, '')}consolidated-polo-blockers.json`, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ options: optionRows.length, blockersEach: [...new Set(optionRows.map((row) => row.activePathBlockerCount))],
  comparisons: summary.comparison, findings: summary.remainingPathFindings,
  output: 'consolidated-polo-blockers.json' }, null, 2));
