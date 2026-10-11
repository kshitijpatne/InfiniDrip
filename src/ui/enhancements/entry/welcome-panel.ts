/** Isolated UIQ-07 welcome visual. Static content only; no entry-flow behavior. */
export const WELCOME_SCOPE_CLASS = "uiq-entry";

export interface WelcomePanelController {
  readonly root: HTMLElement;
  dispose(): void;
}

/** Mount one native, accessible welcome region without changing host siblings. */
export function mountWelcomePanel(host: HTMLElement): WelcomePanelController {
  const doc = host.ownerDocument;
  const root = doc.createElement("section");
  root.className = `uiq-foundation ${WELCOME_SCOPE_CLASS}`;
  root.setAttribute("aria-label", "InfiniDrip welcome");

  const ornament = doc.createElement("div");
  ornament.className = "uiq-entry__ornament";
  ornament.setAttribute("aria-hidden", "true");

  const content = doc.createElement("div");
  content.className = "uiq-entry__content";

  const eyebrow = doc.createElement("p");
  eyebrow.className = "uiq-entry__eyebrow";
  eyebrow.textContent = "A space for making";

  const wordmark = doc.createElement("h1");
  wordmark.className = "uiq-entry__wordmark";
  wordmark.textContent = "InfiniDrip";

  const welcome = doc.createElement("p");
  welcome.className = "uiq-entry__welcome";
  welcome.textContent = "Bring your garment ideas to life.";

  const description = doc.createElement("p");
  description.className = "uiq-entry__description";
  description.textContent = "Explore thoughtful patternmaking, one considered detail at a time.";

  content.append(eyebrow, wordmark, welcome, description);
  root.append(ornament, content);
  host.append(root);

  return {
    root,
    dispose: () => root.remove(),
  };
}
