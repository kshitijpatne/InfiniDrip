// Focused Chromium review for S778's explicit local Tech Pack freeze controls.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const {
  ROOT,
  makeTempDir,
  removeTempDir,
  startPreviewServer,
} = require("../../../../electron/verify-common.cjs");

const EVIDENCE_DIR = path.join(__dirname, "evidence");
const EXPECTED_FILES = ["production-pack.pdf", "production-pack.techpack.zip"];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
];

async function openReadyStyle(page, serverUrl) {
  await page.goto(serverUrl);
  await page.waitForSelector("#infini-shell, .project-startup-error", { timeout: 25000 });
  assert.equal(await page.locator(".project-startup-error").count(), 0, "a clean local profile opens without a project error");
  const skip = page.locator("#welcome-skip");
  if (await skip.count() && await skip.isVisible()) await skip.click();
  await page.locator("#journey-step-fit").click();
  const details = page.locator("#project-manager-host .project-manager-details");
  await details.waitFor({ state: "attached" });
  if (!await details.evaluate((element) => element.open)) await details.locator("summary").click();
  await page.locator("#project-manager-host .project-tech-pack-share").waitFor({ state: "visible" });
}

async function measureLayout(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(100);
  const layout = await page.evaluate(() => {
    const section = document.querySelector(".project-tech-pack-share");
    if (!section) throw new Error("The Tech Pack share controls are not mounted.");
    const bounds = section.getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      section: { left: bounds.left, right: bounds.right, width: bounds.width },
    };
  });
  assert.ok(layout.documentWidth <= viewport.width, `document has no horizontal overflow at ${viewport.width}px`);
  assert.ok(layout.bodyWidth <= viewport.width, `body has no horizontal overflow at ${viewport.width}px`);
  assert.ok(layout.section.left >= 0 && layout.section.right <= viewport.width,
    `review controls fit the ${viewport.width}px viewport`);
  return layout;
}

async function main() {
  const profile = makeTempDir("infinidrip-s778-tech-pack-freeze-");
  const server = await startPreviewServer();
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      headless: true,
      acceptDownloads: true,
      viewport: VIEWPORTS[0],
    });
    const page = context.pages()[0] ?? await context.newPage();
    page.setDefaultTimeout(15000);
    const browserMessages = [];
    page.on("pageerror", (error) => browserMessages.push({ type: "pageerror", message: error.message }));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) browserMessages.push({ type: message.type(), message: message.text() });
    });
    page.on("requestfailed", (request) => browserMessages.push({ type: "requestfailed", url: request.url() }));

    await openReadyStyle(page, server.url);
    const share = page.locator("#project-manager-host .project-tech-pack-share");
    const draftStatus = await share.locator("p").first().innerText();
    const revisionMatch = draftStatus.match(/saved revision ([0-9a-f-]{36})/i);
    assert.ok(revisionMatch, `the current exact saved revision is visible: ${draftStatus}`);
    const revisionId = revisionMatch[1];

    const coverScope = share.locator('[data-tech-pack-share-scope="cover"]');
    await coverScope.focus();
    await page.keyboard.press("Space");
    assert.equal(await coverScope.isChecked(), true, "keyboard Space selects the cover review scope");
    const scopeLabel = await coverScope.locator("xpath=..").innerText();
    const countMatch = scopeLabel.match(/·\s*(\d+) fields/);
    assert.ok(countMatch, `the selected field count is visible: ${scopeLabel}`);
    const scopedFieldCount = Number(countMatch[1]);
    await share.locator("#tech-pack-share-actor").fill("S778 local reviewer (self-attested)");

    const startReview = share.locator('[data-project-action="begin-tech-pack-review"]');
    await startReview.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction((expected) => document.querySelector(".project-tech-pack-share")?.textContent?.includes(`${expected} fields are bound to this approval`), scopedFieldCount);
    assert.match(await share.locator("p").first().innerText(), new RegExp(`saved revision ${revisionId}`));

    await share.locator("#tech-pack-share-actor").fill("S778 local approver (self-attested)");
    const approve = share.locator('[data-project-action="approve-tech-pack-review"]');
    await approve.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector(".project-tech-pack-share")?.textContent?.includes("State: Scoped approval recorded"));
    assert.match(await share.locator("p").first().innerText(), new RegExp(`saved revision ${revisionId}`));

    await share.locator("#tech-pack-share-actor").fill("S778 local freezer (self-attested)");
    let confirmation = null;
    page.once("dialog", async (dialog) => {
      confirmation = { type: dialog.type(), message: dialog.message() };
      await dialog.accept();
    });
    const freeze = share.locator('[data-project-action="freeze-tech-pack-share"]');
    await freeze.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Frozen 2 Tech Pack share files"), null, { timeout: 45000 });
    assert.equal(confirmation?.type, "confirm");
    for (const expected of [
      `revision ${revisionId}`,
      `${scopedFieldCount} saved fields`,
      "Files: production-pack.techpack.zip",
      "production-pack.pdf",
      "self-attested",
      "does not establish physical fit",
    ]) assert.ok(confirmation.message.includes(expected), `confirmation includes ${expected}`);

    const frozenShare = page.locator("#project-manager-host .project-tech-pack-share");
    assert.match(await frozenShare.locator("p").first().innerText(), new RegExp(`saved revision ${revisionId}`));
    assert.match(await frozenShare.innerText(), /Editing and saving a new Tech Pack revision returns its review state to Draft and keeps earlier frozen bytes available\./);
    const downloads = page.locator('#project-manager-host [data-project-action="download-frozen"]');
    assert.equal(await downloads.count(), 2, "the frozen exact set exposes precisely the ZIP and PDF");
    const downloadNames = (await downloads.allInnerTexts()).map((value) => value.replace(/^Download\s+/, "").split(" · ")[0]).sort();
    assert.deepEqual(downloadNames, EXPECTED_FILES);
    const frozenHistory = page.locator("#project-manager-host .project-revision-history");
    assert.match(await frozenHistory.innerText(), /2 verified files/);

    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    const savedDownloads = [];
    for (const downloadButton of await downloads.all()) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadButton.click(),
      ]);
      const outputPath = path.join(EVIDENCE_DIR, download.suggestedFilename());
      await download.saveAs(outputPath);
      const bytes = fs.readFileSync(outputPath);
      assert.ok(bytes.length > 0, `${download.suggestedFilename()} downloads non-empty stored bytes`);
      savedDownloads.push({ name: download.suggestedFilename(), byteLength: bytes.length,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        path: path.relative(ROOT, outputPath).split(path.sep).join("/"), });
    }
    assert.deepEqual(savedDownloads.map((download) => download.name).sort(), EXPECTED_FILES);

    const viewports = [];
    const screenshots = [];
    for (const viewport of VIEWPORTS) {
      const layout = await measureLayout(page, viewport);
      const shareForCapture = page.locator("#project-manager-host .project-tech-pack-share");
      const inspector = page.locator("#studio-inspector");
      const viewportScreenshots = {};
      for (const position of ["top", "bottom"]) {
        if (position === "top") {
          await shareForCapture.evaluate((element) => element.scrollIntoView({ block: "start", inline: "nearest" }));
        } else {
          await inspector.evaluate((element) => {
            const share = element.querySelector(".project-tech-pack-share");
            if (!share) throw new Error("The Tech Pack share controls are not mounted in the inspector.");
            element.scrollTop += share.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom;
          });
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(100);
        const fileName = `S778-freeze-${viewport.width}x${viewport.height}-${position}.png`;
        const outputPath = path.join(EVIDENCE_DIR, fileName);
        await page.screenshot({ path: outputPath, fullPage: false });
        const screenshot = {
          viewport: layout.viewport,
          position,
          path: path.relative(ROOT, outputPath).split(path.sep).join("/"),
          sha256: crypto.createHash("sha256").update(fs.readFileSync(outputPath)).digest("hex"),
        };
        screenshots.push(screenshot);
        viewportScreenshots[position] = fileName;
      }
      viewports.push({ ...layout, screenshots: viewportScreenshots });
    }
    assert.deepEqual(browserMessages, [], "the frozen flow has no browser errors, warnings or failed requests");
    const report = {
      slice: 778,
      status: "passed",
      createdAt: new Date().toISOString(),
      browser: await page.evaluate(() => navigator.userAgent),
      revisionId,
      scope: { group: "cover", fieldCount: scopedFieldCount },
      confirmation: confirmation.message,
      artifacts: downloadNames,
      downloads: savedDownloads,
      staleGuidance: "Editing and saving a new Tech Pack revision returns its review state to Draft and keeps earlier frozen bytes available.",
      viewports,
      screenshots,
      browserMessages,
    };
    const reportPath = path.join(EVIDENCE_DIR, "S778-chromium-freeze-review.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, reportPath: path.relative(ROOT, reportPath).split(path.sep).join("/") }, null, 2));
  } finally {
    await context?.close().catch(() => undefined);
    server.stop();
    removeTempDir(profile);
  }
}

void main().catch((error) => {
  console.error("S778 CHROMIUM FREEZE REVIEW FAILED:", error.stack || error);
  process.exitCode = 1;
});
