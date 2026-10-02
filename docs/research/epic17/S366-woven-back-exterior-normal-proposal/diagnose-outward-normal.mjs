import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting/index.ts";
import { edgeStart, pieceEdge } from "../../../../src/drafting/piece.ts";
import { cubicPoint } from "../../../../src/geometry/index.ts";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly.ts";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection.ts";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform.ts";

const root = fileURLToPath(new URL("./", import.meta.url));
const replayDir = new URL("../S363-woven-pom-leader-readability/production-replay/", import.meta.url);
const tracePath = new URL("../S365-woven-back-sleeve-band-diagnosis/production-instance-trace/production-sleeve-band-instance-trace.json", import.meta.url);
const annotatedDir = join(root, "outward-normal-candidate");
await mkdir(annotatedDir, { recursive: true });
const matrix = JSON.parse(await readFile(new URL("matrix.json", replayDir), "utf8"));
const productionTrace = JSON.parse(await readFile(tracePath, "utf8"));
const recipe = GARMENTS.find((item) => item.name === "woven-shirt");
if (!recipe) throw new Error("Woven recipe was not found.");
const P = (x, y) => ({ x, y });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function sample(edge, count = 160) {
  if (edge.kind === "line") return Array.from({ length: count + 1 }, (_, index) => lerp(edge.start, edge.end, index / count));
  return Array.from({ length: count + 1 }, (_, index) => cubicPoint(edge.curve, index / count));
}
function placed(points, transform) {
  return points.map((point) => transformFlatPoint(point, { ...transform, mirrorX: transform.mirrorX ?? false }));
}
function lengths(points) {
  const values = [0];
  for (let index = 1; index < points.length; index += 1) values.push(values[index - 1] + distance(points[index - 1], points[index]));
  return values;
}
function atLength(points, cumulative, amount) {
  const target = Math.max(0, Math.min(cumulative.at(-1), amount));
  let index = cumulative.findIndex((value) => value >= target);
  if (index <= 0) index = 1;
  const span = cumulative[index] - cumulative[index - 1];
  const t = span === 0 ? 0 : (target - cumulative[index - 1]) / span;
  const delta = { x: points[index].x - points[index - 1].x, y: points[index].y - points[index - 1].y };
  const norm = Math.hypot(delta.x, delta.y) || 1;
  return { point: lerp(points[index - 1], points[index], t), tangent: { x: delta.x / norm, y: delta.y / norm } };
}
function projectOutboard(source, target, point, sideSign) {
  const cumulative = lengths(source), total = cumulative.at(-1);
  let best = { distance: Infinity, fraction: 0, offset: 0 };
  for (let index = 1; index < source.length; index += 1) {
    const a = source[index - 1], b = source[index];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const nearest = lerp(a, b, t), separation = distance(nearest, point);
    if (separation >= best.distance) continue;
    const norm = Math.hypot(dx, dy) || 1, nx = -dy / norm, ny = dx / norm;
    best = { distance: separation, fraction: (cumulative[index - 1] + t * distance(a, b)) / total,
      offset: (point.x - nearest.x) * nx + (point.y - nearest.y) * ny };
  }
  const targetLengths = lengths(target), station = atLength(target, targetLengths, best.fraction * targetLengths.at(-1));
  const normalA = { x: -station.tangent.y, y: station.tangent.x };
  const normalB = { x: station.tangent.y, y: -station.tangent.x };
  const normal = normalA.x * sideSign >= normalB.x * sideSign ? normalA : normalB;
  const signedOutboardDistance = Math.abs(best.offset);
  return { point: { x: station.point.x + normal.x * signedOutboardDistance,
    y: station.point.y + normal.y * signedOutboardDistance },
    stationFraction: best.fraction, sourceSignedOffset: best.offset, outboardDistance: signedOutboardDistance,
    normal, receiverPoint: station.point };
}
function targetReceiver(block, transforms, cap) {
  const yoke = placed(sample(pieceEdge(block.roles.yoke, "armholeUpper")), transforms.yoke);
  const back = placed(sample(pieceEdge(block.roles.back, "armholeLower")), transforms.back);
  const variants = [[...yoke, ...back], [...yoke, ...back.slice().reverse()],
    [...yoke.slice().reverse(), ...back], [...yoke.slice().reverse(), ...back.slice().reverse()]];
  const a = cap[0], b = cap.at(-1);
  variants.sort((left, right) => {
    const score = (line) => Math.min(distance(line[0], a) + distance(line.at(-1), b), distance(line[0], b) + distance(line.at(-1), a));
    return score(left) - score(right);
  });
  const chosen = variants[0];
  return distance(chosen[0], a) + distance(chosen.at(-1), b) <= distance(chosen[0], b) + distance(chosen.at(-1), a)
    ? chosen : chosen.slice().reverse();
}
function dedupe(points, tolerance = 0.025) {
  return points.filter((point, index) => points.findIndex((candidate) => distance(candidate, point) < tolerance) === index);
}
function properIntersections(first, second) {
  const points = [];
  for (let i = 1; i < first.length; i += 1) for (let j = 1; j < second.length; j += 1) {
    const a = first[i - 1], b = first[i], c = second[j - 1], d = second[j];
    const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
    const denominator = rx * sy - ry * sx;
    if (Math.abs(denominator) < 1e-10) continue;
    const qx = c.x - a.x, qy = c.y - a.y;
    const t = (qx * sy - qy * sx) / denominator, u = (qx * ry - qy * rx) / denominator;
    if (t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6) points.push({ x: a.x + t * rx, y: a.y + t * ry });
  }
  return dedupe(points);
}
function selfIntersections(points) {
  const hits = [];
  const segmentCount = points.length - 1;
  for (let i = 1; i <= segmentCount; i += 1) {
    for (let j = i + 2; j <= segmentCount; j += 1) {
      if (i === 1 && j === segmentCount) continue;
      hits.push(...properIntersections([points[i - 1], points[i]], [points[j - 1], points[j]]));
    }
  }
  return dedupe(hits);
}
function parseSvgSegments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const segments = [];
  let index = 0, current = null, subpath = null;
  while (index < tokens.length) {
    const op = tokens[index++];
    if (op === "M") { current = P(+tokens[index++], +tokens[index++]); subpath = current; }
    else if (op === "L") { const next = P(+tokens[index++], +tokens[index++]); segments.push([current, next]); current = next; }
    else if (op === "C") {
      const c1 = P(+tokens[index++], +tokens[index++]), c2 = P(+tokens[index++], +tokens[index++]), next = P(+tokens[index++], +tokens[index++]);
      let previous = current;
      for (let step = 1; step <= 160; step += 1) {
        const t = step / 160, u = 1 - t;
        const point = P(u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * next.x,
          u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * next.y);
        segments.push([previous, point]); previous = point;
      }
      current = next;
    } else if (op === "Z" && current && subpath) { segments.push([current, subpath]); current = subpath; }
    else if (op !== "Z") throw new Error(`Unsupported SVG command ${op}`);
  }
  return segments;
}
function segmentCrossings(points, segments) {
  return dedupe(segments.flatMap((segment) => properIntersections(points, segment)));
}
function path(points, close = false) {
  const commands = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(5)} ${point.y.toFixed(5)}`);
  return `${commands.join(" ")}${close ? " Z" : ""}`;
}
function mirrored(points) { return points.map((point) => ({ x: -point.x, y: point.y })); }

const reports = [];
for (const row of matrix.cases) {
  const backRequest = row.faces.find((face) => face.kind === "BACK_FLAT");
  const sourceOutput = productionTrace.records.find((record) => record.caseId === row.caseId);
  if (!backRequest?.revisionId || !sourceOutput || sourceOutput.revisionId !== backRequest.revisionId) throw new Error(`${row.caseId}: production source/output revision is not exact.`);
  const options = { ...defaultGarmentOptions(recipe.options ?? []), ...row.options };
  const block = recipe.draft(STANDARD_M, options);
  const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, backRequest.revisionId);
  const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT", projection);
  const sleeveTransform = assembly.transforms.sleeve, bandTransform = assembly.transforms.sleeveBand;
  const sourceCap = placed(sample(pieceEdge(block.roles.sleeve, "capRight")), sleeveTransform);
  const receiver = targetReceiver(block, assembly.transforms, sourceCap);
  const mapSleeveEdge = (edgeId) => placed(sample(pieceEdge(block.roles.sleeve, edgeId), 120), sleeveTransform)
    .map((point) => projectOutboard(sourceCap, receiver, point, 1).point);
  const sleeveSideRight = mapSleeveEdge("sideRight");
  const sleeveHemRight = mapSleeveEdge("hem");
  const sourceBand = block.roles.sleeveBand;
  const sourceBandTop = placed(sample(pieceEdge(sourceBand, "top"), 120), bandTransform);
  const bandSourcePoints = (edgeId) => placed(sample(pieceEdge(sourceBand, edgeId), 120), bandTransform);
  const mapBandEdge = (edgeId) => bandSourcePoints(edgeId).map((point) => projectOutboard(sourceBandTop, sleeveHemRight, point, 1).point);
  const bandSideRight = mapBandEdge("sideRight");
  const bandBottomRight = mapBandEdge("bottom");
  const bandSideLeft = mapBandEdge("sideLeft");
  const bandTopRight = sleeveHemRight;
  const bandFoldMark = sourceBand.marks?.find((mark) => mark.name === "bandFold");
  const bandFoldLine = bandFoldMark?.kind === "foldLine"
    ? placed([bandFoldMark.start, bandFoldMark.end], bandTransform).map((point) => projectOutboard(sourceBandTop, sleeveHemRight, point, 1).point)
    : [];
  const bandContourRight = [...bandTopRight, ...bandSideRight.slice(1), ...bandBottomRight.slice(1), ...bandSideLeft.slice(1), bandTopRight[0]];
  // This analysis outline remains open at the fill-only sleeve boundary; do not stroke the artificial closing edge.
  const sleeveContourRight = [...receiver, ...sleeveSideRight.slice(1), ...sleeveHemRight.slice(1)];
  const sleeveContourLeft = mirrored(sleeveContourRight), bandContourLeft = mirrored(bandContourRight);
  const sleeveSelfPoints = dedupe(selfIntersections(sleeveContourRight), 0.15);
  const bandSelfPoints = dedupe(selfIntersections(bandContourRight), 0.15);
  const bandPair = properIntersections(bandContourRight, bandContourLeft);
  const sleevePair = properIntersections(sleeveContourRight, sleeveContourLeft);
  const sleeveToBand = properIntersections(sleeveContourRight, bandContourLeft)
    .concat(properIntersections(sleeveContourLeft, bandContourRight));
  const bodyPaths = sourceOutput.rolePaths.filter((entry) => entry.roleId === "back" || entry.roleId === "yoke");
  const outlineSegments = bodyPaths.map((entry) => ({ entityId: entry.entityId, roleId: entry.roleId,
    segments: parseSvgSegments(entry.pathData) }));
  const bodyCrossings = [
    ...outlineSegments.flatMap((outline) => [{ pair: `sleeve/back-or-yoke:${outline.roleId}`, points: segmentCrossings(sleeveSideRight, outline.segments) },
      { pair: `sleeve/reflected-back-or-yoke:${outline.roleId}`, points: segmentCrossings(mirrored(sleeveSideRight), outline.segments) },
      { pair: `band/back-or-yoke:${outline.roleId}`, points: segmentCrossings(bandContourRight, outline.segments) },
      { pair: `band/reflected-back-or-yoke:${outline.roleId}`, points: segmentCrossings(bandContourLeft, outline.segments) }])
  ];
  const joinPoints = bandTopRight.map((point, index) => distance(point, sleeveHemRight[index]));
  const record = { caseId: row.caseId, options, revisionId: backRequest.revisionId,
    source: { sleeveCap: "sleeve.capRight", sleeveSide: "sleeve.sideRight", sleeveHem: "sleeve.hem",
      bandEdges: ["sleeveBand.top", "sleeveBand.sideRight", "sleeveBand.bottom", "sleeveBand.sideLeft"],
      receiverEdges: ["yoke.armholeUpper", "back.armholeLower"], reflectionAxis: "back.centerBack",
      sourceBandJoin: "sleeveBand.top ↔ sleeve.hem", sourceBandDepthCm: options.sleeveBandDepth,
      sourceCapEaseCm: block.stitches.find((stitch) => stitch.label === "Woven sleeve-cap ease")?.ease ?? null },
    roleTransforms: { sleeve: sleeveTransform, sleeveBand: bandTransform },
    receiverEndpoints: [receiver[0], receiver.at(-1)],
    sourceGeometry: { sleeveSideRight: { start: edgeStart(pieceEdge(block.roles.sleeve, "sideRight")), end: pieceEdge(block.roles.sleeve, "sideRight").kind === "line" ? pieceEdge(block.roles.sleeve, "sideRight").end : null },
      sleeveHemSourceLengthCm: sample(pieceEdge(block.roles.sleeve, "hem")).reduce((sum, point, index, points) => index ? sum + distance(points[index - 1], point) : sum, 0),
      bandTopSourceLengthCm: sample(pieceEdge(sourceBand, "top")).reduce((sum, point, index, points) => index ? sum + distance(points[index - 1], point) : sum, 0) },
    proposedRule: "source arclength/signed-normal decomposition; mapped receiver normal selected away from back.centerBack; absolute offset magnitude",
    instanceProjection: { axis: "back.centerBack", axisX: 0, right: { normalSign: 1, transform: { sleeve: sleeveTransform, sleeveBand: bandTransform } },
      left: { normalSign: -1, reflection: "x -> -x", transform: "mirror right candidate across back.centerBack" } },
    instanceCount: { sleeve: 2, sleeveBand: 2 },
    joinResidualCm: { imposedMappedTopToHem: Math.max(...joinPoints), mappedJoinMethod: "bandTopRight aliases sleeveHemRight; zero is imposed by construction, not an independent measurement", measuredOriginalSourceJoin: sourceOutput.sleeveToBandTopJoin.endpointResidualCm ?? null },
    intersections: { bandPair: bandPair.length, sleevePair: sleevePair.length, sleeveToOppositeBand: dedupe(sleeveToBand).length,
      sleeveSelf: sleeveSelfPoints.length, bandSelf: bandSelfPoints.length, sleeveSelfPoints, bandSelfPoints,
      bodyAndYoke: bodyCrossings.map((entry) => ({ pair: entry.pair, count: entry.points.length, points: entry.points })) },
    geometry: { receiver, sleeveSideRight, sleeveHemRight, bandTopRight, bandSideRight, bandBottomRight, bandSideLeft, bandFoldLine,
      sleeveContourRight, bandContourRight, sleeveContourLeft, bandContourLeft } };
  reports.push(record);
}

const outputs = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const caseId of ["woven-shirt-default", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max",
    "woven-shirt-sleeveBandDepth-max", "woven-shirt-combined-supported"]) {
    const record = reports.find((entry) => entry.caseId === caseId);
    const input = await readFile(new URL(`${caseId}-back_flat.svg`, replayDir), "utf8");
    const colorLayer = `<style>
      path[data-s366-proposal="sleeve"]{stroke:#0284c7!important;stroke-width:.16!important;fill:none!important}
      path[data-s366-proposal="band"]{stroke:#f97316!important;stroke-width:.16!important;fill:none!important}
      path[data-s366-proposal="pair"]{stroke:#dc2626!important;stroke-width:.12!important;fill:none!important}
      path[data-s366-proposal="fold"]{stroke:#eab308!important;stroke-width:.14!important;stroke-dasharray:.35 .2!important;fill:none!important}
      circle[data-s366-crossing="true"]{fill:#dc2626;stroke:white;stroke-width:.08}
      text[data-s366-title="true"]{font:0.7px Arial,sans-serif;fill:#111;stroke:none}
    </style>`;
    const candidates = [
      `<path data-s366-proposal="sleeve" d="${path(record.geometry.sleeveContourRight)}"/>`,
      `<path data-s366-proposal="sleeve" d="${path(record.geometry.sleeveContourLeft)}"/>`,
      `<path data-s366-proposal="band" d="${path(record.geometry.bandContourRight,true)}"/>`,
      `<path data-s366-proposal="band" d="${path(record.geometry.bandContourLeft,true)}"/>`,
      `<path data-s366-proposal="fold" d="${path(record.geometry.bandFoldLine)}"/>`,
      ...record.intersections.bandSelfPoints.map((point) => `<circle data-s366-crossing="true" cx="${point.x}" cy="${point.y}" r="0.2"/>`),
      `<path data-s366-proposal="pair" d="${path(record.geometry.bandTopRight)}"/>`,
      `<text data-s366-title="true" x="-28" y="-0.25">S366 diagnostic proposal — receiver normal away from center back; held</text>`,
    ].join("");
    const svg = input.replace("</svg>", `${colorLayer}<g data-s366-candidate="held">${candidates}</g></svg>`);
    const file = join(annotatedDir, `${caseId}-outward-normal-candidate.svg`);
    const png = join(annotatedDir, `${caseId}-outward-normal-candidate.png`);
    await writeFile(file, svg);
    const page = await browser.newPage({ viewport: { width: 1700, height: 1200 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:white">${svg}</body></html>`);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.locator("svg").screenshot({ path: png });
    await page.close();
    outputs.push({ caseId, revisionId: record.revisionId, svg: file, png, pageErrors: errors.length });
  }
} finally { await browser.close(); }

const output = { candidate: "diagnostic-only receiver-exterior-normal offset; no production mapping or accepted face",
  disposition: "RETAIN_HOLD — every tested option has a self-crossing sleeve-band outline",
  sourceMatrix: "S363 same-revision production Chromium option matrix and S365 path identity trace",
  configurations: reports.length, backFaceCandidates: reports.length, allSameRevision: new Set(reports.map((entry) => entry.revisionId)).size === 1,
  proposalConvention: "map source cap arclength to yoke.armholeUpper + back.armholeLower; carry absolute source-normal offsets on the receiver normal pointing away from back.centerBack; transfer band profile onto mapped sleeve hem",
  faces: 56, frontRequests: matrix.cases.length, currentFrontEmitted: matrix.cases.reduce((sum, row) => sum + row.faces.find((face) => face.kind === "FRONT_FLAT").svgCount, 0),
  outputOptions: outputs, aggregate: {
    bandPairCrossings: reports.map((entry) => entry.intersections.bandPair),
    sleevePairCrossings: reports.map((entry) => entry.intersections.sleevePair),
    sleeveBandCrossings: reports.map((entry) => entry.intersections.sleeveToOppositeBand),
    maxImposedMappedTopToHemCm: Math.max(...reports.map((entry) => entry.joinResidualCm.imposedMappedTopToHem)),
    maxBandSelfIntersections: Math.max(...reports.map((entry) => entry.intersections.bandSelf)),
    maxSleeveSelfIntersections: Math.max(...reports.map((entry) => entry.intersections.sleeveSelf)),
  }, reports };
await writeFile(join(root, "outward-normal-candidate-matrix.json"), `${JSON.stringify(output, null, 2)}
`);
console.log(JSON.stringify({ configurations: output.configurations, faces: output.faces, allSameRevision: output.allSameRevision,
  maxImposedMappedTopToHemCm: output.aggregate.maxImposedMappedTopToHemCm,
  bandPairCrossings: [...new Set(output.aggregate.bandPairCrossings)].sort(),
  sleevePairCrossings: [...new Set(output.aggregate.sleevePairCrossings)].sort(),
  sleeveBandCrossings: [...new Set(output.aggregate.sleeveBandCrossings)].sort(),
  selfIntersections: { sleeve: output.aggregate.maxSleeveSelfIntersections, band: output.aggregate.maxBandSelfIntersections },
  outputOptions: outputs }, null, 2));
if (reports.length !== 28 || !output.allSameRevision || outputs.some((entry) => entry.pageErrors !== 0)) {
  throw new Error("S366 candidate identity or rendered output matrix is incomplete.");
}
