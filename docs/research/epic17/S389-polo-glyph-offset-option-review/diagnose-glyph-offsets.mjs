import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../S388-polo-keyed-label-obstacles/', import.meta.url));
const output = fileURLToPath(new URL('./', import.meta.url));
const input = JSON.parse(await readFile(join(root, 'polo-keyed-marker-trial-matrix.json'), 'utf8'));
assert.equal(input.summary.configurations, 17);
const cases = input.rows.map(({ caseId, options, revisionId }) => ({ caseId, options, revisionId }));
const offsets = { E: { dx: -0.38, dy: -0.34 }, I: { dx: 0.34, dy: -0.32 } };
const caseSuffixes = { E: ['polo-placketLength-min', 'polo-placketLength-max'],
  I: ['polo-collarLeafDepth-min', 'polo-collarLeafDepth-max', 'polo-standFrontRise-min'] };
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });

function moveGlyph(svg, key, { dx, dy }) {
  const group = new RegExp(`(<g\\b[^>]*data-pom-key="${key}"[^>]*>[\\s\\S]*?<text\\b[^>]*\\bx=")(-?\\d+(?:\\.\\d+)?)(" y=")(-?\\d+(?:\\.\\d+)?)(")`);
  const match = svg.match(group);
  assert.ok(match, `missing keyed ${key} glyph`);
  const oldX = Number(match[2]), oldY = Number(match[4]);
  const nextX = Number((oldX + dx).toFixed(4)), nextY = Number((oldY + dy).toFixed(4));
  return { svg: svg.replace(group, `$1${nextX}$3${nextY}$5`), oldX, oldY, nextX, nextY };
}

async function measureCandidate(svg, caseId, revisionId) {
  await page.setContent(svg, { waitUntil: 'load' });
  return page.evaluate(({ caseId, revisionId }) => {
    const doc = document;
    const root = document.querySelector('svg');
    const gap = (a, b) => {
      const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
      const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
      return Math.hypot(dx, dy);
    };
    const bounds = (node, expand = 0) => {
      const b = node.getBBox();
      return { minX: b.x - expand, minY: b.y - expand, maxX: b.x + b.width + expand, maxY: b.y + b.height + expand };
    };
    const pathData = [...doc.querySelectorAll('path[data-entity-id]')]
      .filter((path) => !path.hasAttribute('data-colorway-fill-for') && path.getAttribute('pointer-events') !== 'none'
        && (path.getAttribute('data-source-id') ?? '').startsWith('pattern:polo:'));
    const sourceLabels = [...doc.querySelectorAll('text[data-label-for]')]
      .filter((text) => (text.getAttribute('data-source-id') ?? '').startsWith('pattern:polo:'))
      .map((text) => ({ id: text.getAttribute('data-label-for'), sourceId: text.getAttribute('data-source-id'),
        text: text.textContent, box: bounds(text) }));
    const keyedGroups = [...doc.querySelectorAll('g[data-pom-key]')];
    const keyedTexts = keyedGroups.map((group) => {
      const text = group.querySelector('text');
      return { key: group.getAttribute('data-pom-key'), text, box: bounds(text, Number(text.getAttribute('stroke-width') ?? 0) / 2),
        center: { x: Number(group.querySelector('circle').getAttribute('cx')), y: Number(group.querySelector('circle').getAttribute('cy')) },
        radius: Number(group.querySelector('circle').getAttribute('r')), sourceId: group.getAttribute('data-source-id'),
        targetId: group.getAttribute('data-callout-target'), sourceEntityId: group.getAttribute('data-callout-source-entity') };
    });
    function pointRectDistance(point, box) {
      const dx = Math.max(0, box.minX - point.x, point.x - box.maxX);
      const dy = Math.max(0, box.minY - point.y, point.y - box.maxY);
      return Math.hypot(dx, dy);
    }
    function clearanceToPath(textBox, path) {
      const length = path.getTotalLength();
      if (!(length > 0)) return Number.POSITIVE_INFINITY;
      const stroke = Number.parseFloat(path.getAttribute('stroke-width') ?? '0') / 2;
      const steps = Math.max(1, Math.ceil(length / 0.015));
      let clearance = Number.POSITIVE_INFINITY;
      for (let i = 0; i <= steps; i++) {
        const point = path.getPointAtLength(length * i / steps);
        clearance = Math.min(clearance, pointRectDistance(point, textBox) - stroke);
      }
      return clearance;
    }
    function clearanceToCircle(textBox, circle) {
      const center = { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) };
      const dx = Math.max(0, textBox.minX - center.x, center.x - textBox.maxX);
      const dy = Math.max(0, textBox.minY - center.y, center.y - textBox.maxY);
      return Math.hypot(dx, dy) - Number(circle.getAttribute('r')) - Number.parseFloat(circle.getAttribute('stroke-width') ?? '0') / 2;
    }
    const sourceShapes = [...doc.querySelectorAll('circle[data-source-id], rect[data-source-id], g[data-mark-kind] circle, g[data-mark-kind] rect')]
      .filter((shape) => !shape.closest('g[data-pom-key]'))
      .map((shape) => ({ shape, sourceId: shape.getAttribute('data-source-id') ?? shape.closest('[data-source-id]')?.getAttribute('data-source-id') ?? '',
        entityId: shape.getAttribute('data-entity-id') ?? shape.closest('[data-entity-id]')?.getAttribute('data-entity-id') ?? '',
        stroke: Number.parseFloat(shape.getAttribute('stroke-width') ?? shape.closest('[stroke-width]')?.getAttribute('stroke-width') ?? '0') / 2 }));
    const targetKeys = ['E', 'I'];
    const checks = targetKeys.map((key) => {
      const target = keyedTexts.find((item) => item.key === key);
      const textBox = target.box;
      const labelClearances = sourceLabels.map((label) => ({ ...label, clearanceCm: gap(textBox, label.box) }))
        .sort((a, b) => a.clearanceCm - b.clearanceCm);
      const pathClearances = pathData.map((path) => ({ entityId: path.getAttribute('data-entity-id'),
        sourceId: path.getAttribute('data-source-id'), layer: path.getAttribute('data-layer'),
        clearanceCm: clearanceToPath(textBox, path) }))
        .sort((a, b) => a.clearanceCm - b.clearanceCm);
      const shapeClearances = sourceShapes.map(({ shape, sourceId, entityId, stroke }) => {
        let clear;
        if (shape.tagName.toLowerCase() === 'circle') clear = clearanceToCircle(textBox, shape);
        else {
          const b = shape.getBBox();
          clear = gap(textBox, { minX: b.x - stroke, minY: b.y - stroke, maxX: b.x + b.width + stroke, maxY: b.y + b.height + stroke });
        }
        return { entityId, sourceId, clearanceCm: clear };
      }).sort((a, b) => a.clearanceCm - b.clearanceCm);
      const otherGlyphs = keyedTexts.filter((item) => item.key !== key)
        .map((item) => ({ key: item.key, clearanceCm: gap(textBox, item.box) })).sort((a, b) => a.clearanceCm - b.clearanceCm);
      const circleClearanceCm = Math.hypot(
        Math.max(0, textBox.minX - target.center.x, target.center.x - textBox.maxX),
        Math.max(0, textBox.minY - target.center.y, target.center.y - textBox.maxY)) - target.radius;
      return { key, sourceId: target.sourceId, targetId: target.targetId, sourceEntityId: target.sourceEntityId,
        markerCenter: target.center, markerRadiusCm: target.radius, glyphBox: textBox, glyphToOwnRingClearanceCm: circleClearanceCm,
        nearestSourceLabel: labelClearances[0] ?? null, sourceLabelContacts: labelClearances.filter((item) => item.clearanceCm < 0.08),
        nearestSourcePath: pathClearances[0] ?? null, sourcePathContacts: pathClearances.filter((item) => item.clearanceCm <= 0),
        nearestSourceShape: shapeClearances[0] ?? null, sourceShapeContacts: shapeClearances.filter((item) => item.clearanceCm <= 0),
        nearestOtherKey: otherGlyphs[0] ?? null, otherKeyContacts: otherGlyphs.filter((item) => item.clearanceCm <= 0) };
    });
    const scheduleRows = [...doc.querySelectorAll('[data-layer-group="POM_SCHEDULE"] [data-schedule-for]')].map((item) => item.textContent);
    return { caseId, revisionId: root.getAttribute('data-revision-id'), keys: checks, sourceLabelCount: sourceLabels.length,
      scheduleRows, keyTargets: keyedTexts.map(({ key, sourceId, targetId, sourceEntityId, center, radius }) => ({ key, sourceId, targetId, sourceEntityId, center, radius })) };
  }, { caseId, revisionId });
}

try {
  await mkdir(join(output, 'rendered'), { recursive: true });
  const rows = [];
  const perKey = { E: [], I: [] };
  const overviewMetrics = [];
  for (const testCase of cases) {
    const filename = `${testCase.caseId}-collar-point.svg`;
    const original = await readFile(join(root, 'rendered', filename), 'utf8');
    const revisionMatch = original.match(/data-revision-id="([^"]+)"/);
    assert.equal(revisionMatch?.[1], testCase.revisionId, `${testCase.caseId}: wrong S388 revision`);
    assert.equal((original.match(/data-schedule-for=/gu) ?? []).length, 11, `${testCase.caseId}: source schedule row count changed`);
    const e = moveGlyph(original, 'E', offsets.E);
    const i = moveGlyph(e.svg, 'I', offsets.I);
    const restoredE = moveGlyph(e.svg, 'E', { dx: -offsets.E.dx, dy: -offsets.E.dy }).svg;
    const restoredBoth = moveGlyph(moveGlyph(i.svg, 'I', { dx: -offsets.I.dx, dy: -offsets.I.dy }).svg,
      'E', { dx: -offsets.E.dx, dy: -offsets.E.dy }).svg;
    assert.equal(restoredE, original, `${testCase.caseId}: E diagnostic touched content beyond its glyph coordinates`);
    assert.equal(restoredBoth, original, `${testCase.caseId}: combined E/I diagnostic changed non-glyph content`);
    const baseline = await measureCandidate(original, testCase.caseId, testCase.revisionId);
    const eOnlySvg = e.svg;
    const iOnlySvg = moveGlyph(original, 'I', offsets.I).svg;
    const combinedSvg = i.svg;
    const [eOnly, iOnly, combined] = await Promise.all([
      measureCandidate(eOnlySvg, testCase.caseId, testCase.revisionId),
      measureCandidate(iOnlySvg, testCase.caseId, testCase.revisionId),
      measureCandidate(combinedSvg, testCase.caseId, testCase.revisionId),
    ]);
    for (const [name, candidate] of [['E', eOnly], ['I', iOnly], ['combined', combined]]) {
      assert.equal(candidate.revisionId, testCase.revisionId, `${testCase.caseId}/${name}: stale revision`);
      assert.equal(candidate.scheduleRows.length, 11, `${testCase.caseId}/${name}: POM schedule changed`);
      assert.deepEqual(candidate.keyTargets, baseline.keyTargets, `${testCase.caseId}/${name}: marker/source target changed`);
      assert.equal(candidate.sourceLabelCount, baseline.sourceLabelCount);
    }
    for (const key of ['E', 'I']) {
      const current = (key === 'E' ? eOnly : iOnly).keys.find((item) => item.key === key);
      const originalKey = baseline.keys.find((item) => item.key === key);
      perKey[key].push({ caseId: testCase.caseId, options: testCase.options, revisionId: testCase.revisionId,
        sourceId: current.sourceId, targetId: current.targetId, sourceEntityId: current.sourceEntityId,
        center: current.markerCenter, radiusCm: current.markerRadiusCm,
        baselineGlyphBox: originalKey.glyphBox, candidateGlyphBox: current.glyphBox,
        glyphToRingClearanceCm: current.glyphToOwnRingClearanceCm,
        nearestSourceLabel: current.nearestSourceLabel,
        sourceLabelContacts: current.sourceLabelContacts,
        nearestSourcePath: current.nearestSourcePath,
        sourcePathContacts: current.sourcePathContacts,
        nearestSourceShape: current.nearestSourceShape,
        sourceShapeContacts: current.sourceShapeContacts,
        nearestOtherKey: current.nearestOtherKey, otherKeyContacts: current.otherKeyContacts,
        candidatePass: current.glyphToOwnRingClearanceCm >= 0
          && current.sourceLabelContacts.length === 0 && current.sourcePathContacts.length === 0
          && current.sourceShapeContacts.length === 0 && current.otherKeyContacts.length === 0 });
    }
    overviewMetrics.push({ caseId: testCase.caseId, revisionId: testCase.revisionId,
      baseline: baseline.keys.map((key) => ({ key: key.key, glyphBox: key.glyphBox, sourceLabelContacts: key.sourceLabelContacts.length,
        sourcePathContacts: key.sourcePathContacts.length, sourceShapeContacts: key.sourceShapeContacts.length })),
      combined: combined.keys.map((key) => ({ key: key.key, glyphBox: key.glyphBox, glyphToOwnRingClearanceCm: key.glyphToOwnRingClearanceCm,
        sourceLabelContacts: key.sourceLabelContacts.length, sourcePathContacts: key.sourcePathContacts.length,
        sourceShapeContacts: key.sourceShapeContacts.length, otherKeyContacts: key.otherKeyContacts.length })) });
    await writeFile(join(output, 'rendered', `${testCase.caseId}-E-I-offset-diagnostic.svg`), combinedSvg);
    if (testCase.caseId === 'polo-default' || caseSuffixes.E.includes(testCase.caseId) || caseSuffixes.I.includes(testCase.caseId)) {
      const doc = await measureCandidate(combinedSvg, testCase.caseId, testCase.revisionId);
      const selectedKeys = caseSuffixes.E.includes(testCase.caseId) ? ['E']
        : caseSuffixes.I.includes(testCase.caseId) ? ['I'] : ['E', 'I'];
      for (const key of selectedKeys) {
        const station = doc.keys.find((item) => item.key === key).markerCenter;
        const detail = 5;
        const clipped = combinedSvg.replace(/viewBox="[^"]+"/u,
          `viewBox="${(station.x - detail / 2).toFixed(4)} ${(station.y - detail / 2).toFixed(4)} ${detail} ${detail}"`);
        const label = `${testCase.caseId}-${key}-offset-candidate.png`;
        await page.setContent(clipped, { waitUntil: 'load' });
        await page.screenshot({ path: join(output, 'rendered', label), fullPage: true });
      }
    }
    rows.push({ caseId: testCase.caseId, revisionId: testCase.revisionId,
      pathAndSourceIdentityRestoredExactly: true, scheduleRows: 11, browserErrors: [] });
    console.log(`${testCase.caseId}: E/I isolated candidate overlays measured`);
  }
  assert.equal(rows.length, 17);
  assert.deepEqual(browserErrors, []);
  const summarize = (key) => {
    const all = perKey[key];
    return { options: all.length, optionPasses: all.filter((row) => row.candidatePass).length,
      sourceLabelContactOptions: all.filter((row) => row.sourceLabelContacts.length).map((row) => row.caseId),
      sourcePathContactOptions: all.filter((row) => row.sourcePathContacts.length).map((row) => row.caseId),
      sourceShapeContactOptions: all.filter((row) => row.sourceShapeContacts.length).map((row) => row.caseId),
      otherKeyContactOptions: all.filter((row) => row.otherKeyContacts.length).map((row) => row.caseId) };
  };
  const matrix = { source: 'S388 current-production renderer SVGs; diagnostic-only text-coordinate substitutions',
    options: 17, sourceRevisionMatches: true, browserErrors, sourcePathAndMarkContentChanged: false,
    markerCentersOrRadiiChanged: false, scheduleRowsPerOption: 11, offsets, perKeySummary: { E: summarize('E'), I: summarize('I') },
    rows, keys: perKey, combinedReview: overviewMetrics,
    disposition: 'Diagnostic only. Candidate options are measured against source labels, path strokes, authored shapes and peer keys; no production offsets or face acceptance.' };
  await writeFile(join(output, 'polo-glyph-offset-option-matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`);
  console.log(JSON.stringify(matrix.perKeySummary, null, 2));
  console.log(`browser errors: ${browserErrors.length}`);
} finally {
  await browser.close();
}
