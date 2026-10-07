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
  mapPoloCollarPointKeyedCallout, mapPoloSourceCenteredKeyedCallouts, mapPoloDimensionCallouts, placeTechnicalFlatPrimitive, projectPoloSleeveFillClosures,
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
const cases = baseline.cases;
assert.equal(cases.length, 17);
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const sourceMapping = G04_TECHNICAL_FLAT_MAPPINGS.polo!;
const targetLabels = ["Collar point extension"] as const;
const toleranceSuffix = "(±0.2 cm)";
const browser = await chromium.launch({ headless: true });
const measurePage = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
const renderPage = await browser.newPage({ viewport: { width: 1500, height: 1300 }, deviceScaleFactor: 1 });
const browserErrors: string[] = [];
measurePage.on("pageerror", (error) => browserErrors.push(error.message));
measurePage.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
renderPage.on("pageerror", (error) => browserErrors.push(error.message));
renderPage.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
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
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100cm"); svg.setAttribute("height", "100cm");
    svg.setAttribute("viewBox", "0 0 100 100");
    Object.assign(svg.style, { position: "absolute", visibility: "hidden", left: "-10000px", top: "-10000px" });
    document.body.append(svg);
    const result: Record<string, { widthCm: number; ascentCm: number; descentCm: number }> = {};
    try {
      for (const text of texts) for (const size of sizes) {
        const node = document.createElementNS(ns, "text");
        node.setAttribute("font-family", "Arial, sans-serif");
        node.setAttribute("font-size", String(size)); node.textContent = text; svg.append(node);
        const box = node.getBBox();
        result[`${size}|${text}`] = { widthCm: node.getComputedTextLength(), ascentCm: Math.max(0, -box.y),
          descentCm: Math.max(0, box.y + box.height) };
        node.remove();
      }
      return result;
    } finally { svg.remove(); }
  }, { texts, sizes });
}

function measuredViewText(primitive: TechnicalFlatPrimitive): string[] {
  if (primitive.kind === "text" || primitive.kind === "callout") return [primitive.text];
  if (primitive.kind === "mark" && primitive.label) return [primitive.label];
  if (primitive.kind === "path" && primitive.patternMark?.label) return [primitive.patternMark.label];
  return [];
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
const targetSourceId = "pom:polo:collar-point-extension";
const targetPom = recipe.poms.find((pom) => pom.label === targetLabels[0])!;
assert.ok(targetPom);
try {
  for (const testCase of cases) {
    const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options });
    const revisionId = `live-draft:polo:S399:${testCase.caseId}`;
    const initial = buildDiagnosticView(block, revisionId, "FRONT_FLAT", () => ({ widthCm: 1, ascentCm: 0.25, descentCm: 0.07 }));
    const backInitial = buildDiagnosticView(block, revisionId, "BACK_FLAT", () => ({ widthCm: 1, ascentCm: 0.25, descentCm: 0.07 }));
    const geometry = compileTechnicalFlatSourceGeometry("polo", block, revisionId, "FRONT_FLAT",
      createG04TechnicalFlatProjectionMap("polo", block, revisionId));
    const isolated = compileTechnicalFlatPomCallouts("polo", block, revisionId, "FRONT_FLAT", [targetPom], geometry.primitives,
      (candidate, point) => resolveAnchor(block, "FRONT_FLAT", initial.assembly, candidate, point));
    let callout = isolated.callouts?.find((item) => item.source.sourceId === targetSourceId);
    if (!callout) throw new Error(`${testCase.caseId}: exact isolated POM did not resolve: ${JSON.stringify(isolated.issues)}`);
    assert.equal(callout.anchor.sourceEntityId, "pattern:polo:role:upperCollar:edge:frontTip");
    assert.equal(callout.anchor.primitiveId, "flat:polo:FRONT_FLAT:component:upperCollar:outline");
    assert.equal(callout.source.revisionId, revisionId);
    const existingTargetCallouts = initial.view.primitives.filter((primitive) => primitive.kind === "callout" && primitive.source.sourceId === targetSourceId);
    assert.ok(existingTargetCallouts.length <= 1);
    const remappedIsolated = mapPoloDimensionCallouts(block, "FRONT_FLAT", recipe.poms, [callout], initial.assembly.transforms);
    assert.deepEqual(remappedIsolated.issues, []);
    callout = existingTargetCallouts[0] as Extract<TechnicalFlatPrimitive, { kind: "callout" }> | undefined
      ?? remappedIsolated.callouts.find((item) => item.source.sourceId === targetSourceId)!;
    const baseView: TechnicalFlatView = { ...initial.view, primitives: [
      ...initial.view.primitives.filter((primitive) => primitive.kind !== "callout" || primitive.source.sourceId !== targetSourceId), callout,
    ] };
    const keyedMapping = mapPoloCollarPointKeyedCallout("FRONT_FLAT", revisionId,
      baseView.primitives.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "callout" }> => primitive.kind === "callout"));
    assert.deepEqual(keyedMapping.issues, []);
    const sourceCentered = mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", revisionId, keyedMapping.callouts,
      recipe.poms.map((pom) => `pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`));
    assert.deepEqual(sourceCentered.issues, [], `${testCase.caseId}: source-centered keys must match current POM identities`);
    const keyedView: TechnicalFlatView = { ...baseView, primitives: [
      ...baseView.primitives.filter((primitive) => primitive.kind !== "callout"), ...sourceCentered.callouts,
    ] };
    const keyedSources = new Set(sourceCentered.callouts.filter((primitive) => primitive.presentation && primitive.presentation.key !== "C")
      .map((primitive) => primitive.source.sourceId));
    const baseOtherCallouts = baseView.primitives.filter((primitive) => primitive.kind === "callout"
      && primitive.source.sourceId !== targetSourceId && !keyedSources.has(primitive.source.sourceId));
    const keyedOtherCallouts = keyedView.primitives.filter((primitive) => primitive.kind === "callout"
      && primitive.source.sourceId !== targetSourceId && !keyedSources.has(primitive.source.sourceId));
    assert.deepEqual(keyedOtherCallouts, baseOtherCallouts, `${testCase.caseId}: other POM callouts must remain unchanged`);
    const baseSourcePaths = baseView.primitives.filter((primitive) => primitive.kind === "path");
    const keyedSourcePaths = keyedView.primitives.filter((primitive) => primitive.kind === "path");
    assert.deepEqual(keyedSourcePaths, baseSourcePaths, `${testCase.caseId}: source path primitives must remain unchanged`);
    const viewTexts = baseView.primitives.flatMap(measuredViewText);
    const backTexts = backInitial.view.primitives.flatMap(measuredViewText);
    const textMetrics = await measureInChromium([...new Set([...viewTexts, ...backTexts,
      ...sourceCentered.callouts.filter((item) => item.presentation).map((item) => `${item.presentation!.key}  ${item.text}`),
      "SOURCE POM"])], [0.32, 0.28]);
    const measure = (text: string, size = 0.32) => (textMetrics as any)[`${size}|${text}`]
      ?? { widthCm: text.length * size * 0.35, ascentCm: size * 0.7, descentCm: size * 0.2 };
    const backCallouts = backInitial.view.primitives.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "callout" }> => primitive.kind === "callout");
    const backMapping = mapPoloCollarPointKeyedCallout("BACK_FLAT", revisionId, backCallouts);
    assert.deepEqual(backMapping.issues, []);
    assert.deepEqual(backMapping.callouts, backCallouts);
    const backCandidate: TechnicalFlatView = { ...backInitial.view, primitives: [
      ...backInitial.view.primitives.filter((primitive) => primitive.kind !== "callout"), ...backMapping.callouts,
    ] };
    const backBefore = renderTechnicalFlatSvg(backInitial.view, { measureText: measure });
    const backAfter = renderTechnicalFlatSvg(backCandidate, { measureText: measure });
    assert.deepEqual(backAfter, backBefore, `${testCase.caseId}: the C presentation must not change its paired back view`);
    assert.ok(!backAfter.svg?.includes("data-pom-key=\"C\""));
    const collarColorway = initial.overlay ? { ...initial.overlay,
      targetRoleIds: initial.overlay.targetRoleIds.filter((roleId: string) => roleId !== "sleeve") } : undefined;
    const originalBase = renderTechnicalFlatSvg(baseView, { measureText: measure, colorway: collarColorway,
      title: `Polo S399 source base — ${testCase.caseId}` });
    const rendered = renderTechnicalFlatSvg(keyedView, { measureText: measure, colorway: collarColorway,
      title: `Polo S399 keyed collar point — ${testCase.caseId}` });
    if (!rendered.svg || rendered.issues.length) {
      rows.push({ caseId: testCase.caseId, options: testCase.options, revisionId, status: "keyed-base-render-failed",
        originalBaseIssues: originalBase.issues, keyedRenderIssues: rendered.issues,
        originalTargetCalloutCount: existingTargetCallouts.length, sourceId: targetSourceId, text: callout.text,
        targetId: callout.anchor.primitiveId, sourceEntityId: callout.anchor.sourceEntityId, anchor: callout.anchor.point,
        colorwayFillRendered: false });
      continue;
    }
    const noColorwayRender = renderTechnicalFlatSvg(keyedView, { measureText: measure,
      title: `Polo S399 keyed collar point without colorway — ${testCase.caseId}` });
    assert.ok(noColorwayRender.svg && noColorwayRender.issues.length === 0,
      `${testCase.caseId}: no-colorway render should preserve the keyed flat`);
    assert.ok(noColorwayRender.svg.includes('data-pom-key="C"'));
    assert.equal((noColorwayRender.svg.match(/data-entity-id="[^"]+:key-marker"/gu) ?? []).length, 8);
    assert.equal((noColorwayRender.svg.match(/data-schedule-for=/gu) ?? []).length, 11);
    assert.equal((noColorwayRender.svg.match(/fill="none" stroke="#991b1b"/gu) ?? []).length, 7);
    assert.ok(noColorwayRender.svg.includes(`C  ${callout.text}`));
    assert.ok(!noColorwayRender.svg.includes("data-colorway-id"));
    for (const item of sourceCentered.callouts.filter((candidate) => candidate.presentation)) {
      assert.ok(noColorwayRender.svg.includes(`${item.presentation!.key}  ${item.text}`),
        `${testCase.caseId}/${item.source.sourceId}: complete source POM row missing`);
      assert.equal(item.source.revisionId, revisionId);
    }
    const [vx, vy, vw, vh] = await measurePage.evaluate((svg) => {
      const d = new DOMParser().parseFromString(svg, "image/svg+xml");
      return (d.documentElement.getAttribute("viewBox") ?? "0 0 0 0").split(/\s+/u).map(Number);
    }, rendered.svg) as number[];
    const scheduleText = `C  ${callout.text}`;
    const rowBounds = rendered.textBounds[`${callout.id}:schedule`];
    assert.ok(rowBounds, `${testCase.caseId}: browser-measured schedule row missing`);
    const markerRadius = 0.22;
    const outputSvg = rendered.svg;
    const markerLabelClearance = await measurePage.evaluate((svg) => {
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");
      const labels = [...document.querySelectorAll("text[data-label-for]")].map((node) => {
        const box = node.getBBox();
        return { id: node.getAttribute("data-label-for"), sourceId: node.getAttribute("data-source-id"),
          revisionId: node.getAttribute("data-revision-id"), text: node.textContent,
          bounds: { minX: box.x, minY: box.y, maxX: box.x + box.width, maxY: box.y + box.height } };
      });
      const markers = [...document.querySelectorAll("g[data-pom-key]")].map((group) => {
        const circle = group.querySelector("circle")!;
        const x = Number(circle.getAttribute("cx")), y = Number(circle.getAttribute("cy"));
        const radius = Number(circle.getAttribute("r")) + 0.0175;
        const rect = { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
        const contacts = labels.filter((label) => label.revisionId === document.documentElement.getAttribute("data-revision-id")
          && label.sourceId?.startsWith("pattern:polo:")
          && label.bounds.minX - 0.08 <= rect.maxX && label.bounds.maxX + 0.08 >= rect.minX
          && label.bounds.minY - 0.08 <= rect.maxY && label.bounds.maxY + 0.08 >= rect.minY);
        return { key: group.getAttribute("data-pom-key"), x, y, radiusCm: Number(circle.getAttribute("r")),
          sourceIds: group.getAttribute("data-source-id"), targetIds: group.getAttribute("data-callout-target"),
          revisionId: group.getAttribute("data-revision-id"), sourceLabelContacts: contacts };
      });
      return { labels: labels.length, sourceLabels: labels.filter((label) => label.sourceId?.startsWith("pattern:polo:")), markers };
    }, outputSvg);
    assert.equal(markerLabelClearance.markers.length, 8, `${testCase.caseId}: expected eight unchanged keyed stations`);
    assert.ok(markerLabelClearance.markers.every((marker) => marker.sourceLabelContacts.length === 0),
      `${testCase.caseId}: a source label remains inside a keyed ring/text clearance`);
    const renderedGeometry = await parseSvg(outputSvg);
    const foldPath = renderedGeometry.paths.find((path) => path.entityId.endsWith(":mark:buttonPlacket:placketFold"));
    assert.ok(foldPath, `${testCase.caseId}: source placket fold path missing from rendered evidence`);
    const buttonFoldContacts = markerLabelClearance.sourceLabels.filter((label) => /:mark:buttonPlacket:button-[1-3]$/u.test(label.id ?? "")
      && foldPath.segments.some(([start, end]) => boxHits(start, end, {
        minX: label.bounds.minX - 0.0975, minY: label.bounds.minY - 0.0975,
        maxX: label.bounds.maxX + 0.0975, maxY: label.bounds.maxY + 0.0975,
      })));
    assert.deepEqual(buttonFoldContacts, [], `${testCase.caseId}: button source labels contact the placket-fold stroke`);
    const buttonFoldPathClearance = { sourcePathId: foldPath.entityId, checkedButtonLabels: 3,
      strokePlusExistingGapCm: 0.0975, contacts: buttonFoldContacts.length };
    for (const marker of markerLabelClearance.markers) {
      const source = sourceCentered.callouts.find((item: any) => item.presentation?.key === marker.key);
      assert.ok(source, `${testCase.caseId}/${marker.key}: source key missing`);
      assert.equal(marker.x, Number(source.anchor.point.x.toFixed(4)), `${testCase.caseId}/${marker.key}: keyed center moved`);
      assert.equal(marker.y, Number(source.anchor.point.y.toFixed(4)), `${testCase.caseId}/${marker.key}: keyed center moved`);
      assert.equal(marker.radiusCm, source.presentation.markerRadiusCm, `${testCase.caseId}/${marker.key}: ring size changed`);
      assert.equal(marker.revisionId, revisionId, `${testCase.caseId}/${marker.key}: stale keyed revision`);
    }
    const hPoms = sourceCentered.callouts.filter((item: any) => item.presentation?.key === "H");
    assert.equal(hPoms.length, 2, `${testCase.caseId}: H must retain both source POMs`);
    assert.equal(new Set(hPoms.map((item: any) => `${item.anchor.point.x},${item.anchor.point.y}`)).size, 1,
      `${testCase.caseId}: H source POMs must remain co-located`);
    const hText = outputSvg.match(/<g\b[^>]*data-pom-key="H"[^>]*>[\s\S]*?<text\b[^>]*\bx="(-?\d+(?:\.\d+)?)" y="(-?\d+(?:\.\d+)?)"/u);
    assert.ok(hText, `${testCase.caseId}: H glyph missing`);
    assert.ok(Math.abs(Number(hText[1]) - (hPoms[0]!.anchor.point.x + 0.45)) < 0.00011,
      `${testCase.caseId}: H glyph x offset`);
    assert.ok(Math.abs(Number(hText[2]) - (hPoms[0]!.anchor.point.y + 0.07 + 0.45)) < 0.00011,
      `${testCase.caseId}: H glyph y offset`);
    const sourcePaths = originalBase.svg ? await measurePage.evaluate((svgs) => svgs.map((svg) => {
      const d = new DOMParser().parseFromString(svg, "image/svg+xml");
      return [...d.querySelectorAll("path[data-entity-id]")].filter((path) => !path.hasAttribute("data-colorway-fill-for")
        && (path.getAttribute("data-source-id") ?? "").startsWith("pattern:polo:"))
        .map((path) => [path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
          path.getAttribute("data-revision-id")]);
    }), [originalBase.svg, outputSvg]) : undefined;
    if (sourcePaths) assert.deepEqual(sourcePaths[1], sourcePaths[0], `${testCase.caseId}: rendered pattern paths must be identical`);
    const panel = await measurePage.evaluate(({ svg, id }) => {
      const d = new DOMParser().parseFromString(svg, "image/svg+xml");
      const rect = d.querySelector("g[data-layer-group='POM_SCHEDULE'] rect");
      const row = d.querySelector(`[data-schedule-for="${id}"]`);
      return { x: Number(rect?.getAttribute("x")), y: Number(rect?.getAttribute("y")),
        width: Number(rect?.getAttribute("width")), height: Number(rect?.getAttribute("height")),
        text: row?.textContent, target: row?.getAttribute("data-callout-target"), revision: row?.getAttribute("data-revision-id") };
    }, { svg: outputSvg, id: callout.id });
    assert.equal(panel.text, scheduleText);
    assert.equal(panel.target, callout.anchor.primitiveId);
    assert.equal(panel.revision, revisionId);
    assert.ok(outputSvg.includes(`data-pom-key="C" data-callout-target="${callout.anchor.primitiveId}"`));
    assert.ok(outputSvg.includes(`data-callout-source-entity="${callout.anchor.sourceEntityId}"`));
    assert.ok(outputSvg.includes(`r="${markerRadius}"`));
    assert.ok(!outputSvg.includes(`data-label-for="${callout.id}"`));
    const colorwayAreaGroups = [...outputSvg.matchAll(/data-colorway-area-group="([^"]+)"/gu)].map((match) => match[1]);
    assert.ok(colorwayAreaGroups.length > 0, `${testCase.caseId}: collar-area colorway fill was not emitted`);
    const panelX = panel.x, panelY = panel.y, panelWidth = panel.width, panelHeight = panel.height;
    await mkdir(join(outputDir, "rendered"), { recursive: true });
    const stem = `${testCase.caseId}-collar-point`;
    await writeFile(join(outputDir, "rendered", `${stem}.svg`), outputSvg);
    await renderPage.setContent(outputSvg, { waitUntil: "load" });
    await renderPage.screenshot({ path: join(outputDir, "rendered", `${stem}-whole.png`), fullPage: true });
    if (["polo-default", "polo-standFrontRise-max", "polo-collarPointExtension-min"].includes(testCase.caseId)) {
      const hMarker = markerLabelClearance.markers.find((marker) => marker.key === "H")!;
      await renderPage.setContent(outputSvg.replace(/viewBox="[^"]+"/u,
        `viewBox="${(hMarker.x - 2.5).toFixed(4)} ${(hMarker.y - 2.5).toFixed(4)} 5 5"`), { waitUntil: "load" });
      await renderPage.screenshot({ path: join(outputDir, "rendered", `${testCase.caseId}-H-S399-detail.png`), fullPage: true });
    }
    const detailViewBox = `${(callout.anchor.point.x - 12).toFixed(4)} ${(callout.anchor.point.y - 10).toFixed(4)} 24 20`;
    await renderPage.setContent(outputSvg.replace(/viewBox="[^"]+"/u, `viewBox="${detailViewBox}"`), { waitUntil: "load" });
    if (testCase.caseId === "polo-default" || testCase.caseId === "polo-standFrontRise-max" || testCase.caseId === "polo-collarPointExtension-min")
      await renderPage.screenshot({ path: join(outputDir, "rendered", `${stem}-detail.png`), fullPage: true });
    const scheduleViewBox = `${(panelX - 0.5).toFixed(4)} ${(panelY - 0.4).toFixed(4)} ${(panelWidth + 1).toFixed(4)} ${(panelHeight + 0.8).toFixed(4)}`;
    await renderPage.setContent(outputSvg.replace(/viewBox="[^"]+"/u, `viewBox="${scheduleViewBox}"`), { waitUntil: "load" });
    if (testCase.caseId === "polo-default" || testCase.caseId === "polo-standFrontRise-max" || testCase.caseId === "polo-collarPointExtension-min")
      await renderPage.screenshot({ path: join(outputDir, "rendered", `${stem}-schedule.png`), fullPage: true });
    const anchorEdge = block.roles.upperCollar.edges.find((edge: any) => edge.name === "frontTip");
    const sourceEnd = edgeEnd(anchorEdge);
    assert.deepEqual(callout.anchor.point, transformFlatPoint(sourceEnd, { offset: initial.assembly.transforms.upperCollar.offset,
      rotationDegrees: initial.assembly.transforms.upperCollar.rotationDegrees, mirrorX: initial.assembly.transforms.upperCollar.mirrorX ?? false }));
    rows.push({ caseId: testCase.caseId, options: testCase.options, revisionId, status: "rendered",
      originalBaseIssues: originalBase.issues, keyedRenderIssues: rendered.issues,
      originalTargetCalloutCount: existingTargetCallouts.length, sourceId: targetSourceId, text: callout.text,
      targetId: callout.anchor.primitiveId, sourceEntityId: callout.anchor.sourceEntityId, anchor: callout.anchor.point,
      targetEdge: "upperCollar.frontTip:end", markerRadiusCm: markerRadius, sourceCenteredMarker: true,
      markerLabelClearance,
      buttonFoldPathClearance,
      sourceCenteredPoms: sourceCentered.callouts.filter((item) => item.presentation && item.presentation.key !== "C")
        .map((item) => ({ sourceId: item.source.sourceId, key: item.presentation?.key, text: item.text,
          targetId: item.anchor.primitiveId, sourceEntityId: item.anchor.sourceEntityId,
          anchor: item.anchor.point, revisionId: item.source.revisionId })),
      hGlyph: { pomSourceIds: hPoms.map((item: any) => item.source.sourceId), anchor: hPoms[0]!.anchor.point,
        textX: Number(hText[1]), textY: Number(hText[2]), approvedOffsetCm: [0.45, 0.45] },
      visibleMarkerKeys: ["A", "B", "C", "D", "E", "FG", "H", "I"], sourceCenteredRingCount: 7, fullScheduleRows: 11,
      scheduleText, schedulePanel: { x: panelX, y: panelY, widthCm: panelWidth, heightCm: panelHeight,
        measuredTextWidthCm: rowBounds.maxX - rowBounds.minX },
      otherSourcePomsPreserved: keyedView.primitives.some((primitive) => primitive.kind === "callout" && primitive.id !== callout.id),
      preservedSourcePathCount: keyedSourcePaths.length,
      renderedPatternPathComparison: sourcePaths !== undefined,
      pairedBackUnchanged: true,
      pairedBackRenderIssueCodes: backAfter.issues.map((issue) => issue.code),
      collarColorwayTargetRoleIds: collarColorway?.targetRoleIds,
      colorwayAreaGroups,
      noColorwayRenderClear: noColorwayRender.issues.length === 0 && !noColorwayRender.svg?.includes("data-colorway-id"),
      colorwayFillRendered: Boolean(initial.overlay) && Boolean(outputSvg.includes("data-colorway-area-group")) });
    console.log(`${testCase.caseId}: rendered 8 keyed stations and 11 full POM rows; original errors ${originalBase.issues.length}`);
  }
} finally { await browser.close(); }
assert.equal(rows.length, 17);
assert.equal(browserErrors.length, browserErrorOffset);
assert.ok(rows.every((row) => row.sourceId === targetSourceId && row.sourceEntityId === "pattern:polo:role:upperCollar:edge:frontTip"));
assert.ok(rows.every((row) => row.pairedBackUnchanged));
assert.ok(rows.every((row) => row.sourceCenteredPoms.length === 10 && row.fullScheduleRows === 11));
const summary = { configurations: rows.length, keyedRendered: rows.filter((row) => row.status === "rendered").length,
  sourceCenteredPomEntries: rows.reduce((total, row) => total + row.sourceCenteredPoms.length, 0),
  visibleStationsPerConfiguration: 8, openSourceCenteredRingsPerConfiguration: 7, fullTextScheduleRowsPerConfiguration: 11,
  originalBaseFailures: rows.filter((row) => row.originalBaseIssues?.length).map((row) => ({ caseId: row.caseId, issues: row.originalBaseIssues })),
  keyedBaseFailures: rows.filter((row) => row.status !== "rendered").map((row) => ({ caseId: row.caseId, issues: row.keyedRenderIssues })),
  sourceEdge: "upperCollar.frontTip:end", exactSourceIdentityCount: rows.filter((row) => row.sourceEntityId === "pattern:polo:role:upperCollar:edge:frontTip").length,
  collisionCountReconciliation: { s378BaseFailures: 2, finalS399BaseFailures: rows.filter((row) => row.originalBaseIssues?.some((issue: any) =>
    issue.code === "TEXT_COLLISION" && issue.entityId === "flat:polo:FRONT_FLAT:callout:collar-point-extension")).length,
  reconciliation: "The same 17 option values and current source revisions use the actual renderer with Chromium-measured text for marks and path labels plus visible path-stroke clearance. Three baseline C text collisions now reproduce (the two established extremes plus collarLeafDepth-max); all keyed outputs have zero renderer errors and source-centered A/B/D/E/FG/H/I remove the inline leaders for all ten approved POMs. The newly exposed base-only C hold is preserved." },
  browserErrors: browserErrors.length, colorwayRows: rows.filter((row) => row.colorwayFillRendered).length,
  pairedBackUnchanged: rows.filter((row) => row.pairedBackUnchanged).length,
  approvedHGlyphOffset: { cm: [0.45, 0.45], exactOptionRows: rows.filter((row) => row.hGlyph?.textX === 7.45
    && row.hGlyph?.textY === 0.52 && row.hGlyph?.anchor.x === 7 && row.hGlyph?.anchor.y === 0).length,
    sourcePomsPerStation: 2, ringCenterCm: [7, 0], ringRadiusCm: 0.22, geometryAndSourceMarksUnchanged: true },
  productionHoldsReleased: 0, independentSleeveResidualCm: 0.68, residualGateCm: 0.25,
  reviewDisposition: "The approved H glyph-only offset is visible and clear in all 17 exact options. Existing E/I and other pattern-specific contacts, C baseline-only text failures, and the 0.68 cm sleeve residual against 0.25 cm remain held; no face acceptance." };
assert.equal(summary.approvedHGlyphOffset.exactOptionRows, 17);
await writeFile(join(outputDir, "polo-keyed-marker-trial-matrix.json"), `${JSON.stringify({ rows, summary }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
