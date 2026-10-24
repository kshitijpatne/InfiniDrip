import { describe, expect, it } from "vitest";
import { BRAND_PROFILE_RECORD_VERSION, type BrandProfileRecord } from "./brand-profile-records";
import { renderBrandProfileEditor, type BrandProfileEditorModel } from "./brand-profile-editor";

const COLOR_ID = "a1111111-1111-4111-8111-000000000001";
const ASSET_ID = "local-11111111111141118111000000000001-png";

const emptyProfile: BrandProfileRecord = {
  schemaVersion: BRAND_PROFILE_RECORD_VERSION,
  colors: [],
  artworkAssetIds: [],
  rules: [],
};

const completeProfile: BrandProfileRecord = {
  schemaVersion: BRAND_PROFILE_RECORD_VERSION,
  colors: [{ id: COLOR_ID, name: "Navy & <ink>", hex: "#112233" }],
  artworkAssetIds: [ASSET_ID],
  rules: [{
    id: "a2222222-2222-4222-8222-000000000002",
    scope: "supplier",
    kind: "supplier-constraint",
    description: "Ask vendor <before> color approval & keep text literal.",
  }],
};

function model(overrides: Partial<BrandProfileEditorModel> = {}): BrandProfileEditorModel {
  return {
    profile: emptyProfile,
    savedColors: [],
    assignments: [],
    missingArtworkIds: [],
    stagedArtworkNames: [],
    selectedColorId: "",
    selectedAssignmentId: "",
    validationError: null,
    applyBlockedReason: null,
    artworkAvailable: true,
    disabled: false,
    dirty: false,
    ...overrides,
  };
}

describe("Brand Profile editor rendering", () => {
  it("renders escaped user-authored values and labels files as staged until explicit save", () => {
    const html = renderBrandProfileEditor(model({
      profile: completeProfile,
      missingArtworkIds: null,
      stagedArtworkNames: ["logo&mark.png"],
      dirty: true,
    }));

    expect(html).toContain("Brand Profile");
    expect(html).toContain("Navy &amp; &lt;ink&gt;");
    expect(html).toContain("Ask vendor &lt;before&gt; color approval &amp; keep text literal.");
    expect(html).toContain("Checking existing artwork references against local storage");
    expect(html).toContain("Checking local storage");
    expect(html).toContain("Staged for the next explicit save: logo&amp;mark.png");
    expect(html).toContain("Guidance stays as text");
    expect(html).toContain("This does not verify physical material");
    expect(html).toContain("data-brand-profile-action=\"save-profile\" disabled");
  });

  it("shows an exact differing field and enables only the selected manual apply action", () => {
    const html = renderBrandProfileEditor(model({
      profile: completeProfile,
      savedColors: completeProfile.colors,
      assignments: [{ id: "assignment-1", label: "Spring · Shell · Cotton", fieldId: "assignment.assignment-1.color", color: null }],
      selectedColorId: COLOR_ID,
      selectedAssignmentId: "assignment-1",
      applyBlockedReason: null,
    }));

    expect(html).toContain("All existing artwork references resolve locally.");
    expect(html).toContain("Stored locally");
    expect(html).toContain("Navy &amp; &lt;ink&gt; (#112233) differs from assignment.assignment-1.color (empty)");
    expect(html).toContain("Apply will update this pending field only.");
    expect(html).toContain("data-brand-profile-action=\"apply-color\">");
    expect(html).toContain("Tech Pack colorway field");
  });

  it("blocks profile and color saves for missing local artwork and disabled storage", () => {
    const html = renderBrandProfileEditor(model({
      profile: completeProfile,
      savedColors: completeProfile.colors,
      assignments: [{ id: "assignment-1", label: "Spring", fieldId: "assignment.assignment-1.color", color: "#FFFFFF" }],
      missingArtworkIds: [ASSET_ID],
      selectedColorId: COLOR_ID,
      selectedAssignmentId: "assignment-1",
      applyBlockedReason: "Resolve or remove missing local artwork references before applying a color.",
      artworkAvailable: false,
      dirty: true,
    }));

    expect(html).toContain("1 artwork reference(s) are missing");
    expect(html).toContain("Missing from local storage");
    expect(html).toContain("Remove missing reference");
    expect(html).toContain("accept=\"image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg\" disabled");
    expect(html).toContain("data-brand-profile-action=\"apply-color\" disabled");
    expect(html).toContain("data-brand-profile-action=\"save-profile\" disabled");
  });

  it("reports an already-matching field and preserves invalid and busy state", () => {
    const html = renderBrandProfileEditor(model({
      profile: completeProfile,
      savedColors: completeProfile.colors,
      assignments: [{ id: "assignment-1", label: "Spring", fieldId: "assignment.assignment-1.color", color: "#112233" }],
      selectedColorId: COLOR_ID,
      selectedAssignmentId: "assignment-1",
      validationError: "brandProfile.colors[0].hex: enter a six-digit hex color.",
      disabled: true,
      dirty: false,
    }));

    expect(html).toContain("Navy &amp; &lt;ink&gt; already matches assignment.assignment-1.color.");
    expect(html).toContain("data-brand-profile-action=\"apply-color\" disabled");
    expect(html).toContain("brandProfile.colors[0].hex: enter a six-digit hex color.");
    expect(html).toContain("data-brand-profile-action=\"discard-profile\" disabled");
  });
});
