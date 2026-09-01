// The only bridge between the renderer (the existing web app, completely
// unchanged) and the OS: one method, one job. `contextIsolation` stays on in
// main.cts — nothing else is exposed here, no filesystem, no Node globals
// leak through to the page. See src/ui/app.ts's `download()` for the other
// half of this bridge (the `window.electronAPI` consumer).
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (filename: string, content: string) =>
    ipcRenderer.invoke("save-file", filename, content) as Promise<{
      saved: boolean;
      filePath?: string;
    }>,
});
