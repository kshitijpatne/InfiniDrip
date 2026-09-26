// Slice 240 production-browser responsive and accessibility review.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { ROOT, startPreviewServer } = require("./verify-common.cjs");

const EVIDENCE_DIR = path.join(ROOT, "docs", "research", "epic15", "evidence");
const AXE_PATH = require.resolve("axe-core/axe.min.js");
const VIEWPORTS = [
  { width: 320, height: 800, screenshot: "S240-responsive-320.png" },
  { width: 390, height: 844 },
  { width: 1440, height: 900, screenshot: "S240-responsive-1440.png" },
];

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function main() {
  const server = await startPreviewServer();
  let browser;
  let context;
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: VIEWPORTS[0].width, height: VIEWPORTS[0].height } });
    const page = await context.newPage();
    const browserMessages = [];
    page.on("pageerror", (error) => browserMessages.push({ type: "pageerror", text: error.stack || error.message }));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        browserMessages.push({ type: message.type(), text: message.text(), location: message.location() });
      }
    });
    page.on("requestfailed", (request) => browserMessages.push({
      type: "requestfailed", text: request.url(), detail: request.failure()?.errorText,
    }));

    await page.goto(server.url);
    await page.waitForSelector("#infini-shell, .project-startup-error", { timeout: 25000 });
    assert.equal(await page.locator(".project-startup-error").count(), 0, "a clean browser profile opens without a project error");
    await page.locator("#welcome-skip").click().catch(() => undefined);
    await page.locator("#journey-step-fit").click();
    const managerDetails = page.locator("#project-manager-host .project-manager-details");
    if (!await managerDetails.evaluate((element) => element.open)) await managerDetails.locator("summary").click();
    await page.addScriptTag({ path: AXE_PATH });

    const viewports = [];
    const screenshots = [];
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      const layout = await page.evaluate(() => {
        const rect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const bounds = element.getBoundingClientRect();
          return { left: bounds.left, right: bounds.right, width: bounds.width };
        };
        return {
          viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          app: rect("#infini-shell"),
          projectManager: rect("#project-manager-host"),
          stylePanel: rect("#style-host"),
        };
      });
      assert.ok(layout.documentWidth <= viewport.width, `document has no horizontal overflow at ${viewport.width}px`);
      assert.ok(layout.bodyWidth <= viewport.width, `body has no horizontal overflow at ${viewport.width}px`);
      const accessibility = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })),
        }));
      });
      assert.deepEqual(accessibility, [], `axe reports no WCAG 2.1 A/AA violations at ${viewport.width}px`);
      viewports.push({ width: viewport.width, height: viewport.height, layout, axeViolations: accessibility.length });
      if (viewport.screenshot) {
        const screenshotPath = path.join(EVIDENCE_DIR, viewport.screenshot);
        fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        screenshots.push({
          path: path.relative(ROOT, screenshotPath).split(path.sep).join("/"),
          sha256: sha256(fs.readFileSync(screenshotPath)),
        });
      }
    }
    assert.deepEqual(browserMessages, [], "production-browser startup and responsive review has no console warnings, errors, page errors, or failed requests");

    const report = {
      slice: 240,
      status: "passed",
      createdAt: new Date().toISOString(),
      browser: await page.evaluate(() => navigator.userAgent),
      axeCoreVersion: require("axe-core/package.json").version,
      state: "Style stage with local project and styles panel expanded",
      viewports,
      browserMessages,
      screenshots,
      scope: [
        "The captured checks cover the mounted local UI at 320, 390, and 1440 CSS pixels.",
        "Axe covers WCAG 2.1 A/AA rules; it does not prove usability or manual color/keyboard review.",
      ],
    };
    const reportPath = path.join(EVIDENCE_DIR, "S240-responsive-verification.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, reportPath: path.relative(ROOT, reportPath).split(path.sep).join("/") }, null, 2));
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
    server.stop();
  }
}

void main().catch((error) => {
  console.error("G02 RESPONSIVE VERIFY FAILED:", error.stack || error);
  process.exitCode = 1;
});
