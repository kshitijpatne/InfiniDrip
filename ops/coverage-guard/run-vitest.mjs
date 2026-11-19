import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
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

function normalizedRepoPath(value) {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function currentChangedProductionPaths() {
  const changed = [
    gitText("diff", "--name-only", "origin/main...HEAD"),
    gitText("diff", "--name-only", "HEAD"),
    gitText("ls-files", "--others", "--exclude-standard"),
  ].flatMap((output) => output.split(/\r?\n/))
    .map(normalizedRepoPath)
    .filter((path) => path.startsWith("src/") && path.endsWith(".ts") && !path.endsWith(".test.ts"));
  return new Set(changed);
}

/** A pre-final EPIC-32 coverage run must name a bounded set of exact files. */
export function explicitCoverageScope(args, changedProductionPaths) {
  const includes = [];
  const testFiles = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--coverage.include") {
      const value = args[index + 1];
      if (value) includes.push(normalizedRepoPath(value));
      index += 1;
      continue;
    }
    if (arg.startsWith("--coverage.include=")) {
      includes.push(normalizedRepoPath(arg.slice("--coverage.include=".length)));
      continue;
    }
    const path = normalizedRepoPath(arg);
    if (path.startsWith("src/") && path.endsWith(".test.ts") && !/[?*{}\[\]]/.test(path)) {
      testFiles.push(path);
    }
  }

  const uniqueIncludes = [...new Set(includes)];
  const uniqueTests = [...new Set(testFiles)];
  const validScope = uniqueTests.length > 0
    && uniqueTests.length <= 12
    && uniqueIncludes.length > 0
    && uniqueIncludes.length <= 16
    && uniqueTests.every((path) => existsSync(resolve(repositoryRoot, path)))
    && uniqueIncludes.every((path) => existsSync(resolve(repositoryRoot, path))
      && (changedProductionPaths === undefined || changedProductionPaths.has(path))
      && path.startsWith("src/")
      && path.endsWith(".ts")
      && !path.endsWith(".test.ts")
      && !path.endsWith(".d.ts")
      && path !== "src/main.ts"
      && !path.endsWith("/index.ts")
      && !/[?*{}\[\]]/.test(path));
  return validScope ? uniqueIncludes : null;
}

export function explicitTestSelection(args) {
  const candidates = args.map(normalizedRepoPath)
    .filter((arg) => arg.startsWith("src/") && arg.endsWith(".test.ts"));
  if (candidates.length === 0 || candidates.length > 12
    || candidates.some((path) => /[?*{}\[\]]/.test(path))) return null;
  const tests = [...new Set(candidates)];
  return tests.every((path) => existsSync(resolve(repositoryRoot, path))) ? tests : null;
}

function explicitTestNamePattern(args) {
  const patterns = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-t" || arg === "--testNamePattern" || arg === "--test-name-pattern") {
      patterns.push(args[index + 1] ?? "");
      index += 1;
    } else if (arg.startsWith("--testNamePattern=") || arg.startsWith("--test-name-pattern=")) {
      patterns.push(arg.slice(arg.indexOf("=") + 1));
    }
  }
  return patterns.length === 1 ? patterns[0].trim() : null;
}

function hasLiteralFocusedTestNamePattern(args) {
  const pattern = explicitTestNamePattern(args);
  return typeof pattern === "string"
    && pattern.length <= 100
    && /^[A-Za-z0-9 _-]+$/.test(pattern)
    && pattern.replace(/[^A-Za-z0-9]/g, "").length >= 3;
}

function hasUnexpectedTestSelector(args) {
  const optionsWithValues = new Set([
    "-t", "--testNamePattern", "--test-name-pattern", "--coverage.include",
    "--reporter", "-r", "--maxWorkers", "--minWorkers", "--testTimeout",
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (optionsWithValues.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("-")) continue;
    const path = normalizedRepoPath(arg);
    if (path.startsWith("src/") && path.endsWith(".test.ts") && !/[?*{}\[\]]/.test(path)) continue;
    return true;
  }
  return false;
}

/** EPIC-32 local Vitest runs stay exact-file focused until the terminal coverage gate. */
export function evaluateEpic32TestBoundary({ branch, args }) {
  if (!branch?.startsWith(epic32Prefix)) return { allowed: true, reason: "Non-EPIC-32 test run." };
  if (args.some((arg) => arg === "--watch" || arg === "--watchAll" || arg === "-w")) {
    return { allowed: false, reason: "EPIC-32 focused test runs must terminate; watch mode is held." };
  }
  const selectedTests = explicitTestSelection(args);
  if (selectedTests === null) {
    return {
      allowed: false,
      reason: "EPIC-32 runs require at most twelve exact test files; the full suite is reserved for final global coverage.",
    };
  }
  if (hasUnexpectedTestSelector(args)) {
    return {
      allowed: false,
      reason: "EPIC-32 test runs reject extra positional filters; pass only exact test files because the guarded runner adds Vitest's run subcommand itself.",
    };
  }
  const selectedAppTests = selectedTests.filter((path) => /^src\/ui\/app(?:-[^/]+)?\.test\.ts$/.test(path));
  if (selectedAppTests.length > 0 && selectedTests.length > selectedAppTests.length) {
    return {
      allowed: false,
      reason: "EPIC-32 route-filtered app tests must run alone because --testNamePattern applies to every selected file and otherwise silently skips domain tests.",
    };
  }
  if (selectedAppTests.length > 0 && !hasLiteralFocusedTestNamePattern(args)) {
    return {
      allowed: false,
      reason: "EPIC-32 app test files require one literal, focused -t/--testNamePattern filter to avoid unrelated mounted-app scenarios.",
    };
  }
  return { allowed: true, reason: "Exact-file focused EPIC-32 test run." };
}

export function evaluateCurrentTestRequest(args) {
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || gitText("branch", "--show-current");
  return evaluateEpic32TestBoundary({ branch, args });
}

export function evaluateEpic32CoverageBoundary({ branch, isCI, head, clean, readiness, priorAttempt }) {
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
  if (priorAttempt?.candidateSha === head) {
    failures.push("global coverage was already attempted for this frozen candidate; diagnose the saved run and repair before freezing a new candidate");
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

function localGitDirectory() {
  const gitDir = gitText("rev-parse", "--git-dir");
  return isAbsolute(gitDir) ? gitDir : resolve(repositoryRoot, gitDir);
}

function localGitCommonDirectory() {
  const commonDir = gitText("rev-parse", "--git-common-dir");
  return isAbsolute(commonDir) ? commonDir : resolve(repositoryRoot, commonDir);
}

function epic32VitestLockPath(absoluteGitDir) {
  return resolve(absoluteGitDir, "epic32-active-vitest-process.json");
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !(error && typeof error === "object" && "code" in error && error.code === "ESRCH");
  }
}

/** Allow only one EPIC-32 Vitest process across the repository's worktrees. */
export function claimEpic32VitestProcessLock({
  absoluteGitDir, branch, pid, startedAt = new Date().toISOString(), runId = randomUUID(),
  isProcessAlive: isAlive = processIsAlive,
}) {
  if (!branch?.startsWith(epic32Prefix)) {
    return { allowed: true, reason: "No EPIC-32 Vitest process lock applies." };
  }
  const lockPath = epic32VitestLockPath(absoluteGitDir);
  const record = { schemaVersion: 1, epicId: "EPIC-32", branch, pid, runId, startedAt };
  const create = () => {
    try {
      writeFileSync(lockPath, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
      return { allowed: true, reason: "Claimed the single active EPIC-32 Vitest process lock.", lockPath, runId };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") return null;
      throw error;
    }
  };
  const initial = create();
  if (initial) return initial;

  let active;
  try {
    active = JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    return { allowed: false, reason: "The EPIC-32 active-run lock is unreadable; inspect it before starting another test process." };
  }
  if (active?.schemaVersion !== 1 || active?.epicId !== "EPIC-32"
    || !Number.isSafeInteger(active?.pid) || active.pid <= 0 || typeof active.runId !== "string") {
    return { allowed: false, reason: "The EPIC-32 active-run lock is invalid; inspect it before starting another test process." };
  }
  if (isAlive(active.pid)) {
    return { allowed: false, reason: `EPIC-32 Vitest is already active on ${active.branch}; wait for that process to exit.` };
  }
  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  }
  const reclaimed = create();
  return reclaimed ?? { allowed: false, reason: "Another EPIC-32 Vitest process claimed the lock; do not overlap runs." };
}

export function validateEpic32VitestProcessLock({ lockPath, runId }) {
  try {
    const active = JSON.parse(readFileSync(lockPath, "utf8"));
    return active?.schemaVersion === 1 && active?.epicId === "EPIC-32" && active?.runId === runId
      ? { allowed: true, reason: "Vitest inherited the matching active EPIC-32 process lock." }
      : { allowed: false, reason: "The inherited EPIC-32 Vitest process lock does not match the active run." };
  } catch {
    return { allowed: false, reason: "The inherited EPIC-32 Vitest process lock is missing or unreadable." };
  }
}

export function releaseEpic32VitestProcessLock({ lockPath, runId }) {
  try {
    const active = JSON.parse(readFileSync(lockPath, "utf8"));
    if (active?.runId !== runId) return false;
    unlinkSync(lockPath);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

export function claimCurrentEpic32VitestProcessLock() {
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || gitText("branch", "--show-current");
  return claimEpic32VitestProcessLock({
    absoluteGitDir: localGitCommonDirectory(), branch, pid: process.pid,
  });
}

export function validateCurrentEpic32VitestProcessLock(runId) {
  return validateEpic32VitestProcessLock({
    lockPath: epic32VitestLockPath(localGitCommonDirectory()), runId,
  });
}

function coverageAttemptPath(absoluteGitDir, head) {
  const safeHead = String(head).replace(/[^a-zA-Z0-9_-]/g, "_");
  return resolve(absoluteGitDir, `epic32-global-coverage-attempt-${safeHead}.json`);
}

function loadLocalCoverageAttempt(head) {
  if (!head) return undefined;
  const path = coverageAttemptPath(localGitDirectory(), head);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { candidateSha: head, invalidRecord: true };
  }
}

/** Claim one terminal global run per frozen candidate before V8 instrumentation starts. */
export function claimEpic32GlobalCoverageAttempt({ absoluteGitDir, branch, head, startedAt = new Date().toISOString() }) {
  if (!branch?.startsWith(finalGatePrefix)) {
    return { allowed: true, reason: "No EPIC-32 final-candidate attempt lock applies." };
  }
  const recordPath = coverageAttemptPath(absoluteGitDir, head);
  const record = { schemaVersion: 1, epicId: "EPIC-32", branch, candidateSha: head, startedAt };
  try {
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
    return { allowed: true, reason: "Claimed the single global-coverage attempt for this frozen candidate." };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      return { allowed: false, reason: "Global coverage was already attempted for this frozen candidate." };
    }
    throw error;
  }
}

export function claimCurrentEpic32GlobalCoverageAttempt(args) {
  if (!requestsCoverage(args) || explicitCoverageScope(args, currentChangedProductionPaths()) !== null) {
    return { allowed: true, reason: "No global-coverage attempt lock applies to a focused run." };
  }
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || gitText("branch", "--show-current");
  return claimEpic32GlobalCoverageAttempt({
    absoluteGitDir: localGitDirectory(), branch, head: gitText("rev-parse", "HEAD"),
  });
}

export function evaluateCoverageRequest({ args, branch, isCI, head, clean, readiness, changedProductionPaths, priorAttempt }) {
  if (!requestsCoverage(args)) return { allowed: true, reason: "No coverage flag requested." };
  if (branch?.startsWith(epic32Prefix)
      && !branch.startsWith(finalGatePrefix)
      && explicitCoverageScope(args, changedProductionPaths) !== null) {
    return { allowed: true, reason: "Bounded exact-file focused EPIC-32 coverage request." };
  }
  return evaluateEpic32CoverageBoundary({ branch, isCI, head, clean, readiness, priorAttempt });
}

export function evaluateCurrentCoverageRequest(args) {
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || gitText("branch", "--show-current");
  const head = gitText("rev-parse", "HEAD");
  return evaluateCoverageRequest({
    args,
    branch,
    isCI: process.env.GITHUB_ACTIONS === "true",
    head,
    clean: gitText("status", "--porcelain").length === 0,
    readiness: loadLocalReadiness(),
    changedProductionPaths: currentChangedProductionPaths(),
    priorAttempt: loadLocalCoverageAttempt(head),
  });
}

function main() {
  const args = process.argv.slice(2);
  if (requestsCoverage(args)) {
    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || gitText("branch", "--show-current");
    const decision = evaluateCurrentCoverageRequest(args);
    if (!decision.allowed) {
      console.error(`Blocked coverage command: ${decision.reason}`);
      console.error(`EPIC-32 coverage is allowed only at the final frozen 56/56 gate (${finalGatePrefix}*).`);
      process.exitCode = 1;
      return;
    }
    if (explicitCoverageScope(args, currentChangedProductionPaths()) !== null) {
      const testDecision = evaluateCurrentTestRequest(args);
      if (!testDecision.allowed) {
        console.error(`Blocked focused coverage command: ${testDecision.reason}`);
        process.exitCode = 1;
        return;
      }
    }
    if (branch.startsWith(epic32Prefix)) console.log(decision.reason);
  } else {
    const testDecision = evaluateCurrentTestRequest(args);
    if (!testDecision.allowed) {
      console.error(`Blocked test command: ${testDecision.reason}`);
      process.exitCode = 1;
      return;
    }
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
