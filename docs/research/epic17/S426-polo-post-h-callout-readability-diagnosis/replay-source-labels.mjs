import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { renderTechnicalFlatSvg } from '../../../../src/render/technical-flat-svg.ts';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const inputDir = new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url);
const priorMatrix = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const s425Matrix = JSON.parse(await readFile(new URL('../S425-polo-h-segmented-locator-implementation/S425-rendered-output-matrix.json', import.meta.url), 'utf8'));
const outputDir = new URL('./rendered-source-labels/', import.meta.url);
await mkdir(outputDir, { recursive: true });
const measureText = (text, size) => ({ widthCm: text.length * size * 0.35, ascentCm: size * 0.7, descentCm: size * 0.2 });

function pathCommands(data) {
  const tokens = data.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/gu) ?? [];
  const commands = []; let operation = ''; let index = 0; let current = { x: 0, y: 0 }; let subpath = current;
  while (index < tokens.length) {
    if (/^[A-Za-z]$/u.test(tokens[index])) operation = tokens[index++];
    if (operation === 'Z' || operation === 'z') { commands.push({ op: 'close' }); current = subpath; operation = ''; continue; }
    if (operation === 'M' || operation === 'm') {
      const relative = operation === 'm'; const x = Number(tokens[index++]); const y = Number(tokens[index++]);
      current = { x: relative ? current.x + x : x, y: relative ? current.y + y : y }; subpath = current;
      commands.push({ op: 'move', point: current }); operation = relative ? 'l' : 'L';
    } else if (operation === 'L' || operation === 'l') {
      const relative = operation === 'l'; const x = Number(tokens[index++]); const y = Number(tokens[index++]);
      current = { x: relative ? current.x + x : x, y: relative ? current.y + y : y }; commands.push({ op: 'line', point: current });
    } else if (operation === 'C' || operation === 'c') {
      const relative = operation === 'c'; const values = tokens.slice(index, index + 6).map(Number); index += 6;
      const point = (x, y) => ({ x: relative ? current.x + x : x, y: relative ? current.y + y : y });
      const control1 = point(values[0], values[1]); const control2 = point(values[2], values[3]);
      current = point(values[4], values[5]); commands.push({ op: 'cubic', control1, control2, point: current });
    } else throw new Error(`Unsupported SVG path operation ${operation}`);
  }
  return commands;
}

function sourceView(svg) {
  const root = new JSDOM('').window.DOMParser ? new JSDOM('').window.DOMParser : undefined;
  assert.ok(root);
  const document = new root().parseFromString(svg, 'image/svg+xml').documentElement;
  const revisionId = document.getAttribute('data-revision-id');
  const primitives = [];
  const fillEdges = new Map([...document.querySelectorAll('path[data-colorway-fill-for]')]
    .map((path) => [path.getAttribute('data-colorway-fill-for'), path.getAttribute('data-colorway-contour-sources').split(/\s+/u)]));
  const sourcePaths = [...document.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')];
  const originals = sourcePaths.map((path) => `${path.getAttribute('data-entity-id')}|${path.getAttribute('data-source-id')}|${path.getAttribute('data-revision-id')}|${path.getAttribute('d')}`);
  for (const path of sourcePaths) {
    const commands = pathCommands(path.getAttribute('d'));
    const edgeIds = fillEdges.get(path.getAttribute('data-entity-id'));
    primitives.push({ kind: 'path', id: path.getAttribute('data-entity-id'), feature: path.getAttribute('data-feature'),
      layer: path.getAttribute('data-layer'), source: { sourceClass: 'PATTERN_DERIVED', sourceId: path.getAttribute('data-source-id'), revisionId }, commands,
      ...(edgeIds?.length === commands.filter((command) => command.op === 'move').length ? { sourceEdgeIds: edgeIds } : {}) });
  }
  const sourceCallouts = [...document.querySelectorAll('g[data-layer="CALLOUT"][data-callout-target]')].map((group) => {
    const id = group.getAttribute('data-entity-id');
    const label = document.querySelector(`text[data-label-for="${id}"]`);
    const anchor = group.querySelector('circle');
    assert.ok(label && anchor, `Unkeyed source POM callout ${id} lacks its label or anchor marker`);
    const callout = { kind: 'callout', id, layer: 'CALLOUT', feature: 'pom',
      source: { sourceClass: group.getAttribute('data-source-class'), sourceId: group.getAttribute('data-source-id'),
        revisionId: group.getAttribute('data-revision-id') },
      text: label.textContent,
      anchor: { primitiveId: group.getAttribute('data-callout-target'),
        point: { x: Number(anchor.getAttribute('cx')), y: Number(anchor.getAttribute('cy')) },
        ...(group.getAttribute('data-callout-source-entity') ? { sourceEntityId: group.getAttribute('data-callout-source-entity') } : {}) },
      labelAt: { x: Number(label.getAttribute('x')), y: Number(label.getAttribute('y')) } };
    primitives.push(callout);
    return { id, sourceId: callout.source.sourceId, text: callout.text, target: callout.anchor.primitiveId,
      sourceEntityId: callout.anchor.sourceEntityId, anchor: callout.anchor.point, labelAt: callout.labelAt };
  });
  for (const label of document.querySelectorAll('text[data-label-for]')) {
    if (label.getAttribute('data-label-for').startsWith('flat:polo:FRONT_FLAT:callout:')) continue;
    primitives.push({ kind: 'text', id: `${label.getAttribute('data-label-for')}:label`, feature: label.getAttribute('data-feature'),
      layer: label.getAttribute('data-source-layer'), source: { sourceClass: label.getAttribute('data-source-class'),
        sourceId: label.getAttribute('data-source-id'), revisionId: label.getAttribute('data-revision-id') },
      at: { x: Number(label.getAttribute('x')), y: Number(label.getAttribute('y')) }, text: label.textContent });
  }
  const markGroups = [...document.querySelectorAll('g[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')];
  for (const group of markGroups) [...group.querySelectorAll('circle,path,line,rect')].forEach((shape, shapeIndex) => {
    const base = { id: shapeIndex === 0 ? group.getAttribute('data-entity-id') : `${group.getAttribute('data-entity-id')}:shape-${shapeIndex}`,
      feature: 'closure', layer: group.getAttribute('data-layer'),
      source: { sourceClass: 'PATTERN_DERIVED', sourceId: group.getAttribute('data-source-id'), revisionId } };
    if (shape.localName === 'circle') primitives.push({ ...base, kind: 'circle', center: { x: Number(shape.getAttribute('cx')), y: Number(shape.getAttribute('cy')) }, radius: Number(shape.getAttribute('r')) });
    else if (shape.localName === 'line') primitives.push({ ...base, kind: 'path', commands: [
      { op: 'move', point: { x: Number(shape.getAttribute('x1')), y: Number(shape.getAttribute('y1')) } },
      { op: 'line', point: { x: Number(shape.getAttribute('x2')), y: Number(shape.getAttribute('y2')) } }] });
    else if (shape.localName === 'path') primitives.push({ ...base, kind: 'path', commands: pathCommands(shape.getAttribute('d')) });
    else if (shape.localName === 'rect') {
      const x = Number(shape.getAttribute('x')); const y = Number(shape.getAttribute('y'));
      const width = Number(shape.getAttribute('width')); const height = Number(shape.getAttribute('height'));
      primitives.push({ ...base, kind: 'path', commands: [{ op: 'move', point: { x, y } }, { op: 'line', point: { x: x + width, y } },
        { op: 'line', point: { x: x + width, y: y + height } }, { op: 'line', point: { x, y: y + height } }, { op: 'close' }] });
    }
  });
  for (const path of document.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')) {
    if (path.closest('g[data-entity-id]')) continue;
    primitives.push({ kind: 'path', id: path.getAttribute('data-entity-id'), feature: 'closure', layer: path.getAttribute('data-layer'),
      source: { sourceClass: 'PATTERN_DERIVED', sourceId: path.getAttribute('data-source-id'), revisionId }, commands: pathCommands(path.getAttribute('d')) });
  }
  const markerGroups = new Map([...document.querySelectorAll('g[data-pom-key]')].map((group) => [group.getAttribute('data-pom-key'), group]));
  const scheduleRows = [...document.querySelectorAll('text[data-schedule-for]')];
  for (const row of scheduleRows) {
    const key = row.getAttribute('data-pom-key'); const marker = markerGroups.get(key); assert.ok(marker, `Missing marker ${key}`);
    const circle = marker.querySelector('circle'); assert.ok(circle, `Unsegmented source marker required in baseline for ${key}`);
    const sourceId = row.getAttribute('data-source-id'); const targetId = row.getAttribute('data-callout-target');
    const sourceEntityId = row.getAttribute('data-callout-source-entity') ?? undefined;
    const markerStyle = key === 'H' ? 'segmented-open-halo' : circle.getAttribute('fill') === 'none' ? 'open-halo' : 'filled';
    primitives.push({ kind: 'callout', id: row.getAttribute('data-schedule-for'), layer: 'ANNOTATION', feature: 'pom',
      source: { sourceClass: 'PATTERN_DERIVED', sourceId, revisionId },
      text: row.textContent.replace(new RegExp(`^${key}\\s+`, 'u'), ''),
      anchor: { primitiveId: targetId, point: { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) },
        ...(sourceEntityId ? { sourceEntityId } : {}) }, labelAt: { x: 0, y: 0 },
      presentation: { kind: 'keyed-marker-schedule', key, markerRadiusCm: Number(circle.getAttribute('r')), markerStyle } });
  }
  return { view: { schemaVersion: 1, viewId: document.getAttribute('data-view-id'), revisionId,
    recipeId: 'polo', kind: 'FRONT_FLAT', units: 'cm', primitives, notices: [] }, originals, sourceCallouts,
    sourceLabels: primitives.filter((primitive) => primitive.kind === 'text').map(({ id, source, text, at }) => ({ id, sourceId: source.sourceId, text, at })) };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const rows = []; const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
try {
  for (const option of priorMatrix.rows) {
    const sourceName = `${option.caseId}-collar-point.svg`;
    const input = await readFile(new URL(sourceName, inputDir), 'utf8');
    const { view, originals, sourceCallouts, sourceLabels } = sourceView(input);
    assert.equal(view.revisionId, option.revisionId);
    const result = renderTechnicalFlatSvg(view, { measureText });
    assert.ok(result.svg, `${option.caseId}: ${JSON.stringify(result.issues)}`);
    const doc = new JSDOM('').window.DOMParser;
    const outputRoot = new doc().parseFromString(result.svg, 'image/svg+xml').documentElement;
    const currentPaths = [...outputRoot.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')]
      .map((path) => `${path.getAttribute('data-entity-id')}|${path.getAttribute('data-source-id')}|${path.getAttribute('data-revision-id')}|${path.getAttribute('d')}`);
    assert.deepEqual(currentPaths, originals);
    const labels = [...outputRoot.querySelectorAll('text[data-label-for]')].map((label) => ({ id: label.getAttribute('data-label-for').replace(/:label$/u, ''),
      sourceId: label.getAttribute('data-source-id'), text: label.textContent,
      at: { x: Number(label.getAttribute('x')), y: Number(label.getAttribute('y')) } }));
    const sourceLabelEntries = labels.filter((label) => !label.id.startsWith('flat:polo:FRONT_FLAT:callout:'));
    assert.equal(sourceLabelEntries.length, sourceLabels.length);
    assert.deepEqual(sourceLabelEntries.map(({ id, sourceId, text }) => `${id}|${sourceId}|${text}`).sort(),
      sourceLabels.map(({ id, sourceId, text }) => `${id.replace(/:label$/u, '')}|${sourceId}|${text}`).sort());
    const schedule = [...outputRoot.querySelectorAll('text[data-schedule-for]')].map((row) => ({
      id: row.getAttribute('data-schedule-for'), key: row.getAttribute('data-pom-key'), sourceId: row.getAttribute('data-source-id'),
      target: row.getAttribute('data-callout-target'), sourceEntityId: row.getAttribute('data-callout-source-entity'), text: row.textContent }));
    assert.equal(schedule.length, 11);
    const outputCallouts = sourceCallouts.map((callout) => {
      const group = [...outputRoot.querySelectorAll('g[data-callout-target]')].find((candidate) => candidate.getAttribute('data-entity-id') === callout.id);
      assert.ok(group, `Missing re-emitted unkeyed POM ${callout.id}`);
      const anchor = group.querySelector('circle');
      assert.equal(group.getAttribute('data-callout-target'), callout.target);
      assert.equal(group.getAttribute('data-callout-source-entity'), callout.sourceEntityId);
      return { ...callout, outputAnchor: { x: Number(anchor.getAttribute('cx')), y: Number(anchor.getAttribute('cy')) },
        outputLabelAt: { x: Number(outputRoot.querySelector(`text[data-label-for="${callout.id}"]`)?.getAttribute('x')),
          y: Number(outputRoot.querySelector(`text[data-label-for="${callout.id}"]`)?.getAttribute('y')) } };
    });
    assert.equal(outputRoot.querySelectorAll('g[data-pom-key="H"] path[data-segmented-marker="S425"]').length, 1);
    const renderedPath = new URL(`${option.caseId}-source-labels-S426.svg`, outputDir);
    await writeFile(renderedPath, result.svg);
    await page.setContent(result.svg);
    const collisionAudit = await page.evaluate(() => {
      const box = (node) => { const b = node.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
      const intersects = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.002
        && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.002;
      const labels = [...document.querySelectorAll('text[data-label-for]')].map((node) => ({
        id: node.getAttribute('data-label-for').replace(/:label$/u, ''), sourceId: node.getAttribute('data-source-id'),
        text: node.textContent, box: box(node) }));
      const glyphs = [...document.querySelectorAll('g[data-pom-key] text')].map((node) => ({
        key: node.closest('g[data-pom-key]').getAttribute('data-pom-key'), text: node.textContent, box: box(node) }));
      const pairs = (entries, kind) => entries.flatMap((left, index) => entries.slice(index + 1).flatMap((right) =>
        intersects(left.box, right.box) ? [{ kind, left: { id: left.id ?? left.key, text: left.text }, right: { id: right.id ?? right.key, text: right.text } }] : []));
      const markerLabelOverlaps = glyphs.flatMap((glyph) => labels.filter((label) => intersects(glyph.box, label.box))
        .map((label) => ({ key: glyph.key, glyph: glyph.text, labelId: label.id, labelSourceId: label.sourceId, label: label.text })));
      return { labelCount: labels.length, keyGlyphCount: glyphs.length, sourceLabelPairs: pairs(labels, 'source-label'),
        markerLabelOverlaps, scheduleRows: document.querySelectorAll('text[data-schedule-for]').length };
    });
    const png = await page.screenshot({ fullPage: true });
    await writeFile(new URL(`${option.caseId}-source-labels-full.png`, outputDir), png);
    const originalLabelById = new Map(sourceLabels.map((label) => [label.id.replace(/:label$/u, ''), label]));
    const labelPositionDeltas = sourceLabelEntries.map((label) => { const original = originalLabelById.get(label.id);
      return { id: label.id, dx: label.at.x - original.at.x, dy: label.at.y - original.at.y,
        distance: Math.hypot(label.at.x - original.at.x, label.at.y - original.at.y) }; });
    rows.push({ caseId: option.caseId, revisionId: view.revisionId, options: option.options,
      rendererIssues: result.issues, sourceLabelCount: sourceLabels.length, sourceLabels,
      sourceCalloutCount: sourceCallouts.length, sourceCallouts,
      labelsPreserved: sourceLabelEntries.length === sourceLabels.length, labelPositionDeltas,
      unkeyedCalloutsPreserved: outputCallouts.every((callout) => callout.outputAnchor.x === callout.anchor.x
        && callout.outputAnchor.y === callout.anchor.y && callout.target && callout.sourceEntityId), outputCallouts,
      sourceLabelsMoved: labelPositionDeltas.filter((delta) => delta.distance > 1e-6).length,
      maxSourceLabelDisplacementCm: Math.max(...labelPositionDeltas.map((delta) => delta.distance)),
      sourcePathsPreserved: currentPaths.length === originals.length,
      collisionAudit,
      markerGroups: [...outputRoot.querySelectorAll('g[data-pom-key]')].map((marker) => ({ key: marker.getAttribute('data-pom-key'),
        sources: marker.getAttribute('data-source-id'), targets: marker.getAttribute('data-callout-targets') ?? marker.getAttribute('data-callout-target'),
        sourceEntities: marker.getAttribute('data-callout-source-entities') ?? marker.getAttribute('data-callout-source-entity'),
        arcs: marker.getAttribute('data-marker-arc-count'), coverage: marker.getAttribute('data-marker-retained-coverage') })),
      scheduleRows: schedule.length, schedule, output: `${option.caseId}-source-labels-S426.svg`, screenshot: `${option.caseId}-source-labels-full.png` });
  }
} finally { await browser.close(); }
assert.deepEqual(browserErrors, []);
const matrix = { options: rows.length, facesStillHeld: 34, browserErrors, preservedSourceLabelRows: rows[0]?.sourceLabelCount,
  totalSourceLabelInstances: rows.reduce((sum, row) => sum + row.sourceLabelCount, 0),
  totalSourceLabelsMoved: rows.reduce((sum, row) => sum + row.sourceLabelsMoved, 0),
  maxSourceLabelDisplacementCm: Math.max(...rows.map((row) => row.maxSourceLabelDisplacementCm)),
  unkeyedPOMCalloutInstances: rows.reduce((sum, row) => sum + row.sourceCalloutCount, 0),
  sourceLabelPairOverlaps: rows.reduce((sum, row) => sum + row.collisionAudit.sourceLabelPairs.length, 0),
  markerSourceLabelOverlaps: rows.reduce((sum, row) => sum + row.collisionAudit.markerLabelOverlaps.length, 0),
  allRenderedWithLabelsAndS425H: rows.every((row) => row.rendererIssues.length === 0 && row.labelsPreserved && row.unkeyedCalloutsPreserved && row.sourcePathsPreserved
    && row.scheduleRows === 11 && row.sourceCalloutCount === (row.caseId === 'polo-sideVentDepth-min' ? 2 : 3)
    && row.markerGroups.some((marker) => marker.key === 'H' && marker.arcs)), rows };
assert.equal(matrix.options, 17);
if (!matrix.allRenderedWithLabelsAndS425H) throw new Error(JSON.stringify(rows.filter((row) => !row.unkeyedCalloutsPreserved
  || row.rendererIssues.length || !row.labelsPreserved || !row.sourcePathsPreserved || row.scheduleRows !== 11
  || row.sourceCalloutCount !== (row.caseId === 'polo-sideVentDepth-min' ? 2 : 3)).map(({ caseId, rendererIssues, sourceCalloutCount, unkeyedCalloutsPreserved, outputCallouts }) =>
  ({ caseId, rendererIssues, sourceCalloutCount, unkeyedCalloutsPreserved, outputCallouts })), null, 2));
await writeFile(new URL('./S426-source-label-output-matrix.json', import.meta.url), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ options: matrix.options, sourceLabelCountPerOption: matrix.preservedSourceLabelRows,
  totalSourceLabelInstances: matrix.totalSourceLabelInstances, sourceLabelPairOverlaps: matrix.sourceLabelPairOverlaps,
  markerSourceLabelOverlaps: matrix.markerSourceLabelOverlaps, moved: matrix.totalSourceLabelsMoved,
  maxDisplacement: matrix.maxSourceLabelDisplacementCm, errors: browserErrors.length }));
