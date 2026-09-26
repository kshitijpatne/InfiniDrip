// Proves that IndexedDB-backed design records survive Electron restarts when
// the renderer uses the packaged app's file:// origin, including an app-file
// path change. The profile is isolated and removed after the proof.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { _electron: electron } = require("playwright");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "infinidrip-idb-origin-"));
const profile = path.join(root, "profile");
const firstInstall = path.join(root, "install-a");
const secondInstall = path.join(root, "install-b");
const mainFile = path.join(root, "main.cjs");
const firstHtml = path.join(firstInstall, "index.html");
const secondHtml = path.join(secondInstall, "index.html");
let app;

async function launchProbe(htmlPath, mode) {
  app = await electron.launch({
    executablePath: require("electron"),
    args: [mainFile, `--user-data-dir=${profile}`],
    env: {
      ...process.env,
      INFINIDRIP_STORAGE_PROBE_HTML: htmlPath,
      INFINIDRIP_STORAGE_PROBE_MODE: mode,
    },
  });
  try {
    const window = await app.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    const result = await window.evaluate(async (selectedMode) => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open("infinidrip-g02-file-origin-proof", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("records", { keyPath: "id" });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
        request.onblocked = () => reject(new Error("IndexedDB open was blocked"));
      });
      const transaction = database.transaction(["records"], "readwrite");
      let stored;
      if (selectedMode === "write") {
        transaction.objectStore("records").put({ id: "probe", value: "kept-across-restart" });
        localStorage.setItem("infinidrip-g02-file-origin-proof", "legacy-storage-also-persists");
      } else {
        const request = transaction.objectStore("records").get("probe");
        request.onsuccess = () => { stored = request.result; };
      }
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      });
      return {
        mode: selectedMode,
        protocol: location.protocol,
        origin: location.origin,
        href: location.href,
        stored: stored ?? null,
        localStorage: localStorage.getItem("infinidrip-g02-file-origin-proof"),
      };
    }, mode);
    const chromiumVersion = await app.evaluate(() => process.versions.chrome);
    return { ...result, chromiumVersion };
  } finally {
    await app.close();
    app = undefined;
  }
}

async function main() {
  try {
    fs.mkdirSync(profile);
    fs.mkdirSync(firstInstall);
    fs.mkdirSync(secondInstall);
    fs.writeFileSync(mainFile, [
      'const { app, BrowserWindow } = require("electron");',
      'app.setName("InfiniDrip");',
      'app.whenReady().then(async () => {',
      '  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false } });',
      '  await window.loadFile(process.env.INFINIDRIP_STORAGE_PROBE_HTML);',
      '}).catch((error) => { console.error(error); app.exit(2); });',
    ].join("\n"), "utf8");
    fs.writeFileSync(firstHtml, "<!doctype html><meta charset=utf-8><title>storage probe A</title>", "utf8");
    fs.writeFileSync(secondHtml, "<!doctype html><meta charset=utf-8><title>storage probe B</title>", "utf8");

    const written = await launchProbe(firstHtml, "write");
    const reopened = await launchProbe(secondHtml, "read");
    assert.equal(written.protocol, "file:");
    assert.equal(reopened.protocol, "file:");
    assert.notEqual(written.href, reopened.href);
    assert.deepEqual(reopened.stored, { id: "probe", value: "kept-across-restart" });
    assert.equal(reopened.localStorage, "legacy-storage-also-persists");
    console.log(JSON.stringify({
      result: "PASS",
      electronVersion: require("electron/package.json").version,
      chromiumVersion: reopened.chromiumVersion,
      writeOrigin: written.origin,
      readOrigin: reopened.origin,
      writeHref: written.href,
      readHref: reopened.href,
      appFilePathChanged: written.href !== reopened.href,
      indexedDbSurvivedRestart: reopened.stored.value === "kept-across-restart",
      localStorageSurvivedRestart: reopened.localStorage === "legacy-storage-also-persists",
    }, null, 2));
  } finally {
    if (app) await app.close().catch(() => undefined);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
