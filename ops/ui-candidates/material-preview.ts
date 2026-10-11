// UIQ-04 standalone rendered preview. Manual verification harness only — not
// part of the application build entry and not reachable from production
// code. Builds every snapshot with plain object literals (no app state, no
// persistence, no network) and mounts mountMaterialPanel directly.

import { mountMaterialPanel, type MaterialSnapshot } from "../../src/ui/enhancements/material/material-panel";
import { STRETCH_FABRICS } from "../../src/drafting/ease";
import { APPEARANCE_TEXTURES, type Appearance } from "../../src/ui/appearance";

const app = document.getElementById("app");
if (!app) throw new Error("Preview harness is missing #app.");

const grid = document.createElement("div");
grid.className = "case-grid";
app.append(grid);

function baseSnapshot(overrides: Partial<MaterialSnapshot> = {}): MaterialSnapshot {
  return {
    revisionLabel: "Revision 1",
    fabric: STRETCH_FABRICS[0],
    easeGuidance: "Cotton woven has no stretch — add positive ease (around 10 cm is typical).",
    compatibility: { state: "compatible", detail: "Fabric matches the selected recipe." },
    color: "#336699",
    appearance: { texture: "woven", shine: 30 },
    ...overrides,
  };
}

function addCase(title: string, snapshot: MaterialSnapshot): ReturnType<typeof mountMaterialPanel> {
  const wrapper = document.createElement("section");
  wrapper.className = "case";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const host = document.createElement("div");
  const log = document.createElement("p");
  log.className = "log";
  log.textContent = "No review action yet.";

  wrapper.append(heading, host, log);
  grid.append(wrapper);

  const handle = mountMaterialPanel(host, {
    snapshot,
    onReview: (target) => {
      log.textContent = `onReview fired once with target="${target}" at ${new Date().toLocaleTimeString()}.`;
    },
  });
  return handle;
}

// 1. All five existing presets, each as its own fabric.
STRETCH_FABRICS.forEach((preset, index) => {
  addCase(`Preset ${index + 1}: ${preset.name}`, baseSnapshot({ fabric: preset }));
});

// 2. Custom/unverified fabric (no exact-match preset).
addCase(
  "Custom / unverified fabric",
  baseSnapshot({ fabric: { name: "Reclaimed deadstock weave", family: "woven", stretchPercent: 4 } }),
);

// 3. Missing fabric.
addCase("Missing fabric (null)", baseSnapshot({ fabric: null }));

// 4. Missing ease guidance.
addCase("Missing ease guidance (null)", baseSnapshot({ easeGuidance: null }));

// 5. Missing appearance.
addCase("Missing appearance (null)", baseSnapshot({ appearance: null }));

// 6. Compatibility states.
addCase(
  "Compatibility: compatible",
  baseSnapshot({ compatibility: { state: "compatible", detail: "Stretch covers the negative-ease target." } }),
);
addCase(
  "Compatibility: mismatch",
  baseSnapshot({ compatibility: { state: "mismatch", detail: "Recipe expects a knit; this fabric is woven." } }),
);
addCase(
  "Compatibility: unknown",
  baseSnapshot({ compatibility: { state: "unknown", detail: "No recipe selected yet." } }),
);

// 7. All four textures at shine 0 and shine 100.
APPEARANCE_TEXTURES.forEach((texture) => {
  addCase(`Texture ${texture.label}, shine 0`, baseSnapshot({ appearance: { texture: texture.id, shine: 0 } }));
  addCase(`Texture ${texture.label}, shine 100`, baseSnapshot({ appearance: { texture: texture.id, shine: 100 } }));
});

// 8. Invalid color / shine / texture / stretch.
addCase("Invalid color (not a hex string)", baseSnapshot({ color: "cornflowerblue" }));
addCase(
  "Invalid shine (supplied 140, out of range)",
  baseSnapshot({ appearance: { texture: "rib", shine: 140 } }),
);
addCase(
  "Invalid texture (supplied 'plaid', unknown id)",
  baseSnapshot({ appearance: { texture: "plaid" as Appearance["texture"], shine: 10 } }),
);
addCase(
  "Invalid stretch (supplied -12, never clamped)",
  baseSnapshot({ fabric: { name: "Negative stretch sample", family: "knit", stretchPercent: -12 } }),
);

// 9. Malicious / long hostile strings across every literal text field.
addCase(
  "Hostile text (long + markup-looking + unicode) rendered literally",
  baseSnapshot({
    revisionLabel: "<script>window.__uiq04_pwned = true;</script>",
    fabric: { name: "a".repeat(400) + " ünïcödé 🎉", family: "knit", stretchPercent: 25 },
    easeGuidance: "</p><b>bold</b> javascript:alert(1)",
    compatibility: { state: "mismatch", detail: "&lt;already-escaped&gt; " + "x".repeat(300) },
    color: "<img src=x onerror=alert(1)>",
    appearance: { texture: "<script>" as Appearance["texture"], shine: 5 },
  }),
);

// 10. Two independent mounts of the same snapshot, plus an external control
// that drives a synchronous controlled update on only one of them.
const twoMountSection = document.createElement("section");
twoMountSection.className = "case";
const twoMountHeading = document.createElement("h2");
twoMountHeading.textContent = "Two mounts + controlled update (external trigger)";
const mountAHost = document.createElement("div");
const mountBHost = document.createElement("div");
const controls = document.createElement("div");
controls.className = "two-mount-controls";
const updateButton = document.createElement("button");
updateButton.type = "button";
updateButton.textContent = "Update mount A only (controlled update)";
const disposeButton = document.createElement("button");
disposeButton.type = "button";
disposeButton.textContent = "Dispose mount B";
controls.append(updateButton, disposeButton);
twoMountSection.append(twoMountHeading, mountAHost, mountBHost, controls);
grid.append(twoMountSection);

const sharedSnapshot = baseSnapshot({ revisionLabel: "Shared revision 1" });
const mountA = mountMaterialPanel(mountAHost, {
  snapshot: sharedSnapshot,
  onReview: (target) => window.alert(`Mount A onReview: ${target}`),
});
const mountB = mountMaterialPanel(mountBHost, {
  snapshot: sharedSnapshot,
  onReview: (target) => window.alert(`Mount B onReview: ${target}`),
});

let revisionCount = 1;
updateButton.addEventListener("click", () => {
  revisionCount += 1;
  mountA.update(baseSnapshot({ revisionLabel: `Shared revision ${revisionCount} (A only)` }));
});
disposeButton.addEventListener("click", () => {
  mountB.dispose();
  disposeButton.disabled = true;
});
