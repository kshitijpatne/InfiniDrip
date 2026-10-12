import "../../src/ui/enhancements/inspection/inspection-toolbar.css";
import { applyInspectionToolbarCandidate } from "../../src/ui/enhancements/inspection/inspection-toolbar";

const stage = document.getElementById("candidate-stage");
const viewport = document.getElementById("inspection-viewport");
const content = document.getElementById("inspection-content");
const zoom = document.getElementById("inspection-zoom");
const status = document.getElementById("zoom-status");
const toolbar = document.getElementById("inspection-toolbar");
const toggle = document.getElementById("opaque-toggle");

if (!(stage instanceof HTMLElement) || !(viewport instanceof HTMLElement) ||
    !(content instanceof HTMLElement) || !(zoom instanceof HTMLOutputElement) ||
    !(status instanceof HTMLElement) || !(toolbar instanceof HTMLElement) ||
    !(toggle instanceof HTMLButtonElement)) {
  throw new Error("UIQ-08 candidate preview is incomplete.");
}

if (!applyInspectionToolbarCandidate(stage)) {
  throw new Error("UIQ-08 inspection toolbar is missing.");
}

content.style.minHeight = "420px";
let zoomPercent = 100;
const update = () => {
  content.style.width = `${zoomPercent}%`;
  zoom.value = `${zoomPercent}%`;
  zoom.textContent = `${zoomPercent}%`;
  status.textContent = `Zoom ${zoomPercent}% · scroll position retained.`;
};

toolbar.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>("button[data-inspection-zoom]");
  if (!button) return;
  const action = button.dataset.inspectionZoom;
  const previousScrollLeft = viewport.scrollLeft;
  const previousScrollTop = viewport.scrollTop;
  zoomPercent = action === "fit" ? 100
    : action === "in" ? Math.min(250, zoomPercent + 25)
      : action === "out" ? Math.max(50, zoomPercent - 25) : zoomPercent;
  update();
  viewport.scrollLeft = previousScrollLeft;
  viewport.scrollTop = previousScrollTop;
});

toggle.addEventListener("click", () => {
  const opaque = toolbar.classList.toggle("uiq-inspection-toolbar--opaque");
  toggle.setAttribute("aria-pressed", String(opaque));
  toggle.textContent = opaque ? "Use translucent treatment" : "Use opaque fallback";
});

update();
