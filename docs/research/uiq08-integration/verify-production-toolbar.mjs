import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = process.env.UIQ08_INTEGRATION_ORIGIN ?? "http://127.0.0.1:4189";
const evidence = resolve("docs/research/uiq08-integration/evidence");
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { origin, checks: [], widths: [], pageErrors: [], consoleErrors: [], externalRequests: [], screenshots: [] };

const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = (value) => rgb(value).map((channel) => {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (foreground, background) => {
  const pair = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return Number(((pair[0] + 0.05) / (pair[1] + 0.05)).toFixed(2));
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const track = (page) => {
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) report.externalRequests.push(request.url());
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push(message.text());
  });
};
const openInspection = async (page) => {
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator("#inspection-toolbar").waitFor();
  await page.locator("#welcome-skip").click();
  await page.locator("#inspection-toolbar").waitFor();
};

try {
  const assets = await readdir(resolve("dist/assets"));
  const appAssets = [];
  for (const name of assets.filter((entry) => /\.(?:js|css)$/.test(entry)).sort()) {
    const bytes = await readFile(resolve("dist/assets", name));
    appAssets.push({ path: `dist/assets/${name}`, sha256: digest(bytes) });
  }
  assert.ok(appAssets.some((asset) => asset.path.endsWith(".js")));
  assert.ok(appAssets.some((asset) => asset.path.endsWith(".css")));
  const css = await readFile(resolve("src/ui/enhancements/inspection/inspection-toolbar.css"), "utf8");
  assert.doesNotMatch(css, /url\s*\(|@import/i, "The accepted local stylesheet must not add network dependencies");
  report.productionAssets = appAssets;
  report.checks.push("production-assets-hashed-and-candidate-css-has-no-remote-resources");

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  track(page);
  await openInspection(page);
  const toolbar = page.locator("#inspection-toolbar");
  assert.equal(await toolbar.getAttribute("role"), "group");
  assert.equal(await toolbar.getAttribute("aria-label"), "Pattern inspection controls");
  assert.equal(await toolbar.getAttribute("class"), "uiq-inspection-toolbar uiq-inspection-toolbar--opaque");
  assert.deepEqual(await toolbar.locator("button[data-inspection-zoom]").evaluateAll((nodes) =>
    nodes.map((node) => [node.dataset.inspectionZoom, node.getAttribute("aria-label")])), [
    ["out", "Zoom out"], ["fit", "Fit inspection"], ["in", "Zoom in"],
  ]);
  assert.equal(await toolbar.locator(".uiq-inspection-toolbar__button").count(), 3);
  assert.equal(await toolbar.locator("#inspection-zoom").getAttribute("aria-live"), "polite");

  const initial = await page.evaluate(() => {
    const toolbarNode = document.querySelector("#inspection-toolbar");
    const viewport = document.querySelector("#inspection-viewport");
    const toolbarRect = toolbarNode.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const svg = document.querySelector("#inspection-content svg");
    return {
      toolbarTop: toolbarRect.top,
      toolbarBottom: toolbarRect.bottom,
      viewportTop: viewportRect.top,
      viewBox: svg?.getAttribute("viewBox"),
      toolbarBackground: getComputedStyle(toolbarNode).backgroundColor,
      toolbarBackdrop: getComputedStyle(toolbarNode).backdropFilter,
      toolbarColor: getComputedStyle(toolbarNode.querySelector("h2")).color,
      toolbarBorder: getComputedStyle(toolbarNode).borderTopColor,
      buttonBackground: getComputedStyle(toolbarNode.querySelector("button")).backgroundColor,
      buttonColor: getComputedStyle(toolbarNode.querySelector("button")).color,
      fitBackground: getComputedStyle(toolbarNode.querySelector('[data-inspection-zoom="fit"]')).backgroundColor,
      fitColor: getComputedStyle(toolbarNode.querySelector('[data-inspection-zoom="fit"]')).color,
    };
  });
  assert.ok(initial.toolbarBottom <= initial.viewportTop, "Toolbar must remain in normal flow above the viewport");
  assert.equal(initial.toolbarBackground, "rgb(17, 34, 55)");
  assert.equal(initial.toolbarBackdrop, "none", "The glass branch must remain disabled in production");
  assert.ok(contrast(initial.toolbarColor, initial.toolbarBackground) >= 4.5);
  assert.ok(contrast(initial.buttonColor, initial.buttonBackground) >= 4.5);
  assert.ok(contrast(initial.fitColor, initial.fitBackground) >= 4.5);
  assert.ok(contrast("rgb(145, 178, 198)", initial.toolbarBackground) >= 3);
  report.computedOpaqueStyle = initial;
  report.checks.push("default-on-solid-opaque-style-normal-flow-aa-contrast");

  const svg = page.locator("#inspection-content svg").first();
  const originalViewBox = await svg.getAttribute("viewBox");
  const out = toolbar.locator('[data-inspection-zoom="out"]');
  const fit = toolbar.locator('[data-inspection-zoom="fit"]');
  const zoomIn = toolbar.locator('[data-inspection-zoom="in"]');
  await fit.click();
  for (let step = 0; step < 3; step += 1) await out.click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "50%");
  await out.click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "50%");
  for (let step = 0; step < 8; step += 1) await zoomIn.click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "250%");
  await zoomIn.click();
  assert.equal(await page.locator("#inspection-zoom").innerText(), "250%");
  await out.focus();
  await out.press("Enter");
  assert.equal(await page.locator("#inspection-zoom").innerText(), "225%");
  await fit.focus();
  await fit.press("Space");
  assert.equal(await page.locator("#inspection-zoom").innerText(), "100%");
  const keyboardFocus = await fit.evaluate((node) => ({
    outlineStyle: getComputedStyle(node).outlineStyle,
    outlineWidth: getComputedStyle(node).outlineWidth,
    outlineOffset: getComputedStyle(node).outlineOffset,
    boxShadow: getComputedStyle(node).boxShadow,
  }));
  assert.equal(keyboardFocus.outlineStyle, "solid");
  assert.equal(keyboardFocus.outlineWidth, "2px");
  assert.equal(keyboardFocus.outlineOffset, "3px");
  assert.notEqual(keyboardFocus.boxShadow, "none");
  assert.equal(await svg.getAttribute("viewBox"), originalViewBox, "Zoom must not change artwork geometry");
  assert.equal(await toolbar.evaluate((node) => getComputedStyle(node).backdropFilter), "none");
  report.keyboardFocus = keyboardFocus;
  report.checks.push("existing-app-keyboard-focus-ring-and-candidate-shadow-remain-visible");
  report.checks.push("pointer-and-keyboard-zoom-boundaries-fit-and-viewbox-identity");

  await page.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  const axe = await page.evaluate(async () => window.axe.run(document.querySelector("#inspection-toolbar")));
  assert.deepEqual(axe.violations, []);
  report.toolbarAxe = { violations: axe.violations.length, passes: axe.passes.length };
  report.checks.push("toolbar-axe-check-zero-violations");

  for (const width of [320, 360, 390, 480, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(40);
    const dimensions = await page.evaluate(() => {
      const toolbarNode = document.querySelector("#inspection-toolbar");
      const toolbarRect = toolbarNode.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        toolbarWidth: toolbarNode.clientWidth,
        toolbarScrollWidth: toolbarNode.scrollWidth,
        toolbarLeft: toolbarRect.left,
        toolbarRight: toolbarRect.right,
      };
    });
    assert.ok(dimensions.documentWidth <= width, `Document overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    assert.ok(dimensions.toolbarScrollWidth <= dimensions.toolbarWidth, `Toolbar overflow at ${width}px: ${JSON.stringify(dimensions)}`);
    assert.ok(dimensions.toolbarLeft >= 0 && dimensions.toolbarRight <= width, `Toolbar outside viewport at ${width}px`);
    report.widths.push({ width, ...dimensions });
    if (width === 320 || width === 1440) {
      const name = `uiq08-integration-${width}.png`;
      await page.screenshot({ path: resolve(evidence, name), fullPage: true });
      report.screenshots.push(`docs/research/uiq08-integration/evidence/${name}`);
    }
  }
  report.checks.push("responsive-no-document-or-toolbar-overflow-320-through-1440");

  await page.emulateMedia({ forcedColors: "active" });
  const forcedColors = await toolbar.evaluate((node) => ({
    backdrop: getComputedStyle(node).backdropFilter,
    background: getComputedStyle(node).backgroundColor,
    text: getComputedStyle(node.querySelector("h2")).color,
    buttonBackground: getComputedStyle(node.querySelector("button")).backgroundColor,
    buttonText: getComputedStyle(node.querySelector("button")).color,
  }));
  assert.equal(forcedColors.backdrop, "none");
  assert.notEqual(forcedColors.buttonBackground, "rgba(0, 0, 0, 0)");
  assert.notEqual(forcedColors.buttonText, "rgba(0, 0, 0, 0)");
  report.forcedColors = forcedColors;
  await page.screenshot({ path: resolve(evidence, "uiq08-integration-forced-colors.png"), fullPage: true });
  report.screenshots.push("docs/research/uiq08-integration/evidence/uiq08-integration-forced-colors.png");
  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  assert.equal(await toolbar.locator("button").first().evaluate((node) => getComputedStyle(node).transitionDuration), "0s");
  report.checks.push("forced-colors-and-reduced-motion");

  const disabledView = await browser.newPage({ viewport: { width: 390, height: 844 } });
  track(disabledView);
  await openInspection(disabledView);
  const disabledToolbar = disabledView.locator("#inspection-toolbar");
  await disabledToolbar.evaluate((node) => {
    node.classList.remove("uiq-inspection-toolbar", "uiq-inspection-toolbar--opaque");
    node.querySelectorAll(".uiq-inspection-toolbar__button").forEach((button) => button.classList.remove("uiq-inspection-toolbar__button"));
    node.querySelector("#inspection-zoom")?.classList.remove("uiq-inspection-toolbar__zoom");
  });
  const disabledStyle = await disabledToolbar.evaluate((node) => ({
    className: node.className,
    background: getComputedStyle(node).backgroundColor,
    backdrop: getComputedStyle(node).backdropFilter,
    buttonBackground: getComputedStyle(node.querySelector("button")).backgroundColor,
  }));
  assert.equal(disabledStyle.className, "");
  assert.equal(disabledStyle.background, "rgba(0, 0, 0, 0)");
  assert.equal(disabledStyle.backdrop, "none");
  assert.equal(disabledStyle.buttonBackground, "rgb(14, 26, 43)");
  await disabledView.locator('[data-inspection-zoom="out"]').click();
  assert.equal(await disabledView.locator("#inspection-zoom").innerText(), "75%");
  report.disabledStylesheetFallback = disabledStyle;
  report.checks.push("candidate-css-inert-without-classes-and-controls-remain-functional");

  assert.deepEqual(report.externalRequests, []);
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.consoleErrors, []);
  report.checks.push("zero-egress-page-errors-or-console-errors");
  report.verifiedAt = new Date().toISOString();
  await writeFile(resolve(evidence, "production-browser-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
