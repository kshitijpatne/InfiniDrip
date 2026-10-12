export type FeatureFlagAudience = "none" | "internal" | "explicit-testers" | "public";
export type FeatureFlagRollout = "embedded" | "readiness-only";
export type FeatureFlagFallback = "none" | "compatible-v1";
export type FeatureFlagStatus = "enabled" | "disabled" | "unknown" | "stale" | "unavailable";
export type FeatureFlagSource = "embedded-default" | "local-override" | "diagnostic";

export interface FeatureFlagDefinition {
  readonly key: string;
  readonly owner: string;
  readonly audience: FeatureFlagAudience;
  readonly defaultValue: boolean;
  readonly expiresOn: string;
  readonly removalRelease: string;
  readonly rollout: FeatureFlagRollout;
  readonly fallback: FeatureFlagFallback;
  readonly onBehavior: string;
  readonly offBehavior: string;
}

export interface FeatureFlagResolution {
  readonly key: string;
  readonly enabled: boolean;
  readonly status: FeatureFlagStatus;
  readonly source: FeatureFlagSource;
  readonly diagnostic: string;
  readonly definition: FeatureFlagDefinition | null;
}

/**
 * The catalog is deliberately small. `polo_v2` is a readiness record only:
 * the former V1 renderer was replaced in place, so no local kill switch may
 * imply that a compatible rollback exists.
 */
export const FEATURE_FLAGS = Object.freeze({
  uiq_foundation: Object.freeze({
    key: "uiq_foundation",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-11",
    removalRelease: "UIQ visual-foundation adoption/cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Use the scoped native foundation on active guided-tour panels and the storage warning.",
    offBehavior: "Keep the existing guided-tour markup and legacy panel styling.",
  } satisfies FeatureFlagDefinition),
  uiq_welcome: Object.freeze({
    key: "uiq_welcome",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-12",
    removalRelease: "UIQ-07 welcome-visual cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Compose the accepted native welcome visual around the existing first-run tutorial welcome only.",
    offBehavior: "Keep the current tutorial welcome presentation and all existing tutorial behavior.",
  } satisfies FeatureFlagDefinition),
  uiq_inspection_toolbar: Object.freeze({
    key: "uiq_inspection_toolbar",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-13",
    removalRelease: "UIQ-08 inspection-toolbar cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Use the solid, opaque native grouping on the existing inspection toolbar without changing its controls.",
    offBehavior: "Keep the exact existing inspection-toolbar markup and appearance.",
  } satisfies FeatureFlagDefinition),
  uiq_guidance: Object.freeze({
    key: "uiq_guidance",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-11",
    removalRelease: "UIQ clarity adoption/cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Show the accepted native guidance and journey summary inside Design readiness.",
    offBehavior: "Keep the existing Design readiness checklist and all current journey behavior.",
  } satisfies FeatureFlagDefinition),
  uiq_material: Object.freeze({
    key: "uiq_material",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-11",
    removalRelease: "UIQ material clarity adoption/cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Show the accepted read-only material behavior and screen-appearance panel beside existing controls.",
    offBehavior: "Keep the existing material and appearance controls with no added disclosure.",
  } satisfies FeatureFlagDefinition),
  uiq_artwork: Object.freeze({
    key: "uiq_artwork",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-12",
    removalRelease: "UIQ artwork-presentation adoption/cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Apply the accepted native artwork presentation styling to the existing local Surface catalog and app-owned controls.",
    offBehavior: "Keep the exact existing local Surface catalog presentation and behavior.",
  } satisfies FeatureFlagDefinition),
  uiq_operational_clarity: Object.freeze({
    key: "uiq_operational_clarity",
    owner: "Codex",
    audience: "public",
    defaultValue: true,
    expiresOn: "2027-01-12",
    removalRelease: "UIQ-06 operational-clarity cleanup; no later than expiry",
    rollout: "embedded",
    fallback: "compatible-v1",
    onBehavior: "Show the bounded, scannable Nesting operational readout using the existing computed values.",
    offBehavior: "Keep the exact current Nesting readout markup, wording, and behavior.",
  } satisfies FeatureFlagDefinition),
  polo_v2: Object.freeze({
    key: "polo_v2",
    owner: "Codex",
    audience: "none",
    defaultValue: false,
    expiresOn: "2027-09-21",
    removalRelease: "Launch-backed Polo rollout packet",
    rollout: "readiness-only",
    fallback: "none",
    onBehavior: "Reserved until a compatible Polo V1 fallback is admitted.",
    offBehavior: "Keep the canonical Polo path; do not pretend this is a V1 rollback.",
  } satisfies FeatureFlagDefinition),
});

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/** Resolve a catalog key without adding a network, provider or persistence path. */
export function evaluateFeatureFlag(
  key: string,
  now: Date = new Date(),
  localOverride?: boolean,
): FeatureFlagResolution {
  const definition = (FEATURE_FLAGS as Record<string, FeatureFlagDefinition | undefined>)[key];
  if (!definition) {
    return {
      key,
      enabled: false,
      status: "unknown",
      source: "diagnostic",
      diagnostic: `Unknown feature flag: ${key}. The safe result is disabled.`,
      definition: null,
    };
  }
  return evaluateFeatureFlagDefinition(definition, now, localOverride);
}

/** Evaluate a typed definition; exported for deterministic local contract tests. */
export function evaluateFeatureFlagDefinition(
  definition: FeatureFlagDefinition,
  now: Date = new Date(),
  localOverride?: boolean,
): FeatureFlagResolution {
  if (isStale(definition.expiresOn, now)) {
    return {
      key: definition.key,
      enabled: false,
      status: "stale",
      source: "diagnostic",
      diagnostic: `Feature flag ${definition.key} is stale; the safe result is disabled.`,
      definition,
    };
  }
  if (definition.rollout === "readiness-only") {
    return {
      key: definition.key,
      enabled: false,
      status: "unavailable",
      source: "diagnostic",
      diagnostic: `${definition.key} is readiness-only; fallback availability is ${definition.fallback}.`,
      definition,
    };
  }

  const enabled = localOverride ?? definition.defaultValue;
  return {
    key: definition.key,
    enabled,
    status: enabled ? "enabled" : "disabled",
    source: localOverride === undefined ? "embedded-default" : "local-override",
    diagnostic: enabled ? definition.onBehavior : definition.offBehavior,
    definition,
  };
}

function isStale(expiresOn: string, now: Date): boolean {
  const expiry = Date.parse(`${expiresOn}T23:59:59.999Z`);
  return !Number.isFinite(expiry) || now.getTime() > expiry;
}
