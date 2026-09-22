import { summarizeBoard, validateBoard } from "../board-core.mjs";
import { allowedTransitions, canTransition } from "../commands.mjs";

export { allowedTransitions, canTransition, summarizeBoard, validateBoard };

export function safeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderBoard(board) {
  const summary = summarizeBoard(board);
  const statusSummary = Object.entries(summary.statusCounts)
    .map(([status, count]) => `<span class="status status-${safeText(status.toLowerCase().replaceAll(" ", "-"))}">${safeText(status)} <b>${count}</b></span>`)
    .join("");
  const rows = board.workItems
    .map((item) => `<tr><td><code>${safeText(item.id)}</code></td><td>${safeText(item.type)}</td><td>${safeText(item.title)}</td><td>${safeText(item.status)}</td><td>${safeText(item.priority)}</td><td>${safeText(item.owner)}</td><td>${safeText(item.deliveredAt ?? "unknown")}</td></tr>`)
    .join("");
  const evidenceRows = board.evidence
    .map((evidence) => `<tr><td><code>${safeText(evidence.id)}</code></td><td>${safeText(evidence.kind)}</td><td>${evidence.verified ? "verified" : "incomplete"}</td><td>${safeText(evidence.uri)}</td><td>${safeText(evidence.note)}</td></tr>`)
    .join("");
  return `<header><p class="eyebrow">LOCAL CONTROL CENTER · SCHEMA V2 · REVISION ${board.revision}</p><h1>InfiniDrip delivery board</h1><p>${safeText(board.generatedFrom)}</p><div class="summary"><b>${summary.epics}</b> Epics <b>${summary.workItems}</b> work items <b>${summary.evidence}</b> evidence records</div><div class="statuses">${statusSummary}</div></header><main><h2>Work items</h2><table><thead><tr><th>ID</th><th>Type</th><th>Work</th><th>Status</th><th>Priority</th><th>Owner</th><th>Delivered</th></tr></thead><tbody>${rows}</tbody></table><h2>Evidence</h2><table><thead><tr><th>ID</th><th>Kind</th><th>State</th><th>Source</th><th>Note</th></tr></thead><tbody>${evidenceRows}</tbody></table></main>`;
}

export async function loadBoard(url = "../data/board.json") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Board data request failed (${response.status}).`);
  const board = await response.json();
  const result = validateBoard(board);
  if (!result.valid) throw new Error(`Board data is invalid:\n${result.errors.join("\n")}`);
  return board;
}
