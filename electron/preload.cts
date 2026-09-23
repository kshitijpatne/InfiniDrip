// The only bridge between the renderer (the existing web app, completely
// unchanged) and the OS: `contextIsolation` stays on in main.cts — nothing
// else is exposed here, no filesystem, no Node globals leak through to the
// page. See src/ui/app.ts for both consumers of this bridge.
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (filename: string, content: string) =>
    ipcRenderer.invoke("save-file", filename, content) as Promise<{
      saved: boolean;
      filePath?: string;
    }>,
  putArtworkAsset: (asset: {
    assetId: string;
    name: string;
    mimeType: string;
    bytes: Uint8Array;
  }) => ipcRenderer.invoke("artwork:put", asset) as Promise<void>,
  getArtworkAsset: (assetId: string) =>
    ipcRenderer.invoke("artwork:get", assetId) as Promise<{
      assetId: string;
      name: string;
      mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
      bytes: Uint8Array;
    } | null>,
  removeArtworkAsset: (assetId: string) =>
    ipcRenderer.invoke("artwork:remove", assetId) as Promise<void>,
  // Slice 47: the menu (main process) tells the renderer which export was
  // picked; app.ts clicks the REAL matching button rather than main owning
  // any export logic, so the menu and the button are provably one code path.
  onExportRequested: (callback: (kind: string) => void): void => {
    ipcRenderer.on("menu:export", (_event, kind: string) => callback(kind));
  },
});
