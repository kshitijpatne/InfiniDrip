// UIQ-02 native foundation primitives: an isolated, dependency-free panel and
// status building block. Every string arrives as literal text (never HTML),
// and every class name is scoped under "uiq-foundation" so the companion
// stylesheet cannot affect anything outside this module's own elements.

export const FOUNDATION_SCOPE_CLASS = "uiq-foundation";

export type FoundationStatusKind = "info" | "warning" | "error";

const STATUS_LABEL: Record<FoundationStatusKind, string> = {
  info: "Info",
  warning: "Warning",
  error: "Error",
};

/**
 * Build a labelled panel: a scoped root section with a heading and a
 * description paragraph. Both strings are set via textContent, so markup in
 * either argument is rendered as plain characters, never parsed.
 */
export function createFoundationPanel(title: string, description: string): HTMLElement {
  const panel = document.createElement("section");
  panel.className = `${FOUNDATION_SCOPE_CLASS} uiq-foundation-panel`;

  const heading = document.createElement("h2");
  heading.className = "uiq-foundation-panel-title";
  heading.textContent = title;

  const body = document.createElement("p");
  body.className = "uiq-foundation-panel-description";
  body.textContent = description;

  panel.append(heading, body);
  return panel;
}

/**
 * Build a status indicator that always carries a visible text label
 * ("Info"/"Warning"/"Error") alongside the message, so the state is never
 * conveyed by color alone. Error uses role="alert" (assertive); the other
 * two kinds use role="status" (polite).
 */
export function createFoundationStatus(message: string, kind: FoundationStatusKind): HTMLElement {
  const status = document.createElement("div");
  status.className = `${FOUNDATION_SCOPE_CLASS} uiq-foundation-status`;
  status.dataset.kind = kind;
  status.setAttribute("role", kind === "error" ? "alert" : "status");

  const label = document.createElement("span");
  label.className = "uiq-foundation-status-label";
  label.textContent = STATUS_LABEL[kind];

  const text = document.createElement("span");
  text.className = "uiq-foundation-status-message";
  text.textContent = message;

  status.append(label, text);
  return status;
}
