import { defineConfig } from "vite";

// `base: "./"` makes the built index.html reference assets with a RELATIVE
// path (./assets/...) instead of Vite's absolute-path default (/assets/...).
// Absolute paths resolve fine over http(s) — a real server has a root to
// resolve "/" against — but Electron's packaged build loads index.html via
// the file:// protocol (Slice 46), where a leading "/" resolves to the
// filesystem root, not the app's own directory. Without this, the packaged
// app's script tag 404s silently and the app never mounts. `npm run dev`
// (the Vite dev server, unaffected — it doesn't use the built index.html at
// all) and a plain `npm run build` for web hosting both still work correctly
// with relative paths; this is strictly safer, not Electron-only behavior.
export default defineConfig({
  base: "./",
});
