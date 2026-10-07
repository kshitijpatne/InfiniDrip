import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = fileURLToPath(new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url));
const search = JSON.parse(await readFile(new URL('./h-route-candidate-matrix.json', import.meta.url), 'utf8'));
const s399 = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const svgFiles = await readdir(sourceDir);
const outputDir = join(dir, 'rendered');
await mkdir(outputDir, { recursive: true });
const selected = search.summary.find((entry) => entry.id === 'west-down-0.8');
assert.ok(selected);
assert.equal(selected.optionsWithClearLeader, 0);
assert.equal(selected.optionsWithClearRing, 17);
assert.equal(selected.optionsWithClearGlyph, 17);
const dx = -0.8; const dy = 0.8;
const renderedCases = ['polo-default', 'polo-standFrontRise-max', 'polo-standFrontRise-min'];
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2400, height: 1800 }, deviceScaleFactor: 1 });
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const variantRows = [];
try {
  for (const row of s399.rows) {
    const inputFile = svgFiles.find((name) => name === `${row.caseId}-collar-point.svg`);
    assert.ok(inputFile, `missing current S399 output ${row.caseId}`);
    let svg = await readFile(join(sourceDir, inputFile), 'utf8');
    assert.equal(row.revisionId, `live-draft:polo:S399:${row.caseId}`);
    const markerAt = svg.indexOf('data-entity-id="H:key-marker"');
    assert.notEqual(markerAt, -1);
    const start = svg.lastIndexOf('<g ', markerAt);
    const end = svg.indexOf('</g>', markerAt) + 4;
    const group = svg.slice(start, end);
    const circle = group.match(/<circle\b[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\br="([^"]+)"[^>]*\/>/u);
    const text = group.match(/<text\b([^>]*)\bx="([^"]+)"\s+y="([^"]+)"([^>]*)>([\s\S]*?)<\/text>/u);
    assert.ok(circle && text);
    const movedCircle = circle[0].replace('cx="7" cy="0"', 'cx="6.2" cy="0.8"');
    const movedText = text[0].replace(`x="${text[2]}" y="${text[3]}"`, `x="${(Number(text[2]) + dx).toFixed(4)}" y="${(Number(text[3]) + dy).toFixed(4)}"`);
    let newGroup = group.replace(circle[0], movedCircle).replace(text[0], movedText);
    const leaderEndX = 7 + dx - (dx / Math.hypot(dx, dy)) * 0.24;
    const leaderEndY = dy - (dy / Math.hypot(dx, dy)) * 0.24;
    const leader = `<path data-entity-id="H:key-leader" data-feature="pom" data-source-id="pom:polo:shoulder-seam|pom:polo:neck-width" data-source-class="VIEW_DERIVED" data-revision-id="${row.revisionId}" data-target-anchor="7,0" d="M7 0 L${leaderEndX.toFixed(4)} ${leaderEndY.toFixed(4)}" fill="none" stroke="#19222b" stroke-width="0.035" stroke-linecap="round"/>`;
    const markerStart = svg.lastIndexOf('<g ', markerAt);
    svg = `${svg.slice(0, markerStart)}${leader}${newGroup}${svg.slice(end)}`;
    assert.match(svg, /data-source-id="pom:polo:shoulder-seam\|pom:polo:neck-width"/u);
    assert.match(svg, /data-target-anchor="7,0"/u);
    assert.equal((svg.match(/data-schedule-for="flat:polo:FRONT_FLAT:callout:/gu) ?? []).length, 11);
    await writeFile(join(outputDir, `${row.caseId}-H-route-west-down-0.8.svg`), svg, 'utf8');
    variantRows.push({ caseId: row.caseId, options: row.options, revisionId: row.revisionId, offsetCm: [dx, dy], anchor: [7, 0], leaderEndCm: [Number(leaderEndX.toFixed(4)), Number(leaderEndY.toFixed(4))], sourcePoms: row.sourceCenteredPoms.filter((pom) => pom.key === 'H').map((pom) => ({ sourceId: pom.sourceId, targetId: pom.targetId, sourceEntityId: pom.sourceEntityId, text: pom.text })), scheduleRows: row.fullScheduleRows, originalSchedulePreserved: true });
    if (renderedCases.includes(row.caseId)) {
      await page.setContent(svg, { waitUntil: 'load' });
      const ringBox = await page.locator('g[data-entity-id="H:key-marker"] circle').boundingBox();
      const svgBox = await page.locator('svg').boundingBox();
      assert.ok(ringBox && svgBox, `${row.caseId}: candidate failed to render`);
      const pad = 300;
      const x = Math.max(svgBox.x, ringBox.x - pad);
      const y = Math.max(svgBox.y, ringBox.y - pad);
      const right = Math.min(svgBox.x + svgBox.width, ringBox.x + ringBox.width + pad);
      const bottom = Math.min(svgBox.y + svgBox.height, ringBox.y + ringBox.height + pad);
      await page.screenshot({ path: join(outputDir, `${row.caseId}-H-route-west-down-0.8-detail.png`), clip: { x, y, width: right - x, height: bottom - y } });
    }
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, []);
assert.equal(variantRows.length, 17);
const output = { source: 'Current S399 actual Polo SVGs; view-only diagnostic, no production changes', candidate: { id: 'west-down-0.8', translationCm: [dx, dy], ringCenterCm: [6.2, 0.8], ringRadiusCm: 0.22, glyphOffsetFromOriginalCm: [0.45, 0.52], leaderStartCm: [7, 0], leaderEndCm: [Number((7 + dx - dx / Math.hypot(dx, dy) * 0.24).toFixed(4)), Number((dy - dy / Math.hypot(dx, dy) * 0.24).toFixed(4))] }, disposition: 'Rejected: although the ring and glyph clear sampled marks and labels in 17/17, the direct leader intersects collar/stand source paths in all 17 options. See corrected search matrix.', configurations: variantRows.length, scheduleRowsPerOption: 11, browserErrors: errors, search: selected, renderedCases, rows: variantRows };
await writeFile(new URL('./h-route-west-down-0.8-output-matrix.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ configurations: variantRows.length, candidate: output.candidate, browserErrors: errors.length, renderedCases }));
