import test from "node:test";
import assert from "node:assert/strict";
import board from "./data/board.json" with { type: "json" };
import { importFacts } from "./import-facts.mjs";

test("imports only explicit verified facts into known evidence", () => {
  const imported = importFacts(board, [{
    evidenceId: "E-EPIC7-EXIT",
    uri: "docs/release/EPIC-7-EXIT-REPORT.md",
    kind: "exit-report",
    commit: "db14b63",
    sha256: null,
    verified: true,
    note: "Verified from the reviewed origin commit.",
  }]);
  const importedEvidence = imported.evidence.find((evidence) => evidence.id === "E-EPIC7-EXIT");
  const originalEvidence = board.evidence.find((evidence) => evidence.id === "E-EPIC7-EXIT");
  assert.equal(importedEvidence.commit, "db14b63");
  assert.equal(importedEvidence.note, "Verified from the reviewed origin commit.");
  assert.equal(originalEvidence.note, "Codex-reviewed Epic 7 exit report and origin commit.");
});

test("rejects unknown, mismatched, duplicate and unproven facts", () => {
  const base = {
    evidenceId: "E-EPIC7-EXIT",
    uri: "docs/release/EPIC-7-EXIT-REPORT.md",
    kind: "exit-report",
    commit: "db14b63",
    sha256: null,
    verified: true,
    note: "Verified.",
  };
  assert.throws(() => importFacts(board, [{ ...base, evidenceId: "MISSING" }]), /unknown evidence/);
  assert.throws(() => importFacts(board, [{ ...base, uri: "../outside.md" }]), /existing evidence URI/);
  assert.throws(() => importFacts(board, [{ ...base, commit: null }]), /commit or SHA-256/);
  assert.throws(() => importFacts(board, [base, base]), /duplicates/);
});
