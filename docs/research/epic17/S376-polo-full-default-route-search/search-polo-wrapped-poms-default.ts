import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { edgeEnd, edgeStart } from "../../../../src/drafting/piece";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { compileTechnicalFlatSourceGeometry } from "../../../../src/render/technical-flat-geometry";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "../../../../src/render/technical-flat-mapping";
import { compileTechnicalFlatPomCallouts } from "../../../../src/render/technical-flat-poms";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { appendApprovedViewPairReflection, appendOppositeSideReflection, appendPhysicalPairReflection,
  mapPoloDimensionCallouts, placeTechnicalFlatPrimitive, projectPoloSleeveFillClosures,
  reflectFoldPrimitive, reflectPrimitiveAcrossLine, technicalFlatPrimitiveRole } from "../../../../src/render/technical-flat-live";
import { transformFlatPoint, transformFlatPrimitive } from "../../../../src/render/technical-flat-transform";
import { compileTechnicalFlatOverlays } from "../../../../src/render/technical-flat-overlays";
import { TECHNICAL_FLAT_SCHEMA_VERSION, type TechnicalFlatPrimitive, type TechnicalFlatView,
  type TechnicalFlatViewKind } from "../../../../src/render/technical-flat";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";

type Pt = { x: number; y: number };
type Segment = [Pt, Pt];
type Box = { minX: number; minY: number; maxX: number; maxY: number };
type Layout = { id: string; lines: string[] };
type Route = { kind: string; route: Pt[]; lengthCm: number; directSpanCm: number; minClearanceCm: number; collarClearanceCm: number };
type Candidate = { labelAt: Pt; box: Box; route: Route };

const outputDir = fileURLToPath(new URL("./", import.meta.url));
const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4187/";
const baseline = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8"));
const cases = baseline.cases.filter((item) => item.caseId === "polo-default");
assert.equal(cases.length, 1);
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const sourceMapping = G04_TECHNICAL_FLAT_MAPPINGS.polo!;
const targetLabels = ["Finished collar stand height", "Stand front rise"] as const;
const toleranceSuffix = "(±0.2 cm)";
const browser = await chromium.launch({ headless: true });
const measurePage = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
const renderPage = await browser.newPage({ viewport: { width: 1500, height: 1300 }, deviceScaleFactor: 1 });
const browserErrors: string[] = [];
measurePage.on("pageerror", (error) => browserErrors.push(error.message));
measurePage.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
await measurePage.goto(baseUrl, { waitUntil: "networkidle" });

function layoutVariants(text: string, label: string): Layout[] {
  const value = text.slice(label.length).replace(/^:\s*/u, "").trim();
  const exact = `${label}: ${value}`;
  assert.equal(exact, text, `${label}: do not change source POM text`);
  const variants = label === "Finished collar stand height"
    ? [
      ["Finished collar stand", `height: ${value}`],
      ["Finished collar", `stand height: ${value}`],
      ["Finished collar", "stand height:", value],
    ]
    : [
      ["Stand front", `rise: ${value}`],
      ["Stand", `front rise: ${value}`],
      ["Stand", "front rise:", value],
    ];
  for (const lines of variants) assert.equal(lines.join(" "), exact, `${label}: a wrap must preserve every source word`);
  assert.ok(value.endsWith(toleranceSuffix));
  return variants.map((lines, index) => ({ id: `${label === targetLabels[0] ? "collar-height" : "front-rise"}-${index + 2}-line-${index + 1}`, lines }));
}

function distance(a: Pt, b: Pt): number { return Math.hypot(a.x - b.x, a.y - b.y); }
function orientation(a: Pt, b: Pt, c: Pt): number { return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); }
function intersects(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o1 = orientation(a, b, c), o2 = orientation(a, b, d), o3 = orientation(c, d, a), o4 = orientation(c, d, b);
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
  const on = (p: Pt, q: Pt, r: Pt) => Math.abs(orientation(p, q, r)) < 1e-8
    && r.x >= Math.min(p.x, q.x) - 1e-8 && r.x <= Math.max(p.x, q.x) + 1e-8
    && r.y >= Math.min(p.y, q.y) - 1e-8 && r.y <= Math.max(p.y, q.y) + 1e-8;
  return on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
}
function pointSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den)) : 0;
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}
function segmentDistance(a: Pt, b: Pt, c: Pt, d: Pt): number {
  return intersects(a, b, c, d) ? 0 : Math.min(pointSegment(a, c, d), pointSegment(b, c, d), pointSegment(c, a, b), pointSegment(d, a, b));
}
function boxHits(a: Pt, b: Pt, box: Box): boolean {
  const inside = (p: Pt) => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
  if (inside(a) || inside(b)) return true;
  const corners = [{ x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY },
    { x: box.maxX, y: box.maxY }, { x: box.minX, y: box.maxY }];
  return corners.some((corner, index) => intersects(a, b, corner, corners[(index + 1) % 4]!));
}
function routeLength(points: Pt[]): number { return points.slice(1).reduce((sum, point, index) => sum + distance(points[index]!, point), 0); }
function labelEdge(anchor: Pt, center: Pt, box: Box): Pt {
  const dx = anchor.x - center.x, dy = anchor.y - center.y;
  const scale = Math.min((box.maxX - box.minX) / 2 / Math.max(Math.abs(dx), 1e-8),
    (box.maxY - box.minY) / 2 / Math.max(Math.abs(dy), 1e-8));
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}
function routeOptions(anchor: Pt, edge: Pt): { kind: string; route: Pt[] }[] {
  return [
    { kind: "direct", route: [anchor, edge] },
    { kind: "x-first", route: [anchor, { x: edge.x, y: anchor.y }, edge] },
    { kind: "y-first", route: [anchor, { x: anchor.x, y: edge.y }, edge] },
    ...[-6, -3, 3, 6].map((offset) => {
      const y = anchor.y + offset;
      return { kind: `y-corridor-${offset}`, route: [anchor, { x: anchor.x, y }, { x: edge.x, y }, edge] };
    }),
  ];
}

function resolveAnchor(block: typeof cases[number] extends never ? never : any, kind: TechnicalFlatViewKind,
  assembly: ReturnType<typeof assembleTechnicalFlatRoles>, pom: (typeof recipe.poms)[number], point: Pt) {
  const mark = kind === "FRONT_FLAT" ? pom.frontMarkAnchor
    : pom.backMarkAnchor ? { ...pom.backMarkAnchor, point: "at" as const } : undefined;
  const roleId = mark?.roleId ?? (kind === "FRONT_FLAT"
    ? pom.anchorRoleId ?? sourceMapping.pomAnchorRole
    : pom.backAnchorRoleId ?? sourceMapping.backPomAnchorRole);
  const placement = roleId ? assembly.transforms[roleId] : undefined;
  if (!roleId || !placement) return undefined;
  if (mark) return { targetGeometryId: `flat:polo:${kind}:mark:${mark.roleId}:${mark.markName}`,
    point: transformFlatPoint(point, { offset: placement.offset, rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false }),
    sourcePoint: point, sourceEntityId: `pattern:polo:mark:${mark.roleId}:${mark.markName}` };
  const edgeId = kind === "FRONT_FLAT" ? pom.anchorEdgeId : pom.backAnchorEdgeId;
  return { targetGeometryId: `flat:polo:${kind}:component:${roleId}:outline`,
    point: transformFlatPoint(point, { offset: placement.offset, rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false }),
    sourcePoint: point, ...(edgeId ? { sourceEntityId: `pattern:polo:role:${roleId}:edge:${edgeId}` } : {}) };
}

function buildDiagnosticView(block: any, revisionId: string, kind: TechnicalFlatViewKind, measureText: (text: string, size: number, font?: string) => any) {
  const projection = createG04TechnicalFlatProjectionMap("polo", block, revisionId);
  const geometry = compileTechnicalFlatSourceGeometry("polo", block, revisionId, kind, projection);
  const assembly = assembleTechnicalFlatRoles("polo", block, kind, projection);
  const anchorResolver = (pom: (typeof recipe.poms)[number], point: Pt) => resolveAnchor(block, kind, assembly, pom, point);
  const allPoms = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind, recipe.poms, geometry.primitives, anchorResolver);
  const blockedIds = new Set(allPoms.issues.filter((issue) => issue.code === "LABEL_COLLISION").map((issue) => issue.sourceId));
  let remainingPoms = recipe.poms.filter((pom) => !blockedIds.has(`pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`));
  let diagnosticPoms = allPoms;
  for (let attempt = 0; attempt <= recipe.poms.length; attempt++) {
    diagnosticPoms = compileTechnicalFlatPomCallouts("polo", block, revisionId, kind, remainingPoms, geometry.primitives, anchorResolver);
    const newlyBlocked = diagnosticPoms.issues.filter((issue) => issue.code === "LABEL_COLLISION").map((issue) => issue.sourceId);
    if (newlyBlocked.length === 0) break;
    for (const id of newlyBlocked) blockedIds.add(id);
    remainingPoms = remainingPoms.filter((pom) => !newlyBlocked.includes(`pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`));
  }
  const faceRoleIds = sourceMapping.faces.find((face) => face.kind === kind)!.roles.map((role) => role.roleId);
  const transformed: TechnicalFlatPrimitive[] = [];
  for (const primitive of geometry.primitives) {
    const roleId = technicalFlatPrimitiveRole(primitive, geometry.primitives, faceRoleIds);
    const placement = assembly.transforms[roleId];
    const placed = placeTechnicalFlatPrimitive(primitive, roleId, placement, []).map((item) => item.placed);
    for (const placedPrimitive of placed) {
      const faceRole = projection.faces.find((face) => face.kind === kind)?.roles.find((role) => role.roleId === roleId);
      if (appendOppositeSideReflection(transformed, placedPrimitive, faceRole?.oppositeSideReflection, block, assembly.transforms, [])) continue;
      transformed.push(placedPrimitive);
      const fold = faceRole?.foldAxisReflection;
      if (fold) {
        if (fold.axisRoleId) {
          const axisPlacement = assembly.transforms[fold.axisRoleId], axisEdge = block.roles[fold.axisRoleId]?.edges.find((edge: any) => edge.name === fold.edgeId);
          if (axisPlacement && axisEdge) {
            const start = transformFlatPoint(edgeStart(axisEdge), { offset: axisPlacement.offset, rotationDegrees: axisPlacement.rotationDegrees, mirrorX: axisPlacement.mirrorX ?? false });
            const end = transformFlatPoint(edgeEnd(axisEdge), { offset: axisPlacement.offset, rotationDegrees: axisPlacement.rotationDegrees, mirrorX: axisPlacement.mirrorX ?? false });
            const mirrored = reflectPrimitiveAcrossLine(placedPrimitive, start, end);
            if (mirrored) transformed.push(mirrored);
          }
        } else if (placement) {
          const mirrored = reflectFoldPrimitive(primitive, fold.edgeId);
          if (mirrored) transformed.push(transformFlatPrimitive(mirrored, { offset: placement.offset, rotationDegrees: placement.rotationDegrees, mirrorX: true }));
        }
      } else {
        const viewPair = faceRole?.viewPairReflection;
        appendApprovedViewPairReflection(transformed, placedPrimitive, viewPair, block, assembly.transforms, []);
        if (!viewPair) appendPhysicalPairReflection(transformed, primitive, faceRole?.physicalPairReflection, placement);
      }
    }
  }
  const closureIssues = projectPoloSleeveFillClosures(transformed, revisionId);
  const dimensions = mapPoloDimensionCallouts(block, kind, recipe.poms, diagnosticPoms.callouts ?? [], assembly.transforms);
  const overlay = compileTechnicalFlatOverlays(recipe, block, revisionId, [], "#3669a4", "woven", 24);
  const view: TechnicalFlatView = { schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION,
    viewId: `polo:${kind.toLowerCase()}:${revisionId}`, revisionId, recipeId: "polo", kind, units: "cm",
    primitives: [...transformed, ...(dimensions.callouts ?? [])], notices: diagnosticPoms.notices };
  return { view, allPoms, diagnosticPoms, dimensions, assembly, closureIssues,
    overlay: overlay.faces?.find((face) => face.kind === kind)?.colorway, overlayIssues: overlay.issues };
}

async function measureInChromium(texts: string[], sizes: number[]) {
  return measurePage.evaluate(async ({ texts, sizes }) => {
    const { createBrowserTechnicalFlatTextMeasurer } = await import("/src/render/technical-flat-svg.ts");
    const measure = createBrowserTechnicalFlatTextMeasurer(document);
    return Object.fromEntries(texts.flatMap((text) => sizes.map((size) => [`${size}|${text}`, measure(text, size, "Arial, sans-serif")])));
  }, { texts, sizes });
}

async function parseSvg(svg: string) {
  return measurePage.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "image/svg+xml");
    const viewBox = (document.documentElement.getAttribute("viewBox") ?? "0 0 0 0").split(/\s+/u).map(Number);
    const paths = [...document.querySelectorAll("path[data-entity-id]")].filter((path) =>
      !path.hasAttribute("data-colorway-fill-for") && path.getAttribute("pointer-events") !== "none").map((path) => {
      const data = path.getAttribute("d") ?? "";
      const tokens = data.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
      let i = 0, current: { x: number; y: number } | undefined, start: { x: number; y: number } | undefined;
      const segments: [{ x: number; y: number }, { x: number; y: number }][] = [];
      while (i < tokens.length) {
        const op = tokens[i++]!;
        if (op === "M") { current = { x: +tokens[i++]!, y: +tokens[i++]! }; start = current; }
        else if (op === "L") { const end = { x: +tokens[i++]!, y: +tokens[i++]! }; if (current) segments.push([current, end]); current = end; }
        else if (op === "C") { const c1 = { x: +tokens[i++]!, y: +tokens[i++]! }, c2 = { x: +tokens[i++]!, y: +tokens[i++]! }, end = { x: +tokens[i++]!, y: +tokens[i++]! };
          if (current) { let prior = current; for (let step = 1; step <= 20; step++) { const t = step / 20, u = 1 - t;
            const point = { x: u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
              y: u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y };
            segments.push([prior, point]); prior = point; } } current = end;
        } else if (op === "Z" && current && start) { segments.push([current, start]); current = start; }
        else throw new Error(`Unsupported SVG path command ${op}`);
      }
      return { entityId: path.getAttribute("data-entity-id") ?? "", sourceId: path.getAttribute("data-source-id") ?? "",
        isCollar: /component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u.test(path.getAttribute("data-entity-id") ?? ""), segments };
    });
    return { viewBox, paths };
  }, svg);
}

const rows: any[] = [];
const browserErrorOffset = browserErrors.length;
try {
  for (const testCase of cases) {
    const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options });
    const revisionId = `live-draft:polo:S375:${testCase.caseId}`;
    const initial = buildDiagnosticView(block, revisionId, "FRONT_FLAT", () => ({ widthCm: 1, ascentCm: 0.25, descentCm: 0.07 }));
    const blocked = initial.allPoms.issues.filter((issue) => issue.code === "LABEL_COLLISION" && targetLabels.some((label) => issue.message.includes(label) || issue.sourceId.endsWith(label.toLowerCase().replace(/[^a-z0-9]+/g, "-"))));
    const targetCallouts = targetLabels.map((label) => {
      const pom = recipe.poms.find((item) => item.label === label)!;
      const isolated = compileTechnicalFlatPomCallouts("polo", block, revisionId, "FRONT_FLAT", [pom],
        compileTechnicalFlatSourceGeometry("polo", block, revisionId, "FRONT_FLAT", createG04TechnicalFlatProjectionMap("polo", block, revisionId)).primitives,
        (candidate, point) => resolveAnchor(block, "FRONT_FLAT", initial.assembly, candidate, point));
      const callout = isolated.callouts?.[0];
      if (!callout) throw new Error(`${testCase.caseId}: isolated ${label} callout did not resolve: ${JSON.stringify(isolated.issues)}`);
      return { label, pom, callout };
    });
    const optionsForLabel = targetCallouts.map(({ label, callout }) => layoutVariants(callout.text, label));
    const allLineText = optionsForLabel.flatMap((variants) => variants.flatMap((variant) => variant.lines));
    const otherText = initial.view.primitives.flatMap((primitive) => primitive.kind === "text" ? [primitive.text]
      : primitive.kind === "callout" ? [primitive.text] : []);
    const metrics = await measureInChromium([...new Set([...allLineText, ...otherText])], [0.32]);
    const measure = (text: string, size = 0.32) => (metrics as any)[`${size}|${text}`]
      ?? { widthCm: text.length * size * 0.35, ascentCm: size * 0.7, descentCm: size * 0.2 };
    const rendered = renderTechnicalFlatSvg(initial.view, { measureText: measure,
      title: `Polo S375 wrapped callout candidate base — ${testCase.caseId}` });
    if (!rendered.svg || rendered.issues.length) {
      rows.push({ caseId: testCase.caseId, options: testCase.options, revisionId, outputFace: "FRONT_FLAT",
        sourceCallouts: targetCallouts.map(({ label, callout }) => ({ label, sourceId: callout.source.sourceId,
          text: callout.text, targetId: callout.anchor.primitiveId, sourceEntityId: callout.anchor.sourceEntityId,
          anchor: callout.anchor.point, individuallyResolvable: true })),
        originalIssueCounts: Object.fromEntries(targetLabels.map((label) => [label,
          initial.allPoms.issues.filter((issue) => issue.sourceId === `pom:polo:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`).length])),
        baseRenderIssues: rendered.issues, layoutVariants: optionsForLabel.map((variants) => variants.map((variant) => ({ id: variant.id, lines: variant.lines }))),
        candidateRouteCounts: [], bestPair: null, candidateRejectedBeforeSearch: true,
        residualIssues: initial.assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL").map((issue) => issue.message) });
      continue;
    }
    const parsed = await parseSvg(rendered.svg);
    const [vx, vy, vw, vh] = parsed.viewBox;
    const frame = { minX: vx!, minY: vy!, maxX: vx! + vw!, maxY: vy! + vh! };
    const obstacles = parsed.paths.flatMap((path) => path.segments.map((segment: Segment) => ({ segment,
      bounds: { minX: Math.min(segment[0].x, segment[1].x), maxX: Math.max(segment[0].x, segment[1].x),
        minY: Math.min(segment[0].y, segment[1].y), maxY: Math.max(segment[0].y, segment[1].y) },
      entityId: path.entityId, sourceId: path.sourceId, isCollar: path.isCollar,
      isAnchorSegment: path.entityId === targetCallouts[0]!.callout.anchor.primitiveId
        && pointSegment(targetCallouts[0]!.callout.anchor.point, ...segment) < 1e-6 }))) as { segment: Segment;
          bounds: { minX: number; maxX: number; minY: number; maxY: number }; entityId: string; sourceId: string;
          isCollar: boolean; isAnchorSegment: boolean }[];
    const otherCallouts = initial.view.primitives.filter((primitive) => primitive.kind === "callout");
    const existingBoxes = Object.values(rendered.textBounds) as Box[];
    const candidateSets: Candidate[][][] = [];
    const viablePositionCounts: number[][] = [];
    const routeDispositionCounts: Record<string, number>[][] = [];
    for (let targetIndex = 0; targetIndex < targetCallouts.length; targetIndex++) {
      const { callout } = targetCallouts[targetIndex]!;
      const variants = optionsForLabel[targetIndex]!;
      candidateSets[targetIndex] = variants.map((layout) => {
        const lineMetrics = layout.lines.map((line) => measure(line));
        const textWidth = Math.max(...lineMetrics.map((metric: any) => metric.widthCm));
        const textHeight = lineMetrics[0].ascentCm + lineMetrics.at(-1).descentCm + (layout.lines.length - 1) * 0.4;
        const padding = 0.14;
        const width = textWidth + padding, height = textHeight + padding;
        const boxAt = (labelAt: Pt): Box => ({ minX: labelAt.x - width / 2, maxX: labelAt.x + width / 2,
          minY: labelAt.y - height / 2, maxY: labelAt.y + height / 2 });
        const positions: Pt[] = [];
        for (let y = Math.ceil(callout.anchor.point.y - 18); y <= callout.anchor.point.y + 18; y += 1) {
          for (let x = Math.ceil(callout.anchor.point.x - 18); x <= callout.anchor.point.x + 18; x += 1) positions.push({ x, y });
        }
        const legalPositions = positions.flatMap((labelAt) => {
          const box = boxAt(labelAt);
          if (box.minX < frame.minX || box.maxX > frame.maxX || box.minY < frame.minY || box.maxY > frame.maxY) return [];
          if (existingBoxes.some((other) => !(box.maxX + 0.12 < other.minX || box.minX - 0.12 > other.maxX
            || box.maxY + 0.12 < other.minY || box.minY - 0.12 > other.maxY))) return [];
          if (obstacles.some(({ segment }) => boxHits(segment[0], segment[1], box))) return [];
          if (otherCallouts.some((candidate: any) => boxHits(candidate.anchor.point, candidate.labelAt, box))) return [];
          return [{ labelAt, box, distanceCm: distance(callout.anchor.point, labelAt) }];
        }).sort((a, b) => a.distanceCm - b.distanceCm);
        viablePositionCounts[targetIndex] ??= [];
        viablePositionCounts[targetIndex]!.push(legalPositions.length);
        const viable = legalPositions;
        const disposition = { attempted: 0, geometryClearance: 0, collarTracking: 0,
          maxLeaderLength: 0, detourRatio: 0, accepted: 0 };
        const routes: Candidate[] = [];
        for (const candidate of viable) {
          const edge = labelEdge(callout.anchor.point, candidate.labelAt, candidate.box);
          for (const routeOption of routeOptions(callout.anchor.point, edge)) {
            disposition.attempted++;
            let length = 0, minClearance = Infinity, collarClearance = Infinity, collision = false, tracksCollar = false;
            for (let index = 1; index < routeOption.route.length; index++) {
              const a = routeOption.route[index - 1]!, b = routeOption.route[index]!;
              length += distance(a, b);
              const start = index === 1 ? { x: a.x + (b.x - a.x) * Math.min(0.18 / Math.max(distance(a, b), 1e-8), 0.5),
                y: a.y + (b.y - a.y) * Math.min(0.18 / Math.max(distance(a, b), 1e-8), 0.5) } : a;
              const routeBounds = { minX: Math.min(start.x, b.x) - 0.285, maxX: Math.max(start.x, b.x) + 0.285,
                minY: Math.min(start.y, b.y) - 0.285, maxY: Math.max(start.y, b.y) + 0.285 };
              for (const obstacle of obstacles) {
                if (obstacle.isAnchorSegment && index === 1) continue;
                if (obstacle.bounds.maxX < routeBounds.minX || obstacle.bounds.minX > routeBounds.maxX
                  || obstacle.bounds.maxY < routeBounds.minY || obstacle.bounds.minY > routeBounds.maxY) continue;
                const clearance = segmentDistance(start, b, ...obstacle.segment) - 0.035;
                minClearance = Math.min(minClearance, clearance);
                if (obstacle.isCollar) {
                  collarClearance = Math.min(collarClearance, clearance);
                  if (clearance < 0.75 && distance(start, b) > 1 && distance(...obstacle.segment) > 1) tracksCollar = true;
                }
                if (clearance < 0.25) collision = true;
              }
              for (const other of otherCallouts as any[]) if (segmentDistance(start, b, other.anchor.point, other.labelAt) < 0.25) collision = true;
            }
            const directSpan = distance(callout.anchor.point, candidate.labelAt);
            const tooLong = length > 24, excessiveDetour = length / Math.max(directSpan, 0.01) > 1.75;
            if (collision) disposition.geometryClearance++;
            if (tracksCollar) disposition.collarTracking++;
            if (tooLong) disposition.maxLeaderLength++;
            if (excessiveDetour) disposition.detourRatio++;
            if (collision || tracksCollar || tooLong || excessiveDetour) continue;
            disposition.accepted++;
            routes.push({ labelAt: candidate.labelAt, box: candidate.box, route: { kind: routeOption.kind,
              route: routeOption.route, lengthCm: length, directSpanCm: directSpan, minClearanceCm: minClearance,
              collarClearanceCm: collarClearance } });
          }
        }
        routeDispositionCounts[targetIndex] ??= [];
        routeDispositionCounts[targetIndex]!.push(disposition);
        return routes.sort((a, b) => a.route.lengthCm - b.route.lengthCm).slice(0, 16);
      });
    }
    let bestPair: any;
    for (let leftVariant = 0; leftVariant < candidateSets[0]!.length; leftVariant++) {
      for (let rightVariant = 0; rightVariant < candidateSets[1]!.length; rightVariant++) {
        const leftLayout = optionsForLabel[0]![leftVariant]!, rightLayout = optionsForLabel[1]![rightVariant]!;
        const leftChoices = candidateSets[0]![leftVariant]!, rightChoices = candidateSets[1]![rightVariant]!;
        for (const left of leftChoices) for (const right of rightChoices) {
          const overlap = !(left.box.maxX + 0.12 < right.box.minX || left.box.minX - 0.12 > right.box.maxX
            || left.box.maxY + 0.12 < right.box.minY || left.box.minY - 0.12 > right.box.maxY);
          if (overlap) continue;
          const leaderConflict = left.route.route.some((a, index) => index > 0 && right.route.route.some((c, otherIndex) =>
            otherIndex > 0 && segmentDistance(a, left.route.route[index - 1]!, c, right.route.route[otherIndex - 1]!) < 0.25));
          const crossesOtherBox = left.route.route.some((point, index) => index > 0 && boxHits(left.route.route[index - 1]!, point, right.box))
            || right.route.route.some((point, index) => index > 0 && boxHits(right.route.route[index - 1]!, point, left.box));
          if (leaderConflict || crossesOtherBox) continue;
          const score = left.route.lengthCm + right.route.lengthCm;
          if (!bestPair || score < bestPair.score) bestPair = { score, left, right, leftLayout, rightLayout };
        }
      }
    }
    const issueCounts = Object.fromEntries(targetLabels.map((label) => [label,
      initial.allPoms.issues.filter((issue) => issue.sourceId === `pom:polo:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`).length]));
    const row = { caseId: testCase.caseId, options: testCase.options, revisionId,
      outputFace: "FRONT_FLAT", sourceCallouts: targetCallouts.map(({ label, callout }) => ({ label,
        sourceId: callout.source.sourceId, text: callout.text, methodId: callout.source.methodId,
        targetId: callout.anchor.primitiveId, sourceEntityId: callout.anchor.sourceEntityId,
        anchor: callout.anchor.point, individuallyResolvable: true })),
      originalIssueCounts: issueCounts, otherCalloutCount: otherCallouts.length, geometryPathCount: parsed.paths.length,
      layouts: optionsForLabel.map((variants) => variants.map((variant) => ({ id: variant.id, lines: variant.lines }))),
      viablePositionCounts,
      routeDispositionCounts,
      candidateRouteCounts: candidateSets.map((variants) => variants.map((variant) => variant.length)),
      bestPair: bestPair ? { score: bestPair.score,
        labels: [bestPair.leftLayout, bestPair.rightLayout].map((layout: Layout, index: number) => ({
          layoutId: layout.id, lines: layout.lines,
          candidate: index === 0 ? bestPair.left : bestPair.right,
        })) } : null,
      assemblyResiduals: initial.assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL")
        .map((issue) => ({ sourceId: issue.sourceId, residualCm: issue.residualCm })),
      dimensionIssues: initial.dimensions.issues, closureIssues: initial.closureIssues,
      colorwayAvailable: !!initial.overlay, colorwayCompileIssues: initial.overlayIssues };
    rows.push(row);
    if (testCase.caseId === "polo-default" || /min|max/u.test(testCase.caseId)) {
      const anchorMarks = targetCallouts.map(({ label, callout }, index) => {
        const point = callout.anchor.point;
        const short = index === 0 ? "A" : "B";
        return `<g data-s375-source-anchor="${short}"><circle cx="${point.x.toFixed(4)}" cy="${point.y.toFixed(4)}" r="0.18" fill="#fff" stroke="#b91c1c" stroke-width="0.08"/><text x="${(point.x + 0.28).toFixed(4)}" y="${(point.y - 0.24).toFixed(4)}" font-family="Arial, sans-serif" font-size="0.34" fill="#991b1b">${short}: ${label}</text></g>`;
      }).join("");
      const annotated = rendered.svg.replace("</svg>", `${anchorMarks}</svg>`);
      await mkdir(join(outputDir, "source-anchor-views"), { recursive: true });
      const base = `${testCase.caseId}-source-anchors`;
      await writeFile(join(outputDir, "source-anchor-views", `${base}.svg`), annotated);
      await renderPage.setContent(annotated, { waitUntil: "load" });
      await renderPage.screenshot({ path: join(outputDir, "source-anchor-views", `${base}-whole.png`), fullPage: true });
      const points = targetCallouts.map(({ callout }) => callout.anchor.point);
      const minX = Math.min(...points.map((point) => point.x)), maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y)), maxY = Math.max(...points.map((point) => point.y));
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const close = annotated.replace(/viewBox="([^"]+)"/u, `viewBox="${(cx - 12).toFixed(3)} ${(cy - 9).toFixed(3)} 24 18"`);
      await renderPage.setContent(close, { waitUntil: "load" });
      await renderPage.screenshot({ path: join(outputDir, "source-anchor-views", `${base}-detail.png`), fullPage: true });
    }
    if (bestPair && (testCase.caseId === "polo-default" || /min|max/u.test(testCase.caseId))) {
      const annotations = [bestPair.left, bestPair.right].map((candidate: Candidate, index: number) => {
        const layout: Layout = index === 0 ? bestPair.leftLayout : bestPair.rightLayout;
        const route = candidate.route.route.map((point, i) => `${i ? "L" : "M"}${point.x.toFixed(4)} ${point.y.toFixed(4)}`).join(" ");
        const lines = layout.lines.map((line, i) => `<tspan x="${candidate.labelAt.x.toFixed(4)}" dy="${i ? "0.4" : "0"}">${line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</tspan>`).join("");
        return `<g data-s375-callout="${index}"><path d="${route}" fill="none" stroke="#be123c" stroke-width="0.08" stroke-dasharray="0.22 0.12"/><circle cx="${candidate.route.route[0]!.x}" cy="${candidate.route.route[0]!.y}" r="0.17" fill="#fff" stroke="#be123c" stroke-width="0.08"/><text x="${candidate.labelAt.x.toFixed(4)}" y="${(candidate.labelAt.y - (layout.lines.length - 1) * 0.2).toFixed(4)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="0.32" fill="#9f1239">${lines}</text></g>`;
      }).join("");
      const annotated = rendered.svg.replace("</svg>", `${annotations}</svg>`);
      await mkdir(join(outputDir, "annotated"), { recursive: true });
      const base = `${testCase.caseId}-joint-wrapped-poms`;
      await writeFile(join(outputDir, "annotated", `${base}.svg`), annotated);
      await renderPage.setContent(annotated, { waitUntil: "load" });
      await renderPage.screenshot({ path: join(outputDir, "annotated", `${base}-whole.png`), fullPage: true });
      const candidate = bestPair.left;
      const close = annotated.replace(/viewBox="([^"]+)"/u,
        `viewBox="${(candidate.labelAt.x - 12).toFixed(3)} ${(candidate.labelAt.y - 9).toFixed(3)} 24 18"`);
      await renderPage.setContent(close, { waitUntil: "load" });
      await renderPage.screenshot({ path: join(outputDir, "annotated", `${base}-detail.png`), fullPage: true });
    }
  }
} finally { await browser.close(); }

assert.equal(rows.length, 1);
assert.equal(browserErrors.length, browserErrorOffset);
assert.ok(rows.every((row) => row.sourceCallouts.length === 2));
await writeFile(join(outputDir, "wrapped-polo-feasibility.json"), `${JSON.stringify({
  source: "Current exact Polo draft, projection/assembly/POM modules, Chromium measured text and same-revision rendered geometry",
  configurations: rows.length, facesInspected: rows.length, layoutsPerCallout: 3, minClearanceCm: 0.25,
  placementGridStepCm: 1, anchorSearchRadiusCm: 18, browserErrors: browserErrors.length, rows,
}, null, 2)}\n`);
const summary = { configurations: rows.length,
  configurationsWithJointCandidate: rows.filter((row) => row.bestPair).length,
  configurationsWithoutJointCandidate: rows.filter((row) => !row.bestPair).map((row) => row.caseId),
  defaultCandidate: rows.find((row) => row.caseId === "polo-default")?.bestPair ?? null,
  defaultJointLayoutPass: rows.every((row) => row.bestPair !== null), browserErrors: browserErrors.length,
  productionFaceHoldsUnchanged: 34 };
await writeFile(join(outputDir, "search-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
