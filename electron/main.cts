// The Electron main process — Slice 46's desktop shell. It does exactly two
// things: opens a window pointed at the SAME app that already runs in a
// browser (no renderer code changes because of this file), and owns the one
// new capability a browser tab can't have — writing a file to a path the user
// picked via a native save dialog. Everything else (drafting, grading,
// export, guidance) is unchanged pure-function TypeScript, running inside
// this window exactly as it did as a browser tab.
//
// A `.cts` source file: TypeScript always compiles this to CommonJS (.cjs),
// regardless of the root package.json's `"type": "module"` — the one thing
// this file needs to not fight the rest of the codebase over.
//
// Explicitly NOT in this slice: code signing (separate procurement track,
// MVP-PLAN.md §1.4), auto-update, and app-menu/window-state polish — those
// are the rest of MVP-PLAN.md Month 1.
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { writeFile } from "node:fs/promises";
import * as path from "node:path";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#0A1422", // matches main.ts's body background — no white flash on boot
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Dev: point at the Vite dev server (run `npm run dev` in a second terminal
  // first — this slice doesn't add a combined dev-server launcher, on purpose,
  // to keep the new-dependency count down for a spike). Packaged: load the
  // built app from disk — the same dist/ `npm run build` already produces,
  // untouched by this slice.
  if (app.isPackaged) {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173");
  }
}

// The renderer never touches the filesystem directly — it asks main to save
// (via preload.cts's bridge), main owns the dialog and the actual write. This
// is the entire IPC surface this slice adds: one channel, one job.
ipcMain.handle("save-file", async (_event, filename: string, content: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: filename });
  if (canceled || !filePath) return { saved: false };
  await writeFile(filePath, content, "utf-8");
  return { saved: true, filePath };
});

void app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
