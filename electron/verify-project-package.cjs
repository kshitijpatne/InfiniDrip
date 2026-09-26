// Clean-profile browser and Electron proof for G02/F01 project packages.
// The package and its deterministic SVG artwork are created through the
// user-facing controls so the proof exercises the complete local file flow.
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

const EVIDENCE_DIR = path.join(__dirname, "..", "docs", "research", "epic15", "evidence");
const STYLE_NAME = "G02 Package Proof Style";

async function waitForReady(page) {
  page.setDefaultTimeout(15000);
  try {
    await page.waitForSelector("#infini-shell", { state: "attached", timeout: 25000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      body: document.body?.innerText?.slice(0, 1200) ?? "<no body>",
      appHtml: document.querySelector("#app")?.innerHTML?.slice(0, 500) ?? "<no app root>",
      localStorageKeys: Object.keys(localStorage),
    })).catch(() => ({ url: page.url(), title: "<unavailable>", body: "<unavailable>", appHtml: "<unavailable>" }));
    const records = await page.evaluate(async () => {
      const request = indexedDB.open("infinidrip-projects");
      const database = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        const stores = ["meta", "projects", "styles", "styleRevisions"];
        const transaction = database.transaction(stores.filter((store) => database.objectStoreNames.contains(store)), "readonly");
        const values = {};
        for (const store of transaction.objectStoreNames) {
          values[store] = await new Promise((resolve, reject) => {
            const read = transaction.objectStore(store).getAll();
            read.onsuccess = () => resolve(read.result);
            read.onerror = () => reject(read.error);
          });
        }
        return values;
      } finally {
        database.close();
      }
    }).catch((error) => ({ diagnosticError: error.message }));
    console.error("PROJECT PACKAGE STARTUP DIAGNOSTIC:", JSON.stringify({ ...diagnostic, records }));
    throw error;
  }
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

async function addArtworkReference(page, electron) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#c85d3a"/></svg>';
  await page.locator("#journey-step-fit").click();
  await page.locator("#surface-new-id").fill("g02-package-proof-mark");
  await page.locator("#surface-new-role").fill("front");
  await page.locator("#surface-new-width").fill("4");
  await page.locator("#surface-new-height").fill("3");
  await page.locator("#surface-new-file").setInputFiles({
    name: "g02-package-proof.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(svg),
  });
  await page.waitForFunction(() =>
    document.querySelector("#surface-new-file-status")?.textContent?.includes("Ready: g02-package-proof.svg") ?? false,
  );
  await page.locator("#surface-add").click();
  await page.waitForFunction(() => {
    const preview = document.querySelector("[data-surface-asset-preview]");
    const status = document.querySelector("#surface-new-file-status")?.textContent ?? "";
    return preview?.getAttribute("data-asset-id")?.startsWith("local-") === true && status.includes("Image optional");
  });
  const assetId = await page.locator("[data-surface-asset-preview]").getAttribute("data-asset-id");
  assert.ok(assetId?.startsWith("local-"), "the user-facing add flow stored the image as a local asset");
  await page.locator("#save-pattern").click();
  await page.waitForFunction(() =>
    document.querySelector("#project-persistence-state")?.textContent?.startsWith("Saved in this style") ?? false,
  );
  const asset = await artworkRecord(page, assetId, electron);
  assert.ok(asset, "the app can retrieve the stored local artwork bytes");
  const snapshot = await projectSnapshot(page);
  const activeStyle = snapshot.styles.find((style) => style.name === STYLE_NAME);
  const activeProject = snapshot.projects.find((project) => project.id === activeStyle?.projectId);
  assert.ok(activeStyle && activeProject, "the user-facing style remains attached to its project");
  return {
    assetId,
    activeStyleId: activeStyle.id,
    projectId: activeProject.id,
    bytes: asset.bytes,
    svg,
  };
}

async function projectSnapshot(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Project database open failed."));
    });
    const transaction = database.transaction(["projects", "styles", "recoveries", "styleRevisions"], "readonly");
    const readAll = (store) => new Promise((resolve, reject) => {
      const request = transaction.objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error(`Could not read ${store}.`));
    });
    const [projects, styles, recoveries, styleRevisions] = await Promise.all([
      readAll("projects"), readAll("styles"), readAll("recoveries"), readAll("styleRevisions"),
    ]);
    database.close();
    return { projects, styles, recoveries, styleRevisions };
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
  const activeStyle = sourceStyles.find((style) => style.id === seeded.activeStyleId);
  const placements = Object.values(activeStyle.design.surface).flatMap((surface) => surface.placements);
  assert.equal(placements.length, 1, "the saved user-facing artwork placement is part of the source style");
  assert.equal(placements[0].assetId, seeded.assetId, "the placement keeps its local artwork reference");
  const revisions = snapshot.styleRevisions.filter((revision) => revision.styleId === activeStyle.id)
    .sort((left, right) => left.revisionNumber - right.revisionNumber);
  assert.ok(revisions.length >= 2, "the saved artwork change appends a durable style revision");
  assert.equal(revisions.at(-1).revisionId, activeStyle.revisionHeadId, "the saved style points at its newest immutable revision");
  assert.deepEqual(revisions.at(-1).payload.design, activeStyle.design, "the current design equals the immutable revision head");
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
    page.on("pageerror", (error) => console.error("PROJECT PACKAGE BROWSER PAGE ERROR:", error.stack || error.message));
    page.on("console", (message) => {
      if (message.type() === "error") console.error("PROJECT PACKAGE BROWSER CONSOLE ERROR:", message.text());
    });
    page.on("requestfailed", (request) => console.error("PROJECT PACKAGE BROWSER REQUEST FAILED:", request.url(), request.failure()?.errorText));
    await page.goto(serverUrl);
    await createSourceProject(page);
    let seeded = await addArtworkReference(page, false);
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
    const seeded = await addArtworkReference(page, true);
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
    console.log("PROJECT PACKAGE preview server:", server.url);
    const browser = await verifyBrowser(server.url, outputDir);
    const electron = await verifyElectron(server.url, outputDir);
    const result = {
      slice: 240,
      status: "passed",
      createdAt: new Date().toISOString(),
      browser,
      electron,
      limits: [
        "The run proves the tested Chromium and Electron versions with isolated clean profiles; it does not guarantee permanent browser storage or survival after OS crash or power loss.",
        "Digital package integrity and restart persistence do not establish physical fit, supplier acceptance, or factory readiness.",
      ],
    };
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    const reportPath = path.join(EVIDENCE_DIR, "S240-project-package-verification.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify({ ...result, reportPath: path.relative(path.join(__dirname, ".."), reportPath).split(path.sep).join("/") }, null, 2));
  } catch (error) {
    console.error("PROJECT PACKAGE VERIFY FAILED:", error);
    process.exitCode = 1;
  } finally {
    server?.stop();
    removeTempDir(outputDir);
  }
}

void main();
