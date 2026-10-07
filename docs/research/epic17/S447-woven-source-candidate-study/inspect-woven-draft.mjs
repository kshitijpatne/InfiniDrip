import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4191/', { waitUntil: 'networkidle' });
const value = await page.evaluate(async () => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }] = await Promise.all([
    import('/src/drafting/recipe.ts'), import('/src/drafting/measurements.ts'), import('/src/drafting/options.ts'),
  ]);
  const recipe = GARMENTS.find((item) => item.name === 'woven-shirt');
  const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
  return {
    roleNames: Object.keys(block.roles),
    sleeve: block.roles.sleeve,
    band: block.roles.sleeveBand,
    stitchLabels: block.stitches.map((stitch) => stitch.label),
  };
});
await browser.close();
console.log(JSON.stringify(value, null, 2));
