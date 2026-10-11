import { createFoundationPanel, createFoundationStatus } from "./foundation";

/** Apply the accepted foundation to an existing active guided-tour panel. */
export function applyTutorialFoundation(host: HTMLElement, enabled: boolean): boolean {
  if (!enabled) return false;

  const legacyPanel = host.querySelector<HTMLElement>("#tutorial-panel");
  if (!legacyPanel || legacyPanel.classList.contains("uiq-foundation-panel")) return false;

  const legacyTitle = legacyPanel.querySelector<HTMLHeadingElement>("#tutorial-title");
  const legacyDescription = Array.from(legacyPanel.querySelectorAll<HTMLElement>("p"))
    .find((paragraph) => !paragraph.classList.contains("tutorial-progress") &&
      !paragraph.classList.contains("tutorial-storage-notice"));
  if (!legacyTitle || !legacyDescription) return false;

  const enhancedPanel = createFoundationPanel(
    legacyTitle.textContent ?? "",
    legacyDescription.textContent ?? "",
  );
  const enhancedTitle = enhancedPanel.querySelector<HTMLHeadingElement>("h2")!;
  const enhancedDescription = enhancedPanel.querySelector<HTMLParagraphElement>("p")!;
  enhancedPanel.id = legacyPanel.id;
  enhancedPanel.classList.add(...Array.from(legacyPanel.classList), "tutorial-panel");
  enhancedPanel.setAttribute("role", legacyPanel.getAttribute("role") ?? "region");
  const labelledBy = legacyPanel.getAttribute("aria-labelledby");
  if (labelledBy) enhancedPanel.setAttribute("aria-labelledby", labelledBy);
  enhancedTitle.id = legacyTitle.id;
  enhancedTitle.tabIndex = legacyTitle.tabIndex;
  enhancedDescription.classList.add(...Array.from(legacyDescription.classList));

  const originalChildren = Array.from(legacyPanel.childNodes);
  const children: Node[] = originalChildren.map((child) => {
    if (child === legacyTitle) return enhancedTitle;
    if (child === legacyDescription) return enhancedDescription;
    if (child instanceof HTMLElement && child.classList.contains("tutorial-storage-notice")) {
      const warning = createFoundationStatus(child.textContent ?? "", "warning");
      warning.classList.add(...Array.from(child.classList));
      const live = child.getAttribute("aria-live");
      if (live) warning.setAttribute("aria-live", live);
      return warning;
    }
    return child;
  });
  enhancedPanel.replaceChildren(...children);
  legacyPanel.replaceWith(enhancedPanel);
  return true;
}
