import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const folder = fileURLToPath(new URL('./', import.meta.url));
const replayDir = join(folder, 'current-production-replay');
const input = JSON.parse(await readFile(new URL('../S363-woven-pom-leader-readability/production-replay/matrix.json', import.meta.url), 'utf8'));
const cases = input.cases.filter((item) => item.caseId.startsWith('woven-shirt-'));
assert.equal(cases.length, 28);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(process.env.G04_PREVIEW_URL ?? 'http://127.0.0.1:4193/', { waitUntil: 'networkidle' });
const output = await page.evaluate(async ({ testCases }) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import('/src/drafting/recipe.ts'), import('/src/drafting/measurements.ts'), import('/src/drafting/options.ts'),
    import('/src/render/technical-flat-live.ts'), import('/src/render/technical-flat-svg.ts'),
  ]);
  const recipe = GARMENTS.find((item) => item.name === 'woven-shirt');
  if (!recipe) throw new Error('Woven recipe missing');
  const measureText = createBrowserTechnicalFlatTextMeasurer(document);
  return testCases.map((testCase) => {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId: 'live-draft:woven-shirt:14:14',
      kind: 'FRONT_FLAT', placements: [], colorHex: '#3669a4', texture: 'woven', shine: 24 });
    if (!live.view) return { caseId: testCase.caseId, options, compileIssues: live.issues, rendererIssues: [], svg: null };
    const rendered = renderTechnicalFlatSvg(live.view, { measureText, colorway: live.colorway,
      title: `Woven S454 FRONT_FLAT — ${testCase.caseId}` });
    if (!rendered.svg) return { caseId: testCase.caseId, options, compileIssues: live.issues, rendererIssues: rendered.issues, svg: null };
    const root = new DOMParser().parseFromString(rendered.svg, 'image/svg+xml').documentElement;
    return { caseId: testCase.caseId, options, compileIssues: live.issues, rendererIssues: rendered.issues,
      revisionId: root.getAttribute('data-revision-id'), svg: new XMLSerializer().serializeToString(root) };
  });
}, { testCases: cases });

await mkdir(replayDir, { recursive: true });
const screenshotDir = join(replayDir, 'rendered');
await mkdir(screenshotDir, { recursive: true });
for (const row of output) {
  assert.equal(row.revisionId, 'live-draft:woven-shirt:14:14', `${row.caseId}: revision mismatch`);
  assert.equal(row.compileIssues.length, 0, `${row.caseId}: compile issue`);
  assert.equal(row.rendererIssues.length, 0, `${row.caseId}: renderer issue`);
  assert.ok(row.svg, `${row.caseId}: no SVG`);
  await writeFile(join(replayDir, `${row.caseId}-front.svg`), row.svg);
  await page.setContent(row.svg, { waitUntil: 'load' });
  await page.locator('svg').evaluate((root) => {
    root.setAttribute('viewBox', '-14 -1 28 16');
    root.setAttribute('width', '1500px');
    root.setAttribute('height', '900px');
  });
  await page.screenshot({ path: join(screenshotDir, `${row.caseId}-collar-detail.png`) });
}
await browser.close();
assert.equal(errors.length, 0, `Browser errors: ${errors.join('; ')}`);
const matrix = { sourceRevision: 'live-draft:woven-shirt:14:14', rendererCommit: process.env.GIT_COMMIT ?? 'record in exit packet',
  configurationCount: output.length, browserErrors: errors.length, compileIssues: 0, rendererIssues: 0, rows: output };
await writeFile(join(replayDir, 'matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ sourceRevision: matrix.sourceRevision, configurations: output.length,
  browserErrors: errors.length, compileIssues: matrix.compileIssues, rendererIssues: matrix.rendererIssues,
  renderedFronts: output.length }, null, 2));
