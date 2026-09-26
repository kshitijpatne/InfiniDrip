// End-to-end proof of the project repository through Electron's real file://
// renderer. It migrates legacy data, closes the process, changes the app-file
// path, then verifies the versioned project, recovery, and idempotency marker.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { _electron: electron, chromium } = require("playwright");

const repositoryRoot = path.resolve(__dirname, "..");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "infinidrip-project-repository-"));
const profile = path.join(root, "profile");
const bundleDir = path.join(root, "bundle");
const installA = path.join(root, "install-a");
const installB = path.join(root, "install-b");
const mainFile = path.join(root, "main.cjs");
let app;

async function verifyBrowserPersistence() {
  const profile = path.join(root, "browser-profile");
  const html = fs.readFileSync(path.join(installA, "index.html"), "utf8");
  const bundle = fs.readFileSync(path.join(installA, "probe.js"));
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    if (/^\/install-[ab]\/index\.html$/.test(pathname)) {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      response.end(html);
      return;
    }
    if (/^\/install-[ab]\/probe\.js$/.test(pathname)) {
      response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" });
      response.end(bundle);
      return;
    }
    response.writeHead(404);
    response.end("Not found");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;

  async function run(pathName, mode) {
    const context = await chromium.launchPersistentContext(profile, { headless: true });
    try {
      const page = context.pages()[0] ?? await context.newPage();
      await page.goto(`${origin}/${pathName}/index.html#${mode}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => Boolean(window.__projectRepositoryProbeResult || window.__projectRepositoryProbeError),
        undefined,
        { timeout: 15000 },
      );
      const result = await page.evaluate(() => window.__projectRepositoryProbeResult ?? null);
      const error = await page.evaluate(() => window.__projectRepositoryProbeError ?? null);
      if (error) throw new Error(error);
      return { ...result, browserOrigin: origin, browserVersion: await page.evaluate(() => navigator.userAgent) };
    } finally {
      await context.close();
    }
  }

  try {
    const written = await run("install-a", "write");
    const reopened = await run("install-b", "read");
    assert.equal(written.protocol, "http:");
    assert.equal(reopened.protocol, "http:");
    assert.equal(written.browserOrigin, reopened.browserOrigin);
    assert.notEqual(written.href, reopened.href);
    assert.equal(written.migrationStatus, "migrated");
    assert.equal(reopened.migrationStatus, "already-migrated");
    assert.ok(written.readWriteDurabilityAttempts.includes("strict"));
    assert.ok(reopened.readWriteDurabilityAttempts.includes("strict"));
    assert.equal(reopened.project?.id, "a02b8322-8f57-46bb-9d16-16ac1fcf6811");
    assert.equal(reopened.style?.id, "b53a1a03-ea2e-4c4f-82dc-14ac86a29895");
    assert.equal(reopened.style?.design?.measurements?.chest, 100);
    assert.deepEqual(reopened.recovery?.payload?.rawMeasurements, { chest: "", neck: "40" });
    assert.equal(written.legacySaveUnchanged && written.legacyRecoveryUnchanged, true);
    assert.equal(reopened.legacySaveUnchanged && reopened.legacyRecoveryUnchanged, true);
    return {
      browserVersion: reopened.browserVersion,
      changedRoute: written.href !== reopened.href,
      migrationWasIdempotent: reopened.migrationStatus === "already-migrated",
      projectAndRecoverySurvivedRestart: Boolean(reopened.project && reopened.recovery),
      strictDurabilityRequested: written.readWriteDurabilityAttempts.includes("strict"),
      legacySourceUnchanged: written.legacySaveUnchanged && written.legacyRecoveryUnchanged,
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function buildProbe() {
  const { build } = await import("vite");
  await build({
    configFile: false,
    root: repositoryRoot,
    logLevel: "error",
    build: {
      lib: {
        entry: path.join(repositoryRoot, "electron", "project-repository-probe.ts"),
        formats: ["es"],
        fileName: "project-repository-probe",
      },
      outDir: bundleDir,
      emptyOutDir: true,
      minify: false,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
}

async function launchProbe(htmlPath, mode) {
  app = await electron.launch({
    executablePath: require("electron"),
    args: [mainFile, `--user-data-dir=${profile}`],
    env: {
      ...process.env,
      INFINIDRIP_PROJECT_PROBE_HTML: htmlPath,
      INFINIDRIP_PROJECT_PROBE_MODE: mode,
    },
  });
  try {
    const window = await app.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    await window.waitForFunction(() => Boolean(window.__projectRepositoryProbeResult), undefined, { timeout: 15000 });
    const outcome = await window.evaluate(() => window.__projectRepositoryProbeResult);
    const error = await window.evaluate(() => window.__projectRepositoryProbeError ?? null);
    if (error) throw new Error(error);
    return { ...outcome, chromiumVersion: await app.evaluate(() => process.versions.chrome) };
  } finally {
    await app.close();
    app = undefined;
  }
}

async function main() {
  try {
    fs.mkdirSync(profile);
    fs.mkdirSync(installA);
    fs.mkdirSync(installB);
    await buildProbe();
    for (const install of [installA, installB]) {
      fs.copyFileSync(path.join(bundleDir, "project-repository-probe.js"), path.join(install, "probe.js"));
      fs.writeFileSync(path.join(install, "index.html"), [
        "<!doctype html><meta charset=utf-8><title>project repository proof</title>",
        '<script type="module">',
        'import { runProjectRepositoryProbe } from "./probe.js";',
        'const setResult = (key, value) => Object.defineProperty(window, key, { value, configurable: true });',
        'runProjectRepositoryProbe(location.hash === "#write" ? "write" : "read")',
        '  .then((result) => setResult("__projectRepositoryProbeResult", result))',
        '  .catch((error) => setResult("__projectRepositoryProbeError", String(error?.stack ?? error)));',
        "</script>",
      ].join("\n"), "utf8");
    }
    fs.writeFileSync(mainFile, [
      'const { app, BrowserWindow } = require("electron");',
      'app.setName("InfiniDrip");',
      'app.whenReady().then(async () => {',
      '  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false } });',
      '  await window.loadFile(process.env.INFINIDRIP_PROJECT_PROBE_HTML, { hash: process.env.INFINIDRIP_PROJECT_PROBE_MODE });',
      '}).catch((error) => { console.error(error); app.exit(2); });',
    ].join("\n"), "utf8");

    const written = await launchProbe(path.join(installA, "index.html"), "write");
    const reopened = await launchProbe(path.join(installB, "index.html"), "read");
    assert.equal(written.protocol, "file:");
    assert.equal(reopened.protocol, "file:");
    assert.notEqual(written.href, reopened.href);
    assert.equal(written.migrationStatus, "migrated");
    assert.equal(reopened.migrationStatus, "already-migrated");
    assert.ok(written.readWriteDurabilityAttempts.includes("strict"));
    assert.ok(reopened.readWriteDurabilityAttempts.includes("strict"));
    assert.equal(reopened.project?.id, "a02b8322-8f57-46bb-9d16-16ac1fcf6811");
    assert.equal(reopened.style?.id, "b53a1a03-ea2e-4c4f-82dc-14ac86a29895");
    assert.equal(reopened.style?.design?.measurements?.chest, 100);
    assert.deepEqual(reopened.recovery?.payload?.rawMeasurements, { chest: "", neck: "40" });
    assert.equal(written.legacySaveUnchanged, true);
    assert.equal(written.legacyRecoveryUnchanged, true);
    assert.equal(reopened.legacySaveUnchanged, true);
    assert.equal(reopened.legacyRecoveryUnchanged, true);
    const browserProof = await verifyBrowserPersistence();
    console.log(JSON.stringify({
      result: "PASS",
      electronVersion: require("electron/package.json").version,
      chromiumVersion: reopened.chromiumVersion,
      writeHref: written.href,
      readHref: reopened.href,
      appFilePathChanged: written.href !== reopened.href,
      migrationWasIdempotent: reopened.migrationStatus === "already-migrated",
      strictDurabilityRequested: written.readWriteDurabilityAttempts.includes("strict"),
      strictDurabilityFallbackUsed: written.readWriteDurabilityAttempts.includes(null),
      projectAndRecoverySurvivedRestart: Boolean(reopened.project && reopened.recovery),
      legacySourceUnchanged: written.legacySaveUnchanged && written.legacyRecoveryUnchanged,
      browser: browserProof,
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
