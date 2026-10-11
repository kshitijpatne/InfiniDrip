import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const here = import.meta.dirname;
const baseline = JSON.parse(await readFile(join(here, "..", "S363-woven-pom-leader-readability", "production-replay", "matrix.json"), "utf8"));
const cases = baseline.cases.filter((item) => item.caseId.startsWith("woven-shirt-"));
assert.equal(cases.length, 28);
const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4185/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
await page.goto(baseUrl, { waitUntil: "networkidle" });

const report = await page.evaluate(async (testCases) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import("/src/drafting/recipe.ts"), import("/src/drafting/measurements.ts"),
    import("/src/drafting/options.ts"), import("/src/render/technical-flat-live.ts"),
    import("/src/render/technical-flat-svg.ts"),
  ]);
  const recipe = GARMENTS.find((item) => item.name === "woven-shirt");
  const revisionId = "live-draft:woven-shirt:14:14";
  const measure = createBrowserTechnicalFlatTextMeasurer(document);
  const sourceId = "pom:woven-shirt:finished-placket-width";
  const pomId = "flat:woven-shirt:FRONT_FLAT:callout:finished-placket-width";
  const targetId = "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline";
  const layouts = [
    { id: "two-line", lines: ["Finished placket width:", "3.0 cm (±0.2 cm)"] },
    { id: "three-line", lines: ["Finished placket", "width: 3.0 cm", "(±0.2 cm)"] },
  ];
  const lineAdvance = 0.40, padding = 0.14, priorRejectedLengthCm = 25.66;
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
  const toSegments = (d) => {
    const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
    let i = 0, current = null, start = null; const result = [];
    while (i < tokens.length) {
      const op = tokens[i++];
      if (op === "M") { current = { x: +tokens[i++], y: +tokens[i++] }; start = current; }
      else if (op === "L") { const end = { x: +tokens[i++], y: +tokens[i++] }; result.push([current, end]); current = end; }
      else if (op === "C") {
        const c1 = { x: +tokens[i++], y: +tokens[i++] }, c2 = { x: +tokens[i++], y: +tokens[i++] }, end = { x: +tokens[i++], y: +tokens[i++] };
        let prior = current;
        for (let step = 1; step <= 24; step++) { const t = step / 24, u = 1 - t;
          const p = { x: u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
            y: u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y };
          result.push([prior, p]); prior = p;
        }
        current = end;
      } else if (op === "Z" && current && start) { result.push([current, start]); current = start; }
      else throw new Error(`Unsupported SVG path command ${op}`);
    }
    return result;
  };
  const boxHits = (a, b, box) => {
    const inside = (p) => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
    if (inside(a) || inside(b)) return true;
    const tl = { x: box.minX, y: box.minY }, tr = { x: box.maxX, y: box.minY }, br = { x: box.maxX, y: box.maxY }, bl = { x: box.minX, y: box.maxY };
    return [[tl, tr], [tr, br], [br, bl], [bl, tl]].some(([c, d]) => intersects(a, b, c, d));
  };
  const labelEdge = (anchor, center, box) => {
    const dx = anchor.x - center.x, dy = anchor.y - center.y;
    const scale = Math.min((box.maxX - box.minX) / 2 / Math.max(Math.abs(dx), 1e-8),
      (box.maxY - box.minY) / 2 / Math.max(Math.abs(dy), 1e-8));
    return { x: center.x + dx * scale, y: center.y + dy * scale };
  };
  const routeTypes = (anchor, edge, corridorY) => [
    { kind: "direct", route: [anchor, edge] },
    { kind: "x-first", route: [anchor, { x: edge.x, y: anchor.y }, edge] },
    { kind: "y-first", route: [anchor, { x: anchor.x, y: edge.y }, edge] },
    { kind: "two-bend-y-corridor", route: [anchor, { x: anchor.x, y: corridorY }, { x: edge.x, y: corridorY }, edge] },
  ];
  const rows = [];
  let defaultGeometrySvg = null;
  const candidateGeometrySvgs = {};
  for (const testCase of testCases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "FRONT_FLAT", placements: [], colorHex: "#3669a4", texture: "woven", shine: 24 });
    const pom = live.view?.primitives.find((p) => p.kind === "callout" && p.source.sourceId === sourceId);
    if (!live.view || !pom || pom.id !== pomId || pom.anchor.sourceEntityId !== "pattern:woven-shirt:role:buttonPlacket:edge:top"
      || pom.anchor.primitiveId !== targetId || pom.source.revisionId !== revisionId) throw new Error(`${testCase.caseId}: exact POM identity changed`);
    const otherCallouts = live.view.primitives.filter((p) => p.kind === "callout" && p.id !== pomId);
    const geometryView = { ...live.view, primitives: live.view.primitives.filter((p) => !(p.kind === "callout" && p.id === pomId)) };
    const rendered = renderTechnicalFlatSvg(geometryView, { measureText: measure, colorway: live.colorway });
    if (!rendered.svg || rendered.issues.length) throw new Error(`${testCase.caseId}: geometry output invalid`);
    if (testCase.caseId === "woven-shirt-default") defaultGeometrySvg = rendered.svg;
    candidateGeometrySvgs[testCase.caseId] = rendered.svg;
    const dom = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
    const vb = dom.documentElement.getAttribute("viewBox").split(/\s+/).map(Number);
    const frame = { minX: vb[0], minY: vb[1], maxX: vb[0] + vb[2], maxY: vb[1] + vb[3] };
    const obstacles = [];
    for (const path of dom.querySelectorAll("path[data-entity-id]")) {
      const entityId = path.getAttribute("data-entity-id") ?? "";
      if (path.getAttribute("data-colorway-fill-for") || path.getAttribute("pointer-events") === "none") continue;
      for (const seg of toSegments(path.getAttribute("d") ?? "")) obstacles.push({ seg, entityId,
        isAnchorSegment: entityId === targetId && pointSegment(pom.anchor.point, ...seg) < 1e-6,
        isCollar: /component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u.test(entityId) });
    }
    const otherBoxes = Object.values(rendered.textBounds);
    for (const layout of layouts) {
      const metrics = layout.lines.map((line) => measure(line, 0.32, "Arial, sans-serif"));
      const width = Math.max(...metrics.map((m) => m.widthCm));
      const textHeight = metrics[0].ascentCm + metrics.at(-1).descentCm + (layout.lines.length - 1) * lineAdvance;
      const boxAt = (center) => ({ minX: center.x - width / 2 - padding / 2, maxX: center.x + width / 2 + padding / 2,
        minY: center.y - textHeight / 2 - padding / 2, maxY: center.y + textHeight / 2 + padding / 2 });
      const viable = [];
      // 1 cm occupancy scan; this is a feasibility search, not a
      // production placement optimizer. It bounds renderer work across 56 cases.
      for (let yi = Math.ceil((frame.minY + textHeight / 2 + padding) * 2); yi <= Math.floor((frame.maxY - textHeight / 2 - padding) * 2); yi += 2) {
        for (let xi = Math.ceil((frame.minX + width / 2 + padding) * 2); xi <= Math.floor((frame.maxX - width / 2 - padding) * 2); xi += 2) {
          const at = { x: xi / 2, y: yi / 2 }, box = boxAt(at);
          if (otherBoxes.some((other) => !(box.maxX + 0.12 < other.minX || box.minX - 0.12 > other.maxX || box.maxY + 0.12 < other.minY || box.minY - 0.12 > other.maxY))) continue;
          if (obstacles.some(({ seg }) => boxHits(seg[0], seg[1], box))) continue;
          if (otherCallouts.some((c) => boxHits(c.anchor.point, c.labelAt, box))) continue;
          viable.push({ at, box, span: distance(pom.anchor.point, at) });
        }
      }
      viable.sort((a, b) => a.span - b.span);
      const nearest = viable.slice(0, 30);
      const candidates = [];
      const rejections = { collision: 0, collarTracking: 0, length: 0, routeRatio: 0 };
      const corridorYs = [...new Set([-12, -8, -4, 4, 8, 12]
        .map((offset) => Number((pom.anchor.point.y + offset).toFixed(3))))]
        .filter((y) => y >= frame.minY && y <= frame.maxY);
      for (const candidate of nearest) for (const corridorY of corridorYs) for (const routeType of routeTypes(pom.anchor.point, labelEdge(pom.anchor.point, candidate.at, candidate.box), corridorY)) {
        if (routeType.kind !== "two-bend-y-corridor" && corridorY !== corridorYs[0]) continue;
        const route = routeType.route;
        let length = 0, minClearance = Infinity, collarClearance = Infinity, collision = false, tracksCollar = false;
        for (let i = 1; i < route.length; i++) {
          const a = route[i - 1], b = route[i]; length += distance(a, b);
          const start = i === 1 ? { x: a.x + (b.x - a.x) * Math.min(0.2 / Math.max(distance(a, b), 1e-8), 0.5),
            y: a.y + (b.y - a.y) * Math.min(0.2 / Math.max(distance(a, b), 1e-8), 0.5) } : a;
          for (const obstacle of obstacles) {
            if (obstacle.isAnchorSegment && i === 1) continue;
            const clearance = segmentDistance(start, b, ...obstacle.seg) - 0.035;
            minClearance = Math.min(minClearance, clearance);
            if (obstacle.isCollar) {
              collarClearance = Math.min(collarClearance, clearance);
              if (clearance < 0.75 && distance(start, b) > 1 && distance(...obstacle.seg) > 1) tracksCollar = true;
            }
            if (clearance < 0.25) collision = true;
          }
          for (const c of otherCallouts) if (segmentDistance(start, b, c.anchor.point, c.labelAt) < 0.25) collision = true;
        }
        if (collision) { rejections.collision += 1; continue; }
        if (tracksCollar) { rejections.collarTracking += 1; continue; }
        if (length >= priorRejectedLengthCm) { rejections.length += 1; continue; }
        if (length / Math.max(candidate.span, 0.01) > 1.75) { rejections.routeRatio += 1; continue; }
        candidates.push({ labelAt: candidate.at, box: candidate.box, routeKind: routeType.kind, route,
          lengthCm: length, directSpanCm: candidate.span, minClearanceCm: minClearance, collarClearanceCm: collarClearance });
      }
      candidates.sort((a, b) => a.lengthCm - b.lengthCm);
      rows.push({ caseId: testCase.caseId, options: testCase.options, layoutId: layout.id, lines: layout.lines,
        revisionId, sourceId, sourceEntityId: pom.anchor.sourceEntityId, targetId, anchor: pom.anchor.point,
        lineMetrics: metrics, labelBox: { widthCm: width, heightCm: textHeight + padding }, viableLabelBoxes: viable.length,
        nearestLabelBoxesSearched: nearest.length, candidateCount: candidates.length, bestCandidates: candidates.slice(0, 5),
        rejections });
    }
  }
  return { source: "Chromium measurement and geometry compiled from Vite-served current technical-flat modules",
    revisionId: "live-draft:woven-shirt:14:14", configurations: testCases.length, layouts: layouts.map((x) => x.id),
    lineAdvanceCm: lineAdvance, minClearanceCm: 0.25, priorRejectedRouteLengthCm: priorRejectedLengthCm,
    defaultGeometrySvg, candidateGeometrySvgs, rows };
}, cases);
await browser.close();
await mkdir(join(here, "annotated"), { recursive: true });
const summary = { revisionId: report.revisionId, configurations: report.configurations, layouts: report.layouts,
  rows: report.rows.length, withCandidate: report.rows.filter((row) => row.candidateCount > 0).length,
  withoutCandidate: report.rows.filter((row) => row.candidateCount === 0).map((row) => `${row.caseId}:${row.layoutId}`),
  topCandidates: report.rows.filter((row) => row.candidateCount).map((row) => ({ caseId: row.caseId, layoutId: row.layoutId,
    count: row.candidateCount, best: row.bestCandidates[0] })) };
assert.equal(report.configurations, 28);
assert.equal(report.rows.length, 56);
assert.ok(report.defaultGeometrySvg);
await writeFile(join(here, "default-geometry.svg"), report.defaultGeometrySvg);
for (const row of report.rows.filter((candidate) => candidate.candidateCount > 0)) {
  const layoutId = row.layoutId;
  const candidate = row.bestCandidates[0];
  const routeData = candidate.route.map((p, index) => `${index ? "L" : "M"}${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(" ");
  const lineItems = row.lines.map((line, index) => `<tspan x="${candidate.labelAt.x.toFixed(4)}" dy="${index === 0 ? "0" : "0.4"}">${line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</tspan>`).join("");
  const annotation = `<g data-s374-candidate="${layoutId}"><path d="${routeData}" fill="none" stroke="#be123c" stroke-width="0.08" stroke-dasharray="0.22 0.12"/><circle cx="${candidate.route[0].x}" cy="${candidate.route[0].y}" r="0.17" fill="#fff" stroke="#be123c" stroke-width="0.08"/><text x="${candidate.labelAt.x.toFixed(4)}" y="${(candidate.labelAt.y - (row.lines.length - 1) * 0.2).toFixed(4)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="0.32" fill="#9f1239">${lineItems}</text></g>`;
  const baseSvg = report.candidateGeometrySvgs[row.caseId];
  const overlay = baseSvg.replace("</svg>", `${annotation}</svg>`);
  const fileStem = `${row.caseId}-${layoutId}-candidate`;
  await writeFile(join(here, "annotated", `${fileStem}.svg`), overlay);
  const preview = await chromium.launch({ headless: true });
  try {
    const previewPage = await preview.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
    await previewPage.setContent(overlay, { waitUntil: "load" });
    await previewPage.screenshot({ path: join(here, "annotated", `${fileStem}-whole.png`), fullPage: true });
    const close = overlay.replace(/viewBox="([^"]+)"/u, `viewBox="${(candidate.labelAt.x - 9).toFixed(3)} ${(candidate.labelAt.y - 7).toFixed(3)} 18 14"`);
    await previewPage.setContent(close, { waitUntil: "load" });
    await previewPage.screenshot({ path: join(here, "annotated", `${fileStem}-detail.png`), fullPage: true });
    await previewPage.close();
  } finally { await preview.close(); }
}
delete report.defaultGeometrySvg;
delete report.candidateGeometrySvgs;
await writeFile(join(here, "wrapped-pom-feasibility.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(here, "search-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join("; ")}`);
