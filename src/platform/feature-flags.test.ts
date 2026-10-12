import { describe, expect, it } from "vitest";
import {
  evaluateFeatureFlag,
  evaluateFeatureFlagDefinition,
  FEATURE_FLAGS,
  FeatureFlagDefinition,
} from "./feature-flags";

const CURRENT = new Date("2026-09-22T12:00:00.000Z");
const ACTIVE_FLAG: FeatureFlagDefinition = {
  key: "local-example",
  owner: "test",
  audience: "internal",
  defaultValue: false,
  expiresOn: "2027-09-21",
  removalRelease: "test cleanup",
  rollout: "embedded",
  fallback: "compatible-v1",
  onBehavior: "Use the local behavior.",
  offBehavior: "Use the safe behavior.",
};

describe("embedded feature-flag contract", () => {
  it("enables the bounded UIQ foundation by default and retains the tour fallback", () => {
    expect(FEATURE_FLAGS.uiq_foundation).toMatchObject({
      key: "uiq_foundation",
      owner: "Codex",
      audience: "public",
      defaultValue: true,
      expiresOn: "2027-01-11",
      rollout: "embedded",
      fallback: "compatible-v1",
    });
    expect(evaluateFeatureFlag("uiq_foundation", CURRENT)).toMatchObject({
      enabled: true,
      status: "enabled",
      source: "embedded-default",
      diagnostic: FEATURE_FLAGS.uiq_foundation.onBehavior,
    });
    expect(evaluateFeatureFlag("uiq_foundation", CURRENT, false)).toMatchObject({
      enabled: false,
      status: "disabled",
      source: "local-override",
      diagnostic: FEATURE_FLAGS.uiq_foundation.offBehavior,
    });
  });

  it("enables UIQ guidance by default and preserves the readiness checklist fallback", () => {
    expect(FEATURE_FLAGS.uiq_guidance).toMatchObject({
      key: "uiq_guidance",
      owner: "Codex",
      audience: "public",
      defaultValue: true,
      expiresOn: "2027-01-11",
      rollout: "embedded",
      fallback: "compatible-v1",
    });
    expect(evaluateFeatureFlag("uiq_guidance", CURRENT)).toMatchObject({
      enabled: true,
      status: "enabled",
      source: "embedded-default",
      diagnostic: FEATURE_FLAGS.uiq_guidance.onBehavior,
    });
    expect(evaluateFeatureFlag("uiq_guidance", CURRENT, false)).toMatchObject({
      enabled: false,
      status: "disabled",
      source: "local-override",
      diagnostic: FEATURE_FLAGS.uiq_guidance.offBehavior,
    });
    expect(evaluateFeatureFlag("uiq_guidance", new Date("2027-01-12T00:00:00.000Z"), true))
      .toMatchObject({ enabled: false, status: "stale", source: "diagnostic" });
  });

  it("enables UIQ material clarity by default and preserves the exact legacy controls fallback", () => {
    expect(FEATURE_FLAGS.uiq_material).toMatchObject({
      key: "uiq_material",
      owner: "Codex",
      audience: "public",
      defaultValue: true,
      expiresOn: "2027-01-11",
      removalRelease: "UIQ material clarity adoption/cleanup; no later than expiry",
      rollout: "embedded",
      fallback: "compatible-v1",
      offBehavior: "Keep the existing material and appearance controls with no added disclosure.",
    });
    expect(evaluateFeatureFlag("uiq_material", CURRENT)).toMatchObject({
      enabled: true,
      status: "enabled",
      source: "embedded-default",
      diagnostic: FEATURE_FLAGS.uiq_material.onBehavior,
    });
    expect(evaluateFeatureFlag("uiq_material", CURRENT, false)).toMatchObject({
      enabled: false,
      status: "disabled",
      source: "local-override",
      diagnostic: FEATURE_FLAGS.uiq_material.offBehavior,
    });
    expect(evaluateFeatureFlag("uiq_material", new Date("2027-01-12T00:00:00.000Z"), true))
      .toMatchObject({ enabled: false, status: "stale", source: "diagnostic" });
    expect(evaluateFeatureFlag("unknown-uiq-material", CURRENT))
      .toMatchObject({ enabled: false, status: "unknown", source: "diagnostic" });
  });

  it("enables the bounded artwork presentation and retains the existing library fallback", () => {
    expect(FEATURE_FLAGS.uiq_artwork).toMatchObject({
      key: "uiq_artwork",
      owner: "Codex",
      audience: "public",
      defaultValue: true,
      expiresOn: "2027-01-12",
      rollout: "embedded",
      fallback: "compatible-v1",
      offBehavior: "Keep the exact existing local Surface catalog presentation and behavior.",
    });
    expect(evaluateFeatureFlag("uiq_artwork", CURRENT)).toMatchObject({
      enabled: true,
      status: "enabled",
      source: "embedded-default",
      diagnostic: FEATURE_FLAGS.uiq_artwork.onBehavior,
    });
    expect(evaluateFeatureFlag("uiq_artwork", CURRENT, false)).toMatchObject({
      enabled: false,
      status: "disabled",
      source: "local-override",
      diagnostic: FEATURE_FLAGS.uiq_artwork.offBehavior,
    });
    expect(evaluateFeatureFlag("uiq_artwork", new Date("2027-01-13T00:00:00.000Z"), true))
      .toMatchObject({ enabled: false, status: "stale", source: "diagnostic" });
    expect(evaluateFeatureFlag("unknown-uiq-artwork", CURRENT))
      .toMatchObject({ enabled: false, status: "unknown", source: "diagnostic" });
  });

  it("records Polo V2 as readiness-only because no V1 fallback exists", () => {
    const result = evaluateFeatureFlag("polo_v2", CURRENT, true);

    expect(FEATURE_FLAGS.polo_v2).toMatchObject({
      key: "polo_v2",
      defaultValue: false,
      rollout: "readiness-only",
      fallback: "none",
      audience: "none",
    });
    expect(result).toMatchObject({
      enabled: false,
      status: "unavailable",
      source: "diagnostic",
    });
    expect(result.diagnostic).toContain("fallback availability is none");
  });

  it("disables unknown flags and reports the key", () => {
    const result = evaluateFeatureFlag("not-in-catalog", CURRENT);

    expect(result).toMatchObject({
      key: "not-in-catalog",
      enabled: false,
      status: "unknown",
      source: "diagnostic",
      definition: null,
    });
    expect(result.diagnostic).toContain("not-in-catalog");
  });

  it("disables stale definitions, including malformed expiry metadata", () => {
    const expired = evaluateFeatureFlagDefinition(
      { ...ACTIVE_FLAG, expiresOn: "2026-01-01" },
      CURRENT,
      true,
    );
    const malformed = evaluateFeatureFlagDefinition(
      { ...ACTIVE_FLAG, expiresOn: "not-a-date" },
      CURRENT,
    );

    expect(expired).toMatchObject({ enabled: false, status: "stale", source: "diagnostic" });
    expect(malformed).toMatchObject({ enabled: false, status: "stale", source: "diagnostic" });
  });

  it("uses an embedded safe default for an active definition", () => {
    const result = evaluateFeatureFlagDefinition(ACTIVE_FLAG, CURRENT);

    expect(result).toMatchObject({
      enabled: false,
      status: "disabled",
      source: "embedded-default",
      diagnostic: ACTIVE_FLAG.offBehavior,
    });
  });

  it("supports an explicit local override for deterministic testing", () => {
    const enabled = evaluateFeatureFlagDefinition(ACTIVE_FLAG, CURRENT, true);
    const disabled = evaluateFeatureFlagDefinition(ACTIVE_FLAG, CURRENT, false);

    expect(enabled).toMatchObject({ enabled: true, status: "enabled", source: "local-override" });
    expect(enabled.diagnostic).toBe(ACTIVE_FLAG.onBehavior);
    expect(disabled).toMatchObject({ enabled: false, status: "disabled", source: "local-override" });
  });

  it("accepts a definition through its expiry day", () => {
    const result = evaluateFeatureFlagDefinition(
      ACTIVE_FLAG,
      new Date("2027-09-21T23:59:59.999Z"),
    );

    expect(result.status).toBe("disabled");
    expect(result.source).toBe("embedded-default");
  });
});
