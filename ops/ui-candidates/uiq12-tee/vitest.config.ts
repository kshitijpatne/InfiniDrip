import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.candidate-check.ts"],
    minWorkers: 1,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.candidate-check.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100, perFile: true },
    },
  },
});
