import { allowedTransitions, filterItems, filterOptions, loadBoard, renderDetail, renderItemList, renderSummary, sendCommand } from "./board.mjs";

const elements = {
  summary: document.querySelector("#summary"), state: document.querySelector("#save-state"),
  reload: document.querySelector("#reload-button"), filters: document.querySelector("#filters"),
  list: document.querySelector("#item-list"), detail: document.querySelector("#detail"),
};
let board;
let selectedId;
let dirty = false;
let role = "contributor";

function setState(label, kind = "clean") {
  elements.state.textContent = label;
  elements.state.dataset.state = kind;
}

function lineList(value) { return value.split("\n").map((entry) => entry.trim()).filter(Boolean); }
function nullable(value) { return value.trim() || null; }

function renderFilters() {
  const choices = filterOptions(board.workItems);
  for (const field of ["status", "owner", "priority", "type"]) {
    const select = elements.filters.elements[field];
    const current = select.value;
    select.innerHTML = '<option value="">All</option>';
    for (const value of choices[field]) select.add(new Option(value, value, false, value === current));
  }
}

function filters() { return Object.fromEntries(new FormData(elements.filters)); }
function selectedItem() { return board.workItems.find((item) => item.id === selectedId); }

function render({ resetFilters = false } = {}) {
  elements.summary.innerHTML = renderSummary(board);
  if (resetFilters) renderFilters();
  const visible = filterItems(board.workItems, filters());
  if (!selectedId || !board.workItems.some((item) => item.id === selectedId)) selectedId = visible[0]?.id ?? board.workItems[0]?.id;
  elements.list.innerHTML = renderItemList(visible, selectedId);
  elements.detail.innerHTML = renderDetail(selectedItem(), board, role);
}

function markDirty() { dirty = true; setState("Unsaved changes", "dirty"); }

async function execute(command) {
  setState("Saving…", "saving");
  try {
    board = await sendCommand({ ...command, expectedRevision: board.revision });
    dirty = false;
    render({ resetFilters: true });
    setState(`Saved revision ${board.revision}`, "saved");
  } catch (error) {
    dirty = true;
    setState(error.stale ? `Stale: ${error.message}` : `Save failed: ${error.message}`, error.stale ? "stale" : "error");
  }
}

elements.filters.addEventListener("input", () => render());
elements.list.addEventListener("click", (event) => {
  const target = event.target.closest("[data-select-item]");
  if (!target || (dirty && !confirm("Discard unsaved item edits?"))) return;
  selectedId = target.dataset.selectItem; dirty = false; setState("Saved", "clean"); render();
});
elements.detail.addEventListener("input", (event) => { if (event.target.closest("#edit-form")) markDirty(); });
elements.detail.addEventListener("change", (event) => {
  if (event.target.id !== "role-select") return;
  role = event.target.value;
  const status = document.querySelector("#status-select");
  const transitions = allowedTransitions(selectedItem().status, role);
  status.innerHTML = "";
  for (const value of transitions) status.add(new Option(value, value));
  status.disabled = transitions.length === 0;
});
elements.detail.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (event.target.id === "edit-form") {
    const patch = { ...data };
    for (const field of ["epicId", "releaseId", "openedAt", "targetAt", "deliveredAt", "flagKey"]) patch[field] = nullable(patch[field]);
    for (const field of ["dependencies", "protectedSurfaces", "acceptanceCriteria"]) patch[field] = lineList(patch[field]);
    return await execute({ type: "editItem", itemId: selectedId, patch });
  }
  if (event.target.id === "transition-form") return await execute({ type: "updateStatus", itemId: selectedId, actor: data.actor, role: data.role, status: data.status, reason: data.reason, evidenceRefs: data.evidenceRef ? [data.evidenceRef] : [] });
  if (event.target.id === "comment-form") return await execute({ type: "addComment", itemId: selectedId, actor: data.actor, text: data.text });
  if (event.target.id === "evidence-form" && data.evidenceId) return await execute({ type: "addEvidence", itemId: selectedId, evidenceId: data.evidenceId });
  if (event.target.id === "create-evidence-form") return await execute({ type: "addEvidence", itemId: selectedId, evidence: { id: data.id, kind: data.kind, uri: data.uri, commit: null, sha256: null, verified: data.verified === "on", note: data.note } });
});
elements.reload.addEventListener("click", async () => {
  if (dirty && !confirm("Discard unsaved changes and reload board.json?")) return;
  setState("Reloading…", "saving");
  try { board = await loadBoard(); dirty = false; render({ resetFilters: true }); setState(`Reloaded revision ${board.revision}`, "saved"); }
  catch (error) { setState(`Reload failed: ${error.message}`, "error"); }
});
window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });

try {
  board = await loadBoard();
  selectedId = board.workItems[0]?.id;
  render({ resetFilters: true });
  setState(`Saved revision ${board.revision}`, "clean");
} catch (error) {
  setState(`Load failed: ${error.message}`, "error");
  elements.detail.innerHTML = '<div class="error">The canonical board could not be loaded. Correct the reported validation or file error, then reload.</div>';
}
