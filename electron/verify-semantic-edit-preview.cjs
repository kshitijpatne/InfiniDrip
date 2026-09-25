// Rendered-browser proof that an invalid exploratory Edit preview is explicit
// and remains separate from the saved/output pattern until Slice 238 wires the
// persistent semantic edit document.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { ROOT, startPreviewServer } = require("./verify-common.cjs");

async function hashSvgDownload(page) {
  const pendingDownload = page.waitForEvent("download");
  await page.locator("#export-svg").click();
  const download = await pendingDownload;
  const stream = await download.createReadStream();
  assert.ok(stream, "SVG download stream is available");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  return { name: download.suggestedFilename(), bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

async function main() {
  const server = await startPreviewServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(`${server.url}/`);
    assert.equal(response?.status(), 200, "preview app route loads");
    await page.waitForSelector("#infini-shell", { state: "attached" }).catch(async (error) => {
      throw new Error(`app shell failed to mount; page title=${await page.title()}; body=${(await page.locator("body").innerText()).slice(0, 400)}; page errors=${pageErrors.join(" | ")}; ${error.message}`);
    });
    const skipWelcome = page.locator("#welcome-skip");
    if (await skipWelcome.count() && await skipWelcome.isVisible()) await skipWelcome.click();

    for (let step = 0; step < 5 && await page.locator("#infini-shell").getAttribute("data-stage") !== "output"; step++) {
      const next = page.locator("#journey-next");
      assert.equal(await next.isEnabled(), true, "the unchanged parametric style can reach its output stage");
      await next.click();
    }
    assert.equal(await page.locator("#infini-shell").getAttribute("data-stage"), "output", "the valid parametric draft reaches output");
    const parametricBefore = await hashSvgDownload(page);

    await page.locator("#advanced-view-label").click();
    await page.locator("#view-edit").click();
    await page.locator('[data-editor-validation="valid"]').waitFor({ state: "visible" });
    const coordinate = page.locator('input[data-editor-coordinate][data-editor-axis="x"]').first();
    await coordinate.fill("1000");
    await coordinate.dispatchEvent("change");

    const invalid = page.locator('[data-editor-validation="invalid"]');
    await invalid.waitFor({ state: "visible" });
    const diagnosticText = (await invalid.textContent()) ?? "";
    assert.match(diagnosticText, /Preview blocked by \d+ digital checks?/);
    assert.match(diagnosticText, /current outputs still use the parametric draft/);
    const invalidPreviewIssueCount = await invalid.locator("[data-editor-issue]").count();
    assert.ok(invalidPreviewIssueCount > 0, "render all actionable issue details");
    const contractText = (await page.locator('[data-editor-contract="preview-only"]').textContent()) ?? "";
    assert.match(contractText, /does not change measurements, the assembled garment, production checks, size grading, nesting, saves, or exports/);

    const evidenceDir = path.join(ROOT, "docs", "research", "epic15", "evidence");
    fs.mkdirSync(evidenceDir, { recursive: true });
    const screenshot = path.join(evidenceDir, "S237-invalid-edit-preview.png");
    await page.screenshot({ path: screenshot, fullPage: true });

    const parametricAfter = await hashSvgDownload(page);
    assert.deepEqual(parametricAfter, parametricBefore, "the Edit preview does not alter parametric SVG bytes");

    await page.locator("#editor-reset").click();
    await page.locator('[data-editor-validation="valid"]').waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-editor-validation="invalid"]').count(), 0, "Reset returns to the valid draft");

    console.log(JSON.stringify({
      result: "PASS",
      browser: await page.evaluate(() => navigator.userAgent),
      invalidPreviewIssueCount,
      parametricOutputBoundaryVisible: true,
      parametricSvgBeforeAndAfterInvalidPreview: parametricBefore,
      resetRestoredValidPreview: true,
      screenshot: path.relative(ROOT, screenshot).replaceAll(path.sep, "/"),
    }, null, 2));
  } finally {
    await browser?.close();
    server.stop();
  }
}

void main().catch((error) => {
  console.error("SEMANTIC EDIT PREVIEW VERIFY FAILED:", error);
  process.exitCode = 1;
});
