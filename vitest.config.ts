import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // barrels and the browser entry hold no logic worth covering
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/main.ts"],
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
});
