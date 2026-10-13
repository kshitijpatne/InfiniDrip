const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { unzipSync } = require("fflate");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../../../..");
const evidence = __dirname;
const fixture = JSON.parse(fs.readFileSync(path.join(evidence, "rendered-proof-fixture.json"), "utf8"));
const port = Number(process.env.S782_RENDERED_PROOF_PORT ?? 5197);
const url = `http://127.0.0.1:${port}`;

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      if (child.exitCode !== null) return reject(new Error(`Vite exited with ${child.exitCode}`));
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) return resolve();
        retry();
      });
      request.on("error", retry);
      request.setTimeout(500, () => request.destroy());
      function retry() {
        if (Date.now() - started > 20000) return reject(new Error("Timed out waiting for Vite."));
        setTimeout(attempt, 100);
      }
    };
    attempt();
  });
}

async function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStore(database, storeName) {
  return requestResult(database.transaction(storeName, "readonly").objectStore(storeName).getAll());
}

async function inspectPage(page) {
  return page.evaluate(async () => {
    const readStore = (database, storeName) => new Promise((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("infinidrip-projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const [styles, revisions, storedManifests] = await Promise.all([
        readStore(database, "styles"), readStore(database, "styleRevisions"), readStore(database, "exportManifests"),
      ]);
      const manifests = await Promise.all(storedManifests.map(async (manifest) => ({
        manifestId: manifest.manifestId,
        revisionId: manifest.revisionId,
        payload: manifest.payload,
        artifacts: await Promise.all(manifest.artifacts.map(async (artifact) => {
          const bytes = new Uint8Array(await artifact.bytes.arrayBuffer());
          let binary = "";
          for (let offset = 0; offset < bytes.length; offset += 0x8000) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
          }
          return {
            artifactId: artifact.artifactId,
            displayName: artifact.displayName,
            mediaType: artifact.mediaType,
            byteLength: artifact.byteLength,
            sha256: artifact.sha256,
            base64: btoa(binary),
          };
        })),
      })));
      return { styles, revisions, manifests };
    } finally {
      database.close();
    }
  });
}

async function main() {
  const server = spawn(process.execPath, [
    path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort",
  ], { cwd: root, stdio: "ignore", windowsHide: true });
  let browser;
  try {
    await waitForServer(server);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(`${url}/src/main.ts`);
    await page.evaluate(async (seed) => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open("infinidrip-projects", seed.version);
        request.onupgradeneeded = () => {
          const created = request.result;
          for (const [store, keyPath] of Object.entries({
            meta: "key", projects: "id", styles: "id", recoveries: "styleId", migrations: "sourceSha256",
            imports: "packageSha256", fieldObservations: "styleId", styleRevisions: "revisionId", exportManifests: "manifestId",
            measurementCaptures: ["styleId", "recipeId"],
          })) created.createObjectStore(store, { keyPath });
          const revisions = request.transaction.objectStore("styleRevisions");
          revisions.createIndex("styleId", "styleId", { unique: false });
          revisions.createIndex("styleIdAndNumber", ["styleId", "revisionNumber"], { unique: true });
          const manifests = request.transaction.objectStore("exportManifests");
          manifests.createIndex("styleId", "styleId", { unique: false });
          manifests.createIndex("styleIdAndCapturedAt", ["styleId", "capturedAt"], { unique: false });
          const captures = request.transaction.objectStore("measurementCaptures");
          captures.createIndex("styleId", "styleId", { unique: false });
          const plans = created.createObjectStore("gradePlans", { keyPath: ["styleId", "recipeId"] });
          plans.createIndex("styleId", "styleId", { unique: false });
          plans.createIndex("projectId", "projectId", { unique: false });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        const stores = Object.keys(seed.rows);
        const transaction = database.transaction(stores, "readwrite");
        for (const [store, records] of Object.entries(seed.rows)) {
          for (const record of records) transaction.objectStore(store).put(record);
        }
        await new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
      } finally {
        database.close();
      }
    }, fixture);
    await page.goto(url);
    await page.waitForSelector("#infini-shell");
    await page.waitForSelector("#project-manager-host .project-manager-details");
    const skip = page.locator("#welcome-skip");
    if (await skip.count() && await skip.isVisible()) await skip.click();
    const measure = page.locator("#journey-step-measure");
    if (await measure.count() && await measure.getAttribute("aria-current") !== "step") await measure.click();
    const manager = page.locator("#project-manager-host");
    const details = manager.locator(".project-manager-details");
    if (!(await details.evaluate((element) => element.open))) await details.locator("summary").click();
    await page.waitForSelector('.project-tech-pack[aria-label="Living technical pack"]');
    const initial = await inspectPage(page);
    const parentId = fixture.rows.styleRevisions[0].revisionId;
    const parentDigest = fixture.rows.styleRevisions[0].revisionContentDigest;
    const initialParent = initial.revisions.find((row) => row.revisionId === parentId);
    assert.equal(initialParent?.payload.payloadVersion, 1);
    assert.equal(initialParent?.revisionContentDigest, parentDigest);
    assert.match(await manager.locator(".project-tech-pack-share").innerText(), /saved revision not saved/);
    assert.equal(await manager.locator('[data-project-action="begin-tech-pack-review"]').isDisabled(), true);

    const fieldId = await page.evaluate(() => {
      const input = [...document.querySelectorAll('input[data-t01-input="true"][data-t01-field-property="value"]')]
        .find((element) => element.closest("label")?.textContent?.includes("Style code"));
      if (!input) throw new Error("T01 Style code input was not rendered.");
      return input.getAttribute("data-t01-field-id");
    });
    assert.ok(fieldId);
    const setT01Property = async (property, value) => {
      const control = page.locator(`[data-t01-input="true"][data-t01-field-id="${fieldId}"][data-t01-field-property="${property}"]`);
      await control.evaluate((element) => {
        const details = element.closest("details");
        if (details) details.open = true;
      });
      const tagName = await control.evaluate((element) => element.tagName);
      if (tagName === "SELECT") await control.selectOption(value);
      else await control.fill(value);
    };
    await setT01Property("value", "TP-S782-UI-01");
    await setT01Property("provenance", "USER_CAPTURED");
    await setT01Property("evidenceStatus", "USER_CONFIRMED");
    await setT01Property("validationStatus", "VALID");
    await setT01Property("method", "Entered for S782 browser proof");
    await setT01Property("capturedBy", "S782 local maker");
    await setT01Property("capturedAt", "2026-09-24T16:00:01.000Z");
    await setT01Property("unresolvedReason", "");
    await setT01Property("nextAction", "");
    await manager.locator('[data-project-action="save-tech-pack"]').click();
    await page.waitForFunction(() => /Saved (?:T01|the tech pack) as immutable style revision/.test(
      document.querySelector("#project-manager-status")?.textContent ?? "",
    ))
      .catch(async (error) => {
        console.error("Rendered save status:", await manager.locator("#project-manager-status").innerText());
        await page.screenshot({ path: path.join(evidence, "rendered-debug-failure.png"), fullPage: true });
        throw error;
      });
    const savedStatus = await manager.locator("#project-manager-status").innerText();
    const saved = await inspectPage(page);
    const savedParent = saved.revisions.find((row) => row.revisionId === parentId);
    const child = saved.revisions.find((row) => row.parentRevisionId === parentId);
    assert.equal(savedParent?.payload.payloadVersion, 1);
    assert.equal(savedParent?.revisionContentDigest, parentDigest);
    assert.equal(saved.revisions.filter((row) => row.parentRevisionId === parentId).length, 1);
    assert.equal(child?.payload.payloadVersion, 2);
    assert.equal(child?.payload.techPack?.revisionId, child?.revisionId);
    assert.equal(child?.payload.techPack?.cover?.styleCode?.value, "TP-S782-UI-01");
    assert.equal(saved.styles[0].revisionHeadId, child?.revisionId);
    assert.equal(saved.styles[0].techPack.revisionId, child?.revisionId);
    assert.equal(saved.styles[0].techPack.revisionNumber, 2);
    await page.locator('[data-t01-field="cover.styleCode"]').scrollIntoViewIfNeeded();
    await page.locator('[data-t01-field="cover.styleCode"]').screenshot({
      path: path.join(evidence, "rendered-t01-saved-field.png"),
    });
    await page.screenshot({ path: path.join(evidence, "rendered-t01-saved.png"), fullPage: true });

    const scope = manager.locator('[data-tech-pack-share-scope]').first();
    await scope.check();
    await manager.locator("#tech-pack-share-actor").fill("S782 local reviewer");
    await manager.locator('[data-project-action="begin-tech-pack-review"]').click();
    await page.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Started local review"));
    await manager.locator("#tech-pack-share-actor").fill("S782 local approver");
    await manager.locator('[data-project-action="approve-tech-pack-review"]').click();
    await page.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Recorded scoped local approval"));
    page.on("dialog", (dialog) => dialog.accept());
    await manager.locator("#tech-pack-share-actor").fill("S782 local freezer");
    await manager.locator('[data-project-action="freeze-tech-pack-share"]').click();
    await page.waitForFunction(() => document.querySelector("#project-manager-status")?.textContent?.includes("Frozen 2 Tech Pack share files"), null, { timeout: 60000 });
    const frozen = await inspectPage(page);
    assert.equal(frozen.manifests.length, 1);
    assert.equal(frozen.manifests[0].revisionId, child?.revisionId);
    const shareEntries = [];
    for (const artifact of frozen.manifests[0].artifacts) {
      const bytes = Buffer.from(artifact.base64, "base64");
      assert.equal(bytes.byteLength, artifact.byteLength);
      assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), artifact.sha256);
      const extension = path.extname(artifact.displayName).toLowerCase();
      const output = extension === ".pdf" ? "S782-legacy-v1-tech-pack.pdf"
        : extension === ".zip" ? "S782-legacy-v1-tech-pack.zip" : null;
      assert.ok(output, `Unexpected frozen Tech Pack artifact: ${artifact.displayName}`);
      fs.writeFileSync(path.join(evidence, output), bytes);
      shareEntries.push({
        artifactId: artifact.artifactId,
        displayName: artifact.displayName,
        mediaType: artifact.mediaType,
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
      });
    }
    assert.equal(shareEntries.filter((artifact) => artifact.mediaType === "application/pdf").length, 1);
    assert.equal(shareEntries.filter((artifact) => artifact.mediaType === "application/zip").length, 1);
    const zipBytes = fs.readFileSync(path.join(evidence, "S782-legacy-v1-tech-pack.zip"));
    const zipArchive = unzipSync(zipBytes);
    const zipEntries = Object.entries(zipArchive).map(([name, bytes]) => ({
      name,
      byteLength: bytes.byteLength,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    })).sort((left, right) => left.name.localeCompare(right.name));
    assert.ok(zipEntries.length > 0, "The frozen Tech Pack ZIP must contain at least one readable entry.");
    const packageManifest = JSON.parse(Buffer.from(zipArchive["manifest.json"]).toString("utf8"));
    const zippedTechPack = JSON.parse(Buffer.from(zipArchive["records/tech-pack.json"]).toString("utf8"));
    assert.equal(packageManifest.revisionId, child?.revisionId);
    assert.equal(packageManifest.revisionNumber, 2);
    assert.equal(packageManifest.revisionContentDigest, child?.revisionContentDigest);
    assert.equal(zippedTechPack.revisionId, child?.revisionId);
    assert.equal(zippedTechPack.revisionNumber, 2);
    assert.equal(zippedTechPack.cover.styleCode.value, "TP-S782-UI-01");
    const zipInspection = {
      packageFormat: packageManifest.format,
      packageVersion: packageManifest.packageVersion,
      recipeId: packageManifest.recipeId,
      revisionId: packageManifest.revisionId,
      revisionNumber: packageManifest.revisionNumber,
      revisionContentDigest: packageManifest.revisionContentDigest,
      zippedT01StyleCode: zippedTechPack.cover.styleCode.value,
      zippedT01ApprovalState: zippedTechPack.approval.state,
      entries: zipEntries,
    };
    fs.writeFileSync(path.join(evidence, "rendered-tech-pack-artifact-manifest.json"), JSON.stringify({
      revisionId: child?.revisionId,
      packetDigest: frozen.manifests[0].payload.packetDigest,
      artifacts: shareEntries,
      zipInspection,
    }, null, 2));
    fs.writeFileSync(path.join(evidence, "rendered-tech-pack-zip-inspection.json"), JSON.stringify(zipInspection, null, 2));
    const renderedShare = await manager.locator(".project-tech-pack-share").innerText();
    assert.match(renderedShare, /Frozen for local share/);
    assert.match(renderedShare, /does not establish identity, physical fit, supplier acceptance or production readiness/);
    assert.match(await manager.locator("#project-manager-status").innerText(), /Frozen 2 Tech Pack share files/);
    await page.screenshot({ path: path.join(evidence, "rendered-t01-frozen.png"), fullPage: true });
    fs.writeFileSync(path.join(evidence, "rendered-proof-verification.json"), JSON.stringify({
      status: "PASS",
      browser: await page.evaluate(() => navigator.userAgent),
      migratedHeadPayloadVersion: initialParent.payload.payloadVersion,
      migratedHeadDigestPreserved: savedParent.revisionContentDigest === parentDigest,
      childPayloadVersion: child.payload.payloadVersion,
      exactlyOneChild: saved.revisions.filter((row) => row.parentRevisionId === parentId).length === 1,
      childT01Value: child.payload.techPack.cover.styleCode.value,
      renderedSaveStatus: savedStatus,
      renderedReviewStarted: true,
      renderedApprovalRecorded: true,
      renderedLocalShareFrozen: true,
      frozenManifestRevisionId: frozen.manifests[0].revisionId,
      frozenShareArtifacts: shareEntries,
      zipT01RevisionId: zipInspection.revisionId,
      zipEntryNames: zipEntries.map((entry) => entry.name),
      productionAndPhysicalDisclaimerVisible: true,
    }, null, 2));
    console.log("S782 rendered legacy-v1 T01 save/review/freeze proof: PASS");
    console.log(JSON.stringify({ childRevisionId: child.revisionId, status: "Frozen 2 Tech Pack share files" }));
    await context.close();
  } finally {
    await browser?.close();
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
