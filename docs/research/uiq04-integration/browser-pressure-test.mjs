import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const origin = process.argv[2] ?? "http://127.0.0.1:4179";
const evidenceDir = new URL("./rendered/", import.meta.url);
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const offOrigin = [];
const pageErrors = [];
page.on("request", (request) => {
  if (new URL(request.url()).origin !== origin) offOrigin.push(request.url());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(origin, { waitUntil: "networkidle" });
  if (await page.locator("#welcome-start").count()) await page.locator("#welcome-start").click();
  const disclosure = page.locator("#material-clarity-details");
  await disclosure.waitFor({ state: "attached" });
  assert.equal(await disclosure.isVisible(), false, "material panel stays hidden when the material controls are intentionally hidden");
  await page.locator("#journey-step-fit").click();
  await disclosure.waitFor({ state: "attached" });
  assert.equal(await disclosure.isVisible(), true, "material panel appears with the existing material controls");
  assert.equal(await disclosure.evaluate((node) => node.open), false, "disclosure starts collapsed");
  await page.screenshot({ path: fileURLToPath(new URL("./rendered/desktop-collapsed.png", import.meta.url)), fullPage: true });

  await disclosure.locator("summary").focus();
  assert.equal(await disclosure.locator("summary").evaluate((node) => node === document.activeElement), true,
    "summary is keyboard focusable");
  await page.keyboard.press("Enter");
  assert.equal(await disclosure.evaluate((node) => node.open), true, "keyboard expands disclosure");
  const panel = page.locator("#material-clarity-host .uiq-material");
  await panel.waitFor({ state: "visible" });
  assert.match(await panel.innerText(), /UNKNOWN/);
  assert.match(await panel.innerText(), /no separate fabric\/material compatibility assessment/i);
  await page.screenshot({ path: fileURLToPath(new URL("./rendered/desktop-expanded.png", import.meta.url)), fullPage: true });

  const fabricBefore = await page.locator("#stretch-select").inputValue();
  const colorBefore = await page.locator("#appearance-hex").inputValue();
  const shineBefore = await page.locator("#appearance-shine").inputValue();
  await panel.locator(".uiq-material-review-fabric").click();
  assert.equal(await page.evaluate(() => document.activeElement?.matches("#stretch-host [data-material-option]")), true,
    "Review fabric focuses an existing choice");
  await panel.locator(".uiq-material-review-appearance").click();
  assert.equal(await page.locator("#appearance-editor").isVisible(), true, "Review appearance opens the existing editor");
  assert.equal(await page.evaluate(() => document.activeElement?.matches("#appearance-hex")), true,
    "Review appearance focuses the existing color control");
  await panel.locator(".uiq-material-review-appearance").click();
  assert.equal(await page.locator("#appearance-editor").isVisible(), true, "second review does not toggle the editor closed");
  assert.equal(await page.locator("#stretch-select").inputValue(), fabricBefore, "review actions do not change selected fabric");
  assert.equal(await page.locator("#appearance-hex").inputValue(), colorBefore, "review actions do not change color");
  assert.equal(await page.locator("#appearance-shine").inputValue(), shineBefore, "review actions do not change shine");

  await page.setViewportSize({ width: 640, height: 900 });
  const doubleZoomEquivalent = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(doubleZoomEquivalent.document <= doubleZoomEquivalent.viewport,
    `640px / 200%-equivalent reflow has no horizontal page overflow: ${JSON.stringify(doubleZoomEquivalent)}`);

  await page.setViewportSize({ width: 320, height: 800 });
  const narrow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    panel: document.querySelector("#material-clarity-host")?.getBoundingClientRect().width,
    touchTargets: [...document.querySelectorAll("#material-clarity-host button")].map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  }));
  assert.ok(narrow.document <= narrow.viewport, `320px reflow has no horizontal page overflow: ${JSON.stringify(narrow)}`);
  assert.ok(narrow.touchTargets.every(({ width, height }) => width >= 44 && height >= 44),
    `material review buttons meet 44px touch target minimum: ${JSON.stringify(narrow.touchTargets)}`);
  await page.screenshot({ path: fileURLToPath(new URL("./rendered/narrow-320.png", import.meta.url)), fullPage: true });

  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  assert.equal(await disclosure.isVisible(), true, "disclosure remains available in forced colors");
  assert.equal(offOrigin.length, 0, `no off-origin requests: ${offOrigin.join(", ")}`);
  assert.deepEqual(pageErrors, [], `no browser exceptions: ${pageErrors.join("; ")}`);
  console.log(JSON.stringify({ result: "passed", viewport: narrow, offOrigin, pageErrors,
    screenshots: ["desktop-collapsed.png", "desktop-expanded.png", "narrow-320.png"] }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
