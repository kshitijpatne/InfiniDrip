// Slice 239 rendered proof for immutable revisions and exact frozen outputs.
// Runs the built web app in Chromium and the same built renderer in Electron.
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
const ARTIFACT_ID = "selected-size-svg";
const log = (message) => console.log(`[S239 revisions] ${message}`);
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function waitForReady(page) {
  page.setDefaultTimeout(15000);
  await page.waitForSelector("#infini-shell", { state: "attached", timeout: 25000 });
  await page.waitForSelector("#project-manager-host .project-manager-details", { state: "attached", timeout: 25000 });
  for (const selector of ["#welcome-skip", "#welcome-start"]) {
    const button = page.locator(selector);
    if (await button.count() && await button.first().isVisible()) {
      await button.first().click();
      break;
    }
  }
}

async function openManager(page) {
  const details = page.locator("#project-manager-host .project-manager-details");
  if (!await details.evaluate((node) => node.open)) await details.locator("summary").click();
  await page.waitForSelector("#revision-history-title", { state: "attached", timeout: 10000 });
  return page.locator("#project-manager-host");
}

async function readDatabase(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Project database open failed."));
    });
    try {
      const transaction = database.transaction(["projects", "styles", "styleRevisions", "exportManifests"], "readonly");
      const readAll = (store) => new Promise((resolve, reject) => {
        const request = transaction.objectStore(store).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error(`Could not read ${store}.`));
      });
      const [projects, styles, revisions, manifests] = await Promise.all([
        readAll("projects"), readAll("styles"), readAll("styleRevisions"), readAll("exportManifests"),
      ]);
      const digestBytes = async (bytes) => {
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      };
      const revisionSummary = revisions.map((revision) => ({
        styleId: revision.styleId,
        revisionId: revision.revisionId,
        revisionNumber: revision.revisionNumber,
        parentRevisionId: revision.parentRevisionId,
        createdAt: revision.createdAt,
        revisionContentDigest: revision.revisionContentDigest,
        design: revision.payload.design,
        fieldObservations: revision.payload.fieldObservations,
        artwork: revision.payload.artwork,
      })).sort((left, right) => left.styleId.localeCompare(right.styleId) || left.revisionNumber - right.revisionNumber);
      const manifestSummary = [];
      for (const manifest of manifests) {
        const artifacts = [];
        for (const artifact of manifest.artifacts) {
          const bytes = await artifact.bytes.arrayBuffer();
          artifacts.push({
            artifactId: artifact.artifactId,
            path: artifact.path,
            displayName: artifact.displayName,
            mediaType: artifact.mediaType,
            byteLength: artifact.byteLength,
            sha256: artifact.sha256,
            storedByteLength: bytes.byteLength,
            storedByteSha256: await digestBytes(bytes),
          });
        }
        manifestSummary.push({
          manifestId: manifest.manifestId,
          styleId: manifest.styleId,
          revisionId: manifest.revisionId,
          capturedAt: manifest.capturedAt,
          packetDigest: manifest.packetDigest,
          payload: manifest.payload,
          artifacts,
        });
      }
      return {
        projects,
        styles: styles.map((style) => ({
          id: style.id,
          name: style.name,
          revisionHeadId: style.revisionHeadId,
          design: style.design,
        })),
        revisions: revisionSummary,
        manifests: manifestSummary.sort((left, right) => left.styleId.localeCompare(right.styleId) || left.capturedAt.localeCompare(right.capturedAt)),
      };
    } finally {
      database.close();
    }
  });
}

async function waitForRevisionCount(page, styleId, count) {
  await page.waitForFunction(async ({ expectedStyleId, expectedCount }) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = database.transaction("styleRevisions", "readonly")
          .objectStore("styleRevisions").index("styleId").getAll(expectedStyleId);
        request.onsuccess = () => resolve(request.result.length === expectedCount);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }, { expectedStyleId: styleId, expectedCount: count }, { timeout: 25000 });
}

async function readExpectedRevisions(page, styleId, count, label) {
  const deadline = Date.now() + 25000;
  let state;
  let revisions = [];
  do {
    state = await readDatabase(page);
    revisions = state.revisions.filter((revision) => revision.styleId === styleId);
    if (revisions.length === count) return { state, revisions };
    await page.waitForTimeout(100);
  } while (Date.now() < deadline);
  assert.equal(revisions.length, count,
    `${label} expected ${count} persisted revisions for ${styleId}; found ${revisions.length} (${JSON.stringify(revisions.map(({ revisionId, revisionNumber }) => ({ revisionId, revisionNumber })))})`);
}

async function saveChestDelta(page, styleId, count, delta) {
  await page.locator("#journey-step-measure").click();
  const chest = page.locator('input[data-field="chest"]').first();
  await chest.waitFor({ state: "visible" });
  const before = Number(await chest.inputValue());
  await chest.fill(String(before + delta));
  await page.locator("#save-pattern").click();
  await waitForRevisionCount(page, styleId, count);
  return { before, after: before + delta };
}

async function setWovenHemTurn(page, value) {
  await page.locator("#journey-step-fit").click();
  const hemTurn = page.locator('input[data-option="hemTurn"]');
  for (let index = 0; index < 8 && !await hemTurn.isVisible(); index += 1) {
    const nextPage = page.locator('#controls-panel [data-control-page-step="1"]');
    assert.equal(await nextPage.isDisabled(), false, "woven construction option pages remain reachable");
    await nextPage.click();
  }
  await hemTurn.waitFor({ state: "visible" });
  await hemTurn.fill(String(value));
  await hemTurn.press("Tab");
  assert.equal(await hemTurn.inputValue(), String(value), "the selected hem turn remains visible");
}

async function compareAndRestore(page, styleId, leftRevision, rightRevision, expectedPath, expectedRevisionCount) {
  const manager = await openManager(page);
  await manager.locator("#revision-left").selectOption(leftRevision.revisionId);
  await manager.locator("#revision-right").selectOption(rightRevision.revisionId);
  await manager.locator('[data-project-action="compare-revisions"]').click();
  const comparison = await manager.locator(".project-revision-comparison").textContent();
  assert.ok(comparison?.includes(expectedPath), `revision comparison identifies ${expectedPath}`);
  await manager.locator(`[data-project-action="restore-revision"][data-revision-id="${leftRevision.revisionId}"]`).click();
  await page.waitForFunction((number) =>
    document.querySelector("#project-manager-status")?.textContent?.includes(`Restored revision as r${number}`) ?? false,
  expectedRevisionCount, { timeout: 25000 });
  await waitForRevisionCount(page, styleId, expectedRevisionCount);
  return readDatabase(page);
}

async function reachOutputs(page) {
  await page.locator("#journey-step-fit").click();
  await page.locator("#journey-next").click();
  await page.waitForFunction(() => document.querySelector("#journey-step-refine")?.getAttribute("aria-current") === "step");
  await page.locator("#journey-next").click();
  await page.waitForFunction(() => document.querySelector("#journey-step-output")?.getAttribute("aria-current") === "step");
  await page.locator("#export-svg").waitFor({ state: "visible", timeout: 25000 });
}

async function freezeCurrentOutputs(page, styleId) {
  await reachOutputs(page);
  const manager = await openManager(page);
  const freeze = manager.locator('[data-project-action="freeze-outputs"]');
  if (await freeze.isDisabled()) {
    const detail = await page.evaluate(() => ({
      persistence: document.querySelector("#project-persistence-state")?.textContent,
      blocker: document.querySelector("#journey-blocker")?.textContent,
      step: document.querySelector("#journey-step-output")?.getAttribute("aria-current"),
      exports: [...document.querySelectorAll("#export-svg,#export-dxf,#export-pdf,#export-a0,#export-techpack,#export-projector,#export-surface-sheet")]
        .map((button) => ({ id: button.id, disabled: button.disabled })),
      unsaved: document.querySelector("#project-manager-host")?.textContent?.includes("Save the current style before freezing outputs."),
      managerStatus: document.querySelector("#project-manager-status")?.textContent,
      checklist: [...document.querySelectorAll(".journey-checklist-row")].map((row) => ({ text: row.textContent, className: row.className })),
      freezeHtml: document.querySelector('[data-project-action="freeze-outputs"]')?.outerHTML,
      rootInert: document.querySelector("#infini-shell")?.inert,
    }));
    throw new Error(`Frozen outputs are disabled despite reaching output: ${JSON.stringify(detail)}`);
  }
  await freeze.click();
  await page.waitForFunction(() =>
    document.querySelector("#project-manager-status")?.textContent?.includes("Frozen 7 outputs") ?? false,
  undefined, { timeout: 30000 });
  const state = await readDatabase(page);
  const frozen = state.manifests.filter((manifest) => manifest.styleId === styleId);
  assert.equal(frozen.length, 1, "one complete immutable output set is recorded for this style");
  assert.equal(frozen[0].artifacts.length, 7, "the capture contains all seven supported output kinds");
  for (const artifact of frozen[0].artifacts) {
    assert.equal(artifact.byteLength, artifact.storedByteLength, `${artifact.artifactId} retains its exact byte length`);
    assert.equal(artifact.sha256, artifact.storedByteSha256, `${artifact.artifactId} retains its exact SHA-256`);
  }
  return { state, manifest: frozen[0] };
}

async function waitForNativeFile(filePath, timeoutMs = 15000) {
  const start = Date.now();
  while (!fs.existsSync(filePath)) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for saved frozen output ${filePath}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function downloadFrozenArtifact(page, app, profile, manifest, expectedArtifact) {
  const button = page.locator(`[data-project-action="download-frozen"][data-manifest-id="${manifest.manifestId}"][data-artifact-id="${ARTIFACT_ID}"]`);
  await button.waitFor({ state: "visible", timeout: 15000 });
  const destination = path.join(profile, `frozen-${manifest.styleId}.svg`);
  if (app) {
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath });
    }, destination);
    await button.click();
    await waitForNativeFile(destination);
  } else {
    const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
    await download.saveAs(destination);
  }
  const bytes = fs.readFileSync(destination);
  assert.equal(bytes.length, expectedArtifact.byteLength, "the user-facing download has the captured exact length");
  assert.equal(sha256(bytes), expectedArtifact.sha256, "the user-facing download matches the captured exact bytes");
  return { file: path.basename(destination), byteLength: bytes.length, sha256: sha256(bytes) };
}

async function proveScenario(page, app, profile, kind, evidencePrefix) {
  await waitForReady(page);
  let state = await readDatabase(page);
  let styleId = state.projects[0].activeStyleId;
  let revisions = state.revisions.filter((revision) => revision.styleId === styleId);
  assert.equal(revisions.length, 1, `${kind} starts with one honest baseline revision`);
  const baselineRevision = revisions[0];

  if (kind === "tee") {
    await saveChestDelta(page, styleId, 2, 5);
    ({ state, revisions } = await readExpectedRevisions(page, styleId, 2, "Tee measurement save"));
    const editedRevision = revisions[1];
    assert.ok(editedRevision, `Tee measurement save has a second revision: ${JSON.stringify(revisions.map(({ revisionId, revisionNumber }) => ({ revisionId, revisionNumber })))}`);
    state = await compareAndRestore(page, styleId, baselineRevision, editedRevision, "design.measurements.chest", 3);
    assert.equal(state.styles.find((style) => style.id === styleId).design.measurements.chest, baselineRevision.design.measurements.chest,
      "restoring the earlier Tee design makes a new child with the earlier measurement");
  } else {
    await page.locator("#journey-step-start").click();
    await page.locator("#garment-woven-shirt").click();
    assert.equal((await page.locator("#current-garment").textContent()).trim(), "Woven shirt");
    await page.locator("#journey-step-fit").click();
    await page.locator("#stretch-select").selectOption({ label: "Cotton woven" });
    await page.locator("#save-pattern").click();
    await waitForRevisionCount(page, styleId, 2);
    ({ state, revisions } = await readExpectedRevisions(page, styleId, 2, "Woven recipe save"));
    const wovenRevision = revisions[1];
    assert.ok(wovenRevision, `Woven recipe save has a second revision: ${JSON.stringify(revisions.map(({ revisionId, revisionNumber }) => ({ revisionId, revisionNumber })))}`);
    assert.equal(wovenRevision.design.workspace.garment, "woven-shirt", "the saved complex style selects the Woven shirt recipe");
    await setWovenHemTurn(page, 2);
    await page.locator("#save-pattern").click();
    await waitForRevisionCount(page, styleId, 3);
    ({ state, revisions } = await readExpectedRevisions(page, styleId, 3, "Woven option save"));
    const hemRevision = revisions[2];
    assert.ok(hemRevision, `Woven option save has a third revision: ${JSON.stringify(revisions.map(({ revisionId, revisionNumber }) => ({ revisionId, revisionNumber })))}`);
    const originalHemTurn = wovenRevision.design.garmentOptions["woven-shirt"]?.hemTurn ?? 1;
    const changedHemTurn = hemRevision.design.garmentOptions["woven-shirt"]?.hemTurn;
    assert.equal(originalHemTurn, 1, "the Woven baseline revision retains its original hem turn");
    assert.equal(changedHemTurn, 2, "the Woven edit is present in the saved immutable design payload");
    state = await compareAndRestore(page, styleId, wovenRevision, hemRevision, "hemTurn", 4);
    const restored = state.styles.find((style) => style.id === styleId);
    assert.equal(restored.design.workspace.garment, "woven-shirt", "restoring the complex recipe does not fall back to Tee");
    assert.notEqual(restored.revisionHeadId, wovenRevision.revisionId, "restore appends a new child instead of moving the head backward");
  }

  const beforeFreeze = await readDatabase(page);
  const frozenResult = await freezeCurrentOutputs(page, styleId);
  const manifest = frozenResult.manifest;
  const captureRevision = frozenResult.state.revisions.find((revision) => revision.revisionId === manifest.revisionId);
  assert.ok(captureRevision, "the frozen output set pins an existing immutable revision");
  assert.equal(manifest.payload.selectedSizes.length, 1, "the capture identifies exactly the currently selected size");
  assert.equal(manifest.payload.approvalRefs.length, 0, "no unrecorded approval is asserted");
  assert.ok(manifest.payload.unresolved.some((entry) => /physical fit/i.test(entry)), "the capture states the physical-fit boundary");
  assert.deepEqual(manifest.artifacts.map((artifact) => artifact.artifactId), [
    "selected-size-a0-pdf", "selected-size-dxf", "selected-size-svg", "selected-size-tiled-pdf",
    "whole-run-projector-svg", "whole-run-surface-sheet-svg", "whole-run-tech-pack-pdf",
  ]);

  const beforeRevisions = beforeFreeze.revisions.filter((revision) => revision.styleId === styleId);
  const frozenHeadId = beforeFreeze.styles.find((style) => style.id === styleId)?.revisionHeadId;
  assert.equal(manifest.revisionId, frozenHeadId, "the frozen output set pins the current saved style head");
  assert.equal(beforeRevisions.at(-1)?.revisionId, manifest.revisionId, "the captured revision is the final saved revision before the successor edit");
  const successorDelta = await saveChestDelta(page, styleId, beforeRevisions.length + 1, 1);
  const { state: afterSuccessor, revisions: afterRevisions } = await readExpectedRevisions(
    page, styleId, beforeRevisions.length + 1, `${kind} post-capture successor save`,
  );
  const successorRevision = afterRevisions.at(-1);
  assert.ok(successorRevision, `${kind} successor revision is persisted after the capture`);
  assert.equal(successorRevision.parentRevisionId, manifest.revisionId, "the successor is an immutable child of the captured revision");
  assert.equal(successorRevision.design.measurements.chest, successorDelta.after, "the successor contains the changed chest value");
  assert.deepEqual(afterRevisions.slice(0, beforeRevisions.length), beforeRevisions,
    "a later saved design leaves every earlier revision payload and digest unchanged");
  assert.deepEqual(afterSuccessor.manifests.filter((candidate) => candidate.styleId === styleId), [manifest],
    "a later saved design leaves the frozen manifest and all stored artifact bytes unchanged");

  const historyFile = path.join(EVIDENCE_DIR, `${evidencePrefix}-${kind}.png`);
  const captureFile = path.join(EVIDENCE_DIR, `${evidencePrefix}-${kind}-frozen.png`);
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const manager = await openManager(page);
  await manager.locator("#revision-history-title").scrollIntoViewIfNeeded();
  await page.screenshot({ path: historyFile, fullPage: true });
  await manager.locator("h4").filter({ hasText: "Frozen output captures" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: captureFile, fullPage: true });
  const download = await downloadFrozenArtifact(page, app, profile, manifest, manifest.artifacts.find((artifact) => artifact.artifactId === ARTIFACT_ID));
  return {
    kind,
    styleId,
    revisionCountAfterSuccessor: afterRevisions.length,
    frozenRevisionId: manifest.revisionId,
    packetDigest: manifest.packetDigest,
    artifactDigests: manifest.artifacts.map(({ artifactId, byteLength, sha256 }) => ({ artifactId, byteLength, sha256 })),
    downloadedArtifact: download,
    screenshot: path.relative(path.join(__dirname, ".."), historyFile).replaceAll(path.sep, "/"),
    screenshotSha256: sha256(fs.readFileSync(historyFile)),
    frozenCaptureScreenshot: path.relative(path.join(__dirname, ".."), captureFile).replaceAll(path.sep, "/"),
    frozenCaptureScreenshotSha256: sha256(fs.readFileSync(captureFile)),
    managerText: (await manager.textContent()).replace(/\s+/g, " ").trim().slice(0, 3000),
  };
}

async function createWovenStyle(page) {
  const manager = await openManager(page);
  const styleName = "S239 Woven revision proof";
  await manager.locator("#project-style-name").fill(styleName);
  await manager.locator('[data-project-action="create"]').click();
  await page.waitForFunction((name) =>
    document.querySelector("#project-manager-status")?.textContent?.includes(`Created ${name}`) ?? false,
  styleName, { timeout: 25000 });
}

async function exerciseEnvironment(environment, serverUrl) {
  const profile = makeTempDir(`infinidrip-s239-${environment}-profile-`);
  let app;
  let context;
  let page;
  try {
    const open = async () => {
      if (environment === "electron") {
        app = await launch({ userDataDir: profile, devServerUrl: serverUrl });
        page = await app.firstWindow();
      } else {
        context = await chromium.launchPersistentContext(profile, { headless: true, acceptDownloads: true });
        page = context.pages()[0] ?? await context.newPage();
        await page.goto(serverUrl);
      }
      await waitForReady(page);
    };
    await open();
    log(`${environment}: verifying Tee revision and frozen-output lifecycle`);
    const tee = await proveScenario(page, app, profile, "tee", `S239-${environment}`);
    await createWovenStyle(page);
    log(`${environment}: verifying Woven-shirt revision and frozen-output lifecycle`);
    const woven = await proveScenario(page, app, profile, "woven-shirt", `S239-${environment}`);

    const beforeRestart = await readDatabase(page);
    if (environment === "electron") {
      await closeApp(app);
      app = undefined;
    } else {
      await context.close();
      context = undefined;
    }
    await open();
    const afterRestart = await readDatabase(page);
    const expectedStyles = [tee.styleId, woven.styleId].sort();
    assert.deepEqual(afterRestart.styles.map((style) => style.id).filter((id) => expectedStyles.includes(id)).sort(), expectedStyles,
      `${environment} restores both styles after restart`);
    assert.deepEqual(afterRestart.revisions.filter((revision) => expectedStyles.includes(revision.styleId)),
      beforeRestart.revisions.filter((revision) => expectedStyles.includes(revision.styleId)),
      `${environment} restores immutable revision payloads and digests byte-for-byte`);
    assert.deepEqual(afterRestart.manifests.filter((manifest) => expectedStyles.includes(manifest.styleId)),
      beforeRestart.manifests.filter((manifest) => expectedStyles.includes(manifest.styleId)),
      `${environment} restores every frozen descriptor, digest and exact stored artifact byte`);

    const manager = await openManager(page);
    const downloads = [];
    for (const scenario of [tee, woven]) {
      const switchButton = manager.locator(`[data-project-action="switch"][data-style-id="${scenario.styleId}"]`);
      await switchButton.click();
      await page.waitForFunction(async (styleId) => {
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open("infinidrip-projects");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise((resolve, reject) => {
            const request = database.transaction("projects", "readonly").objectStore("projects").getAll();
            request.onsuccess = () => resolve(request.result.some((project) => project.activeStyleId === styleId));
            request.onerror = () => reject(request.error);
          });
        } finally {
          database.close();
        }
      }, scenario.styleId, { timeout: 20000 });
      await openManager(page);
      const state = await readDatabase(page);
      const manifest = state.manifests.find((item) => item.styleId === scenario.styleId);
      assert.ok(manifest, `${environment} still exposes the prior ${scenario.kind} frozen output capture`);
      const result = await downloadFrozenArtifact(page, app, profile, manifest, manifest.artifacts.find((artifact) => artifact.artifactId === ARTIFACT_ID));
      downloads.push({ kind: scenario.kind, ...result });
    }
    assert.equal(downloads.length, 2, `${environment} re-downloads one exact historical artifact for each style after restart`);
    return {
      environment,
      scenarios: [tee, woven],
      restartedStyleIds: expectedStyles,
      historicalDownloadsAfterRestart: downloads,
      browser: await page.evaluate(() => navigator.userAgent),
      electron: app ? await app.evaluate(() => process.versions.electron) : null,
      chromium: app ? await app.evaluate(() => process.versions.chrome) : await page.evaluate(() => navigator.userAgent),
    };
  } finally {
    await context?.close();
    await closeApp(app);
    removeTempDir(profile);
  }
}

async function main() {
  let server;
  let passed = false;
  try {
    server = await startPreviewServer();
    const browser = await exerciseEnvironment("chromium", server.url);
    const electron = await exerciseEnvironment("electron", server.url);
    const result = {
      slice: 239,
      status: "passed",
      createdAt: new Date().toISOString(),
      browser,
      electron,
      limits: [
        "The captured digests establish local byte identity only; they are not signatures, approvals, physical fit evidence, or factory acceptance.",
        "Electron restart is a normal close/relaunch check, not a power-loss or operating-system crash guarantee.",
      ],
    };
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE_DIR, "S239-rendered-verification.json"), `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
    passed = true;
  } finally {
    server?.stop();
    if (passed) log("Chromium + Electron revision, capture, successor, exact download, and restart gates passed");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
