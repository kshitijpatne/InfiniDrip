import { describe, expect, it } from "vitest";
import {
  BRAND_PROFILE_RECORD_VERSION,
  parseBrandProfileRecord,
  type BrandProfileRecord,
} from "./brand-profile-records";

const COLOR_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const RULE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const OTHER_ID = "c502163f-10be-4dce-89c9-35de897e9814";
const ASSET_ID = "local-a02b83228f5746bb9d1616ac1fcf6811-png";

function validProfile(): BrandProfileRecord {
  return {
    schemaVersion: BRAND_PROFILE_RECORD_VERSION,
    colors: [{ id: COLOR_ID, name: "Ink", hex: "#2A4B6C" }],
    artworkAssetIds: [ASSET_ID],
    rules: [{ id: RULE_ID, scope: "design", kind: "preference", description: "Use clean lines." }],
  };
}

describe("Brand Profile record contract", () => {
  it("accepts an optional profile with user-authored colors, local assets and bounded guidance", () => {
    const input = validProfile();
    const result = parseBrandProfileRecord(input);
    expect(result).toEqual({ ok: true, value: input });
    expect(result.ok && result.value).toBe(input);
  });

  it("accepts an empty profile and does not require user-authored entries", () => {
    expect(parseBrandProfileRecord({ schemaVersion: 1, colors: [], artworkAssetIds: [], rules: [] }))
      .toMatchObject({ ok: true });
  });

  it.each([null, [], "profile", 2])("rejects a non-object profile (%s)", (input) => {
    expect(parseBrandProfileRecord(input)).toEqual({ ok: false, error: "brandProfile: expected an object." });
  });

  it.each([
    { schemaVersion: 1, colors: [], artworkAssetIds: [] },
    { schemaVersion: 1, colors: [], artworkAssetIds: [], rules: [], extra: true },
    { schemaVersion: 1, colors: [], artworkAssetIds: [], items: [] },
  ])("rejects incomplete and unknown profile fields", (input) => {
    expect(parseBrandProfileRecord(input)).toEqual({ ok: false, error: "brandProfile: fields are incomplete or unknown." });
  });

  it("rejects an unsupported schema version", () => {
    expect(parseBrandProfileRecord({ ...validProfile(), schemaVersion: 2 })).toEqual({
      ok: false,
      error: "brandProfile.schemaVersion: expected 1.",
    });
  });

  it.each([
    { colors: null, artworkAssetIds: [], rules: [] },
    { colors: [], artworkAssetIds: "asset", rules: [] },
    { colors: [], artworkAssetIds: [], rules: null },
  ])("requires lists for each optional collection", (fields) => {
    expect(parseBrandProfileRecord({ schemaVersion: 1, ...fields })).toMatchObject({ ok: false });
  });

  it.each([
    null,
    "color",
    { id: COLOR_ID, name: "Ink", hex: "#2A4B6C", extra: true },
    { id: COLOR_ID, name: "Ink", shade: "#2A4B6C" },
  ])(
    "rejects malformed color records (%s)",
    (color) => {
      expect(parseBrandProfileRecord({ ...validProfile(), colors: [color] })).toMatchObject({ ok: false });
    },
  );

  it.each([
    { id: "bad-id", name: "Ink", hex: "#2A4B6C" },
    { id: null, name: "Ink", hex: "#2A4B6C" },
    { id: COLOR_ID, name: "  ", hex: "#2A4B6C" },
    { id: COLOR_ID, name: 8, hex: "#2A4B6C" },
    { id: COLOR_ID, name: "Ink", hex: "blue" },
    { id: COLOR_ID, name: "Ink", hex: 12 },
  ])("gives a field-specific correction for invalid color values", (color) => {
    const result = parseBrandProfileRecord({ ...validProfile(), colors: [color] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^brandProfile\.colors\[0\]\./);
  });

  it("rejects duplicate color IDs", () => {
    const color = { id: COLOR_ID, name: "Ink", hex: "#2A4B6C" };
    expect(parseBrandProfileRecord({ ...validProfile(), colors: [color, { ...color, name: "Other" }] })).toEqual({
      ok: false,
      error: "brandProfile.colors[1].id: duplicate color ID.",
    });
  });

  it.each(["missing", "local-invalid-png", 4])("rejects a non-local artwork reference (%s)", (assetId) => {
    expect(parseBrandProfileRecord({ ...validProfile(), artworkAssetIds: [assetId] })).toMatchObject({ ok: false });
  });

  it("rejects duplicate artwork references", () => {
    expect(parseBrandProfileRecord({ ...validProfile(), artworkAssetIds: [ASSET_ID, ASSET_ID] })).toEqual({
      ok: false,
      error: "brandProfile.artworkAssetIds[1]: duplicate artwork asset ID.",
    });
  });

  it.each([
    null,
    "rule",
    { id: RULE_ID, scope: "design", kind: "preference", description: "x", extra: true },
    { id: RULE_ID, scope: "design", type: "preference", description: "x" },
  ])(
    "rejects malformed rule records (%s)",
    (rule) => {
      expect(parseBrandProfileRecord({ ...validProfile(), rules: [rule] })).toMatchObject({ ok: false });
    },
  );

  it.each([
    { id: "bad-id", scope: "design", kind: "preference", description: "Use cotton." },
    { id: null, scope: "design", kind: "preference", description: "Use cotton." },
    { id: RULE_ID, scope: "other", kind: "preference", description: "Use cotton." },
    { id: RULE_ID, scope: "design", kind: "unknown", description: "Use cotton." },
    { id: RULE_ID, scope: "design", kind: "preference", description: "   " },
    { id: RULE_ID, scope: "design", kind: "preference", description: 9 },
  ])("gives a field-specific correction for invalid guidance", (rule) => {
    const result = parseBrandProfileRecord({ ...validProfile(), rules: [rule] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^brandProfile\.rules\[0\]/);
  });

  it.each([
    { id: RULE_ID, scope: "supplier", kind: "preference", description: "Supplier must certify." },
    { id: RULE_ID, scope: "materials", kind: "supplier-constraint", description: "MOQ applies." },
  ])("rejects incompatible guidance kind and scope", (rule) => {
    expect(parseBrandProfileRecord({ ...validProfile(), rules: [rule] })).toMatchObject({ ok: false });
  });

  it("accepts blocks and locally user-entered supplier constraints without executing them", () => {
    const profile = {
      ...validProfile(),
      rules: [
        { id: RULE_ID, scope: "materials", kind: "block", description: "Avoid animal leather." },
        { id: OTHER_ID, scope: "supplier", kind: "supplier-constraint", description: "User-entered minimum order note." },
      ],
    };
    expect(parseBrandProfileRecord(profile)).toEqual({ ok: true, value: profile });
  });

  it("rejects duplicate guidance IDs", () => {
    const rule = { id: RULE_ID, scope: "design", kind: "preference", description: "Use clean lines." };
    expect(parseBrandProfileRecord({ ...validProfile(), rules: [rule, { ...rule, description: "Use muted color." }] })).toEqual({
      ok: false,
      error: "brandProfile.rules[1].id: duplicate rule ID.",
    });
  });
});
