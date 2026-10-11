// UIQ-02 contributor-run browser verification. Renders the isolated
// ops/ui-candidates/foundation.html preview (served by the already-running
// local Vite dev server, no build/config changes) in locally cached
// Playwright Chromium and records falsifiable measurements: viewport
// overflow, keyboard focus/contrast, 44px control targets, reduced-motion,
// forced-colors, and network egress. Writes browser-verification.json plus
// PNG screenshots alongside this script. Re-run with:
//   node docs/research/uiq02/evidence/verify-browser.mjs <baseUrl>
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(HERE, "screenshots");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const baseUrl = process.argv[2] ?? "http://localhost:4312";
const pageUrl = `${baseUrl}/ops/ui-candidates/foundation.html`;

function relLuminance(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const toLin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = toLin((n >> 16) & 255);
  const g = toLin((n >> 8) & 255);
  const b = toLin(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(hexA, hexB) {
  const l1 = relLuminance(hexA);
  const l2 = relLuminance(hexB);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m) return null;
  return "#" + m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, "0")).join("");
}

const results = { pageUrl, generatedAt: new Date().toISOString(), checks: {} };

const browser = await chromium.launch();

// --- Network egress: only localhost requests are allowed. ---
{
  const page = await browser.newPage();
  const requests = [];
  page.on("request", (req) => requests.push(req.url()));
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const nonLocal = requests.filter((u) => !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(u));
  results.checks.networkEgress = { totalRequests: requests.length, nonLocalRequests: nonLocal };
  await page.screenshot({ path: join(SCREENSHOT_DIR, "default-1440.png"), fullPage: true });
  await page.close();
}

// --- Viewport overflow at the required widths. ---
{
  const widths = [320, 390, 1440, 480, 960];
  const overflow = {};
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(pageUrl, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    overflow[width] = { ...metrics, overflows: metrics.scrollWidth > metrics.clientWidth };
    if (width === 320) await page.screenshot({ path: join(SCREENSHOT_DIR, "narrow-320.png"), fullPage: true });
    await page.close();
  }
  results.checks.viewportOverflow = overflow;
}

// --- Native control size (44px target) for every button/select/input. ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const sizes = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll(".uiq-foundation button, .uiq-foundation select, .uiq-foundation input"));
    return els.map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, width: r.width, height: r.height, disabled: el.disabled };
    });
  });
  results.checks.controlSizes = sizes;
  results.checks.controlSizesAllMeet44px = sizes.every((s) => s.width >= 44 && s.height >= 44);
  await page.close();
}

// --- Keyboard focus: tab to the first enabled button, measure outline contrast. ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector("#preview-controls button:not(:disabled)")?.focus());
  const focusStyle = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    const parent = el.closest(".uiq-foundation-panel");
    const parentBg = parent ? getComputedStyle(parent).backgroundColor : null;
    return {
      tag: el?.tagName,
      outlineWidth: cs.outlineWidth,
      outlineStyle: cs.outlineStyle,
      outlineColor: cs.outlineColor,
      parentBackgroundColor: parentBg,
    };
  });
  const outlineHex = rgbToHex(focusStyle.outlineColor);
  const bgHex = rgbToHex(focusStyle.parentBackgroundColor);
  results.checks.keyboardFocus = {
    ...focusStyle,
    outlineHex,
    backgroundHex: bgHex,
    contrastRatio: outlineHex && bgHex ? Number(contrastRatio(outlineHex, bgHex).toFixed(2)) : null,
    meets3to1: outlineHex && bgHex ? contrastRatio(outlineHex, bgHex) >= 3 : null,
  };
  await page.screenshot({ path: join(SCREENSHOT_DIR, "keyboard-focus.png") });
  await page.close();
}

// --- Text contrast for panel description and status message. ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const textContrast = await page.evaluate(() => {
    function sampleTextContrast(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      let bgEl = el;
      let bg = getComputedStyle(bgEl).backgroundColor;
      while ((bg === "rgba(0, 0, 0, 0)" || bg === "transparent") && bgEl.parentElement) {
        bgEl = bgEl.parentElement;
        bg = getComputedStyle(bgEl).backgroundColor;
      }
      return { color: cs.color, backgroundColor: bg };
    }
    return {
      panelDescription: sampleTextContrast("#preview-panels .uiq-foundation-panel-description"),
      statusMessage: sampleTextContrast("#preview-status .uiq-foundation-status-message"),
    };
  });
  for (const [key, val] of Object.entries(textContrast)) {
    if (!val) continue;
    const fg = rgbToHex(val.color);
    const bg = rgbToHex(val.backgroundColor);
    textContrast[key] = {
      ...val,
      foregroundHex: fg,
      backgroundHex: bg,
      contrastRatio: fg && bg ? Number(contrastRatio(fg, bg).toFixed(2)) : null,
      meets4_5to1: fg && bg ? contrastRatio(fg, bg) >= 4.5 : null,
    };
  }
  results.checks.textContrast = textContrast;
  await page.close();
}

// --- Reduced motion: transitions disabled. ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const transition = await page.evaluate(() => {
    const btn = document.querySelector("#preview-controls button:not(:disabled)");
    return getComputedStyle(btn).transitionDuration;
  });
  results.checks.reducedMotion = { transitionDuration: transition, disabled: /^0s(,\s*0s)*$/.test(transition.trim()) };
  await page.screenshot({ path: join(SCREENSHOT_DIR, "reduced-motion.png"), fullPage: true });
  await page.close();
}

// --- Forced colors: panel stays opaque and legible. ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark", forcedColors: "active" });
  await page.goto(pageUrl, { waitUntil: "networkidle" });
  const glass = await page.evaluate(() => {
    const el = document.querySelector(".uiq-foundation-panel--glass");
    const cs = getComputedStyle(el);
    return { backgroundColor: cs.backgroundColor, backdropFilter: cs.backdropFilter };
  });
  results.checks.forcedColors = glass;
  await page.screenshot({ path: join(SCREENSHOT_DIR, "forced-colors.png"), fullPage: true });
  await page.close();
}

await browser.close();

writeFileSync(join(HERE, "browser-verification.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
