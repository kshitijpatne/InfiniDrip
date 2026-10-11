import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const folder = new URL("./", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8"));
const radii = [0.25, 0.35, 0.45, 0.55, 0.7, 0.85, 1, 1.2, 1.4];
const directions = Array.from({ length: 16 }, (_, index) => index * Math.PI / 8);
const offsets = radii.flatMap((radius) => directions.map((angle) => ({
  dx: Number((radius * Math.cos(angle)).toFixed(6)), dy: Number((radius * Math.sin(angle)).toFixed(6)), radius,
})));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
const rows = [];
try {
  for (const option of manifest.cases) {
    const svg = await readFile(new URL(`rendered-production/${option.caseId}-front_flat.svg`, folder), "utf8");
    const result = await page.evaluate(({ markup, offsets: candidates }) => {
      document.body.innerHTML = markup; document.body.style.cssText = "margin:0;padding:0";
      const root = document.querySelector("svg");
      const sample = (shape) => {
        const stroke = Number.parseFloat(getComputedStyle(shape).strokeWidth) || 0.035; const points = [];
        if (shape instanceof SVGPathElement) {
          const length = shape.getTotalLength(); const steps = Math.max(1, Math.ceil(length / 0.01));
          for (let i = 0; i <= steps; i += 1) points.push(shape.getPointAtLength(length * i / steps));
        } else if (shape instanceof SVGLineElement) {
          const x1 = Number(shape.getAttribute("x1")); const y1 = Number(shape.getAttribute("y1"));
          const x2 = Number(shape.getAttribute("x2")); const y2 = Number(shape.getAttribute("y2"));
          const length = Math.hypot(x2 - x1, y2 - y1); const steps = Math.max(1, Math.ceil(length / 0.01));
          for (let i = 0; i <= steps; i += 1) points.push({ x: x1 + (x2 - x1) * i / steps, y: y1 + (y2 - y1) * i / steps });
        } else if (shape instanceof SVGCircleElement) {
          const cx = Number(shape.getAttribute("cx")); const cy = Number(shape.getAttribute("cy")); const radius = Number(shape.getAttribute("r"));
          const steps = Math.max(48, Math.ceil(2 * Math.PI * radius / 0.01));
          for (let i = 0; i < steps; i += 1) { const angle = 2 * Math.PI * i / steps; points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }); }
        } else if (shape instanceof SVGRectElement) {
          const x = Number(shape.getAttribute("x")); const y = Number(shape.getAttribute("y"));
          const w = Number(shape.getAttribute("width")); const h = Number(shape.getAttribute("height"));
          for (const [x1, y1, x2, y2] of [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]]) {
            const length = Math.hypot(x2 - x1, y2 - y1); const steps = Math.max(1, Math.ceil(length / 0.01));
            for (let i = 0; i <= steps; i += 1) points.push({ x: x1 + (x2 - x1) * i / steps, y: y1 + (y2 - y1) * i / steps });
          }
        }
        return { id: shape.closest("[data-entity-id]")?.getAttribute("data-entity-id") ?? shape.getAttribute("data-entity-id"),
          stroke, points: points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)) };
      };
      const paths = [...root.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')].map(sample);
      const marks = [...root.querySelectorAll('g[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')]
        .flatMap((group) => [...group.querySelectorAll("path,line,circle,rect")].map(sample));
      const j = root.querySelector('g[data-pom-key="J"] text');
      const sourceRect = j.getBBox();
      const sourceBox = { x: sourceRect.x, y: sourceRect.y, width: sourceRect.width, height: sourceRect.height };
      const others = [...root.querySelectorAll("g[data-pom-key]")].filter((group) => group.getAttribute("data-pom-key") !== "J")
        .map((group) => { const rect = group.querySelector("text").getBBox(); return { key: group.getAttribute("data-pom-key"),
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }; });
      const gapToBox = (point, box) => Math.hypot(Math.max(box.x - point.x, 0, point.x - box.x - box.width), Math.max(box.y - point.y, 0, point.y - box.y - box.height));
      const boxGap = (a, b) => Math.hypot(Math.max(a.x - b.x - b.width, b.x - a.x - a.width, 0), Math.max(a.y - b.y - b.height, b.y - a.y - a.height, 0));
      const clearance = (box, shapes) => shapes.map((shape) => ({ entityId: shape.id,
        clearanceCm: Math.min(...shape.points.map((point) => gapToBox(point, box))) - shape.stroke / 2 }))
        .sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? { entityId: null, clearanceCm: Infinity };
      return candidates.map((offset) => {
        const box = { ...sourceBox, x: sourceBox.x + offset.dx, y: sourceBox.y + offset.dy };
        const component = clearance(box, paths); const mark = clearance(box, marks);
        const other = others.map(({ key, box: otherBox }) => ({ key, clearanceCm: boxGap(box, otherBox) })).sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? { key: null, clearanceCm: Infinity };
        return { ...offset, component, mark, other, minimumClearanceCm: Math.min(component.clearanceCm, mark.clearanceCm, other.clearanceCm) };
      });
    }, { markup: svg, offsets });
    rows.push({ caseId: option.caseId, results: result });
  }
} finally { await browser.close(); }
const common = offsets.map((offset) => {
  const trials = rows.map((row) => row.results.find((trial) => trial.dx === offset.dx && trial.dy === offset.dy));
  return { ...offset, minClearanceCm: Math.min(...trials.map((trial) => trial.minimumClearanceCm)),
    worstCase: rows[trials.findIndex((trial) => trial.minimumClearanceCm === Math.min(...trials.map((candidate) => candidate.minimumClearanceCm)))]?.caseId,
    minimumComponentClearanceCm: Math.min(...trials.map((trial) => trial.component.clearanceCm)),
    minimumSourceMarkClearanceCm: Math.min(...trials.map((trial) => trial.mark.clearanceCm)),
    minimumOtherGlyphClearanceCm: Math.min(...trials.map((trial) => trial.other.clearanceCm)) };
}).sort((a, b) => b.minClearanceCm - a.minClearanceCm);
const matrix = { basis: "Fixed glyph translations only; source J ring/anchor is unchanged. Candidate grid is 16 directions × 9 radii, 0.01 cm path sampling, all 17 production SVGs.",
  options: rows.length, candidates: offsets.length, rendererBrowserErrors: errors, bestCommonOffsets: common.slice(0, 12),
  commonOffsetsWithPositiveClearance: common.filter((candidate) => candidate.minClearanceCm > 0), rows };
await writeFile(new URL("S434-j-glyph-offset-scan.json", folder), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ options: rows.length, candidates: offsets.length, rendererBrowserErrors: errors.length,
  bestCommonOffsets: common.slice(0, 8), positiveCommonOffsets: common.filter((candidate) => candidate.minClearanceCm > 0).length }, null, 2));
