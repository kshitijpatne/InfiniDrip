// Slice 47 verification. Three real checks, no mocking of our own code:
//   1. app.getName() is "InfiniDrip" — not "Electron", not the raw npm name.
//   2. Clicking the REAL File > Export > SVG menu item (Electron's Menu API
//      lets a script click a menu item the way a click event would, since
//      Playwright cannot click a native OS menu) drives the exact same save
//      round-trip verify-save.cjs already proved for the mouse-click path.
//   3. Window bounds genuinely persist across a real restart: resize/move,
//      close (triggers the real synchronous save), relaunch with the SAME
//      profile, and the new window opens at the saved bounds — not a fresh
//      profile, on purpose, since persistence is exactly what's under test.
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

const ROOT = __dirname.endsWith("electron") ? path.join(__dirname, "..") : __dirname;
const OUT = path.join(os.tmpdir(), "infinidrip-verify-menu.svg");

const PACKAGED = process.argv.includes("--packaged");

async function launch(userDataDir) {
  return PACKAGED
    ? electron.launch({
        executablePath: path.join(ROOT, "release/linux-unpacked/InfiniDrip"),
        args: ["--no-sandbox", `--user-data-dir=${userDataDir}`],
      })
    : electron.launch({
        args: [path.join(ROOT, "dist-electron/main.cjs"), "--no-sandbox", `--user-data-dir=${userDataDir}`],
        executablePath: require("electron"),
      });
}

async function reachApp(win) {
  // A first-ever launch on a fresh profile shows the welcome card. A relaunch
  // on a profile that already has journey progress — which the window-state
  // test below deliberately does, reusing one profile across two launches to
  // test persistence — correctly skips it. Both are valid, expected states.
  try {
    await win.waitForSelector("#welcome-start", { timeout: 4000 });
    const skip = win.locator("text=Skip tour");
    if (await skip.count()) await skip.first().click();
  } catch {
    // Already past the welcome step on this profile — nothing to skip.
  }
  await win.waitForSelector("#export-svg", { timeout: 15000, state: "visible" });
}

async function main() {
  let allOk = true;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "infinidrip-verify-menu-"));

  // ── 1 & 2: identity + menu-triggered export ──────────────────────────────
  {
    if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
    const app = await launch(userDataDir);

    const name = await app.evaluate(({ app }) => app.getName());
    const identityOk = name === "InfiniDrip";
    console.log(`[identity] app.getName() = "${name}" — ${identityOk ? "PASS" : "FAIL"}`);
    allOk = allOk && identityOk;

    await app.evaluate(async ({ dialog }, outPath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: outPath });
    }, OUT);

    const win = await app.firstWindow();
    await reachApp(win);

    // The bug this slice actually shipped: index.html's <title> tag said
    // "Patternworks" — visible in every browser tab AND, since Electron syncs
    // the window title to the page's own <title> by default, in the desktop
    // window chrome too. A real, live check, not just app.getName().
    const title = await win.title();
    const titleOk = title === "InfiniDrip";
    console.log(`[title] window title = "${title}" — ${titleOk ? "PASS" : "FAIL"}`);
    allOk = allOk && titleOk;

    // Click the REAL menu item: File -> Export -> SVG, via Electron's own
    // Menu API (the only way to trigger a native menu without OS-level
    // automation Playwright doesn't have). This calls the exact `click`
    // handler registered in buildMenu(), sending the real IPC message.
    const clicked = await app.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const file = menu?.items.find((i) => i.label === "File");
      const exportMenu = file?.submenu?.items.find((i) => i.label === "Export");
      const svgItem = exportMenu?.submenu?.items.find((i) => i.label === "SVG");
      if (!svgItem) return false;
      svgItem.click();
      return true;
    });
    console.log(`[menu] found and clicked File > Export > SVG: ${clicked}`);

    await new Promise((r) => setTimeout(r, 500)); // the save is async (ipcRenderer.invoke)
    const written = fs.existsSync(OUT);
    const content = written ? fs.readFileSync(OUT, "utf-8") : "";
    const menuOk = clicked && written && content.includes("<svg");
    console.log(`[menu-export] file written: ${written}, real SVG: ${content.includes("<svg")} — ${menuOk ? "PASS" : "FAIL"}`);
    allOk = allOk && menuOk;

    await app.close();
  }

  // ── 3: window-state persistence, SAME profile across two launches ───────
  {
    const stateUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "infinidrip-verify-winstate-"));
    const appA = await launch(stateUserDataDir);
    const winA = await appA.firstWindow();
    await reachApp(winA);
    const target = { x: 133, y: 97, width: 1010, height: 715 };
    await appA.evaluate(({ BrowserWindow }, b) => {
      BrowserWindow.getAllWindows()[0].setBounds(b);
    }, target);
    await new Promise((r) => setTimeout(r, 200));
    await appA.close(); // triggers the real synchronous saveWindowState()

    const appB = await launch(stateUserDataDir); // SAME profile — persistence is the point
    const winB = await appB.firstWindow();
    await reachApp(winB);
    const restored = await appB.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
    console.log(`[window-state] set: ${JSON.stringify(target)}`);
    console.log(`[window-state] restored: ${JSON.stringify(restored)}`);
    const stateOk =
      restored.x === target.x && restored.y === target.y &&
      restored.width === target.width && restored.height === target.height;
    console.log(`[window-state] ${stateOk ? "PASS" : "FAIL"}`);
    allOk = allOk && stateOk;

    await appB.close();
    fs.rmSync(stateUserDataDir, { recursive: true, force: true });
  }

  fs.rmSync(userDataDir, { recursive: true, force: true });
  console.log(allOk ? "ALL PASS" : "SOME FAILED");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
