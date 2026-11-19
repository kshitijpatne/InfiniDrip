import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const epic32Prefix = "codex/epic-32-";
const finalGatePrefix = "codex/epic-32-final-gate-";

export function requestsCoverage(args) {
  return args.some((arg) => /^--coverage(?:$|[.=])/.test(arg));
}

export function evaluateEpic32CoverageBoundary({ branch, isCI, head, clean, readiness }) {
  if (!branch) {
    return { allowed: false, reason: "Git branch is unknown; run coverage from a named branch." };
  }
  if (!branch.startsWith(epic32Prefix)) return { allowed: true, reason: "Non-EPIC-32 branch." };
  if (!branch.startsWith(finalGatePrefix)) {
    return {
      allowed: false,
      reason: "EPIC-32 global coverage is held until the final frozen 56/56 gate.",
    };
  }
  if (isCI) {
    return { allowed: true, reason: "Hosted coverage is restricted to the explicit final-gate branch." };
  }

  const failures = [];
  if (!clean) failures.push("the candidate worktree is not clean");
  if (!readiness || typeof readiness !== "object") {
    failures.push("the per-worktree final-gate readiness record is missing or invalid");
  } else {
    if (readiness.schemaVersion !== 1) failures.push("readiness schemaVersion must be 1");
    if (readiness.epicId !== "EPIC-32") failures.push("readiness epicId must be EPIC-32");
    if (readiness.goalId !== "01a15146-2f70-7f11-8690-ccbfc80320c7") {
      failures.push("readiness goalId does not match the active SBL goal");
    }
    if (readiness.branch !== branch) failures.push("readiness branch does not match the current branch");
    if (readiness.candidateSha !== head) failures.push("readiness candidateSha does not match HEAD");
    if (readiness.acceptedBlankCount !== 56) failures.push("all 56 blanks must be accepted");
    if (readiness.liveAcceptedBlankCount !== 56) failures.push("all 56 live acceptances must be complete");
    if (readiness.integratedReplayComplete !== true) failures.push("integrated replay must be complete");
    if (readiness.outputReviewComplete !== true) failures.push("integrated output review must be complete");
    if (readiness.candidateFrozen !== true) failures.push("the candidate must be frozen");
    if (!Array.isArray(readiness.evidenceRefs) || readiness.evidenceRefs.length === 0) {
      failures.push("readiness evidenceRefs must be non-empty");
    }
  }
  return failures.length
    ? { allowed: false, reason: `Final-gate readiness failed: ${failures.join("; ")}.` }
    : { allowed: true, reason: "Local final-gate readiness is complete and bound to this clean candidate." };
}

function gitText(...args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim();
}

function loadLocalReadiness() {
  const gitDir = gitText("rev-parse", "--git-dir");
  const absoluteGitDir = isAbsolute(gitDir) ? gitDir : resolve(repositoryRoot, gitDir);
  const recordPath = resolve(absoluteGitDir, "epic32-final-coverage-ready.json");
  if (!existsSync(recordPath)) return undefined;
  try {
    return JSON.parse(readFileSync(recordPath, "utf8"));
  } catch {
    return undefined;
  }
}

export function evaluateCoverageRequest({ args, branch, isCI, head, clean, readiness }) {
  if (!requestsCoverage(args)) return { allowed: true, reason: "No coverage flag requested." };
  return evaluateEpic32CoverageBoundary({ branch, isCI, head, clean, readiness });
}

function main() {
  const args = process.argv.slice(2);
  if (requestsCoverage(args)) {
    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || gitText("branch", "--show-current");
    const decision = evaluateCoverageRequest({
      args,
      branch,
      isCI: process.env.GITHUB_ACTIONS === "true",
      head: gitText("rev-parse", "HEAD"),
      clean: gitText("status", "--porcelain").length === 0,
      readiness: loadLocalReadiness(),
    });
    if (!decision.allowed) {
      console.error(`Blocked coverage command: ${decision.reason}`);
      console.error(`EPIC-32 coverage is allowed only at the final frozen 56/56 gate (${finalGatePrefix}*).`);
      process.exitCode = 1;
      return;
    }
    if (branch.startsWith(epic32Prefix)) console.log(decision.reason);
  }

  const vitestEntry = require.resolve("vitest/vitest.mjs", { paths: [repositoryRoot] });
  const watchMode = process.env.npm_lifecycle_event === "test:watch";
  const vitestArgs = watchMode ? args : ["run", ...args];
  const result = spawnSync(process.execPath, [vitestEntry, ...vitestArgs], {
    cwd: repositoryRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
