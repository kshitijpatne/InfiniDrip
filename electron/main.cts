// The Electron main process — Slice 46's desktop shell, extended in Slice 47
// with a real app identity, a real menu, and window-state persistence.
//
// It does exactly two core things (unchanged from 46): opens a window pointed
// at the SAME app that already runs in a browser (no renderer code forked),
// and owns the one new capability a browser tab can't have — writing a file
// to a path the user picked via a native save dialog.
//
// A `.cts` source file: TypeScript always compiles this to CommonJS (.cjs),
// regardless of the root package.json's `"type": "module"` — the one thing
// this file needs to not fight the rest of the codebase over.
//
// Explicitly NOT in this slice: code signing (separate procurement track,
// MVP-PLAN.md §1.4), auto-update — those remain outstanding in MVP-PLAN.md
// Month 1; wiring auto-update against no real release feed would be code
// that compiles but can't be honestly verified, which this project doesn't ship.
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItemConstructorOptions } from "electron";
import { writeFile } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as path from "node:path";

// Without this, `app.getName()` returns "Electron" in dev mode — verified
// empirically; it does NOT read package.json at all when launched by pointing
// electron directly at a .cjs file rather than a directory. Setting it
// explicitly keeps dev and packaged builds consistent without depending on
// package.json machinery either way. Must run before `whenReady()`.
app.setName("InfiniDrip");

// ── window state persistence ─────────────────────────────────────────────────
//
// Deliberately SYNCHRONOUS I/O, unlike save-file below. The state file is a
// few dozen bytes and is written exactly once, on the window's `close` event
// — an async write there risks the process exiting before it lands (Electron
// does not wait for a fire-and-forget promise before quitting), which would
// silently lose the save on every ordinary quit. A synchronous write removes
// that entire race rather than requiring an event.preventDefault()/finally()
// dance to paper over it.

interface WindowState {
  readonly x?: number;
  readonly y?: number;
  readonly width: number;
  readonly height: number;
  readonly isMaximized: boolean;
}
const DEFAULT_STATE: WindowState = { width: 1400, height: 900, isMaximized: false };
const stateFile = (): string => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState(): WindowState {
  try {
    const parsed = JSON.parse(readFileSync(stateFile(), "utf-8")) as Partial<WindowState>;
    // A corrupted or ancient file must never be able to open an unusably
    // small window — fall back to the default rather than trust it blindly.
    if (typeof parsed.width === "number" && parsed.width >= 400 &&
        typeof parsed.height === "number" && parsed.height >= 300) {
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // No saved state yet, or it's unreadable — the default is the honest fallback.
  }
  return DEFAULT_STATE;
}

function saveWindowState(win: BrowserWindow): void {
  const isMaximized = win.isMaximized();
  // getNormalBounds(), not getBounds(), when maximized — saving the maximized
  // (screen-filling) size as the "restored" size would grow the window every
  // launch on a smaller second monitor.
  const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
  const state: WindowState = { ...bounds, isMaximized };
  mkdirSync(path.dirname(stateFile()), { recursive: true });
  writeFileSync(stateFile(), JSON.stringify(state), "utf-8");
}

// ── menu ──────────────────────────────────────────────────────────────────────

// Every export button in the Output step, mirrored into a real menu — the
// SAME six kinds, the SAME labels (src/ui/view.ts's btn() calls). A click here
// sends one IPC message; app.ts's listener clicks the real button, so the
// menu and the button are provably the same code path, not two implementations.
const EXPORT_LABELS = {
  svg: "SVG",
  dxf: "DXF",
  pdf: "PDF",
  techpack: "Tech Pack",
  projector: "Projector",
  a0: "A0",
} as const;
type ExportKind = keyof typeof EXPORT_LABELS;

function buildMenu(win: BrowserWindow): void {
  const isMac = process.platform === "darwin";
  const exportSubmenu: MenuItemConstructorOptions[] = (Object.keys(EXPORT_LABELS) as ExportKind[]).map(
    (kind) => ({ label: EXPORT_LABELS[kind], click: () => win.webContents.send("menu:export", kind) })
  );

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{ label: app.name, submenu: [{ role: "about" as const }, { type: "separator" as const }, { role: "quit" as const }] }]
      : []),
    {
      label: "File",
      submenu: [
        { label: "Export", submenu: exportSubmenu },
        { type: "separator" },
        isMac ? { role: "close" as const } : { role: "quit" as const },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" }, { role: "redo" }, { type: "separator" },
        { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" }, { type: "separator" },
        { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── window creation ───────────────────────────────────────────────────────────

function createWindow(): void {
  const state = loadWindowState();
  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    backgroundColor: "#0A1422", // matches main.ts's body background — no white flash on boot
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (state.isMaximized) win.maximize();

  win.on("close", () => {
    saveWindowState(win);
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

  buildMenu(win);
}

// The renderer never touches the filesystem directly — it asks main to save
// (via preload.cts's bridge), main owns the dialog and the actual write. This
// is the entire IPC surface Slice 46 added: one channel, one job. Slice 47
// adds a second, one-directional channel (menu:export, main → renderer only)
// for the menu above.
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
