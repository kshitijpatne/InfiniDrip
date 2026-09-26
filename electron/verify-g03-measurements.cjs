// Slice 247 production-browser review of the guided measurement route.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { ROOT, sha256, startPreviewServer } = require("./verify-common.cjs");

const EVIDENCE_DIR = path.join(ROOT, "docs", "research", "epic16", "evidence");
const AXE_PATH = require.resolve("axe-core/axe.min.js");
const VIEWPORTS = [
  { width: 320, height: 800, screenshot: "S247-guided-measurements-320.png" },
  { width: 390, height: 844 },
  { width: 1440, height: 900, screenshot: "S247-guided-measurements-1440.png" },
];

async function main() {
  const server = await startPreviewServer();
  let browser;
  let context;
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: VIEWPORTS[0] });
    const page = await context.newPage();
    const browserMessages = [];
    page.on("pageerror", (error) => browserMessages.push({ type: "pageerror", text: error.stack || error.message }));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) browserMessages.push({ type: message.type(), text: message.text() });
    });
    page.on("requestfailed", (request) => browserMessages.push({
      type: "requestfailed", text: request.url(), detail: request.failure()?.errorText,
    }));

    await page.goto(server.url);
    await page.waitForSelector("#infini-shell, .project-startup-error", { timeout: 25000 });
    assert.equal(await page.locator(".project-startup-error").count(), 0, "fresh local profile starts without a project error");
    await page.locator("#welcome-skip").click().catch(() => undefined);
    await page.locator("#garment-woven-shirt").click();
    const routeButton = page.locator("#journey-guided");
    await routeButton.focus();
    await page.keyboard.press("Enter");
    await page.locator("#g03-measurement-capture").waitFor();
    const chest = page.locator('[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]');
    const accessibleChest = page.getByRole("textbox", { name: "New reading for Chest" });
    assert.equal(await accessibleChest.count(), 1, "screen-reader role/name exposes the Chest reading input");
    const chestField = page.locator('[data-field-id="body.chest-girth"].measurement-capture-panel__field');
    await chest.fill("not a number");
    await page.locator('[data-action="capture-add-reading"][data-field-id="body.chest-girth"]').click();
    await page.waitForFunction(() => document.querySelector('[data-field-id="body.chest-girth"].measurement-capture-panel__field')
      ?.getAttribute("data-state") === "invalid");
    await chest.fill("123");
    await page.waitForTimeout(500);
    assert.equal(await page.locator("#project-persistence-state").getAttribute("data-state"), "saved",
      "the reading and following raw draft finish saving in the active style");
    assert.equal(await chestField.getAttribute("data-state"), "invalid", "an invalid selected reading remains visibly blocked");
    assert.equal(await chestField.locator("li[data-reading-id]").count(), 1, "only the explicitly added invalid value becomes a reading");

    await page.reload();
    await page.waitForSelector("#infini-shell");
    if (await page.locator("#recovery-accept").count() > 0) await page.locator("#recovery-accept").click();
    await page.locator("#journey-step-start").click();
    await page.locator("#journey-guided").focus();
    await page.keyboard.press("Enter");
    await page.locator("#g03-measurement-capture").waitFor();
    await page.locator('[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]').waitFor();
    assert.equal(await page.locator('[data-action="capture-edit-raw"][data-field-id="body.chest-girth"]').inputValue(), "123",
      "the exact invalid raw draft resumes from the active local style after reload");
    assert.equal(await page.getByRole("textbox", { name: "New reading for Chest" }).count(), 1,
      "the resumed capture field keeps its accessible name");
    const accessibleFieldTree = await page.locator('[data-field-id="body.chest-girth"].measurement-capture-panel__field fieldset').ariaSnapshot();
    assert.match(accessibleFieldTree, /New reading for Chest/);
    assert.match(accessibleFieldTree, /Status/);
    assert.match(accessibleFieldTree, /Source and limits/);
    assert.equal(await page.locator('[data-field-id="body.chest-girth"] li[data-reading-id]').count(), 1,
      "the explicit invalid reading remains separate from the resumed draft");
    await page.addScriptTag({ path: AXE_PATH });

    const viewports = [];
    const screenshots = [];
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      const layout = await page.evaluate(() => {
        const node = document.querySelector("#g03-measurement-capture");
        const bounds = node?.getBoundingClientRect();
        return {
          viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          capturePanel: bounds ? { left: bounds.left, right: bounds.right, width: bounds.width } : null,
          panelCanScrollInternally: !!node && node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY !== "visible",
        };
      });
      assert.ok(layout.documentWidth <= viewport.width, `document has no horizontal overflow at ${viewport.width}px`);
      assert.ok(layout.bodyWidth <= viewport.width, `body has no horizontal overflow at ${viewport.width}px`);
      assert.ok(layout.capturePanel && layout.capturePanel.left >= 0 && layout.capturePanel.right <= viewport.width,
        `capture panel fits the viewport at ${viewport.width}px`);
      const axeViolations = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })),
        }));
      });
      assert.deepEqual(axeViolations, [], `axe reports no WCAG 2.1 A/AA violations at ${viewport.width}px`);
      viewports.push({ ...viewport, layout, axeViolationCount: axeViolations.length });
      if (viewport.screenshot) {
        fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
        const screenshotPath = path.join(EVIDENCE_DIR, viewport.screenshot);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        screenshots.push({ path: path.relative(ROOT, screenshotPath).split(path.sep).join("/"), sha256: sha256(screenshotPath) });
      }
    }
    assert.deepEqual(browserMessages, [], "the production browser has no console warnings/errors, page errors, or failed requests");
    const report = {
      slice: 247,
      status: "passed",
      createdAt: new Date().toISOString(),
      browser: await page.evaluate(() => navigator.userAgent),
      axeCoreVersion: require("axe-core/package.json").version,
      state: "Woven shirt guided capture with an exact invalid raw chest draft resumed after reload",
      keyboardRouteActivation: "Guide my measurements opened with Enter",
      accessibleFieldName: "The Chest capture input is exposed as a textbox named 'New reading for Chest'.",
      accessibleFieldTree,
      viewports,
      browserMessages,
      screenshots,
      scope: [
        "Checks cover the local production build at 320, 390 and 1440 CSS pixels, including WCAG 2.1 A/AA axe rules.",
        "Chromium's accessible role tree, keyboard activation, and axe checks cover screen-reader-facing semantics; no physical fit or usability claim is made.",
      ],
    };
    const reportPath = path.join(EVIDENCE_DIR, "S247-guided-measurements-verification.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, reportPath: path.relative(ROOT, reportPath).split(path.sep).join("/") }, null, 2));
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
    server.stop();
  }
}

void main().catch((error) => {
  console.error("G03 MEASUREMENT BROWSER VERIFY FAILED:", error.stack || error);
  process.exitCode = 1;
});
