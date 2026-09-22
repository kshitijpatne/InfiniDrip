const REQUIRED_SCENARIO_IDS = [
  "static-preview-outage",
  "artifact-rollback",
  "local-save-backup-restore",
  "stale-feature-flag",
  "malformed-input",
  "local-export-and-delete",
  "hosted-provider-unavailable",
  "hosted-data-deletion",
];

const LOCAL_SCENARIO_IDS = new Set(REQUIRED_SCENARIO_IDS.slice(0, 6));
const PROVIDER_SCENARIO_IDS = new Set(REQUIRED_SCENARIO_IDS.slice(6));
const SCENARIO_KEYS = ["id", "scope", "status", "outcome", "owner", "runbook", "fallback", "evidence"];
const SECRET_PATTERN = /(?:api[ _-]?key|access[ _-]?token|bearer\s+|password|credential|secret|(?:sk|ghp|github_pat)_[a-z0-9_-]+)/i;
const PERSONAL_MEASUREMENT_PATTERN = /\b(?:height|weight|waist|hip|chest|bust|inseam|body\s+measurement)\b[^\n]{0,24}\b\d+(?:\.\d+)?\s*(?:cm|mm|m|kg|lb|lbs|in|inches)\b/i;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasOnlyKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function unsafeString(value) {
  return SECRET_PATTERN.test(value) || PERSONAL_MEASUREMENT_PATTERN.test(value);
}

/**
 * Deterministic, synthetic no-cost readiness-drill fixture. It contains no
 * timestamps, secrets, personal data, provider calls, or readiness claim.
 */
export const readinessDrillFixture = Object.freeze({
  schemaVersion: 1,
  scenarios: Object.freeze([
    Object.freeze({ id: "static-preview-outage", scope: "local", status: "passed", outcome: "passed", owner: "preview-operator", runbook: "Serve the retained static artifact locally and inspect the noindex response.", fallback: "Use the retained local artifact while preview access is unavailable.", evidence: "Synthetic local response and artifact inspection completed." }),
    Object.freeze({ id: "artifact-rollback", scope: "local", status: "passed", outcome: "passed", owner: "release-reviewer", runbook: "Select the validated prior artifact through the local rehearsal contract.", fallback: "Keep the prior known-good artifact selected; no provider operation occurs.", evidence: "Synthetic smoke failure selected the local prior candidate." }),
    Object.freeze({ id: "local-save-backup-restore", scope: "local", status: "passed", outcome: "passed", owner: "workspace-operator", runbook: "Export a synthetic local workspace copy, clear the synthetic copy, then restore it.", fallback: "Retain the synthetic local export until restore verification completes.", evidence: "Synthetic workspace copy restored without user content." }),
    Object.freeze({ id: "stale-feature-flag", scope: "local", status: "passed", outcome: "passed", owner: "feature-owner", runbook: "Evaluate a throwaway flag definition and confirm stale metadata is disabled.", fallback: "Use the embedded safe default and readiness-only diagnostic.", evidence: "Synthetic stale metadata returned the local disabled diagnostic." }),
    Object.freeze({ id: "malformed-input", scope: "local", status: "passed", outcome: "passed", owner: "input-owner", runbook: "Submit a malformed synthetic record to strict validation.", fallback: "Reject the record and retain the last valid local state.", evidence: "Synthetic malformed record was rejected without coercion." }),
    Object.freeze({ id: "local-export-and-delete", scope: "local", status: "passed", outcome: "passed", owner: "local-data-owner", runbook: "Create a synthetic local export, verify it, then remove the synthetic local copy.", fallback: "Keep the verified local export under operator control until synthetic-copy deletion is confirmed.", evidence: "Synthetic export and synthetic-copy removal completed without user data." }),
    Object.freeze({ id: "hosted-provider-unavailable", scope: "provider", status: "deferred", outcome: "deferred", owner: "launch-owner", runbook: "Defer until launch readiness authorizes a provider outage exercise.", fallback: "Continue local-first drafting, save, and export without a provider.", evidence: "Deferred: no provider contact or hosted monitoring exercise was performed." }),
    Object.freeze({ id: "hosted-data-deletion", scope: "provider", status: "deferred", outcome: "deferred", owner: "launch-owner", runbook: "Defer until hosted deletion policy and provider operations are authorized.", fallback: "Keep data local; no hosted data is created by this drill.", evidence: "Deferred: no provider contact or hosted deletion exercise was performed." }),
  ]),
});

/**
 * Strictly validate a synthetic readiness drill without contacting a provider.
 * @param {unknown} drill
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateReadinessDrill(drill) {
  const errors = [];
  if (!isRecord(drill)) return { valid: false, errors: ["drill must be an object"] };
  if (!hasOnlyKeys(drill, ["schemaVersion", "scenarios"]) || Object.keys(drill).length !== 2) errors.push("drill has unsupported fields");
  if (drill.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!Array.isArray(drill.scenarios)) return { valid: false, errors: [...errors, "scenarios must be an array"] };

  const ids = new Set();
  for (const [index, scenario] of drill.scenarios.entries()) {
    const prefix = `scenarios[${index}]`;
    if (!isRecord(scenario)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (!hasOnlyKeys(scenario, SCENARIO_KEYS) || Object.keys(scenario).length !== SCENARIO_KEYS.length) errors.push(`${prefix} has unsupported fields`);
    if (!nonEmptyString(scenario.id)) errors.push(`${prefix}.id must be a non-empty string`);
    else if (ids.has(scenario.id)) errors.push(`${prefix}.id is duplicated`);
    else ids.add(scenario.id);
    if (!REQUIRED_SCENARIO_IDS.includes(scenario.id)) errors.push(`${prefix}.id is unknown`);
    for (const field of ["owner", "runbook", "fallback", "evidence"]) {
      if (!nonEmptyString(scenario[field])) errors.push(`${prefix}.${field} must be a non-empty string`);
    }
    for (const [field, value] of Object.entries(scenario)) {
      if (typeof value === "string" && unsafeString(value)) errors.push(`${prefix}.${field} contains a secret or personal measurement`);
    }
    if (LOCAL_SCENARIO_IDS.has(scenario.id)) {
      if (scenario.scope !== "local") errors.push(`${prefix} must be local`);
      if (!["passed", "failed"].includes(scenario.status)) errors.push(`${prefix}.status must be passed or failed`);
      if (scenario.outcome !== scenario.status) errors.push(`${prefix} cannot mark a local failure as passed`);
    }
    if (PROVIDER_SCENARIO_IDS.has(scenario.id)) {
      if (scenario.scope !== "provider") errors.push(`${prefix} must be provider-backed`);
      if (scenario.status !== "deferred" || scenario.outcome !== "deferred") errors.push(`${prefix} must remain deferred and cannot be passed`);
    }
  }
  for (const id of REQUIRED_SCENARIO_IDS) {
    if (!ids.has(id)) errors.push(`required scenario ${id} is missing`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Summarize a validated drill as preview-only readiness, never beta or production readiness.
 * @param {unknown} drill
 * @returns {{ overallState: string, localPassed: number, localFailed: number, providerDeferred: number, authenticatedBetaReady: false, productionReady: false }}
 */
export function summarizeReadinessDrill(drill) {
  const validation = validateReadinessDrill(drill);
  if (!validation.valid) throw new TypeError(`invalid readiness drill: ${validation.errors.join("; ")}`);
  const scenarios = drill.scenarios;
  return {
    overallState: "preview-only",
    localPassed: scenarios.filter((scenario) => scenario.scope === "local" && scenario.status === "passed").length,
    localFailed: scenarios.filter((scenario) => scenario.scope === "local" && scenario.status === "failed").length,
    providerDeferred: scenarios.filter((scenario) => scenario.scope === "provider" && scenario.status === "deferred").length,
    authenticatedBetaReady: false,
    productionReady: false,
  };
}
