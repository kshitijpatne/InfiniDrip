import {
  ITEM_TYPES,
  PRIORITIES,
  RISKS,
  canTransition,
  assertValidBoard,
  isActorRole,
  isCurrentStatus,
  isEvidenceKind,
  isRepositoryRelativeUri,
} from "./board-core.mjs";
import { importFacts } from "./import-facts.mjs";

const EDITABLE_FIELDS = new Set([
  "type",
  "title",
  "epicId",
  "releaseId",
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
  "flagKey",
]);

const NEW_WORK_ITEM_FIELDS = new Set([
  "id", "type", "title", "epicId", "releaseId", "priority", "risk",
  "owner", "contributor", "reviewer", "targetAt", "dependencies",
  "protectedSurfaces", "description", "expectation", "acceptanceCriteria",
  "flagKey",
]);

function clone(value) {
  return structuredClone(value);
}

function requireRecord(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value;
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required`);
  return value;
}

function findItem(board, itemId) {
  requireText(itemId, "itemId");
  const item = board.workItems.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`Unknown work item ${itemId}`);
  return item;
}

function commandMoment(options) {
  const now = options?.now ?? new Date().toISOString();
  if (new Date(now).toISOString() !== now) throw new Error("Command time must be a canonical ISO date-time");
  return now;
}

function actorFrom(command) {
  const actor = requireText(command.actor, "actor");
  if (!isActorRole(command.role)) throw new Error("role must be contributor, reviewer, or maintainer");
  return { actor, role: command.role };
}

function linkedEvidence(board, refs) {
  const evidenceIds = new Set(board.evidence.map((entry) => entry.id));
  const normalized = refs ?? [];
  if (!Array.isArray(normalized)) throw new Error("evidenceRefs must be an array");
  for (const ref of normalized) {
    if (!evidenceIds.has(ref)) throw new Error(`Unknown evidence ${ref}`);
  }
  return [...new Set(normalized)];
}

function applyEditItem(board, command) {
  const item = findItem(board, command.itemId);
  const patch = requireRecord(command.patch, "patch");
  const entries = Object.entries(patch);
  if (entries.length === 0) throw new Error("patch must change at least one editable field");
  for (const [field] of entries) {
    if (!EDITABLE_FIELDS.has(field)) throw new Error(`${field} cannot be edited directly`);
  }
  Object.assign(item, clone(patch));
}

function applyCreateItem(board, command, now) {
  const input = requireRecord(command.workItem, "workItem");
  for (const field of Object.keys(input)) {
    if (!NEW_WORK_ITEM_FIELDS.has(field)) throw new Error(`workItem.${field} cannot be set at creation`);
  }
  const { actor, role } = actorFrom(command);
  const reason = requireText(command.reason, "reason");
  const owner = requireText(input.owner, "workItem.owner");
  const item = {
    id: requireText(input.id, "workItem.id"),
    type: input.type,
    title: requireText(input.title, "workItem.title"),
    epicId: input.epicId ?? null,
    releaseId: input.releaseId ?? null,
    status: "Backlog",
    openedAt: now.slice(0, 10),
    targetAt: input.targetAt ?? null,
    deliveredAt: null,
    priority: input.priority,
    risk: input.risk,
    owner,
    contributor: input.contributor ?? owner,
    reviewer: input.reviewer ?? owner,
    dependencies: input.dependencies ?? [],
    protectedSurfaces: input.protectedSurfaces ?? [],
    description: requireText(input.description, "workItem.description"),
    expectation: requireText(input.expectation, "workItem.expectation"),
    acceptanceCriteria: input.acceptanceCriteria,
    statusHistory: [{ status: "Backlog", at: now, actor, role, note: reason, evidenceRefs: [] }],
    comments: [],
    evidenceRefs: [],
    flagKey: input.flagKey ?? null,
  };
  if (!ITEM_TYPES.includes(item.type)) throw new Error(`Unknown workItem.type ${String(item.type)}`);
  if (!PRIORITIES.includes(item.priority)) throw new Error(`Unknown workItem.priority ${String(item.priority)}`);
  if (!RISKS.includes(item.risk)) throw new Error(`Unknown workItem.risk ${String(item.risk)}`);
  board.workItems.push(item);
}

function applyUpdateStatus(board, command, now) {
  const item = findItem(board, command.itemId);
  const { actor, role } = actorFrom(command);
  const reason = requireText(command.reason, "reason");
  const nextStatus = command.status;
  if (!isCurrentStatus(nextStatus)) throw new Error(`Unknown target status ${String(nextStatus)}`);
  if (!canTransition(item.status, nextStatus, role)) throw new Error(`${role} cannot move ${item.id} from ${item.status} to ${nextStatus}`);
  const commandEvidence = linkedEvidence(board, command.evidenceRefs);
  item.evidenceRefs = [...new Set([...item.evidenceRefs, ...commandEvidence])];
  if (nextStatus === "Done") {
    const meaningful = item.evidenceRefs.some((ref) => board.evidence.find((entry) => entry.id === ref)?.kind !== "incomplete");
    if (!meaningful) throw new Error("Done requires at least one non-incomplete evidence reference");
  }
  item.status = nextStatus;
  if (nextStatus === "Done" && item.deliveredAt === null) item.deliveredAt = now.slice(0, 10);
  if (item.status !== "Done" && command.clearDeliveredAt === true) item.deliveredAt = null;
  item.statusHistory.push({
    status: nextStatus,
    at: now,
    actor,
    role,
    note: reason,
    evidenceRefs: commandEvidence,
  });
}

function normalizeNewEvidence(evidence) {
  requireRecord(evidence, "evidence");
  const required = ["id", "kind", "uri", "verified", "note"];
  const allowed = new Set([...required, "commit", "sha256"]);
  for (const field of Object.keys(evidence)) {
    if (!allowed.has(field)) throw new Error(`evidence.${field} is not allowed`);
  }
  for (const field of required) {
    if (!Object.hasOwn(evidence, field)) throw new Error(`evidence.${field} is required`);
  }
  requireText(evidence.id, "evidence.id");
  if (!isEvidenceKind(evidence.kind)) throw new Error(`Unknown evidence kind ${String(evidence.kind)}`);
  if (!isRepositoryRelativeUri(evidence.uri)) throw new Error("evidence.uri must be a repository-relative path");
  requireText(evidence.note, "evidence.note");
  if (typeof evidence.verified !== "boolean") throw new Error("evidence.verified must be boolean");
  return {
    id: evidence.id,
    kind: evidence.kind,
    uri: evidence.uri,
    commit: evidence.commit ?? null,
    sha256: evidence.sha256 ?? null,
    verified: evidence.verified,
    note: evidence.note,
  };
}

function applyAddEvidence(board, command) {
  const item = findItem(board, command.itemId);
  const hasNewEvidence = command.evidence !== undefined;
  const hasExistingId = command.evidenceId !== undefined;
  if (hasNewEvidence === hasExistingId) throw new Error("addEvidence requires exactly one of evidence or evidenceId");
  let evidenceId;
  if (hasNewEvidence) {
    const evidence = normalizeNewEvidence(command.evidence);
    if (board.evidence.some((entry) => entry.id === evidence.id)) throw new Error(`Evidence ${evidence.id} already exists`);
    board.evidence.push(evidence);
    evidenceId = evidence.id;
  } else {
    evidenceId = requireText(command.evidenceId, "evidenceId");
    if (!board.evidence.some((entry) => entry.id === evidenceId)) throw new Error(`Unknown evidence ${evidenceId}`);
  }
  item.evidenceRefs = [...new Set([...item.evidenceRefs, evidenceId])];
}

function applyAddComment(board, command, now) {
  const item = findItem(board, command.itemId);
  const actor = requireText(command.actor, "actor");
  const text = requireText(command.text, "text");
  item.comments.push({ at: now, actor, text });
}

function applyImportFacts(board, command) {
  const imported = importFacts(board, command.facts);
  board.evidence = imported.evidence;
}

/**
 * Apply one mutation to an already-valid board. This is the sole mutation
 * interface used by both the CLI and the localhost UI service.
 */
export function applyBoardCommand(inputBoard, inputCommand, options = {}) {
  assertValidBoard(inputBoard, "Input board");
  const command = requireRecord(inputCommand, "command");
  const now = commandMoment(options);
  const board = clone(inputBoard);
  switch (command.type) {
    case "createItem":
      applyCreateItem(board, command, now);
      break;
    case "editItem":
      applyEditItem(board, command);
      break;
    case "updateStatus":
      applyUpdateStatus(board, command, now);
      break;
    case "addEvidence":
      applyAddEvidence(board, command);
      break;
    case "addComment":
      applyAddComment(board, command, now);
      break;
    case "importFacts":
      applyImportFacts(board, command);
      break;
    default:
      throw new Error(`Unknown board command ${String(command.type)}`);
  }
  board.revision += 1;
  board.updatedAt = now;
  assertValidBoard(board, "Command result");
  return board;
}
