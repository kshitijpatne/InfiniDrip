import { defineConfig } from "vitest/config";

// Keep allocation-heavy adversarial scale fixtures in the ordinary test gate;
// coverage instrumentation uses equivalent bounded fixtures that exercise the
// same guards without multiplying the fixture's memory cost.
const coverageEnabled = process.argv.some((argument) => argument === "--coverage" || argument === "--coverage.enabled");
if (coverageEnabled) process.env.INFINIDRIP_COVERAGE = "1";

export default defineConfig({
  test: {
    // Operational Control Center and delivery-proof tests use Node's built-in
    // runner and are invoked explicitly by their own gate. Keep Vitest's
    // application suite focused on the TypeScript product tests.
    exclude: ["**/node_modules/**", "**/.git/**", "ops/**/*.test.mjs"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // barrels and the browser entry hold no logic worth covering
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/main.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
