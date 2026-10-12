import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = process.env.UIQ08_PREVIEW_ORIGIN ?? "http://127.0.0.1:4187";
const evidence = resolve("docs/research/uiq08/evidence");
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const externalRequests = [];
const pageErrors = [];
const result = { origin, checks: [], externalRequests, pageErrors, screenshots: [] };
const candidateCss = await readFile(resolve("src/ui/enhancements/inspection/inspection-toolbar.css"), "utf8");
assert.doesNotMatch(candidateCss, /url\s*\(|@import/i, "Candidate CSS must remain self-contained and offline");
const productionAssets = await readdir(resolve("dist/assets"));
const productionBundle = (await Promise.all(productionAssets.map((name) => readFile(resolve("dist/assets", name), "utf8")))).join("\n");
assert.doesNotMatch(productionBundle, /uiq-inspection-toolbar/, "Unintegrated candidate leaked into the production app bundle");
result.checks.push("no-remote-css-resources-and-no-production-bundle-leak");
const luminance = (hex) => hex.match(/[\da-f]{2}/gi).map((part) => {
  const value = parseInt(part, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
};
const blend = (foreground, background, alpha) => foreground.match(/[\da-f]{2}/gi).map((channel, index) =>
  Math.round(parseInt(channel, 16) * alpha + parseInt(background.match(/[\da-f]{2}/gi)[index], 16) * (1 - alpha))
    .toString(16).padStart(2, "0")).join("");
assert.match(candidateCss, /#112237 78%/);
assert.match(candidateCss, /#edf5fa/);
assert.match(candidateCss, /#e5f3f8/);
assert.match(candidateCss, /#102c3d/);
const contrastPressure = ["#071321", "#ffffff", "#f2c88b", "#88d7ef"].map((backdrop) => {
  const surface = `#${blend("#112237", backdrop, 0.78)}`;
  return {
    backdrop,
    toolbarText: contrast("#edf5fa", surface),
    buttonText: contrast("#102c3d", "#e5f3f8"),
    fitText: contrast("#102d35", "#a9eadf"),
    toolbarBorder: contrast("#91b2c6", surface),
  };
});
assert.ok(contrastPressure.every((row) => row.toolbarText >= 4.5 && row.buttonText >= 4.5 && row.fitText >= 4.5 && row.toolbarBorder >= 3), JSON.stringify(contrastPressure));
result.contrastPressure = contrastPressure;
result.checks.push("measured-aa-contrast-over-dark-light-and-accent-backdrops");

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${origin}/ops/ui-candidates/inspection-toolbar.html`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".candidate-banner").innerText(), "UIQ-08 isolated visual candidate — not the live app. No project data is loaded or saved.");
  const toolbar = page.locator("#inspection-toolbar");
  const controls = toolbar.locator("button[data-inspection-zoom]");
  assert.equal(await toolbar.getAttribute("role"), "group");
  assert.equal(await toolbar.getAttribute("aria-label"), "Pattern inspection controls");
  assert.deepEqual(await controls.evaluateAll((nodes) => nodes.map((node) => [node.dataset.inspectionZoom, node.getAttribute("aria-label")])), [
    ["out", "Zoom out"], ["fit", "Fit inspection"], ["in", "Zoom in"],
  ]);
  assert.equal(await page.locator("#inspection-viewport").getAttribute("tabindex"), "0");
  assert.equal(await page.locator("#inspection-zoom").getAttribute("aria-live"), "polite");
  assert.equal(await page.locator("#inspection-content svg").count(), 1);
  result.checks.push("candidate-banner-and-existing-control-semantics");

  const path = page.locator("#pattern-art path").first();
  const originalPath = await path.getAttribute("d");
  const viewport = page.locator("#inspection-viewport");
  await viewport.evaluate((node) => { node.scrollLeft = 18; node.scrollTop = 12; });
  await toolbar.locator('[data-inspection-zoom="in"]').click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "125%");
  assert.deepEqual(await viewport.evaluate((node) => [node.scrollLeft, node.scrollTop]), [18, 12]);
  for (let index = 0; index < 5; index += 1) await toolbar.locator('[data-inspection-zoom="in"]').click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "250%");
  await toolbar.locator('[data-inspection-zoom="in"]').click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "250%");
  for (let index = 0; index < 8; index += 1) await toolbar.locator('[data-inspection-zoom="out"]').click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "50%");
  await toolbar.locator('[data-inspection-zoom="out"]').click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "50%");
  await toolbar.locator('[data-inspection-zoom="fit"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#inspection-zoom").innerText(), "100%");
  assert.equal(await path.getAttribute("d"), originalPath);
  result.checks.push("pointer-keyboard-zoom-bounds-fit-scroll-and-artwork-identity");

  await page.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  const axe = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  }));
  assert.deepEqual(axe.violations.map(({ id }) => id), []);
  result.checks.push("axe-wcag-2.1-aa");

  for (const width of [320, 360, 390, 480, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => {
      const toolbar = document.querySelector("#inspection-toolbar");
      const title = document.querySelector("#inspection-title");
      if (!toolbar || !title) throw new Error("Candidate preview elements are missing");
      const toolbarRect = toolbar.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        toolbarWidth: toolbar.clientWidth,
        toolbarScrollWidth: toolbar.scrollWidth,
        toolbarHeight: toolbar.clientHeight,
        titleRight: titleRect.right,
        toolbarRight: toolbarRect.right,
        zoom: document.querySelector("#inspection-zoom")?.textContent,
      };
    });
    assert.equal(dimensions.documentWidth, width, `Document overflow at ${width}px`);
    assert.ok(dimensions.toolbarScrollWidth <= dimensions.toolbarWidth, `Toolbar overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    assert.ok(dimensions.titleRight <= dimensions.toolbarRight + 1, `Title clipped at ${width}px: ${JSON.stringify(dimensions)}`);
    result.checks.push(`responsive-no-overflow-${width}px`);
    if (width === 1440 || width === 320) {
      const name = width === 1440 ? "toolbar-desktop.png" : "toolbar-320.png";
      await page.locator("h1").click();
      await page.screenshot({ path: resolve(evidence, name), fullPage: true });
      result.screenshots.push(`docs/research/uiq08/evidence/${name}`);
    }
  }

  await page.locator("#candidate-stage").evaluate((node) => {
    node.style.backgroundColor = "#172a3b";
    node.style.backgroundImage = "repeating-linear-gradient(0deg, transparent 0 12px, rgb(136 215 239 / 45%) 12px 13px), repeating-linear-gradient(90deg, transparent 0 14px, rgb(242 200 139 / 40%) 14px 15px), repeating-linear-gradient(135deg, #13243a 0 7px, #27445a 7px 9px)";
  });
  assert.notEqual(await page.locator("#candidate-stage").evaluate((node) => getComputedStyle(node).backgroundImage), "none");
  assert.equal(await toolbar.locator("button").first().evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(229, 243, 248)");
  await page.locator("h1").click();
  await page.screenshot({ path: resolve(evidence, "toolbar-dense-backdrop.png"), fullPage: true });
  result.screenshots.push("docs/research/uiq08/evidence/toolbar-dense-backdrop.png");
  await page.locator("#candidate-stage").evaluate((node) => { node.style.backgroundImage = ""; node.style.backgroundColor = ""; });
  result.checks.push("dense-local-backdrop-with-real-flow-position");

  const glassStyle = await toolbar.evaluate((node) => ({
    background: getComputedStyle(node).backgroundColor,
    backdrop: getComputedStyle(node).backdropFilter,
    buttonBackground: getComputedStyle(node.querySelector("button")).backgroundColor,
  }));
  result.computedCandidateStyle = glassStyle;
  assert.notEqual(glassStyle.buttonBackground, "rgba(0, 0, 0, 0)");
  await page.locator("#opaque-toggle").click();
  assert.equal(await toolbar.evaluate((node) => getComputedStyle(node).backdropFilter), "none");
  assert.equal(await toolbar.evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(17, 34, 55)");
  result.checks.push("translucent-enhancement-and-opaque-fallback");
  await page.screenshot({ path: resolve(evidence, "toolbar-opaque-fallback.png"), fullPage: true });
  result.screenshots.push("docs/research/uiq08/evidence/toolbar-opaque-fallback.png");

  await page.emulateMedia({ forcedColors: "active" });
  const forced = await toolbar.evaluate((node) => ({
    background: getComputedStyle(node).backgroundColor,
    backdrop: getComputedStyle(node).backdropFilter,
    buttonColor: getComputedStyle(node.querySelector("button")).color,
  }));
  result.forcedColors = forced;
  assert.equal(forced.backdrop, "none");
  assert.notEqual(forced.buttonColor, "rgba(0, 0, 0, 0)");
  result.checks.push("forced-colors-high-contrast-fallback");
  await page.screenshot({ path: resolve(evidence, "toolbar-forced-colors.png"), fullPage: true });
  result.screenshots.push("docs/research/uiq08/evidence/toolbar-forced-colors.png");

  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  const motion = await toolbar.evaluate((node) => getComputedStyle(node).transitionDuration);
  assert.equal(motion, "0s");
  result.checks.push("reduced-motion-static-treatment");

  assert.deepEqual(externalRequests, []);
  assert.deepEqual(pageErrors, []);
  result.checks.push("no-external-requests-or-page-errors");
  result.verifiedAt = new Date().toISOString();
  await writeFile(resolve(evidence, "browser-report.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
