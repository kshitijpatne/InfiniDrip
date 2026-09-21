const STATUSES = new Set([
  "Draft",
  "Backlog",
  "Ready",
  "In Progress",
  "In Review",
  "Accepted",
  "Closed",
  "Blocked",
  "Reopened",
]);

const REQUIRED_WORK_ITEM_FIELDS = [
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
];

const VALID_TRANSITIONS = new Map([
  ["Draft", new Set(["Backlog", "Ready", "Blocked"])],
  ["Backlog", new Set(["Ready", "In Progress", "Blocked"])],
  ["Ready", new Set(["In Progress", "Blocked"])],
  ["In Progress", new Set(["In Review", "Blocked", "Reopened"])],
  ["In Review", new Set(["Accepted", "Blocked", "Reopened"])],
  ["Accepted", new Set(["Closed", "Reopened"])],
  ["Closed", new Set(["Reopened"])],
  ["Blocked", new Set(["Ready", "In Progress", "Reopened"])],
  ["Reopened", new Set(["Ready", "In Progress", "Blocked"])],
]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value) {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value;
}

function isIsoDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function addError(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function uniqueIds(values, path, errors) {
  const seen = new Set();
  for (const [index, value] of values.entries()) {
    if (typeof value !== "string" || value.length === 0) {
      addError(errors, `${path}[${index}]`, "must be a non-empty identifier");
    } else if (seen.has(value)) {
      addError(errors, `${path}[${index}]`, `duplicates ${value}`);
    } else {
      seen.add(value);
    }
  }
  return seen;
}

function validateWorkItem(item, index, epicIds, releaseIds, evidenceIds, dependencyIds, errors) {
  const path = `workItems[${index}]`;
  if (!isRecord(item)) {
    addError(errors, path, "must be an object");
    return;
  }
  for (const field of REQUIRED_WORK_ITEM_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(item, field)) addError(errors, `${path}.${field}`, "is required");
  }
  if (typeof item.id !== "string" || item.id.length === 0) addError(errors, `${path}.id`, "must be a non-empty identifier");
  if (typeof item.title !== "string" || item.title.length === 0) addError(errors, `${path}.title`, "must be non-empty");
  if (item.epicId !== null && !epicIds.has(item.epicId)) addError(errors, `${path}.epicId`, "does not reference a known Epic");
  if (item.releaseId !== null && !releaseIds.has(item.releaseId)) addError(errors, `${path}.releaseId`, "does not reference a known release");
  if (!STATUSES.has(item.status)) addError(errors, `${path}.status`, "is not a known status");
  if (!isIsoDate(item.openedAt) || !isIsoDate(item.targetAt) || !isIsoDate(item.deliveredAt)) addError(errors, path, "contains an invalid ISO date");
  if (!Array.isArray(item.acceptanceCriteria) || item.acceptanceCriteria.length === 0) addError(errors, `${path}.acceptanceCriteria`, "must contain at least one criterion");
  if (!Array.isArray(item.statusHistory) || item.statusHistory.length === 0) {
    addError(errors, `${path}.statusHistory`, "must contain at least one transition");
  } else {
    const last = item.statusHistory[item.statusHistory.length - 1];
    if (!isRecord(last) || last.status !== item.status) addError(errors, `${path}.statusHistory`, "last status must equal current status");
    for (const [historyIndex, entry] of item.statusHistory.entries()) {
      if (!isRecord(entry) || !STATUSES.has(entry.status) || !isIsoDateTime(entry.at) || typeof entry.actor !== "string" || typeof entry.note !== "string") {
        addError(errors, `${path}.statusHistory[${historyIndex}]`, "is malformed");
      }
    }
  }
  if (!Array.isArray(item.dependencies) || !Array.isArray(item.protectedSurfaces) || !Array.isArray(item.comments) || !Array.isArray(item.evidenceRefs)) addError(errors, path, "list fields must be arrays");
  for (const ref of item.evidenceRefs ?? []) if (!evidenceIds.has(ref)) addError(errors, `${path}.evidenceRefs`, `does not reference ${ref}`);
  for (const dependency of item.dependencies ?? []) if (!dependencyIds.has(dependency)) addError(errors, `${path}.dependencies`, `does not reference ${dependency}`);
}

/** Validate without repairing or silently dropping any board data. */
export function validateBoard(board) {
  const errors = [];
  if (!isRecord(board)) return { valid: false, errors: ["board: must be an object"] };
  if (board.schemaVersion !== 1) addError(errors, "schemaVersion", "must be 1");
  if (typeof board.generatedFrom !== "string" || board.generatedFrom.length === 0) addError(errors, "generatedFrom", "must be non-empty");
  for (const collection of ["epics", "releases", "workItems", "evidence"]) if (!Array.isArray(board[collection])) addError(errors, collection, "must be an array");
  if (!["epics", "releases", "workItems", "evidence"].every((collection) => Array.isArray(board[collection]))) return { valid: false, errors };

  const epicIds = uniqueIds(board.epics.map((epic) => epic?.id), "epics", errors);
  const releaseIds = uniqueIds(board.releases.map((release) => release?.id), "releases", errors);
  const workItemIds = uniqueIds(board.workItems.map((item) => item?.id), "workItems", errors);
  const evidenceIds = uniqueIds(board.evidence.map((evidence) => evidence?.id), "evidence", errors);
  const dependencyIds = new Set([...epicIds, ...workItemIds]);
  for (const [index, evidence] of board.evidence.entries()) {
    if (!isRecord(evidence) || typeof evidence.kind !== "string" || typeof evidence.uri !== "string" || typeof evidence.verified !== "boolean" || typeof evidence.note !== "string") addError(errors, `evidence[${index}]`, "is malformed");
  }
  for (const [index, item] of board.workItems.entries()) validateWorkItem(item, index, epicIds, releaseIds, evidenceIds, dependencyIds, errors);
  return { valid: errors.length === 0, errors };
}

/** A contributor can submit work, but cannot independently close it. */
export function canTransition(from, to, actorRole) {
  if (!VALID_TRANSITIONS.get(from)?.has(to)) return false;
  if ((to === "Accepted" || to === "Closed") && actorRole !== "reviewer") return false;
  return actorRole === "contributor" || actorRole === "reviewer";
}

export function summarizeBoard(board) {
  const counts = {};
  for (const item of board.workItems) counts[item.status] = (counts[item.status] ?? 0) + 1;
  return { epics: board.epics.length, releases: board.releases.length, workItems: board.workItems.length, evidence: board.evidence.length, statusCounts: counts };
}

function safeText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderBoard(board) {
  const summary = summarizeBoard(board);
  const statusSummary = Object.entries(summary.statusCounts).map(([status, count]) => `<span class="status status-${safeText(status.toLowerCase().replaceAll(" ", "-"))}">${safeText(status)} <b>${count}</b></span>`).join("");
  const rows = board.workItems.map((item) => `<tr><td><code>${safeText(item.id)}</code></td><td>${safeText(item.type)}</td><td>${safeText(item.title)}</td><td>${safeText(item.status)}</td><td>${safeText(item.priority)}</td><td>${safeText(item.owner)}</td><td>${safeText(item.deliveredAt ?? "unknown")}</td></tr>`).join("");
  const evidenceRows = board.evidence.map((evidence) => `<tr><td><code>${safeText(evidence.id)}</code></td><td>${safeText(evidence.kind)}</td><td>${evidence.verified ? "verified" : "incomplete"}</td><td>${safeText(evidence.uri)}</td><td>${safeText(evidence.note)}</td></tr>`).join("");
  return `<header><p class="eyebrow">LOCAL CONTROL CENTER · SCHEMA V1</p><h1>InfiniDrip delivery board</h1><p>${safeText(board.generatedFrom)}</p><div class="summary"><b>${summary.epics}</b> Epics <b>${summary.workItems}</b> work items <b>${summary.evidence}</b> evidence records</div><div class="statuses">${statusSummary}</div></header><main><h2>Work items</h2><table><thead><tr><th>ID</th><th>Type</th><th>Work</th><th>Status</th><th>Priority</th><th>Owner</th><th>Delivered</th></tr></thead><tbody>${rows}</tbody></table><h2>Evidence</h2><table><thead><tr><th>ID</th><th>Kind</th><th>State</th><th>Source</th><th>Note</th></tr></thead><tbody>${evidenceRows}</tbody></table></main>`;
}

export async function loadBoard(url = "../data/board.json") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Board data request failed (${response.status}).`);
  const board = await response.json();
  const result = validateBoard(board);
  if (!result.valid) throw new Error(`Board data is invalid:\n${result.errors.join("\n")}`);
  return board;
}
