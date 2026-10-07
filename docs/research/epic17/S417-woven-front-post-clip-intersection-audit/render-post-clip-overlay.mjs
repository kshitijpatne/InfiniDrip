import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const folder = new URL('./', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'));
const picks = ['woven-shirt-default', 'woven-shirt-neckEase-max'];
const browserErrors = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const caseId of picks) {
    const face = matrix.cases.find((row) => row.caseId === caseId)?.faces.find((item) => item.kind === 'FRONT_FLAT');
    assert.ok(face?.svg, `${caseId}: missing production SVG`);
    assert.match(face.svg, /data-revision-id="live-draft:woven-shirt:14:14"/);
    const overlay = `<g id="S417-audit-overlay" fill="none" stroke-width="0.055">
      <g stroke="#c52222"><circle cx="-0.842435" cy="8.172695" r="0.18"/><circle cx="0.842435" cy="8.172695" r="0.18"/></g>
      <g stroke="#a16207"><circle cx="-0.833333" cy="8.2" r="0.12"/><circle cx="0.833333" cy="8.2" r="0.12"/><circle cx="-5" cy="9.841155" r="0.12"/><circle cx="5" cy="9.841155" r="0.12"/></g>
      <g stroke="#2563eb"><circle cx="-12.715633" cy="0.50319" r="0.15"/><circle cx="12.715633" cy="0.50319" r="0.15"/></g>
      <g fill="#c52222" stroke="none" font-family="Arial,sans-serif" font-size="0.28"><text x="-1.2" y="7.8">NECKLINE × COLLAR (held)</text></g>
      <g fill="#a16207" stroke="none" font-family="Arial,sans-serif" font-size="0.28"><text x="2" y="10.6">approved collar / placket order</text></g>
      <g fill="#2563eb" stroke="none" font-family="Arial,sans-serif" font-size="0.28"><text x="-11" y="0.2">shoulder clip boundary</text></g>
    </g>`;
    const svg = face.svg.replace('</svg>', `${overlay}</svg>`).replace(/width="[^"]+" height="[^"]+" viewBox="[^"]+"/, 'width="2240" height="960" viewBox="-14 -1 28 12"');
    assert.ok(svg.includes('S417-audit-overlay'));
    const outSvg = new URL(`${caseId}-post-clip-overlay.svg`, folder);
    await writeFile(outSvg, svg);
    const page = await browser.newPage({ viewport: { width: 2240, height: 960 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.setContent(svg, { waitUntil: 'load' });
    await page.screenshot({ path: fileURLToPath(new URL(`${caseId}-post-clip-overlay.png`, folder)), fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
assert.deepEqual(browserErrors, []);
console.log(JSON.stringify({ rendered: picks, revision: 'live-draft:woven-shirt:14:14', browserErrors: browserErrors.length }));





