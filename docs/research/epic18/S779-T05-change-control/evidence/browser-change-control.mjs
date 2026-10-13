import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const evidenceDirectory = dirname(fileURLToPath(import.meta.url));
await mkdir(evidenceDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const page = await context.newPage();
const pageErrors = [];
const dialogs = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("dialog", async (dialog) => {
  dialogs.push(dialog.message());
  await dialog.accept();
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function savedRevisionId(text) {
  const match = text.match(/saved revision ([0-9a-f-]{36})/i);
  assert.ok(match, "The share control must identify its bound saved revision.");
  return match[1];
}

async function saveDownload(button, filename) {
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  const path = join(evidenceDirectory, filename);
  await download.saveAs(path);
  const bytes = await readFile(path);
  return { path, bytes, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

async function saveField(property, value, kind = "input") {
  const controls = page.locator('[data-t01-controls="cover.styleCode"]');
  if (await controls.getAttribute("open") === null) await controls.locator("summary").click();
  const field = page.locator(`[data-t01-field-id="cover.styleCode"][data-t01-field-property="${property}"]`);
  if (kind === "select") await field.selectOption(value);
  else await field.fill(value);
}

try {
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.locator("#welcome-skip").click();
  await page.locator("#journey-step-fit").click();
  const projectDetails = page.locator(".project-manager-details");
  if (await projectDetails.getAttribute("open") === null) await projectDetails.locator("summary").click();
  await page.locator(".project-tech-pack-share").waitFor({ state: "visible" });
  const frozenRevisionId = savedRevisionId(await page.locator(".project-tech-pack-share").innerText());

  await page.locator("[data-tech-pack-share-scope='cover']").check();
  await page.locator("#tech-pack-share-actor").fill("S779 local browser reviewer");
  await page.locator("[data-project-action='begin-tech-pack-review']").click();
  await page.waitForFunction(() => document.querySelector(".project-tech-pack-share")?.textContent?.includes("In review"));
  await page.locator("#tech-pack-share-actor").fill("S779 local browser approver");
  await page.locator("[data-project-action='approve-tech-pack-review']").click();
  await page.waitForFunction(() => document.querySelector(".project-tech-pack-share")?.textContent?.includes("Scoped approval recorded"));
  await page.locator("#tech-pack-share-actor").fill("S779 local browser freezer");
  await page.locator("[data-project-action='freeze-tech-pack-share']").click();
  await page.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Frozen 2 Tech Pack share files"), null, { timeout: 45000 });

  const oldZipButton = page.locator("[data-project-action='download-frozen'][data-artifact-id='tech-pack-exchange-zip']").first();
  const originalManifestId = await oldZipButton.getAttribute("data-manifest-id");
  assert.ok(originalManifestId, "The first frozen Tech Pack share must expose its immutable manifest ID.");
  const beforeZip = await saveDownload(oldZipButton, "reviewed-before-edit-tech-pack.zip");
  const beforePdf = await saveDownload(page.locator(`[data-project-action='download-frozen'][data-manifest-id='${originalManifestId}'][data-artifact-id='tech-pack-production-pdf']`),
    "reviewed-before-edit-tech-pack.pdf");
  await page.waitForFunction(() => document.querySelector(".project-revision-history")?.textContent?.includes("Current for saved revision"));

  await saveField("value", "S779-EDITED-LOCAL");
  await saveField("provenance", "USER_CAPTURED", "select");
  await saveField("evidenceStatus", "USER_CONFIRMED", "select");
  await saveField("validationStatus", "VALID", "select");
  await saveField("method", "Edited after local freeze");
  await saveField("capturedBy", "S779 local browser maker");
  await saveField("capturedAt", "2026-10-13T18:18:01.000Z");
  await saveField("unresolvedReason", "");
  await saveField("nextAction", "");
  const saveButton = page.locator("[data-project-action='save-tech-pack']");
  await page.waitForFunction(() => {
    const button = document.querySelector("[data-project-action='save-tech-pack']");
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await saveButton.click();
  await page.locator(".project-tech-pack-share-stale").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector(".project-revision-history")?.textContent?.includes("Historical r1 · stale for current revision"));
  const currentRevisionId = savedRevisionId(await page.locator(".project-tech-pack-share").innerText());
  assert.notEqual(currentRevisionId, frozenRevisionId, "Saving an edit must bind a new saved revision.");
  const afterZip = await saveDownload(page.locator(`[data-project-action='download-frozen'][data-manifest-id='${originalManifestId}'][data-artifact-id='tech-pack-exchange-zip']`),
    "reviewed-historical-after-edit-tech-pack.zip");
  const afterPdf = await saveDownload(page.locator(`[data-project-action='download-frozen'][data-manifest-id='${originalManifestId}'][data-artifact-id='tech-pack-production-pdf']`),
    "reviewed-historical-after-edit-tech-pack.pdf");
  assert.equal(afterZip.sha256, beforeZip.sha256, "The original frozen ZIP bytes must remain identical after edit.");
  assert.equal(afterPdf.sha256, beforePdf.sha256, "The original frozen PDF bytes must remain identical after edit.");

  const responsive = [];
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.locator(".project-tech-pack-share-stale").scrollIntoViewIfNeeded();
    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    assert.equal(dimensions.viewportWidth, viewport.width);
    assert.equal(dimensions.viewportHeight, viewport.height);
    assert.ok(dimensions.documentWidth <= viewport.width, `Horizontal document overflow at ${viewport.width}px: ${dimensions.documentWidth}px.`);
    assert.ok(dimensions.bodyWidth <= viewport.width, `Horizontal body overflow at ${viewport.width}px: ${dimensions.bodyWidth}px.`);
    const staleScreenshotPath = join(evidenceDirectory, `stale-current-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: staleScreenshotPath });
    const zipButton = page.locator(`[data-project-action='download-frozen'][data-manifest-id='${originalManifestId}'][data-artifact-id='tech-pack-exchange-zip']`);
    const pdfButton = page.locator(`[data-project-action='download-frozen'][data-manifest-id='${originalManifestId}'][data-artifact-id='tech-pack-production-pdf']`);
    await zipButton.scrollIntoViewIfNeeded();
    const zipBounds = await zipButton.boundingBox();
    const pdfBounds = await pdfButton.boundingBox();
    assert.ok(zipBounds && pdfBounds, `Retained download buttons must render at ${viewport.width}px.`);
    const downloadsScreenshotPath = join(evidenceDirectory, `historical-downloads-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: downloadsScreenshotPath });
    responsive.push({ ...dimensions, staleScreenshotPath, downloadsScreenshotPath, zipBounds, pdfBounds });
  }

  const keyboardButton = page.locator(`[data-project-action='download-frozen'][data-manifest-id='${originalManifestId}'][data-artifact-id='tech-pack-production-pdf']`);
  await keyboardButton.focus();
  const [keyboardDownload] = await Promise.all([page.waitForEvent("download"), page.keyboard.press("Enter")]);
  const keyboardPath = join(evidenceDirectory, "reviewed-historical-keyboard-download.pdf");
  await keyboardDownload.saveAs(keyboardPath);
  assert.equal(sha256(await readFile(keyboardPath)), beforePdf.sha256, "Keyboard activation must retrieve the same historical PDF bytes.");
  assert.deepEqual(pageErrors, [], "The real browser flow must not emit page errors.");
  assert.ok(dialogs.some((message) => message.includes("revision")), "The freeze flow must confirm its exact saved revision.");

  const report = {
    outcome: "passed",
    sequence: ["fresh local project", "scoped review", "approval", "freeze", "ZIP/PDF downloads", "T01 edit and save", "historical stale labeling", "byte-identical historical re-download", "keyboard activation"],
    originalManifestId,
    before: {
      revisionId: frozenRevisionId,
      zip: { byteLength: beforeZip.byteLength, sha256: beforeZip.sha256, path: beforeZip.path },
      pdf: { byteLength: beforePdf.byteLength, sha256: beforePdf.sha256, path: beforePdf.path },
    },
    afterEdit: {
      currentRevisionId,
      zip: { byteLength: afterZip.byteLength, sha256: afterZip.sha256, path: afterZip.path },
      pdf: { byteLength: afterPdf.byteLength, sha256: afterPdf.sha256, path: afterPdf.path },
    },
    keyboardPdfPath: keyboardPath,
    responsive,
    dialogs,
    pageErrors,
  };
  await writeFile(join(evidenceDirectory, "browser-change-control-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
