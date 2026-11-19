import { defineConfig } from "vitest/config";
import {
  claimCurrentEpic32GlobalCoverageAttempt,
  claimCurrentEpic32VitestProcessLock,
  currentChangedProductionPaths,
  evaluateCurrentTestRequest,
  evaluateCurrentCoverageRequest,
  explicitCoverageScope,
  releaseEpic32VitestProcessLock,
} from "./ops/coverage-guard/run-vitest.mjs";

// Keep allocation-heavy adversarial scale fixtures in the ordinary test gate;
// coverage instrumentation uses equivalent bounded fixtures that exercise the
// same guards without multiplying the fixture's memory cost.
const coverageEnabled = process.argv.some((argument) => /^--coverage(?:$|[.=])/.test(argument));
const vitestCliArgs = process.argv.slice(2);
// Vitest itself receives the `run` subcommand from the guarded wrapper (or
// direct CLI). Strip that command before checking selectors: the wrapper adds
// it, so accepting another positional `run` there could widen the file filter.
const coverageArgs = vitestCliArgs[0] === "run" ? vitestCliArgs.slice(1) : vitestCliArgs;
const focusedCoverageIncludes = coverageEnabled
  ? explicitCoverageScope(coverageArgs, currentChangedProductionPaths())
  : null;
if (coverageEnabled) {
  const decision = evaluateCurrentCoverageRequest(coverageArgs);
  if (!decision.allowed) {
    throw new Error(`Blocked coverage command: ${decision.reason} EPIC-32 global coverage requires the final frozen 56/56 gate.`);
  }
  if (focusedCoverageIncludes !== null) {
    const testDecision = evaluateCurrentTestRequest(coverageArgs);
    if (!testDecision.allowed) throw new Error(`Blocked focused coverage command: ${testDecision.reason}`);
  }
  const runLock = claimCurrentEpic32VitestProcessLock();
  if (!runLock.allowed) throw new Error(`Blocked test command: ${runLock.reason}`);
  if (runLock.runId) process.once("exit", () => releaseEpic32VitestProcessLock(runLock));
  if (focusedCoverageIncludes === null) {
    const attempt = claimCurrentEpic32GlobalCoverageAttempt(coverageArgs);
    if (!attempt.allowed) throw new Error(`Blocked coverage command: ${attempt.reason}`);
  }
  process.env.INFINIDRIP_COVERAGE = "1";
} else {
  const decision = evaluateCurrentTestRequest(coverageArgs);
  if (!decision.allowed) throw new Error(`Blocked test command: ${decision.reason}`);
  const runLock = claimCurrentEpic32VitestProcessLock();
  if (!runLock.allowed) throw new Error(`Blocked test command: ${runLock.reason}`);
  if (runLock.runId) process.once("exit", () => releaseEpic32VitestProcessLock(runLock));
}

export default defineConfig({
  test: {
    // The full coverage suite runs across many output-heavy app fixtures.
    // Keep one worker after the S1156 resource profile showed equivalent wall
    // time with substantially lower peak process memory.
    maxWorkers: 1,
    minWorkers: 1,
    // Operational Control Center and delivery-proof tests use Node's built-in
    // runner and are invoked explicitly by their own gate. Keep Vitest's
    // application suite focused on the TypeScript product tests.
    exclude: ["**/node_modules/**", "**/.git/**", "ops/**/*.test.mjs", "docs/**/*.test.mjs"],
    coverage: {
      provider: "v8",
      // An explicitly focused request overrides the repository default so a
      // narrow command cannot accidentally instrument every production module.
      include: focusedCoverageIncludes ?? ["src/**/*.ts"],
      // barrels and the browser entry hold no logic worth covering
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/main.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
