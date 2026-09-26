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
import { access, mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
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
    if (typeof parsed.width === "number" && Number.isFinite(parsed.width) && parsed.width >= 400 &&
        typeof parsed.height === "number" && Number.isFinite(parsed.height) && parsed.height >= 300) {
      const x = typeof parsed.x === "number" && Number.isFinite(parsed.x) ? parsed.x : undefined;
      const y = typeof parsed.y === "number" && Number.isFinite(parsed.y) ? parsed.y : undefined;
      return {
        width: parsed.width,
        height: parsed.height,
        ...(x === undefined ? {} : { x }),
        ...(y === undefined ? {} : { y }),
        isMaximized: parsed.isMaximized === true,
      };
    }
  } catch {
    // No saved state yet, or it's unreadable — the default is the honest fallback.
  }
  return DEFAULT_STATE;
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const isMaximized = win.isMaximized();
    // getNormalBounds(), not getBounds(), when maximized — saving the maximized
    // (screen-filling) size as the "restored" size would grow the window every
    // launch on a smaller second monitor.
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    const state: WindowState = { ...bounds, isMaximized };
    mkdirSync(path.dirname(stateFile()), { recursive: true });
    writeFileSync(stateFile(), JSON.stringify(state), "utf-8");
  } catch {
    // A read-only profile must not turn an ordinary close into an app crash.
    // The next launch will use the safe default state.
  }
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

  // Defense-in-depth against a compromised or confused renderer: this app
  // never legitimately opens new windows or navigates away from its own
  // dev-server/dist origin, so both are denied outright rather than left to
  // Electron's permissive defaults.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    const target = new URL(url);
    const isDevServer = !app.isPackaged && target.origin === new URL(process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173").origin;
    const isFileLoad = app.isPackaged && target.protocol === "file:";
    if (!isDevServer && !isFileLoad) event.preventDefault();
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

ipcMain.handle("save-project-package", async (_event, filename: string, input: Uint8Array) => {
  if (typeof filename !== "string" || !/^[A-Za-z0-9._-]{1,80}\.infinidrip\.zip$/.test(filename)
    || !(input instanceof Uint8Array) || input.byteLength < 4 || input.byteLength > 256 * 1024 * 1024
    || input[0] !== 0x50 || input[1] !== 0x4b || input[2] !== 0x03 || input[3] !== 0x04) {
    throw new Error("Project backup data or file name is invalid.");
  }
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: filename });
  if (canceled || !filePath) return { saved: false };
  const bytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  await writeFile(filePath, bytes);
  return { saved: true, filePath };
});

// Local artwork bytes live under Electron's app-managed user-data directory.
// Renderer code supplies only a validated stable ID and bytes: it never gets
// a filesystem path or a general-purpose file API.
type ArtworkMime = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
interface ArtworkAssetInput {
  readonly assetId: string;
  readonly name: string;
  readonly mimeType: ArtworkMime;
  readonly bytes: Uint8Array;
}
const ARTWORK_EXTENSIONS: Readonly<Record<ArtworkMime, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const ARTWORK_ID = /^local-([0-9a-f]{32})-(png|jpg|webp|svg)$/;
const ARTWORK_LIMIT = 10 * 1024 * 1024;
const SVG_LIMIT = 2 * 1024 * 1024;
const ARTWORK_MAGIC = Buffer.from("IDAR");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function artworkRoot(): string {
  return path.join(app.getPath("userData"), "artwork-assets");
}

function artworkPath(assetId: string): string {
  return path.join(artworkRoot(), `${assetId}.asset`);
}

function validArtworkBytes(mimeType: ArtworkMime, bytes: Uint8Array): boolean {
  if (bytes.byteLength === 0 || bytes.byteLength > ARTWORK_LIMIT) return false;
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (mimeType === "image/png") return bytes.byteLength >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return bytes.byteLength >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255;
  if (mimeType === "image/webp") return bytes.byteLength >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
  if (bytes.byteLength > SVG_LIMIT) return false;

  // The renderer has already parsed and allowlist-sanitized SVG. Repeat the
  // important active-content/external-reference checks at the filesystem
  // boundary in case a renderer caller bypasses the file inspector.
  const svg = data.toString("utf8");
  if (!Buffer.from(svg, "utf8").equals(data) || !/^<svg(?:\s|>)/i.test(svg) ||
      /<!|<\?|<\s*(?:script|foreignObject|image|a|animate|animateMotion|animateTransform|set)\b|\s+on[a-z]+\s*=|\s+(?:href|xlink:href|style)\s*=/i.test(svg)) return false;
  const tags = [...svg.matchAll(/<\/?([A-Za-z][A-Za-z0-9]*)\b[^<>]*>/g)];
  const allowed = new Set(["svg", "g", "defs", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "title", "desc", "text", "tspan", "linearGradient", "radialGradient", "stop", "clipPath", "mask"]);
  return tags.length > 0 && tags.every((tag) => allowed.has(tag[1]!)) &&
    !/url\(\s*(?!#[A-Za-z_][A-Za-z0-9_.-]*\s*\))[^)]*\)/i.test(svg);
}

function validateArtworkInput(value: unknown): ArtworkAssetInput {
  if (!isRecord(value) || typeof value.assetId !== "string" || typeof value.name !== "string" ||
      typeof value.mimeType !== "string" || !(value.bytes instanceof Uint8Array)) {
    throw new Error("Artwork data is missing or malformed.");
  }
  const match = ARTWORK_ID.exec(value.assetId);
  if (!match) throw new Error("Invalid local artwork ID.");
  const mimeType = value.mimeType as ArtworkMime;
  if (!Object.prototype.hasOwnProperty.call(ARTWORK_EXTENSIONS, mimeType) || match[2] !== ARTWORK_EXTENSIONS[mimeType]) {
    throw new Error("Artwork type does not match its local ID.");
  }
  if (value.name.length === 0 || value.name.length > 180 || /[\\/\u0000-\u001f\u007f]/.test(value.name)) {
    throw new Error("Artwork filename is invalid.");
  }
  if (!validArtworkBytes(mimeType, value.bytes)) throw new Error("Artwork bytes failed local type, size, or safety checks.");
  return { assetId: value.assetId, name: value.name, mimeType, bytes: Uint8Array.from(value.bytes) };
}

function encodeArtworkAsset(asset: ArtworkAssetInput): Buffer {
  const header = Buffer.from(JSON.stringify({ assetId: asset.assetId, name: asset.name, mimeType: asset.mimeType }), "utf8");
  const result = Buffer.allocUnsafe(8 + header.length + asset.bytes.byteLength);
  ARTWORK_MAGIC.copy(result, 0);
  result.writeUInt32BE(header.length, 4);
  header.copy(result, 8);
  Buffer.from(asset.bytes).copy(result, 8 + header.length);
  return result;
}

async function saveArtworkAsset(value: unknown): Promise<void> {
  const asset = validateArtworkInput(value);
  const root = artworkRoot();
  await mkdir(root, { recursive: true });
  const target = artworkPath(asset.assetId);
  const temporary = path.join(root, `.${asset.assetId}.${randomUUID()}.tmp`);
  try {
    try {
      await access(target);
      throw new Error("That local artwork ID is already stored.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(encodeArtworkAsset(asset));
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

async function readArtworkAsset(assetIdValue: unknown): Promise<ArtworkAssetInput | null> {
  if (typeof assetIdValue !== "string" || !ARTWORK_ID.test(assetIdValue)) throw new Error("Invalid local artwork ID.");
  let file: Buffer;
  try {
    file = await readFile(artworkPath(assetIdValue));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("Could not read the local artwork store.");
  }
  if (file.length < 10 || file.length > ARTWORK_LIMIT + 2048 || !file.subarray(0, 4).equals(ARTWORK_MAGIC)) {
    throw new Error("The local artwork record is damaged.");
  }
  const headerLength = file.readUInt32BE(4);
  const payloadOffset = 8 + headerLength;
  if (headerLength < 2 || headerLength > 1024 || payloadOffset >= file.length) throw new Error("The local artwork record is damaged.");
  let metadata: unknown;
  try { metadata = JSON.parse(file.toString("utf8", 8, payloadOffset)); }
  catch { throw new Error("The local artwork record is damaged."); }
  if (!isRecord(metadata) || metadata.assetId !== assetIdValue || typeof metadata.name !== "string" ||
      typeof metadata.mimeType !== "string") throw new Error("The local artwork record is damaged.");
  const asset = validateArtworkInput({
    assetId: assetIdValue,
    name: metadata.name,
    mimeType: metadata.mimeType,
    bytes: Uint8Array.from(file.subarray(payloadOffset)),
  });
  return asset;
}

async function removeArtworkAsset(assetIdValue: unknown): Promise<void> {
  if (typeof assetIdValue !== "string" || !ARTWORK_ID.test(assetIdValue)) throw new Error("Invalid local artwork ID.");
  try { await unlink(artworkPath(assetIdValue)); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Could not remove the local artwork file.");
  }
}

ipcMain.handle("artwork:put", (_event, asset: unknown) => saveArtworkAsset(asset));
ipcMain.handle("artwork:get", (_event, assetId: unknown) => readArtworkAsset(assetId));
ipcMain.handle("artwork:remove", (_event, assetId: unknown) => removeArtworkAsset(assetId));

void app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
