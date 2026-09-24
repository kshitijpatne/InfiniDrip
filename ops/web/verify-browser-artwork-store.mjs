import assert from "node:assert/strict";
import { chromium } from "playwright";
import verificationHelpers from "../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;

function svg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><rect width="12" height="12" fill="${fill}"/></svg>`;
}

async function dropArtwork(page, selector, name, content) {
  const bytes = [...Buffer.from(content)];
  return page.locator(selector).evaluate((target, payload) => {
    const dataTransfer = new DataTransfer();
    const file = new File([Uint8Array.from(payload.bytes)], payload.name, { type: "image/svg+xml" });
    dataTransfer.items.add(file);
    const dragover = new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer });
    target.dispatchEvent(dragover);
    const highlighted = target.classList.contains("is-dragging");
    const drop = new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer });
    target.dispatchEvent(drop);
    return {
      dragoverPrevented: dragover.defaultPrevented,
      highlighted,
      dropPrevented: drop.defaultPrevented,
    };
  }, { name, bytes });
}

async function main() {
  const preview = await startPreviewServer();
  let browser;
  const consoleErrors = [];
  const pageErrors = [];
  const remoteRequests = [];
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const origin = new URL(preview.url).origin;
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== origin) remoteRequests.push(request.url());
    });

    await page.goto(`${preview.url}/`, { waitUntil: "networkidle" });
    const welcome = page.locator("#welcome-skip");
    if (await welcome.isVisible()) await welcome.click();
    await page.locator("#journey-step-fit").click();

    const pickerSvg = svg("#2255aa");
    await page.locator("#surface-new-id").fill("web-picker-artwork");
    await page.locator("#surface-new-role").fill("front");
    await page.locator("#surface-new-file").setInputFiles({
      name: "web-picker.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(pickerSvg),
    });
    await page.waitForFunction(() => document.querySelector("#surface-new-file-status")?.textContent?.includes("Ready: web-picker.svg"));
    await page.locator("#surface-add").click();
    await page.waitForFunction(() => document.querySelector('[data-surface-row="0"] [data-surface-asset-status]')?.textContent?.includes("Stored locally: web-picker.svg"));
    const pickerAssetId = await page.locator('[data-surface-row="0"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    assert.match(pickerAssetId ?? "", /^local-/u, "picker import should have a stable local ID");

    await page.locator("#save-pattern").click();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector('[data-surface-row="0"] [data-surface-asset-status]')?.textContent?.includes("Stored locally: web-picker.svg"));
    const pickerReloadId = await page.locator('[data-surface-row="0"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    assert.equal(pickerReloadId, pickerAssetId, "browser picker asset should survive reload");

    await page.locator("#surface-new-id").fill("web-drop-artwork");
    await page.locator("#surface-new-role").fill("back");
    const createDrop = await dropArtwork(page, "[data-surface-new-dropzone]", "web-drop-created.svg", svg("#cc6633"));
    assert.deepEqual(createDrop, { dragoverPrevented: true, highlighted: true, dropPrevented: true });
    await page.waitForFunction(() => document.querySelector("#surface-new-file-status")?.textContent?.includes("Ready: web-drop-created.svg"));
    await page.locator("#surface-add").click();
    await page.waitForFunction(() => document.querySelector('[data-surface-row="1"] [data-surface-asset-status]')?.textContent?.includes("Stored locally: web-drop-created.svg"));
    const createdDropId = await page.locator('[data-surface-row="1"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    assert.match(createdDropId ?? "", /^local-/u, "dropped new placement should have a stable local ID");

    const replacementDrop = await dropArtwork(page, '[data-surface-row="0"]', "web-drop-replacement.svg", svg("#447744"));
    assert.deepEqual(replacementDrop, { dragoverPrevented: true, highlighted: true, dropPrevented: true });
    await page.waitForFunction(() => document.querySelector('[data-surface-row="0"] [data-surface-asset-status]')?.textContent?.includes("Stored locally: web-drop-replacement.svg"));
    const replacementDropId = await page.locator('[data-surface-row="0"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    assert.match(replacementDropId ?? "", /^local-/u, "dropped replacement should have a stable local ID");
    assert.notEqual(replacementDropId, pickerAssetId, "replacement should attach a new asset ID");

    const unsafeReplacement = await dropArtwork(
      page,
      '[data-surface-row="0"]',
      "web-drop-unsafe.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><script>alert(1)</script></svg>',
    );
    assert.deepEqual(unsafeReplacement, { dragoverPrevented: true, highlighted: true, dropPrevented: true });
    await page.waitForFunction(() => document.querySelector('[data-surface-row="0"] [data-surface-asset-status]')?.textContent?.includes("The previous placement is unchanged."));
    const rejectedReplacementId = await page.locator('[data-surface-row="0"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    assert.equal(rejectedReplacementId, replacementDropId, "unsafe dropped replacement must preserve the prior asset reference");

    await page.locator("#save-pattern").click();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() =>
      document.querySelector('[data-surface-row="0"] [data-surface-asset-status]')?.textContent?.includes("Stored locally: web-drop-replacement.svg") &&
      document.querySelector('[data-surface-row="1"] [data-surface-asset-status]')?.textContent?.includes("Stored locally: web-drop-created.svg"));
    const replacementReloadId = await page.locator('[data-surface-row="0"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    const createdDropReloadId = await page.locator('[data-surface-row="1"] img[data-surface-asset-preview]').getAttribute("data-asset-id");
    assert.equal(replacementReloadId, replacementDropId, "dropped replacement should survive reload");
    assert.equal(createdDropReloadId, createdDropId, "dropped new placement should survive reload");

    await page.setViewportSize({ width: 375, height: 800 });
    const narrowLayout = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(narrowLayout.scrollWidth <= narrowLayout.width, `narrow artwork layout overflows: ${JSON.stringify(narrowLayout)}`);
    assert.deepEqual(consoleErrors, [], "browser console should have no errors");
    assert.deepEqual(pageErrors, [], "browser should have no uncaught page errors");
    assert.deepEqual(remoteRequests, [], "artwork workflow should make no remote requests");

    console.log(JSON.stringify({
      status: "PASS",
      pickerReload: pickerReloadId === pickerAssetId,
      newDrop: { dragoverHandled: createDrop.dragoverPrevented, stableIdAfterReload: createdDropReloadId === createdDropId },
      replacementDrop: { dragoverHandled: replacementDrop.dragoverPrevented, stableIdAfterReload: replacementReloadId === replacementDropId },
      unsafeReplacementDrop: { rejected: rejectedReplacementId === replacementDropId, previousAssetPreservedAfterReload: replacementReloadId === replacementDropId },
      narrowLayout,
      consoleErrors,
      pageErrors,
      remoteRequests,
    }, null, 2));
    await context.close();
  } finally {
    await browser?.close();
    preview.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
