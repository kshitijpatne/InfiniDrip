// UIQ-02 isolated preview wiring. Imports only the foundation module and its
// stylesheet — no application code, no shared app state, no network calls.
import "../../src/ui/enhancements/foundation/foundation.css";
import { createFoundationPanel, createFoundationStatus } from "../../src/ui/enhancements/foundation/foundation";

const HOSTILE_SAMPLE = "<script>alert('xss')</script> & \"quoted\" <b>bold</b>";
const LONG_SAMPLE =
  "This is a deliberately long description string used to demonstrate narrow-width wrapping behavior. ".repeat(6);

function mountInto(id: string, element: HTMLElement): void {
  const host = document.getElementById(id);
  if (!host) throw new Error(`Preview host #${id} is missing from foundation.html.`);
  host.append(element);
}

function buildPanelsSection(): void {
  mountInto(
    "preview-panels",
    createFoundationPanel("Short panel", "A brief, ordinary description of panel contents."),
  );
  mountInto("preview-panels", createFoundationPanel("Long-text panel", LONG_SAMPLE));
  mountInto(
    "preview-panels",
    createFoundationPanel("Hostile-looking panel", HOSTILE_SAMPLE),
  );
}

function buildStatusSection(): void {
  mountInto("preview-status", createFoundationStatus("Draft saved locally.", "info"));
  mountInto(
    "preview-status",
    createFoundationStatus("This value is outside the usual range; double-check before continuing.", "warning"),
  );
  mountInto("preview-status", createFoundationStatus("Could not read the selected file.", "error"));
}

function buildControlsSection(): void {
  const panel = createFoundationPanel("Native controls", "Enabled and disabled native inputs, selects, and buttons.");

  const label = document.createElement("label");
  label.textContent = "Garment name";
  label.setAttribute("for", "preview-control-input");
  const input = document.createElement("input");
  input.id = "preview-control-input";
  input.type = "text";
  input.placeholder = "e.g. Classic tee";

  const sizeLabel = document.createElement("label");
  sizeLabel.textContent = "Size";
  sizeLabel.setAttribute("for", "preview-control-select");
  const select = document.createElement("select");
  select.id = "preview-control-select";
  for (const value of ["Small", "Medium", "Large"]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
  select.value = "Medium";

  const enabledButton = document.createElement("button");
  enabledButton.type = "button";
  enabledButton.textContent = "Enabled action";

  const disabledButton = document.createElement("button");
  disabledButton.type = "button";
  disabledButton.textContent = "Disabled action";
  disabledButton.disabled = true;

  const disabledLabel = document.createElement("label");
  disabledLabel.textContent = "Disabled field";
  disabledLabel.setAttribute("for", "preview-control-disabled-input");
  const disabledInput = document.createElement("input");
  disabledInput.id = "preview-control-disabled-input";
  disabledInput.type = "text";
  disabledInput.value = "Disabled field";
  disabledInput.disabled = true;

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Read synthetic guidance";
  const detailText = document.createElement("p");
  detailText.textContent = "Native disclosure only: this preview cannot save, check or export a garment.";
  details.append(summary, detailText);
  panel.append(label, input, sizeLabel, select, enabledButton, disabledButton, disabledLabel, disabledInput, details);
  mountInto("preview-controls", panel);
}

function buildGlassComparisonSection(): void {
  const solid = createFoundationPanel("Solid panel", "Default opaque panel background.");
  const glass = createFoundationPanel("Glass panel", "Optional translucent panel with a solid, opaque fallback.");
  glass.classList.add("uiq-foundation-panel--glass");

  mountInto("preview-glass", solid);
  mountInto("preview-glass", glass);
}

buildPanelsSection();
buildStatusSection();
buildControlsSection();
buildGlassComparisonSection();
