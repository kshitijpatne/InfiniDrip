import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = fileURLToPath(new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url));
const s399 = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const keys = ['A', 'B', 'C', 'D', 'E', 'FG', 'H', 'I'];
assert.equal(s399.rows.length, 17);
const sourceFiles = await readdir(sourceDir);
const svgFor = (caseId) => {
  const file = sourceFiles.find((name) => name === `${caseId}-collar-point.svg`);
  assert.ok(file, `missing exact S399 SVG for ${caseId}`);
  return join(sourceDir, file);
};

function groupForKey(svg, key) {
  const keyIndex = svg.indexOf(`data-pom-key="${key}"`);
  assert.notEqual(keyIndex, -1, `missing ${key} station`);
  const start = svg.lastIndexOf('<g ', keyIndex);
  const end = svg.indexOf('</g>', keyIndex) + 4;
  assert.ok(start >= 0 && end > start, `malformed ${key} marker group`);
  return { start, end, value: svg.slice(start, end) };
}

function markerCircle(group) {
  const match = group.match(/<circle\b[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\br="([^"]+)"[^>]*\/>/u);
  assert.ok(match, 'H source-centered marker ring missing');
  return { element: match[0], cx: Number(match[1]), cy: Number(match[2]), r: Number(match[3]) };
}

function markCircle(svg, entityId) {
  const anchor = `data-entity-id="${entityId}"`;
  const index = svg.indexOf(anchor);
  assert.notEqual(index, -1, `missing authored mark ${entityId}`);
  const groupStart = svg.lastIndexOf('<g ', index);
  const groupEnd = svg.indexOf('</g>', index) + 4;
  const group = svg.slice(groupStart, groupEnd);
  const match = group.match(/<circle\b[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\br="([^"]+)"[^>]*\/>/u);
  assert.ok(match, `missing authored mark circle for ${entityId}`);
  return { x: Number(match[1]), y: Number(match[2]), r: Number(match[3]) };
}

async function screenshotRingCrop(svg, ringSelector, outPath, caseId) {
  await page.setContent(svg, { waitUntil: 'load' });
  const ringBox = await page.locator(ringSelector).boundingBox();
  const svgBox = await page.locator('svg').boundingBox();
  assert.ok(ringBox && svgBox, `${caseId}: H ring did not render for ${outPath}`);
  const pad = 260;
  const x = Math.max(svgBox.x, ringBox.x - pad);
  const y = Math.max(svgBox.y, ringBox.y - pad);
  const right = Math.min(svgBox.x + svgBox.width, ringBox.x + ringBox.width + pad);
  const bottom = Math.min(svgBox.y + svgBox.height, ringBox.y + ringBox.height + pad);
  await page.screenshot({ path: outPath, clip: { x, y, width: right - x, height: bottom - y } });
}

function trialSvg(svg, caseId) {
  const marker = groupForKey(svg, 'H');
  const circle = markerCircle(marker.value);
  assert.deepEqual([circle.cx, circle.cy, circle.r], [7, 0, 0.22], `${caseId}: H source ring changed`);
  assert.equal(svg.split(circle.element).length - 1, 1, `${caseId}: H ring element is not unique`);
  const markerGroup = marker.value.replace(circle.element, '');
  const withoutRing = `${svg.slice(0, marker.start)}${markerGroup}${svg.slice(marker.end)}`;
  const firstSourcePath = '<path data-entity-id="flat:polo:FRONT_FLAT:component:';
  const insertAt = withoutRing.indexOf(firstSourcePath);
  assert.notEqual(insertAt, -1, `${caseId}: first source geometry path missing`);
  const trial = `${withoutRing.slice(0, insertAt)}${circle.element}${withoutRing.slice(insertAt)}`;
  assert.equal(trial.split(circle.element).length - 1, 1, `${caseId}: trial did not retain exactly one H ring`);
  assert.equal(trial.replace(circle.element, ''), svg.replace(circle.element, ''), `${caseId}: trial changed content beyond ring order`);
  const trialMarker = groupForKey(trial, 'H');
  assert.doesNotMatch(trialMarker.value, /<circle\b/u, `${caseId}: H ring remained in foreground marker group`);
  assert.equal((trial.match(/data-entity-id="H:key-marker"/gu) ?? []).length, 1);
  assert.match(trial, /data-source-id="pom:polo:shoulder-seam\|pom:polo:neck-width"/u);
  assert.match(trial, /data-callout-targets="flat:polo:FRONT_FLAT:component:front:outline\|flat:polo:FRONT_FLAT:component:front:outline"/u);
  assert.equal((trial.match(/data-schedule-for="flat:polo:FRONT_FLAT:callout:/gu) ?? []).length, 11);
  return { trial, circle };
}

const outputDir = join(dir, 'rendered');
await mkdir(outputDir, { recursive: true });
const rows = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2400, height: 1800 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
try {
  for (const row of s399.rows) {
    const svg = await readFile(svgFor(row.caseId), 'utf8');
    assert.equal(row.visibleMarkerKeys.length, keys.length);
    assert.equal(row.revisionId, `live-draft:polo:S399:${row.caseId}`);
    const { trial, circle } = trialSvg(svg, row.caseId);
    const frontMark = markCircle(svg, 'flat:polo:FRONT_FLAT:mark:front:shoulder');
    const standMark = markCircle(svg, 'flat:polo:FRONT_FLAT:mark:outerStand:shoulder');
    rows.push({
      caseId: row.caseId,
      options: row.options,
      revisionId: row.revisionId,
      ring: circle,
      frontShoulderMark: frontMark,
      outerStandShoulderMark: standMark,
      exactSourceTexts: row.sourceCenteredPoms.filter((pom) => pom.key === 'H').map(({ sourceId, targetId, sourceEntityId, anchor, text }) => ({ sourceId, targetId, sourceEntityId, anchor, text })),
      scheduleRows: row.fullScheduleRows,
      geometryAndScheduleUnchanged: true,
    });
    await writeFile(join(outputDir, `polo-${row.caseId}-H-ring-behind-source.svg`), trial, 'utf8');
    if (['polo-default', 'polo-standFrontRise-max', 'polo-standFrontRise-min'].includes(row.caseId)) {
      await screenshotRingCrop(svg, 'g[data-pom-key="H"] circle', join(outputDir, `polo-${row.caseId}-H-ring-current-detail.png`), row.caseId);
      const taggedTrial = trial.replace(circle.element, circle.element.replace('<circle', '<circle data-s412-h-ring="trial"'));
      await screenshotRingCrop(taggedTrial, 'circle[data-s412-h-ring="trial"]', join(outputDir, `polo-${row.caseId}-H-ring-behind-source-detail.png`), row.caseId);
    }
  }
} finally {
  await browser.close();
}
assert.deepEqual(browserErrors, []);
assert.equal(rows.length, 17);
assert.ok(rows.every((row) => row.ring.cx === 7 && row.ring.cy === 0 && row.ring.r === 0.22));
assert.ok(rows.every((row) => row.scheduleRows === 11 && row.geometryAndScheduleUnchanged));
const output = {
  source: 'Exact saved S399 production SVGs; H ring-only diagnostic reorder in memory, no production map changes',
  configurations: rows.length,
  browserErrors,
  testedTreatment: 'Move the exact H source-centered circle to just after colorway fills and before every source silhouette path; keep its original group text, source IDs, anchor, value, radius, schedule, marks and paths unchanged.',
  allOptionChecks: { sameRevisionAndOptions: true, sameHSourceRing: true, samePomsAndTargets: true, scheduleRowsPerOption: 11, sourceMarksAndPathsUntouched: true },
  renderedCases: ['polo-default', 'polo-standFrontRise-max', 'polo-standFrontRise-min'],
  rows,
};
await writeFile(new URL('./h-ring-layer-trial-matrix.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({configurations: rows.length, browserErrors: browserErrors.length, renderedCases: output.renderedCases, Hring: 'fixed at (7,0), r=.22 cm'}));
