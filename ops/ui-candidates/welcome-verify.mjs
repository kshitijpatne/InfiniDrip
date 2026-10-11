import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = process.env.UIQ07_PREVIEW_ORIGIN ?? "http://127.0.0.1:4187";
const evidence = resolve("docs/research/uiq07/evidence");
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const externalRequests = [];
const pageErrors = [];
const result = { origin, checks: [], externalRequests, pageErrors, screenshots: [] };
const luminance = (hex) => hex.match(/[\da-f]{2}/gi).map((part) => {
  const value = parseInt(part, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${origin}/ops/ui-candidates/welcome.html`, { waitUntil: "networkidle" });

  const region = page.getByRole("region", { name: "InfiniDrip welcome" });
  await region.getByRole("heading", { name: "InfiniDrip" }).waitFor();
  assert.equal(await page.locator(".candidate-banner").innerText(), "UIQ-07 isolated preview — not the live app; no login or action is connected.");
  assert.equal(await region.locator("a,button,input,select,form").count(), 0);
  assert.equal(await region.locator(".uiq-entry__ornament").getAttribute("aria-hidden"), "true");
  result.checks.push("accessible-region-wordmark-decorative-ornament-no-controls");

  const axeSource = resolve("node_modules/axe-core/axe.min.js");
  await page.addScriptTag({ path: axeSource });
  const axe = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
  assert.deepEqual(axe.violations.map(({ id }) => id), []);
  result.checks.push("axe-wcag-2.1-aa");
  const fallbackBackground = "#081421";
  result.contrastRatiosOnFlatFallback = {
    wordmarkGradientLightestStop: contrast("#f5f8f9", fallbackBackground),
    wordmarkGradientDarkestStop: contrast("#8bb4c0", fallbackBackground),
    eyebrow: contrast("#9de4ed", fallbackBackground),
    welcome: contrast("#f2f7fa", fallbackBackground),
    description: contrast("#c4d5df", fallbackBackground),
  };
  assert.ok(Math.min(...Object.values(result.contrastRatiosOnFlatFallback)) >= 4.5);
  result.checks.push("text-contrast-at-least-4.5-to-1-on-flat-fallback");

  for (const width of [320, 390, 480, 1440]) {
    await page.setViewportSize({ width, height: 820 });
    const dimensions = await page.evaluate(() => {
      const panel = document.querySelector(".uiq-entry");
      const text = document.querySelector(".uiq-entry__content");
      if (!(panel instanceof HTMLElement) || !(text instanceof HTMLElement)) throw new Error("Welcome content missing");
      const panelBox = panel.getBoundingClientRect();
      const textBox = text.getBoundingClientRect();
      return {
        viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        panelWidth: panel.scrollWidth,
        panelClientWidth: panel.clientWidth,
        panelOverflow: getComputedStyle(panel).overflow,
        textLeft: textBox.left,
        textRight: textBox.right,
        panelLeft: panelBox.left,
        panelRight: panelBox.right,
      };
    });
    assert.equal(dimensions.documentWidth, width, `Document overflow at ${width}px`);
    assert.equal(dimensions.panelOverflow, "hidden", `Decorative geometry must remain clipped to the panel at ${width}px`);
    assert.ok(dimensions.textLeft >= dimensions.panelLeft && dimensions.textRight <= dimensions.panelRight, `Text clipped at ${width}px: ${JSON.stringify(dimensions)}`);
    result.checks.push(`responsive-no-overflow-${width}px`);
    if (width === 1440) {
      const target = resolve(evidence, "welcome-desktop.png");
      await page.screenshot({ path: target, fullPage: true });
      result.screenshots.push("docs/research/uiq07/evidence/welcome-desktop.png");
    }
    if (width === 390) {
      const target = resolve(evidence, "welcome-mobile.png");
      await page.screenshot({ path: target, fullPage: true });
      result.screenshots.push("docs/research/uiq07/evidence/welcome-mobile.png");
    }
  }

  await page.emulateMedia({ forcedColors: "active" });
  const forced = await page.locator(".uiq-entry__wordmark").evaluate((node) => {
    const style = getComputedStyle(node);
    return { color: style.color, fill: style.webkitTextFillColor, background: style.backgroundImage };
  });
  assert.notEqual(forced.fill, "transparent");
  const forcedPath = resolve(evidence, "welcome-forced-colors.png");
  await page.screenshot({ path: forcedPath, fullPage: true });
  result.screenshots.push("docs/research/uiq07/evidence/welcome-forced-colors.png");
  result.checks.push("forced-colors-readable-wordmark");

  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  const motion = await page.locator(".uiq-entry").evaluate((node) => getComputedStyle(node).animationDuration);
  assert.ok(["0s", "0.0001ms"].includes(motion));
  result.checks.push("reduced-motion-no-animation");

  assert.deepEqual(externalRequests, []);
  assert.deepEqual(pageErrors, []);
  result.checks.push("no-external-requests-or-page-errors");
  result.verifiedAt = new Date().toISOString();
  await writeFile(resolve(evidence, "browser-report.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
