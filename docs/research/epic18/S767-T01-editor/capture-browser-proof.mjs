import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const pageUrl = "http://127.0.0.1:5173/docs/research/epic18/S767-T01-editor/browser-proof.html";
const expectedRecipes = ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"];
const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "rendered");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 920 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const recipes = await page.evaluate(() => window.__S767_T01_PROOF__?.recipes ?? []);
  assert.deepEqual(recipes.map((recipe) => recipe.name), expectedRecipes);

  const selector = page.locator("#proof-recipe");
  for (const recipe of recipes) {
    await selector.selectOption(recipe.name);
    const editor = page.locator(".t01-editor");
    await editor.waitFor({ state: "visible" });
    assert.equal(await editor.getAttribute("data-t01-recipe-id"), recipe.name);
    assert.equal(await editor.getAttribute("data-t01-style-id"), await page.locator("#proof-editor").getAttribute("data-proof-style"));
    assert.equal(await page.locator('[data-t01-field-id$=".unitCost"][data-t01-field-property="value"]').count(), 1);
    assert.equal(await page.locator('[data-t01-field-id$=".currency"][data-t01-field-property="value"]').count(), 1);
    assert.equal(await page.locator('[data-t01-field-id$=".costBasis"][data-t01-field-property="value"]').count(), 1);
    assert.equal(await page.locator('[data-t01-bom-field="materialId"]').count(), 1);
    assert.equal(await page.locator('[data-t01-assignment-field="bomRowId"]').count(), 1);
    assert.equal(await page.locator('[data-t01-total]').count(), 0);
    assert.match(await editor.innerText(), /nothing is summed or derived here/i);
    assert.match(await editor.innerText(), /Synthetic browser fixture; no source value was supplied\./);

    const metadata = page.locator('[data-t01-controls="cover.styleCode"]');
    await metadata.locator("summary").click();
    const provenance = metadata.locator('[data-t01-field-property="provenance"]');
    assert.equal(await provenance.isVisible(), true);
    await provenance.selectOption("USER_CAPTURED");
    assert.equal(await provenance.evaluate((control) => control.value), "USER_CAPTURED");
    await metadata.locator("summary").click();
    assert.equal(await metadata.getAttribute("open"), null);

    const costInput = page.locator('[data-t01-field-id$=".unitCost"][data-t01-field-property="value"]');
    await costInput.fill("2.75");
    assert.equal(await costInput.evaluate((input) => input.value), "2.75");
    await costInput.fill("");
    assert.equal(await costInput.evaluate((input) => input.value), "");

    await page.screenshot({ path: join(outputDirectory, `${recipe.name}.png`), fullPage: true });
  }
  assert.deepEqual(pageErrors, []);
  console.log(`Browser-rendered T01 proof passed for ${recipes.length} supported recipes: ${expectedRecipes.join(", ")}.`);
  console.log(`Saved one full-page screenshot per recipe in ${outputDirectory}.`);
} finally {
  await browser.close();
}
