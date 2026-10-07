import { readFile, writeFile } from 'node:fs/promises';

const input = new URL('../S403-woven-front-source-crossing-audit/woven-front-path-crossings.json', import.meta.url);
const output = new URL('./woven-collar-crossing-stations.json', import.meta.url);
const source = JSON.parse(await readFile(input, 'utf8'));
const expectedRevision = 'live-draft:woven-shirt:14:14';

function firstSubpath(d) {
  const points = [];
  for (const match of d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)) {
    if (match[1] === 'M' && points.length) break;
    points.push({ x: Number(match[2]), y: Number(match[3]) });
  }
  return points;
}

function pointOnSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  const projected = { x: a.x + dx * t, y: a.y + dy * t };
  return { distanceCm: Math.hypot(point.x - projected.x, point.y - projected.y), t };
}

const records = source.records.map((record) => {
  const front = record.paths.find((path) => path.entityId === 'flat:woven-shirt:FRONT_FLAT:component:front:outline');
  const stand = record.paths.find((path) => path.entityId === 'flat:woven-shirt:FRONT_FLAT:component:outerStand:outline');
  const pair = record.pathPairCrossings.find((item) => item.firstEntityId === front?.entityId
    && item.secondEntityId === stand?.entityId);
  if (!front || !stand || record.revisionId !== expectedRevision || pair?.points.length !== 1) {
    throw new Error(`Missing exact front/outerStand crossing for ${record.caseId}`);
  }
  const shoulder = firstSubpath(front.d);
  const projectedCollar = firstSubpath(stand.d);
  if (shoulder.length !== 2 || projectedCollar.length < 2) throw new Error(`Unexpected source path shape in ${record.caseId}`);
  const crossing = pair.points[0];
  const shoulderPosition = pointOnSegmentDistance(crossing, shoulder[0], shoulder[1]);
  const hiddenShoulderLengthCm = Math.hypot(crossing.x - shoulder[0].x, crossing.y - shoulder[0].y);
  const standSegments = projectedCollar.slice(0, -1).map((a, index) => ({ index, a, b: projectedCollar[index + 1],
    ...pointOnSegmentDistance(crossing, a, projectedCollar[index + 1]) }));
  const nearestStandSegment = standSegments.sort((a, b) => a.distanceCm - b.distanceCm)[0];
  return {
    caseId: record.caseId,
    options: record.options,
    revisionId: record.revisionId,
    sourceEdges: {
      bodyShoulder: 'pattern:woven-shirt:role:front:edge:shoulder',
      projectedCollarRun: 'pattern:woven-shirt:role:outerStand:edge:collar',
    },
    crossingCm: crossing,
    shoulderFraction: shoulderPosition.t,
    hiddenShoulderLengthCm,
    shoulderSegmentClearanceCm: shoulderPosition.distanceCm,
    projectedCollarPolylineSegment: nearestStandSegment.index,
    projectedCollarSegmentFraction: nearestStandSegment.t,
    projectedCollarSegmentClearanceCm: nearestStandSegment.distanceCm,
  };
});

const result = {
  method: 'Reconcile exact same-revision production-renderer path-pair crossing points to the first subpaths. Projection role mapping identifies the front body first subpath as front.shoulder and the outerStand first front run as outerStand.collar.',
  sourceEvidence: {
    rendererMatrix: 'S403 exact production-renderer SVG records',
    revisionId: expectedRevision,
    approvedProjectionDecision: 'G04-S359-WOVEN-FULL-COLLAR-ARCLENGTH',
    frontRun: 'outerStand.collar, from approved woven-neckline transfer station to collar.end, with signed source-normal offset',
    bodyRun: 'front.shoulder from neckline.hps to shoulder point',
    stitch: 'Outer stand ↔ woven neckline joins outerStand.neckline to front.neckline and yoke.neckline; shoulder is not a stitch reference.',
  },
  summary: {
    configurations: records.length,
    exactRevisionConfigurations: records.filter((record) => record.revisionId === expectedRevision).length,
    directShoulderCollarPairCrossings: records.length,
    distinctOptionsAffectingCrossing: ['neckEase', 'standHeight', 'combined-supported'],
    crossingBoundsCm: {
      minX: Math.min(...records.map((record) => record.crossingCm.x)),
      maxX: Math.max(...records.map((record) => record.crossingCm.x)),
      minY: Math.min(...records.map((record) => record.crossingCm.y)),
      maxY: Math.max(...records.map((record) => record.crossingCm.y)),
    },
    maximumShoulderSegmentDistanceCm: Math.max(...records.map((record) => record.shoulderSegmentClearanceCm)),
    hiddenShoulderLengthBoundsCm: {
      min: Math.min(...records.map((record) => record.hiddenShoulderLengthCm)),
      max: Math.max(...records.map((record) => record.hiddenShoulderLengthCm)),
    },
    maximumProjectedCollarSegmentDistanceCm: Math.max(...records.map((record) => record.projectedCollarSegmentClearanceCm)),
  },
  records,
};

await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);
