import { describe, it, expect } from "vitest";
import { STANDARD_M, GARMENTS, TSHIRT_SIZES, TEE, WOVEN_SHIRT, WOVEN_SHIRT_OPTION_DEFINITIONS, draftTshirt, rolePiece, type Piece } from "../drafting";
import { garmentToggleMarkup, dartControlsMarkup, exportButtonsMarkup, fieldHistoryDialogContent, fieldObservationSummary, patternAnnotationKeyMarkup } from "./view";
import { DEFAULT_FABRIC, BLUEPRINT } from "../render";
import { matchStyle, styleNames, TEE_STYLES } from "../style";
import { controlsMarkup, appShellMarkup, guidanceMarkup, styleMarkup, surfaceMarkup, nestIntelMarkup, nestIntelReadout, fabricSwatchesMarkup, fabricStretchMarkup, specTableMarkup, viewToggleMarkup, bodyCroquisToggleMarkup, fabricWidthMarkup, checkMarkup, editorHintMarkup, semanticEditorHintMarkup, editorHandleControlsMarkup, inspectionMarkup } from "./view";
import { ARTWORK_CATALOG, ARTWORK_CATEGORIES } from "../surface/artwork-library/catalog";
import { assessArtworkUse } from "../surface/artwork-library/search";
import type { ArtworkCatalogRecord } from "../surface/artwork-library/catalog";
import type { ArtworkUseAssessment } from "../surface/artwork-library/search";
import { pieceHandles } from "../edit";
import { buildReport, present } from "../guidance";
import type { FieldObservationRecord } from "./field-provenance";

describe("controlsMarkup", () => {
  it("renders an input for every measurement, showing its value", () => {
    const html = controlsMarkup(STANDARD_M, TEE.fields);
    expect(html).toContain('data-field="chest"');
    expect(html).toContain('value="100"'); // STANDARD_M.chest
    expect(html).toContain('data-field="ease"');
  });

  it("explains ease as finished wearing room", () => {
    const html = controlsMarkup(STANDARD_M, TEE.fields);
    expect(html).toContain("Ease");
    expect(html).toContain("Finished chest:");
    expect(html).toContain("110 cm");
  });

  it("does not invent a finished-width summary for unrelated fields", () => {
    expect(controlsMarkup(STANDARD_M, ["length", "ease"])).not.toContain("Finished chest");
  });

  it("exposes a compact accessible source/history control for each recipe input", () => {
    const html = controlsMarkup(STANDARD_M, ["chest"], [], {}, "tee");
    expect(html).toContain('data-open-field-history="body.chest-girth"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("No value history recorded for this recipe field yet.");
  });

  it("escapes imported observation text and bounds invalid history pagination inputs", () => {
    const record: FieldObservationRecord = {
      schemaVersion: 1,
      definitionVersion: 1,
      styleId: "b53a1a03-ea2e-4c4f-82dc-14ac86a29895",
      revision: 2,
      updatedAt: "2026-09-24T16:00:00.000Z",
      observations: [1, 2].map((revision) => ({
        revision,
        definitionVersion: 1,
        fieldId: "body.chest-girth",
        semanticId: "body.chest-girth",
        recipeId: "tee",
        inputKey: "chest",
        rawValue: revision === 1 ? "<script>alert(1)</script>" : "9999",
        canonicalValue: revision === 1 ? null : 9999,
        unit: "cm",
        semanticKind: "BODY_MEASURE",
        provenance: "UNRESOLVED",
        evidenceStatus: "UNCONFIRMED",
        validationStatus: "INVALID",
        sourceLabel: "<img src=x onerror=alert(1)>",
        recordedAt: null,
        styleRevision: 1,
        confidence: "NOT_ASSESSED",
      })),
    };
    const html = fieldHistoryDialogContent("tee", "measurement", "chest", record, Number.POSITIVE_INFINITY, 0);
    expect(html).toContain("Page 1 of 1 · 2 total records");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<script>");
    const laterPage = fieldHistoryDialogContent("tee", "measurement", "chest", record, 1, 1);
    expect(laterPage).toContain("Page 2 of 2 · 2 total records");
    expect(laterPage).toContain('data-field-history-page="0"');
    expect(laterPage).toContain('data-field-history-page="2" disabled');
    const firstPage = fieldHistoryDialogContent("tee", "measurement", "chest", record, 0, 1);
    expect(firstPage).toContain('data-field-history-page="1"');
    expect(firstPage).not.toContain('data-field-history-page="1" disabled');
  });

  it("reports missing field definitions and absent field history without inventing a source", () => {
    expect(fieldObservationSummary("missing-recipe", "measurement", "chest", undefined))
      .toBe("No source-aware definition is available.");
    expect(fieldObservationSummary("tee", "measurement", "chest", undefined))
      .toBe("No value history recorded for this recipe field yet.");
    expect(fieldHistoryDialogContent("tee", "measurement", "not-a-field", undefined))
      .toContain("This field is not defined for the selected recipe.");
    expect(fieldHistoryDialogContent("tee", "measurement", "chest", undefined))
      .toContain("No value history is recorded for this field yet.");
  });

  it("tags each measurement as body or finished (chest as a circumference)", () => {
    const html = controlsMarkup(STANDARD_M, TEE.fields);
    expect(html).toContain("body · circ"); // chest / bicep
    expect(html).toContain("finished");    // length / armhole / sleeve
  });

  it("does not tag the ease parameter as a measurement", () => {
    // ease's label span carries no role tag; the only "body/finished" text belongs
    // to real measurements. Check the ease row specifically has no tag markup.
    const html = controlsMarkup(STANDARD_M, TEE.fields);
    const easeRow = html.slice(html.indexOf('data-dim-row="ease"'));
    const easeLabelEnd = easeRow.indexOf("</label>");
    expect(easeRow.slice(0, easeLabelEnd)).not.toContain("body");
    expect(easeRow.slice(0, easeLabelEnd)).not.toContain("finished");
  });

  it("marks each grouped page with its stable index, stage, and label", () => {
    const html = controlsMarkup(STANDARD_M, ["chest", "length", "ease"], [{
      id: "custom", label: "Custom choice", defaultValue: 1, min: 0, max: 2, step: 1,
      group: "Construction",
    }]);
    const pages = [...html.matchAll(/<fieldset\b[^>]*>/g)].map((match) => match[0]);

    expect(pages).toHaveLength(4);
    expect(pages.map((page) => page.match(/data-control-page="(\d+)"/)?.[1]))
      .toEqual(["0", "1", "2", "3"]);
    expect(pages[0]).toContain('data-control-stage="measure"');
    expect(pages[0]).toContain('data-control-label="Body measurements"');
    expect(pages[1]).toContain('data-control-stage="measure"');
    expect(pages[1]).toContain('data-control-label="Lengths & shape"');
    expect(pages[2]).toContain('data-control-stage="fit"');
    expect(pages[2]).toContain('data-control-label="Fit allowance"');
    expect(pages[3]).toContain('data-control-stage="fit"');
    expect(pages[3]).toContain('data-control-label="Construction"');
  });

  it("renders only the fields it is given, in order, and skips the rest", () => {
    // A lower-body field set: waist + hip + length + ease, no chest/sleeve.
    const html = controlsMarkup(STANDARD_M, ["waist", "hip", "length", "ease"]);
    expect(html).toContain('data-field="waist"');
    expect(html).toContain('data-field="hip"');
    expect(html).not.toContain('data-field="chest"');
    expect(html).not.toContain('data-field="sleeveLength"');
    // order follows the fields list, not the FIELDS table
    expect(html.indexOf('data-field="waist"')).toBeLessThan(html.indexOf('data-field="length"'));
  });

  it("puts explicit +/- actions and exact boundary endpoints around each field", () => {
    const html = controlsMarkup(STANDARD_M, ["chest"]);
    expect(html).toContain('data-range-control="chest"');
    expect(html).toContain('data-step-direction="-1"');
    expect(html).toContain('data-step-direction="1"');
    expect(html).toContain('aria-label="Decrease Chest by 1 cm"');
    expect(html).toContain('aria-label="Increase Chest by 1 cm"');
    expect(html).toContain('data-range-min="60"');
    expect(html).toContain('data-range-max="160"');
    expect(html).toContain('data-range-rail');
    expect(html).toContain(">60<");
    expect(html).toContain(">160<");
  });
});

describe("patternAnnotationKeyMarkup", () => {
  it("omits unlabeled marks while retaining labeled construction marks", () => {
    const piece: Piece = {
      ...rolePiece(draftTshirt(STANDARD_M), "front"),
      onFold: false,
      marks: [
        { kind: "button", name: "unlabeled-button", at: { x: 1, y: 1 } },
        { kind: "button", name: "labeled-button", label: "Button placement", at: { x: 2, y: 2 } },
      ],
    };
    const html = patternAnnotationKeyMarkup([piece]);
    expect(html).not.toContain("unlabeled-button");
    expect(html).toContain("Button placement");
  });
});

describe("fabricSwatchesMarkup", () => {
  it("renders a clickable swatch per fabric and highlights the current one", () => {
    const html = fabricSwatchesMarkup(DEFAULT_FABRIC);
    expect(html).toContain(`data-fabric="${DEFAULT_FABRIC}"`);
    expect(html).toContain("outline:2px solid"); // the current swatch is ringed
    expect(html).toContain(">Charcoal<");
    expect(html).toContain('aria-label="Color Charcoal"');
    expect(html).toContain('aria-labelledby="color-title"');
    expect(html).toContain('id="color-title"');
    expect(html).toContain(">Color<");
    expect(html).toContain('id="appearance-toggle"');
    expect(html).toContain('id="appearance-wheel"');
    expect(html).toContain('data-texture="woven"');
    expect(html).toContain('id="appearance-hex"');
  });

  it("falls back safely for an invalid swatch color and unknown garment label", () => {
    expect(fabricSwatchesMarkup("not-a-color")).toContain(`data-fabric="${DEFAULT_FABRIC}"`);
    expect(appShellMarkup(STANDARD_M, DEFAULT_FABRIC, TSHIRT_SIZES, TEE.fields, undefined, "future-garment"))
      .toContain('<span id="current-garment">future-garment</span>');
  });
});

describe("appShellMarkup", () => {
  it("includes the controls, canvas, garment, guidance, and style hosts", () => {
    const html = appShellMarkup(STANDARD_M, DEFAULT_FABRIC, TSHIRT_SIZES, TEE.fields);
    expect(html).toContain('id="canvas-host"');
    expect(html).toContain('id="export-size"');
    expect(html).toContain('id="assembled-preview-toggle"');
    expect(html).toContain('id="guidance-host"');
    expect(html).toContain('id="style-host"');
    expect(html).toContain('id="fabric-width"');
    expect(html).toContain('id="studio-inspector"');
    expect(html).toContain('role="region" aria-labelledby="measurements-title"');
    expect(html).toContain('<h2 id="measurements-title"');
    expect(html).toContain('<main id="infini-shell" aria-labelledby="product-title"');
    expect(html).toContain('<header id="product-header"');
    expect(html).toContain('<h1 id="product-title"');
    expect(html).toContain("Parametric garment design workspace");
    expect(html).toContain('<p id="product-subtitle">Parametric garment design workspace</p>');
    expect(html).toContain('id="workspace-actions"');
    expect(html).toContain('id="undo-pattern"');
    expect(html).toContain('id="redo-pattern"');
    expect(html).toContain('id="recovery-host"');
    expect(html).toContain('id="workspace-confirm"');
    expect(html).toContain('id="workspace-confirm-cancel"');
    expect(html).toContain('id="workspace-confirm-accept"');
    expect(html).toContain('<span id="current-garment">Tee</span>');
    expect(html).toContain('<div id="review-context"></div>');
    expect(html).toContain('id="journey-area"');
    expect(html).toContain('id="tutorial-host"');
    expect(html).toContain('id="readiness-host"');
    expect(html).toContain('id="stretch-host"');
    expect(html).toContain('id="swatch-host"');
    expect(html).toContain('id="controls-panel"');
    expect(html).toContain('id="guidance-host"');
    expect(html).toContain('id="export-host"');
    expect(html).toContain('data-step-direction="-1"');
    expect(html).toContain('data-step-direction="1"');
  });
});

describe("exportButtonsMarkup", () => {
  it("explains each file's purpose and keeps size scope explicit", () => {
    const html = exportButtonsMarkup(TSHIRT_SIZES);
    expect(html.indexOf("Selected size")).toBeLessThan(html.indexOf('id="export-svg"'));
    expect(html).toContain("Vector cutting outline · selected size");
    expect(html).toContain("CAD exchange file · selected size");
    expect(html).toContain("Tiled paper print · selected size");
    expect(html).toContain("Full-sheet print · selected size");
    expect(html).toContain("Draft specs and construction reference · all sizes · overview not to scale");
    expect(html).toContain("Layered projection SVG · all sizes");
    expect(html).toContain("Drives the four selected-size files and Single size nesting.");
    expect(html).toContain('aria-describedby="export-svg-description"');
  });
});

describe("viewToggleMarkup", () => {
  it("offers a Nesting view and highlights the active one", () => {
    const html = viewToggleMarkup("fabric");
    expect(html).toContain('id="view-fabric"');
    expect(html).toContain(">Nesting<");
    expect(html).toContain('role="group" aria-label="Canvas view"');
    expect(html).toContain('id="view-fabric" type="button" aria-pressed="true"');
  });

  it("keeps all seven unique and puts secondary views in native disclosure", () => {
    const html = viewToggleMarkup("spec");
    const ids = [
      "view-pattern", "view-body", "view-nest", "view-spec", "view-fabric", "view-check", "view-edit",
    ];
    const advancedIds = ["view-nest", "view-spec", "view-fabric", "view-check", "view-edit"];
    const detailsStart = html.indexOf('<details id="advanced-views">');
    const menuStart = html.indexOf('<div class="advanced-view-menu">', detailsStart);
    const menuEnd = html.indexOf("</div></details>", menuStart);

    expect(html).toContain('<div id="view-toggle-host" role="group" aria-label="Canvas view"');
    expect(html).toContain('<summary id="advanced-view-label">More views</summary>');
    expect(detailsStart).toBeGreaterThan(-1);
    expect(menuStart).toBeGreaterThan(detailsStart);
    expect(menuEnd).toBeGreaterThan(menuStart);
    expect((html.match(/aria-pressed="true"/g) ?? [])).toHaveLength(1);
    expect((html.match(/aria-pressed="false"/g) ?? [])).toHaveLength(6);

    for (const id of ids) {
      expect((html.match(new RegExp(`id="${id}"`, "g")) ?? [])).toHaveLength(1);
    }
    expect(html.indexOf('id="view-pattern"')).toBeLessThan(detailsStart);
    expect(html.indexOf('id="view-body"')).toBeLessThan(detailsStart);
    const menu = html.slice(menuStart, menuEnd);
    for (const id of advancedIds) expect(menu).toContain(`id="${id}"`);
  });

  it("offers a Check view", () => {
    const html = viewToggleMarkup("check");
    expect(html).toContain('id="view-check"');
    expect(html).toContain(">Check<");
  });

  it("offers an Edit view", () => {
    const html = viewToggleMarkup("edit");
    expect(html).toContain('id="view-edit"');
    expect(html).toContain(">Edit<");
  });
});

describe("bodyCroquisToggleMarkup", () => {
  it("offers combined, single-side, and Side modes with the active mode pressed", () => {
    const html = bodyCroquisToggleMarkup("side");
    expect(html).toContain('id="body-front-back"');
    expect(html).toContain('id="body-front"');
    expect(html).toContain('id="body-back"');
    expect(html).toContain('id="body-side"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain(">Side<");
  });
});

describe("inspectionMarkup", () => {
  it("gives every analytical canvas a named, bounded inspection surface", () => {
    const html = inspectionMarkup('<svg viewBox="0 0 10 20"></svg>', "body");
    expect(html).toContain('id="canvas-inspection"');
    expect(html).toContain('data-inspection-view="body"');
    expect(html).toContain("Body figure inspection");
    expect(html).toContain('id="inspection-viewport"');
    expect(html).toContain('aria-label="Scrollable Body figure inspection"');
    expect(html).toContain('id="spatial-guidance-host"');
    expect(html).toContain('data-inspection-zoom="fit"');
    expect(html).toContain('aria-label="Zoom in"');
  });

  it("falls back to a neutral canvas title for an unknown inspection view", () => {
    expect(inspectionMarkup("<div></div>", "future")).toContain("Canvas inspection");
  });
});

describe("woven option controls", () => {
  it("groups construction options and shows units plus correction help", () => {
    const html = controlsMarkup(STANDARD_M, WOVEN_SHIRT.fields, WOVEN_SHIRT_OPTION_DEFINITIONS);
    expect((html.match(/data-option-group=/g) || [])).toHaveLength(5);
    expect(html).toContain('data-field-unit="option-buttonCount"');
    expect(html).toContain(">buttons<");
    expect(html).toContain('data-field-unit="option-neckEase"');
    expect(html).toContain("one additional button belongs on the collar stand");
    expect(html).toContain('aria-describedby="error-option-buttonCount help-option-buttonCount"');
  });

  it("keeps unitless custom options usable", () => {
    const html = controlsMarkup(STANDARD_M, ["chest"], [{
      id: "custom", label: "Custom choice", defaultValue: 1, min: 0, max: 2, step: 1,
    }]);
    expect(html).toContain('data-option="custom"');
    expect(html).not.toContain('data-field-unit="option-custom"');
    expect(html).toContain('aria-label="Increase Custom choice by 1"');
  });
});

describe("assembled inspection", () => {
  it("uses the same named frame and labels the physical limitation", () => {
    const html = inspectionMarkup("<svg></svg>", "assembled");
    expect(html).toContain('data-inspection-view="assembled"');
    expect(html).toContain("Assembled preview · schematic, not a fit simulation");
    expect(html).toContain('data-inspection-zoom="fit"');
  });
});

describe("appShellMarkup garment routing (Slice 100)", () => {
  it("accepts the active recipe instead of assuming Tee is selected", () => {
    const html = appShellMarkup(STANDARD_M, DEFAULT_FABRIC, TSHIRT_SIZES, [
      "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
    ], "Cotton woven", "trouser");
    expect(html).toContain('id="garment-trouser"');
    expect(html).toContain('<span id="current-garment">Trouser</span>');
    expect(html).toMatch(/id="garment-trouser"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/id="garment-tee"[^>]*aria-pressed="false"/);
  });
});

describe("editorHintMarkup", () => {
  it("explains the override and offers a Reset button", () => {
    const html = editorHintMarkup();
    expect(html).toContain('id="editor-reset"');
    expect(html).toContain('data-editor-contract="preview-only"');
    expect(html).toContain("Exploratory edit");
    expect(html).toContain("assembled garment");
    expect(html).toContain("exports");
  });

  it("shows deterministic invalid-preview issues without claiming that exports use them", () => {
    const html = editorHintMarkup([
      { code: "piece-self-intersection", message: "Panel <front> crosses itself." },
      { code: "fold-edge-invalid", message: "The fold is off center." },
    ], "Jacket <front>");
    expect(html).toContain('data-editor-validation="invalid"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Preview blocked by 2 digital checks.");
    expect(html).toContain("Panel &lt;front&gt; crosses itself.");
    expect(html).toContain("Jacket &lt;front&gt; piece only.");
    expect(html).toContain("current outputs still use the parametric draft");
    expect(html).not.toContain("Panel <front>");
    const singular = editorHintMarkup([{ code: "piece-open", message: "One edge gap." }]);
    expect(singular).toContain("Preview blocked by 1 digital check.");
  });

});

describe("semanticEditorHintMarkup", () => {
  it("renders every source and edit validation state with escaped details", () => {
    const common = {
      roles: ["front", "front", "backSide"],
      canUndo: true,
      canRedo: true,
      canRebase: true,
      hasEdits: true,
      feedback: "Review <pattern>",
    } as const;
    const checking = semanticEditorHintMarkup([], "front", { ...common, status: "checking" });
    expect(checking).toContain("Checking source");
    expect(checking).toContain('data-editor-validation="checking"');
    expect(checking).toContain('<option value="front" selected>front</option>');

    const failed = semanticEditorHintMarkup([{
      code: "invalid-source", message: "Source <hash> failed.", sizeLabel: "M",
    }], "missing-role", { ...common, status: "failed" });
    expect(failed).toContain("Source unavailable");
    expect(failed).toContain('data-editor-validation="failed"');
    expect(failed).toContain('data-editor-size="M"');
    expect(failed).toContain("M: Source &lt;hash&gt; failed.");
    expect(failed).toContain('<option value="backSide">back Side</option>');
    expect(failed).toContain("Review &lt;pattern&gt;");

    const rebase = semanticEditorHintMarkup([{
      code: "rebase-required", message: "Source changed.",
    }], "front", { ...common, status: "rebase-required", feedback: undefined });
    expect(rebase).toContain("Review and rebase required");
    expect(rebase).toContain('data-editor-validation="rebase-required"');
    expect(rebase).not.toContain("data-editor-feedback");

    const blocked = semanticEditorHintMarkup([
      { code: "stitch-invalid", message: "Seam mismatch.", sizeLabel: "S" },
      { code: "anchor-changed", message: "Anchor moved." },
    ], "front", { ...common, status: "blocked" });
    expect(blocked).toContain("Digital checks blocked");
    expect(blocked).toContain('data-editor-validation="invalid"');
    expect(blocked).toContain("2 digital checks");
    expect(blocked).toContain("S: Seam mismatch.");
    expect(blocked).toContain("Anchor moved.");
    expect(blocked).toContain('id="editor-undo" type="button">Undo edit</button>');
    expect(blocked).toContain('id="editor-redo" type="button">Redo edit</button>');
    expect(blocked).toContain('id="editor-rebase" type="button">Rebase edits</button>');
    const singular = semanticEditorHintMarkup([{ code: "stitch-invalid", message: "One seam mismatch." }], "front", {
      ...common, status: "blocked",
    });
    expect(singular).toContain("1 digital check.");

    const ready = semanticEditorHintMarkup([], "front", {
      ...common, status: "ready", canUndo: false, canRedo: false, canRebase: false, hasEdits: false, feedback: undefined,
    });
    expect(ready).toContain("Ready for editing");
    expect(ready).toContain('data-editor-validation="valid"');
    expect(ready).toContain('id="editor-undo" type="button" disabled>Undo edit</button>');
    expect(ready).toContain('id="editor-redo" type="button" disabled>Redo edit</button>');
    expect(ready).toContain('id="editor-rebase" type="button" hidden>Rebase edits</button>');
    expect(ready).not.toContain("data-editor-feedback");
  });
});

describe("editorHandleControlsMarkup", () => {
  it("renders finite x/y inputs for every pointer handle", () => {
    const handles = pieceHandles(rolePiece(draftTshirt(STANDARD_M), "front"));
    const html = editorHandleControlsMarkup(handles);
    expect(html).toContain("Keyboard handle coordinates");
    expect((html.match(/data-editor-coordinate/g) || [])).toHaveLength(handles.length * 2);
    expect(html).toContain('data-editor-handle-id="v0"');
    expect(html).toContain('aria-label="Corner 1 X coordinate"');
    expect(html).toContain('data-step-direction="-1"');
    expect(html).toContain('data-step-direction="1"');
    expect(html).toContain(">−∞<");
    expect(html).toContain(">+∞<");
  });
});

describe("checkMarkup", () => {
  it("shows a ready banner and a tick when every check passes", () => {
    const html = checkMarkup(buildReport([present("Seam", true, "agree")]), true);
    expect(html).toContain("Digital checks pass");
    expect(html).toContain("✓");
    expect(html).toContain("Seam");
    expect(html).toContain("agree");
  });

  it("shows a not-ready banner and a cross when a check fails", () => {
    const html = checkMarkup(buildReport([present("Seam", false, "off by 3 cm")]), true);
    expect(html).toContain("Digital checks need review");
    expect(html).toContain("✗");
    expect(html).toContain("off by 3 cm");
  });
});

describe("fabricWidthMarkup", () => {
  it("renders a labelled width input with the given value", () => {
    const html = fabricWidthMarkup(150);
    expect(html).toContain('id="fabric-width"');
    expect(html).toContain('value="150"');
    expect(html).toContain("Fabric width");
    expect(html).toContain('data-range-control="fabric-width"');
    expect(html).toContain(">30<");
    expect(html).toContain(">300<");
    expect(html).toContain('data-step-direction="1"');
  });

  it("marks an unavailable width as unavailable on the rail", () => {
    expect(fabricWidthMarkup(Number.NaN)).toContain("current value unavailable");
  });
});

describe("guidanceMarkup", () => {
  it("renders one row per note with its text", () => {
    const html = guidanceMarkup([
      { level: "ok", text: "All good" },
      { level: "warn", text: "Fix this" },
    ]);
    expect(html).toContain("All good");
    expect(html).toContain("Fix this");
    expect(html).toContain("Guidance");
  });

  it("leads each note with its severity icon, not colour alone", () => {
    const html = guidanceMarkup([
      { level: "warn", text: "too tight" },
      { level: "ok", text: "looks good" },
      { level: "info", text: "fyi" },
    ]);
    expect(html).toContain("⚠"); // warn glyph
    expect(html).toContain("ℹ"); // info glyph
    expect(html).toContain("✓"); // ok glyph
  });

  it("heads a clean panel with a production-ready verdict", () => {
    const html = guidanceMarkup([{ level: "ok", text: "All good" }]);
    expect(html).toContain("✓ Digital checks pass");
  });

  it("heads a panel with warnings with a count to review", () => {
    const html = guidanceMarkup([
      { level: "warn", text: "a" },
      { level: "info", text: "b" },
      { level: "warn", text: "c" },
    ]);
    expect(html).toContain("⚠ 2 to review"); // info does not count
    expect(html).not.toContain("production-ready");
  });

  it("links field-aware notes to a direct Review action", () => {
    const html = guidanceMarkup([
      { level: "warn", field: "chest", text: "Check chest" },
      { level: "warn", field: "option-buttonCount", text: "Check buttons" },
      { level: "info", field: "stretchFabric", text: "Material note" },
    ]);
    expect(html).toContain('data-guidance-focus="chest"');
    expect(html).toContain('aria-controls="input-chest"');
    expect(html).toContain('data-guidance-focus="option-buttonCount"');
    expect(html).toContain('aria-controls="input-option-buttonCount"');
    expect(html).toContain('aria-controls="stretch-select"');
  });

  it("offers Set-aside beside Review so warnings without a canvas target can be dismissed", () => {
    const html = guidanceMarkup([
      { level: "warn", field: "surface-0-widthCm", text: "Artwork 'x' on A: bad width" },
    ]);
    expect(html).toContain('data-ignore-guidance="surface-0-widthCm"');
    expect(html).toContain(">Set aside<");
  });

  it("marks a dismissed advisory and offers a restore action", () => {
    const html = guidanceMarkup(
      [{ level: "warn", field: "chest", text: "Check chest" }],
      new Set(["chest"]),
    );
    expect(html).toContain('data-guidance-ignored');
    expect(html).toContain("Set aside for this draft");
    expect(html).toContain('data-restore-guidance="chest"');
  });
});

describe("checkMarkup — plausibility gates the green", () => {
  it("reads green only when the pattern is sound AND plausible", () => {
    const html = checkMarkup(buildReport([present("Seam", true, "agree")]), true);
    expect(html).toContain("✓ Digital checks pass");
  });

  it("withholds green when geometry passes but a measurement is implausible", () => {
    const html = checkMarkup(buildReport([present("Seam", true, "agree")]), false);
    expect(html).not.toContain("✓ Digital checks pass");
    expect(html).toContain("Review the flagged inputs and design guidance");
  });

  it("still shows the not-ready banner when a check fails, regardless of plausibility", () => {
    const html = checkMarkup(buildReport([present("Seam", false, "off by 3 cm")]), true);
    expect(html).toContain("Digital checks need review");
  });

  it("shows dismissed guidance as a reconsideration cue", () => {
    const html = checkMarkup(
      buildReport([present("Seam", true, "agree")]),
      true,
      [{ level: "warn", field: "chest", text: "Check chest" }],
    );
    expect(html).toContain("Advisory set aside for this draft");
    expect(html).toContain('data-restore-guidance="chest"');
  });
});

describe("specTableMarkup", () => {
  const rows = [
    { label: "Body chest (finished)", values: [90, 95, 100, 105, 110] },
    { label: "Body length (HPS–hem)", values: [66, 68, 70, 72, 74] },
  ];
  const html = specTableMarkup(rows, ["XS", "S", "M", "L", "XL"], 2);

  it("renders a table with a header row of size labels", () => {
    expect(html).toContain("<table");
    expect(html).toContain(">XS<");
    expect(html).toContain(">XL<");
    expect(html).toContain("Measurement (cm)");
  });

  it("renders every POM row with one value per size, fixed to 0.1", () => {
    expect(html).toContain("Body chest (finished)");
    expect(html).toContain(">100.0<"); // base M chest
    expect(html).toContain(">74.0<"); // XL length
  });

  it("highlights the base column", () => {
    // base index 2 → cells get the gridStrong background
    expect(html).toContain(BLUEPRINT.gridStrong);
  });
});

describe("styleMarkup", () => {
  it("renders the target selector with all styles and the chosen one selected", () => {
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee", TEE_STYLES), styleNames(TEE_STYLES), true);
    expect(html).toContain('id="style-target"');
    expect(html).toContain('aria-label="Target fit"');
    expect(html).toContain('<label for="style-target"');
    expect(html).toContain('class="fit-intent-cards"');
    expect(html).toContain('data-style-target="Classic tee"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Oversized tee"); // an option
    expect(html).toContain("Target fit");
  });

  it("confirms when you already match the chosen target", () => {
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee", TEE_STYLES), styleNames(TEE_STYLES), true);
    expect(html).toContain("You're making a Classic tee");
  });

  it("shows the gap to a target you are not yet in", () => {
    const html = styleMarkup("Oversized tee", matchStyle(STANDARD_M, "Oversized tee", TEE_STYLES), styleNames(TEE_STYLES), true);
    expect(html).toContain("To reach Oversized tee");
    expect(html).toContain("Ease +9 cm");
    expect(html).toContain("Enter the numeric inputs");
    expect(html).toContain("preview updates immediately");
  });

  it("shows a negative delta without a plus sign", () => {
    const html = styleMarkup("Crop tee", matchStyle(STANDARD_M, "Crop tee", TEE_STYLES), styleNames(TEE_STYLES), true);
    expect(html).toContain("Length -13 cm");
  });

  it("withholds the green ✓ when the target is matched but measurements are implausible", () => {
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee", TEE_STYLES), styleNames(TEE_STYLES), false);
    expect(html).not.toContain("✓ You're making a Classic tee");
    expect(html).toContain("matches Classic tee on paper");
  });
});

describe("garmentToggleMarkup", () => {
  it("renders a button for every registered garment, highlighting the active one", () => {
    const html = garmentToggleMarkup("fitted");
    for (const g of GARMENTS) {
      expect(html).toContain(`id="garment-${g.name}"`);
      expect(html).toContain(`>${g.label}</span>`);
    }
    expect(html).toContain("Choose a starting garment");
    expect(html).toContain("Straight-leg trouser");
    expect(html).toContain('data-garment-region="Lower body"');
  });
});

describe("fabricStretchMarkup", () => {
  it("renders material cards backed by the accessible native selector", () => {
    const html = fabricStretchMarkup("Cotton jersey");
    expect(html).toContain('id="stretch-select"');
    expect(html).toContain('class="studio-visually-hidden"');
    expect(html).toContain('data-material-option="Cotton jersey"');
    expect(html).toContain('data-material-option="Linen"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("25% stretch");
    expect(html).toContain("Stable woven");
  });
});

describe("fabricWidthMarkup", () => {
  it("wraps the box in a host the app can hide", () => {
    expect(fabricWidthMarkup(150)).toContain('id="fabric-width-host"');
  });
});

describe("dartControlsMarkup", () => {
  it("shows nothing for a piece with no dart", () => {
    expect(dartControlsMarkup(false, false)).toBe("");
  });

  it("offers the transfer targets for a darted piece", () => {
    const html = dartControlsMarkup(true, false);
    expect(html).toContain('id="dart-shoulder"');
    expect(html).toContain('id="dart-hem"');
    expect(html).not.toContain('id="dart-true"'); // side still split by the dart
  });

  it("offers truing once the side seam is continuous again", () => {
    expect(dartControlsMarkup(true, true)).toContain('id="dart-true"');
  });
});

describe("exportButtonsMarkup", () => {
  it("renders a size option per step, base selected, plus the format buttons", () => {
    const html = exportButtonsMarkup(TSHIRT_SIZES);
    expect(html).toContain('id="export-svg"');
    expect(html).toContain('id="export-size"');
    for (const s of TSHIRT_SIZES) expect(html).toContain(`>${s.label}</option>`);
    expect(html).toContain('value="0" selected'); // base size is the default
    expect(html).toContain('data-export-scope="selected-size"');
    expect(html).toContain('data-export-scope="whole-run"');
    expect(html).toContain("All graded sizes; ignores Selected size");
    expect(html).toContain("Selected size for per-size exports");
  });

  it("declares the print sheet as current-style output, ignoring Selected size", () => {
    const html = exportButtonsMarkup(TSHIRT_SIZES);
    expect(html).toContain('data-export-scope="current-style"');
    expect(html).toContain('id="export-surface-sheet"');
    expect(html).toContain("One style's artwork; ignores Selected size");
  });
});

describe("specTableMarkup — tolerance column", () => {
  const rows = [
    { label: "Chest", values: [96, 100, 104], tolerance: 1.3 },
    { label: "Neck drop", values: [8, 8, 8] }, // no tolerance declared
  ];
  const html = specTableMarkup(rows, ["S", "M", "L"], 1);

  it("shows a Tol ± header and each POM's tolerance", () => {
    expect(html).toContain("Tol ±");
    expect(html).toContain(">1.3<");
  });

  it("shows an em dash when a POM has no tolerance", () => {
    expect(html).toContain(">—<");
  });
});

describe("fabricWidthMarkup — nest scope toggle", () => {
  const html = fabricWidthMarkup(150);
  it("states the scope and consequence of each nesting mode", () => {
    expect(html).toContain('id="nest-single"');
    expect(html).toContain('id="nest-marker"');
    expect(html).toContain(">Single size<");
    expect(html).toContain(">Graded marker<");
    expect(html).toContain('aria-label="Nest the selected size only"');
    expect(html).toContain('aria-label="Nest every graded size"');
    expect(html).toContain("Single size uses");
    expect(html).toContain("Graded marker includes every graded size");
  });
});

describe("controlsMarkup — body-link tags", () => {
  const html = controlsMarkup(STANDARD_M, TEE.fields);
  it("tags each measurement row with its field for the body-view link", () => {
    expect(html).toContain('data-dim-row="chest"');
    expect(html).toContain('data-dim-row="length"');
  });
});

describe("surfaceMarkup — artwork sets per style", () => {
  const data = {
    style: "Classic tee",
    pieceRoles: ["front", "sleeve"],
    placements: [{
      id: "chest-print", kind: "print" as const, pieceRole: "front",
      widthCm: 20, heightCm: 25,
      transform: { dx: 1, dy: 2, scale: 1, rotationDeg: 0 },
      zOrder: 0, sourceName: "tiger.svg",
    }],
    errors: new Map<number, string>([[0, "Placement widthCm: enter a number above 0."]]),
    preview: "<svg></svg>",
  };
  it("renders rows, numeric controls, kind options, and remove actions", () => {
    const html = surfaceMarkup(data);
    expect(html).toContain("Surface");
    expect(html).toContain("chest-print");
    expect(html).toContain('data-surface-index="0"');
    expect(html).toContain('data-surface-field="widthCm"');
    expect(html).toContain('data-surface-field="rotationDeg"');
    expect(html).toContain('<option value="print" selected>');
    expect(html).toContain('data-surface-remove-index="0"');
    expect(html).toContain("tiger.svg");
  });
  it("renders an editable Name input and optional source-dimension inputs", () => {
    const html = surfaceMarkup({
      style: "Scoop",
      placements: [{
        id: "a", kind: "print", pieceRole: "front", widthCm: 20, heightCm: 25,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 },
        zOrder: 0, sourceName: "", sourcePxWidth: 1200, sourcePxHeight: 1500,
      }],
      errors: new Map(),
      preview: "",
    });
    expect(html).toContain('data-surface-field="id"');
    expect(html).toContain('data-guidance-control="surface-0-id"');
    expect(html).toContain('data-surface-field="sourcePxWidth"');
    expect(html).toContain('data-surface-field="sourcePxHeight"');
    expect(html).toContain('value="1200"');
    expect(html).toContain('value="1500"');
    expect(html).toContain("Enter both original image dimensions in pixels to estimate print resolution.");
  });
  it("explains source references, piece-role choices, placement geometry, and layer order", () => {
    const html = surfaceMarkup(data);
    expect(html).toContain('list="surface-piece-role-options"');
    expect(html).toContain('<option value="front"></option>');
    expect(html).toContain('<option value="sleeve"></option>');
    expect(html).toContain("creator, citation/source URL, local filename, or asset ID");
    expect(html).toContain("URLs are never fetched");
    expect(html).toContain("before scale");
    expect(html).toContain("cut-box centre");
    expect(html).toContain("larger stack-order numbers render above smaller ones");
    expect(html).toContain("placement rectangle, not the artwork image");
  });
  it("offers a local drop/picker path and recovery controls for a saved asset ID", () => {
    const html = surfaceMarkup({
      ...data,
      placements: [{ ...data.placements[0]!, assetId: "local-11111111111141118111111111111111-png" }],
      pendingAssetMessage: "Ready: floral.png",
    });
    expect(html).toContain("data-surface-new-dropzone");
    expect(html).toContain('id="surface-new-file"');
    expect(html).toContain(".png,.jpg,.jpeg,.webp,.svg");
    expect(html).toContain("Ready: floral.png");
    expect(html).toContain("data-asset-id=\"local-11111111111141118111111111111111-png\"");
    expect(html).toContain("data-surface-asset-file=\"0\"");
    expect(html).toContain("Replace image");
    expect(html).not.toContain("src=\"C:\\");
  });
  it("shows each placement error against its row", () => {
    const html = surfaceMarkup(data);
    expect(html).toContain('id="error-surface-0"');
    expect(html).toContain("Placement widthCm: enter a number above 0.");
  });
  it("offers an add form and a true-scale preview with its honesty note", () => {
    const html = surfaceMarkup(data);
    expect(html).toContain('id="surface-add"');
    expect(html).toContain('id="surface-new-id"');
    expect(html).toContain('id="surface-new-source"');
    expect(html).toContain('id="surface-new-width"');
    expect(html).toContain('id="surface-new-height"');
    expect(html).toContain('id="surface-preview"');
    expect(html).toContain("placement area for this style");
  });
  it("renders the local library, all taxonomy filters, transparent provenance, and local-only actions", () => {
    const record = ARTWORK_CATALOG[0]!;
    const html = surfaceMarkup({
      style: "Scoop", placements: [], errors: new Map(), preview: "",
      artworkLibrary: {
        query: "birds", category: "", garmentFamily: "", pieceRoleGroup: "",
        printUseFilter: "", assessmentUse: "all-over", selectedPlacementIndex: "",
        actionMessage: "Choose a reference.", isOpen: true, totalCount: ARTWORK_CATALOG.length,
        items: [{ record, assessment: assessArtworkUse(record, "all-over") }],
      },
    });
    expect(html).toContain('id="surface-library-search"');
    expect(html).toContain('id="surface-library-category"');
    expect(html).toContain('id="surface-library-family"');
    expect(html).toContain('id="surface-library-role"');
    expect(html).toContain('id="surface-library-use-filter"');
    expect(html).toContain('id="surface-library-assess-use"');
    for (const category of ARTWORK_CATEGORIES) expect(html).toContain(`value="${category}"`);
    expect(html).toContain(`src="${record.image.localImageUrl}"`);
    expect(html).toContain(`alt="Reference image: ${record.title}"`);
    expect(html).toContain("Needs review");
    expect(html).toContain(record.source.rightsLabel);
    expect(html).toContain(record.source.creditLine);
    expect(html).toContain(record.source.itemRecordUrl);
    expect(html).toContain(record.image.sha256);
    expect(html).toContain("Not a verified seamless tile");
    expect(html).toContain(`data-artwork-stage-id="${record.assetId}"`);
    expect(html).toContain(`data-artwork-apply-id="${record.assetId}" disabled`);
    expect(html).not.toContain(`href="${record.source.itemRecordUrl}"`);
    expect(html).not.toContain(`src="${record.source.originalImageUrl}"`);
    expect(html).toContain("the app does not fetch them");
  });
  it("renders CMA source identity and CC0 API evidence without Met-only labels", () => {
    const record = ARTWORK_CATALOG.find((item) => item.assetId === "builtin-cma-109638")!;
    const html = surfaceMarkup({
      style: "Scoop", placements: [], errors: new Map(), preview: "",
      artworkLibrary: {
        query: "", category: "", garmentFamily: "", pieceRoleGroup: "",
        printUseFilter: "", assessmentUse: "panel", selectedPlacementIndex: "",
        actionMessage: "Choose a reference.", isOpen: true, totalCount: ARTWORK_CATALOG.length,
        items: [{ record, assessment: assessArtworkUse(record, "panel") }],
      },
    });
    expect(html).toContain("Cleveland Museum of Art record 1928.269");
    expect(html).toContain("CMA API: share_license_status = CC0; copyright = null");
    expect(html).toContain("1928.269_print.jpg");
    expect(html).not.toContain("The Met object");
  });
  it("keeps presentation, tile, suitability and unavailable-resolution states distinct", () => {
    const base = ARTWORK_CATALOG[0]!;
    const record = (id: number, presentation: string, imageIsSeamlessTile: boolean): ArtworkCatalogRecord => ({
      ...base,
      assetId: `builtin-met-${id}` as ArtworkCatalogRecord["assetId"],
      technical: { ...base.technical, presentation, imageIsSeamlessTile },
    } as ArtworkCatalogRecord);
    const clean = record(999991, "clean-artwork", true);
    const unknown = record(999992, "unconfirmed", false);
    const unverifiedRights: ArtworkCatalogRecord = {
      ...clean,
      source: { ...clean.source, rightsLabel: "CC BY" as ArtworkCatalogRecord["source"]["rightsLabel"] },
    };
    const assessment = (
      item: ArtworkCatalogRecord,
      level: ArtworkUseAssessment["level"],
      assessedWidthCm: number | null,
      assessedHeightCm: number | null,
      estimatedPxPerCm: number | null,
    ): ArtworkUseAssessment => ({
      assetId: item.assetId, printUse: "panel", level, reason: "Example advisory.",
      assessedWidthCm, assessedHeightCm, estimatedPxPerCm, selectable: true,
    });
    const html = surfaceMarkup({
      style: "Scoop", placements: [], errors: new Map(), preview: "",
      artworkLibrary: {
        query: "", category: "", garmentFamily: "", pieceRoleGroup: "",
        printUseFilter: "", assessmentUse: "panel", selectedPlacementIndex: "",
        actionMessage: "Review the reference.", isOpen: true, totalCount: 2,
        items: [
          { record: clean, assessment: assessment(clean, "recommended", 20, 12, 120) },
          { record: unknown, assessment: assessment(unknown, "needs-review", null, null, null) },
          { record: unknown, assessment: assessment(unknown, "possible", 20, 10, null) },
          { record: unverifiedRights, assessment: assessment(unverifiedRights, "needs-review", null, null, null) },
        ],
      },
    });
    expect(html).toContain("Artwork image");
    expect(html).toContain("Image presentation unconfirmed");
    expect(html).toContain("Verified seamless tile");
    expect(html).toContain("Recommended");
    expect(html).toContain("Resolution estimate unavailable.");
    expect(html).toContain("resolution estimate unavailable.");
    expect(html).toContain("The Met API: isPublicDomain = true");
    expect(html).toContain("CC BY");
  });
  it("keeps the optional catalog collapsed until the user opens it", () => {
    const html = surfaceMarkup({
      style: "Scoop", placements: [], errors: new Map(), preview: "",
      artworkLibrary: {
        query: "", category: "", garmentFamily: "", pieceRoleGroup: "",
        printUseFilter: "", assessmentUse: "placement", selectedPlacementIndex: "",
        actionMessage: "Choose a reference.", isOpen: false, totalCount: ARTWORK_CATALOG.length, items: [],
      },
    });
    expect(html).toContain("Local artwork library");
    expect(html).toContain("Open to browse, search, inspect provenance");
    expect(html).not.toContain('id="surface-library-search"');
    expect(html).not.toContain("data-artwork-card");
  });
  it("states the empty set without a preview", () => {
    const html = surfaceMarkup({ style: "Scoop", placements: [], errors: new Map(), preview: "" });
    expect(html).toContain("No artwork placements on Scoop yet. Add one below.");
    expect(html).toContain('id="surface-preview"');
    expect(html).toContain("data-surface-preview-shell hidden");
    expect(html).toContain('id="surface-add"');
  });
  it("escapes hostile placement text so markup stays valid", () => {
    const html = surfaceMarkup({
      ...data,
      placements: [{ ...data.placements[0], id: 'a"b&<c>', pieceRole: "<front>" }],
    });
    expect(html).toContain("a&quot;b&amp;&lt;c&gt;");
    expect(html).not.toContain("<front>");
  });
  it("falls back gracefully for non-string placement text", () => {
    const html = surfaceMarkup({
      ...data,
      placements: [{
        ...data.placements[0],
        id: 7 as unknown as string,
        kind: 9 as unknown as "print",
        pieceRole: null as unknown as string,
        sourceName: {} as unknown as string,
      }],
    });
    expect(html).toContain('data-surface-index="0"');
    expect(html).toContain('value=""');
  });
  it("renders hostile geometry as explicitly invalid instead of throwing", () => {
    const html = surfaceMarkup({
      ...data,
      placements: [{
        ...data.placements[0],
        widthCm: "big" as unknown as number,
        transform: null as unknown as { dx: number; dy: number; scale: number; rotationDeg: number },
      }],
    });
    expect(html).toContain('value=""');
    expect(html).not.toContain('value="NaN"');
    expect(html).toContain('data-range-state="empty"');
  });
});

describe("nestIntelMarkup — planning controls", () => {
  it("renders buffer, on-hand, nap, readout, and error spots with stable ids", () => {
    const html = nestIntelMarkup("10", "", true);
    expect(html).toContain('id="nest-intel-host"');
    expect(html).toContain('id="nest-buffer"');
    expect(html).toContain('data-guidance-control="nesting-buffer"');
    expect(html).toContain('id="nest-available"');
    expect(html).toContain('data-guidance-control="nesting-available"');
    expect(html).toContain('id="nest-nap"');
    expect(html).toContain('id="nest-readout"');
    expect(html).toContain('id="error-nest-buffer"');
    expect(html).toContain('id="error-nest-available"');
    expect(html).toContain('data-range-min="0"');
    expect(html).toContain('data-range-max="50"');
  });
  it("checks the nap box only when directional", () => {
    expect(nestIntelMarkup("10", "", true)).toContain('id="nest-nap" type="checkbox" checked');
    expect(nestIntelMarkup("10", "", false)).not.toContain("checked");
  });
  it("renders blank raws as empty numeric controls", () => {
    const html = nestIntelMarkup("", "", true);
    expect(html).toContain('id="nest-buffer"');
    expect(html).toContain('id="nest-available"');
    const filled = nestIntelMarkup("10", "150", false);
    expect(filled).toContain('value="150"');
  });
});

describe("nestIntelReadout — planning lines", () => {
  it("reports required, planned, waste, unknown fit, and the nap notice", () => {
    const readout = nestIntelReadout(100, 0.44, "10", "", true, "Single size");
    expect(readout.scope).toBe("Single size · ");
    expect(readout.required).toBe("Requires 100.0 cm of cloth · ");
    expect(readout.planned).toBe("Planned with buffer: 110.0 cm · ");
    expect(readout.waste).toBe("Waste: 56.0% of cloth · ");
    expect(readout.available).toBe("On hand: not entered · ");
    expect(readout.verdict).toContain("unknown");
    expect(readout.nap).toContain("never rotate");
    expect(readout.bufferError).toBe("");
    expect(readout.availableError).toBe("");
  });
  it("names the marker scope and judges fits against plan", () => {
    const readout = nestIntelReadout(200, 0.5, "10", "300", false, "Graded marker");
    expect(readout.scope).toBe("Graded marker · ");
    expect(readout.verdict).toBe("Fit: fits the fabric on hand.");
    expect(readout.nap).toContain("no rotation");
  });
  it("measures shortage and invalid entries without inventing numbers", () => {
    const short = nestIntelReadout(100, 0.5, "10", "100", true, "Single size");
    expect(short.verdict).toBe("Fit: short by 10.0 cm.");
    const badBuffer = nestIntelReadout(100, 0.5, "abc", "100", true, "Single size");
    expect(badBuffer.planned).toContain("unavailable");
    expect(badBuffer.bufferError).toContain("finite");
    expect(badBuffer.verdict).toContain("unknown");
    const badAvailable = nestIntelReadout(100, 0.5, "10", "0", true, "Single size");
    expect(badAvailable.availableError).toContain("above 0");
    const badWaste = nestIntelReadout(100, 2, "10", "", true, "Single size");
    expect(badWaste.waste).toContain("unavailable");
  });
});

