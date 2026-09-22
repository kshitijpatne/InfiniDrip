export const CURRENT_STATUSES = Object.freeze([
  "Backlog",
  "Ready",
  "In Progress",
  "Review",
  "Done",
  "Blocked",
  "Archived",
]);

export const ACTOR_ROLES = Object.freeze(["contributor", "reviewer", "maintainer"]);
export const ITEM_TYPES = Object.freeze(["epic", "slice", "task", "bug", "research"]);
export const PRIORITIES = Object.freeze(["P0", "P1", "P2", "P3"]);
export const RISKS = Object.freeze(["low", "medium", "high", "critical"]);
export const EVIDENCE_KINDS = Object.freeze([
  "commit",
  "exit-report",
  "test",
  "build",
  "browser",
  "decision",
  "document",
  "rendered-output",
  "incomplete",
]);

const CURRENT_STATUS_SET = new Set(CURRENT_STATUSES);
const HISTORY_STATUS_SET = new Set([
  ...CURRENT_STATUSES,
  "Draft",
  "In Review",
  "Accepted",
  "Closed",
  "Reopened",
]);
const ITEM_TYPE_SET = new Set(ITEM_TYPES);
const PRIORITY_SET = new Set(PRIORITIES);
const RISK_SET = new Set(RISKS);
const EVIDENCE_KIND_SET = new Set(EVIDENCE_KINDS);
const ROLE_SET = new Set(ACTOR_ROLES);
const UNFINISHED_STATUS_SET = new Set(["Backlog", "Ready", "In Progress", "Review", "Blocked"]);
const CONTRIBUTOR_TRANSITIONS = new Set([
  "Ready->In Progress",
  "In Progress->Review",
  "Blocked->Ready",
  "Blocked->In Progress",
]);
const REVIEWER_TRANSITIONS = new Set([
  "Backlog->Ready",
  "Review->Done",
  "Review->In Progress",
  "Blocked->Ready",
  "Blocked->In Progress",
]);
const ID_PATTERN = /^[A-Z0-9][A-Z0-9._-]{2,80}$/;
const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

const WORK_ITEM_FIELDS = new Set([
  "id",
  "type",
  "title",
  "epicId",
  "releaseId",
  "status",
  "openedAt",
  "targetAt",
  "deliveredAt",
  "priority",
  "risk",
  "owner",
  "contributor",
  "reviewer",
  "dependencies",
  "protectedSurfaces",
  "description",
  "expectation",
  "acceptanceCriteria",
  "statusHistory",
  "comments",
  "evidenceRefs",
  "flagKey",
]);

const LEGACY_TO_CURRENT = new Map([
  ["Draft", "Backlog"],
  ["In Review", "Review"],
  ["Accepted", "Done"],
  ["Closed", "Done"],
  ["Reopened", "In Progress"],
]);

export function normalizeHistoricalStatus(status) {
  return LEGACY_TO_CURRENT.get(status) ?? status;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isIsoDateTime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function isRepoRelativeUri(value) {
  return isNonEmptyString(value)
    && !value.startsWith("/")
    && !value.startsWith("\\")
    && !/^[a-z]+:/i.test(value)
    && !value.replaceAll("\\", "/").split("/").includes("..");
}

function addError(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function rejectUnknownFields(record, allowed, path, errors) {
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) addError(errors, `${path}.${key}`, "is not allowed");
  }
}

function validateStringArray(value, path, errors, { minItems = 0 } = {}) {
  if (!Array.isArray(value)) {
    addError(errors, path, "must be an array");
    return;
  }
  if (value.length < minItems) addError(errors, path, `must contain at least ${minItems} item(s)`);
  for (const [index, item] of value.entries()) {
    if (!isNonEmptyString(item)) addError(errors, `${path}[${index}]`, "must be a non-empty string");
  }
}

function uniqueIds(values, path, errors) {
  const seen = new Set();
  for (const [index, value] of values.entries()) {
    if (!isNonEmptyString(value)) {
      addError(errors, `${path}[${index}].id`, "must be a non-empty identifier");
    } else if (seen.has(value)) {
      addError(errors, `${path}[${index}].id`, `duplicates ${value}`);
    } else {
      seen.add(value);
    }
  }
  return seen;
}

function validateEpic(epic, index, evidenceIds, errors) {
  const path = `epics[${index}]`;
  if (!isRecord(epic)) {
    addError(errors, path, "must be an object");
    return;
  }
  const fields = new Set(["id", "title", "status", "owner", "description", "evidenceRefs"]);
  rejectUnknownFields(epic, fields, path, errors);
  for (const field of ["id", "title", "status", "owner", "description"]) {
    if (!isNonEmptyString(epic[field])) addError(errors, `${path}.${field}`, "must be a non-empty string");
  }
  validateStringArray(epic.evidenceRefs, `${path}.evidenceRefs`, errors);
  for (const ref of epic.evidenceRefs ?? []) {
    if (!evidenceIds.has(ref)) addError(errors, `${path}.evidenceRefs`, `does not reference ${ref}`);
  }
}

function validateRelease(release, index, evidenceIds, errors) {
  const path = `releases[${index}]`;
  if (!isRecord(release)) {
    addError(errors, path, "must be an object");
    return;
  }
  const fields = new Set(["id", "title", "status", "evidenceRefs"]);
  rejectUnknownFields(release, fields, path, errors);
  for (const field of ["id", "title", "status"]) {
    if (!isNonEmptyString(release[field])) addError(errors, `${path}.${field}`, "must be a non-empty string");
  }
  validateStringArray(release.evidenceRefs, `${path}.evidenceRefs`, errors);
  for (const ref of release.evidenceRefs ?? []) {
    if (!evidenceIds.has(ref)) addError(errors, `${path}.evidenceRefs`, `does not reference ${ref}`);
  }
}

function validateEvidence(evidence, index, errors) {
  const path = `evidence[${index}]`;
  if (!isRecord(evidence)) {
    addError(errors, path, "must be an object");
    return;
  }
  const fields = new Set(["id", "kind", "uri", "commit", "sha256", "verified", "note"]);
  rejectUnknownFields(evidence, fields, path, errors);
  if (!isNonEmptyString(evidence.id) || !ID_PATTERN.test(evidence.id)) addError(errors, `${path}.id`, "must be a valid identifier");
  if (!EVIDENCE_KIND_SET.has(evidence.kind)) addError(errors, `${path}.kind`, "is not a known evidence kind");
  if (!isRepoRelativeUri(evidence.uri)) addError(errors, `${path}.uri`, "must be a repository-relative path");
  if (evidence.commit !== null && (typeof evidence.commit !== "string" || !COMMIT_PATTERN.test(evidence.commit))) addError(errors, `${path}.commit`, "must be null or a commit hash");
  if (evidence.sha256 !== null && (typeof evidence.sha256 !== "string" || !SHA256_PATTERN.test(evidence.sha256))) addError(errors, `${path}.sha256`, "must be null or a SHA-256 hash");
  if (typeof evidence.verified !== "boolean") addError(errors, `${path}.verified`, "must be boolean");
  if (!isNonEmptyString(evidence.note)) addError(errors, `${path}.note`, "must be a non-empty string");
}

function validateHistory(entry, path, evidenceIds, errors) {
  if (!isRecord(entry)) {
    addError(errors, path, "must be an object");
    return;
  }
  const fields = new Set(["status", "at", "actor", "role", "note", "evidenceRefs"]);
  rejectUnknownFields(entry, fields, path, errors);
  if (!HISTORY_STATUS_SET.has(entry.status)) addError(errors, `${path}.status`, "is not a known current or legacy status");
  if (!isIsoDateTime(entry.at)) addError(errors, `${path}.at`, "must be an ISO date-time");
  if (!isNonEmptyString(entry.actor)) addError(errors, `${path}.actor`, "must be a non-empty string");
  if (!isNonEmptyString(entry.note)) addError(errors, `${path}.note`, "must be a non-empty string");
  if (Object.hasOwn(entry, "role") && entry.role !== null && !ROLE_SET.has(entry.role)) addError(errors, `${path}.role`, "is not a known workflow role");
  if (Object.hasOwn(entry, "evidenceRefs")) {
    validateStringArray(entry.evidenceRefs, `${path}.evidenceRefs`, errors);
    for (const ref of entry.evidenceRefs ?? []) {
      if (!evidenceIds.has(ref)) addError(errors, `${path}.evidenceRefs`, `does not reference ${ref}`);
    }
  }
}

function validateComment(comment, path, errors) {
  if (!isRecord(comment)) {
    addError(errors, path, "must be an object");
    return;
  }
  rejectUnknownFields(comment, new Set(["at", "actor", "text"]), path, errors);
  if (!isIsoDateTime(comment.at)) addError(errors, `${path}.at`, "must be an ISO date-time");
  if (!isNonEmptyString(comment.actor)) addError(errors, `${path}.actor`, "must be a non-empty string");
  if (!isNonEmptyString(comment.text)) addError(errors, `${path}.text`, "must be a non-empty string");
}

function validateWorkItem(item, index, epicIds, releaseIds, evidenceIds, dependencyIds, errors) {
  const path = `workItems[${index}]`;
  if (!isRecord(item)) {
    addError(errors, path, "must be an object");
    return;
  }
  rejectUnknownFields(item, WORK_ITEM_FIELDS, path, errors);
  for (const field of WORK_ITEM_FIELDS) {
    if (!Object.hasOwn(item, field)) addError(errors, `${path}.${field}`, "is required");
  }
  if (!isNonEmptyString(item.id) || !ID_PATTERN.test(item.id)) addError(errors, `${path}.id`, "must be a valid identifier");
  if (!ITEM_TYPE_SET.has(item.type)) addError(errors, `${path}.type`, "is not a known item type");
  if (!isNonEmptyString(item.title)) addError(errors, `${path}.title`, "must be a non-empty string");
  if (item.epicId !== null && !epicIds.has(item.epicId)) addError(errors, `${path}.epicId`, "does not reference a known Epic");
  if (item.releaseId !== null && !releaseIds.has(item.releaseId)) addError(errors, `${path}.releaseId`, "does not reference a known release");
  if (!CURRENT_STATUS_SET.has(item.status)) addError(errors, `${path}.status`, "is not a current workflow status");
  for (const field of ["openedAt", "targetAt", "deliveredAt"]) {
    if (!isIsoDate(item[field])) addError(errors, `${path}.${field}`, "must be null or an ISO date");
  }
  if (!PRIORITY_SET.has(item.priority)) addError(errors, `${path}.priority`, "is not a known priority");
  if (!RISK_SET.has(item.risk)) addError(errors, `${path}.risk`, "is not a known risk");
  for (const field of ["owner", "contributor", "reviewer", "description", "expectation"]) {
    if (!isNonEmptyString(item[field])) addError(errors, `${path}.${field}`, "must be a non-empty string");
  }
  if (item.flagKey !== null && !isNonEmptyString(item.flagKey)) addError(errors, `${path}.flagKey`, "must be null or a non-empty string");
  validateStringArray(item.dependencies, `${path}.dependencies`, errors);
  validateStringArray(item.protectedSurfaces, `${path}.protectedSurfaces`, errors);
  validateStringArray(item.acceptanceCriteria, `${path}.acceptanceCriteria`, errors, { minItems: 1 });
  validateStringArray(item.evidenceRefs, `${path}.evidenceRefs`, errors);
  if (!Array.isArray(item.statusHistory) || item.statusHistory.length === 0) {
    addError(errors, `${path}.statusHistory`, "must contain at least one transition");
  } else {
    for (const [historyIndex, entry] of item.statusHistory.entries()) validateHistory(entry, `${path}.statusHistory[${historyIndex}]`, evidenceIds, errors);
    const last = item.statusHistory.at(-1);
    if (isRecord(last) && normalizeHistoricalStatus(last.status) !== item.status) addError(errors, `${path}.statusHistory`, "last status must resolve to current status");
  }
  if (!Array.isArray(item.comments)) {
    addError(errors, `${path}.comments`, "must be an array");
  } else {
    for (const [commentIndex, comment] of item.comments.entries()) validateComment(comment, `${path}.comments[${commentIndex}]`, errors);
  }
  for (const ref of item.evidenceRefs ?? []) {
    if (!evidenceIds.has(ref)) addError(errors, `${path}.evidenceRefs`, `does not reference ${ref}`);
  }
  for (const dependency of item.dependencies ?? []) {
    if (!dependencyIds.has(dependency)) addError(errors, `${path}.dependencies`, `does not reference ${dependency}`);
    if (dependency === item.id) addError(errors, `${path}.dependencies`, "cannot reference itself");
  }
}

/** Validate the entire canonical board without repairing or dropping data. */
export function validateBoard(board) {
  const errors = [];
  if (!isRecord(board)) return { valid: false, errors: ["board: must be an object"] };
  rejectUnknownFields(board, new Set(["schemaVersion", "revision", "updatedAt", "generatedFrom", "epics", "releases", "workItems", "evidence"]), "board", errors);
  if (board.schemaVersion !== 2) addError(errors, "schemaVersion", "must be 2");
  if (!Number.isSafeInteger(board.revision) || board.revision < 0) addError(errors, "revision", "must be a non-negative safe integer");
  if (!isIsoDateTime(board.updatedAt)) addError(errors, "updatedAt", "must be an ISO date-time");
  if (!isNonEmptyString(board.generatedFrom)) addError(errors, "generatedFrom", "must be a non-empty string");
  for (const collection of ["epics", "releases", "workItems", "evidence"]) {
    if (!Array.isArray(board[collection])) addError(errors, collection, "must be an array");
  }
  if (!["epics", "releases", "workItems", "evidence"].every((collection) => Array.isArray(board[collection]))) return { valid: false, errors };

  const epicIds = uniqueIds(board.epics.map((epic) => epic?.id), "epics", errors);
  const releaseIds = uniqueIds(board.releases.map((release) => release?.id), "releases", errors);
  const workItemIds = uniqueIds(board.workItems.map((item) => item?.id), "workItems", errors);
  const evidenceIds = uniqueIds(board.evidence.map((evidence) => evidence?.id), "evidence", errors);
  const dependencyIds = new Set([...epicIds, ...workItemIds]);

  for (const [index, evidence] of board.evidence.entries()) validateEvidence(evidence, index, errors);
  for (const [index, epic] of board.epics.entries()) validateEpic(epic, index, evidenceIds, errors);
  for (const [index, release] of board.releases.entries()) validateRelease(release, index, evidenceIds, errors);
  for (const [index, item] of board.workItems.entries()) validateWorkItem(item, index, epicIds, releaseIds, evidenceIds, dependencyIds, errors);
  return { valid: errors.length === 0, errors };
}

export function assertValidBoard(board, label = "board") {
  const result = validateBoard(board);
  if (!result.valid) throw new Error(`${label} is invalid:\n${result.errors.join("\n")}`);
  return board;
}

export function summarizeBoard(board) {
  const statusCounts = {};
  for (const item of board.workItems) statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1;
  return {
    epics: board.epics.length,
    releases: board.releases.length,
    workItems: board.workItems.length,
    evidence: board.evidence.length,
    statusCounts,
  };
}

export function isCurrentStatus(value) {
  return CURRENT_STATUS_SET.has(value);
}

export function isActorRole(value) {
  return ROLE_SET.has(value);
}

export function isEvidenceKind(value) {
  return EVIDENCE_KIND_SET.has(value);
}

export function isRepositoryRelativeUri(value) {
  return isRepoRelativeUri(value);
}

export function canTransition(from, to, role) {
  if (!CURRENT_STATUS_SET.has(from) || !CURRENT_STATUS_SET.has(to) || !ROLE_SET.has(role) || from === to) return false;
  if (role === "maintainer") return true;
  if (to === "Blocked" && UNFINISHED_STATUS_SET.has(from) && from !== "Blocked") return true;
  const key = `${from}->${to}`;
  if (role === "contributor") return CONTRIBUTOR_TRANSITIONS.has(key);
  return REVIEWER_TRANSITIONS.has(key);
}

export function allowedTransitions(from, role) {
  return CURRENT_STATUSES.filter((to) => canTransition(from, to, role));
}
