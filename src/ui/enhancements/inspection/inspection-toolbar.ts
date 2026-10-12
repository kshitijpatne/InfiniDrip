/** Isolated UIQ-08 presentation adapter for the existing inspection toolbar. */
export const INSPECTION_TOOLBAR_CANDIDATE_CLASS = "uiq-inspection-toolbar";

const BUTTON_CLASS = "uiq-inspection-toolbar__button";
const OUTPUT_CLASS = "uiq-inspection-toolbar__zoom";

/**
 * Apply only candidate presentation hooks to an existing inspection toolbar.
 * The function deliberately leaves labels, control order/actions, listeners,
 * zoom state, and all non-presentation nodes untouched.
 */
export function applyInspectionToolbarCandidate(root: ParentNode): boolean {
  const toolbar = root.querySelector<HTMLElement>("#inspection-toolbar");
  if (!toolbar) return false;

  toolbar.classList.add(INSPECTION_TOOLBAR_CANDIDATE_CLASS);
  toolbar.querySelectorAll<HTMLButtonElement>("button[data-inspection-zoom]")
    .forEach((button) => {
      button.classList.add(BUTTON_CLASS);
    });

  const output = toolbar.querySelector<HTMLOutputElement>("#inspection-zoom");
  output?.classList.add(OUTPUT_CLASS);
  return true;
}
