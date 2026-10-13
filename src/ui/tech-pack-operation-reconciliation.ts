/** Code-derived T03 component/seam inventory and read-only T01/T03 reconciliation. */
import type { Block } from "../drafting/block";
import type { GarmentRecipe } from "../drafting/recipe";
import type { InterfaceRef, Stitch } from "../drafting/stitch";
import type { GarmentOptions, Measurements } from "../drafting";
import type { TechPackOperationRecordSet, TechPackOperationSourcedValue } from "./tech-pack-operation-records";
import type { TechPackBomRow, TechPackRecord } from "./tech-pack-records";

export type TechPackReferenceFindingStatus =
  | "MATCHED"
  | "MISSING"
  | "UNRESOLVED"
  | "CONFLICT"
  | "INVALID"
  | "UNKNOWN"
  | "UNSUPPORTED"
  | "DRAFT_ERROR";

export interface TechPackReferenceFinding {
  readonly code: string;
  readonly status: TechPackReferenceFindingStatus;
  readonly path: string;
  readonly message: string;
  readonly nextAction: string;
}

export interface TechPackPatternComponent {
  /** Stable lowercase reference used by new T03 records. */
  readonly id: string;
  /** Exact Block.roles key, retained as the underlying pattern identity. */
  readonly role: string;
  readonly pieceName: string;
  readonly valid: boolean;
}

export interface TechPackPatternSeam {
  /** Label plus deterministic digest of the complete ordered edge/mark topology. */
  readonly id: string;
  readonly label: string;
  readonly topology: string;
  readonly valid: boolean;
}

export interface TechPackPatternInventory {
  readonly recipeId: string;
  readonly available: boolean;
  readonly components: readonly TechPackPatternComponent[];
  readonly seams: readonly TechPackPatternSeam[];
  readonly findings: readonly TechPackReferenceFinding[];
}

export interface TechPackReferenceReconciliation {
  readonly inventory: TechPackPatternInventory;
  readonly findings: readonly TechPackReferenceFinding[];
}

const STABLE_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;

function stableSlug(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function topologyRef(ref: unknown): readonly unknown[] {
  if (!isRecord(ref)) return ["invalid"];
  if ("edge" in ref) return ["edge", ref.piece ?? null, ref.edge ?? null, Boolean(ref.reversed)];
  if ("mark" in ref) return ["mark", ref.piece ?? null, ref.mark ?? null, ref.side ?? null];
  return ["invalid", ref.piece ?? null];
}

function topologyText(ref: unknown): string {
  if (!isRecord(ref) || typeof ref.piece !== "string") return "invalid reference";
  if (typeof ref.edge === "string") return `${ref.piece}.${ref.edge}${ref.reversed ? " (reversed)" : ""}`;
  if (typeof ref.mark === "string") return `${ref.piece}.${ref.mark} (${String(ref.side ?? "side unknown")})`;
  return `${ref.piece}.invalid reference`;
}

function stitchTopology(stitch: unknown): { readonly signature: string; readonly text: string; readonly valid: boolean } {
  if (!isRecord(stitch)) return { signature: JSON.stringify(["invalid"]), text: "invalid stitch", valid: false };
  const sides = [stitch.a, stitch.b];
  const sideRefs = sides.map((side) => isRecord(side) && Array.isArray(side.edges) ? side.edges : []);
  const validSides = sides.every((side, index) => isRecord(side) && Array.isArray(side.edges) && sideRefs[index]!.length > 0);
  const validRefs = sideRefs.every((refs) => refs.every((ref) => isRecord(ref)
    && typeof ref.piece === "string"
    && ((typeof ref.edge === "string" && !("mark" in ref))
      || (typeof ref.mark === "string" && (ref.side === "left" || ref.side === "right") && !("edge" in ref)))));
  const signature = JSON.stringify(sideRefs.map((refs) => refs.map(topologyRef)));
  const text = `A: ${sideRefs[0]!.map(topologyText).join(" + ")} ↔ B: ${sideRefs[1]!.map(topologyText).join(" + ")}`;
  return { signature, text, valid: validSides && validRefs };
}

function topologyTargetsExist(block: Block, stitch: Stitch): boolean {
  for (const side of [stitch.a, stitch.b]) {
    for (const ref of side.edges) {
      const piece = block.roles[ref.piece];
      if (!piece || !isRecord(piece) || !Array.isArray(piece.edges)) return false;
      if ("edge" in ref) {
        if (!piece.edges.some((edge) => edge.name === ref.edge)) return false;
      } else if (!Array.isArray(piece.marks) || !piece.marks.some((mark) => isRecord(mark) && mark.name === ref.mark)) return false;
    }
  }
  return true;
}

function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function finding(
  code: string,
  status: TechPackReferenceFindingStatus,
  path: string,
  message: string,
  nextAction: string,
): TechPackReferenceFinding {
  return { code, status, path, message, nextAction };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unusableInventory(recipeId: string, status: "UNSUPPORTED" | "DRAFT_ERROR", message: string): TechPackPatternInventory {
  return {
    recipeId,
    available: false,
    components: [],
    seams: [],
    findings: [finding(
      "PATTERN_UNAVAILABLE",
      status,
      "pattern",
      message,
      status === "UNSUPPORTED"
        ? "Select a supported saved recipe before reconciling its pattern references."
        : "Correct the saved design inputs or recipe draft, then refresh the pattern inventory.",
    )],
  };
}

/** Drafts the selected recipe in memory and derives stable reference IDs without changing T01/T03. */
export function deriveTechPackPatternInventory(
  recipe: Pick<GarmentRecipe, "name" | "draft"> | null,
  measurements: Measurements,
  options: GarmentOptions,
): TechPackPatternInventory {
  if (!recipe) return unusableInventory("unknown", "UNSUPPORTED", "No supported in-app pattern recipe matches this tech pack.");
  let block: Block;
  try {
    block = recipe.draft(measurements, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The recipe draft raised an unknown error.";
    return unusableInventory(recipe.name, "DRAFT_ERROR", `The current saved design could not draft its pattern: ${detail}`);
  }
  if (!block || !isRecord(block) || !isRecord(block.roles) || !Array.isArray(block.stitches)) {
    return unusableInventory(recipe.name, "DRAFT_ERROR", "The current recipe did not produce a usable block with roles and stitches.");
  }

  const findings: TechPackReferenceFinding[] = [];
  const components = Object.entries(block.roles).map(([role, piece]) => {
    const id = stableSlug(role);
    const valid = STABLE_ID.test(id);
    if (!valid) findings.push(finding(
      "MALFORMED_COMPONENT_ID",
      "INVALID",
      `pattern.components.${role}`,
      `Pattern role "${role}" cannot produce a lowercase stable component reference ID.`,
      "Rename or correct the in-app pattern role before using it in a T01 or T03 reference.",
    ));
    return { id, role, pieceName: isRecord(piece) && typeof piece.name === "string" ? piece.name : "", valid };
  });
  const componentIds = new Map<string, TechPackPatternComponent[]>();
  for (const component of components) {
    if (!component.valid) continue;
    const siblings = componentIds.get(component.id) ?? [];
    siblings.push(component);
    componentIds.set(component.id, siblings);
  }
  const validComponents = components.map((component) => {
    const duplicate = (componentIds.get(component.id)?.length ?? 0) > 1;
    if (duplicate) findings.push(finding(
      "DUPLICATE_COMPONENT_ID",
      "CONFLICT",
      `pattern.components.${component.role}`,
      `More than one exact pattern role normalizes to component reference "${component.id}".`,
      "Resolve the colliding in-app pattern role names before linking BOM or operation records.",
    ));
    return duplicate ? { ...component, valid: false } : component;
  });

  const seams = block.stitches.map((stitch, index) => {
    const shape = stitchTopology(stitch);
    const label = isRecord(stitch) && typeof stitch.label === "string" ? stitch.label : "";
    const labelSlug = stableSlug(label);
    const id = labelSlug ? `seam-${labelSlug}-${fnv1a(shape.signature)}` : "";
    let valid = STABLE_ID.test(id) && shape.valid;
    if (!STABLE_ID.test(id)) findings.push(finding(
      "MALFORMED_SEAM_ID",
      "INVALID",
      `pattern.seams.${index}`,
      "A stitch declaration has no label that can produce a lowercase stable seam reference ID.",
      "Give the in-app stitch declaration a stable non-empty label before referencing it in T03.",
    ));
    if (shape.valid && !topologyTargetsExist(block, stitch as Stitch)) {
      valid = false;
      findings.push(finding(
        "INVALID_SEAM_TOPOLOGY",
        "CONFLICT",
        `pattern.seams.${index}`,
        `Stitch "${label}" refers to a missing role, edge, or mark in the drafted pattern (${shape.text}).`,
        "Correct the in-app stitch declaration so each referenced role and edge or mark exists.",
      ));
    } else if (!shape.valid) {
      valid = false;
      findings.push(finding(
        "INVALID_SEAM_TOPOLOGY",
        "CONFLICT",
        `pattern.seams.${index}`,
        `Stitch "${label || "(unlabeled)"}" has an empty or malformed interface (${shape.text}).`,
        "Correct both in-app stitch interfaces before referencing this seam in T03.",
      ));
    }
    return { id, label, topology: shape.text, valid };
  });
  const seamIds = new Map<string, number[]>();
  seams.forEach((seam, index) => {
    if (!seam.id) return;
    const siblings = seamIds.get(seam.id) ?? [];
    siblings.push(index);
    seamIds.set(seam.id, siblings);
  });
  const validSeams = seams.map((seam, index) => {
    const duplicate = (seamIds.get(seam.id)?.length ?? 0) > 1;
    if (duplicate) findings.push(finding(
      "DUPLICATE_SEAM_ID",
      "CONFLICT",
      `pattern.seams.${index}`,
      `More than one stitch declaration derives the seam reference "${seam.id}".`,
      "Give the duplicate stitch declarations distinct labels or topology before linking T03.",
    ));
    return duplicate ? { ...seam, valid: false } : seam;
  });

  return { recipeId: recipe.name, available: true, components: validComponents, seams: validSeams, findings };
}

type ComponentResolution =
  | { readonly kind: "MATCHED"; readonly component: TechPackPatternComponent }
  | { readonly kind: "UNKNOWN" }
  | { readonly kind: "AMBIGUOUS" }
  | { readonly kind: "INVALID"; readonly component: TechPackPatternComponent };

function resolveComponent(inventory: TechPackPatternInventory, reference: string): ComponentResolution {
  const matches = inventory.components.filter((component) => component.role === reference || component.id === reference);
  const unique = [...new Set(matches)];
  if (unique.length === 0) return { kind: "UNKNOWN" };
  if (unique.length > 1) return { kind: "AMBIGUOUS" };
  const component = unique[0]!;
  return component.valid ? { kind: "MATCHED", component } : { kind: "INVALID", component };
}

function fieldProblem(row: TechPackBomRow): TechPackReferenceFinding | null {
  const field = row.componentRef;
  const path = `bomRows.${row.id}.componentRef`;
  if (field.evidenceStatus === "CONFLICT") return finding(
    "BOM_COMPONENT_CONFLICT",
    "CONFLICT",
    path,
    field.unresolvedReason ?? "This BOM component reference is marked as conflicting.",
    field.nextAction ?? "Resolve the conflicting T01 component reference and keep its evidence trail.",
  );
  if (field.provenance === "UNRESOLVED" || field.value === null) return finding(
    "BOM_COMPONENT_UNRESOLVED",
    "UNRESOLVED",
    path,
    field.unresolvedReason ?? "This BOM row has no resolved pattern component reference.",
    field.nextAction ?? "Enter a pattern component ID, or record why the reference remains unresolved.",
  );
  if (field.validationStatus === "INVALID") return finding(
    "BOM_COMPONENT_INVALID",
    "INVALID",
    path,
    field.unresolvedReason ?? "This BOM component reference is marked invalid.",
    field.nextAction ?? "Correct the T01 component reference and its validation state.",
  );
  if (typeof field.value !== "string" || field.value.trim().length === 0) return finding(
    "BOM_COMPONENT_INVALID",
    "INVALID",
    path,
    "The BOM component reference is empty or malformed.",
    "Enter an exact pattern role key or its lowercase component reference ID.",
  );
  return null;
}

function mapBomRow(
  row: TechPackBomRow,
  inventory: TechPackPatternInventory,
  findings: TechPackReferenceFinding[],
  mappedComponents: Set<string>,
): void {
  const problem = fieldProblem(row);
  if (problem) {
    findings.push(problem);
    return;
  }
  const reference = row.componentRef.value as string;
  const resolution = resolveComponent(inventory, reference);
  const path = `bomRows.${row.id}.componentRef`;
  if (resolution.kind === "MATCHED") {
    mappedComponents.add(resolution.component.id);
    findings.push(finding(
      "BOM_COMPONENT_MATCHED",
      "MATCHED",
      path,
      `This T01 value resolves to in-app pattern role "${resolution.component.role}" (${resolution.component.id}).`,
      "Keep the reference and its current T01 provenance unchanged; this match is not manufacturing evidence.",
    ));
    return;
  }
  if (resolution.kind === "AMBIGUOUS") {
    findings.push(finding(
      "BOM_COMPONENT_AMBIGUOUS",
      "CONFLICT",
      path,
      `The value "${reference}" matches more than one normalized pattern role.`,
      "Resolve the in-app role ID collision, then select the intended pattern role.",
    ));
    return;
  }
  findings.push(finding(
    resolution.kind === "INVALID" ? "BOM_COMPONENT_PATTERN_INVALID" : "BOM_COMPONENT_UNKNOWN",
    resolution.kind === "INVALID" ? "INVALID" : "UNKNOWN",
    path,
    resolution.kind === "INVALID"
      ? `The value "${reference}" points to a pattern role with a malformed or colliding reference ID.`
      : `The value "${reference}" does not match a role in the current saved pattern.`,
    resolution.kind === "INVALID"
      ? "Correct the in-app pattern role ID collision before keeping this BOM link."
      : "Update the T01 value to an exact role key or lowercase component ID from the current pattern inventory.",
  ));
}

type OperationReferenceState<T> =
  | { readonly kind: "problem"; readonly finding: TechPackReferenceFinding }
  | { readonly kind: "ready"; readonly references: readonly T[] };

function operationReferenceState<T>(
  operationId: string,
  pathPart: "componentRefs" | "seamRefs",
  value: TechPackOperationSourcedValue<readonly T[]>,
): OperationReferenceState<T> {
  const path = `operations.${operationId}.${pathPart}`;
  if (value.status === "UNRESOLVED") return { kind: "problem", finding: finding(
    "OPERATION_REFERENCE_UNRESOLVED", "UNRESOLVED", path, value.unresolvedReason, value.nextAction,
  ) };
  if (value.status === "CONFLICT") return { kind: "problem", finding: finding(
    "OPERATION_REFERENCE_CONFLICT", "CONFLICT", path, value.unresolvedReason, value.nextAction,
  ) };
  if (value.value.length === 0) return { kind: "problem", finding: finding(
    "OPERATION_REFERENCE_MISSING",
    "MISSING",
    path,
    `No ${pathPart === "componentRefs" ? "component" : "seam"} references are recorded for this operation.`,
    `Add the applicable in-app ${pathPart === "componentRefs" ? "component" : "seam"} reference IDs, or keep the field explicitly unresolved with a reason.`,
  ) };
  return { kind: "ready", references: value.value };
}

function reconcileOperationComponents(
  record: TechPackOperationRecordSet,
  inventory: TechPackPatternInventory,
  mappedComponents: ReadonlySet<string>,
  findings: TechPackReferenceFinding[],
): void {
  for (const operation of record.operations) {
    const state = operationReferenceState(operation.id, "componentRefs", operation.componentRefs);
    if (state.kind === "problem") {
      findings.push(state.finding);
      continue;
    }
    const references = state.references;
    references.forEach((reference, index) => {
      const path = `operations.${operation.id}.componentRefs.${index}`;
      if (typeof reference !== "string" || !STABLE_ID.test(reference)) {
        findings.push(finding(
          "OPERATION_COMPONENT_INVALID",
          "INVALID",
          path,
          "This operation component reference is not a lowercase stable ID.",
          "Use a component ID from the current pattern inventory and keep its origin status visible.",
        ));
        return;
      }
      const resolution = resolveComponent(inventory, reference);
      if (resolution.kind === "AMBIGUOUS") {
        findings.push(finding("OPERATION_COMPONENT_AMBIGUOUS", "CONFLICT", path,
          `The value "${reference}" matches more than one normalized pattern role.`,
          "Resolve the in-app role ID collision before referencing this component."));
        return;
      }
      if (resolution.kind === "UNKNOWN") {
        findings.push(finding("OPERATION_COMPONENT_UNKNOWN", "UNKNOWN", path,
          `The value "${reference}" does not match a role in the current saved pattern.`,
          "Update this value to a component ID from the current pattern inventory."));
        return;
      }
      if (!mappedComponents.has(resolution.component.id)) {
        findings.push(finding("OPERATION_COMPONENT_BOM_MISSING", "MISSING", path,
          `Pattern role "${resolution.component.role}" exists, but no valid T01 BOM row links to it.`,
          "Add or correct a T01 BOM component reference before linking this operation to the component."));
        return;
      }
      findings.push(finding("OPERATION_COMPONENT_MATCHED", "MATCHED", path,
        `This value resolves to pattern role "${resolution.component.role}" and a valid explicit T01 BOM link.`,
        "Keep the operation's current provenance label; reference matching does not promote it to source evidence."));
    });
  }
}

function reconcileOperationSeams(
  record: TechPackOperationRecordSet,
  inventory: TechPackPatternInventory,
  findings: TechPackReferenceFinding[],
): void {
  for (const operation of record.operations) {
    const state = operationReferenceState(operation.id, "seamRefs", operation.seamRefs);
    if (state.kind === "problem") {
      findings.push(state.finding);
      continue;
    }
    state.references.forEach((reference, index) => {
      const path = `operations.${operation.id}.seamRefs.${index}`;
      if (typeof reference !== "string" || !STABLE_ID.test(reference)) {
        findings.push(finding("OPERATION_SEAM_INVALID", "INVALID", path,
          "This operation seam reference is not a lowercase stable ID.",
          "Use a seam ID from the current pattern inventory and keep its origin status visible."));
        return;
      }
      const matches = inventory.seams.filter((seam) => seam.id === reference);
      if (matches.length === 0) {
        findings.push(finding("OPERATION_SEAM_UNKNOWN", "UNKNOWN", path,
          `The value "${reference}" does not match a stitch declaration in the current saved pattern.`,
          "Update this value to a seam ID from the current pattern inventory."));
        return;
      }
      if (matches.length > 1) {
        findings.push(finding("OPERATION_SEAM_AMBIGUOUS", "CONFLICT", path,
          `The value "${reference}" matches duplicate in-app stitch declarations.`,
          "Resolve the duplicate seam ID in the in-app pattern before referencing it."));
        return;
      }
      if (!matches[0]!.valid) {
        findings.push(finding("OPERATION_SEAM_PATTERN_INVALID", "INVALID", path,
          `The seam "${matches[0]!.label}" has a malformed or invalid in-app topology.`,
          "Correct the pattern stitch declaration before using this seam reference."));
        return;
      }
      findings.push(finding("OPERATION_SEAM_MATCHED", "MATCHED", path,
        `This value resolves to in-app stitch "${matches[0]!.label}" (${matches[0]!.id}).`,
        "Keep the operation's current provenance label; matching an in-app stitch does not establish construction evidence."));
    });
  }
}

/** Reconciles explicit T01/T03 references with one draft's in-app identifiers. */
export function reconcileTechPackReferences(
  record: TechPackRecord,
  inventory: TechPackPatternInventory,
  operationData: TechPackOperationRecordSet | null,
): TechPackReferenceReconciliation {
  const findings = [...inventory.findings];
  if (!inventory.available) return { inventory, findings };
  if (record.recipeId !== inventory.recipeId) {
    findings.push(finding("TECH_PACK_RECIPE_MISMATCH", "CONFLICT", "recipeId",
      `Tech pack recipe "${record.recipeId}" does not match drafted pattern "${inventory.recipeId}".`,
      "Open the tech pack for its matching saved style and recipe before reconciling references."));
    return { inventory, findings };
  }
  const mappedComponents = new Set<string>();
  for (const row of record.bomRows) mapBomRow(row, inventory, findings, mappedComponents);
  if (!operationData) return { inventory, findings };
  if (operationData.recipeId !== record.recipeId) {
    findings.push(finding("OPERATION_RECIPE_MISMATCH", "CONFLICT", "operationData.recipeId",
      `T03 recipe "${operationData.recipeId}" does not match tech pack recipe "${record.recipeId}".`,
      "Correct the T03 recipe ID before reconciling its operation references."));
    return { inventory, findings };
  }
  reconcileOperationComponents(operationData, inventory, mappedComponents, findings);
  reconcileOperationSeams(operationData, inventory, findings);
  return { inventory, findings };
}

export function buildTechPackReferenceReconciliation(
  record: TechPackRecord,
  recipe: Pick<GarmentRecipe, "name" | "draft"> | null,
  measurements: Measurements,
  options: GarmentOptions,
  operationData: TechPackOperationRecordSet | null,
): TechPackReferenceReconciliation {
  return reconcileTechPackReferences(record, deriveTechPackPatternInventory(recipe, measurements, options), operationData);
}

/** Keeps the imported reference type live as part of the public seam-inventory contract. */
export type TechPackPatternReference = InterfaceRef;
