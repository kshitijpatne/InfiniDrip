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
      const transaction = database.transaction(["projects", "styles", "recoveries", "fieldObservations"], "readonly");
      const read = (store, key) => new Promise((resolve, reject) => {
        const request = transaction.objectStore(store).getAll(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const [projects, styles, recoveries, fieldObservations] = await Promise.all([
        read("projects"), read("styles"), read("recoveries"),
        read("fieldObservations"),
      ]);
      return { projects, styles, recoveries, fieldObservations };
    } finally {
      database.close();
    }
  });
}

async function waitForFieldHistory(window, styleId, rawValue) {
  await window.waitForFunction(async ({ styleId: expectedStyleId, rawValue: expectedRawValue }) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = database.transaction("fieldObservations", "readonly");
      const record = await new Promise((resolve, reject) => {
        const request = transaction.objectStore("fieldObservations").get(expectedStyleId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return record?.observations?.some((entry) => entry.fieldId === "body.chest-girth"
        && entry.rawValue === expectedRawValue && entry.canonicalValue === Number(expectedRawValue)) ?? false;
    } finally {
      database.close();
    }
  }, { styleId, rawValue }, { timeout: 20000 });
}

function assertChestFieldHistory(state, styleId, rawValue) {
  const record = state.fieldObservations.find((item) => item.styleId === styleId);
  const entries = record?.observations.filter((item) => item.fieldId === "body.chest-girth") ?? [];
  const entry = entries.find((item) => item.rawValue === rawValue && item.canonicalValue === Number(rawValue));
  assert.ok(entry, `style ${styleId} should retain chest field value ${rawValue}`);
  assert.equal(entry.provenance, "USER_CAPTURED", "the edited chest input is recorded as user-entered");
  assert.equal(entry.evidenceStatus, "UNCONFIRMED", "editing a value does not claim measurement verification");
  assert.equal(entry.confidence, "NOT_ASSESSED", "the app does not invent a confidence score");
  return entry;
}

async function verifyRenderedChestHistory(window, rawValue) {
  await window.locator('button[data-open-field-history="body.chest-girth"]').first().click();
  const dialog = window.locator("#field-history-dialog");
  await window.waitForFunction(() => document.querySelector("#field-history-dialog")?.open === true);
  const text = await dialog.textContent();
  assert.match(text ?? "", new RegExp(`raw “${rawValue}”`));
  assert.match(text ?? "", /User entered/);
  assert.match(text ?? "", /UNCONFIRMED/);
  assert.match(text ?? "", /does not establish fit or production validity/);
  await dialog.locator("button[data-close-field-history]").click();
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
    await waitForStatus(window, "recovery saved|field value history recorded", "browser measurement edit did not reach durable recovery");
    await waitForFieldHistory(window, originalStyleId, "104");
    await verifyRenderedChestHistory(window, "104");

    const manager = window.locator("#project-manager-host");
    await manager.locator(".project-manager-details summary").click();
    await manager.locator("#project-style-name").fill("G02 browser style");
    await manager.locator('[data-project-action="create"]').click();
    await window.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Created G02 browser style"));
    const created = await inspectProject(window);
    assert.equal(created.styles.length, 2, "browser create adds a distinct style");
    assertChestFieldHistory(created, originalStyleId, "104");
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
    assertChestFieldHistory(reopened, originalStyleId, "104");
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
    assertChestFieldHistory(final, originalStyleId, "104");
    assert.equal(final.recoveries.length, 0, "browser stale recovery was removed after Save");
    assert.equal(Number(renderedChest), 104, "browser renderer shows the committed measurement");
    return {
      result: "PASS",
      chromiumVersion: await window.evaluate(() => navigator.userAgent),
      stylesAfterRestart: final.styles.length,
      activeStyleSurvivedRestart: final.projects[0].activeStyleId === originalStyleId,
      styleScopedRecoveryWasRestored: true,
      savedMeasurementSurvivedRestart: 104,
      sourceAwareChestHistorySurvivedRestart: true,
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
    await waitForStatus(window, "recovery saved|field value history recorded", "measurement edit did not reach durable recovery");
    await waitForFieldHistory(window, originalStyleId, "104");
    await verifyRenderedChestHistory(window, "104");

    const manager = window.locator("#project-manager-host");
    await manager.locator(".project-manager-details summary").click();
    await manager.locator("#project-style-name").fill("G02 runtime style");
    await manager.locator('[data-project-action="create"]').click();
    await window.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Created G02 runtime style"));
    const firstRestart = await inspectProject(window);
    assert.equal(firstRestart.styles.length, 2, "create adds one independent style");
    assertChestFieldHistory(firstRestart, originalStyleId, "104");
    assert.notEqual(firstRestart.projects[0].activeStyleId, originalStyleId, "created style becomes active");
    assert.ok(firstRestart.recoveries.some((recovery) => recovery.styleId === originalStyleId), "the prior style's recovery remains scoped to it");
    assert.equal(firstRestart.styles.find((style) => style.id === originalStyleId).design.measurements.chest, 100,
      "unsaved recovery does not replace the last explicitly saved design");

    await closeApp(app);
    app = await launch({ userDataDir, devServerUrl: server.url });
    window = await waitForReady(app);
    const reopened = await inspectProject(window);
    assert.equal(reopened.styles.length, 2, "both styles survive application restart");
    assertChestFieldHistory(reopened, originalStyleId, "104");
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
    assertChestFieldHistory(beforeFinalRestart, originalStyleId, "104");
    assert.ok(!beforeFinalRestart.recoveries.some((recovery) => recovery.styleId === originalStyleId),
      "explicit Save clears that style's obsolete recovery atomically");

    await closeApp(app);
    app = await launch({ userDataDir, devServerUrl: server.url });
    window = await waitForReady(app);
    const final = await inspectProject(window);
    assert.equal(final.projects[0].activeStyleId, originalStyleId, "selected style survives the second restart");
    assert.equal(final.styles.find((style) => style.id === originalStyleId).design.measurements.chest, 104,
      "saved measurement survives the second restart");
    assertChestFieldHistory(final, originalStyleId, "104");
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
      sourceAwareChestHistorySurvivedRestart: true,
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
