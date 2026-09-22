import test from "node:test";
import assert from "node:assert/strict";
import { readinessDrillFixture, summarizeReadinessDrill, validateReadinessDrill } from "./readiness-drill.mjs";

function fixture() {
  return structuredClone(readinessDrillFixture);
}

test("complete deterministic fixture validates with every required scenario", () => {
  assert.deepEqual(validateReadinessDrill(readinessDrillFixture), { valid: true, errors: [] });
  assert.deepEqual(readinessDrillFixture.scenarios.map((scenario) => scenario.id), [
    "static-preview-outage",
    "artifact-rollback",
    "local-save-backup-restore",
    "stale-feature-flag",
    "malformed-input",
    "local-export-and-delete",
    "hosted-provider-unavailable",
    "hosted-data-deletion",
  ]);
  assert.equal(JSON.stringify(readinessDrillFixture).includes("2026-"), false);
});

test("provider-backed scenarios remain deferred", () => {
  const drill = fixture();
  for (const scenario of drill.scenarios.filter((item) => item.scope === "provider")) {
    assert.equal(scenario.status, "deferred");
  }
  drill.scenarios[6].status = "passed";
  drill.scenarios[6].outcome = "passed";
  assert.equal(validateReadinessDrill(drill).valid, false);
});

test("validation rejects missing, unknown, duplicate, and malformed local records", () => {
  for (const required of readinessDrillFixture.scenarios.map((scenario) => scenario.id)) {
    const missing = fixture();
    missing.scenarios = missing.scenarios.filter((scenario) => scenario.id !== required);
    assert.match(validateReadinessDrill(missing).errors.join("\n"), new RegExp(`required scenario ${required} is missing`));
  }

  const unknown = fixture();
  unknown.scenarios[0].id = "unknown-scenario";
  assert.equal(validateReadinessDrill(unknown).valid, false);

  const duplicate = fixture();
  duplicate.scenarios[1].id = duplicate.scenarios[0].id;
  assert.equal(validateReadinessDrill(duplicate).valid, false);

  const failedAsPassed = fixture();
  failedAsPassed.scenarios[0].outcome = "failed";
  assert.match(validateReadinessDrill(failedAsPassed).errors.join("\n"), /local failure as passed/);

  const emptyEvidence = fixture();
  emptyEvidence.scenarios[0].evidence = " ";
  assert.equal(validateReadinessDrill(emptyEvidence).valid, false);
});

test("validation rejects secret-like and personal measurement fixture strings", () => {
  const secret = fixture();
  secret.scenarios[0].evidence = "api key: sample-value";
  assert.equal(validateReadinessDrill(secret).valid, false);

  const personalData = fixture();
  personalData.scenarios[0].evidence = "waist 80 cm was restored";
  assert.equal(validateReadinessDrill(personalData).valid, false);
});

test("summary is deterministic and never claims authenticated-beta or production readiness", () => {
  const expected = {
    overallState: "preview-only",
    localPassed: 6,
    localFailed: 0,
    providerDeferred: 2,
    authenticatedBetaReady: false,
    productionReady: false,
  };
  assert.deepEqual(summarizeReadinessDrill(readinessDrillFixture), expected);
  assert.deepEqual(summarizeReadinessDrill(fixture()), expected);
});
