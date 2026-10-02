import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dir = fileURLToPath(new URL(".", import.meta.url));
const source = JSON.parse(await readFile(join(dir, "../S351-polo-residual-labels/current-source-matrix.json"), "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const rows = [];
try {
  for (const configuration of source.rows) for (const face of configuration.faces) {
    const svgPath = join(dir, `${configuration.caseId}-${face.kind.toLowerCase()}-s352-source.svg`);
    const svgText = await readFile(svgPath, "utf8");
    await page.setContent(svgText, { waitUntil: "load" });
    const measured = await page.evaluate((targets) => {
      const svg = document.querySelector("svg");
      const paths = [...svg.querySelectorAll("path")];
      const bodyFills = [];
      const bodyPolygons = [];
      for (const role of ["front", "back"]) {
        for (const sourcePath of paths.filter((path) => path.dataset.sourceId === `pattern:polo:role:${role}`
          && path.dataset.feature === "silhouette")) {
          const fill = sourcePath.cloneNode(false);
          fill.setAttribute("d", `${sourcePath.getAttribute("d")} Z`);
          fill.setAttribute("fill", "#111"); fill.setAttribute("stroke", "none"); svg.append(fill);
          bodyFills.push(fill);
          const length = sourcePath.getTotalLength();
          const polygon = [];
          for (let distance = 0; distance <= length; distance += 0.08) {
            const p = sourcePath.getPointAtLength(Math.min(distance, length));
            polygon.push({ x: p.x, y: p.y });
          }
          bodyPolygons.push(polygon);
        }
      }
      const shapePaths = paths.filter((path) => path.dataset.feature !== "pom");
      const geometry = shapePaths.filter((path) => path.dataset.feature !== "annotation")
        .map((path) => path.getBBox()).filter((b) => b.width || b.height);
      const strokeLines = [];
      for (const path of paths) {
        const length = path.getTotalLength?.();
        if (!Number.isFinite(length) || length <= 0) continue;
        const count = Math.max(2, Math.ceil(length / 0.08));
        const points = [];
        for (let i = 0; i <= count; i++) {
          const p = path.getPointAtLength(length * i / count); points.push({ x: p.x, y: p.y });
        }
        const stroke = Number.parseFloat(path.getAttribute("stroke-width") ?? "0.035") / 2 + 0.09;
        for (let i = 1; i < points.length; i++) strokeLines.push({ a: points[i - 1], b: points[i], stroke });
      }
      for (const circle of svg.querySelectorAll("circle")) {
        const cx = Number(circle.getAttribute("cx")), cy = Number(circle.getAttribute("cy"));
        const radius = Number(circle.getAttribute("r")) + 0.09;
        strokeLines.push({ a: { x: cx - radius, y: cy }, b: { x: cx + radius, y: cy }, stroke: 0.13 },
          { a: { x: cx, y: cy - radius }, b: { x: cx, y: cy + radius }, stroke: 0.13 });
      }
      const bounds = geometry.reduce((a, b) => ({ minX: Math.min(a.minX, b.x), minY: Math.min(a.minY, b.y),
        maxX: Math.max(a.maxX, b.x + b.width), maxY: Math.max(a.maxY, b.y + b.height) }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
      const textNodes = [...svg.querySelectorAll("text")];
      const textBoxes = textNodes.map((node) => node.getBBox());
      const textRects = textBoxes.map((box) => ({ minX: box.x - 0.08, maxX: box.x + box.width + 0.08,
        minY: box.y - 0.08, maxY: box.y + box.height + 0.08 }));
      const point = svg.createSVGPoint();
      const pointHits = (x, y) => {
        point.x = x; point.y = y;
        const inBody = bodyPolygons.some((polygon) => {
          let inside = false;
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[i], b = polygon[j];
            if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
          }
          return inside;
        });
        if (inBody || bodyFills.some((path) => path.isPointInFill(point))) return true;
        for (const line of strokeLines) {
          const dx = line.b.x - line.a.x, dy = line.b.y - line.a.y;
          const t = Math.max(0, Math.min(1, ((x - line.a.x) * dx + (y - line.a.y) * dy) / (dx * dx + dy * dy || 1)));
          if (Math.hypot(x - (line.a.x + t * dx), y - (line.a.y + t * dy)) <= line.stroke) return true;
        }
        return false;
      };
      const segmentBlocked = (a, b, allowAnchorEscape = false) => {
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const steps = Math.max(2, Math.ceil(length / 0.08));
        for (let i = allowAnchorEscape ? Math.max(2, Math.floor(1 / length * steps)) : 2; i < steps; i++) {
          const t = i / steps;
          if (pointHits(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return true;
        }
        return false;
      };
      const widthFor = (text) => {
        const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
        node.setAttribute("font-family", "Arial, sans-serif"); node.setAttribute("font-size", "0.32");
        node.textContent = text; svg.append(node); const width = node.getBBox().width; node.remove(); return width;
      };
      const outputs = [];
      for (const target of targets) {
        const w = widthFor(target.text), h = 0.42;
        const occupied = textRects;
        const candidates = [];
        for (const side of ["left", "right", "top", "bottom"]) {
          const labelX = side === "left" ? bounds.minX - w / 2 - 1 : side === "right" ? bounds.maxX + w / 2 + 1
            : target.anchor.x;
          const labelY = side === "top" ? bounds.minY - 1 : side === "bottom" ? bounds.maxY + 1 : target.anchor.y;
          for (const delta of [-4, -2, 0, 2, 4]) {
            const x = side === "left" || side === "right" ? labelX : labelX + delta;
            const y = side === "top" || side === "bottom" ? labelY : labelY + delta;
            const box = { minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2 };
            if (occupied.some((o) => o.minX < box.maxX && box.minX < o.maxX && o.minY < box.maxY && box.minY < o.maxY)) continue;
            const anchor = target.anchor;
            let bends;
            if (side === "left" || side === "right") {
              const railX = side === "left" ? bounds.minX - 0.35 : bounds.maxX + 0.35;
              const labelEdgeX = railX < x ? box.minX : box.maxX;
              bends = [anchor, { x: railX, y: anchor.y }, { x: railX, y }, { x: labelEdgeX, y }];
            } else {
              const railY = side === "top" ? bounds.minY - 0.35 : bounds.maxY + 0.35;
              const labelEdgeY = railY < y ? box.minY : box.maxY;
              bends = [anchor, { x: anchor.x, y: railY }, { x, y: railY }, { x, y: labelEdgeY }];
            }
            const pathHitsGeometry = bends.slice(1).some((end, i) => segmentBlocked(bends[i], end, i === 0));
            const pathHitsText = bends.slice(1).some((end, i) => {
              const start = bends[i], length = Math.hypot(end.x - start.x, end.y - start.y);
              const steps = Math.max(2, Math.ceil(length / 0.08));
              for (let n = i === 0 ? Math.max(2, Math.floor(1 / length * steps)) : 1; n <= steps; n++) {
                const t = n / steps, px = start.x + (end.x - start.x) * t, py = start.y + (end.y - start.y) * t;
                if (occupied.some((o) => px >= o.minX && px <= o.maxX && py >= o.minY && py <= o.maxY)) return true;
              }
              return false;
            });
            const boxHitsGeometry = shapePaths.some((path) => {
              const b = path.getBBox(); return b.x < box.maxX && b.x + b.width > box.minX
                && b.y < box.maxY && b.y + b.height > box.minY;
            });
            candidates.push({ side, bends, box, pathHitsGeometry, pathHitsText, boxHitsGeometry, widthCm: w });
          }
        }
        const pass = candidates.find((c) => !c.pathHitsGeometry && !c.pathHitsText && !c.boxHitsGeometry);
        outputs.push({ sourceId: target.sourceId, text: target.text, anchor: target.anchor,
          visibleGeometryBounds: bounds, candidatesTested: candidates.length,
          route: pass ?? null, failedCandidates: pass ? undefined : candidates,
          failureReasons: pass ? [] : [...new Set(candidates.map((c) => c.pathHitsGeometry ? "leader-crosses-rendered-stroke"
            : c.pathHitsText ? "leader-crosses-existing-label" : "label-box-overlaps-rendered-geometry"))] });
      }
      return outputs;
    }, face.blockedPoms);
    rows.push({ caseId: configuration.caseId, face: face.kind, revisionId: face.revisionId, targets: measured });
  }
} finally { await browser.close(); }
const routes = rows.flatMap((row) => row.targets);
const result = { basis: "S352 bounded external label-rail trial against exact S351 rendered SVGs and exact per-face blocked POM source anchors/text. Chromium 0.08 cm point sampling tests polyline leaders against rendered stroke geometry, and exact browser text boxes test label/geometry overlap. This is a diagnostic candidate only, not a production acceptance gate.", configurations: 17, faces: 34,
  targets: routes.length, routed: routes.filter((r) => r.route).length,
  failed: routes.filter((r) => !r.route).length, rows };
await writeFile(join(dir, "external-rail-route-matrix.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ configurations: result.configurations, faces: result.faces,
  targets: result.targets, routed: result.routed, failed: result.failed,
  failureReasons: routes.filter((r) => !r.route).reduce((a, r) => { for (const reason of r.failureReasons) a[reason] = (a[reason] ?? 0) + 1; return a; }, {}) }, null, 2));
