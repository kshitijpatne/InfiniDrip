// EPIC 9 — bounded, developer-only release-readiness verification.
//
// This script is intentionally host/package specific. It proves the current
// unpacked Electron artifact on the current host; it does not test signing,
// installers, updater feeds, or unsupported operating systems.
const fs = require("node:fs");
const path = require("node:path");
const {
  closeApp,
  launch,
  listFiles,
  makeTempDir,
  packagedExecutable,
  removeTempDir,
  sha256,
} = require("./verify-common.cjs");

const ROOT = path.resolve(__dirname, "..");
const PACKAGED = process.argv.includes("--packaged");
if (!PACKAGED) {
  console.error("EPIC 9 release verification requires --packaged; use electron:verify for the self-contained dev-shell check.");
  process.exit(2);
}

const EXPORTS = [
  { kind: "svg", button: "#export-svg", menu: "SVG", filename: "tee-M.svg", extension: ".svg", valid: (text) => /<svg(?:\s|>)/i.test(text) },
  { kind: "dxf", button: "#export-dxf", menu: "DXF", filename: "tee-M.dxf", extension: ".dxf", valid: (text) => text.includes("SECTION") && text.includes("ENTITIES") },
  { kind: "pdf", button: "#export-pdf", menu: "PDF", filename: "tee-M.pdf", extension: ".pdf", valid: (text) => text.startsWith("%PDF-") },
  { kind: "techpack", button: "#export-techpack", menu: "Tech Pack", filename: "tee-techpack.pdf", extension: ".pdf", valid: (text) => text.startsWith("%PDF-") },
  { kind: "projector", button: "#export-projector", menu: "Projector", filename: "tee-projector.svg", extension: ".svg", valid: (text) => /<svg(?:\s|>)/i.test(text) },
  { kind: "a0", button: "#export-a0", menu: "A0", filename: "tee-M-A0.pdf", extension: ".pdf", valid: (text) => text.startsWith("%PDF-") },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFile(filePath, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (!fs.existsSync(filePath)) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${filePath}`);
    await sleep(100);
  }
}

async function waitForStatus(win, text, timeoutMs = 5000) {
  await win.waitForFunction((expected) => {
    return (document.querySelector("#persist-status")?.textContent ?? "").includes(expected);
  }, text, { timeout: timeoutMs });
}

async function waitForShell(win) {
  await win.waitForSelector("#infini-shell", { state: "attached", timeout: 20000 });
  await win.waitForSelector("#canvas-host", { state: "attached", timeout: 20000 });
}

async function reachOutputStage(win) {
  await waitForShell(win);
  for (const id of ["#welcome-skip", "#welcome-start"]) {
    const button = win.locator(id);
    if (await button.count() && await button.first().isVisible()) {
      await button.first().click();
      break;
    }
  }
  if (await win.locator("#export-svg").isVisible()) return;
  const fit = win.locator("#journey-step-fit");
  if (await fit.count() && await fit.isVisible()) {
    await fit.click();
    await sleep(150);
  }
  for (let step = 0; step < 2; step += 1) {
    if (await win.locator("#export-svg").isVisible()) return;
    const next = win.locator("#journey-next");
    if (!await next.isVisible()) break;
    if (await next.isDisabled()) throw new Error(`Journey blocked before export: ${await win.locator("#journey-blocker").textContent()}`);
    await next.click();
    await sleep(150);
  }
  await win.waitForSelector("#export-svg", { state: "visible", timeout: 20000 });
}

function observePage(win) {
  const errors = [];
  win.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  win.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

async function setSaveDialog(app, mapping) {
  await app.evaluate(({ dialog }, paths) => {
    dialog.showSaveDialog = async (options) => {
      const raw = String(options?.defaultPath ?? "");
      const filename = raw.split(/[\\/]/).pop();
      return { canceled: false, filePath: paths[filename] ?? paths.__fallback };
    };
  }, mapping);
}

async function setCancelDialog(app) {
  await app.evaluate(({ dialog }) => {
    dialog.showSaveDialog = async () => ({ canceled: true });
  });
}

async function clickMenu(app, label) {
  return app.evaluate(({ Menu }, wanted) => {
    const menu = Menu.getApplicationMenu();
    const file = menu?.items.find((item) => item.label === "File");
    const exportMenu = file?.submenu?.items.find((item) => item.label === "Export");
    const item = exportMenu?.submenu?.items.find((entry) => entry.label === wanted);
    if (!item || item.enabled === false) return false;
    item.click();
    return true;
  }, label);
}

function outputText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function packageRoot(executable) {
  let current = path.dirname(executable);
  for (let index = 0; index < 6; index += 1) {
    if (fs.existsSync(path.join(current, "resources", "app.asar"))) return current;
    current = path.dirname(current);
  }
  throw new Error(`Packaged resources/app.asar not found near ${executable}`);
}

function recordOutput(evidence, entry, filePath, route) {
  const text = outputText(filePath);
  const bytes = fs.statSync(filePath).size;
  const valid = bytes > 20 && entry.valid(text);
  evidence.outputs.push({
    kind: entry.kind,
    route,
    file: filePath,
    bytes,
    sha256: sha256(filePath),
    valid,
  });
  if (!valid) throw new Error(`${route} ${entry.kind} output failed structural validation`);
}

async function runOfflineAndExports(evidence, outputDir) {
  const profile = makeTempDir("infinidrip-epic9-smoke-");
  let app;
  try {
    app = await launch({ packaged: true, userDataDir: profile, offline: true });
    const win = await app.firstWindow();
    const pageErrors = observePage(win);
    await waitForShell(win);

    const identity = await app.evaluate(({ app }) => ({ name: app.getName(), packaged: app.isPackaged }));
    const title = await win.title();
    evidence.smoke = { identity, title };
    if (identity.name !== "InfiniDrip" || identity.packaged !== true || title !== "InfiniDrip") {
      throw new Error(`Packaged identity/title mismatch: ${JSON.stringify({ identity, title })}`);
    }

    const freshWelcome = await win.locator("#welcome-skip").isVisible().catch(() => false)
      || await win.locator("#welcome-start").isVisible().catch(() => false);
    evidence.freshProfile = { welcomeVisible: freshWelcome };
    if (!freshWelcome) throw new Error("Fresh packaged profile did not show the first-run welcome state");
    const freshScreenshot = path.join(outputDir, "packaged-fresh-profile.png");
    await win.screenshot({ path: freshScreenshot, fullPage: true });
    evidence.rendered = { freshProfile: freshScreenshot };

    // Reload with the browser's network routes denied as a second offline
    // assertion; packaged assets must remain file-local.
    await win.route(/^https?:\/\//, (route) => route.abort());
    await win.reload({ waitUntil: "domcontentloaded" });
    await waitForShell(win);
    evidence.offlineReload = true;

    // Stale save/recovery values must not crash or become accepted design
    // state. The renderer's normal safe fallback is the expected result.
    await win.evaluate(() => {
      localStorage.setItem("patternworks_save_v1", "{not-json");
      localStorage.setItem("patternworks_recovery_v1", JSON.stringify({ v: 999, stale: true }));
    });
    await win.reload({ waitUntil: "domcontentloaded" });
    await waitForShell(win);
    const staleState = await win.evaluate(() => ({
      shell: Boolean(document.querySelector("#infini-shell")),
      canvas: Boolean(document.querySelector("#canvas-host")),
      save: localStorage.getItem("patternworks_save_v1"),
      recovery: localStorage.getItem("patternworks_recovery_v1"),
    }));
    evidence.staleState = staleState;
    if (!staleState.shell || !staleState.canvas) throw new Error("Stale local state prevented packaged recovery");

    await reachOutputStage(win);
    const outputScreenshot = path.join(outputDir, "packaged-output-stage.png");
    await win.screenshot({ path: outputScreenshot, fullPage: true });
    evidence.rendered.outputStage = outputScreenshot;
    for (const entry of EXPORTS) {
      const buttonPath = path.join(outputDir, `button-${entry.kind}${entry.extension}`);
      const menuPath = path.join(outputDir, `menu-${entry.kind}${entry.extension}`);
      await setSaveDialog(app, { [entry.filename]: buttonPath, __fallback: buttonPath });
      await win.click(entry.button);
      await waitForFile(buttonPath);
      recordOutput(evidence, entry, buttonPath, "button");

      await setSaveDialog(app, { [entry.filename]: menuPath, __fallback: menuPath });
      const clicked = await clickMenu(app, entry.menu);
      if (!clicked) throw new Error(`File > Export > ${entry.menu} was not available`);
      await waitForFile(menuPath);
      recordOutput(evidence, entry, menuPath, "menu");

      const parity = sha256(buttonPath) === sha256(menuPath);
      evidence.parity.push({ kind: entry.kind, clicked, identical: parity });
      if (!parity) throw new Error(`Button/menu ${entry.kind} outputs differ`);
    }

    await setCancelDialog(app);
    const canceledPath = path.join(outputDir, "canceled.svg");
    await win.click("#export-svg");
    await waitForStatus(win, "Export canceled");
    evidence.failures.push({ kind: "save-cancel", passed: !fs.existsSync(canceledPath) });

    const badPath = path.join(outputDir, "missing-parent", "failed.svg");
    await setSaveDialog(app, { ["tee-M.svg"]: badPath, __fallback: badPath });
    await win.click("#export-svg");
    await waitForStatus(win, "Export failed");
    evidence.failures.push({ kind: "invalid-path", passed: !fs.existsSync(badPath), target: badPath });

    // A directory target is a reliable write failure on the current Windows
    // host. ACL mutation is intentionally not used by this developer check.
    await setSaveDialog(app, { ["tee-M.svg"]: outputDir, __fallback: outputDir });
    await win.click("#export-svg");
    await waitForStatus(win, "Export failed");
    evidence.failures.push({ kind: "directory-write-failure", passed: true, permissionSimulation: "host-safe directory target" });

    await app.evaluate(({ app }) => app.emit("activate"));
    const windowCount = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
    evidence.lifecycle = { activateWithWindowCount: windowCount };
    if (windowCount !== 1) throw new Error(`Activate changed the existing window count to ${windowCount}`);
    if (pageErrors.length) throw new Error(`Packaged renderer errors: ${pageErrors.join(" | ")}`);
  } finally {
    await closeApp(app);
    removeTempDir(profile);
  }
}

async function runWindowLifecycle(evidence) {
  const profile = makeTempDir("infinidrip-epic9-window-");
  let app;
  try {
    const statePath = path.join(profile, "window-state.json");
    fs.writeFileSync(statePath, JSON.stringify({ x: "stale", y: null, width: 1200, height: 800, isMaximized: "yes" }), "utf8");
    app = await launch({ packaged: true, userDataDir: profile, offline: true });
    const win = await app.firstWindow();
    await waitForShell(win);
    const recovered = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
    evidence.windowRecovery = { recovered };
    if (!Number.isFinite(recovered.x) || !Number.isFinite(recovered.y) || recovered.width < 400 || recovered.height < 300) {
      throw new Error(`Malformed window state was not safely recovered: ${JSON.stringify(recovered)}`);
    }
    await closeApp(app);
    app = undefined;

    const target = { x: 133, y: 97, width: 1200, height: 850 };
    app = await launch({ packaged: true, userDataDir: profile, offline: true });
    const first = await app.firstWindow();
    await waitForShell(first);
    await app.evaluate(({ BrowserWindow }, bounds) => BrowserWindow.getAllWindows()[0].setBounds(bounds), target);
    await sleep(200);
    const applied = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
    await closeApp(app);
    app = undefined;
    const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));

    app = await launch({ packaged: true, userDataDir: profile, offline: true });
    const second = await app.firstWindow();
    await waitForShell(second);
    const restored = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
    const positionOk = restored.x === persisted.x && restored.y === persisted.y;
    const driftOk = restored.width >= persisted.width && restored.width - persisted.width <= 16
      && restored.height >= persisted.height && restored.height - persisted.height <= 16;
    evidence.windowLifecycle = { target, applied, persisted, restored, positionOk, driftOk, relaunch: positionOk && driftOk };
    if (!positionOk || !driftOk) throw new Error(`Window state did not recover within the host tolerance: ${JSON.stringify(evidence.windowLifecycle)}`);
  } finally {
    await closeApp(app);
    removeTempDir(profile);
  }
}

function runPackageIntegrity(evidence, evidenceDir) {
  const executable = packagedExecutable();
  const root = packageRoot(executable);
  const asar = path.join(root, "resources", "app.asar");
  const inventory = listFiles(root);
  const rootBytes = Buffer.from(ROOT);
  const asarBytes = fs.readFileSync(asar);
  const noAbsoluteDevPath = !asarBytes.includes(rootBytes);
  evidence.package = {
    executable,
    root,
    appAsar: asar,
    inventoryFiles: inventory.length,
    inventorySha256: sha256(asar),
    executableBytes: fs.statSync(executable).size,
    noAbsoluteDevPath,
  };
  if (!fs.existsSync(executable) || !fs.existsSync(asar) || !noAbsoluteDevPath) {
    throw new Error(`Packaged artifact integrity check failed: ${JSON.stringify(evidence.package)}`);
  }
  fs.writeFileSync(path.join(evidenceDir, "package-manifest.json"), JSON.stringify({ ...evidence.package, inventory }, null, 2), "utf8");
}

async function main() {
  const evidenceDir = path.join(ROOT, "tmp", "epic9-release");
  fs.mkdirSync(evidenceDir, { recursive: true });
  const outputDir = path.join(evidenceDir, "outputs");
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  const evidence = {
    generatedAt: new Date().toISOString(),
    host: { platform: process.platform, arch: process.arch, node: process.version, electron: require("electron/package.json").version, packaged: PACKAGED },
    smoke: null,
    freshProfile: null,
    offlineReload: false,
    staleState: null,
    outputs: [],
    parity: [],
    rendered: null,
    failures: [],
    lifecycle: null,
    windowRecovery: null,
    windowLifecycle: null,
    package: null,
    errors: [],
  };
  let ok = true;
  try { runPackageIntegrity(evidence, evidenceDir); } catch (error) { ok = false; evidence.errors.push(`package: ${error.message}`); }
  try { await runOfflineAndExports(evidence, outputDir); } catch (error) { ok = false; evidence.errors.push(`smoke: ${error.message}`); }
  try { await runWindowLifecycle(evidence); } catch (error) { ok = false; evidence.errors.push(`window: ${error.message}`); }
  evidence.ok = ok && evidence.outputs.length === EXPORTS.length * 2
    && evidence.parity.every((entry) => entry.identical)
    && evidence.failures.every((entry) => entry.passed);
  fs.writeFileSync(path.join(evidenceDir, "verification.json"), JSON.stringify(evidence, null, 2), "utf8");
  console.log(JSON.stringify({ ok: evidence.ok, evidence: path.join(evidenceDir, "verification.json"), package: evidence.package, errors: evidence.errors }, null, 2));
  process.exit(evidence.ok ? 0 : 1);
}

void main();
