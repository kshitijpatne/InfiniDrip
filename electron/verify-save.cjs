// electron/verify-save.cjs — Slice 46's end-to-end proof that native save
// actually works, not just that the code compiles.
//
// This is NOT part of `npm run coverage`. It can't be: jsdom (what the
// Vitest suite runs under) has no real IPC, no real save dialog, and no real
// filesystem. Everything in src/ui/app.test.ts about the electronAPI branch
// proves the RENDERER calls the bridge correctly — it necessarily mocks the
// bridge itself. This script is the other half: it launches the REAL
// Electron app (main process + preload + the real built renderer), stubs
// only the one piece that can't be automated (a human clicking a native OS
// file picker), and confirms a real file lands on disk with real content.
//
// Run it after `npm run build && npm run electron:build-main`:
//   node electron/verify-save.cjs            (dev mode: point --dev's
//                                              VITE_DEV_SERVER_URL at a
//                                              `npm run dev` you already have
//                                              running in another terminal)
//   node electron/verify-save.cjs --packaged (against a real `npm run
//                                              electron:pack` output —
//                                              defaults to the Linux
//                                              "release/linux-unpacked"
//                                              layout; edit PACKAGED_EXE
//                                              below for macOS/Windows)
//
// In CI or a headless container, run under xvfb-run (Electron needs a
// display even to boot the renderer): `xvfb-run -a node electron/verify-save.cjs`
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const PACKAGED = process.argv.includes("--packaged");
const OUT = path.join(os.tmpdir(), "infinidrip-verify-save.svg");

// Electron persists localStorage across launches by default — the same
// journey-progress persistence that makes the app usable is why a SECOND run
// against a REUSED profile would silently skip the welcome card (this was
// chased down as a real, reproducible false alarm while building this
// script: the app was working the whole time). A fresh profile per run keeps
// this script's own repeated invocations from confusing each other; a real
// installed app correctly keeps one profile forever.
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "infinidrip-verify-"));

async function main() {
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);

  const app = PACKAGED
    ? await electron.launch({
        executablePath: path.join(ROOT, "release/linux-unpacked/patternworks"),
        args: ["--no-sandbox", `--user-data-dir=${userDataDir}`],
      })
    : await electron.launch({
        args: [path.join(ROOT, "dist-electron/main.cjs"), "--no-sandbox", `--user-data-dir=${userDataDir}`],
        executablePath: require("electron"),
      });

  // Stub dialog.showSaveDialog in the REAL main process — the one piece a
  // script can't click. Everything downstream (the IPC channel, the actual
  // fs.writeFile in electron/main.cts) is the real, unmodified code.
  await app.evaluate(async ({ dialog }, outPath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: outPath });
  }, OUT);

  const win = await app.firstWindow();
  await win.waitForSelector("#welcome-start, #export-svg", { timeout: 15000 });
  const skip = win.locator("text=Skip tour");
  if (await skip.count()) await skip.first().click();
  await win.waitForSelector("#export-svg", { timeout: 15000, state: "visible" });
  await win.click("#export-svg");

  await new Promise((r) => setTimeout(r, 500)); // the save is async (ipcRenderer.invoke)

  const written = fs.existsSync(OUT);
  const content = written ? fs.readFileSync(OUT, "utf-8") : "";
  const ok = written && content.includes("<svg");

  console.log(`[${PACKAGED ? "packaged" : "dev"}] file written: ${written}, real SVG content: ${content.includes("<svg")}, ${content.length} bytes`);
  console.log(ok ? "PASS" : "FAIL");

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
