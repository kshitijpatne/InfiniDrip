/** S772 state summary; it reports provenance without asserting construction correctness. */
import {
  TECH_PACK_OPERATION_FACT_IDS,
  type TechPackOperation,
  type TechPackOperationFactId,
  type TechPackOperationRecordSet,
  type TechPackOperationSourcedValue,
} from "./tech-pack-operation-records";

export type TechPackOperationFindingStatus =
  | "ABSENT"
  | "UNRESOLVED"
  | "CONFLICT"
  | "RECIPE_DEFAULT"
  | "ESTIMATE"
  | "USER_DECISION"
  | "SOURCE_CONFIRMED";

export interface TechPackOperationFinding {
  readonly operationId: string | null;
  readonly path: string;
  readonly status: TechPackOperationFindingStatus;
  readonly message: string;
  readonly nextAction: string;
}

export interface TechPackOperationValidation {
  readonly findings: readonly TechPackOperationFinding[];
  readonly counts: Readonly<Record<TechPackOperationFindingStatus, number>>;
}

function emptyCounts(): Record<TechPackOperationFindingStatus, number> {
  return {
    ABSENT: 0,
    UNRESOLVED: 0,
    CONFLICT: 0,
    RECIPE_DEFAULT: 0,
    ESTIMATE: 0,
    USER_DECISION: 0,
    SOURCE_CONFIRMED: 0,
  };
}

function valueFinding(
  operation: TechPackOperation,
  path: string,
  value: TechPackOperationSourcedValue<unknown>,
): TechPackOperationFinding {
  if (value.status === "SOURCE_CONFIRMED") return {
    operationId: operation.id,
    path,
    status: "SOURCE_CONFIRMED",
    message: "Source-confirmed value with a recorded source reference.",
    nextAction: "Keep the source reference intact; component and seam inventory reconciliation is checked in S773.",
  };
  if (value.status === "UNRESOLVED") return {
    operationId: operation.id,
    path,
    status: "UNRESOLVED",
    message: value.unresolvedReason,
    nextAction: value.nextAction,
  };
  if (value.status === "CONFLICT") return {
    operationId: operation.id,
    path,
    status: "CONFLICT",
    message: value.unresolvedReason,
    nextAction: value.nextAction,
  };
  if (value.status === "RECIPE_DEFAULT") return {
    operationId: operation.id,
    path,
    status: "RECIPE_DEFAULT",
    message: `In-app recipe default (${value.recipeVersionMarker}); it is not source-confirmed construction evidence.`,
    nextAction: "Confirm this value from an approved source or keep it visibly labeled as a recipe default.",
  };
  if (value.status === "ESTIMATE") return {
    operationId: operation.id,
    path,
    status: "ESTIMATE",
    message: `Estimate by ${value.method}; assumptions: ${value.assumptions}`,
    nextAction: "Add an approved source or retain the method and assumptions with the estimate label.",
  };
  return {
    operationId: operation.id,
    path,
    status: "USER_DECISION",
    message: `User decision: ${value.rationale}`,
    nextAction: "Add an approved source or retain the rationale with the user-decision label.",
  };
}

function absentFinding(operationId: string | null, path: string, detail: string): TechPackOperationFinding {
  return {
    operationId,
    path,
    status: "ABSENT",
    message: detail,
    nextAction: "Decide whether this item applies; if it does, record a source-backed value, an explicit unknown, or a clearly labeled non-source value.",
  };
}

function addFinding(
  findings: TechPackOperationFinding[],
  counts: Record<TechPackOperationFindingStatus, number>,
  finding: TechPackOperationFinding,
): void {
  findings.push(finding);
  counts[finding.status] += 1;
}

export function evaluateTechPackOperationRecordSet(
  record: TechPackOperationRecordSet | null,
): TechPackOperationValidation {
  const findings: TechPackOperationFinding[] = [];
  const counts = emptyCounts();
  if (!record || record.operations.length === 0) {
    addFinding(findings, counts, absentFinding(null, "operations", "No construction operations are recorded."));
    return { findings, counts };
  }
  for (const operation of record.operations) {
    addFinding(findings, counts, valueFinding(operation, "name", operation.name));
    addFinding(findings, counts, valueFinding(operation, "sequence", operation.sequence));
    addFinding(findings, counts, valueFinding(operation, "componentRefs", operation.componentRefs));
    addFinding(findings, counts, valueFinding(operation, "seamRefs", operation.seamRefs));
    const factIds = new Set<TechPackOperationFactId>();
    for (const fact of operation.facts) {
      factIds.add(fact.factId);
      addFinding(findings, counts, valueFinding(operation, `facts.${fact.factId}`, fact.value));
    }
    for (const factId of TECH_PACK_OPERATION_FACT_IDS) {
      if (!factIds.has(factId)) {
        addFinding(findings, counts, absentFinding(operation.id, `facts.${factId}`, `No ${factId} value is recorded.`));
      }
    }
  }
  return { findings, counts };
}
