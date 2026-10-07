import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const folder = new URL("./", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1400 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
const rows = [];
try {
  for (const option of manifest.cases) {
    const svg = await readFile(new URL(`rendered-production/${option.caseId}-front_flat.svg`, folder), "utf8");
    const row = await page.evaluate(async (markup) => {
      document.body.innerHTML = markup; document.body.style.cssText = "margin:0;padding:0;background:white";
      const root = document.querySelector("svg");
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const sample = (shape) => {
        const stroke = Number.parseFloat(getComputedStyle(shape).strokeWidth) || 0.035; const points = [];
        if (shape instanceof SVGPathElement) {
          const length = shape.getTotalLength(); const steps = Math.max(1, Math.ceil(length / 0.01));
          for (let index = 0; index <= steps; index += 1) points.push(shape.getPointAtLength(length * index / steps));
        } else if (shape instanceof SVGLineElement) {
          const x1 = Number(shape.getAttribute("x1")); const y1 = Number(shape.getAttribute("y1"));
          const x2 = Number(shape.getAttribute("x2")); const y2 = Number(shape.getAttribute("y2"));
          const length = Math.hypot(x2 - x1, y2 - y1); const steps = Math.max(1, Math.ceil(length / 0.01));
          for (let index = 0; index <= steps; index += 1) points.push({ x: x1 + (x2 - x1) * index / steps, y: y1 + (y2 - y1) * index / steps });
        } else if (shape instanceof SVGCircleElement) {
          const cx = Number(shape.getAttribute("cx")); const cy = Number(shape.getAttribute("cy")); const radius = Number(shape.getAttribute("r"));
          const steps = Math.max(48, Math.ceil(2 * Math.PI * radius / 0.01));
          for (let index = 0; index < steps; index += 1) { const angle = 2 * Math.PI * index / steps; points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }); }
        } else if (shape instanceof SVGRectElement) {
          const x = Number(shape.getAttribute("x")); const y = Number(shape.getAttribute("y"));
          const width = Number(shape.getAttribute("width")); const height = Number(shape.getAttribute("height"));
          for (const [x1, y1, x2, y2] of [[x, y, x + width, y], [x + width, y, x + width, y + height], [x + width, y + height, x, y + height], [x, y + height, x, y]]) {
            const length = Math.hypot(x2 - x1, y2 - y1); const steps = Math.max(1, Math.ceil(length / 0.01));
            for (let index = 0; index <= steps; index += 1) points.push({ x: x1 + (x2 - x1) * index / steps, y: y1 + (y2 - y1) * index / steps });
          }
        }
        return { stroke, points };
      };
      const gapToBox = (point, box) => Math.hypot(Math.max(box.x - point.x, 0, point.x - box.x - box.width), Math.max(box.y - point.y, 0, point.y - box.y - box.height));
      const componentPaths = [...root.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')]
        .map((shape) => ({ id: shape.getAttribute("data-entity-id"), ...sample(shape) }));
      const sourceMarks = [...root.querySelectorAll('g[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')]
        .flatMap((group) => [...group.querySelectorAll("path,line,circle,rect")]
          .map((shape) => ({ id: group.getAttribute("data-entity-id"), ...sample(shape) })));
      const markers = [...root.querySelectorAll("g[data-pom-key]")].map((group) => {
        const glyph = group.querySelector("text"); const box = glyph.getBBox();
        const nearest = (shapes) => shapes.map((shape) => ({ id: shape.id,
          clearanceCm: Math.min(...shape.points.map((point) => gapToBox(point, box))) - shape.stroke / 2 }))
          .sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? null;
        return { key: group.getAttribute("data-pom-key"), sourceIds: group.getAttribute("data-source-id")?.split("|") ?? [],
          revisionId: group.getAttribute("data-revision-id"), glyph: { x: box.x, y: box.y, width: box.width, height: box.height },
          nearestComponentPath: nearest(componentPaths), nearestSourceMark: nearest(sourceMarks) };
      });
      const glyphOverlaps = [];
      for (let left = 0; left < markers.length; left += 1) for (let right = left + 1; right < markers.length; right += 1) {
        const a = markers[left].glyph; const b = markers[right].glyph;
        const dx = Math.max(a.x - b.x - b.width, b.x - a.x - a.width, 0);
        const dy = Math.max(a.y - b.y - b.height, b.y - a.y - a.height, 0);
        if (Math.hypot(dx, dy) < 0.02) glyphOverlaps.push({ left: markers[left].key, right: markers[right].key, gapCm: Math.hypot(dx, dy) });
      }
      const schedule = [...root.querySelectorAll("[data-schedule-for]")].map((item) => ({ key: item.getAttribute("data-pom-key"), text: item.textContent }));
      return { revisionId: root.getAttribute("data-revision-id"), markers, glyphOverlaps, schedule };
    }, svg);
    assert.equal(row.revisionId, `live-draft:polo:S434:${option.caseId}`);
    rows.push({ caseId: option.caseId, options: option.options, ...row });
  }
} finally { await browser.close(); }
assert.deepEqual(errors, []);
const failures = rows.flatMap((row) => row.markers.flatMap((marker) => [
  ...(marker.nearestComponentPath?.clearanceCm < 0 ? [{ caseId: row.caseId, key: marker.key, kind: "component-path", ...marker.nearestComponentPath }] : []),
  ...(marker.nearestSourceMark?.clearanceCm < 0 ? [{ caseId: row.caseId, key: marker.key, kind: "source-mark", ...marker.nearestSourceMark }] : []),
  ...row.glyphOverlaps.map((overlap) => ({ caseId: row.caseId, kind: "glyph-overlap", ...overlap })),
]));
const output = { basis: "S434 production SVGs; sampled at 0.01 cm against exact current source paths/marks using the S426 review method",
  options: rows.length, rendererBrowserErrors: errors.length, markerCollisionFindings: failures.length, failures, rows };
await writeFile(new URL("S434-marker-clearance-matrix.json", folder), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ options: rows.length, rendererBrowserErrors: errors.length,
  markerCollisionFindings: failures.length,
  newJFGFindings: failures.filter((failure) => ["J", "FG"].includes(failure.key)).length,
  worstComponentClearance: Math.min(...rows.flatMap((row) => row.markers.map((marker) => marker.nearestComponentPath?.clearanceCm ?? Infinity))),
  worstSourceMarkClearance: Math.min(...rows.flatMap((row) => row.markers.map((marker) => marker.nearestSourceMark?.clearanceCm ?? Infinity))) }, null, 2));
