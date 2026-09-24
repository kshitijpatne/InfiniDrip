// End-to-end proof of the user-facing multi-style project workflow in the real
// Electron renderer. Every run uses a disposable profile and exercises the
// same app entry point users receive, including restart persistence.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const {
  closeApp,
  launch,
  makeTempDir,
  removeTempDir,
  startPreviewServer,
} = require("./verify-common.cjs");

async function waitForReady(app) {
  const window = await app.firstWindow();
  window.setDefaultTimeout(12000);
  await window.waitForSelector("#infini-shell", { state: "attached", timeout: 20000 });
  await window.waitForSelector("#project-manager-host .project-manager-details", { state: "attached", timeout: 20000 });
  const skip = window.locator("#welcome-skip");
  if (await skip.count() && await skip.isVisible()) await skip.click();
  return window;
}

async function inspectProject(window) {
  return window.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = database.transaction(["projects", "styles", "recoveries"], "readonly");
      const read = (store, key) => new Promise((resolve, reject) => {
        const request = transaction.objectStore(store).getAll(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const [projects, styles, recoveries] = await Promise.all([
        read("projects"), read("styles"), read("recoveries"),
      ]);
      return { projects, styles, recoveries };
    } finally {
      database.close();
    }
  });
}

async function waitForStatus(window, expression, label) {
  await window.waitForFunction((pattern) => {
    const status = document.querySelector("#project-persistence-state")?.textContent ?? "";
    return new RegExp(pattern).test(status);
  }, expression, { timeout: 20000 }).catch(async (error) => {
    const status = await window.locator("#project-persistence-state").textContent();
    throw new Error(`${label}; current persistence status: ${status ?? "<missing>"}; ${error.message}`);
  });
}

async function verifyBrowserWorkflow(serverUrl) {
  const userDataDir = makeTempDir("infinidrip-browser-project-workflow-");
  let context;
  try {
    const launch = () => chromium.launchPersistentContext(userDataDir, { headless: true });
    context = await launch();
    let window = context.pages()[0] ?? await context.newPage();
    window.setDefaultTimeout(12000);
    await window.goto(serverUrl);
    window = await waitForReady({ firstWindow: async () => window });
    const initial = await inspectProject(window);
    assert.equal(initial.projects.length, 1, "browser first run creates one project");
    assert.equal(initial.styles.length, 1, "browser first run creates one initial style");
    const originalStyleId = initial.projects[0].activeStyleId;
    await window.locator('input[data-field="chest"]').first().fill("104");
    await waitForStatus(window, "recovery saved", "browser measurement edit did not reach durable recovery");

    const manager = window.locator("#project-manager-host");
    await manager.locator(".project-manager-details summary").click();
    await manager.locator("#project-style-name").fill("G02 browser style");
    await manager.locator('[data-project-action="create"]').click();
    await window.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Created G02 browser style"));
    const created = await inspectProject(window);
    assert.equal(created.styles.length, 2, "browser create adds a distinct style");
    assert.notEqual(created.projects[0].activeStyleId, originalStyleId, "browser-created style becomes active");
    assert.ok(created.recoveries.some((recovery) => recovery.styleId === originalStyleId), "browser recovery remains with its original style");

    await context.close();
    context = await launch();
    window = context.pages()[0] ?? await context.newPage();
    window.setDefaultTimeout(12000);
    await window.goto(serverUrl);
    window = await waitForReady({ firstWindow: async () => window });
    const reopened = await inspectProject(window);
    assert.equal(reopened.styles.length, 2, "browser styles survive profile restart");
    assert.equal(reopened.projects[0].activeStyleId, created.projects[0].activeStyleId, "browser active style survives restart");

    await window.locator("#project-manager-host .project-manager-details summary").click();
    await window.locator(`[data-project-action="switch"][data-style-id="${originalStyleId}"]`).click();
    await window.waitForSelector("#recovery-accept", { state: "visible" });
    await window.locator("#recovery-accept").click();
    await waitForStatus(window, "recovery saved", "browser accepted recovery was not persisted");
    await window.locator("#save-pattern").click();
    await waitForStatus(window, "^Saved in this style$", "browser explicit Save did not commit recovery");
    const committed = await inspectProject(window);
    assert.equal(committed.styles.find((style) => style.id === originalStyleId).design.measurements.chest, 104);
    assert.ok(!committed.recoveries.some((recovery) => recovery.styleId === originalStyleId));

    await context.close();
    context = await launch();
    window = context.pages()[0] ?? await context.newPage();
    window.setDefaultTimeout(12000);
    await window.goto(serverUrl);
    window = await waitForReady({ firstWindow: async () => window });
    const final = await inspectProject(window);
    const renderedChest = await window.locator('input[data-field="chest"]').first().getAttribute("value");
    assert.equal(final.projects[0].activeStyleId, originalStyleId, "browser selected style survives the second restart");
    assert.equal(final.styles.find((style) => style.id === originalStyleId).design.measurements.chest, 104);
    assert.equal(final.recoveries.length, 0, "browser stale recovery was removed after Save");
    assert.equal(Number(renderedChest), 104, "browser renderer shows the committed measurement");
    return {
      result: "PASS",
      chromiumVersion: await window.evaluate(() => navigator.userAgent),
      stylesAfterRestart: final.styles.length,
      activeStyleSurvivedRestart: final.projects[0].activeStyleId === originalStyleId,
      styleScopedRecoveryWasRestored: true,
      savedMeasurementSurvivedRestart: 104,
      staleRecoveryClearedOnSave: final.recoveries.length === 0,
      renderedMeasurement: Number(renderedChest),
    };
  } finally {
    await context?.close();
    removeTempDir(userDataDir);
  }
}

async function main() {
  const userDataDir = makeTempDir("infinidrip-project-workflow-");
  let server;
  let app;
  let passed = false;
  try {
    server = await startPreviewServer();
    const browserResult = await verifyBrowserWorkflow(server.url);
    app = await launch({ userDataDir, devServerUrl: server.url });
    let window = await waitForReady(app);
    const initial = await inspectProject(window);
    assert.equal(initial.projects.length, 1, "first run creates one project");
    assert.equal(initial.styles.length, 1, "first run creates one initial style");
    const originalStyleId = initial.projects[0].activeStyleId;
    const chestInput = window.locator('input[data-field="chest"]').first();
    await chestInput.fill("104");
    await waitForStatus(window, "recovery saved", "measurement edit did not reach durable recovery");

    const manager = window.locator("#project-manager-host");
    await manager.locator(".project-manager-details summary").click();
    await manager.locator("#project-style-name").fill("G02 runtime style");
    await manager.locator('[data-project-action="create"]').click();
    await window.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Created G02 runtime style"));
    const firstRestart = await inspectProject(window);
    assert.equal(firstRestart.styles.length, 2, "create adds one independent style");
    assert.notEqual(firstRestart.projects[0].activeStyleId, originalStyleId, "created style becomes active");
    assert.ok(firstRestart.recoveries.some((recovery) => recovery.styleId === originalStyleId), "the prior style's recovery remains scoped to it");
    assert.equal(firstRestart.styles.find((style) => style.id === originalStyleId).design.measurements.chest, 100,
      "unsaved recovery does not replace the last explicitly saved design");

    await closeApp(app);
    app = await launch({ userDataDir, devServerUrl: server.url });
    window = await waitForReady(app);
    const reopened = await inspectProject(window);
    assert.equal(reopened.styles.length, 2, "both styles survive application restart");
    assert.equal(reopened.projects[0].activeStyleId, firstRestart.projects[0].activeStyleId, "active style selection survives restart");

    await window.locator("#project-manager-host .project-manager-details summary").click();
    const switchBack = window.locator(`[data-project-action="switch"][data-style-id="${originalStyleId}"]`);
    await switchBack.click();
    await window.waitForSelector("#recovery-accept", { state: "visible", timeout: 10000 });
    await window.locator("#recovery-accept").click();
    await waitForStatus(window, "recovery saved", "accepted recovery was not re-saved while editing");
    await window.locator("#save-pattern").click();
    await waitForStatus(window, "^Saved in this style$", "explicit Save did not commit the recovered design");

    const beforeFinalRestart = await inspectProject(window);
    const savedStyle = beforeFinalRestart.styles.find((style) => style.id === originalStyleId);
    assert.equal(savedStyle.design.measurements.chest, 104, "explicit Save commits the recovered measurement");
    assert.ok(!beforeFinalRestart.recoveries.some((recovery) => recovery.styleId === originalStyleId),
      "explicit Save clears that style's obsolete recovery atomically");

    await closeApp(app);
    app = await launch({ userDataDir, devServerUrl: server.url });
    window = await waitForReady(app);
    const final = await inspectProject(window);
    assert.equal(final.projects[0].activeStyleId, originalStyleId, "selected style survives the second restart");
    assert.equal(final.styles.find((style) => style.id === originalStyleId).design.measurements.chest, 104,
      "saved measurement survives the second restart");
    assert.equal(final.recoveries.length, 0, "no stale recovery remains after the saved style reopens");
    const renderedChest = await window.locator('input[data-field="chest"]').first().getAttribute("value");
    assert.equal(Number(renderedChest), 104, "the actual renderer displays the committed measurement");
    console.log(JSON.stringify({
      result: "PASS",
      browser: browserResult,
      electron: {
      electronVersion: require("electron/package.json").version,
      chromiumVersion: await app.evaluate(() => process.versions.chrome),
      stylesAfterRestart: final.styles.length,
      activeStyleSurvivedRestart: final.projects[0].activeStyleId === originalStyleId,
      styleScopedRecoveryWasRestored: true,
      savedMeasurementSurvivedRestart: 104,
      staleRecoveryClearedOnSave: final.recoveries.length === 0,
      renderedMeasurement: Number(renderedChest),
      },
    }, null, 2));
    passed = true;
  } catch (error) {
    console.error("PROJECT WORKFLOW VERIFY FAILED:", error);
  } finally {
    await closeApp(app);
    server?.stop();
    removeTempDir(userDataDir);
  }
  process.exit(passed ? 0 : 1);
}

void main();
