// Slice 238 rendered proof for durable semantic edits. It exercises the real
// app in Chromium and Electron, including output files, style isolation,
// reload/restart, crash recovery, stale-source blocking, and explicit rebase.
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

const EXPORTS = [
  ["export-svg", "tee-M.svg"],
  ["export-dxf", "tee-M.dxf"],
  ["export-pdf", "tee-M.pdf"],
  ["export-a0", "tee-M-A0.pdf"],
  ["export-techpack", "tee-techpack.pdf"],
  ["export-projector", "tee-projector.svg"],
];
const WOVEN_EXPORTS = [
  ["export-svg", "woven-shirt-M.svg"],
  ["export-dxf", "woven-shirt-M.dxf"],
  ["export-pdf", "woven-shirt-M.pdf"],
  ["export-a0", "woven-shirt-M-A0.pdf"],
  ["export-techpack", "woven-shirt-techpack.pdf"],
  ["export-projector", "woven-shirt-projector.svg"],
];
const EVIDENCE_DIR = path.join(__dirname, "..", "docs", "research", "epic15", "evidence");

const log = (message) => console.log(`[S238 semantic proof] ${message}`);

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function waitForReady(page) {
  page.setDefaultTimeout(15000);
  await page.waitForSelector("#infini-shell", { state: "attached", timeout: 20000 });
  await page.waitForSelector("#project-manager-host .project-manager-details", { state: "attached", timeout: 20000 });
  for (const selector of ["#welcome-skip", "#welcome-start"]) {
    const button = page.locator(selector);
    if (await button.count() && await button.first().isVisible()) {
      await button.first().click();
      break;
    }
  }
}

function installDialogGuard(page, log) {
  page.on("dialog", async (dialog) => {
    log.push({ type: dialog.type(), message: dialog.message() });
    if (dialog.type() === "beforeunload") await dialog.accept().catch(() => undefined);
    else await dialog.dismiss().catch(() => undefined);
  });
}

async function readProjectState(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = database.transaction(["projects", "styles", "recoveries"], "readonly");
      const readAll = (store) => new Promise((resolve, reject) => {
        const request = transaction.objectStore(store).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const [projects, styles, recoveries] = await Promise.all([
        readAll("projects"), readAll("styles"), readAll("recoveries"),
      ]);
      return { projects, styles, recoveries };
    } finally {
      database.close();
    }
  });
}

async function waitForSavedOperations(page, styleId, count) {
  await page.waitForFunction(async ({ styleId: expectedId, count: expectedCount }) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const style = await new Promise((resolve, reject) => {
        const request = database.transaction("styles", "readonly").objectStore("styles").get(expectedId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return style?.design?.semanticEdits?.operations?.length === expectedCount;
    } finally {
      database.close();
    }
  }, { styleId, count }, { timeout: 20000 });
}

async function waitForRecoveryOperations(page, styleId, count) {
  await page.waitForFunction(async ({ styleId: expectedId, count: expectedCount }) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const recovery = await new Promise((resolve, reject) => {
        const request = database.transaction("recoveries", "readonly").objectStore("recoveries").get(expectedId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return recovery?.payload?.semanticEdits?.operations?.length === expectedCount;
    } finally {
      database.close();
    }
  }, { styleId, count }, { timeout: 20000 });
}

async function enterEdit(page) {
  const fit = page.locator("#journey-step-fit");
  if (await fit.count() && await fit.isVisible()) await fit.click();
  const menu = page.locator("#advanced-view-label");
  if (await menu.count() && !await page.locator("#view-edit").isVisible()) await menu.click();
  const edit = page.locator("#view-edit");
  if (await edit.getAttribute("aria-pressed") !== "true") await edit.click();
  await page.waitForSelector("[data-editor-validation]", { state: "attached", timeout: 20000 });
}

async function moveCurveHandle(page, delta = 0.1) {
  const candidate = page.locator('input[data-editor-coordinate][data-editor-axis="x"][data-editor-handle-id*="/control/"]').first();
  await candidate.waitFor({ state: "visible" });
  const handleId = await candidate.getAttribute("data-editor-handle-id");
  const original = Number(await candidate.inputValue());
  await candidate.fill(String(original + delta));
  await candidate.press("Tab");
  await page.waitForFunction(() => document.querySelector('[data-editor-validation="valid"]') !== null, undefined, { timeout: 20000 });
  const updated = page.locator(`input[data-editor-coordinate][data-editor-axis="x"][data-editor-handle-id="${handleId}"]`);
  const value = Number(await updated.inputValue());
  assert.ok(Math.abs(value - original) > 0.05, "the user-authored handle movement changes its coordinate");
  return { handleId, original, value };
}

async function moveAndCompareCanvas(page, delta = 0.1) {
  const inspection = page.locator("#canvas-host svg.inspection-svg");
  const before = await inspection.evaluate((svg) => svg.outerHTML);
  const movement = await moveCurveHandle(page, delta);
  const after = await inspection.evaluate((svg) => svg.outerHTML);
  assert.notEqual(sha256(Buffer.from(after)), sha256(Buffer.from(before)), "rendered pattern SVG reflects the edit");
  return movement;
}

async function reachOutput(page, exports = EXPORTS) {
  const fit = page.locator("#journey-step-fit");
  if (await fit.count() && await fit.isVisible()) await fit.click();
  for (let step = 0; step < 2; step += 1) {
    if (await page.locator("#export-svg").isVisible()) break;
    const next = page.locator("#journey-next");
    if (!await next.isVisible() || await next.isDisabled()) {
      const blocker = await page.locator("#journey-blocker").textContent().catch(() => "no blocker detail");
      throw new Error(`Journey blocked before output: ${blocker}`);
    }
    await next.click();
  }
  await page.waitForSelector("#export-svg", { state: "visible", timeout: 20000 });
  for (const [id] of exports) {
    assert.equal(await page.locator(`#${id}`).isDisabled(), false, `${id} should be available after review`);
  }
}

async function browserExports(page, directory, exports = EXPORTS) {
  const outputs = {};
  for (const [id, filename] of exports) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(`#${id}`).click(),
    ]);
    const destination = path.join(directory, filename);
    await download.saveAs(destination);
    const bytes = fs.readFileSync(destination);
    assert.ok(bytes.length > 40, `${filename} has non-empty rendered output`);
    outputs[filename] = { bytes: bytes.length, sha256: sha256(bytes) };
  }
  return outputs;
}

async function clickSaveAndWait(page, styleId) {
  await page.locator("#save-pattern").click();
  await waitForSavedOperations(page, styleId, 1);
}

async function createBlankStyleAndVerifyScope(page, originalStyleId) {
  const manager = page.locator("#project-manager-host");
  const details = manager.locator(".project-manager-details");
  if (!await details.evaluate((node) => node.open)) await details.locator("summary").click();
  await manager.locator("#project-style-name").fill("Semantic isolation check");
  await manager.locator('[data-project-action="create"]').click();
  await page.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Created Semantic isolation check"));
  let state = await readProjectState(page);
  assert.equal(state.styles.length, 2, "a second local style is created");
  const secondStyle = state.styles.find((style) => style.id !== originalStyleId);
  assert.ok(secondStyle, "the new style has a distinct stable ID");
  assert.equal(secondStyle.design.semanticEdits, null, "blank style starts without another style's semantic edits");
  assert.equal(state.styles.find((style) => style.id === originalStyleId).design.semanticEdits.operations.length, 1,
    "the original style retains its own semantic edit");

  const switchBack = manager.locator(`[data-project-action="switch"][data-style-id="${originalStyleId}"]`);
  await switchBack.click();
  await page.waitForFunction(async (expectedId) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const selection = await new Promise((resolve, reject) => {
        const request = database.transaction("meta", "readonly").objectStore("meta").get("activeSelection");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return selection?.styleId === expectedId;
    } finally {
      database.close();
    }
  }, originalStyleId, { timeout: 20000 });
  state = await readProjectState(page);
  assert.equal(state.projects[0].activeStyleId, originalStyleId, "the original edited style is active again");
  return secondStyle.id;
}

async function exerciseBrowser(serverUrl, outputDirectory) {
  const profile = makeTempDir("infinidrip-semantic-browser-");
  let context;
  const dialogs = [];
  try {
    const open = async () => {
      context = await chromium.launchPersistentContext(profile, { headless: true, acceptDownloads: true });
      const page = context.pages()[0] ?? await context.newPage();
      installDialogGuard(page, dialogs);
      await page.goto(serverUrl);
      await waitForReady(page);
      return page;
    };
    let page = await open();
    log("Chromium style created");
    let state = await readProjectState(page);
    const originalStyleId = state.projects[0].activeStyleId;
    await enterEdit(page);
    const beforeSave = await moveAndCompareCanvas(page);
    log("Chromium rendered edit applied");
    await clickSaveAndWait(page, originalStyleId);
    log("Chromium saved edit persisted");
    await reachOutput(page);
    const editedOutputs = await browserExports(page, outputDirectory);
    log("Chromium six output files exported");
    const savedSource = await readProjectState(page);
    const sourceStyle = savedSource.styles.find((style) => style.id === originalStyleId);
    assert.equal(sourceStyle.design.semanticEdits.operations.length, 1, "Save commits one semantic operation to its style");

    const secondStyleId = await createBlankStyleAndVerifyScope(page, originalStyleId);
    log("Chromium style isolation verified");
    await page.reload();
    await waitForReady(page);
    log("Chromium saved edit reloaded");
    state = await readProjectState(page);
    assert.equal(state.projects[0].activeStyleId, originalStyleId, "active style selection survives Chromium reload");
    assert.equal(state.styles.find((style) => style.id === originalStyleId).design.semanticEdits.operations.length, 1,
      "saved semantic operation survives Chromium reload");
    assert.equal(state.styles.find((style) => style.id === secondStyleId).design.semanticEdits, null,
      "edit state stays isolated after reload");

    await enterEdit(page);
    const afterReload = await page.locator(`input[data-editor-coordinate][data-editor-axis="x"][data-editor-handle-id="${beforeSave.handleId}"]`).inputValue();
    assert.ok(Math.abs(Number(afterReload) - beforeSave.value) < 0.001, "saved handle coordinate is restored in the rendered editor");
    const recoveredMovement = await moveAndCompareCanvas(page);
    await waitForRecoveryOperations(page, originalStyleId, 2);
    log("Chromium recovery written before restart");
    await context.close();
    context = undefined;

    page = await open();
    await page.waitForSelector("#recovery-accept", { state: "visible", timeout: 20000 });
    await page.locator("#recovery-accept").click();
    await page.waitForSelector('[data-editor-validation="valid"]', { state: "attached", timeout: 20000 });
    log("Chromium recovery accepted after restart");
    const recoveredState = await readProjectState(page);
    const recovery = recoveredState.recoveries.find((record) => record.styleId === originalStyleId);
    assert.equal(recovery.payload.semanticEdits.operations.length, 2, "crash recovery restores both semantic operations");
    const recoveredCoordinate = await page.locator(`input[data-editor-coordinate][data-editor-axis="x"][data-editor-handle-id="${recoveredMovement.handleId}"]`).inputValue();
    assert.ok(Math.abs(Number(recoveredCoordinate) - recoveredMovement.value) < 0.001,
      "recovered handle coordinate matches the last on-screen movement");

    await page.locator("#journey-step-measure").click();
    const chest = page.locator('input[data-field="chest"]').first();
    await chest.waitFor({ state: "visible" });
    await chest.fill(String(Number(await chest.inputValue()) + 1));
    await enterEdit(page);
    await page.waitForSelector('[data-editor-validation="rebase-required"]', { state: "attached", timeout: 20000 });
    const exportButton = page.locator("#export-svg");
    assert.equal(await exportButton.isDisabled(), true, "stale source disables the output route");
    let blockedDownloads = 0;
    page.on("download", () => { blockedDownloads += 1; });
    await exportButton.evaluate((button) => {
      button.disabled = false;
      button.click();
    });
    await page.waitForTimeout(250);
    assert.equal(blockedDownloads, 0, "the app's export guard starts no browser download even if a disabled control is activated");
    await page.locator("#editor-rebase").click();
    await page.waitForSelector('[data-editor-validation="valid"]', { state: "attached", timeout: 20000 });
    log("Chromium stale source blocked and explicit rebase passed");
    assert.equal(await page.locator('[data-editor-validation="rebase-required"]').count(), 0,
      "explicit rebase clears the stale-source state after all-size validation");
    return {
      styleIds: [originalStyleId, secondStyleId],
      savedOperationCount: 1,
      recoveredOperationCount: 2,
      outputFiles: editedOutputs,
      staleSourceBlockedOutput: true,
      rejectedDownloadCount: blockedDownloads,
      explicitRebaseClearedConflict: true,
      unexpectedBrowserDialogs: dialogs,
      chromium: await page.evaluate(() => navigator.userAgent),
    };
  } finally {
    await context?.close();
    removeTempDir(profile);
  }
}

async function exerciseWovenBrowser(serverUrl, outputDirectory) {
  const profile = makeTempDir("infinidrip-woven-semantic-browser-");
  let context;
  const dialogs = [];
  try {
    context = await chromium.launchPersistentContext(profile, { headless: true, acceptDownloads: true });
    const page = context.pages()[0] ?? await context.newPage();
    installDialogGuard(page, dialogs);
    await page.goto(serverUrl);
    await waitForReady(page);
    await page.locator("#journey-step-start").click();
    await page.locator("#garment-woven-shirt").click();
    assert.equal((await page.locator("#current-garment").textContent()).trim(), "Woven shirt",
      "the complex recipe is selected through the actual garment control");
    await page.locator("#journey-step-fit").click();
    await page.locator("#stretch-select").selectOption({ label: "Cotton woven" });

    await reachOutput(page, WOVEN_EXPORTS);
    const defaultOutputs = await browserExports(page, outputDirectory, WOVEN_EXPORTS);
    await page.locator("#journey-step-fit").click();
    const hemTurn = page.locator('input[data-option="hemTurn"]');
    for (let pageIndex = 0; pageIndex < 8 && !await hemTurn.isVisible(); pageIndex += 1) {
      const nextControlPage = page.locator('#controls-panel [data-control-page-step="1"]');
      assert.equal(await nextControlPage.isDisabled(), false, "the woven option group is reachable from the visible control pages");
      await nextControlPage.click();
    }
    await hemTurn.waitFor({ state: "visible" });
    await hemTurn.fill("2");
    await hemTurn.press("Tab");
    assert.equal(await hemTurn.inputValue(), "2", "the valid user-selected 2 cm woven hem turn is retained");
    await reachOutput(page, WOVEN_EXPORTS);
    const hemTurnOutputs = await browserExports(page, outputDirectory, WOVEN_EXPORTS);
    for (const [, filename] of WOVEN_EXPORTS) {
      assert.notEqual(hemTurnOutputs[filename].sha256, defaultOutputs[filename].sha256,
        `${filename} reflects the non-default 2 cm woven body hem turn`);
    }

    await enterEdit(page);
    const movement = await moveAndCompareCanvas(page);
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    const screenshotPath = path.join(EVIDENCE_DIR, "S238-woven-semantic-edit.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const state = await readProjectState(page);
    const styleId = state.projects[0].activeStyleId;
    await clickSaveAndWait(page, styleId);
    await reachOutput(page, WOVEN_EXPORTS);
    const editedOutputs = await browserExports(page, outputDirectory, WOVEN_EXPORTS);
    for (const [, filename] of WOVEN_EXPORTS) {
      assert.notEqual(editedOutputs[filename].sha256, hemTurnOutputs[filename].sha256,
        `${filename} reflects the saved Woven shirt semantic edit`);
    }
    return {
      styleId,
      selectedRecipe: "woven-shirt",
      hemTurnCm: 2,
      semanticHandleId: movement.handleId,
      screenshot: path.relative(path.join(__dirname, ".."), screenshotPath).replaceAll(path.sep, "/"),
      screenshotSha256: sha256(fs.readFileSync(screenshotPath)),
      defaultOutputs,
      hemTurnOutputs,
      semanticEditOutputs: editedOutputs,
      unexpectedBrowserDialogs: dialogs,
      chromium: await page.evaluate(() => navigator.userAgent),
    };
  } finally {
    await context?.close();
    removeTempDir(profile);
  }
}

async function waitForFile(filePath, timeoutMs = 10000) {
  const started = Date.now();
  while (!fs.existsSync(filePath)) {
    if (Date.now() - started > timeoutMs) throw new Error(`Timed out waiting for native export ${filePath}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function electronExport(app, page, destination) {
  await app.evaluate(({ dialog }, filePath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath });
  }, destination);
  await page.locator("#export-svg").click();
  await waitForFile(destination);
  return fs.readFileSync(destination);
}

async function forceProcessExit(app) {
  const process = app.process();
  const exited = new Promise((resolve) => process.once("exit", resolve));
  await app.evaluate(({ app: electronApp }) => electronApp.exit(0));
  const result = await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(() => resolve("timeout"), 5000)),
  ]);
  if (result === "timeout") process.kill();
}

async function exerciseElectron(serverUrl, outputDirectory) {
  const profile = makeTempDir("infinidrip-semantic-electron-");
  const beforeRestartPath = path.join(outputDirectory, "electron-before-restart.svg");
  const afterRestartPath = path.join(outputDirectory, "electron-after-restart.svg");
  let app;
  const dialogs = [];
  try {
    app = await launch({ userDataDir: profile, devServerUrl: serverUrl });
    let page = await app.firstWindow();
    installDialogGuard(page, dialogs);
    await waitForReady(page);
    log("Electron style created");
    let state = await readProjectState(page);
    const styleId = state.projects[0].activeStyleId;
    await enterEdit(page);
    const movement = await moveAndCompareCanvas(page);
    log("Electron rendered edit applied");
    await clickSaveAndWait(page, styleId);
    log("Electron saved edit persisted");
    await reachOutput(page);
    const beforeRestart = await electronExport(app, page, beforeRestartPath);
    log("Electron native output exported");
    log("Closing Electron app after saved edit");
    await closeApp(app);
    app = undefined;
    log("Electron app closed after saved edit");

    app = await launch({ userDataDir: profile, devServerUrl: serverUrl });
    log("Electron app relaunched after saved edit");
    page = await app.firstWindow();
    installDialogGuard(page, dialogs);
    await waitForReady(page);
    log("Electron app restarted");
    state = await readProjectState(page);
    assert.equal(state.projects[0].activeStyleId, styleId, "Electron restores the active style after process restart");
    assert.equal(state.styles.find((style) => style.id === styleId).design.semanticEdits.operations.length, 1,
      "Electron style storage retains the semantic operation across restart");
    const restored = await page.locator(`input[data-editor-coordinate][data-editor-axis="x"][data-editor-handle-id="${movement.handleId}"]`).inputValue();
    assert.ok(Math.abs(Number(restored) - movement.value) < 0.001, "Electron renderer restores the edited coordinate");
    await reachOutput(page);
    const afterRestart = await electronExport(app, page, afterRestartPath);
    log("Electron output re-exported after restart");
    assert.equal(sha256(afterRestart), sha256(beforeRestart), "native output bytes are identical before and after Electron restart");

    await enterEdit(page);
    await moveAndCompareCanvas(page);
    await waitForRecoveryOperations(page, styleId, 2);
    log("Electron recovery written before restart");
    log("Forcing Electron process exit with pending recovery");
    await forceProcessExit(app);
    app = undefined;
    log("Electron process exited with pending recovery");

    app = await launch({ userDataDir: profile, devServerUrl: serverUrl });
    log("Electron app relaunched for recovery");
    page = await app.firstWindow();
    installDialogGuard(page, dialogs);
    await waitForReady(page);
    log("Electron renderer ready for recovery");
    log("Electron app restarted for recovery");
    await page.waitForSelector("#recovery-accept", { state: "visible", timeout: 20000 });
    await page.locator("#recovery-accept").click();
    await page.waitForSelector('[data-editor-validation="valid"]', { state: "attached", timeout: 20000 });
    state = await readProjectState(page);
    const recovery = state.recoveries.find((record) => record.styleId === styleId);
    assert.equal(recovery.payload.semanticEdits.operations.length, 2, "Electron crash recovery restores both operations");
    await page.locator("#journey-step-measure").click();
    const chest = page.locator('input[data-field="chest"]').first();
    await chest.waitFor({ state: "visible" });
    await chest.fill(String(Number(await chest.inputValue()) + 1));
    await enterEdit(page);
    await page.waitForSelector('[data-editor-validation="rebase-required"]', { state: "attached", timeout: 20000 });
    assert.equal(await page.locator("#export-svg").isDisabled(), true, "Electron stale source disables cutting export");
    const rejectedPath = path.join(outputDirectory, "electron-rejected-stale.svg");
    await app.evaluate(({ dialog }, destination) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination });
    }, rejectedPath);
    await page.locator("#export-svg").evaluate((button) => {
      button.disabled = false;
      button.click();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    assert.equal(fs.existsSync(rejectedPath), false, "stale Electron export does not reach native file writing");
    await page.locator("#editor-rebase").click();
    await page.waitForSelector('[data-editor-validation="valid"]', { state: "attached", timeout: 20000 });
    log("Electron stale source blocked and explicit rebase passed");
    await page.locator("#save-pattern").click();
    await waitForSavedOperations(page, styleId, 2);
    log("Electron final reviewed edit saved for verifier shutdown");
    return {
      styleId,
      savedOperationCount: 1,
      recoveredOperationCount: 2,
      outputSha256BeforeRestart: sha256(beforeRestart),
      outputSha256AfterRestart: sha256(afterRestart),
      staleSourceBlockedOutput: true,
      explicitRebaseClearedConflict: true,
      unexpectedBrowserDialogs: dialogs,
      electron: require("electron/package.json").version,
      chromium: await app.evaluate(() => process.versions.chrome),
    };
  } finally {
    await closeApp(app);
    removeTempDir(profile);
  }
}

async function exportBaseline(serverUrl, directory) {
  const profile = makeTempDir("infinidrip-semantic-baseline-");
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, { headless: true, acceptDownloads: true });
    const page = context.pages()[0] ?? await context.newPage();
    installDialogGuard(page, []);
    await page.goto(serverUrl);
    await waitForReady(page);
    await reachOutput(page);
    return await browserExports(page, directory);
  } finally {
    await context?.close();
    removeTempDir(profile);
  }
}

async function main() {
  const outputDirectory = makeTempDir("infinidrip-semantic-output-");
  let server;
  let passed = false;
  try {
    server = await startPreviewServer();
    log("Chromium untouched baseline starting");
    const baseline = await exportBaseline(server.url, outputDirectory);
    log("Chromium untouched baseline exported");
    const browser = await exerciseBrowser(server.url, outputDirectory);
    for (const [, filename] of EXPORTS) {
      assert.notEqual(browser.outputFiles[filename].sha256, baseline[filename].sha256,
        `${filename} changes when its source pattern is semantically edited`);
    }
    const woven = await exerciseWovenBrowser(server.url, outputDirectory);
    log("Woven shirt hem-turn and semantic-edit output replay passed");
    const electron = await exerciseElectron(server.url, outputDirectory);
    console.log(JSON.stringify({ result: "PASS", baseline, browser, woven, electron }, null, 2));
    passed = true;
  } catch (error) {
    console.error("SEMANTIC EDIT VERIFY FAILED:", error);
  } finally {
    server?.stop();
    removeTempDir(outputDirectory);
  }
  process.exit(passed ? 0 : 1);
}

void main();
