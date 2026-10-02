import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
const dir = 'docs/research/epic17/S366-woven-back-exterior-normal-proposal/outward-normal-candidate';
const cases = ['woven-shirt-default','woven-shirt-yokeDepth-min','woven-shirt-yokeDepth-max','woven-shirt-sleeveBandDepth-max','woven-shirt-combined-supported'];
const browser = await chromium.launch({headless:true});
try {
 for (const id of cases) {
  const source = await readFile(join(dir, `${id}-outward-normal-candidate.svg`),'utf8');
  let svg = source.replace(/viewBox="[^"]+"/, 'viewBox="-59 -2 118 29" preserveAspectRatio="xMidYMid meet"');
  svg = svg.replace(/width="[^"]+" height="[^"]+"/, 'width="118cm" height="29cm"');
  svg = svg.replace(/style="[^"]+"/, 'style="width:1800px;height:442px;max-width:none;display:block"');
  const out = join(dir, `${id}-outward-normal-expanded.svg`);
  const png = join(dir, `${id}-outward-normal-expanded.png`);
  await writeFile(out,svg);
  const page=await browser.newPage({viewport:{width:1800,height:442},deviceScaleFactor:1});
  await page.setContent(`<html><body style="margin:0;background:white">${svg}</body></html>`);
  await page.locator('svg').screenshot({path:png}); await page.close();
 }
} finally { await browser.close(); }
console.log(`Rendered ${cases.length} expanded diagnostic overlays.`);
