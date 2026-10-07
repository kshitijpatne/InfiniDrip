import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const matrix = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'));
const selected = ['woven-shirt-default', 'woven-shirt-collarLeafDepth-min', 'woven-shirt-collarLeafDepth-max', 'woven-shirt-combined-supported'];
const cases = matrix.cases.filter(row => selected.includes(row.caseId));
assert.equal(cases.length, selected.length);
const tapers = [0, 3, 6];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://127.0.0.1:4191/', { waitUntil: 'networkidle' });
const outputs = await page.evaluate(async ({ cases, tapers }) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import('/src/drafting/recipe.ts'), import('/src/drafting/measurements.ts'), import('/src/drafting/options.ts'),
    import('/src/render/technical-flat-live.ts'), import('/src/render/technical-flat-svg.ts'),
  ]);
  const recipe = GARMENTS.find(item => item.name === 'woven-shirt');
  const measureText = createBrowserTechnicalFlatTextMeasurer(document);
  const result = [];
  for (const taper of tapers) for (const row of cases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...row.options };
    const block = recipe.draft(STANDARD_M, options), sleeve = block.roles.sleeve, band = block.roles.sleeveBand;
    const width = sleeve.edges.find(e => e.name === 'capRight').curve.end.x;
    const rightHem = sleeve.edges.find(e => e.name === 'sideRight').end, leftHem = sleeve.edges.find(e => e.name === 'sideLeft').start;
    const hem = sleeve.edges.find(e => e.name === 'hem');
    Object.assign(rightHem, { x: width - taper }); Object.assign(leftHem, { x: taper });
    Object.assign(hem.start, { x: width - taper }); Object.assign(hem.end, { x: taper });
    const opening = width - 2 * taper, top = band.edges.find(e => e.name === 'top'), side = band.edges.find(e => e.name === 'sideRight'), bottom = band.edges.find(e => e.name === 'bottom'), fold = band.marks.find(m => m.name === 'bandFold');
    Object.assign(top.start, { x: 0, y: 0 }); Object.assign(top.end, { x: opening, y: 0 });
    Object.assign(side.start, { x: opening, y: 0 }); Object.assign(side.end, { x: opening });
    Object.assign(bottom.start, { x: opening }); Object.assign(bottom.end, { x: 0 });
    Object.assign(fold.start, { x: 0 }); Object.assign(fold.end, { x: opening });
    const faces = ['FRONT_FLAT', 'BACK_FLAT'].map(kind => {
      const live = compileTechnicalFlatLiveView({ recipe, block, revisionId: 'live-draft:woven-shirt:14:14', kind, placements: [], colorHex: '#3669a4', texture: 'woven', shine: 24 });
      if (!live.view) return { kind, issues: live.issues, svg: null };
      const rendered = renderTechnicalFlatSvg(live.view, { measureText, colorway: live.colorway, title: `S447 diagnostic taper ${taper} cm — ${row.caseId} ${kind}` });
      return { kind, issues: [...live.issues, ...rendered.issues], svg: rendered.svg };
    });
    result.push({ caseId: row.caseId, taper, opening, faces });
  }
  return result;
}, { cases, tapers });
await browser.close();

const outDir = fileURLToPath(new URL('./candidate-rendered/', import.meta.url));
const pngDir = join(outDir, 'png');
await mkdir(pngDir, { recursive: true });
const shotBrowser = await chromium.launch({ headless: true });
const shot = await shotBrowser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
for (const row of outputs) for (const face of row.faces) {
  assert.ok(face.svg, `${row.caseId} ${row.taper} ${face.kind} failed to emit`);
  assert.deepEqual(face.issues, [], `${row.caseId} ${row.taper} ${face.kind} has compiler/render issues`);
  const base = `${row.caseId}-taper-${row.taper}-${face.kind.toLowerCase()}`;
  await writeFile(join(outDir, `${base}.svg`), face.svg);
  await shot.setContent(face.svg, { waitUntil: 'load' });
  await shot.screenshot({ path: join(pngDir, `${base}.png`), fullPage: true });
}
await shotBrowser.close();
await writeFile(join(outDir, 'rendered-sample-index.json'), JSON.stringify({ sourceRevision: 'live-draft:woven-shirt:14:14', cases: outputs.map(row => ({ caseId: row.caseId, taper: row.taper, opening: row.opening, faces: row.faces.map(face => ({ kind: face.kind, issueCount: face.issues.length })) })), browserErrors: errors }, null, 2) + '\n');
console.log(JSON.stringify({ samples: outputs.length * 2, browserErrors: errors, openingCm: Object.fromEntries(outputs.filter(row => row.caseId === 'woven-shirt-default').map(row => [row.taper, row.opening])) }, null, 2));
assert.equal(errors.length, 0);
