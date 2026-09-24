import {
  ACTOR_ROLES, EVIDENCE_KINDS, ITEM_TYPES, PRIORITIES, RISKS,
  allowedTransitions, canTransition, summarizeBoard, validateBoard,
} from "../board-core.mjs";

export { ACTOR_ROLES, allowedTransitions, canTransition, summarizeBoard, validateBoard };

export function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function searchableText(item) {
  return [
    item.id, item.title, item.type, item.status, item.owner, item.contributor,
    item.reviewer, item.description, item.expectation, ...item.acceptanceCriteria,
    ...item.dependencies, ...item.protectedSurfaces,
    ...item.comments.flatMap((entry) => [entry.actor, entry.text]),
    ...item.statusHistory.flatMap((entry) => [entry.status, entry.actor, entry.note]),
  ].join(" ").toLocaleLowerCase();
}

export function filterItems(items, filters = {}) {
  const query = String(filters.query ?? "").trim().toLocaleLowerCase();
  return items.filter((item) => (!query || searchableText(item).includes(query))
    && (!filters.status || item.status === filters.status)
    && (!filters.owner || item.owner === filters.owner)
    && (!filters.priority || item.priority === filters.priority)
    && (!filters.type || item.type === filters.type));
}

export function filterOptions(items) {
  const unique = (field) => [...new Set(items.map((item) => item[field]))].sort((a, b) => a.localeCompare(b));
  return { status: unique("status"), owner: unique("owner"), priority: unique("priority"), type: unique("type") };
}

function options(values, selected, includeBlank = false) {
  return `${includeBlank ? '<option value="">None</option>' : ""}${values.map((value) => `<option${value === selected ? " selected" : ""}>${safeText(value)}</option>`).join("")}`;
}

function epicOptions(board, selected) {
  return `<option value="">None</option>${board.epics.map((entry) => `<option${entry.id === selected ? " selected" : ""}${entry.id === "EPIC-13" ? " disabled" : ""}>${safeText(entry.id)}</option>`).join("")}`;
}

function field(label, name, value, kind = "text", attributes = "") {
  if (kind === "textarea") return `<label>${safeText(label)}<textarea name="${name}" ${attributes} rows="4">${safeText(value)}</textarea></label>`;
  return `<label>${safeText(label)}<input name="${name}" type="${kind}" value="${safeText(value)}" ${attributes}></label>`;
}

export function renderItemList(items, selectedId) {
  if (!items.length) return '<p class="empty">No items match these filters.</p>';
  return items.map((item) => `<button class="item-card${item.id === selectedId ? " selected" : ""}" data-select-item="${safeText(item.id)}"><span><code>${safeText(item.id)}</code><strong>${safeText(item.title)}</strong></span><span class="badge status-${safeText(item.status.toLowerCase().replaceAll(" ", "-"))}">${safeText(item.status)}</span><small>${safeText(item.type)} · ${safeText(item.priority)} · ${safeText(item.owner)}</small></button>`).join("");
}

export function renderDetail(item, board, role = "contributor") {
  if (!item) return '<div class="empty detail-empty">Select a work item to inspect or edit it.</div>';
  const evidence = item.evidenceRefs.map((id) => board.evidence.find((entry) => entry.id === id)).filter(Boolean);
  const transitions = allowedTransitions(item.status, role);
  return `<header class="detail-heading"><div><p class="eyebrow">${safeText(item.id)}</p><h2>${safeText(item.title)}</h2></div><span class="badge">${safeText(item.status)}</span></header>
    <form id="edit-form" class="form-grid">
      ${field("Title", "title", item.title)}
      <label>Type<select name="type">${options(ITEM_TYPES, item.type)}</select></label>
      <label>Priority<select name="priority">${options(PRIORITIES, item.priority)}</select></label>
      <label>Risk<select name="risk">${options(RISKS, item.risk)}</select></label>
      ${field("Owner", "owner", item.owner)}${field("Contributor", "contributor", item.contributor)}${field("Reviewer", "reviewer", item.reviewer)}
      <label>Epic<select name="epicId"${item.epicId === "EPIC-13" ? " disabled" : ""}>${epicOptions(board, item.epicId)}</select></label>
      <label>Release<select name="releaseId">${options(board.releases.map((entry) => entry.id), item.releaseId, true)}</select></label>
      ${field("Opened", "openedAt", item.openedAt ?? "", "date")}${field("Target", "targetAt", item.targetAt ?? "", "date")}${field("Delivered", "deliveredAt", item.deliveredAt ?? "", "date")}
      <div class="wide">${field("Description", "description", item.description, "textarea")}</div>
      <div class="wide">${field("Expected outcome", "expectation", item.expectation, "textarea")}</div>
      <div class="wide">${field("Acceptance criteria (one per line)", "acceptanceCriteria", item.acceptanceCriteria.join("\n"), "textarea")}</div>
      <div>${field("Dependencies (one per line)", "dependencies", item.dependencies.join("\n"), "textarea")}</div>
      <div>${field("Protected surfaces (one per line)", "protectedSurfaces", item.protectedSurfaces.join("\n"), "textarea")}</div>
      ${field("Flag key", "flagKey", item.flagKey ?? "")}
      <div class="wide actions"><button type="submit" class="primary">Save item details</button></div>
    </form>
    <section><h3>Status workflow</h3><form id="transition-form" class="inline-form">
      <label>Acting as<input name="actor" required value="Local maintainer"></label>
      <label>Workflow role<select name="role" id="role-select">${options(ACTOR_ROLES, role)}</select></label>
      <label>Next status<select name="status" id="status-select" ${transitions.length ? "" : "disabled"}>${options(transitions, transitions[0])}</select></label>
      <label class="wide">Reason<input name="reason" required placeholder="Short reason or completion evidence"></label>
      <label class="wide">Evidence for transition<select name="evidenceRef"><option value="">No additional reference</option>${options(board.evidence.map((entry) => entry.id), "")}</select></label>
      <button type="submit" ${transitions.length ? "" : "disabled"}>Apply transition</button>
    </form></section>
    <section><h3>Notes</h3><form id="comment-form" class="inline-form"><label>Author<input name="actor" required value="Local maintainer"></label><label class="wide">Note<input name="text" required></label><button type="submit">Add note</button></form><ol class="timeline">${item.comments.map((entry) => `<li><time>${safeText(entry.at)}</time><b>${safeText(entry.actor)}</b><p>${safeText(entry.text)}</p></li>`).join("") || "<li>No notes yet.</li>"}</ol></section>
    <section><h3>Evidence</h3><form id="evidence-form" class="inline-form"><label class="wide">Link existing evidence<select name="evidenceId"><option value="">Choose evidence</option>${options(board.evidence.filter((entry) => !item.evidenceRefs.includes(entry.id)).map((entry) => entry.id), "")}</select></label><button type="submit">Link evidence</button></form>
    <details><summary>Create and link evidence</summary><form id="create-evidence-form" class="inline-form nested-form"><label>Evidence ID<input name="id" required placeholder="E-SLICE185"></label><label>Kind<select name="kind">${options(EVIDENCE_KINDS, "document")}</select></label><label>Repository path<input name="uri" required placeholder="docs/example.md"></label><label class="wide">Note<input name="note" required></label><label class="check"><input name="verified" type="checkbox"> Verified</label><button type="submit">Create evidence</button></form></details>
    <ul class="evidence-list">${evidence.map((entry) => `<li><a href="/api/evidence/${encodeURIComponent(entry.id)}" target="_blank" rel="noreferrer">${safeText(entry.id)}</a><span>${safeText(entry.kind)} · ${entry.verified ? "verified" : "incomplete"}</span><p>${safeText(entry.note)}</p></li>`).join("") || "<li>No evidence linked.</li>"}</ul></section>
    <section><h3>Transition history</h3><ol class="timeline">${item.statusHistory.map((entry) => `<li><time>${safeText(entry.at)}</time><b>${safeText(entry.status)}</b><p>${safeText(entry.actor)}${entry.role ? ` · ${safeText(entry.role)}` : ""} — ${safeText(entry.note)}</p></li>`).join("")}</ol></section>`;
}

export function renderCreateForm(board) {
  return `<header class="detail-heading"><div><p class="eyebrow">NEW WORK ITEM</p><h2>Add to the delivery queue</h2></div></header>
    <p>New items start in Backlog. Their initial history entry records who added them and why.</p>
    <form id="create-item-form" class="form-grid">
      ${field("Item ID", "id", "", "text", 'required pattern="[A-Z0-9][A-Z0-9._-]{2,80}" title="Use 3–81 uppercase letters, numbers, dots, underscores, or hyphens. For example: PREQUEUE-PHASE-01" placeholder="PREQUEUE-PHASE-01"')}
      ${field("Title", "title", "", "text", "required")}
      <label>Type<select name="type" required>${options(ITEM_TYPES, "task")}</select></label>
      <label>Priority<select name="priority" required>${options(PRIORITIES, "P1")}</select></label>
      <label>Risk<select name="risk" required>${options(RISKS, "low")}</select></label>
      ${field("Owner", "owner", "Codex", "text", "required")}
      ${field("Contributor (defaults to owner)", "contributor", "")}
      ${field("Reviewer (defaults to owner)", "reviewer", "")}
      <label>Epic<select name="epicId">${epicOptions(board, null)}</select></label>
      <label>Release<select name="releaseId">${options(board.releases.map((entry) => entry.id), "", true)}</select></label>
      ${field("Target date", "targetAt", "", "date")}
      ${field("Flag key", "flagKey", "")}
      <div class="wide">${field("Description", "description", "", "textarea", "required")}</div>
      <div class="wide">${field("Expected outcome", "expectation", "", "textarea", "required")}</div>
      <div class="wide">${field("Acceptance criteria (one per line)", "acceptanceCriteria", "", "textarea", "required")}</div>
      ${field("Dependencies (one per line)", "dependencies", "", "textarea")}
      ${field("Protected surfaces (one per line)", "protectedSurfaces", "", "textarea")}
      ${field("Added by", "actor", "Local maintainer", "text", "required")}
      <label>Recorded role<select name="role">${options(ACTOR_ROLES, "maintainer")}</select></label>
      <div class="wide">${field("Why is this item being added?", "reason", "", "textarea", "required")}</div>
      <div class="wide actions"><button type="submit" class="primary">Create work item</button><button type="button" id="cancel-create-button">Cancel</button></div>
    </form>`;
}

export function renderSummary(board) {
  const summary = summarizeBoard(board);
  return `<b>${summary.workItems}</b> work items · <b>${summary.evidence}</b> evidence records · revision <b>${board.revision}</b>`;
}

export async function loadBoard(url = "/api/board") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Board data request failed (${response.status}).`);
  const board = await response.json();
  const result = validateBoard(board);
  if (!result.valid) throw new Error(`Board data is invalid:\n${result.errors.join("\n")}`);
  return board;
}

export async function sendCommand(command, url = "/api/commands") {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(command) });
  const payload = await response.json().catch(() => ({ error: `Command failed (${response.status}).` }));
  if (!response.ok) {
    const error = new Error(payload.error ?? `Command failed (${response.status}).`);
    error.stale = response.status === 409;
    throw error;
  }
  const result = validateBoard(payload);
  if (!result.valid) throw new Error(`Saved board response is invalid:\n${result.errors.join("\n")}`);
  return payload;
}
