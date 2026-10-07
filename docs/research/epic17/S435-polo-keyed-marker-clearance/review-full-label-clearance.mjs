import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const folder = new URL("../S434-polo-j-fg-keyed-display/", import.meta.url);
const fixture = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8"));
const production = JSON.parse(await readFile(new URL("../S434-polo-j-fg-keyed-display/S434-production-render-matrix.json", import.meta.url), "utf8"));
assert.equal(production.rows.filter((row) => row.kind === "FRONT_FLAT").length, 17);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
const rows = [];
try {
  for (const option of fixture.cases) {
    const input = await readFile(new URL(`rendered-production/${option.caseId}-front_flat.svg`, folder), "utf8");
    const output = await page.evaluate(async (svg) => {
      document.body.innerHTML = svg; document.body.style.cssText = "margin:0;padding:0;background:white";
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const root = document.querySelector("svg");
      const box = (node) => { const rect = node.getBBox(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; };
      const intersects = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.002
        && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.002;
      const sourceLabels = [...root.querySelectorAll("text[data-label-for]")].map((node) => ({
        id: node.getAttribute("data-label-for"), sourceId: node.getAttribute("data-source-id"), text: node.textContent, box: box(node) }));
      const markerGlyphs = [...root.querySelectorAll("g[data-pom-key]")].map((group) => ({
        key: group.getAttribute("data-pom-key"), sourceIds: (group.getAttribute("data-source-id") ?? "").split("|"),
        targets: (group.getAttribute("data-callout-targets") ?? group.getAttribute("data-callout-target") ?? "").split("|"),
        sourceEntities: (group.getAttribute("data-callout-source-entities") ?? group.getAttribute("data-callout-source-entity") ?? "").split("|"),
        box: box(group.querySelector("text")) }));
      const schedule = [...root.querySelectorAll("text[data-schedule-for]")].map((node) => ({
        id: node.getAttribute("data-schedule-for"), key: node.getAttribute("data-pom-key"),
        sourceId: node.getAttribute("data-source-id"), target: node.getAttribute("data-callout-target"),
        sourceEntityId: node.getAttribute("data-callout-source-entity"), text: node.textContent, box: box(node) }));
      const pairs = (items, type) => items.flatMap((left, index) => items.slice(index + 1).flatMap((right) =>
        intersects(left.box, right.box) ? [{ type, left: { id: left.id ?? left.key, text: left.text },
          right: { id: right.id ?? right.key, text: right.text } }] : []));
      const markerSourceLabels = markerGlyphs.flatMap((marker) => sourceLabels.filter((label) => intersects(marker.box, label.box))
        .map((label) => ({ key: marker.key, sourceIds: marker.sourceIds, labelId: label.id, labelSourceId: label.sourceId, label: label.text })));
      const markerScheduleOverlaps = markerGlyphs.flatMap((marker) => schedule.filter((row) => intersects(marker.box, row.box))
        .map((row) => ({ key: marker.key, sourceIds: marker.sourceIds, scheduleId: row.id, schedule: row.text })));
      const scheduleSourceLabels = schedule.flatMap((row) => sourceLabels.filter((label) => intersects(row.box, label.box))
        .map((label) => ({ scheduleId: row.id, labelId: label.id })));
      return { revisionId: root.getAttribute("data-revision-id"), sourceLabels, markerGlyphs, schedule,
        sourceLabelPairs: pairs(sourceLabels, "source-label"), markerSourceLabels,
        markerGlyphPairs: pairs(markerGlyphs.map(({ key, box }) => ({ key, box })), "marker-glyph"),
        schedulePairs: pairs(schedule, "schedule"), markerScheduleOverlaps, scheduleSourceLabels };
    }, input);
    assert.equal(output.revisionId, `live-draft:polo:S434:${option.caseId}`);
    assert.equal(output.schedule.length, 13, `${option.caseId}: complete S434 keyed schedule`);
    const expected = production.rows.find((row) => row.caseId === option.caseId && row.kind === "FRONT_FLAT");
    assert.ok(expected);
    assert.deepEqual(output.schedule.map(({ sourceId, target, sourceEntityId, text }) => ({ sourceId, target, sourceEntityId, text })),
      expected.keyed.map((row) => ({ sourceId: row.sourceId, target: row.target, sourceEntityId: row.sourceEntityId, text: `${row.key}  ${row.text}` })));
    const overlaps = [...output.sourceLabelPairs, ...output.markerGlyphPairs, ...output.schedulePairs,
      ...output.markerSourceLabels, ...output.markerScheduleOverlaps, ...output.scheduleSourceLabels];
    const selectedCrops = ["polo-default", "polo-standFrontRise-min", "polo-standFrontRise-max"].includes(option.caseId);
    if (selectedCrops) {
      await page.locator("svg").screenshot({ path: new URL(`S435-${option.caseId}-full.png`, new URL("./rendered/", import.meta.url)).pathname.replace(/^\//u, ""), fullPage: true });
    }
    rows.push({ caseId: option.caseId, options: option.options, revisionId: output.revisionId,
      sourceLabelCount: output.sourceLabels.length, keyGlyphCount: output.markerGlyphs.length, scheduleRows: output.schedule.length,
      collisionCount: overlaps.length, collisions: overlaps, markerGlyphs: output.markerGlyphs, schedule: output.schedule,
      ...(selectedCrops ? { screenshot: `rendered/S435-${option.caseId}-full.png` } : {}) });
  }
} finally { await browser.close(); }
assert.deepEqual(browserErrors, []);
const allCollisions = rows.flatMap((row) => row.collisions.map((collision) => ({ caseId: row.caseId, ...collision })));
const matrix = { basis: "Corrected S426 full-label audit applied directly to actual S434 production SVGs; no geometry reconstruction. Positive rectangle overlap threshold >0.002 cm.",
  options: rows.length, facesStillHeld: 34, browserErrors, totalSourceLabels: rows.reduce((sum, row) => sum + row.sourceLabelCount, 0),
  totalKeyGlyphs: rows.reduce((sum, row) => sum + row.keyGlyphCount, 0), scheduleRowsPerFront: [...new Set(rows.map((row) => row.scheduleRows))],
  collisionRows: allCollisions.length, collisionTypes: Object.fromEntries([...new Set(allCollisions.map((row) => row.type))]
    .map((type) => [type, allCollisions.filter((row) => row.type === type).length])), collisions: allCollisions, rows };
await writeFile(new URL("S435-full-label-clearance-matrix.json", import.meta.url), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ options: rows.length, facesStillHeld: 34, browserErrors: browserErrors.length,
  totalSourceLabels: matrix.totalSourceLabels, totalKeyGlyphs: matrix.totalKeyGlyphs,
  scheduleRowsPerFront: matrix.scheduleRowsPerFront, collisionRows: matrix.collisionRows, collisionTypes: matrix.collisionTypes }, null, 2));
