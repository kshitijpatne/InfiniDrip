// UIQ-04 native material clarity panel: displays caller-supplied fabric
// behavior guidance and screen-only appearance information. This module
// performs no drafting/ease math, never recalculates or clamps a supplied
// value, and sets every string through textContent (never innerHTML).
//
// Fabric and appearance data are typed as non-optional/non-null by their
// source types, but a caller can still hand this module a structurally
// malformed runtime value. Where the frozen contract calls for defensive
// validation (fabric stretch, color, appearance texture/shine) this module
// re-checks the actual runtime value with the existing imported helpers
// instead of trusting the static type, and never widens that validation
// beyond what those helpers already decide.

import { STRETCH_FABRICS, type StretchFabric } from "../../../drafting/ease";
import {
  APPEARANCE_TEXTURES,
  normalizeHex,
  parseAppearance,
  type Appearance,
} from "../../appearance";

export interface MaterialSnapshot {
  readonly revisionLabel: string;
  readonly fabric: StretchFabric | null;
  readonly easeGuidance: string | null;
  readonly compatibility: {
    readonly state: "compatible" | "mismatch" | "unknown";
    readonly detail: string;
  };
  readonly color: string;
  readonly appearance: Appearance | null;
}

export interface MaterialPanelOptions {
  readonly snapshot: MaterialSnapshot;
  readonly onReview: (target: "fabric" | "appearance") => void;
}

const ROOT_CLASS = "uiq-foundation";
const SCOPE_CLASS = "uiq-material";

const FABRIC_CAVEAT =
  "Preset stretch values are heuristic defaults, not measurements or certified material specifications.";
const EASE_CAVEAT =
  "This guidance is a heuristic, not drape physics. Physical sampling is still needed before cutting.";
const APPEARANCE_CAVEAT =
  "Color, texture, and shine are a screen preview only. They do not change material behavior or establish fabric compatibility.";
const PREVIEW_UNAVAILABLE = "Preview unavailable";

const COMPATIBILITY_LABEL: Record<MaterialSnapshot["compatibility"]["state"], string> = {
  compatible: "Compatible",
  mismatch: "Mismatch",
  unknown: "Unknown",
};

function isUsableStretch(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function matchesKnownPreset(fabric: StretchFabric): boolean {
  return STRETCH_FABRICS.some(
    (preset) =>
      preset.name === fabric.name &&
      preset.family === fabric.family &&
      preset.stretchPercent === fabric.stretchPercent,
  );
}

function textEl(tag: string, className: string, text: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

function buildPresetList(): HTMLElement {
  const list = document.createElement("ul");
  list.className = "uiq-material-preset-list";
  for (const preset of STRETCH_FABRICS) {
    const item = document.createElement("li");
    item.className = "uiq-material-preset-item";
    item.textContent = `${preset.name} — ${preset.family}, ${preset.stretchPercent}% stretch`;
    list.append(item);
  }
  return list;
}

function renderFabricDetail(container: HTMLElement, fabric: StretchFabric | null): void {
  container.replaceChildren();

  if (fabric == null) {
    container.append(textEl("p", "uiq-material-fabric-name", "Unknown fabric: none supplied."));
    return;
  }

  const classification = matchesKnownPreset(fabric) ? "Known preset" : "Custom / unverified fabric";
  container.append(
    textEl(
      "p",
      "uiq-material-fabric-name",
      `${fabric.name} (${fabric.family}) — ${classification}.`,
    ),
  );

  const stretch = fabric.stretchPercent;
  if (isUsableStretch(stretch)) {
    container.append(textEl("p", "uiq-material-fabric-stretch", `Stretch: ${stretch}%.`));
  } else {
    container.append(
      textEl(
        "p",
        "uiq-material-fabric-stretch uiq-material-fabric-stretch--invalid",
        `Stretch value supplied is invalid: ${String(stretch)}. Shown as supplied; not clamped. Review fabric: supply a finite stretch percentage of 0 or greater.`,
      ),
    );
  }
}

function renderEaseGuidance(container: HTMLElement, easeGuidance: string | null): void {
  container.textContent = easeGuidance === null ? "Ease guidance unavailable." : easeGuidance;
}

function renderCompatibility(
  container: HTMLElement,
  compatibility: MaterialSnapshot["compatibility"],
): void {
  container.replaceChildren();
  container.append(
    textEl("span", "uiq-material-compatibility-label", COMPATIBILITY_LABEL[compatibility.state]),
    textEl("span", "uiq-material-compatibility-detail", compatibility.detail),
  );
}

/** Returns the normalized hex actually applied to the swatch, or null if the supplied color was invalid. */
function renderColorSwatch(swatch: HTMLElement, text: HTMLElement, color: string): string | null {
  const normalized = normalizeHex(color);
  if (normalized === null) {
    swatch.hidden = true;
    swatch.style.removeProperty("background-color");
    text.textContent = `${PREVIEW_UNAVAILABLE} (supplied color: ${color}).`;
    return null;
  }
  swatch.hidden = false;
  swatch.style.backgroundColor = normalized;
  text.textContent = `Supplied color: ${normalized}.`;
  return normalized;
}

function renderAppearance(
  cue: HTMLElement,
  text: HTMLElement,
  appearance: Appearance | null,
  normalizedColor: string | null,
): void {
  cue.hidden = true;
  cue.className = "uiq-material-appearance-cue";
  cue.style.removeProperty("background-color");
  cue.style.removeProperty("--uiq-material-shine");

  if (appearance == null) {
    // Runtime absence must not invoke parseAppearance(undefined)'s default.
    text.textContent = "Appearance not supplied. Preview unavailable.";
    return;
  }

  const rawTexture: unknown = appearance.texture;
  const rawShine: unknown = appearance.shine;
  const parsed = parseAppearance(appearance);
  const knownTexture = APPEARANCE_TEXTURES.find((option) => option.id === rawTexture);
  const textureLabel = knownTexture ? knownTexture.label : String(rawTexture);

  text.textContent =
    parsed === null
      ? `Appearance values supplied are invalid. Supplied texture: ${textureLabel}, ` +
        `supplied shine: ${String(rawShine)}. Shown as supplied; not clamped. Review appearance: choose a listed texture and finite shine between 0 and 100.`
      : `Texture: ${textureLabel}. Shine: ${parsed.shine}.`;

  if (parsed === null || normalizedColor === null) return;

  cue.hidden = false;
  cue.classList.add(`uiq-material-appearance-cue--${parsed.texture}`);
  cue.style.backgroundColor = normalizedColor;
  cue.style.setProperty("--uiq-material-shine", String(parsed.shine / 100));
}

export function mountMaterialPanel(
  host: HTMLElement,
  options: MaterialPanelOptions,
): { update(snapshot: MaterialSnapshot): void; dispose(): void } {
  let disposed = false;

  const root = document.createElement("section");
  root.className = `${ROOT_CLASS} ${SCOPE_CLASS}`;

  const revision = textEl("p", "uiq-material-revision", "");

  const fabricSection = document.createElement("div");
  fabricSection.className = "uiq-material-fabric-section";
  const fabricHeading = textEl("h2", "uiq-material-fabric-heading", "Material behavior guidance");
  const fabricDetail = document.createElement("div");
  fabricDetail.className = "uiq-material-fabric-detail";
  const presetList = buildPresetList();
  const presetCaveat = textEl("p", "uiq-material-caveat", FABRIC_CAVEAT);
  const easeGuidance = textEl("p", "uiq-material-ease-guidance", "");
  const easeCaveat = textEl("p", "uiq-material-caveat", EASE_CAVEAT);
  const compatibility = document.createElement("div");
  compatibility.className = "uiq-material-compatibility";
  compatibility.setAttribute("role", "status");
  const reviewFabricButton = document.createElement("button");
  reviewFabricButton.type = "button";
  reviewFabricButton.className = "uiq-material-review-fabric";
  reviewFabricButton.textContent = "Review fabric";
  const reviewFabric = () => options.onReview("fabric");
  reviewFabricButton.addEventListener("click", reviewFabric);

  fabricSection.append(
    fabricHeading,
    fabricDetail,
    presetList,
    presetCaveat,
    easeGuidance,
    easeCaveat,
    compatibility,
    reviewFabricButton,
  );

  const appearanceSection = document.createElement("div");
  appearanceSection.className = "uiq-material-appearance-section";
  const appearanceHeading = textEl(
    "h2",
    "uiq-material-appearance-heading",
    "Screen appearance only",
  );
  const appearanceCaveat = textEl("p", "uiq-material-caveat", APPEARANCE_CAVEAT);
  const colorSwatch = document.createElement("span");
  colorSwatch.className = "uiq-material-color-swatch";
  const colorText = textEl("p", "uiq-material-color-text", "");
  const appearanceCue = document.createElement("span");
  appearanceCue.className = "uiq-material-appearance-cue";
  const appearanceText = textEl("p", "uiq-material-appearance-text", "");
  const reviewAppearanceButton = document.createElement("button");
  reviewAppearanceButton.type = "button";
  reviewAppearanceButton.className = "uiq-material-review-appearance";
  reviewAppearanceButton.textContent = "Review appearance";
  const reviewAppearance = () => options.onReview("appearance");
  reviewAppearanceButton.addEventListener("click", reviewAppearance);

  appearanceSection.append(
    appearanceHeading,
    appearanceCaveat,
    colorSwatch,
    colorText,
    appearanceCue,
    appearanceText,
    reviewAppearanceButton,
  );

  root.append(revision, fabricSection, appearanceSection);
  host.append(root);

  function render(snapshot: MaterialSnapshot): void {
    revision.textContent = snapshot.revisionLabel;
    renderFabricDetail(fabricDetail, snapshot.fabric);
    renderEaseGuidance(easeGuidance, snapshot.easeGuidance);
    renderCompatibility(compatibility, snapshot.compatibility);
    const normalizedColor = renderColorSwatch(colorSwatch, colorText, snapshot.color);
    renderAppearance(appearanceCue, appearanceText, snapshot.appearance, normalizedColor);
  }

  render(options.snapshot);

  return {
    update(snapshot: MaterialSnapshot): void {
      if (disposed) return;
      render(snapshot);
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      reviewFabricButton.removeEventListener("click", reviewFabric);
      reviewAppearanceButton.removeEventListener("click", reviewAppearance);
      root.remove();
    },
  };
}
