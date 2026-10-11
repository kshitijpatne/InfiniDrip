import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const folder = fileURLToPath(new URL('./', import.meta.url));
const rendered = join(folder, '..', 'S401-woven-paired-live-output-review', 'rendered');
const matrix = JSON.parse(await readFile(join(folder, '..', 'S401-woven-paired-live-output-review',
  'woven-paired-live-output-matrix.json'), 'utf8'));
const cases = matrix.rows.map(({ caseId, options }) => ({ caseId, options }));
assert.equal(cases.length, 28);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
  const rows = [];
  for (const testCase of cases) {
    const svg = await readFile(join(rendered, `${testCase.caseId}-front_flat-current.svg`), 'utf8');
    await page.setContent(svg, { waitUntil: 'load' });
    const result = await page.evaluate(() => {
      const callout = document.querySelector("g[data-entity-id='flat:woven-shirt:FRONT_FLAT:callout:front-button-spacing']");
      const leader = callout?.querySelector('path');
      if (!callout || !leader) return { found: false };
      const coords = leader.getAttribute('d').match(/-?\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
      if (coords.length !== 4) return { found: true, malformed: leader.getAttribute('d') };
      const [ax, ay, bx, by] = coords;
      const segmentDistance = (x, y) => {
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(x - ax - t * dx, y - ay - t * dy);
      };
      const contours = [...document.querySelectorAll("path[data-entity-id][data-source-id^='pattern:woven-shirt:role:']")]
        .filter((path) => /role:(?:outerStand|upperCollar|underCollar|front):(?:edge:)?(?:outline|neckline|armhole)?$/u.test(path.getAttribute('data-source-id') ?? '')
          || /role:(?:outerStand|upperCollar|underCollar|front)(?::|$)/u.test(path.getAttribute('data-source-id') ?? ''));
      const relevant = [];
      for (const path of contours) {
        if (path === leader) continue;
        const length = path.getTotalLength();
        const count = Math.max(2, Math.ceil(length / 0.0125));
        let minimum = Number.POSITIVE_INFINITY;
        for (let i = 0; i <= count; i += 1) {
          const point = path.getPointAtLength(length * i / count);
          minimum = Math.min(minimum, segmentDistance(point.x, point.y));
        }
        if (minimum <= 0.15) relevant.push({ entityId: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'),
          minimumCenterlineDistanceCm: minimum, strokedContactWithin035cm: minimum <= 0.035 });
      }
      const marks = [...document.querySelectorAll("g[data-entity-id*='mark:buttonPlacket:button-'] circle, g[data-entity-id*='mark:buttonPlacket:button-'] path")]
        .map((shape) => ({ entityId: shape.parentElement?.getAttribute('data-entity-id'), sourceId: shape.parentElement?.getAttribute('data-source-id'),
          x: Number(shape.getAttribute('cx') ?? 0), y: Number(shape.getAttribute('cy') ?? 0) }));
      return { found: true, sourceId: callout.getAttribute('data-source-id'), targetId: callout.getAttribute('data-callout-target'),
        sourceEntityId: callout.getAttribute('data-callout-source-entity'), revisionId: callout.getAttribute('data-revision-id'),
        leaderD: leader.getAttribute('d'), sourceAnchor: { x: ax, y: ay }, labelPoint: { x: bx, y: by },
        relevantContours: relevant, buttonMarkGroups: marks };
    });
    assert.equal(result.found, true, `${testCase.caseId}: button-spacing callout missing`);
    rows.push({ ...testCase, ...result });
  }
  assert.equal(rows.every((row) => row.sourceId === 'pom:woven-shirt:front-button-spacing'
    && row.targetId === 'flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1'
    && row.sourceEntityId === 'pattern:woven-shirt:mark:buttonPlacket:button-1'
    && row.revisionId === 'live-draft:woven-shirt:14:14'), true);
  const output = { summary: { configurations: rows.length, frontButtonSpacingLeaderHitsCollarOrNeckline:
    rows.filter((row) => row.relevantContours.some((path) => path.strokedContactWithin035cm)).length,
    frontButtonSpacingLeaderWithin015cmOfCollarOrNeckline: rows.filter((row) => row.relevantContours.length > 0).length }, rows };
  assert.equal(output.summary.frontButtonSpacingLeaderHitsCollarOrNeckline, 23);
  await writeFile(join(folder, 'woven-front-button-spacing-crossings.json'), `${JSON.stringify(output, null, 2)}\n`);

  const defaultSvg = await readFile(join(rendered, 'woven-shirt-default-front_flat-current.svg'), 'utf8');
  await page.setContent(defaultSvg, { waitUntil: 'load' });
  await page.evaluate(() => {
    for (const path of document.querySelectorAll("path[data-entity-id][data-source-id^='pattern:woven-shirt:role:']")) {
      if (/role:(?:outerStand|upperCollar|underCollar|front)(?::|$)/u.test(path.getAttribute('data-source-id') ?? '')) {
        path.setAttribute('data-s402-highlight', 'collar-or-neckline');
        path.setAttribute('stroke', '#dc2626'); path.setAttribute('stroke-width', '0.11');
      }
    }
    const leader = document.querySelector("g[data-entity-id='flat:woven-shirt:FRONT_FLAT:callout:front-button-spacing'] path");
    leader?.setAttribute('data-s402-highlight', 'blocked-front-button-spacing-leader');
    leader?.setAttribute('stroke', '#7c3aed'); leader?.setAttribute('stroke-width', '0.13');
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    box.setAttribute('x', '13'); box.setAttribute('y', '2.5'); box.setAttribute('font-size', '0.55');
    box.setAttribute('fill', '#7c3aed'); box.textContent = 'S402 diagnostic: violet = button-spacing POM leader; red = source collar/neckline paths';
    document.documentElement.append(box);
  });
  await mkdir(join(folder, 'rendered'), { recursive: true });
  await page.locator('svg').screenshot({ path: join(folder, 'rendered', 'woven-default-front-button-spacing-crossing.png') });
  await writeFile(join(folder, 'rendered', 'woven-default-front-button-spacing-crossing.svg'), await page.locator('svg').evaluate((svg) => svg.outerHTML));
  console.log(JSON.stringify(output.summary));
} finally {
  await browser.close();
}
