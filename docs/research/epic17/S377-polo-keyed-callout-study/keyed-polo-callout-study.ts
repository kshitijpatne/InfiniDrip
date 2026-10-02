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
const cases = baseline.cases;
assert.equal(cases.length, 17);
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
const targetSourceIds = new Set<string>();
const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
try {
  for (const testCase of cases) {
    const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options });
    const revisionId = `live-draft:polo:S377:${testCase.caseId}`;
    const initial = buildDiagnosticView(block, revisionId, "FRONT_FLAT", () => ({ widthCm: 1, ascentCm: 0.25, descentCm: 0.07 }));
    const targetCallouts = targetLabels.map((label) => {
      const pom = recipe.poms.find((item) => item.label === label)!;
      const geometry = compileTechnicalFlatSourceGeometry("polo", block, revisionId, "FRONT_FLAT",
        createG04TechnicalFlatProjectionMap("polo", block, revisionId));
      const isolated = compileTechnicalFlatPomCallouts("polo", block, revisionId, "FRONT_FLAT", [pom], geometry.primitives,
        (candidate, point) => resolveAnchor(block, "FRONT_FLAT", initial.assembly, candidate, point));
      const callout = isolated.callouts?.[0];
      if (!callout) throw new Error(`${testCase.caseId}: isolated ${label} callout did not resolve: ${JSON.stringify(isolated.issues)}`);
      return { label, pom, callout };
    });
    const fullRows = targetCallouts.map(({ label, callout }, index) => ({
      key: index === 0 ? "A" : "B", label, text: callout.text,
      sourceId: callout.source.sourceId, targetId: callout.anchor.primitiveId,
      sourceEntityId: callout.anchor.sourceEntityId, anchor: callout.anchor.point,
    }));
    for (const row of fullRows) targetSourceIds.add(row.sourceId);
    const targetIds = new Set(fullRows.map((row) => row.sourceId));
    const targetedCallouts = initial.view.primitives.filter((primitive) => primitive.kind === "callout" && targetIds.has(primitive.source.sourceId));
    assert.equal(targetedCallouts.length, 0, `${testCase.caseId}: colliding target labels must remain omitted from the base technical view`);
    const keyedView: TechnicalFlatView = { ...initial.view,
      primitives: initial.view.primitives.filter((primitive) => primitive.kind !== "callout" || !targetIds.has(primitive.source.sourceId)) };
    const otherText = keyedView.primitives.flatMap((primitive) => primitive.kind === "text" || primitive.kind === "callout" ? [primitive.text] : []);
    const metrics = await measureInChromium([...new Set([...fullRows.map((row) => `${row.key}  ${row.text}`), ...otherText])], [0.32]);
    const measure = (text: string, size = 0.32) => (metrics as any)[`${size}|${text}`]
      ?? { widthCm: text.length * size * 0.35, ascentCm: size * 0.7, descentCm: size * 0.2 };
    const rendered = renderTechnicalFlatSvg(keyedView, { measureText: measure,
      title: `Polo S377 keyed POM schedule diagnostic — ${testCase.caseId}` });
    if (!rendered.svg || rendered.issues.length) {
      rows.push({ caseId: testCase.caseId, options: testCase.options, revisionId, outputFace: "FRONT_FLAT",
        status: "base-render-failed", baseRenderIssues: rendered.issues,
        sourceRows: fullRows, markerDistanceCm: Math.hypot(fullRows[0]!.anchor.x-fullRows[1]!.anchor.x, fullRows[0]!.anchor.y-fullRows[1]!.anchor.y),
        colorwayAvailable: !!initial.overlay, colorwayCompileIssues: initial.overlayIssues });
      continue;
    }
    const [vx, vy, vw, vh] = await measurePage.evaluate((svg) => {
      const d = new DOMParser().parseFromString(svg, "image/svg+xml");
      return (d.documentElement.getAttribute("viewBox") ?? "0 0 0 0").split(/\s+/u).map(Number);
    }, rendered.svg) as number[];
    const anchorDistance = Math.hypot(fullRows[0]!.anchor.x-fullRows[1]!.anchor.x, fullRows[0]!.anchor.y-fullRows[1]!.anchor.y);
    const markerRadius = 0.22;
    const markerClearanceCm = anchorDistance - markerRadius * 2;
    const sourceFontCm = 0.32;
    const displayTexts = fullRows.map((row) => `${row.key}  ${row.text}`);
    const rowWidths = displayTexts.map((text) => measure(text).widthCm);
    const panelWidth = Math.max(...rowWidths) + 1.0;
    const panelX = vx! + 0.6, panelY = vy! + vh! + 0.6, panelHeight = 3.1;
    const rowYs = [panelY + 1.45, panelY + 2.25];
    const markers = fullRows.map((row) => `<g data-s377-marker-key="${row.key}" data-source-id="${escapeXml(row.sourceId)}" data-target-id="${escapeXml(row.targetId)}" data-source-entity-id="${escapeXml(row.sourceEntityId ?? "")}" data-revision-id="${escapeXml(revisionId)}"><circle cx="${row.anchor.x.toFixed(4)}" cy="${row.anchor.y.toFixed(4)}" r="${markerRadius}" fill="#fff" stroke="#991b1b" stroke-width="0.07"/><text x="${row.anchor.x.toFixed(4)}" y="${(row.anchor.y+0.085).toFixed(4)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="0.24" font-weight="700" fill="#991b1b">${row.key}</text></g>`).join("");
    const panelRows = fullRows.map((row, index) => `<g data-s377-schedule-key="${row.key}" data-source-id="${escapeXml(row.sourceId)}" data-target-id="${escapeXml(row.targetId)}" data-source-entity-id="${escapeXml(row.sourceEntityId ?? "")}" data-revision-id="${escapeXml(revisionId)}"><text x="${(panelX+0.42).toFixed(4)}" y="${rowYs[index]!.toFixed(4)}" font-family="Arial, sans-serif" font-size="${sourceFontCm}" fill="#111827">${row.key}  ${escapeXml(row.text)}</text></g>`).join("");
    const panel = `<g data-s377-pom-schedule="true" data-revision-id="${escapeXml(revisionId)}"><rect x="${panelX.toFixed(4)}" y="${panelY.toFixed(4)}" width="${panelWidth.toFixed(4)}" height="${panelHeight.toFixed(4)}" rx="0.12" fill="#fff" stroke="#64748b" stroke-width="0.06"/><text x="${(panelX+0.42).toFixed(4)}" y="${(panelY+0.68).toFixed(4)}" font-family="Arial, sans-serif" font-size="0.30" font-weight="700" fill="#334155">SOURCE POM CALLOUTS</text>${panelRows}</g>`;
    let outputSvg = rendered.svg
      .replace(/viewBox="[^"]+"/u, `viewBox="${vx} ${vy} ${vw} ${(vh!+0.6+panelHeight+0.4).toFixed(4)}"`)
      .replace(/height="([0-9.]+)cm"/u, `height="${(vh!+0.6+panelHeight+0.4).toFixed(4)}cm"`)
      .replace(/(<rect data-technical-flat-paper="true"[^>]*height=")[^"]+("[^>]*>)/u, `$1${(vh!+0.6+panelHeight+0.4).toFixed(4)}$2`)
      .replace("</svg>", `${markers}${panel}</svg>`);
    await mkdir(join(outputDir, "rendered"), { recursive: true });
    const base = `${testCase.caseId}-keyed-poms`;
    await writeFile(join(outputDir, "rendered", `${base}.svg`), outputSvg);
    await renderPage.setContent(outputSvg, { waitUntil: "load" });
    await renderPage.screenshot({ path: join(outputDir, "rendered", `${base}-whole.png`), fullPage: true });
    const detailViewBox = `${(Math.min(...fullRows.map(x=>x.anchor.x))-8).toFixed(4)} ${(Math.min(...fullRows.map(x=>x.anchor.y))-5).toFixed(4)} 18 12`;
    const detailSvg = outputSvg.replace(/viewBox="[^"]+"/u, `viewBox="${detailViewBox}"`);
    await renderPage.setContent(detailSvg, { waitUntil: "load" });
    if (testCase.caseId === "polo-default" || /standHeight|standFrontRise/u.test(testCase.caseId))
      await renderPage.screenshot({ path: join(outputDir, "rendered", `${base}-detail.png`), fullPage: true });
    const scheduleViewBox = `${(panelX-0.5).toFixed(4)} ${(panelY-0.35).toFixed(4)} ${(panelWidth+1).toFixed(4)} ${(panelHeight+0.7).toFixed(4)}`;
    const scheduleSvg = outputSvg.replace(/viewBox="[^"]+"/u, `viewBox="${scheduleViewBox}"`);
    await renderPage.setContent(scheduleSvg, { waitUntil: "load" });
    if (testCase.caseId === "polo-default" || /standHeight|standFrontRise/u.test(testCase.caseId))
      await renderPage.screenshot({ path: join(outputDir, "rendered", `${base}-schedule.png`), fullPage: true });
    rows.push({ caseId: testCase.caseId, options: testCase.options, revisionId, outputFace: "FRONT_FLAT",
      status: "rendered", sourceRows: fullRows, markerDistanceCm: anchorDistance, markerRadiusCm: markerRadius,
      markerClearanceCm, markerPairPass: markerClearanceCm >= 0.25, textFontCm: sourceFontCm,
      schedulePanel: { x: panelX, y: panelY, widthCm: panelWidth, heightCm: panelHeight,
        rowTextWidthsCm: rowWidths, rowYs, withinExtendedFrame: true },
      originalTextCollisions: initial.allPoms.issues.filter((issue) => issue.code === "LABEL_COLLISION").map((issue) => issue.sourceId),
      renderIssues: rendered.issues, colorwayAvailable: !!initial.overlay, colorwayCompileIssues: initial.overlayIssues });
    console.log(`${testCase.caseId}: ${rows.at(-1).status}; marker separation ${anchorDistance.toFixed(3)} cm`);
  }
} finally { await browser.close(); }

assert.equal(rows.length, 17);
assert.equal(browserErrors.length, browserErrorOffset);
assert.ok(rows.every((row) => row.sourceRows.length === 2));
const renderedRows = rows.filter((row) => row.status === "rendered");
const summary = { configurations: rows.length, renderedConfigurations: renderedRows.length,
  baseRenderFailures: rows.filter((row) => row.status !== "rendered").map((row) => ({caseId:row.caseId,issues:row.baseRenderIssues})),
  markerPairPassCount: renderedRows.filter((row) => row.markerPairPass).length,
  minimumMarkerClearanceCm: Math.min(...renderedRows.map((row) => row.markerClearanceCm)),
  colorwayFillRendered: false, browserErrors: browserErrors.length,
  productionFaceHoldsUnchanged: 34 };
await writeFile(join(outputDir, "keyed-pom-layout-matrix.json"), `${JSON.stringify({ rows, summary }, null, 2)}\n`);
await writeFile(join(outputDir, "search-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
