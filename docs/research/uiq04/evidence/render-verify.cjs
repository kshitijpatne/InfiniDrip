// One-off rendered-browser verification for the UIQ-04 material candidate.
// Not part of any npm script or CI gate; run manually against the Vite dev
// server for honest rendered evidence. Deleted-safe: produces only files
// under docs/research/uiq04/evidence/.
"use strict";

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.UIQ04_PREVIEW_URL || "http://localhost:5183/ops/ui-candidates/material.html";
const EVIDENCE_DIR = path.join(__dirname);

async function main() {
  const browser = await chromium.launch();
  const requests = [];
  const page = await browser.newPage();
  page.on("request", (req) => requests.push(req.url()));

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const caseCount = await page.locator(".case").count();
  const buttonCount = await page.locator(".uiq-material-review-fabric, .uiq-material-review-appearance").count();
  const sectionHeadings = await page.locator(".uiq-material h2").allTextContents();

  // Narrow-viewport reflow check (320px content width).
  await page.setViewportSize({ width: 320, height: 900 });
  const narrowOverflow = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll(".uiq-material"));
    return panels.some((panel) => panel.scrollWidth > panel.clientWidth + 1);
  });

  // 390px and 1440px reflow checks.
  await page.setViewportSize({ width: 390, height: 900 });
  const narrow390Overflow = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll(".uiq-material"));
    return panels.some((panel) => panel.scrollWidth > panel.clientWidth + 1);
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const wideOverflow = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll(".uiq-material"));
    return panels.some((panel) => panel.scrollWidth > panel.clientWidth + 1);
  });

  // Keyboard focus + action-emission proof on the first case's buttons.
  const firstFabricButton = page.locator(".uiq-material-review-fabric").first();
  await firstFabricButton.focus();
  const focusedBeforeClick = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.className : null;
  });
  await firstFabricButton.click();
  const firstLogText = await page.locator(".case .log").first().textContent();

  // Invalid-color case must literally show "Preview unavailable" and must
  // never have written the raw hostile value into any style attribute.
  const invalidColorCaseText = await page
    .locator(".case", { hasText: "Invalid color" })
    .locator(".uiq-material-color-text")
    .textContent();
  const hostileCaseScriptCount = await page
    .locator(".case", { hasText: "Hostile text" })
    .locator("script")
    .count();
  const pwned = await page.evaluate(() => Boolean(window.__uiq04_pwned));

  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "material-preview-full.png"), fullPage: true });

  const externalRequests = requests.filter((url) => !url.startsWith("http://localhost") && !url.startsWith("http://127.0.0.1"));

  const result = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    caseCount,
    buttonCount,
    sectionHeadingsSample: sectionHeadings.slice(0, 2),
    narrowOverflow320: narrowOverflow,
    narrowOverflow390: narrow390Overflow,
    wideOverflow1440: wideOverflow,
    focusedBeforeClick,
    firstLogText,
    invalidColorCaseText,
    hostileCaseScriptCount,
    windowPwnedFlag: pwned,
    consoleErrors,
    totalRequests: requests.length,
    externalRequests,
  };

  fs.writeFileSync(path.join(EVIDENCE_DIR, "render-verify-result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
