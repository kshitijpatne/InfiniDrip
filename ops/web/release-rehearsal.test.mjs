import test from "node:test";
import assert from "node:assert/strict";
import { createCandidate, manifestDigest, rehearseRelease, validateCandidate } from "./release-rehearsal.mjs";

const manifest = {
  schemaVersion: 1,
  base: "./",
  files: [{ path: "assets/app.js", bytes: 3, sha256: "a".repeat(64) }],
};

const checks = { tests: true, build: true, manifest: true, smoke: true };
const approval = { reviewer: "release-reviewer", timestamp: "2026-09-22T14:00:00.000Z" };

function candidate(overrides = {}) {
  return createCandidate({ candidateId: "6ac4eddf", manifest, checks, approval, ...overrides });
}

test("whole-manifest digest is stable across object key ordering", () => {
  const reordered = { files: manifest.files.map((file) => ({ sha256: file.sha256, bytes: file.bytes, path: file.path })), base: "./", schemaVersion: 1 };
  assert.equal(manifestDigest(manifest), manifestDigest(reordered));
  assert.match(manifestDigest(manifest), /^[0-9a-f]{64}$/);
});

test("missing or failed required checks reject a candidate", () => {
  const missing = { ...candidate(), checks: { tests: true, build: true, manifest: true } };
  const failed = candidate({ checks: { ...checks, build: false } });
  assert.deepEqual(rehearseRelease(missing).failedChecks, ["smoke"]);
  assert.equal(rehearseRelease(missing).status, "rejected");
  assert.deepEqual(rehearseRelease(failed).failedChecks, ["build"]);
  assert.equal(rehearseRelease(failed).status, "rejected");
});

test("approval requires a reviewer and timestamp", () => {
  const unapproved = candidate({ approval: null });
  assert.equal(validateCandidate(unapproved).valid, false);
  assert.equal(rehearseRelease(unapproved).status, "rejected");
});

test("fully checked and approved candidate is promotable locally", () => {
  const result = rehearseRelease(candidate());
  assert.equal(result.status, "promotable");
  assert.deepEqual(result.failedChecks, []);
  assert.equal(result.operation, "none");
});

test("failed smoke selects the previous known-good candidate", () => {
  const previousKnownGood = candidate({ candidateId: "refs/heads/main" });
  const result = rehearseRelease(candidate({ checks: { ...checks, smoke: false }, previousKnownGood }));
  assert.equal(result.status, "rolled-back");
  assert.equal(result.selectedCandidate, previousKnownGood);
  assert.deepEqual(result.failedChecks, ["smoke"]);
});

test("failed smoke rejects an invalid rollback target", () => {
  const invalidPrevious = { ...candidate(), checks: { ...checks, tests: false } };
  const rejected = { ...candidate({ checks: { ...checks, smoke: false } }), previousKnownGood: invalidPrevious };
  const result = rehearseRelease(rejected);
  assert.equal(result.status, "rejected");
  assert.ok(result.errors.some((error) => error.includes("previousKnownGood")));
});

test("malformed candidate identities are rejected without coercion", () => {
  assert.throws(() => candidate({ candidateId: "not a ref" }), /candidateId/);
  const malformed = { ...candidate(), candidateId: "refs/heads/../main" };
  assert.equal(validateCandidate(malformed).valid, false);
});

test("a malformed candidate cannot roll back merely because smoke is false", () => {
  const previousKnownGood = candidate({ candidateId: "refs/heads/main" });
  const malformed = { ...candidate({ checks: { ...checks, smoke: false }, previousKnownGood }), candidateId: "not a ref" };
  const result = rehearseRelease(malformed);
  assert.equal(result.status, "rejected");
  assert.equal(result.selectedCandidate, undefined);
});
