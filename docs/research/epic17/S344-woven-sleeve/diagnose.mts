import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { WOVEN_SHIRT } from "../../../../src/drafting/recipe";
import { edgeLength, edgeStart, edgeEnd } from "../../../../src/drafting/piece";
import type { Edge } from "../../../../src/drafting/piece";
import { cubicPoint } from "../../../../src/geometry/curve";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { compileTechnicalFlatSourceGeometry } from "../../../../src/render/technical-flat-geometry";
import { createG04TechnicalFlatProjectionMap, edgeParameterAtArclengthFraction } from "../../../../src/render/technical-flat-projection";
import { transformFlatPoint } from "../../../../src/render/technical-flat-transform";

const root = resolve(import.meta.dirname, "../../../..");
const folder = resolve(root, "docs/research/epic17/S344-woven-sleeve");
await mkdir(folder, { recursive: true });
const production = JSON.parse(await readFile(resolve(root,
  "docs/research/epic17/S343-woven-seam/production-replay/matrix.json"), "utf8"));
const cases = production.cases;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const edgeAt = (edges: readonly Edge[], name: string) => edges.find((edge) => edge.name === name)!;
const transform = (point: { x: number; y: number }, placement: NonNullable<ReturnType<typeof assembleTechnicalFlatRoles>["transforms"][string]>) =>
  transformFlatPoint(point, placement);
const pointOnEdge = (edge: Edge, fraction: number) => edge.kind === "line"
  ? { x: edge.start.x + (edge.end.x - edge.start.x) * fraction, y: edge.start.y + (edge.end.y - edge.start.y) * fraction }
  : cubicPoint(edge.curve, edgeParameterAtArclengthFraction(edge, fraction)!);
const pointAtFraction = (edge: Edge, fraction: number, placement: NonNullable<ReturnType<typeof assembleTechnicalFlatRoles>["transforms"][string]>) =>
  transform(pointOnEdge(edge, fraction), placement);
const pointOnInterface = (edges: readonly Edge[], fraction: number) => {
  const total = edges.reduce((sum, edge) => sum + edgeLength(edge), 0);
  let target = total * fraction;
  for (const edge of edges) {
    const length = edgeLength(edge);
    if (target <= length) return pointOnEdge(edge, target / length);
    target -= length;
  }
  return pointOnEdge(edges.at(-1)!, 1);
};
const records = [];
const selected = new Set(["woven-shirt-default", "woven-shirt-yokeDepth-max"]);
const svgFiles: string[] = [];

for (const testCase of cases) {
  const block = WOVEN_SHIRT.draft(STANDARD_M, testCase.options);
  const revision = `s344-diagnostic:${testCase.caseId}`;
  const map = createG04TechnicalFlatProjectionMap("woven-shirt", block, revision)!;
  const front = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT", map);
  const back = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT", map);
  const backGeometry = compileTechnicalFlatSourceGeometry("woven-shirt", block, revision, "BACK_FLAT", map);
  const yokeSeamPrimitive = backGeometry.primitives.find((primitive) => primitive.kind === "path"
    && primitive.sourceEdgeIds?.some((edgeId) => edgeId === "pattern:woven-shirt:role:yoke:edge:yokeSeam"));
  const allCapLeft = edgeAt(block.roles.sleeve!.edges, "capLeft");
  const capRight = edgeAt(block.roles.sleeve!.edges, "capRight");
  const frontArmhole = block.roles.front!.edges.find((edge) => edge.name === "armhole")!;
  const yokeArmhole = block.roles.yoke!.edges.find((edge) => edge.name === "armholeUpper")!;
  const backArmhole = block.roles.back!.edges.find((edge) => edge.name === "armholeLower")!;
  const frontLength = edgeLength(frontArmhole);
  const yokeLength = edgeLength(yokeArmhole);
  const backLength = edgeLength(backArmhole);
  const capLength = edgeLength(allCapLeft) + edgeLength(capRight);
  const bodyLength = frontLength + yokeLength + backLength;
  const stationFraction = frontLength / bodyLength;
  const yokeJoinFraction = (frontLength + yokeLength) / bodyLength;
  const mappedSleeve = map.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "sleeve")!;
  const mappedFrontRun = mappedSleeve.runs.find((run) => run.edgeId === "capLeft")!;
  const frontBoundary = pointAtFraction(allCapLeft, (mappedFrontRun.to as { fraction?: number }).fraction ?? 1, front.transforms.sleeve!);
  const frontUnderarm = dist(pointAtFraction(allCapLeft, 0, front.transforms.sleeve!), pointAtFraction(frontArmhole, 1, front.transforms.front!));
  const frontShoulder = dist(frontBoundary, pointAtFraction(frontArmhole, 0, front.transforms.front!));
  const backShoulder = dist(pointAtFraction(capRight, 0, back.transforms.sleeve!), pointAtFraction(yokeArmhole, 0, back.transforms.yoke!));
  const backUnderarm = dist(pointAtFraction(capRight, 1, back.transforms.sleeve!), pointAtFraction(backArmhole, 1, back.transforms.back!));
  const backSleeveYokeStation = pointOnInterface([allCapLeft, capRight], yokeJoinFraction);
  const yokeBackSeamPoint = pointAtFraction(yokeArmhole, 1, back.transforms.yoke!);
  const backYokeSeamPoint = pointAtFraction(backArmhole, 0, back.transforms.back!);
  const sleeveToYokeBoundaryGap = dist(transform(backSleeveYokeStation, back.transforms.sleeve!), yokeBackSeamPoint);
  const sleeveToBackBoundaryGap = dist(transform(backSleeveYokeStation, back.transforms.sleeve!), backYokeSeamPoint);
  const mappedBand = map.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "sleeveBand")!;
  const band = block.roles.sleeveBand!;
  const sleeve = block.roles.sleeve!;
  const bandTop = band.edges.find((edge) => edge.name === "top")!;
  const sleeveHem = sleeve.edges.find((edge) => edge.name === "hem")!;
  const frontBandError = Math.max(
    dist(pointAtFraction(bandTop, 0, front.transforms.sleeveBand!), pointAtFraction(sleeveHem, 0, front.transforms.sleeve!)),
    dist(pointAtFraction(bandTop, 1, front.transforms.sleeveBand!), pointAtFraction(sleeveHem, 1, front.transforms.sleeve!)),
  );
  const backBandError = Math.max(
    dist(pointAtFraction(bandTop, 0, back.transforms.sleeveBand!), pointAtFraction(sleeveHem, 0, back.transforms.sleeve!)),
    dist(pointAtFraction(bandTop, 1, back.transforms.sleeveBand!), pointAtFraction(sleeveHem, 1, back.transforms.sleeve!)),
  );
  const stitch = block.stitches.find((entry) => entry.label === "Woven sleeve-cap ease")!;
  records.push({ caseId: testCase.caseId, options: testCase.options, revision,
    directlyEncoded: { stitchA: stitch.a.edges, stitchB: stitch.b.edges, declaredEaseCm: stitch.ease,
      capLeftCm: edgeLength(allCapLeft), capRightCm: edgeLength(capRight), capTotalCm: capLength,
      frontArmholeCm: frontLength, yokeArmholeCm: yokeLength, backArmholeCm: backLength,
      bodyTotalCm: bodyLength, generatedEaseCm: capLength - bodyLength },
    approvedMapping: { sleeveInstances: mappedSleeve.viewPairReflection?.quantity,
      sleeveBandInstances: mappedBand.viewPairReflection?.quantity,
      backYokeRoleTreatment: map.faces.find((face) => face.kind === "BACK_FLAT")!.roles.find((role) => role.roleId === "yoke")!.treatment,
      bodyToCapSplitFraction: stationFraction, stationEdge: (mappedFrontRun.to as { edgeId?: string }).edgeId,
      stationEdgeFraction: (mappedFrontRun.to as { fraction?: number }).fraction,
      bodyYokeBackBoundaryFraction: yokeJoinFraction },
    layerOrder: { backYokeSeamGeometryLayer: yokeSeamPrimitive?.layer ?? null,
      backYokeSeamEdgeIsRepresented: !!yokeSeamPrimitive,
      backRoleOrder: map.faces.find((face) => face.kind === "BACK_FLAT")!.roles.map((role) => role.roleId) },
    assembled: { frontResidualCm: front.issues.find((issue) => issue.sourceId === "stitch:Woven sleeve-cap ease" && issue.code === "STITCH_ENDPOINT_RESIDUAL")?.message,
      backResidualOrConflict: back.issues.filter((issue) => issue.sourceId === "stitch:Woven sleeve-cap ease"),
      frontUnderarmEndpointGapCm: frontUnderarm, frontShoulderEndpointGapCm: frontShoulder,
      backYokeShoulderEndpointGapCm: backShoulder, backUnderarmEndpointGapCm: backUnderarm,
      sleeveCapAtYokeBackPieceBoundaryGapToYokeCm: sleeveToYokeBoundaryGap,
      sleeveCapAtYokeBackPieceBoundaryGapToBackCm: sleeveToBackBoundaryGap,
      bodyYokeBackSeamEndpointAgreementCm: dist(yokeBackSeamPoint, backYokeSeamPoint),
      frontBandEndpointErrorCm: frontBandError, backBandEndpointErrorCm: backBandError,
      frontSleeveTransform: front.transforms.sleeve, backSleeveTransform: back.transforms.sleeve,
      frontBandTransform: front.transforms.sleeveBand, backBandTransform: back.transforms.sleeveBand },
  });

  if (selected.has(testCase.caseId)) {
    for (const [faceName, assembly, bodyEdges, capEdges, labels] of [
      ["front", front, [["front", "armhole", frontArmhole]], [["sleeve", "capLeft", allCapLeft]],
        [["sleeve", "capLeft", "start", "front", "armhole", "end", "underarm"], ["sleeve", "capLeft", "end", "front", "armhole", "start", "shoulder / cap crown"]]],
      ["back", back, [["yoke", "armholeUpper", yokeArmhole], ["back", "armholeLower", backArmhole]],
        [["sleeve", "capRight", capRight]],
        [["sleeve", "capRight", "start", "yoke", "armholeUpper", "start", "yoke shoulder / cap crown"], ["sleeve", "capRight", "end", "back", "armholeLower", "end", "underarm"]]],
    ] as const) {
      const roleTransforms = assembly.transforms;
      const chosen = capEdges[0]!;
      const body = bodyEdges as unknown as [string, string, Edge][];
      const endpoints: { x: number; y: number; text: string }[] = [];
      const gaps: { a: { x: number; y: number }; b: { x: number; y: number }; text: string; mid: { x: number; y: number } }[] = [];
      const paths = [...body.map(([role, edgeId, edge]) => ({ role, edgeId, edge, placement: roleTransforms[role]! })),
        { role: "sleeve", edgeId: chosen[1], edge: chosen[2], placement: roleTransforms.sleeve! }];
      const pathFor = (edge: Edge) => edge.kind === "line"
        ? `M ${edge.start.x} ${edge.start.y} L ${edge.end.x} ${edge.end.y}`
        : `M ${edge.curve.start.x} ${edge.curve.start.y} C ${edge.curve.control1.x} ${edge.curve.control1.y} ${edge.curve.control2.x} ${edge.curve.control2.y} ${edge.curve.end.x} ${edge.curve.end.y}`;
      const matrixFor = (t: typeof paths[number]["placement"]) => {
        const radians = t.rotationDegrees * Math.PI / 180; const sign = t.mirrorX ? -1 : 1;
        return `matrix(${Math.cos(radians) * sign} ${Math.sin(radians) * sign} ${-Math.sin(radians)} ${Math.cos(radians)} ${t.offset.x} ${t.offset.y})`;
      };
      const drawn = paths.map(({ role, edge, placement }) => {
        const color = role === "sleeve" ? "#c2410c" : role === "yoke" ? "#2563eb" : "#1d4ed8";
        return `<path d="${pathFor(edge)}" transform="${matrixFor(placement)}" fill="none" stroke="${color}" stroke-width=".13"/>`;
      }).join("");
      for (const [ra, ea, aend, rb, eb, bend, label] of labels as unknown as [string,string,"start"|"end",string,string,"start"|"end",string][]) {
        const role = ra === "sleeve" ? "sleeve" : ra;
        const edge = block.roles[role]!.edges.find((item) => item.name === ea)!;
        const q = aend === "start" ? edgeStart(edge) : edgeEnd(edge);
        const pa = transform(q, roleTransforms[role]!);
        const targetRole = rb;
        const targetEdge = block.roles[targetRole]!.edges.find((item) => item.name === eb)!;
        const targetPoint = bend === "start" ? edgeStart(targetEdge) : edgeEnd(targetEdge);
        const pb = transform(targetPoint, roleTransforms[targetRole]!);
        endpoints.push({ ...pa, text: label }); endpoints.push({ ...pb, text: `${label} counterpart` });
        const gapCm = dist(pa, pb);
        gaps.push({ a: pa, b: pb, text: `${gapCm.toFixed(3)} cm — ${label}`, mid: { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 } });
      }
      if (faceName === "back") {
        const capAtYokeBackBoundary = transform(pointOnInterface([allCapLeft, capRight], yokeJoinFraction), roleTransforms.sleeve!);
        const yokeSeam = transform(edgeEnd(yokeArmhole), roleTransforms.yoke!);
        const backSeam = transform(edgeStart(backArmhole), roleTransforms.back!);
        const gapCm = dist(capAtYokeBackBoundary, yokeSeam);
        endpoints.push({ ...capAtYokeBackBoundary, text: "mapped sleeve station at yoke/back seam" });
        endpoints.push({ ...yokeSeam, text: "body yoke/back seam" });
        gaps.push({ a: capAtYokeBackBoundary, b: yokeSeam,
          text: `${gapCm.toFixed(3)} cm — transferred yoke/back station`,
          mid: { x: (capAtYokeBackBoundary.x + yokeSeam.x) / 2, y: (capAtYokeBackBoundary.y + yokeSeam.y) / 2 } });
        const bodySeamGap = dist(yokeSeam, backSeam);
        if (bodySeamGap > 1e-8) gaps.push({ a: yokeSeam, b: backSeam,
          text: `${bodySeamGap.toFixed(3)} cm — body yoke/back join`,
          mid: { x: (yokeSeam.x + backSeam.x) / 2, y: (yokeSeam.y + backSeam.y) / 2 } });
      }
      const bpoints = paths.flatMap(({ edge, placement }) => [transform(edgeStart(edge), placement), transform(edgeEnd(edge), placement)]);
      const margin = 10; const minX = Math.min(...bpoints.map((p) => p.x)) - margin; const maxX = Math.max(...bpoints.map((p) => p.x)) + margin;
      const minY = Math.min(...bpoints.map((p) => p.y)) - margin; const maxY = Math.max(...bpoints.map((p) => p.y)) + margin;
      const circles = endpoints.map((point, i) => `<circle cx="${point.x}" cy="${point.y}" r=".18" fill="${i%2?"#2563eb":"#c2410c"}"/>`).join("");
      const gapMarkup = gaps.map((gap) => `<line x1="${gap.a.x}" y1="${gap.a.y}" x2="${gap.b.x}" y2="${gap.b.y}" class="gap"/><text x="${gap.mid.x+1}" y="${gap.mid.y-.7}">${gap.text}</text>`).join("");
      const title = `${testCase.caseId} — ${faceName.toUpperCase()} sleeve-cap join — authored edges after current rigid placement`;
      const headerY = minY - 4;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="${minX-3} ${headerY-1} ${maxX-minX+6} ${maxY-headerY+4}"><style>text{font:.65px sans-serif;fill:#111827}.title{font:1px sans-serif;font-weight:bold}.gap{stroke:#dc2626;stroke-width:.1;stroke-dasharray:.35 .2}</style><rect x="${minX-3}" y="${headerY-1}" width="${maxX-minX+6}" height="${maxY-headerY+4}" fill="white"/><text class="title" x="${minX-1}" y="${headerY}">${title}</text><text x="${minX-1}" y="${headerY+1.2}">Blue = body armhole source · orange = sleeve-cap source · red dash = transformed endpoint offset (not cut geometry)</text>${drawn}${gapMarkup}${circles}</svg>`;
      const base = `woven-shirt-${testCase.caseId.endsWith("default") ? "default" : "yokeDepth-max"}-${faceName}`;
      await writeFile(resolve(folder, `${base}.svg`), svg); svgFiles.push(`${base}.svg`);
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
        await page.setContent(svg, { waitUntil: "load" });
        await page.screenshot({ path: resolve(folder, `${base}.png`) });
      } finally { await browser.close(); }
    }
  }
}

const summary = { generatedAt: new Date().toISOString(), method: "Current WOVEN_SHIRT source options plus current S343 projection and rigid assembly functions; diagnostic source-edge overlays do not change pattern geometry or release production faces.",
  configurations: records.length, faceRequests: production.faceRequests, productionBrowserErrors: production.browserErrors.length, records, visualOverlays: svgFiles };
await writeFile(resolve(folder, "matrix.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ configurations: summary.configurations, visualOverlays: svgFiles, output: folder }, null, 2));
