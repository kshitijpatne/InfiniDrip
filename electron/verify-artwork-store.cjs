// Verifies the actual renderer → preload → main-process artwork store with an
// isolated Electron profile, including on-disk persistence across a restart.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  closeApp,
  launch,
  makeTempDir,
  removeTempDir,
  startPreviewServer,
} = require("./verify-common.cjs");

async function main() {
  const userDataDir = makeTempDir("infinidrip-verify-artwork-");
  let server;
  let app;
  let ok = false;
  const uuid = crypto.randomUUID().replace(/-/g, "");
  const assetId = `local-${uuid}-svg`;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="#2255aa"/></svg>';
  const record = { assetId, name: "local-proof.svg", mimeType: "image/svg+xml", bytes: [...Buffer.from(svg)] };
  try {
    server = await startPreviewServer();
    app = await launch({ userDataDir, devServerUrl: server.url });
    const win = await app.firstWindow();

    await win.waitForSelector("#infini-shell", { state: "attached", timeout: 15000 });
    const skipWelcome = win.locator("#welcome-skip");
    if (await skipWelcome.count() && await skipWelcome.first().isVisible()) await skipWelcome.first().click();
    await win.locator("#journey-step-fit").click();
    await win.locator("#surface-new-file").setInputFiles({
      name: "desktop-ui-leaf.svg", mimeType: "image/svg+xml", buffer: Buffer.from(svg),
    });
    await win.waitForFunction(() => document.querySelector("#surface-new-file-status")?.textContent?.includes("Ready:"));
    await win.locator("#surface-new-id").fill("desktop-ui-leaf");
    await win.locator("#surface-new-role").fill("front");
    await win.locator("#surface-add").click();
    await win.waitForFunction(() => document.querySelector("[data-surface-asset-status]")?.textContent?.includes("Stored locally:"));
    const uiAssetId = await win.locator("img[data-surface-asset-preview]").getAttribute("data-asset-id");
    if (!uiAssetId || !uiAssetId.startsWith("local-")) throw new Error("The desktop UI did not attach a stable local asset ID.");
    await win.locator("#save-pattern").click();
    await win.setViewportSize({ width: 375, height: 800 });
    const narrowLayout = await win.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    const noNarrowOverflow = narrowLayout.scrollWidth <= narrowLayout.width;
    if (!noNarrowOverflow) throw new Error(`The imported-artwork UI overflows at 375px: ${JSON.stringify(narrowLayout)}`);
    await win.reload();
    await win.waitForSelector("#infini-shell", { state: "attached", timeout: 15000 });
    await win.waitForFunction(() => document.querySelector("[data-surface-asset-status]")?.textContent?.includes("Stored locally:"));
    const reloadedUiAssetId = await win.locator("img[data-surface-asset-preview]").getAttribute("data-asset-id");
    const uiReloadOk = reloadedUiAssetId === uiAssetId;
    if (!uiReloadOk) throw new Error("The desktop UI did not restore its saved artwork reference after reload.");

    const stored = await win.evaluate(async (input) => {
      const api = window.electronAPI;
      if (!api?.putArtworkAsset || !api.getArtworkAsset || !api.removeArtworkAsset) throw new Error("Artwork bridge is missing.");
      await api.putArtworkAsset({ ...input, bytes: Uint8Array.from(input.bytes) });
      const loaded = await api.getArtworkAsset(input.assetId);
      return loaded && {
        assetId: loaded.assetId,
        name: loaded.name,
        mimeType: loaded.mimeType,
        bytes: Array.from(loaded.bytes),
      };
    }, record);
    const expectedBytes = [...Buffer.from(svg)];
    const roundTripOk = JSON.stringify(stored) === JSON.stringify({
      assetId, name: record.name, mimeType: record.mimeType, bytes: expectedBytes,
    });
    const diskPath = path.join(userDataDir, "artwork-assets", `${assetId}.asset`);
    const diskEnvelopeOk = fs.existsSync(diskPath) && fs.readFileSync(diskPath).subarray(0, 4).toString("ascii") === "IDAR";
    const uiDiskPath = path.join(userDataDir, "artwork-assets", `${uiAssetId}.asset`);
    const uiDiskOk = fs.existsSync(uiDiskPath);

    const rejected = await win.evaluate(async () => {
      try {
        await window.electronAPI.putArtworkAsset({
          assetId: "../outside.svg", name: "unsafe.svg", mimeType: "image/svg+xml",
          bytes: new Uint8Array([60, 115, 118, 103, 47, 62]),
        });
        return false;
      } catch (error) { return String(error).includes("Invalid local artwork ID"); }
    });
    const unsafeSvgRejected = await win.evaluate(async () => {
      try {
        await window.electronAPI.putArtworkAsset({
          assetId: "local-11111111111141118111111111111111-svg", name: "unsafe.svg", mimeType: "image/svg+xml",
          bytes: Uint8Array.from(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')),
        });
        return false;
      } catch (error) { return String(error).includes("safety checks"); }
    });
    console.log(`[desktop artwork UI] imported and reloaded: ${uiReloadOk}; 375px layout has no horizontal overflow: ${noNarrowOverflow}; local asset record exists: ${uiDiskOk}`);
    console.log(`[desktop artwork IPC] exact byte round-trip: ${roundTripOk}; app-data record: ${diskEnvelopeOk}; traversal rejected: ${rejected}; active SVG rejected: ${unsafeSvgRejected}`);
    await closeApp(app);
    app = await launch({ userDataDir, devServerUrl: server.url });
    const reloaded = await (await app.firstWindow()).evaluate(async (id) => {
      const asset = await window.electronAPI.getArtworkAsset(id);
      return asset && { name: asset.name, mimeType: asset.mimeType, bytes: Array.from(asset.bytes) };
    }, assetId);
    const reloadOk = JSON.stringify(reloaded) === JSON.stringify({ name: record.name, mimeType: record.mimeType, bytes: expectedBytes });
    await (await app.firstWindow()).evaluate((id) => window.electronAPI.removeArtworkAsset(id), assetId);
    const removedOk = !fs.existsSync(diskPath);
    ok = uiReloadOk && noNarrowOverflow && uiDiskOk && roundTripOk && diskEnvelopeOk && rejected && unsafeSvgRejected && reloadOk && removedOk;
    console.log(`[desktop artwork IPC] survives app restart: ${reloadOk}; remove cleans app-data file: ${removedOk}`);
    console.log(ok ? "PASS" : "FAIL");
  } catch (error) {
    console.error("VERIFY FAILED:", error);
  } finally {
    await closeApp(app);
    server?.stop();
    removeTempDir(userDataDir);
  }
  process.exit(ok ? 0 : 1);
}

void main();
