// Developer-only end-to-end proof of the native save bridge.
//
// This launches the real Electron main process, preload, and built renderer.
// Only the native OS picker is stubbed; the IPC call, renderer export, main
// process write, and file inspection remain real. The dev mode starts a local
// Vite preview itself so the verification command is reproducible from a
// clean checkout. `--packaged` selects the host-supported unpacked artifact.
const fs = require("node:fs");
const path = require("node:path");
const {
  closeApp,
  launch,
  makeTempDir,
  removeTempDir,
  startPreviewServer,
} = require("./verify-common.cjs");

const PACKAGED = process.argv.includes("--packaged");

async function reachExportStage(win) {
  await win.waitForSelector("#infini-shell", { state: "attached", timeout: 15000 });
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
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  for (let step = 0; step < 2; step += 1) {
    if (await win.locator("#export-svg").isVisible()) return;
    const next = win.locator("#journey-next");
    if (!await next.isVisible()) break;
    if (await next.isDisabled()) throw new Error(`Journey blocked before export: ${await win.locator("#journey-blocker").textContent()}`);
    await next.click();
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  await win.waitForSelector("#export-svg", { state: "visible", timeout: 20000 });
}

async function main() {
  const userDataDir = makeTempDir("infinidrip-verify-save-");
  const outputDir = makeTempDir("infinidrip-verify-save-output-");
  let server;
  let app;
  let ok = false;
  try {
    if (!PACKAGED) server = await startPreviewServer();
    app = await launch({
      packaged: PACKAGED,
      userDataDir,
      devServerUrl: server?.url,
    });
    const outputPath = path.join(outputDir, "saved.svg");
    await app.evaluate(({ dialog }, config) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: config.outputPath });
    }, { outputPath });

    const win = await app.firstWindow();
    await reachExportStage(win);
    await win.click("#export-svg");
    // The renderer completes the IPC asynchronously. The filesystem is the
    // authoritative assertion for this bridge, not the transient status copy.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const written = fs.existsSync(outputPath);
    const content = written ? fs.readFileSync(outputPath, "utf8") : "";
    const hasSvg = /<svg(?:\s|>)/i.test(content);
    ok = written && hasSvg;
    console.log(`[${PACKAGED ? "packaged" : "dev"}] file written: ${written}, real SVG content: ${hasSvg}, ${content.length} bytes`);
    console.log(ok ? "PASS" : "FAIL");
  } catch (error) {
    console.error("VERIFY FAILED:", error);
  } finally {
    await closeApp(app);
    server?.stop();
    removeTempDir(userDataDir);
    removeTempDir(outputDir);
  }
  process.exit(ok ? 0 : 1);
}

void main();
