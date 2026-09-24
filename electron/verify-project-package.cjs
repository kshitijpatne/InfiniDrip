// Clean-profile browser and Electron proof for G02/F01 project packages.
// Every artifact comes from the user-facing export/import controls; only the
// test fixture artwork record is seeded directly so the proof includes real
// image bytes without depending on a future artwork-picker redesign.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const {
  closeApp,
  launch,
  makeTempDir,
  removeTempDir,
  startPreviewServer,
} = require("./verify-common.cjs");

const SVG_ASSET_ID = `local-${crypto.randomUUID().replaceAll("-", "")}-svg`;
const STYLE_NAME = "G02 Package Proof Style";

async function waitForReady(page) {
  page.setDefaultTimeout(15000);
  await page.waitForSelector("#infini-shell", { state: "attached", timeout: 25000 });
  await page.waitForSelector("#project-manager-host .project-manager-details", { state: "attached", timeout: 25000 });
  const skip = page.locator("#welcome-skip");
  if (await skip.count() && await skip.isVisible()) await skip.click();
  return page;
}

async function showProjectManager(page) {
  const details = page.locator("#project-manager-host .project-manager-details");
  if (!await details.evaluate((element) => element.open)) await details.locator("summary").click();
  return page.locator("#project-manager-host");
}

async function waitForManagerStatus(page, text) {
  await page.waitForFunction((expected) =>
    document.querySelector("#project-manager-status")?.textContent?.includes(expected) ?? false,
  text, { timeout: 25000 }).catch(async (error) => {
    const status = await page.locator("#project-manager-status").textContent().catch(() => "<missing>");
    throw new Error(`Expected project manager status ${JSON.stringify(text)}; got ${JSON.stringify(status)}; ${error.message}`);
  });
}

async function createSourceProject(page) {
  await waitForReady(page);
  await page.locator('input[data-field="chest"]').first().fill("104");
  await page.waitForFunction(() => /recovery saved/i.test(document.querySelector("#project-persistence-state")?.textContent ?? ""));
  const manager = await showProjectManager(page);
  await manager.locator("#project-style-name").fill(STYLE_NAME);
  await manager.locator('[data-project-action="create"]').click();
  await waitForManagerStatus(page, `Created ${STYLE_NAME}`);
}

async function seedArtworkReference(page, electron) {
  return page.evaluate(async ({ assetId, isElectron }) => {
    const svgDocument = document.implementation.createDocument("http://www.w3.org/2000/svg", "svg", null);
    const root = svgDocument.documentElement;
    root.setAttribute("width", "10");
    root.setAttribute("height", "10");
    const rect = svgDocument.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "10");
    rect.setAttribute("height", "10");
    rect.setAttribute("fill", "#c85d3a");
    root.appendChild(rect);
    const svg = new XMLSerializer().serializeToString(root);
    const bytes = new TextEncoder().encode(svg);

    if (isElectron) {
      await window.electronAPI.putArtworkAsset({
        assetId, name: "g02-package-proof.svg", mimeType: "image/svg+xml", bytes,
      });
    } else {
      const artworkDb = await new Promise((resolve, reject) => {
        const request = indexedDB.open("infinidrip-local-artwork", 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("assets")) request.result.createObjectStore("assets", { keyPath: "assetId" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Artwork database open failed."));
      });
      const artworkTransaction = artworkDb.transaction(["assets"], "readwrite");
      artworkTransaction.objectStore("assets").put({
        assetId, name: "g02-package-proof.svg", mimeType: "image/svg+xml",
        blob: new Blob([bytes], { type: "image/svg+xml" }),
      });
      await new Promise((resolve, reject) => {
        artworkTransaction.oncomplete = resolve;
        artworkTransaction.onabort = () => reject(artworkTransaction.error ?? new Error("Artwork write aborted."));
        artworkTransaction.onerror = () => reject(artworkTransaction.error ?? new Error("Artwork write failed."));
      });
      artworkDb.close();
    }

    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Project database open failed."));
    });
    let activeStyleId = "";
    let projectId = "";
    const transaction = database.transaction(["meta", "projects", "styles"], "readwrite");
    const meta = transaction.objectStore("meta");
    const projects = transaction.objectStore("projects");
    const styles = transaction.objectStore("styles");
    const selectionRequest = meta.get("activeSelection");
    selectionRequest.onsuccess = () => {
      const selection = selectionRequest.result;
      if (!selection) { transaction.abort(); return; }
      const projectRequest = projects.get(selection.projectId);
      projectRequest.onsuccess = () => {
        const project = projectRequest.result;
        if (!project || project.activeStyleId !== selection.styleId) { transaction.abort(); return; }
        const styleRequest = styles.get(project.activeStyleId);
        styleRequest.onsuccess = () => {
          const style = styleRequest.result;
          if (!style) { transaction.abort(); return; }
          const surface = { ...(style.design.surface ?? {}) };
          const surfaceKey = `${style.recipeId}/${style.name}`;
          const existingSurface = surface[surfaceKey] ?? { styleName: style.name, placements: [] };
          surface[surfaceKey] = {
            ...existingSurface,
            styleName: style.name,
            placements: [...(existingSurface.placements ?? []), {
              id: `g02-proof-${assetId.slice(-12)}`,
              kind: "print",
              pieceRole: "body-front",
              widthCm: 4,
              heightCm: 3,
              transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 },
              zOrder: 1,
              sourceName: "Local G02 package verification fixture",
              assetId,
            }],
          };
          const now = new Date(Math.max(Date.now(), Date.parse(project.updatedAt) + 1, Date.parse(style.updatedAt) + 1)).toISOString();
          activeStyleId = style.id;
          projectId = project.id;
          styles.put({ ...style, revision: style.revision + 1, updatedAt: now, design: { ...style.design, surface } });
          projects.put({ ...project, revision: project.revision + 1, updatedAt: now });
        };
        styleRequest.onerror = () => transaction.abort();
      };
      projectRequest.onerror = () => transaction.abort();
    };
    selectionRequest.onerror = () => transaction.abort();
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error ?? new Error("Artwork placement reference write aborted."));
      transaction.onerror = () => reject(transaction.error ?? new Error("Artwork placement reference write failed."));
    });
    database.close();
    return { assetId, activeStyleId, projectId, bytes: Array.from(bytes), svg };
  }, { assetId: SVG_ASSET_ID, isElectron: electron });
}

async function projectSnapshot(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Project database open failed."));
    });
    const transaction = database.transaction(["projects", "styles", "recoveries"], "readonly");
    const readAll = (store) => new Promise((resolve, reject) => {
      const request = transaction.objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error(`Could not read ${store}.`));
    });
    const [projects, styles, recoveries] = await Promise.all([
      readAll("projects"), readAll("styles"), readAll("recoveries"),
    ]);
    database.close();
    return { projects, styles, recoveries };
  });
}

async function artworkRecord(page, assetId, electron) {
  return page.evaluate(async ({ id, isElectron }) => {
    if (isElectron) {
      const asset = await window.electronAPI.getArtworkAsset(id);
      return asset ? {
        assetId: asset.assetId, name: asset.name, mimeType: asset.mimeType, bytes: Array.from(asset.bytes),
      } : null;
    }
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-local-artwork", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Artwork database open failed."));
    });
    const transaction = database.transaction(["assets"], "readonly");
    const request = transaction.objectStore("assets").get(id);
    const asset = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error("Artwork read failed."));
    });
    const result = asset ? {
      assetId: asset.assetId, name: asset.name, mimeType: asset.mimeType,
      bytes: Array.from(new Uint8Array(await asset.blob.arrayBuffer())),
    } : null;
    database.close();
    return result;
  }, { id: assetId, isElectron: electron });
}

function verifySnapshot(snapshot, seeded) {
  const activeProject = snapshot.projects.find((project) => project.id === seeded.projectId);
  assert.ok(activeProject, "the imported source project is present");
  assert.equal(activeProject.activeStyleId, seeded.activeStyleId, "the selected active style is preserved");
  const sourceStyles = snapshot.styles.filter((style) => style.projectId === activeProject.id);
  assert.equal(sourceStyles.length, 2, "both named source styles are present");
  assert.equal(sourceStyles.find((style) => style.id === seeded.activeStyleId)?.name, STYLE_NAME);
  const sourceStyleIds = new Set(activeProject.styleIds);
  const sourceRecoveries = snapshot.recoveries.filter((recovery) => sourceStyleIds.has(recovery.styleId));
  assert.equal(sourceRecoveries.length, 1, "the other style's unfinished recovery is carried in the package");
  assert.notEqual(sourceRecoveries[0].styleId, seeded.activeStyleId, "recovery stays scoped to its originating style");
  assert.equal(sourceStyles.find((style) => style.id === sourceRecoveries[0].styleId)?.design.measurements.chest, 100,
    "recovery does not replace the last explicitly saved design");
}

async function verifyBrowser(serverUrl, outputDir) {
  const sourceProfile = makeTempDir("infinidrip-browser-package-source-");
  const targetProfile = makeTempDir("infinidrip-browser-package-target-");
  let sourceContext;
  let targetContext;
  try {
    sourceContext = await chromium.launchPersistentContext(sourceProfile, { headless: true, acceptDownloads: true });
    let page = sourceContext.pages()[0] ?? await sourceContext.newPage();
    await page.goto(serverUrl);
    await createSourceProject(page);
    let seeded = await seedArtworkReference(page, false);
    await page.reload();
    await waitForReady(page);
    const sourceSnapshot = await projectSnapshot(page);
    verifySnapshot(sourceSnapshot, seeded);

    const packagePath = path.join(outputDir, "browser-project.infinidrip.zip");
    const downloadPromise = page.waitForEvent("download");
    await (await showProjectManager(page)).locator('[data-project-action="export-package"]').click();
    const download = await downloadPromise;
    await download.saveAs(packagePath);
    await waitForManagerStatus(page, "Project backup exported.");
    const packageBytes = fs.readFileSync(packagePath);
    assert.equal(packageBytes.readUInt32LE(0), 0x04034b50, "browser download is a real local ZIP file");

    await sourceContext.close();
    sourceContext = undefined;
    targetContext = await chromium.launchPersistentContext(targetProfile, { headless: true, acceptDownloads: true });
    page = targetContext.pages()[0] ?? await targetContext.newPage();
    await page.goto(serverUrl);
    await waitForReady(page);
    await page.locator("#project-manager-host #project-package-file").setInputFiles(packagePath);
    await waitForManagerStatus(page, "Imported project:");
    let imported = await projectSnapshot(page);
    verifySnapshot(imported, seeded);
    let art = await artworkRecord(page, seeded.assetId, false);
    assert.equal(art.name, "g02-package-proof.svg");
    assert.deepEqual(art.bytes, seeded.bytes, "browser import retains sanitized artwork bytes byte-for-byte");

    await targetContext.close();
    targetContext = await chromium.launchPersistentContext(targetProfile, { headless: true, acceptDownloads: true });
    page = targetContext.pages()[0] ?? await targetContext.newPage();
    await page.goto(serverUrl);
    await waitForReady(page);
    imported = await projectSnapshot(page);
    verifySnapshot(imported, seeded);
    art = await artworkRecord(page, seeded.assetId, false);
    assert.deepEqual(art.bytes, seeded.bytes, "browser project and artwork survive a clean-profile app restart");
    return {
      result: "PASS",
      browser: await page.evaluate(() => navigator.userAgent),
      packageBytes: packageBytes.byteLength,
      packageSha256: crypto.createHash("sha256").update(packageBytes).digest("hex"),
      styles: imported.styles.length,
      recoveries: imported.recoveries.length,
      artworkBytes: art.bytes.length,
      artworkSha256: crypto.createHash("sha256").update(Buffer.from(art.bytes)).digest("hex"),
      survivesRestart: true,
    };
  } finally {
    await sourceContext?.close().catch(() => undefined);
    await targetContext?.close().catch(() => undefined);
    removeTempDir(sourceProfile);
    removeTempDir(targetProfile);
  }
}

async function verifyElectron(serverUrl, outputDir) {
  const sourceProfile = makeTempDir("infinidrip-electron-package-source-");
  const targetProfile = makeTempDir("infinidrip-electron-package-target-");
  const packagePath = path.join(outputDir, "electron-project.infinidrip.zip");
  let sourceApp;
  let targetApp;
  try {
    sourceApp = await launch({ userDataDir: sourceProfile, devServerUrl: serverUrl });
    let page = await sourceApp.firstWindow();
    await createSourceProject(page);
    const seeded = await seedArtworkReference(page, true);
    await page.reload();
    await waitForReady(page);
    verifySnapshot(await projectSnapshot(page), seeded);
    assert.equal(await page.evaluate(() => typeof window.electronAPI?.saveProjectPackage), "function",
      "the packaged Electron preload exposes the project-package binary bridge");
    await sourceApp.evaluate(({ dialog }, destination) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination });
    }, packagePath);
    await (await showProjectManager(page)).locator('[data-project-action="export-package"]').click();
    await waitForManagerStatus(page, "Project backup exported.");
    const packageBytes = fs.readFileSync(packagePath);
    assert.equal(packageBytes.readUInt32LE(0), 0x04034b50, "Electron native save is a real local ZIP file");
    await closeApp(sourceApp);
    sourceApp = undefined;

    targetApp = await launch({ userDataDir: targetProfile, devServerUrl: serverUrl });
    page = await targetApp.firstWindow();
    await waitForReady(page);
    await showProjectManager(page);
    await page.locator("#project-manager-host #project-package-file").setInputFiles(packagePath);
    await waitForManagerStatus(page, "Imported project:");
    let imported = await projectSnapshot(page);
    verifySnapshot(imported, seeded);
    let art = await artworkRecord(page, seeded.assetId, true);
    assert.deepEqual(art.bytes, seeded.bytes, "Electron import retains sanitized artwork bytes byte-for-byte");

    await closeApp(targetApp);
    targetApp = undefined;
    targetApp = await launch({ userDataDir: targetProfile, devServerUrl: serverUrl });
    page = await targetApp.firstWindow();
    await waitForReady(page);
    imported = await projectSnapshot(page);
    verifySnapshot(imported, seeded);
    art = await artworkRecord(page, seeded.assetId, true);
    assert.deepEqual(art.bytes, seeded.bytes, "Electron project and artwork survive an app restart");
    return {
      result: "PASS",
      electronVersion: require("electron/package.json").version,
      chromiumVersion: await targetApp.evaluate(() => process.versions.chrome),
      packageBytes: packageBytes.byteLength,
      packageSha256: crypto.createHash("sha256").update(packageBytes).digest("hex"),
      styles: imported.styles.length,
      recoveries: imported.recoveries.length,
      artworkBytes: art.bytes.length,
      artworkSha256: crypto.createHash("sha256").update(Buffer.from(art.bytes)).digest("hex"),
      survivesRestart: true,
    };
  } finally {
    await closeApp(sourceApp);
    await closeApp(targetApp);
    removeTempDir(sourceProfile);
    removeTempDir(targetProfile);
  }
}

async function main() {
  const outputDir = makeTempDir("infinidrip-project-package-output-");
  let server;
  try {
    server = await startPreviewServer();
    const browser = await verifyBrowser(server.url, outputDir);
    const electron = await verifyElectron(server.url, outputDir);
    console.log(JSON.stringify({ result: "PASS", browser, electron }, null, 2));
  } catch (error) {
    console.error("PROJECT PACKAGE VERIFY FAILED:", error);
    process.exitCode = 1;
  } finally {
    server?.stop();
    removeTempDir(outputDir);
  }
}

void main();
