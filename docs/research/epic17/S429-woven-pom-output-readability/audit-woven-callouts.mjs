import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const revision = 'live-draft:woven-shirt:14:14';
const input = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'));
const draftingSource = await readFile(new URL('../../../../src/drafting/shirt.ts', import.meta.url), 'utf8');
const pomSource = draftingSource.split('export const WOVEN_SHIRT_POMS: readonly Pom[] = [')[1]?.split('\n];')[0] ?? '';
const sourcePomLabels = [...pomSource.matchAll(/label: "([^"]+)"/gu)].map(([, label]) => label);
const expectedSourcePomLabels = [
  'Body chest (finished)', 'Body length (HPS–hem)', 'Neck circumference (pattern)', 'Back yoke depth',
  'Finished placket width', 'Front button spacing', 'Patch pocket width', 'Patch pocket height',
  'Finished sleeve band depth', 'Side vent depth',
];
if (JSON.stringify(sourcePomLabels) !== JSON.stringify(expectedSourcePomLabels)) {
  throw new Error(`Woven source POM inventory changed: ${JSON.stringify(sourcePomLabels)}`);
}
const renderedDir = new URL('./rendered/', import.meta.url);
await mkdir(renderedDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
const rows = [];
const failures = [];
const expectedCallouts = {
  FRONT_FLAT: [
    'pom:woven-shirt:body-chest-finished',
    'pom:woven-shirt:finished-placket-width',
    'pom:woven-shirt:front-button-spacing',
    'pom:woven-shirt:patch-pocket-width',
    'pom:woven-shirt:patch-pocket-height',
    'pom:woven-shirt:finished-sleeve-band-depth',
    'pom:woven-shirt:side-vent-depth',
  ].sort(),
  BACK_FLAT: ['pom:woven-shirt:back-yoke-depth'],
};
const expectedAnchorBindings = {
  'pom:woven-shirt:body-chest-finished': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:component:front:outline',
    source: 'pattern:woven-shirt:role:front:edge:sideUpper',
  },
  'pom:woven-shirt:finished-placket-width': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline',
    source: 'pattern:woven-shirt:role:buttonPlacket:edge:top',
  },
  'pom:woven-shirt:front-button-spacing': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1',
    source: 'pattern:woven-shirt:mark:buttonPlacket:button-1',
    markerSources: 'pattern:woven-shirt:mark:buttonPlacket:button-1|pattern:woven-shirt:mark:buttonPlacket:button-2',
  },
  'pom:woven-shirt:patch-pocket-width': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:component:pocket:outline',
    source: 'pattern:woven-shirt:role:pocket:edge:top',
  },
  'pom:woven-shirt:patch-pocket-height': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:component:pocket:outline',
    source: 'pattern:woven-shirt:role:pocket:edge:sideRight',
  },
  'pom:woven-shirt:finished-sleeve-band-depth': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:component:sleeveBand:outline',
    source: 'pattern:woven-shirt:role:sleeveBand:edge:sideRight',
  },
  'pom:woven-shirt:side-vent-depth': {
    kind: 'FRONT_FLAT', target: 'flat:woven-shirt:FRONT_FLAT:component:front:outline',
    source: 'pattern:woven-shirt:role:front:edge:vent',
  },
  'pom:woven-shirt:back-yoke-depth': {
    kind: 'BACK_FLAT', target: 'flat:woven-shirt:BACK_FLAT:component:back:outline',
    source: 'pattern:woven-shirt:role:back:edge:yokeSeam',
  },
};
const expectedTableOnlyNotices = {
  FRONT_FLAT: [
    'pom:woven-shirt:body-length-hps-hem',
    'pom:woven-shirt:neck-circumference-pattern',
    'pom:woven-shirt:back-yoke-depth',
  ].sort(),
  BACK_FLAT: [
    'pom:woven-shirt:body-chest-finished',
    'pom:woven-shirt:body-length-hps-hem',
    'pom:woven-shirt:neck-circumference-pattern',
    'pom:woven-shirt:finished-placket-width',
    'pom:woven-shirt:front-button-spacing',
    'pom:woven-shirt:patch-pocket-width',
    'pom:woven-shirt:patch-pocket-height',
    'pom:woven-shirt:finished-sleeve-band-depth',
    'pom:woven-shirt:side-vent-depth',
  ].sort(),
};
const normalized = (values) => [...values].sort();
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'u'))?.[1] ?? null;
try {
  for (const configuration of input.cases) {
    for (const face of configuration.faces) {
      if (face.revisionId !== revision || !face.svg.includes(`data-revision-id="${revision}"`)) failures.push(`${configuration.caseId}/${face.kind}: revision mismatch`);
      if (face.compileIssues.length || face.rendererIssues.length) failures.push(`${configuration.caseId}/${face.kind}: compile/renderer issues`);
      const expectedKeys = face.kind === 'FRONT_FLAT' ? ['D', 'W'] : [];
      const keyedPomScheduleRows = face.pomRows.map(({ key, id, source, target, sourceEntity, text }) => ({ key, id, source, target, sourceEntity, text }));
      if (JSON.stringify(keyedPomScheduleRows.map(({ key }) => key).sort()) !== JSON.stringify(expectedKeys.sort())) failures.push(`${configuration.caseId}/${face.kind}: expected keyed POM list differs`);
      const sourceScheduleCount = [...face.svg.matchAll(/data-schedule-for=/gu)].length;
      if (face.kind === 'FRONT_FLAT' && sourceScheduleCount !== 2) failures.push(`${configuration.caseId}/${face.kind}: expected 2 full keyed schedule rows, got ${sourceScheduleCount}`);
      if (face.kind === 'BACK_FLAT' && sourceScheduleCount !== 0) failures.push(`${configuration.caseId}/${face.kind}: unexpected face schedule rows ${sourceScheduleCount}`);
      const emittedPomLabels = [...face.svg.matchAll(/<text\b[^>]*data-source-id="(pom:woven-shirt:[^"]+)"[^>]*>([^<]*)<\/text>/gu)]
        .map(([, sourceId, text]) => ({ sourceId, text: text.trim() })).sort((a, b) => a.sourceId.localeCompare(b.sourceId));
      const emittedPomIds = normalized(emittedPomLabels.map(({ sourceId }) => sourceId));
      const expectedIds = normalized(expectedCallouts[face.kind].filter((sourceId) =>
        !(face.kind === 'FRONT_FLAT' && sourceId === 'pom:woven-shirt:side-vent-depth' && configuration.options.sideVentDepth === 0)));
      if (JSON.stringify(emittedPomIds) !== JSON.stringify(expectedIds)) {
        failures.push(`${configuration.caseId}/${face.kind}: emitted POM callout identities differ: ${JSON.stringify(emittedPomIds)}`);
      }
      const tableOnlyNotices = [...face.svg.matchAll(/<text\b[^>]*data-notice-source="(pom:woven-shirt:[^"]+)"[^>]*>([^<]*)<\/text>/gu)]
        .map(([, sourceId, text]) => ({ sourceId, text: text.trim() })).sort((a, b) => a.sourceId.localeCompare(b.sourceId));
      const tableOnlyIds = normalized(tableOnlyNotices.map(({ sourceId }) => sourceId));
      const expectedNotices = normalized([
        ...expectedTableOnlyNotices[face.kind],
        ...(face.kind === 'FRONT_FLAT' && configuration.options.sideVentDepth === 0 ? ['pom:woven-shirt:side-vent-depth'] : []),
      ]);
      if (JSON.stringify(tableOnlyIds) !== JSON.stringify(expectedNotices)) {
        failures.push(`${configuration.caseId}/${face.kind}: POM not-represented inventory differs: ${JSON.stringify(tableOnlyIds)}`);
      }
      if (tableOnlyNotices.some(({ text }) => !/table-only|no back anchor is inferred/u.test(text))) {
        failures.push(`${configuration.caseId}/${face.kind}: a not-represented POM lacks an explicit no-inference/table-only notice`);
      }
      const boundCallouts = (face.svg.match(/<g\b[^>]*>/gu) ?? [])
        .filter((tag) => tag.includes('data-feature="pom"') && tag.includes('data-entity-id="flat:')
          && (tag.includes('data-layer="CALLOUT"') || tag.includes('data-layer="ANNOTATION"')))
        .map((tag) => ({
          id: attribute(tag, 'data-entity-id'), sourceId: attribute(tag, 'data-source-id'),
          revisionId: attribute(tag, 'data-revision-id'), target: attribute(tag, 'data-callout-target'),
          source: attribute(tag, 'data-callout-source-entity'), markerSources: attribute(tag, 'data-marker-source-entities'),
        })).filter(({ id }) => id && !id.endsWith(':key-marker-ring'));
      const expectedBoundCallouts = Object.entries(expectedAnchorBindings)
        .filter(([, binding]) => binding.kind === face.kind
          && !(face.kind === 'FRONT_FLAT' && configuration.options.sideVentDepth === 0
            && binding.source === 'pattern:woven-shirt:role:front:edge:vent'))
        .map(([sourceId, binding]) => ({ ...binding, sourceId }));
      if (boundCallouts.length !== expectedBoundCallouts.length) {
        failures.push(`${configuration.caseId}/${face.kind}: expected ${expectedBoundCallouts.length} bound POM groups, got ${boundCallouts.length}`);
      }
      for (const expected of expectedBoundCallouts) {
        const actual = boundCallouts.find(({ sourceId }) => sourceId === expected.sourceId);
        if (!actual || actual.revisionId !== revision || actual.target !== expected.target || actual.source !== expected.source
          || (expected.markerSources && actual.markerSources !== expected.markerSources)) {
          failures.push(`${configuration.caseId}/${face.kind}: exact POM binding differs for ${expected.sourceId}: ${JSON.stringify(actual ?? null)}`);
        }
      }

      await page.setContent(`<style>body{margin:0;background:white}svg{display:block;width:1440px;height:auto}</style>${face.svg}`);
      const measurement = await page.evaluate(() => {
        const rect = (node) => {
          const b = node.getBoundingClientRect();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        };
        const overlaps = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.5
          && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.5;
        const texts = [...document.querySelectorAll('svg text')].map((node, index) => {
          const text = node.textContent?.trim() ?? '';
          const key = node.getAttribute('data-pom-key') ?? node.closest('[data-pom-key]')?.getAttribute('data-pom-key')
            ?? (['D', 'W'].includes(text) ? text : null);
          return { index, text, id: node.getAttribute('data-entity-id') ?? node.getAttribute('data-schedule-for') ?? `text-${index}`,
            key, schedule: node.hasAttribute('data-schedule-for'), rect: rect(node) };
        });
        const textOverlaps = [];
        for (let i = 0; i < texts.length; i += 1) for (let j = i + 1; j < texts.length; j += 1) {
          if (overlaps(texts[i].rect, texts[j].rect)) textOverlaps.push({ a: texts[i].id, aText: texts[i].text, b: texts[j].id, bText: texts[j].text });
        }
        const rings = [...document.querySelectorAll('svg g[data-marker-underlay-for]')].map((node) => ({
          key: node.getAttribute('data-marker-underlay-for'), rect: rect(node),
        }));
        const ringTextOverlaps = [];
        for (const ring of rings) for (const text of texts) if (ring.key !== text.key && overlaps(ring.rect, text.rect)) {
          ringTextOverlaps.push({ key: ring.key, text: text.id, label: text.text });
        }
        const scheduleTexts = [...document.querySelectorAll('svg g[data-layer-group="POM_SCHEDULE"] text')]
          .map((node) => node.textContent?.trim() ?? '');
        return { texts, textOverlaps, rings, ringTextOverlaps, scheduleTexts,
          markerKeys: [...new Set([...document.querySelectorAll('svg [data-pom-key]')].map((node) => node.getAttribute('data-pom-key')))].sort(),
          svgWidth: document.querySelector('svg')?.getBoundingClientRect().width ?? 0,
          svgHeight: document.querySelector('svg')?.getBoundingClientRect().height ?? 0 };
      });
      const row = { caseId: configuration.caseId, kind: face.kind, revisionId: face.revisionId,
        options: configuration.options, keyedPomScheduleRows, sourceScheduleCount,
        emittedPomLabels, tableOnlyNotices, boundCallouts,
        textCount: measurement.texts.length, textOverlaps: measurement.textOverlaps,
        markerKeys: measurement.markerKeys, markerRingTextOverlaps: measurement.ringTextOverlaps,
        scheduleTexts: measurement.scheduleTexts, compileIssues: face.compileIssues.length, rendererIssues: face.rendererIssues.length,
        browserErrors: browserErrors.length, svgWidth: measurement.svgWidth, svgHeight: measurement.svgHeight };
      rows.push(row);
      if (measurement.textOverlaps.length) failures.push(`${configuration.caseId}/${face.kind}: ${measurement.textOverlaps.length} text overlap(s)`);
      if (measurement.ringTextOverlaps.length) failures.push(`${configuration.caseId}/${face.kind}: ${measurement.ringTextOverlaps.length} keyed-ring/text overlap(s)`);
    }
  }
  const worst = [...rows].sort((a, b) => b.textOverlaps.length + b.markerRingTextOverlaps.length - a.textOverlaps.length - a.markerRingTextOverlaps.length
    || b.textCount - a.textCount)[0];
  const captures = [{ caseId: 'woven-shirt-default', kind: 'FRONT_FLAT' }, { caseId: 'woven-shirt-default', kind: 'BACK_FLAT' }];
  if (worst && !captures.some((capture) => capture.caseId === worst.caseId && capture.kind === worst.kind)) captures.push({ caseId: worst.caseId, kind: worst.kind });
  for (const capture of captures) {
    const item = input.cases.find(({ caseId }) => caseId === capture.caseId);
    const face = item.faces.find(({ kind }) => kind === capture.kind);
    await page.setContent(`<style>body{margin:0;background:white}svg{display:block;width:1440px;height:auto}</style>${face.svg}`);
    const name = `${capture.caseId}-${capture.kind.toLowerCase()}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(name, renderedDir)), fullPage: true });
    capture.path = `rendered/${name}`;
  }
  const defaultFront = input.cases.find(({ caseId }) => caseId === 'woven-shirt-default').faces.find(({ kind }) => kind === 'FRONT_FLAT');
  await page.setContent(`<style>body{margin:0;background:white}svg{display:block;width:1440px;height:auto}</style>${defaultFront.svg}`);
  const detailCrops = [];
  for (const key of ['D', 'W']) {
    const ring = await page.locator(`svg g[data-marker-underlay-for="${key}"]`).boundingBox();
    if (!ring) throw new Error(`Missing visible ${key} ring in default Woven front`);
    const margin = 110;
    const clip = { x: Math.max(0, ring.x - margin), y: Math.max(0, ring.y - margin),
      width: Math.min(1440, ring.x + ring.width + margin) - Math.max(0, ring.x - margin),
      height: Math.min(1200, ring.y + ring.height + margin) - Math.max(0, ring.y - margin) };
    const name = `woven-shirt-default-marker-${key.toLowerCase()}-detail.png`;
    await page.screenshot({ path: fileURLToPath(new URL(name, renderedDir)), clip });
    detailCrops.push({ key, path: `rendered/${name}` });
  }
  const schedule = await page.locator('svg g[data-layer-group="POM_SCHEDULE"]').boundingBox();
  if (!schedule) throw new Error('Missing full Woven POM schedule');
  const scheduleClip = { x: Math.max(0, schedule.x - 18), y: Math.max(0, schedule.y - 18),
    width: Math.min(1440, schedule.x + schedule.width + 18) - Math.max(0, schedule.x - 18),
    height: Math.min(1200, schedule.y + schedule.height + 18) - Math.max(0, schedule.y - 18) };
  const scheduleName = 'woven-shirt-default-pom-schedule.png';
  await page.screenshot({ path: fileURLToPath(new URL(scheduleName, renderedDir)), clip: scheduleClip });
  detailCrops.push({ key: 'POM schedule', path: `rendered/${scheduleName}` });
  const result = { sourceRevision: input.summary.sourceRevision, configurationCount: input.cases.length,
    faceCount: rows.length, frontCount: rows.filter(({ kind }) => kind === 'FRONT_FLAT').length,
    backCount: rows.filter(({ kind }) => kind === 'BACK_FLAT').length,
    sourcePomDefinitions: sourcePomLabels,
    keyedPomScheduleInstances: rows.reduce((sum, row) => sum + row.keyedPomScheduleRows.length, 0),
    keyedScheduleRows: rows.reduce((sum, row) => sum + row.sourceScheduleCount, 0),
    emittedPomCalloutInstances: rows.reduce((sum, row) => sum + row.emittedPomLabels.length, 0),
    exactBoundCalloutInstances: rows.reduce((sum, row) => sum + row.boundCallouts.length, 0),
    tableOnlyNoticeInstances: rows.reduce((sum, row) => sum + row.tableOnlyNotices.length, 0),
    emittedPomIdsByFace: Object.fromEntries(['FRONT_FLAT', 'BACK_FLAT'].map((kind) => [kind,
      [...new Set(rows.filter((row) => row.kind === kind).flatMap((row) => row.emittedPomLabels.map(({ sourceId }) => sourceId)))].sort()])),
    tableOnlyPomIdsByFace: Object.fromEntries(['FRONT_FLAT', 'BACK_FLAT'].map((kind) => [kind,
      [...new Set(rows.filter((row) => row.kind === kind).flatMap((row) => row.tableOnlyNotices.map(({ sourceId }) => sourceId)))].sort()])),
    pomScheduleTextsPerFront: [...new Set(rows.filter(({ kind }) => kind === 'FRONT_FLAT').map(({ scheduleTexts }) => scheduleTexts.length))],
    samplePomScheduleTexts: rows.find(({ caseId, kind }) => caseId === 'woven-shirt-default' && kind === 'FRONT_FLAT')?.scheduleTexts ?? [],
    textCount: rows.reduce((sum, row) => sum + row.textCount, 0),
    textOverlapCount: rows.reduce((sum, row) => sum + row.textOverlaps.length, 0),
    keyedRingTextOverlapCount: rows.reduce((sum, row) => sum + row.markerRingTextOverlaps.length, 0),
    compileIssues: rows.reduce((sum, row) => sum + row.compileIssues, 0),
    rendererIssues: rows.reduce((sum, row) => sum + row.rendererIssues, 0), browserErrors: browserErrors.length,
    allRowsHeld: input.summary.all56WovenViewsHeldPendingIntegratedGate,
    captures, detailCrops, failures, rows };
  if (result.sourceRevision !== revision || result.configurationCount !== 28 || result.faceCount !== 56
    || result.frontCount !== 28 || result.backCount !== 28 || result.keyedPomScheduleInstances !== 56
    || result.keyedScheduleRows !== 56 || result.textOverlapCount || result.keyedRingTextOverlapCount
    || result.compileIssues || result.rendererIssues
    || result.browserErrors || !result.allRowsHeld || failures.length) throw new Error(JSON.stringify(result, null, 2));
  await writeFile(new URL('./S429-woven-callout-readability-matrix.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ ...result, rows: `${rows.length} rows saved` }, null, 2));
} finally {
  await browser.close();
}
