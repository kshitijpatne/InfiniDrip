/** Strict recipe-scoped source record for digital Jeans POMs. */
import { JEANS_POM_DEFINITIONS, JEANS_SIZES } from "../drafting/jeans-tables";
import {
  parseTechPackPomDefinitionSet,
  TECH_PACK_POM_RECORD_VERSION,
  type TechPackPomDefinitionSet,
  type TechPackPomSourcedValue,
  type TechPackPomSourceReference,
} from "./tech-pack-pom-records";
import type { RecordResult } from "./project-records";

function confirmed<T>(value: T, source: TechPackPomSourceReference): TechPackPomSourcedValue<T> {
  return { status: "SOURCE_CONFIRMED", value, source };
}

function unresolved(reason: string, nextAction: string): TechPackPomSourcedValue<never> {
  return { status: "UNRESOLVED", value: null, unresolvedReason: reason, nextAction };
}

function patternSource(locator: string): TechPackPomSourceReference {
  return { uri: "src/drafting/jeans-tables.ts", title: "Jeans digital POM catalog", locator };
}

/**
 * Parse the authored Jeans definitions through the same strict T02 contract
 * used for persisted recipe templates. Source-confirmed facts describe the
 * digital pattern only; physical tolerances remain unresolved.
 */
export function parseJeansT02PomDefinitions(): RecordResult<TechPackPomDefinitionSet> {
  const candidate = {
    schemaVersion: TECH_PACK_POM_RECORD_VERSION,
    recipeId: "jeans",
    definitions: JEANS_POM_DEFINITIONS.map((definition) => ({
      id: definition.id,
      label: definition.label,
      method: confirmed({ kind: definition.methodKind, instructions: definition.instructions },
        patternSource(`${definition.sourceLocator} / method`)),
      landmarks: confirmed(definition.landmarks,
        patternSource(`${definition.sourceLocator} / landmarks`)),
      unit: "cm",
      tolerance: unresolved(
        "No physically sewn and validated InfiniDrip Jeans sample or approved factory tolerance establishes a production tolerance.",
        "Sew and measure an approved sample, then record a reviewed tolerance for each POM.",
      ),
      sizeRangeSource: confirmed({
        rangeLabel: "XS–XL digital redraft",
        sizeIds: JEANS_SIZES.map(({ label }) => label),
        baseSizeId: JEANS_SIZES.find(({ step }) => step === 0)!.label,
      }, {
        uri: "src/drafting/trouser-tables.ts",
        title: "Shared lower-body size steps",
        locator: "TROUSER_SIZES aliases TSHIRT_SIZES; ordered XS, S, M, L, XL with M at step 0",
      }),
      gradeRuleSource: confirmed({ ruleId: "lower-body.trouser-grade", version: "1" }, {
        uri: "src/drafting/trouser-tables.ts",
        title: "Shared lower-body grade rule",
        locator: "TROUSER_GRADE waist, hip, hipDepth, crotchDepth, thigh, knee, and inseam increments",
      }),
    })),
  };
  return parseTechPackPomDefinitionSet(candidate);
}
