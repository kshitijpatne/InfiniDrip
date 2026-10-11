// Synthetic unshipped fixtures only; no app, draft, persistence or export calls.
import { STRETCH_FABRICS } from "../../src/drafting/ease";
import { mountGuidancePanel, type GuidanceSnapshot } from "../../src/ui/enhancements/guidance/guidance-panel";
import { mountMaterialPanel, type MaterialSnapshot } from "../../src/ui/enhancements/material/material-panel";
import "../../src/ui/enhancements/foundation/foundation.css";
import "../../src/ui/enhancements/guidance/guidance-panel.css";
import "../../src/ui/enhancements/material/material-panel.css";
import axe from "axe-core";

const guidanceFixture = document.querySelector<HTMLSelectElement>("#clarity-guidance-fixture")!;
const materialFixture = document.querySelector<HTMLSelectElement>("#clarity-material-fixture")!;
const callback = document.querySelector<HTMLElement>("#clarity-callback")!;
const long = `<img src=https://example.invalid/never-fetch onerror=alert(1)> Ω👗 ${"UnbrokenLiteral".repeat(60)}`;
const readiness = { inputsOk: true, styleReviewed: false, checksOk: true, checkReviewed: false, exported: false };
function guidanceSnapshot(): GuidanceSnapshot {
  const base: GuidanceSnapshot = {
    revisionLabel: "Synthetic guidance revision A", step: "fit", readiness,
    fitIntent: "Relaxed preference — not a validity verdict", validity: { state: "valid", detail: "Caller reports valid digital inputs; review remains incomplete." },
    notes: [
      { id: "info", note: { level: "info", text: "Fabric advice is a heuristic." }, detail: "Supplied explanation only. Nothing is inferred.", action: { label: "Review fabric preference", step: "fit", field: "fabric" } },
      { id: "warning", note: { level: "warn", text: "Physical sampling has not been completed." }, detail: "" },
      { id: "ok", note: { level: "ok", text: "Caller-provided note, not a global pass." } },
    ],
  };
  switch (guidanceFixture.value) {
    case "blocked": return { ...base, step: "measure", fitIntent: null, validity: { state: "invalid", detail: "Supplied measurement combination requires correction." }, blocker: { message: "Review chest input before the next action.", step: "measure", field: "chest" } };
    case "empty": return { ...base, step: "start", fitIntent: null, validity: { state: "unknown", detail: "No digital verdict was supplied." }, notes: [] };
    case "legacy": return { ...base, step: "done" };
    case "legacy-blocked": return { ...base, step: "done", blocker: { message: "File confirmation unavailable", step: "done", field: "export" } };
    case "complete": return { ...base, readiness: { ...readiness, styleReviewed: true } };
    case "hostile": return { ...base, revisionLabel: long, fitIntent: long, validity: { state: "valid", detail: long }, notes: [{ ...base.notes[0]!, note: { level: "info", text: long }, detail: long, action: { label: long, step: "fit", field: long } }] };
    case "reordered": return { ...base, revisionLabel: "Synthetic guidance revision B", notes: [...base.notes].reverse() };
    case "removed": return { ...base, notes: [{ ...base.notes[0]!, action: undefined }, ...base.notes.slice(1)] };
    case "blank-label": return { ...base, notes: [{ ...base.notes[0]!, action: { label: "", step: "fit" } }] };
    default: return base;
  }
}
function materialSnapshot(): MaterialSnapshot {
  const base: MaterialSnapshot = { revisionLabel: "Synthetic material revision A", fabric: STRETCH_FABRICS[0]!, easeGuidance: "Caller-provided digital ease advice only.", compatibility: { state: "compatible", detail: "Caller supplied this status; this panel did not infer it." }, color: "#287AAD", appearance: { texture: "smooth", shine: 0 } };
  switch (materialFixture.value) {
    case "linen": return { ...base, fabric: STRETCH_FABRICS[1]!, appearance: { texture: "woven", shine: 0 } };
    case "jersey": return { ...base, fabric: STRETCH_FABRICS[2]! };
    case "rib": return { ...base, fabric: STRETCH_FABRICS[3]!, appearance: { texture: "rib", shine: 25 } };
    case "spandex": return { ...base, fabric: STRETCH_FABRICS[4]!, appearance: { texture: "smooth", shine: 100 } };
    case "custom": return { ...base, fabric: { name: "Unverified custom stretch", family: "knit", stretchPercent: 125 }, compatibility: { state: "unknown", detail: "No compatibility verdict supplied for this custom fabric." } };
    case "unknown": return { ...base, fabric: null, easeGuidance: null, appearance: null, compatibility: { state: "unknown", detail: "Information missing; do not invent a verdict." } };
    case "mismatch": return { ...base, compatibility: { state: "mismatch", detail: "Caller detected a mismatch. Appearance cannot repair it." } };
    case "heather": return { ...base, appearance: { texture: "heather", shine: 100 } };
    case "bad-color": return { ...base, color: "url(https://example.invalid/never-fetch)" };
    case "bad-texture": return { ...base, appearance: { texture: "url(https://example.invalid/never-fetch)", shine: 0 } as unknown as MaterialSnapshot["appearance"] };
    case "bad-shine": return { ...base, appearance: { texture: "smooth", shine: 101 } };
    case "bad-stretch": return { ...base, fabric: { ...base.fabric!, stretchPercent: -1 } };
    case "hostile": return { ...base, revisionLabel: long, fabric: { name: long, family: "knit", stretchPercent: NaN }, color: long, easeGuidance: long, compatibility: { state: "mismatch", detail: long }, appearance: { texture: long, shine: NaN } as unknown as MaterialSnapshot["appearance"] };
    default: return base;
  }
}
let count = 0;
let guidance: ReturnType<typeof mountGuidancePanel>;
let material: ReturnType<typeof mountMaterialPanel>;
function mountPrimary() {
  guidance = mountGuidancePanel(document.querySelector<HTMLElement>("#clarity-guidance")!, { snapshot: guidanceSnapshot(), onReview: action => { callback.textContent = `Review request ${++count}: ${JSON.stringify(action)}. No design change.`; guidance.update(guidanceSnapshot()); } });
  material = mountMaterialPanel(document.querySelector<HTMLElement>("#clarity-material")!, { snapshot: materialSnapshot(), onReview: target => { callback.textContent = `Review request ${++count}: ${target}. No design change.`; material.update(materialSnapshot()); } });
}
mountPrimary();
mountGuidancePanel(document.querySelector<HTMLElement>("#clarity-guidance-second")!, { snapshot: { ...guidanceSnapshot(), revisionLabel: "Independent guidance instance" }, onReview: action => { callback.textContent = `Second guidance request ${++count}: ${JSON.stringify(action)}`; } });
mountMaterialPanel(document.querySelector<HTMLElement>("#clarity-material-second")!, { snapshot: { ...materialSnapshot(), revisionLabel: "Independent material instance" }, onReview: target => { callback.textContent = `Second material request ${++count}: ${target}`; } });
let outerRequests = 0, innerRequests = 0;
const nestedStatus = document.querySelector<HTMLElement>("#clarity-nested-status")!;
const reportNested = () => { nestedStatus.textContent = `Outer requests:${outerRequests}; inner requests:${innerRequests}.`; };
const nestedHost = document.querySelector<HTMLElement>("#clarity-nested-outer")!;
mountGuidancePanel(nestedHost, { snapshot: { ...guidanceSnapshot(), revisionLabel: "Outer nested instance" }, onReview: () => { outerRequests += 1; reportNested(); } });
const innerHost = document.createElement("div"); innerHost.id = "clarity-nested-inner";
nestedHost.querySelector(".uiq-guidance")!.append(innerHost);
mountGuidancePanel(innerHost, { snapshot: { ...guidanceSnapshot(), revisionLabel: "Inner nested instance — same caller IDs" }, onReview: () => { innerRequests += 1; reportNested(); } });
guidanceFixture.addEventListener("change", () => guidance.update(guidanceSnapshot()));
materialFixture.addEventListener("change", () => material.update(materialSnapshot()));
document.querySelector("#clarity-refresh")!.addEventListener("click", () => { guidance.update(guidanceSnapshot()); material.update(materialSnapshot()); });
document.querySelector("#clarity-duplicate")!.addEventListener("click", () => {
  const state = guidanceSnapshot();
  const note = state.notes[0] ?? { id: "duplicate", note: { level: "info" as const, text: "Synthetic duplicate" } };
  try { guidance.update({ ...state, notes: [note, note] }); document.querySelector("#clarity-duplicate-result")!.textContent = "FAIL: duplicate was accepted."; }
  catch { document.querySelector("#clarity-duplicate-result")!.textContent = "Duplicate rejected; previous DOM retained."; }
});
document.querySelector("#clarity-dispose")!.addEventListener("click", () => { guidance.dispose(); material.dispose(); });
document.querySelector("#clarity-remount")!.addEventListener("click", () => { guidance.dispose(); material.dispose(); mountPrimary(); });
document.querySelector("#clarity-audit")!.addEventListener("click", async () => {
  const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
  document.querySelector("#clarity-audit-result")!.textContent = JSON.stringify({ violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(({ target }) => target) })) });
});
