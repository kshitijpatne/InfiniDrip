import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, "..", "S363-woven-pom-leader-readability", "production-replay", "matrix.json");
const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const allConfigs = baseline.cases.filter((item) => item.caseId.startsWith("woven-shirt-"));
if (allConfigs.length !== 28) throw new Error(`Expected 28 Woven cases; got ${allConfigs.length}`);
const configs = process.env.G04_CASES ? allConfigs.filter((item) => process.env.G04_CASES.split(",").includes(item.caseId)) : allConfigs;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
await page.goto("http://127.0.0.1:4184/", { waitUntil: "networkidle" });

const result = await page.evaluate(async (cases) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import("/src/drafting/recipe.ts"), import("/src/drafting/measurements.ts"),
    import("/src/drafting/options.ts"), import("/src/render/technical-flat-live.ts"),
    import("/src/render/technical-flat-svg.ts"),
  ]);
  const recipe = GARMENTS.find((item) => item.name === "woven-shirt");
  const revisionId = "live-draft:woven-shirt:14:14";
  const measure = createBrowserTechnicalFlatTextMeasurer(document);
  const calloutId = "flat:woven-shirt:FRONT_FLAT:callout:finished-placket-width";
  const calloutSource = "pom:woven-shirt:finished-placket-width";
  const targetId = "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline";
  const previousRejectedRouteLengthCm = 25.66;
  const metric = measure("Finished placket width: 3.0 cm (±0.2 cm)", 0.32, "Arial, sans-serif");
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const pointSegment = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
    const t = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den)) : 0;
    return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
  };
  const orient = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const intersects = (a, b, c, d) => {
    const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
    const between = (v, p, q) => v >= Math.min(p, q) - 1e-8 && v <= Math.max(p, q) + 1e-8;
    if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
    return Math.abs(o1) < 1e-8 && between(c.x, a.x, b.x) && between(c.y, a.y, b.y)
      || Math.abs(o2) < 1e-8 && between(d.x, a.x, b.x) && between(d.y, a.y, b.y)
      || Math.abs(o3) < 1e-8 && between(a.x, c.x, d.x) && between(a.y, c.y, d.y)
      || Math.abs(o4) < 1e-8 && between(b.x, c.x, d.x) && between(b.y, c.y, d.y);
  };
  const segmentDistance = (a, b, c, d) => intersects(a, b, c, d) ? 0
    : Math.min(pointSegment(a, c, d), pointSegment(b, c, d), pointSegment(c, a, b), pointSegment(d, a, b));
  const pathSegments = (commands) => {
    const result = []; let current = null, subpath = null;
    for (const command of commands) {
      if (command.op === "move") { current = command.point; subpath = command.point; }
      else if (command.op === "line") { if (current) result.push([current, command.point]); current = command.point; }
      else if (command.op === "cubic") {
        if (current) { let previous = current;
        for (let step = 1; step <= 16; step++) { const t = step / 16, u = 1 - t;
            const p = { x: u ** 3 * current.x + 3 * u ** 2 * t * command.control1.x + 3 * u * t ** 2 * command.control2.x + t ** 3 * command.point.x,
              y: u ** 3 * current.y + 3 * u ** 2 * t * command.control1.y + 3 * u * t ** 2 * command.control2.y + t ** 3 * command.point.y };
            result.push([previous, p]); previous = p; }
        } current = command.point;
      } else if (command.op === "close" && current && subpath) { result.push([current, subpath]); current = subpath; }
    }
    return result;
  };
  const boxOf = (center) => ({ minX: center.x - metric.widthCm / 2 - 0.12,
    maxX: center.x + metric.widthCm / 2 + 0.12,
    minY: center.y - metric.ascentCm - 0.12, maxY: center.y + metric.descentCm + 0.12 });
  const segHitsBox = (a, b, box) => {
    const inside = (p) => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
    if (inside(a) || inside(b)) return true;
    const tl = { x: box.minX, y: box.minY }, tr = { x: box.maxX, y: box.minY };
    const br = { x: box.maxX, y: box.maxY }, bl = { x: box.minX, y: box.maxY };
    return [[tl, tr], [tr, br], [br, bl], [bl, tl]].some(([c, d]) => intersects(a, b, c, d));
  };
  const records = [];
  for (const testCase of cases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "FRONT_FLAT", placements: [],
      colorHex: "#3669a4", texture: "woven", shine: 24 });
    const frontProductionRender = live.view
      ? renderTechnicalFlatSvg(live.view, { measureText: measure, colorway: live.colorway }) : null;
    const pom = live.view?.primitives.find((p) => p.kind === "callout" && p.source.sourceId === calloutSource);
    if (!live.view || !pom || pom.id !== calloutId || pom.anchor.sourceEntityId !== "pattern:woven-shirt:role:buttonPlacket:edge:top"
      || pom.anchor.primitiveId !== targetId || pom.source.revisionId !== revisionId) {
      throw new Error(`${testCase.caseId}: exact callout source/revision/target changed`);
    }
    const otherCallouts = live.view.primitives.filter((p) => p.kind === "callout" && p.id !== calloutId);
    const geometryView = { ...live.view, primitives: live.view.primitives.filter((p) => p.kind !== "callout") };
    const rendered = renderTechnicalFlatSvg(geometryView, { measureText: measure, colorway: live.colorway });
    if (!rendered.svg || rendered.issues.length) throw new Error(`${testCase.caseId}: geometry-only render failed: ${JSON.stringify(rendered.issues)}`);
    const dom = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
    const bbox = dom.documentElement.getAttribute("viewBox").split(/\s+/).map(Number);
    const frame = { minX: bbox[0], minY: bbox[1], maxX: bbox[0] + bbox[2], maxY: bbox[1] + bbox[3] };
    const allSegments = [];
    for (const primitive of geometryView.primitives) if (primitive.kind === "path" && primitive.colorwayBoundaryOnly !== true) {
      for (const segment of pathSegments(primitive.commands)) {
        const isAnchorSegment = primitive.id === targetId && pointSegment(pom.anchor.point, ...segment) < 1e-6;
        allSegments.push({ segment, id: primitive.id, sourceId: primitive.source.sourceId, layer: primitive.layer, isAnchorSegment });
      }
    }
    const otherTextBoxes = Object.values(rendered.textBounds);
    const otherLeaders = otherCallouts.map((p) => ({ a: p.anchor.point, b: p.labelAt, id: p.id }));
    const anchor = pom.anchor.point;
    const directSpan = distance(anchor, pom.labelAt);
    const candidates = [];
    const viableLabelBoxes = [];
    const rejectionCounts = { inFrame: 0, textOverlap: 0, geometryOverlap: 0, otherLeaderOverlap: 0,
      routeTests: 0, routeCollision: 0, collarTracking: 0, accepted: 0 };
    let closestAttempt = null;
    // Search the upper frame and both outside gutters at 0.5 cm resolution, then inspect the best placements.
    for (let yi = -8; yi <= 40; yi++) for (let xi = -40; xi <= 40; xi++) {
      const at = { x: xi * 0.5, y: yi * 0.5 };
      const box = boxOf(at);
      if (box.minX < frame.minX || box.maxX > frame.maxX || box.minY < frame.minY || box.maxY > frame.maxY) continue;
      rejectionCounts.inFrame++;
      if (otherTextBoxes.some((b) => !(box.maxX + 0.12 < b.minX || box.minX - 0.12 > b.maxX || box.maxY + 0.12 < b.minY || box.minY - 0.12 > b.maxY))) { rejectionCounts.textOverlap++; continue; }
      if (allSegments.some(({ segment }) => segHitsBox(segment[0], segment[1], box))) { rejectionCounts.geometryOverlap++; continue; }
      if (otherLeaders.some(({ a, b }) => segHitsBox(a, b, box))) { rejectionCounts.otherLeaderOverlap++; continue; }
      viableLabelBoxes.push({ at, box, directDistance: distance(anchor, at) });
      for (const routeKind of ["direct", "x-first", "y-first"]) {
        rejectionCounts.routeTests++;
        const route = routeKind === "direct" ? [anchor, at]
          : routeKind === "x-first" ? [anchor, { x: at.x, y: anchor.y }, at]
            : [anchor, { x: anchor.x, y: at.y }, at];
        let ok = true, minClearance = Infinity, collarClearance = Infinity, crossings = 0, closestObstacle = null;
        let length = 0;
        for (let ri = 1; ri < route.length; ri++) {
          const a = route[ri - 1], b = route[ri]; length += distance(a, b);
          // Permit only the exact intended source contact at the start; ignore the first 0.2 cm of that edge.
          let testA = a;
          if (ri === 1 && distance(a, anchor) < 1e-6) {
            const d = distance(a, b); if (d > 0) testA = { x: a.x + (b.x - a.x) * Math.min(0.2 / d, 0.5),
              y: a.y + (b.y - a.y) * Math.min(0.2 / d, 0.5) };
          }
          for (const obstacle of allSegments) {
            if (obstacle.isAnchorSegment && ri === 1) continue;
            const gap = segmentDistance(testA, b, ...obstacle.segment) - 0.035;
            if (gap < minClearance) closestObstacle = { entityId: obstacle.id, sourceId: obstacle.sourceId,
              segment: obstacle.segment };
            minClearance = Math.min(minClearance, gap);
            if (/component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u.test(obstacle.id)) collarClearance = Math.min(collarClearance, gap);
            if (gap < 0.25) { crossings++; ok = false; }
          }
          for (const leader of otherLeaders) if (segmentDistance(testA, b, leader.a, leader.b) < 0.25) { crossings++; ok = false; }
        }
        const candidateSpan = distance(anchor, at);
        const attempt = { at, box, routeKind, route, length, directSpan: candidateSpan, minClearance, collarClearance, closestObstacle };
        if (!closestAttempt || minClearance > closestAttempt.minClearance) closestAttempt = attempt;
        if (!ok || length >= previousRejectedRouteLengthCm
          || (routeKind !== "direct" && length / Math.max(candidateSpan, 0.01) > 1.75)) { rejectionCounts.routeCollision++; continue; }
        // No seam-like collar tracking: reject any route segment that runs within 0.75 cm of a collar for >1 cm.
        const tracksCollar = route.slice(1).some((end, i) => {
          const start = route[i];
          return allSegments.some((obstacle) => /component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u.test(obstacle.id)
            && segmentDistance(start, end, ...obstacle.segment) < 0.75
            && Math.min(distance(start, end), distance(...obstacle.segment)) > 1);
        });
        if (tracksCollar) { rejectionCounts.collarTracking++; continue; }
        rejectionCounts.accepted++;
        candidates.push({ at, box, routeKind, route, length, directSpan: candidateSpan,
          ratio: length / Math.max(candidateSpan, 0.01), minClearance, collarClearance,
          optionKey: testCase.caseId });
      }
    }
    // Supplement the two orthogonal one-bend cases with arbitrary one-bend
    // elbows around the anchor. Test the 12 nearest measured clear label boxes
    // against a 1 cm elbow grid inside a bounded 8 cm radius.
    for (const labelBox of viableLabelBoxes.sort((a, b) => a.directDistance - b.directDistance).slice(0, 12)) {
      for (let by = -8; by <= 8; by++) for (let bx = -8; bx <= 8; bx++) {
        const elbow = { x: anchor.x + bx, y: anchor.y + by };
        if (distance(elbow, anchor) < 0.5 || distance(elbow, labelBox.at) < 0.5) continue;
        rejectionCounts.routeTests++;
        const route = [anchor, elbow, labelBox.at];
        let ok = true, minClearance = Infinity, collarClearance = Infinity, length = 0, closestObstacle = null;
        for (let ri = 1; ri < route.length; ri++) {
          const a = route[ri - 1], b = route[ri]; length += distance(a, b);
          let testA = a;
          if (ri === 1) { const d = distance(a, b); if (d > 0) testA = { x: a.x + (b.x - a.x) * Math.min(0.2 / d, 0.5),
            y: a.y + (b.y - a.y) * Math.min(0.2 / d, 0.5) }; }
          for (const obstacle of allSegments) {
            if (obstacle.isAnchorSegment && ri === 1) continue;
            const gap = segmentDistance(testA, b, ...obstacle.segment) - 0.035;
            if (gap < minClearance) closestObstacle = { entityId: obstacle.id, sourceId: obstacle.sourceId, segment: obstacle.segment };
            minClearance = Math.min(minClearance, gap);
            if (/component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u.test(obstacle.id)) collarClearance = Math.min(collarClearance, gap);
            if (gap < 0.25) ok = false;
          }
          for (const leader of otherLeaders) if (segmentDistance(testA, b, leader.a, leader.b) < 0.25) ok = false;
        }
        const candidateSpan = distance(anchor, labelBox.at);
        const attempt = { at: labelBox.at, box: labelBox.box, elbow, routeKind: "arbitrary-one-bend", route, length,
          directSpan: candidateSpan,
          minClearance, collarClearance, closestObstacle };
        if (!closestAttempt || minClearance > closestAttempt.minClearance) closestAttempt = attempt;
        if (!ok || length >= previousRejectedRouteLengthCm || length / Math.max(candidateSpan, 0.01) > 1.75) {
          rejectionCounts.routeCollision++; continue;
        }
        const tracksCollar = route.slice(1).some((end, i) => {
          const start = route[i];
          return allSegments.some((obstacle) => /component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u.test(obstacle.id)
            && segmentDistance(start, end, ...obstacle.segment) < 0.75
            && Math.min(distance(start, end), distance(...obstacle.segment)) > 1);
        });
        if (tracksCollar) { rejectionCounts.collarTracking++; continue; }
        rejectionCounts.accepted++;
        candidates.push({ at: labelBox.at, box: labelBox.box, routeKind: "arbitrary-one-bend", elbow, route, length,
          directSpan: candidateSpan, ratio: length / Math.max(candidateSpan, 0.01), minClearance, collarClearance, optionKey: testCase.caseId });
      }
    }
    candidates.sort((a, b) => a.length - b.length || a.box.minX - b.box.minX || a.at.y - b.at.y);
    const backLive = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "BACK_FLAT", placements: [],
      colorHex: "#3669a4", texture: "woven", shine: 24 });
    const backProductionRender = backLive.view
      ? renderTechnicalFlatSvg(backLive.view, { measureText: measure, colorway: backLive.colorway }) : null;
    records.push({ caseId: testCase.caseId, options: testCase.options, recipeId: live.view.recipeId,
      revisionId: live.view.revisionId, kind: live.view.kind, sourceEntityId: pom.anchor.sourceEntityId,
      targetId: pom.anchor.primitiveId, sourceId: pom.source.sourceId, anchor, originalLabelAt: pom.labelAt,
      seedLabelDistance: directSpan, previousRejectedRouteLengthCm, labelMetric: metric, viewBox: frame, issueCount: live.issues.length,
      geometryOnlyRenderIssues: rendered.issues, candidateCount: candidates.length, candidates: candidates.slice(0, 3),
      closestAttempt, rejectionCounts,
      frontProductionRender: { emitted: Boolean(frontProductionRender?.svg), issueCodes: frontProductionRender?.issues.map((issue) => issue.code) ?? [],
        revisionId: live.view.revisionId },
      backProductionRender: { emitted: Boolean(backProductionRender?.svg), issueCodes: backProductionRender?.issues.map((issue) => issue.code) ?? [],
        revisionId: backLive.view?.revisionId ?? null },
      ...(testCase.caseId === "woven-shirt-default" ? { diagnosticGeometrySvg: rendered.svg } : {}),
      backSourceCanCompile: Boolean(backLive.view) });
  }
  return { generatedAt: new Date().toISOString(), source: "Vite-served current drafting and technical-flat modules in Chromium",
    revisionId: "live-draft:woven-shirt:14:14", configurations: records.length, fontMetrics: metric, cases: records };
}, configs);

await page.close();
await browser.close();
const final = { ...result, browserErrors };
const output = join(here, "relocated-label-feasibility.json");
const defaultCase = final.cases.find((item) => item.caseId === "woven-shirt-default");
if (defaultCase?.diagnosticGeometrySvg && defaultCase.closestAttempt) {
  const attempt = defaultCase.closestAttempt;
  const route = attempt.route.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(" ");
  const label = "Finished placket width: 3.0 cm (±0.2 cm)";
  let svg = defaultCase.diagnosticGeometrySvg.replace("<g data-layer-group=\"TEXT_LABELS\">",
    `<path data-diagnostic-rejected-route=\"true\" d=\"${route}\" fill=\"none\" stroke=\"#c52222\" stroke-width=\"0.08\" stroke-dasharray=\"0.25 0.15\"/><circle cx=\"${attempt.route[0].x}\" cy=\"${attempt.route[0].y}\" r=\"0.18\" fill=\"#c52222\"/><g data-layer-group=\"TEXT_LABELS\">`);
  svg = svg.replace("</g></svg>", `<text data-diagnostic-rejected-label=\"true\" x=\"${attempt.at.x}\" y=\"${attempt.at.y}\" font-family=\"Arial, sans-serif\" font-size=\"0.32\" text-anchor=\"middle\" fill=\"#c52222\">${label}</text><text x=\"-20\" y=\"-12\" font-family=\"Arial, sans-serif\" font-size=\"0.6\" fill=\"#c52222\">Rejected: attempted one-line route crosses front outline</text></g></svg>`);
  await writeFile(join(here, "default-closest-crossing-overlay.svg"), svg);
  const preview = await chromium.launch({ headless: true });
  try {
    const previewPage = await preview.newPage({ viewport: { width: 1600, height: 1200 } });
    await previewPage.setContent(svg, { waitUntil: "load" });
    await previewPage.screenshot({ path: join(here, "default-closest-crossing-overlay.png"), fullPage: true });
  } finally { await preview.close(); }
  delete defaultCase.diagnosticGeometrySvg;
}
await writeFile(output, `${JSON.stringify(final, null, 2)}\n`);
const summary = { output, configurations: final.configurations, withCandidate: final.cases.filter((item) => item.candidateCount).length,
  withoutCandidate: final.cases.filter((item) => !item.candidateCount).map((item) => item.caseId),
  bestByCase: final.cases.map((item) => ({ caseId: item.caseId, count: item.candidateCount,
    best: item.candidates[0] && { at: item.candidates[0].at, routeKind: item.candidates[0].routeKind,
      length: Number(item.candidates[0].length.toFixed(3)), ratio: Number(item.candidates[0].ratio.toFixed(3)),
      clearance: Number(item.candidates[0].minClearance.toFixed(3)), collarClearance: Number(item.candidates[0].collarClearance.toFixed(3)) },
    closestRejected: item.closestAttempt && { at: item.closestAttempt.at, routeKind: item.closestAttempt.routeKind,
      length: Number(item.closestAttempt.length.toFixed(3)), minimumClearance: Number(item.closestAttempt.minClearance.toFixed(3)),
      blocker: item.closestAttempt.closestObstacle?.sourceId } })) };
console.log(JSON.stringify(summary, null, 2));
if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join("; ")}`);
