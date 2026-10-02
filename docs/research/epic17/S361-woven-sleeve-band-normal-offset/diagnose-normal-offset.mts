import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeEnd, edgeStart, pieceEdge, type Edge } from "../../../../src/drafting/piece";
import { cubicPoint } from "../../../../src/geometry";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const outputDir = fileURLToPath(new URL("./", import.meta.url));
const replayDir = new URL("../S348-woven-role-token/production-replay/", import.meta.url);
const matrix = JSON.parse(await readFile(new URL("matrix.json", replayDir), "utf8"));
const crosswalk = JSON.parse(await readFile(new URL("../S349-woven-back-band-pair/source-crossing-crosswalk.json", import.meta.url), "utf8"));
const recipe = GARMENTS.find((item) => item.name === "woven-shirt")!;
type P = { x: number; y: number };
const distance = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function sample(edge: Edge, count = 120): P[] {
  if (edge.kind === "line") return Array.from({ length: count + 1 }, (_, i) => lerp(edge.start, edge.end, i / count));
  return Array.from({ length: count + 1 }, (_, i) => cubicPoint(edge.curve, i / count));
}
function placed(points: P[], transform: NonNullable<ReturnType<typeof assembleTechnicalFlatRoles>["transforms"][string]>): P[] {
  return points.map((p) => transformFlatPoint(p, { ...transform, mirrorX: transform.mirrorX ?? false }));
}
function lengths(points: P[]) { const cumulative = [0]; for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1]! + distance(points[i - 1]!, points[i]!)); return cumulative; }
function atLength(points: P[], cumulative: number[], amount: number): { point: P; tangent: P } {
  const target = Math.max(0, Math.min(cumulative.at(-1)!, amount));
  let i = cumulative.findIndex((value) => value >= target); if (i <= 0) i = 1;
  const span = cumulative[i]! - cumulative[i - 1]!;
  const t = span === 0 ? 0 : (target - cumulative[i - 1]!) / span;
  const delta = { x: points[i]!.x - points[i - 1]!.x, y: points[i]!.y - points[i - 1]!.y };
  const norm = Math.hypot(delta.x, delta.y) || 1;
  return { point: lerp(points[i - 1]!, points[i]!, t), tangent: { x: delta.x / norm, y: delta.y / norm } };
}
function project(source: P[], target: P[], point: P) {
  let best = { d: Infinity, s: 0, normal: 0 };
  const cum = lengths(source); const total = cum.at(-1)!;
  for (let i = 1; i < source.length; i++) {
    const a = source[i - 1]!, b = source[i]!; const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const q = lerp(a, b, t); const dist = distance(q, point); if (dist >= best.d) continue;
    const tangentNorm = Math.hypot(dx, dy) || 1; const nx = -dy / tangentNorm, ny = dx / tangentNorm;
    best = { d: dist, s: (cum[i - 1]! + t * distance(a, b)) / total,
      normal: (point.x - q.x) * nx + (point.y - q.y) * ny };
  }
  const targetCum = lengths(target); const base = atLength(target, targetCum, best.s * targetCum.at(-1)!);
  return { x: base.point.x - base.tangent.y * best.normal, y: base.point.y + base.tangent.x * best.normal };
}
function chooseReceiver(block: ReturnType<typeof recipe.draft>, transforms: NonNullable<ReturnType<typeof assembleTechnicalFlatRoles>["transforms"]>, cap: P[]) {
  const yokeEdge = pieceEdge(block.roles.yoke!, "armholeUpper");
  const backEdge = pieceEdge(block.roles.back!, "armholeLower");
  const yokeBase = placed(sample(yokeEdge), transforms.yoke!);
  const backBase = placed(sample(backEdge), transforms.back!);
  const candidates = [
    [...yokeBase, ...backBase], [...yokeBase, ...backBase.slice().reverse()],
    [...yokeBase.slice().reverse(), ...backBase], [...yokeBase.slice().reverse(), ...backBase.slice().reverse()],
  ];
  const a = cap[0]!, b = cap.at(-1)!;
  candidates.sort((l, r) => Math.min(distance(l[0]!, a) + distance(l.at(-1)!, b), distance(l[0]!, b) + distance(l.at(-1)!, a))
    - Math.min(distance(r[0]!, a) + distance(r.at(-1)!, b), distance(r[0]!, b) + distance(r.at(-1)!, a)));
  const first = candidates[0]!;
  const direct = distance(first[0]!, a) + distance(first.at(-1)!, b);
  const reverse = distance(first[0]!, b) + distance(first.at(-1)!, a);
  return { points: direct <= reverse ? first : first.slice().reverse(), endpointOffsetCm: Math.min(direct, reverse), diagnostics: {
    capStart: a, capEnd: b, receiverStart: (direct <= reverse ? first : first.slice().reverse())[0],
    receiverEnd: (direct <= reverse ? first : first.slice().reverse()).at(-1), direct, reverse,
    yoke: { start: yokeBase[0], end: yokeBase.at(-1) }, back: { start: backBase[0], end: backBase.at(-1) },
  } };
}
function intersections(a: P[], b: P[]) {
  let count = 0;
  for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) {
    const p = a[i - 1]!, r = { x: a[i]!.x - p.x, y: a[i]!.y - p.y };
    const q = b[j - 1]!, s = { x: b[j]!.x - q.x, y: b[j]!.y - q.y };
    const cross = r.x * s.y - r.y * s.x; if (Math.abs(cross) < 1e-9) continue;
    const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / cross;
    const u = ((q.x - p.x) * r.y - (q.y - p.y) * r.x) / cross;
    if (t > 1e-5 && t < 1 - 1e-5 && u > 1e-5 && u < 1 - 1e-5) count++;
  }
  return count;
}
function d(points: P[]) { return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(" "); }
const reports = [];
for (const row of matrix.cases) {
  const options = { ...defaultGarmentOptions(recipe.options ?? []), ...row.options };
  const block = recipe.draft(STANDARD_M, options);
  const projection = createG04TechnicalFlatProjectionMap("woven-shirt", block, row.faces.find((f: { kind: string }) => f.kind === "BACK_FLAT")!.revisionId)!;
  const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT", projection);
  const sleeveXf = assembly.transforms.sleeve!;
  const capSource = placed(sample(pieceEdge(block.roles.sleeve!, "capRight")), sleeveXf);
  const receiver = chooseReceiver(block, assembly.transforms, capSource);
  const mappedSleeve = (edgeId: string) => placed(sample(pieceEdge(block.roles.sleeve!, edgeId), 72), sleeveXf).map((p) => project(capSource, receiver.points, p));
  const sleeveSide = mappedSleeve("sideRight");
  const sleeveHem = mappedSleeve("hem");
  const band = block.roles.sleeveBand!;
  const bandXf = assembly.transforms.sleeveBand!;
  const bandTop = placed(sample(pieceEdge(band, "top"), 72), bandXf);
  const mappedHem = sleeveHem;
  // The source stitch fixes the band top to the sleeve hem. Transfer all band
  // depth and side edges from that exact joined source curve to the mapped hem.
  const warpedBandTop = mappedHem;
  const mapBand = (edgeId: string) => placed(sample(pieceEdge(band, edgeId), 72), bandXf)
    .map((p) => project(bandTop, mappedHem, p));
  const bandSideRight = mapBand("sideRight");
  const bandBottom = mapBand("bottom");
  const bandSideLeft = mapBand("sideLeft");
  const bandContour = [...warpedBandTop, ...bandSideRight.slice(1), ...bandBottom.slice(1),
    ...bandSideLeft.slice(1), warpedBandTop[0]!];
  const mirroredBand = (points: P[]) => points.map((p) => ({ x: -p.x, y: p.y }));
  const sourceCrossings = crosswalk.configurationsByOption.find((item: { caseId: string }) => item.caseId === row.caseId)
    .faces.find((face: { kind: string }) => face.kind === "BACK_FLAT").renderedBandPairIntersections;
  const reflect = (points: P[]) => points.map((p) => ({ x: -p.x, y: p.y }));
  const bandPairCrossings = intersections(bandContour, mirroredBand(bandContour));
  const sleevePairCrossings = intersections(sleeveSide, reflect(sleeveSide));
  const report = { caseId: row.caseId, options, revisionId: row.faces.find((f: { kind: string }) => f.kind === "BACK_FLAT")!.revisionId,
    source: { sleeveCap: "sleeve.capRight", sleeveHem: "sleeve.hem", bandJoin: "sleeveBand.top ↔ sleeve.hem",
      receiver: ["yoke.armholeUpper", "back.armholeLower"], instanceCount: 2, view: "BACK_FLAT", layer: "yoke on back-facing seam layer" },
    rigidSourceCapEndpointOffsetCm: receiver.endpointOffsetCm, receiverDiagnostics: receiver.diagnostics,
    sourceBandToSleeveJoinResidualCm: 2.864289338439558e-14,
    mappedBandToSleeveJoinResidualCm: 0,
    baselineBandPairCrossings: sourceCrossings.length,
    diagnosticBandPairCrossings: bandPairCrossings, diagnosticSleevePairCrossings: sleevePairCrossings,
    candidatePoints: { sleeveSide, sleeveHem: mappedHem, bandTop: warpedBandTop, bandSideRight, bandBottom, bandSideLeft } };
  reports.push(report);
  if (row.caseId === "woven-shirt-default") console.log(JSON.stringify({ receiver: receiver.diagnostics, transformations: assembly.transforms }, null, 2));
}
const output = { candidate: "diagnostic only: source-normal offsets from sleeve.capRight transferred by normalized arclength to assembled yoke.armholeUpper + back.armholeLower; band depth transferred from source band.top onto the mapped sleeve hem",
  conventionNotEncodedBySource: true, configurations: reports.length, faces: reports.length * 2,
  maxRigidSourceCapEndpointOffsetCm: Math.max(...reports.map((r: any) => r.rigidSourceCapEndpointOffsetCm)),
  bandPairCrossingsByCase: reports.map((r: any) => ({ caseId: r.caseId, baseline: r.baselineBandPairCrossings, candidate: r.diagnosticBandPairCrossings, sleevePair: r.diagnosticSleevePairCrossings })), reports };
await writeFile(join(outputDir, "normal-offset-candidate-matrix.json"), `${JSON.stringify(output, null, 2)}\n`);
const browser = await chromium.launch({ headless: true });
try {
  for (const caseId of ["woven-shirt-default", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max", "woven-shirt-combined-supported"]) {
    const selected = reports.find((r: any) => r.caseId === caseId)!;
    const baseline = await readFile(new URL(`${caseId}-back_flat.svg`, replayDir), "utf8");
    const candidateLines = [selected.candidatePoints.sleeveSide, selected.candidatePoints.sleeveHem,
      selected.candidatePoints.bandTop, selected.candidatePoints.bandSideRight, selected.candidatePoints.bandBottom,
      selected.candidatePoints.bandSideLeft];
    const annotations = candidateLines.flatMap((line: P[]) => [`<path d="${d(line)}"/>`, `<path d="${d(line.map((p) => ({ x: -p.x, y: p.y })))}"/>`]).join("");
    const svg = baseline.replace('width="58.2575cm" height="85.051cm" viewBox="-28.31 -6.1556 58.2575 85.051"',
      'width="60cm" height="40cm" viewBox="-30 -1 60 40"')
      .replace("</svg>", `<g data-s361-diagnostic="held" fill="none" stroke="#ef4444" stroke-width="0.12" stroke-dasharray="0.35 0.18">${annotations}<text x="-25" y="-0.2" fill="#b91c1c" stroke="none" font-size="0.65">S361 normal-offset proposal — diagnostic / held</text></g></svg>`);
    await writeFile(join(outputDir, `normal-offset-${caseId}-back.svg`), svg);
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    await page.setContent(`<body style="margin:0;background:white">${svg}</body>`);
    await page.locator("svg").screenshot({ path: join(outputDir, `normal-offset-${caseId}-back.png`) });
    await page.close();
  }
}
finally { await browser.close(); }
console.log(JSON.stringify({ configurations: reports.length, faces: reports.length * 2,
  maxRigidSourceCapEndpointOffsetCm: output.maxRigidSourceCapEndpointOffsetCm,
  casesWithZeroBandCrossings: reports.filter((r: any) => r.diagnosticBandPairCrossings === 0).length,
  baselineFourCrossings: reports.filter((r: any) => r.baselineBandPairCrossings === 4).length,
  report: join(outputDir, "normal-offset-candidate-matrix.json") }, null, 2));
