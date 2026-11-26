import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: { manifest: true },
  plugins: [{
    name: "uiq12-third-party-notices",
    generateBundle() {
      const fileName = "THIRD_PARTY_NOTICES.md";
      this.emitFile({ type: "asset", fileName, source: readFileSync(new URL(fileName, import.meta.url)) });
    },
  }],
});
