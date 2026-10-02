import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const here = import.meta.dirname;
const tracePath = join(here, "production-instance-trace", "production-sleeve-band-instance-trace.json");
const trace = JSON.parse(await readFile(tracePath, "utf8"));

function straightSegments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  let index = 0, current = null;
  const segments = [];
  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === "M") current = { x: +tokens[index++], y: +tokens[index++] };
    else if (command === "L") {
      const end = { x: +tokens[index++], y: +tokens[index++] };
      segments.push({ start: current, end });
      current = end;
    } else if (command === "C") {
      // Consume the cubic but leave it out of this independently exact line-only audit.
      index += 6;
      current = { x: +tokens[index - 2], y: +tokens[index - 1] };
    } else if (command !== "Z") throw new Error(`Unexpected SVG command ${command}`);
  }
  return segments;
}

function exactLineIntersection(a, b) {
  const rx = a.end.x - a.start.x, ry = a.end.y - a.start.y;
  const sx = b.end.x - b.start.x, sy = b.end.y - b.start.y;
  const qx = b.start.x - a.start.x, qy = b.start.y - a.start.y;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < 1e-10) return null;
  const t = (qx * sy - qy * sx) / denominator;
  const u = (qx * ry - qy * rx) / denominator;
  if (t <= 1e-7 || t >= 1 - 1e-7 || u <= 1e-7 || u >= 1 - 1e-7) return null;
  return { x: a.start.x + t * rx, y: a.start.y + t * ry };
}

function dedupe(points) {
  return points.filter((point, i) => points.findIndex((candidate) =>
    Math.hypot(candidate.x - point.x, candidate.y - point.y) < 0.015) === i);
}

let checkedPairs = 0, matchedPairs = 0, checkedPoints = 0, matchedPoints = 0;
const records = [];
for (const face of trace.records) {
  const byId = new Map(face.rolePaths.map((path) => [path.entityId, path]));
  const pairs = [];
  for (const pair of face.pathPairCrossings) {
    const first = byId.get(pair.firstEntityId), second = byId.get(pair.secondEntityId);
    if (!first || !second) throw new Error(`${face.caseId}: crossing path was not retained.`);
    const computed = dedupe(straightSegments(first.pathData).flatMap((a) =>
      straightSegments(second.pathData).map((b) => exactLineIntersection(a, b)).filter(Boolean)));
    checkedPairs += 1;
    checkedPoints += pair.points.length;
    const matched = computed.length === pair.points.length && pair.points.every((expected) =>
      computed.some((point) => Math.hypot(point.x - expected.x, point.y - expected.y) < 0.0002));
    if (matched) matchedPairs += 1;
    for (const expected of pair.points) {
      if (computed.some((point) => Math.hypot(point.x - expected.x, point.y - expected.y) < 0.0002)) matchedPoints += 1;
    }
    pairs.push({ firstEntityId: pair.firstEntityId, secondEntityId: pair.secondEntityId,
      sampledOrReportedPoints: pair.points.length, exactLinePoints: computed.length, matched });
  }
  records.push({ caseId: face.caseId, revisionId: face.revisionId, pairs });
}

const result = { method: "independent exact 2D finite-line segment intersection over emitted M/L commands; cubic commands excluded",
  configurationCount: records.length, checkedRolePairs: checkedPairs, matchedRolePairs: matchedPairs,
  reportedCrossingPoints: checkedPoints, matchedCrossingPoints: matchedPoints, records };
await writeFile(join(here, "production-instance-trace", "independent-exact-line-crossings.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ configurationCount: records.length, checkedRolePairs: checkedPairs,
  matchedRolePairs: matchedPairs, reportedCrossingPoints: checkedPoints, matchedCrossingPoints: matchedPoints,
  report: join(here, "production-instance-trace", "independent-exact-line-crossings.json") }, null, 2));
if (records.length !== 28 || matchedPairs !== checkedPairs || matchedPoints !== checkedPoints) {
  throw new Error("The exact straight-segment audit does not confirm every reported role-pair crossing.");
}
