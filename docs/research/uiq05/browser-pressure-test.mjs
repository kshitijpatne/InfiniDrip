import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const origin = process.argv[2] ?? "http://127.0.0.1:4173";
const evidenceDir = resolve(process.argv[3] ?? fileURLToPath(new URL("./evidence/", import.meta.url)));
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const externalRequests = [];
const pageErrors = [];
const consoleErrors = [];
page.on("request", (request) => {
  if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
await context.route("**/*", async (route) => {
  const requestOrigin = new URL(route.request().url()).origin;
  if (requestOrigin !== origin) {
    externalRequests.push(route.request().url());
    await route.abort();
    return;
  }
  await route.continue();
});

try {
  await page.goto(origin, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".project-startup-error").count(), 0, "fresh profile opens cleanly");
  await page.locator("#welcome-start").click().catch(() => undefined);
  await page.locator("#journey-step-fit").click();
  const library = page.locator("details.artwork-library");
  await library.waitFor({ state: "attached" });
  if (!(await library.evaluate((element) => element.open))) await library.locator("summary").click();
  assert.equal(await library.evaluate((element) => element.classList.contains("uiq-artwork")), true,
    "default-on flag applies the scoped presentation to the existing library");
  assert.equal(await page.locator("#surface-library-use-filter").count(), 1);
  assert.equal(await page.locator("#surface-library-assess-use").count(), 1,
    "curated-use filtering and suitability assessment remain separate controls");
  await library.scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(evidenceDir, "artwork-desktop-1280.png") });

  const search = page.locator("#surface-library-search");
  await search.fill("no matching artwork");
  assert.match(await page.locator("#surface-library-results").innerText(), /No artwork references match/);
  await page.locator("#surface-library-category").selectOption({ index: 0 });
  await page.locator("#surface-library-clear").click();
  assert.equal(await search.inputValue(), "", "clear action resets the search");
  assert.equal(await page.locator("#surface-library-category").inputValue(), "", "clear action resets category");
  assert.equal(await page.locator("#surface-library-assess-use").inputValue(), "placement",
    "clear action restores default guidance independently of print-use filtering");
  assert.equal(await search.evaluate((element) => element === document.activeElement), true,
    "clear action returns keyboard focus to search in a connected document");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "surface-library-category",
    "search-to-filter keyboard navigation remains predictable");

  const sizes = [];
  for (const width of [1280, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      library: document.querySelector("details.artwork-library")?.getBoundingClientRect().width,
      ctaHeights: [...document.querySelectorAll(".uiq-artwork-choose")].map((button) => button.getBoundingClientRect().height),
      localImages: [...document.querySelectorAll(".uiq-artwork-image")].every((image) => new URL(image.src).origin === location.origin),
    }));
    assert.ok(layout.document <= layout.viewport, `no horizontal page overflow at ${width}px: ${JSON.stringify(layout)}`);
    assert.ok(layout.ctaHeights.every((height) => height >= 44), `CTA targets remain at least 44px at ${width}px`);
    assert.equal(layout.localImages, true, "catalog image references stay local to the app");
    sizes.push({ width, ...layout });
    if (width === 320) {
      await library.scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(evidenceDir, "artwork-mobile-320.png") });
    }
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  const target = page.locator("#surface-library-target");
  const record = page.locator("[data-artwork-stage-id]").first();
  const assetId = await record.getAttribute("data-artwork-stage-id");
  await record.click();
  assert.equal(await page.locator("#surface-new-id").inputValue(), "textile-printed-with-game-birds");
  assert.equal(await page.locator("[data-surface-row]").count(), 0,
    "browsing and staging do not commit a placement implicitly");
  await page.locator("#surface-new-role").fill("front");
  await page.locator("#surface-add").click();
  await page.locator("[data-surface-row]").first().waitFor();
  await target.selectOption("0");
  const apply = page.locator(`[data-artwork-apply-id="${assetId}"]`);
  await apply.click();
  await page.waitForFunction((id) => document.querySelector("[data-surface-asset-preview]")?.getAttribute("data-asset-id") === id, assetId);
  assert.equal(await page.locator('[data-surface-field="id"]').inputValue(), "textile-printed-with-game-birds",
    "explicit attach changes the existing placement artwork metadata only");
  assert.equal(await page.locator("#surface-library-action-status").innerText().then((text) => /preserved/i.test(text)), true,
    "attach action reports preservation of the existing placement values");
  await library.scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(evidenceDir, "artwork-explicit-actions.png") });

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  assert.equal(await library.isVisible(), true, "catalog remains available under forced colors and reduced motion");
  assert.deepEqual(externalRequests, [], `all off-origin requests are blocked and absent: ${externalRequests.join(", ")}`);
  assert.deepEqual(pageErrors, [], `no browser exceptions: ${pageErrors.join("; ")}`);
  assert.deepEqual(consoleErrors, [], `no browser console errors: ${consoleErrors.join("; ")}`);

  const evidence = {
    result: "passed",
    isolatedProfile: true,
    origin,
    viewports: sizes,
    keyboard: "clear returns focus to search; Tab reaches category filter",
    actions: "stage leaves design unchanged until explicit Add; attach is explicit and preserves existing placement values",
    forcedColors: true,
    reducedMotion: true,
    externalRequests,
    pageErrors,
    consoleErrors,
    screenshots: ["artwork-desktop-1280.png", "artwork-mobile-320.png", "artwork-explicit-actions.png"],
  };
  await writeFile(join(evidenceDir, "browser-pressure-test.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await context.close();
  await browser.close();
}
