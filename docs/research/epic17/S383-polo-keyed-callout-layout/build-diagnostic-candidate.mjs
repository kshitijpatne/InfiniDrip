import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { chromium } from 'playwright';

const root = 'docs/research/epic17/S383-polo-keyed-callout-layout';
const sourceRoot = 'docs/research/epic17/S380-polo-collar-callout-key-implementation/rendered';
const sourceMatrix = JSON.parse(await readFile('docs/research/epic17/S380-polo-collar-callout-key-implementation/collar-point-callout-matrix.json', 'utf8'));
const s382 = JSON.parse(await readFile('docs/research/epic17/S382-polo-blocker-consolidation/leader-crossing-matrix.json', 'utf8'));
const pomSummaries = JSON.parse(await readFile('docs/research/epic17/S382-polo-blocker-consolidation/per-pom-summary.json', 'utf8'));
const selected = new Set(pomSummaries.map((item) => item.sourceId));
assert.equal(sourceMatrix.rows.length, 17);
assert.equal(s382.results.length, 17);
assert.equal(pomSummaries.length, 10);

// Keys group only identical source coordinates. Each marker retains every exact POM
// source ID, source entity, target and S380 revision that uses that point.
const groups = [
  { key: 'A', poms: ['pom:polo:across-shoulder'] },
  { key: 'B', poms: ['pom:polo:body-chest-finished', 'pom:polo:sleeve-bicep-width'] },
  { key: 'D', poms: ['pom:polo:button-spacing'] },
  { key: 'E', poms: ['pom:polo:finished-placket-length'] },
  { key: 'FG', poms: ['pom:polo:finished-placket-width', 'pom:polo:front-neck-drop'] },
  { key: 'H', poms: ['pom:polo:neck-width', 'pom:polo:shoulder-seam'] },
  { key: 'I', poms: ['pom:polo:finished-pointed-collar-leaf'] },
];
assert.deepEqual(new Set(groups.flatMap((group) => group.poms)), selected);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
const results = [];

function parse(svg) { return new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document; }
function escapeXml(text) { return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function p2(path) {
  const match = path.match(/^M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+L\s*(-?[\d.]+)\s+(-?[\d.]+)/u);
  assert.ok(match, `unsupported callout path: ${path}`);
  return { x: Number(match[1]), y: Number(match[2]), end: { x: Number(match[3]), y: Number(match[4]) } };
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function segments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? []; let i = 0, point = null, start = null; const out = [];
  while (i < tokens.length) {
    const op = tokens[i++];
    if (op === 'M') { point = { x: +tokens[i++], y: +tokens[i++] }; start = point; }
    else if (op === 'L') { const end = { x: +tokens[i++], y: +tokens[i++] }; if (point) out.push([point, end]); point = end; }
    else if (op === 'C') {
      const c1 = { x: +tokens[i++], y: +tokens[i++] }, c2 = { x: +tokens[i++], y: +tokens[i++] }, end = { x: +tokens[i++], y: +tokens[i++] };
      if (point) { let prior = point; for (let n = 1; n <= 200; n++) { const t = n / 200, u = 1 - t;
        const next = { x: u ** 3 * point.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
          y: u ** 3 * point.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y };
        out.push([prior, next]); prior = next; } }
      point = end;
    } else if (op === 'Z' && point && start) { out.push([point, start]); point = start; }
    else throw new Error(`unsupported SVG path operator ${op}`);
  }
  return out;
}
function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, denominator = dx * dx + dy * dy;
  const t = denominator ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / denominator)) : 0;
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

try {
  await mkdir(join(root, 'rendered', 'colorway-on'), { recursive: true });
  await mkdir(join(root, 'rendered', 'colorway-off'), { recursive: true });
  await mkdir(join(root, 'rendered', 'detail'), { recursive: true });
  for (const sourceRow of sourceMatrix.rows) {
    const row = s382.results.find((item) => item.caseId === sourceRow.caseId);
    assert.ok(row, `${sourceRow.caseId}: S382 output row absent`);
    assert.deepEqual(sourceRow.options, row.optionOverrides, `${sourceRow.caseId}: option identity changed`);
    assert.equal(sourceRow.revisionId, `live-draft:polo:S380:${sourceRow.caseId}`);
    const input = await readFile(join(sourceRoot, `${sourceRow.caseId}-collar-point.svg`), 'utf8');
    const doc = parse(input);
    const svg = doc.documentElement;
    assert.equal(svg.getAttribute('data-revision-id'), sourceRow.revisionId);
    const originalPaths = [...doc.querySelectorAll('path[data-entity-id]')].map((path) => [path.getAttribute('data-entity-id'), path.getAttribute('d'), path.getAttribute('data-source-id')]);
    const geometricPaths = [...doc.querySelectorAll('path[data-entity-id]')]
      .filter((path) => !path.hasAttribute('data-colorway-fill-for') && path.getAttribute('pointer-events') !== 'none')
      .map((path) => ({ id: path.getAttribute('data-entity-id'), source: path.getAttribute('data-source-id') ?? '', segments: segments(path.getAttribute('d') ?? '') }));
    const originalPomGroups = [...doc.querySelectorAll('g[data-feature="pom"][data-source-id]')];
    const anchors = new Map();
    const exactPoms = new Map();
    for (const group of originalPomGroups) {
      const id = group.getAttribute('data-source-id');
      if (!selected.has(id)) continue;
      const leader = group.querySelector('path');
      assert.ok(leader, `${sourceRow.caseId}/${id}: emitted source POM leader absent`);
      const anchor = p2(leader.getAttribute('d'));
      const calloutId = `flat:polo:FRONT_FLAT:callout:${id.slice('pom:polo:'.length)}`;
      const fullText = doc.querySelector(`text[data-label-for="${calloutId}"]`)?.textContent?.trim() ?? '';
      assert.ok(fullText, `${sourceRow.caseId}/${id}: exact source text absent`);
      exactPoms.set(id, { sourceId: id, text: fullText, sourceEntity: group.getAttribute('data-callout-source-entity'),
        targetId: group.getAttribute('data-callout-target'), revisionId: group.getAttribute('data-revision-id'), anchor: { x: anchor.x, y: anchor.y } });
      anchors.set(id, anchor);
    }
    assert.deepEqual(new Set(exactPoms.keys()), selected, `${sourceRow.caseId}: selected POMs not all present`);
    for (const [id, pom] of exactPoms) assert.equal(pom.revisionId, sourceRow.revisionId, `${sourceRow.caseId}/${id}: revision mismatch`);

    const markerPoints = [];
    const markers = groups.map(({ key, poms }) => {
      const points = poms.map((id) => anchors.get(id));
      const origin = points[0];
      assert.ok(points.every((point) => dist(point, origin) < 1e-5), `${sourceRow.caseId}/${key}: grouped POMs are not exactly co-located`);
      const metadata = poms.map((id) => exactPoms.get(id));
      const commonSourceEntities = [...new Set(metadata.map((pom) => pom.sourceEntity))];
      const commonTargets = [...new Set(metadata.map((pom) => pom.targetId))];
      markerPoints.push({ key, poms, targets: commonTargets, x: origin.x, y: origin.y });
      return `<g data-s383-marker="${key}" data-pom-keys="${key}" data-source-poms="${poms.join(' ')}" data-source-entities="${commonSourceEntities.join(' ')}" data-targets="${commonTargets.join(' ')}" data-revision-id="${sourceRow.revisionId}"><circle cx="${origin.x}" cy="${origin.y}" r="0.22" fill="#fff" stroke="#991b1b" stroke-width="0.07"/><text x="${origin.x}" y="${origin.y + 0.07}" text-anchor="middle" font-family="Arial, sans-serif" font-size="0.18" font-weight="700" fill="#991b1b">${key}</text></g>`;
    });
    const cMarker = doc.querySelector('g[data-pom-key="C"][data-feature="pom"]');
    assert.ok(cMarker, `${sourceRow.caseId}: existing approved C marker missing`);
    const cCircle = cMarker.querySelector('circle');
    const cOrigin = { x: Number(cCircle.getAttribute('cx')), y: Number(cCircle.getAttribute('cy')) };
    markerPoints.push({ key: 'C', poms: ['pom:polo:collar-point-extension'], targets: [cMarker.getAttribute('data-callout-target')], x: cOrigin.x, y: cOrigin.y });
    const markerPairs = [];
    for (let i = 0; i < markerPoints.length; i++) for (let j = i + 1; j < markerPoints.length; j++) {
      const clearance = dist(markerPoints[i], markerPoints[j]) - 0.44;
      markerPairs.push({ a: markerPoints[i].key, b: markerPoints[j].key, edgeClearanceCm: +clearance.toFixed(5), overlaps: clearance < 0 });
    }
    const markerPathClearances = markerPoints.map((marker) => {
      let nearest = { clearanceCm: Infinity, pathId: null, pathSource: null };
      for (const path of geometricPaths) {
        if (marker.targets.includes(path.id)) continue;
        for (const [a, b] of path.segments) {
          const clearanceCm = pointSegmentDistance(marker, a, b) - 0.22;
          if (clearanceCm < nearest.clearanceCm) nearest = { clearanceCm, pathId: path.id, pathSource: path.source };
        }
      }
      return { key: marker.key, poms: marker.poms, ...nearest, within025: nearest.clearanceCm < 0.25 };
    });

    for (const group of originalPomGroups) if (selected.has(group.getAttribute('data-source-id'))) group.remove();
    for (const id of selected) {
      const calloutId = `flat:polo:FRONT_FLAT:callout:${id.slice('pom:polo:'.length)}`;
      doc.querySelector(`text[data-label-for="${calloutId}"]`)?.remove();
      assert.equal(doc.querySelector(`text[data-label-for="${calloutId}"]`), null, `${sourceRow.caseId}/${id}: old inline label remains`);
    }
    const markerLayer = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    markerLayer.setAttribute('data-layer-group', 'ANNOTATION');
    markerLayer.setAttribute('data-s383-diagnostic-candidate', 'true');
    markerLayer.innerHTML = markers.join('');
    const schedule = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    schedule.setAttribute('data-layer-group', 'POM_SCHEDULE');
    schedule.setAttribute('data-s383-diagnostic-candidate', 'true');
    schedule.setAttribute('data-revision-id', sourceRow.revisionId);
    const existingSchedule = doc.querySelector('g[data-layer-group="POM_SCHEDULE"]');
    assert.ok(existingSchedule, `${sourceRow.caseId}: measured existing schedule position missing`);
    const oldRect = existingSchedule.querySelector('rect');
    const x = Number(oldRect.getAttribute('x'));
    const oldY = Number(oldRect.getAttribute('y'));
    const y = oldY;
    const width = 31;
    const lineHeight = 0.43;
    const rows = [
      { key: 'A', pom: 'pom:polo:across-shoulder' },
      { key: 'B', pom: 'pom:polo:body-chest-finished' },
      { key: 'B', pom: 'pom:polo:sleeve-bicep-width' },
      { key: 'C', pom: 'pom:polo:collar-point-extension' },
      { key: 'D', pom: 'pom:polo:button-spacing' },
      { key: 'E', pom: 'pom:polo:finished-placket-length' },
      { key: 'F', pom: 'pom:polo:finished-placket-width' },
      { key: 'G', pom: 'pom:polo:front-neck-drop' },
      { key: 'H', pom: 'pom:polo:neck-width' },
      { key: 'H', pom: 'pom:polo:shoulder-seam' },
      { key: 'I', pom: 'pom:polo:finished-pointed-collar-leaf' },
    ];
    const headerY = y + 0.60;
    const firstY = y + 1.34;
    const lastY = firstY + (rows.length - 1) * lineHeight;
    const panelHeight = lastY - y + 0.48;
    const extraHeight = Math.max(0, (y + panelHeight + 1) - Number(svg.getAttribute('viewBox').split(/\s+/u)[1]) - Number(svg.getAttribute('viewBox').split(/\s+/u)[3]));
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(/\s+/u).map(Number);
    svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh + extraHeight}`);
    svg.setAttribute('height', `${vh + extraHeight}cm`);
    const paper = doc.querySelector('[data-technical-flat-paper="true"]');
    paper.setAttribute('height', `${vh + extraHeight}cm`);
    existingSchedule.remove();
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y)); rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(panelHeight)); rect.setAttribute('rx', '0.12'); rect.setAttribute('fill', '#fff');
    rect.setAttribute('stroke', '#64748b'); rect.setAttribute('stroke-width', '0.06'); schedule.append(rect);
    const header = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    header.setAttribute('x', String(x + 0.35)); header.setAttribute('y', String(headerY)); header.setAttribute('font-family', 'Arial, sans-serif');
    header.setAttribute('font-size', '0.28'); header.setAttribute('font-weight', '700'); header.setAttribute('fill', '#334155'); header.textContent = 'SOURCE POM'; schedule.append(header);
    for (let i = 0; i < rows.length; i++) {
      const { key, pom } = rows[i];
      const value = pom === 'pom:polo:collar-point-extension'
        ? sourceRow.scheduleText.replace(/^C\s+/u, '')
        : exactPoms.get(pom)?.text;
      assert.ok(value, `${sourceRow.caseId}/${pom}: schedule full text missing`);
      const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      const p = pom === 'pom:polo:collar-point-extension' ? null : exactPoms.get(pom);
      label.setAttribute('data-schedule-for', `flat:polo:FRONT_FLAT:callout:${pom.replace('pom:polo:', '')}`);
      label.setAttribute('data-pom-key', key); label.setAttribute('data-source-id', pom);
      label.setAttribute('data-source-class', 'PATTERN_DERIVED'); label.setAttribute('data-revision-id', sourceRow.revisionId);
      label.setAttribute('data-callout-target', p?.targetId ?? sourceRow.targetId);
      if (p?.sourceEntity) label.setAttribute('data-callout-source-entity', p.sourceEntity);
      label.setAttribute('x', String(x + 0.35)); label.setAttribute('y', String(firstY + i * lineHeight));
      label.setAttribute('font-family', 'Arial, sans-serif'); label.setAttribute('font-size', '0.32'); label.setAttribute('fill', '#111827');
      label.textContent = `${key}  ${value}`; schedule.append(label);
    }
    svg.insertBefore(markerLayer, svg.lastChild);
    svg.insertBefore(schedule, svg.lastChild);
    const candidate = new doc.defaultView.XMLSerializer().serializeToString(svg);
    const pathIdentityAfter = [...parse(candidate).querySelectorAll('path[data-entity-id]')].map((path) => [path.getAttribute('data-entity-id'), path.getAttribute('d'), path.getAttribute('data-source-id')]);
    assert.deepEqual(pathIdentityAfter, originalPaths, `${sourceRow.caseId}: candidate changed pattern/source path geometry`);
    const noColorwayDoc = parse(candidate);
    for (const node of noColorwayDoc.querySelectorAll('[data-colorway-area-group]')) node.remove();
    noColorwayDoc.documentElement.removeAttribute('data-colorway-id');
    noColorwayDoc.documentElement.removeAttribute('data-colorway-revision');
    noColorwayDoc.documentElement.removeAttribute('data-color');
    noColorwayDoc.documentElement.removeAttribute('data-texture');
    noColorwayDoc.documentElement.removeAttribute('data-shine');
    const noColorway = new noColorwayDoc.defaultView.XMLSerializer().serializeToString(noColorwayDoc.documentElement);
    await page.setContent(candidate, { waitUntil: 'load' });
    const bounds = await page.evaluate(() => {
      const texts = [...document.querySelectorAll('text[data-schedule-for]')].map((text) => {
        const box = text.getBBox(); return { key: text.getAttribute('data-pom-key'), sourceId: text.getAttribute('data-source-id'),
          text: text.textContent, x: box.x, y: box.y, width: box.width, height: box.height, right: box.x + box.width };
      });
      const markers = [...document.querySelectorAll('g[data-s383-marker]')].map((g) => {
        const circle = g.querySelector('circle'), text = g.querySelector('text'), box = text.getBBox(); return { key: g.getAttribute('data-s383-marker'), x: +circle.getAttribute('cx'), y: +circle.getAttribute('cy'),
          labelBox: { x: box.x, y: box.y, width: box.width, height: box.height },
          poms: g.getAttribute('data-source-poms'), targets: g.getAttribute('data-targets'), entities: g.getAttribute('data-source-entities') };
      });
      const sourceLabels = [...document.querySelectorAll('text[data-label-for]')].map((text) => {
        const box = text.getBBox(); return { id: text.getAttribute('data-label-for'), text: text.textContent, x: box.x, y: box.y, width: box.width, height: box.height };
      });
      const svg = document.querySelector('svg'); const vb = svg.getAttribute('viewBox').split(/\s+/u).map(Number);
      const panel = document.querySelector('g[data-s383-diagnostic-candidate="true"] rect');
      return { texts, markers, sourceLabels, viewBox: vb, panel: { x: +panel.getAttribute('x'), y: +panel.getAttribute('y'), width: +panel.getAttribute('width'), height: +panel.getAttribute('height') } };
    });
    for (const text of bounds.texts) {
      assert.ok(text.width > 0, `${sourceRow.caseId}/${text.sourceId}: Chromium returned empty schedule text`);
      assert.ok(text.right <= bounds.panel.x + bounds.panel.width - 0.25, `${sourceRow.caseId}/${text.sourceId}: schedule text overflows panel`);
      assert.equal(text.height > 0, true);
    }
    const scheduleRowsOverlap = [];
    for (let i = 1; i < bounds.texts.length; i++) {
      const prior = bounds.texts[i - 1], current = bounds.texts[i];
      if (prior.y + prior.height > current.y + 0.005) scheduleRowsOverlap.push({ a: prior.sourceId, b: current.sourceId });
    }
    assert.equal(scheduleRowsOverlap.length, 0, `${sourceRow.caseId}: schedule rows overlap`);
    const markerTextIntersections = [];
    for (const marker of bounds.markers) for (const label of bounds.sourceLabels) {
      const a = marker.labelBox, b = label;
      if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) {
        markerTextIntersections.push({ key: marker.key, labelFor: label.id, label: label.text });
      }
    }
    const onPath = join(root, 'rendered', 'colorway-on', `${sourceRow.caseId}.svg`);
    const offPath = join(root, 'rendered', 'colorway-off', `${sourceRow.caseId}.svg`);
    await writeFile(onPath, `${candidate}\n`); await writeFile(offPath, `${noColorway}\n`);
    for (const [kind, output] of [['colorway-on', candidate], ['colorway-off', noColorway]]) {
      await page.setContent(output, { waitUntil: 'load' });
      const file = join(root, 'rendered', kind, `${sourceRow.caseId}.png`);
      await page.screenshot({ path: file, fullPage: true });
    }
    if (['polo-default', 'polo-placketWidth-min', 'polo-standFrontRise-min', 'polo-collarPointExtension-max'].includes(sourceRow.caseId)) {
      await page.setContent(candidate, { waitUntil: 'load' });
      await page.screenshot({ path: join(root, 'rendered', 'detail', `${sourceRow.caseId}-whole.png`), fullPage: true });
      const detail = candidate.replace(/viewBox="([^"]+)"/u, (_all, value) => {
        const [, , , vh0] = value.split(/\s+/u).map(Number); return `viewBox="-10 -17 48 ${Math.min(vh0, 42)}"`;
      });
      await page.setContent(detail, { waitUntil: 'load' });
      await page.screenshot({ path: join(root, 'rendered', 'detail', `${sourceRow.caseId}-garment.png`), fullPage: true });
      const scheduleDetail = candidate.replace(/viewBox="[^"]+"/u, `viewBox="${bounds.panel.x} ${bounds.panel.y - 0.2} ${bounds.panel.width} ${bounds.panel.height + 0.4}"`)
        .replace(/width="[^"]+"/u, `width="${bounds.panel.width}cm"`).replace(/height="[^"]+"/u, `height="${bounds.panel.height + 0.4}cm"`);
      await page.setContent(scheduleDetail, { waitUntil: 'load' });
      await page.screenshot({ path: join(root, 'rendered', 'detail', `${sourceRow.caseId}-schedule.png`), fullPage: true });
    }
    results.push({ caseId: sourceRow.caseId, options: sourceRow.options, revisionId: sourceRow.revisionId,
      sourceOptionMatch: true, sourcePathsUnchanged: true, selectedPoms: exactPoms.size, markerCount: markerPoints.length,
      markers: bounds.markers, markerPairs, markerPathClearances, scheduleRows: bounds.texts.length, scheduleRowsOverlap, scheduleTextOverflows: false,
      markerTextIntersections, colorwayOnAndOffRendered: true, bodySchedulePanel: bounds.panel, viewBox: bounds.viewBox,
      remainingInlinePoms: originalPomGroups.length - selected.size });
  }
  assert.equal(browserErrors.length, 0, `Chromium errors: ${browserErrors.join('; ')}`);
  const summary = { configurations: results.length, exactS380Options: results.every((row) => row.sourceOptionMatch),
    exactCurrentSourceRevision: results.every((row) => row.revisionId.startsWith('live-draft:polo:S380:')),
    sourcePathsUnchanged: results.every((row) => row.sourcePathsUnchanged), colorwayOnAndOffRendered: results.every((row) => row.colorwayOnAndOffRendered),
    scheduleRowsPerOption: [...new Set(results.map((row) => row.scheduleRows))], markerCountIncludingCPerOption: [...new Set(results.map((row) => row.markerCount))],
    markerOverlapRows: results.flatMap((row) => row.markerPairs.filter((pair) => pair.overlaps).map((pair) => ({ caseId: row.caseId, ...pair }))),
    markerPathClearanceRows: results.flatMap((row) => row.markerPathClearances.filter((item) => item.within025).map((item) => ({ caseId: row.caseId, ...item }))),
    scheduleOverlapRows: results.flatMap((row) => row.scheduleRowsOverlap.map((overlap) => ({ caseId: row.caseId, ...overlap }))),
    markerTextIntersections: results.flatMap((row) => row.markerTextIntersections.map((overlap) => ({ caseId: row.caseId, ...overlap }))),
    browserErrors: browserErrors.length, remainingInlinePomsPerOption: [...new Set(results.map((row) => row.remainingInlinePoms))], results };
  await writeFile(join(root, 'candidate-matrix.json'), `${JSON.stringify(summary, null, 2)}\n`);
  assert.equal(results.length, 17); assert.equal(summary.scheduleOverlapRows.length, 0);
  console.log(JSON.stringify({ configurations: summary.configurations, markerOverlapRows: summary.markerOverlapRows,
    scheduleRowsPerOption: summary.scheduleRowsPerOption, browserErrors: summary.browserErrors }, null, 2));
} finally { await browser.close(); }
