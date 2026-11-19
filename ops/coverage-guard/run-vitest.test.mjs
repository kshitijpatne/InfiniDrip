import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  claimEpic32GlobalCoverageAttempt,
  claimEpic32VitestProcessLock,
  evaluateCoverageRequest,
  evaluateEpic32TestBoundary,
  explicitTestSelection,
  explicitCoverageScope,
  releaseEpic32VitestProcessLock,
} from "./run-vitest.mjs";

const implementationBranch = "codex/epic-32-s1335-r08-cargo";
const focusedArgs = [
  "src/drafting/trouser.test.ts",
  "--coverage.include=src/drafting/trouser.ts",
  "--coverage",
];
const changedProductionPaths = new Set(["src/drafting/trouser.ts"]);

test("accepts only bounded, exact focused test and production paths", () => {
  assert.deepEqual(explicitCoverageScope(focusedArgs, changedProductionPaths), ["src/drafting/trouser.ts"]);
  assert.equal(explicitCoverageScope(["--coverage", "src/drafting/trouser.test.ts"], changedProductionPaths), null);
  assert.equal(explicitCoverageScope([
    "--coverage",
    "src/drafting/*.test.ts",
    "--coverage.include=src/**/*.ts",
  ], changedProductionPaths), null);
  assert.equal(explicitCoverageScope([
    "--coverage",
    "src/drafting/trouser.test.ts",
    "--coverage.include=src/drafting/trouser-guidance.ts",
  ], changedProductionPaths), null);
});

test("requires Vitest coverage include files as repeated exact flags, not a comma glob", () => {
  const includes = new Set(["src/drafting/trouser.ts", "src/drafting/trouser-guidance.ts"]);
  assert.deepEqual(explicitCoverageScope([
    "--coverage",
    "src/drafting/trouser.test.ts",
    "--coverage.include=src/drafting/trouser.ts",
    "--coverage.include=src/drafting/trouser-guidance.ts",
  ], includes), ["src/drafting/trouser.ts", "src/drafting/trouser-guidance.ts"]);
  assert.equal(explicitCoverageScope([
    "--coverage",
    "src/drafting/trouser.test.ts",
    "--coverage.include=src/drafting/trouser.ts,src/drafting/trouser-guidance.ts",
  ], includes), null);
});

test("blocks unscoped and watch-mode EPIC-32 test runs while allowing exact test files", () => {
  assert.deepEqual(explicitTestSelection(["run", "src/drafting/trouser.test.ts"]), ["src/drafting/trouser.test.ts"]);
  assert.equal(explicitTestSelection(["run", "src/**/*.test.ts"]), null);
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch, args: ["run"] }).allowed, false);
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch, args: ["run", "--watch", "src/drafting/trouser.test.ts"] }).allowed, false);
  assert.deepEqual(evaluateEpic32TestBoundary({ branch: implementationBranch,
    args: ["src/drafting/trouser.test.ts"] }), {
    allowed: true,
    reason: "Exact-file focused EPIC-32 test run.",
  });
  assert.equal(evaluateEpic32TestBoundary({ branch: "codex/epic-31-fix", args: ["run"] }).allowed, true);
});

test("rejects a stray positional selector that could broaden the guarded runner's selection", () => {
  const decision = evaluateEpic32TestBoundary({
    branch: implementationBranch,
    args: ["run", "src/export/regression.test.ts", "--reporter=dot"],
  });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /extra positional filters/);
  assert.equal(evaluateEpic32TestBoundary({
    branch: implementationBranch,
    args: ["src/export/regression.test.ts", "--reporter=dot"],
  }).allowed, true);
});

test("blocks a full EPIC-32 coverage request before the final branch", () => {
  const decision = evaluateCoverageRequest({
    args: ["run", "--coverage"],
    branch: implementationBranch,
    isCI: false,
    head: "abc",
    clean: false,
    readiness: undefined,
    changedProductionPaths,
  });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /final frozen 56\/56 gate/);
});

test("permits an explicitly bounded focused EPIC-32 coverage request", () => {
  const decision = evaluateCoverageRequest({
    args: focusedArgs,
    branch: implementationBranch,
    isCI: false,
    head: "abc",
    clean: false,
    readiness: undefined,
    changedProductionPaths,
  });
  assert.deepEqual(decision, {
    allowed: true,
    reason: "Bounded exact-file focused EPIC-32 coverage request.",
  });
});

test("rejects more than sixteen production targets or twelve test files", () => {
  const tooManyTargets = [
    "src/drafting/trouser.test.ts",
    `--coverage.include=${Array.from({ length: 17 }, (_, index) => `src/target-${index}.ts`).join(",")}`,
  ];
  const tooManyTests = [
    "--coverage.include=src/drafting/trouser.ts",
    ...Array.from({ length: 13 }, (_, index) => `src/test-${index}.test.ts`),
  ];
  assert.equal(explicitCoverageScope(tooManyTargets), null);
  assert.equal(explicitCoverageScope(tooManyTests), null);
});

test("requires a narrow literal name filter whenever an app test file is selected", () => {
  const appFile = "src/ui/app-13-trouser-starters.test.ts";
  const domainFile = "src/drafting/trouser.test.ts";
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch, args: [appFile] }).allowed, false);
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch,
    args: [appFile, "--testNamePattern=.*"] }).allowed, false);
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch,
    args: [appFile, domainFile, "--testNamePattern=keeps the cargo identity"] }).allowed, false);
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch,
    args: [appFile, "-t", "R08"] }).allowed, true);
  assert.equal(evaluateEpic32TestBoundary({ branch: implementationBranch,
    args: [appFile, "--testNamePattern=keeps the cargo identity"] }).allowed, true);
});

test("serializes EPIC-32 Vitest processes across worktrees and releases only its own lock", () => {
  const gitDir = mkdtempSync(join(tmpdir(), "epic32-active-vitest-"));
  try {
    const first = claimEpic32VitestProcessLock({
      absoluteGitDir: gitDir,
      branch: implementationBranch,
      pid: 111,
      runId: "active-run",
      startedAt: "2026-11-19T00:00:00.000Z",
      isProcessAlive: (pid) => pid === 111,
    });
    assert.equal(first.allowed, true);
    const overlap = claimEpic32VitestProcessLock({
      absoluteGitDir: gitDir,
      branch: "codex/epic-32-s1336-next",
      pid: 222,
      runId: "overlap-run",
      isProcessAlive: (pid) => pid === 111,
    });
    assert.equal(overlap.allowed, false);
    assert.match(overlap.reason, /already active/);
    assert.equal(releaseEpic32VitestProcessLock({ ...first, runId: "wrong-owner" }), false);
    assert.equal(releaseEpic32VitestProcessLock(first), true);
    const next = claimEpic32VitestProcessLock({
      absoluteGitDir: gitDir,
      branch: "codex/epic-32-s1336-next",
      pid: 222,
      runId: "next-run",
      isProcessAlive: () => false,
    });
    assert.equal(next.allowed, true);
    assert.equal(releaseEpic32VitestProcessLock(next), true);
  } finally {
    rmSync(gitDir, { recursive: true, force: true });
  }
});

test("reclaims only a lock whose recorded process is confirmed dead", () => {
  const gitDir = mkdtempSync(join(tmpdir(), "epic32-stale-vitest-"));
  const lockPath = join(gitDir, "epic32-active-vitest-process.json");
  try {
    writeFileSync(lockPath, JSON.stringify({
      schemaVersion: 1, epicId: "EPIC-32", branch: implementationBranch,
      pid: 111, runId: "stale-run", startedAt: "2026-11-19T00:00:00.000Z",
    }));
    const alive = claimEpic32VitestProcessLock({
      absoluteGitDir: gitDir, branch: implementationBranch, pid: 222, runId: "next-run",
      isProcessAlive: () => true,
    });
    assert.equal(alive.allowed, false);
    const reclaimed = claimEpic32VitestProcessLock({
      absoluteGitDir: gitDir, branch: implementationBranch, pid: 222, runId: "next-run",
      isProcessAlive: () => false,
    });
    assert.equal(reclaimed.allowed, true);
    assert.equal(JSON.parse(readFileSync(lockPath, "utf8")).runId, "next-run");
    assert.equal(releaseEpic32VitestProcessLock(reclaimed), true);
  } finally {
    rmSync(gitDir, { recursive: true, force: true });
  }
});

test("requires the clean, exact 56/56 final candidate for terminal coverage", () => {
  const readiness = {
    schemaVersion: 1,
    epicId: "EPIC-32",
    goalId: "01a15146-2f70-7f11-8690-ccbfc80320c7",
    branch: "codex/epic-32-final-gate-integrated",
    candidateSha: "frozen-sha",
    acceptedBlankCount: 56,
    liveAcceptedBlankCount: 56,
    integratedReplayComplete: true,
    outputReviewComplete: true,
    candidateFrozen: true,
    evidenceRefs: ["docs/release/epic32/final-evidence.json"],
  };
  const ready = evaluateCoverageRequest({
    args: ["run", "--coverage"],
    branch: readiness.branch,
    isCI: false,
    head: readiness.candidateSha,
    clean: true,
    readiness,
  });
  assert.equal(ready.allowed, true);

  const dirty = evaluateCoverageRequest({
    args: ["run", "--coverage"],
    branch: readiness.branch,
    isCI: false,
    head: readiness.candidateSha,
    clean: false,
    readiness,
  });
  assert.equal(dirty.allowed, false);
  assert.match(dirty.reason, /worktree is not clean/);

  const repeated = evaluateCoverageRequest({
    args: ["run", "--coverage"],
    branch: readiness.branch,
    isCI: false,
    head: readiness.candidateSha,
    clean: true,
    readiness,
    priorAttempt: { candidateSha: readiness.candidateSha },
  });
  assert.equal(repeated.allowed, false);
  assert.match(repeated.reason, /already attempted for this frozen candidate/);
});

test("claims the terminal global coverage attempt once per frozen candidate", () => {
  const gitDir = mkdtempSync(join(tmpdir(), "epic32-coverage-boundary-"));
  try {
    const candidate = {
      absoluteGitDir: gitDir,
      branch: "codex/epic-32-final-gate-integrated",
      head: "frozen-sha",
      startedAt: "2026-11-19T00:00:00.000Z",
    };
    assert.equal(claimEpic32GlobalCoverageAttempt(candidate).allowed, true);
    assert.equal(JSON.parse(readFileSync(join(gitDir,
      "epic32-global-coverage-attempt-frozen-sha.json"), "utf8")).candidateSha, "frozen-sha");
    const repeated = claimEpic32GlobalCoverageAttempt(candidate);
    assert.equal(repeated.allowed, false);
    assert.match(repeated.reason, /already attempted for this frozen candidate/);
  } finally {
    rmSync(gitDir, { recursive: true, force: true });
  }
});
