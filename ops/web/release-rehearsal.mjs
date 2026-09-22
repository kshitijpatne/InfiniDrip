import { createHash } from "node:crypto";

const REQUIRED_CHECKS = ["tests", "build", "manifest", "smoke"];
const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT_ID = /^[0-9a-f]{7,40}$/;
const REF_ID = /^(?:refs\/)?[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasOnlyKeys(value, keys) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function validTimestamp(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function validCandidateId(value) {
  return typeof value === "string"
    && (COMMIT_ID.test(value) || (REF_ID.test(value) && !value.includes("..") && !value.includes("//") && !value.endsWith("/")));
}

function validManifest(manifest) {
  return isRecord(manifest)
    && hasOnlyKeys(manifest, ["schemaVersion", "base", "files"])
    && Object.keys(manifest).length === 3
    && Number.isInteger(manifest.schemaVersion)
    && manifest.schemaVersion > 0
    && manifest.base === "./"
    && Array.isArray(manifest.files)
    && manifest.files.every((file) => isRecord(file)
      && hasOnlyKeys(file, ["path", "bytes", "sha256"])
      && Object.keys(file).length === 3
      && typeof file.path === "string"
      && file.path.length > 0
      && !file.path.startsWith("/")
      && !file.path.includes("\\")
      && !file.path.split("/").includes("..")
      && Number.isInteger(file.bytes)
      && file.bytes >= 0
      && typeof file.sha256 === "string"
      && SHA256.test(file.sha256));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function checkFailures(checks) {
  return REQUIRED_CHECKS.filter((name) => !isRecord(checks) || checks[name] !== true);
}

function validatePreviousKnownGood(previousKnownGood) {
  if (!isRecord(previousKnownGood)) return ["previousKnownGood must be a candidate record"];
  const validation = validateCandidate(previousKnownGood, false);
  if (validation.failedChecks.length > 0) return ["previousKnownGood has failed required checks"];
  if (!validation.valid) return validation.errors.map((error) => `previousKnownGood: ${error}`);
  return [];
}

/**
 * Return a stable SHA-256 for a manifest emitted by create-artifact-manifest.mjs.
 * The strict manifest shape excludes timestamps and absolute host paths.
 */
export function manifestDigest(manifest) {
  if (!validManifest(manifest)) throw new TypeError("manifest must be a valid artifact manifest");
  return createHash("sha256").update(stableJson(manifest)).digest("hex");
}

/** Create a provider-neutral candidate record from an immutable artifact manifest. */
export function createCandidate({ candidateId, manifest, checks, approval, previousKnownGood } = {}) {
  if (!validCandidateId(candidateId)) throw new TypeError("candidateId must be a commit SHA or valid ref identity");
  if (!isRecord(checks) || !hasOnlyKeys(checks, REQUIRED_CHECKS)
    || REQUIRED_CHECKS.some((name) => typeof checks[name] !== "boolean")) {
    throw new TypeError("checks must explicitly contain boolean tests, build, manifest, and smoke results");
  }
  if (approval !== undefined && approval !== null && !isRecord(approval)) {
    throw new TypeError("approval must be an object, null, or undefined");
  }
  if (previousKnownGood !== undefined) {
    const errors = validatePreviousKnownGood(previousKnownGood);
    if (errors.length > 0) throw new TypeError(errors.join("; "));
  }
  return {
    candidateId,
    manifestDigest: manifestDigest(manifest),
    checks: { ...checks },
    approval: approval ?? null,
    ...(previousKnownGood === undefined ? {} : { previousKnownGood }),
  };
}

/** Validate a candidate record without contacting or changing any provider. */
export function validateCandidate(candidate, validatePrevious = true) {
  const errors = [];
  if (!isRecord(candidate)) return { valid: false, errors: ["candidate must be an object"], failedChecks: REQUIRED_CHECKS };
  if (!hasOnlyKeys(candidate, ["candidateId", "manifestDigest", "checks", "approval", "previousKnownGood"])) errors.push("candidate has unsupported fields");
  if (!validCandidateId(candidate.candidateId)) errors.push("candidateId must be a commit SHA or valid ref identity");
  if (typeof candidate.manifestDigest !== "string" || !SHA256.test(candidate.manifestDigest)) errors.push("manifestDigest must be a SHA-256 hex digest");
  if (!isRecord(candidate.checks) || !hasOnlyKeys(candidate.checks, REQUIRED_CHECKS)
    || REQUIRED_CHECKS.some((name) => typeof candidate.checks[name] !== "boolean")) {
    errors.push("checks must explicitly contain boolean tests, build, manifest, and smoke results");
  }
  if (!isRecord(candidate.approval) || typeof candidate.approval.reviewer !== "string" || candidate.approval.reviewer.trim() === "" || !validTimestamp(candidate.approval.timestamp)) {
    errors.push("approval requires a reviewer and ISO timestamp");
  }
  if (validatePrevious && candidate.previousKnownGood !== undefined) errors.push(...validatePreviousKnownGood(candidate.previousKnownGood));
  const failedChecks = checkFailures(candidate.checks);
  return { valid: errors.length === 0 && failedChecks.length === 0, errors, failedChecks };
}

/**
 * Rehearse a local promotion or rollback. The result is descriptive only and
 * performs no deployment, alias, account, or provider operation.
 */
export function rehearseRelease(candidate) {
  const validation = validateCandidate(candidate);
  const smokeOnlyFailure = validation.errors.length === 0
    && validation.failedChecks.length === 1
    && validation.failedChecks[0] === "smoke";
  if (smokeOnlyFailure) {
    const rollbackErrors = validatePreviousKnownGood(candidate.previousKnownGood);
    if (rollbackErrors.length === 0) {
      return { status: "rolled-back", failedChecks: validation.failedChecks, errors: [], selectedCandidate: candidate.previousKnownGood, operation: "none" };
    }
    return { status: "rejected", failedChecks: validation.failedChecks, errors: rollbackErrors, operation: "none" };
  }
  if (!validation.valid || validation.failedChecks.length > 0) {
    return { status: "rejected", failedChecks: validation.failedChecks, errors: validation.errors, operation: "none" };
  }
  return { status: "promotable", failedChecks: [], errors: [], selectedCandidate: candidate, operation: "none" };
}
