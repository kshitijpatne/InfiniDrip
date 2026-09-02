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
  // Slice 47: the menu (main process) tells the renderer which export was
  // picked; app.ts clicks the REAL matching button rather than main owning
  // any export logic, so the menu and the button are provably one code path.
  onExportRequested: (callback: (kind: string) => void): void => {
    ipcRenderer.on("menu:export", (_event, kind: string) => callback(kind));
  },
});
