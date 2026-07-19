import { describe, it, expect } from "vitest";
import { STANDARD_M, GARMENTS, TSHIRT_SIZES } from "../drafting";
import { garmentToggleMarkup, dartControlsMarkup, exportButtonsMarkup } from "./view";
import { DEFAULT_FABRIC, BLUEPRINT } from "../render";
import { matchStyle, styleNames } from "../style";
import { controlsMarkup, appShellMarkup, guidanceMarkup, styleMarkup, fabricSwatchesMarkup, specTableMarkup, viewToggleMarkup, fabricWidthMarkup, checkMarkup, editorHintMarkup } from "./view";
import { buildReport, present } from "../guidance";

describe("controlsMarkup", () => {
  it("renders an input for every measurement, showing its value", () => {
    const html = controlsMarkup(STANDARD_M);
    expect(html).toContain('data-field="chest"');
    expect(html).toContain('value="100"'); // STANDARD_M.chest
    expect(html).toContain('data-field="ease"');
  });
});

describe("fabricSwatchesMarkup", () => {
  it("renders a clickable swatch per fabric and highlights the current one", () => {
    const html = fabricSwatchesMarkup(DEFAULT_FABRIC);
    expect(html).toContain(`data-fabric="${DEFAULT_FABRIC}"`);
    expect(html).toContain("outline:2px solid"); // the current swatch is ringed
  });
});

describe("appShellMarkup", () => {
  it("includes the controls, canvas, garment, guidance, and style hosts", () => {
    const html = appShellMarkup(STANDARD_M, DEFAULT_FABRIC, TSHIRT_SIZES);
    expect(html).toContain('id="canvas-host"');
    expect(html).toContain('id="export-size"');
    expect(html).toContain('id="garment-host"');
    expect(html).toContain('id="guidance-host"');
    expect(html).toContain('id="style-host"');
    expect(html).toContain('id="fabric-width"');
  });
});

describe("viewToggleMarkup", () => {
  it("offers a Nesting view and highlights the active one", () => {
    const html = viewToggleMarkup("fabric");
    expect(html).toContain('id="view-fabric"');
    expect(html).toContain(">Nesting<");
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

describe("editorHintMarkup", () => {
  it("explains the override and offers a Reset button", () => {
    const html = editorHintMarkup();
    expect(html).toContain('id="editor-reset"');
    expect(html).toContain("manual override");
  });
});

describe("checkMarkup", () => {
  it("shows a ready banner and a tick when every check passes", () => {
    const html = checkMarkup(buildReport([present("Seam", true, "agree")]));
    expect(html).toContain("Ready to cut");
    expect(html).toContain("✓");
    expect(html).toContain("Seam");
    expect(html).toContain("agree");
  });

  it("shows a not-ready banner and a cross when a check fails", () => {
    const html = checkMarkup(buildReport([present("Seam", false, "off by 3 cm")]));
    expect(html).toContain("Not ready");
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
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee"), styleNames());
    expect(html).toContain('id="style-target"');
    expect(html).toContain("Oversized tee"); // an option
    expect(html).toContain("Target fit");
  });

  it("confirms when you already match the chosen target", () => {
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee"), styleNames());
    expect(html).toContain("You're making a Classic tee");
  });

  it("shows the gap to a target you are not yet in", () => {
    const html = styleMarkup("Oversized tee", matchStyle(STANDARD_M, "Oversized tee"), styleNames());
    expect(html).toContain("To reach Oversized tee");
    expect(html).toContain("Ease +9 cm");
  });

  it("shows a negative delta without a plus sign", () => {
    const html = styleMarkup("Crop tee", matchStyle(STANDARD_M, "Crop tee"), styleNames());
    expect(html).toContain("Length -13 cm");
  });
});

describe("garmentToggleMarkup", () => {
  it("renders a button for every registered garment, highlighting the active one", () => {
    const html = garmentToggleMarkup("fitted");
    for (const g of GARMENTS) {
      expect(html).toContain(`id="garment-${g.name}"`);
      expect(html).toContain(`>${g.label}<`);
    }
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

