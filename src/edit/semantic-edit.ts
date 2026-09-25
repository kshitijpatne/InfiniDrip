import type { Point } from "../geometry";
import { FOLD_EPS } from "../export/unfold";
import { polygonArea } from "../export/nesting";
import { edgeEnd, edgeStart, type Edge } from "../drafting/piece";
import type { Block } from "../drafting/block";
import type { Measurements } from "../drafting/measurements";
import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe } from "../drafting/recipe";
import { stitchChecks } from "../drafting/stitch";
import { outlinePoints } from "../render/allowance";
import { gradeRun } from "../drafting/grading";

export const SEMANTIC_EDIT_SCHEMA_VERSION = 2 as const;
export const SEMANTIC_EDIT_HISTORY_LIMIT = 30;
const JOIN_EPS = 1e-6;
const AREA_EPS = 1e-6;
const INTERSECTION_EPS = 1e-9;

export type SemanticAnchor =
  | {
      readonly id: string;
      readonly kind: "junction";
      readonly recipeId: string;
      readonly roleId: string;
      readonly pieceName: string;
      readonly previousEdge: string;
      readonly nextEdge: string;
      readonly pointCm: Point;
      readonly signature: string;
    }
  | {
      readonly id: string;
      readonly kind: "curve-control";
      readonly recipeId: string;
      readonly roleId: string;
      readonly pieceName: string;
      readonly edge: string;
      readonly control: 1 | 2;
      readonly pointCm: Point;
      readonly signature: string;
    };

export interface SemanticAnchorMove {
  readonly anchorId: string;
  readonly signature: string;
  readonly deltaCm: Point;
}

export interface MoveAnchorsOperation {
  readonly schemaVersion: typeof SEMANTIC_EDIT_SCHEMA_VERSION;
  readonly id: string;
  readonly kind: "move-anchors";
  readonly recipeId: string;
  readonly sourceFingerprint: string;
  readonly moves: readonly SemanticAnchorMove[];
}

export type SemanticEditOperation = MoveAnchorsOperation;

/** Values that define the user-visible recipe source against which edits were reviewed. */
export interface SemanticEditSourceInputs {
  readonly measurements: Readonly<Record<string, number>>;
  readonly options: Readonly<Record<string, number>>;
}

export interface SemanticEditDocument {
  readonly schemaVersion: typeof SEMANTIC_EDIT_SCHEMA_VERSION;
  readonly recipeId: string;
  readonly sourceFingerprint: string;
  readonly sourceInputs: SemanticEditSourceInputs;
  readonly operations: readonly SemanticEditOperation[];
  readonly past: readonly (readonly SemanticEditOperation[])[];
  readonly future: readonly (readonly SemanticEditOperation[])[];
}

export type SemanticEditIssueCode =
  | "invalid-source"
  | "source-conflict"
  | "rebase-required"
  | "invalid-operation"
  | "duplicate-anchor"
  | "anchor-missing"
  | "anchor-changed"
  | "identity-conflict"
  | "target-conflict"
  | "piece-edge-name-duplicate"
  | "piece-open"
  | "piece-non-finite"
  | "piece-degenerate"
  | "piece-self-intersection"
  | "fold-edge-ambiguous"
  | "fold-edge-invalid"
  | "fold-side-crossed"
  | "stitch-invalid"
  | "measurement-non-finite"
  | "spec-invalid"
  | "recipe-check-invalid";

export interface SemanticEditIssue {
  readonly code: SemanticEditIssueCode;
  readonly message: string;
  readonly recipeId?: string;
  readonly sizeLabel?: string;
  readonly roleId?: string;
  readonly anchorId?: string;
  readonly operationId?: string;
  readonly checkName?: string;
}

export interface SemanticEditSizeResult {
  readonly label: string;
  readonly step: number;
  readonly block: Block;
  readonly issues: readonly SemanticEditIssue[];
  readonly canExport: boolean;
}

export interface SemanticEditEvaluation {
  readonly status: "ready" | "blocked" | "rebase-required";
  readonly sourceFingerprint: string;
  readonly sizes: readonly SemanticEditSizeResult[];
  readonly issues: readonly SemanticEditIssue[];
  readonly canExportSize: (step: number) => boolean;
  readonly canExportRun: boolean;
}

/** Require a validated run before deriving dependent output. */
export function requireSemanticEditEvaluation(
  evaluation: SemanticEditEvaluation | null | undefined,
): SemanticEditEvaluation {
  if (!evaluation) throw new Error("Semantic edit outputs are paused until their source is verified or rebased.");
  return evaluation;
}

/** Resolve only a registered, validated size; never fall back to the base pattern. */
export function requireSemanticEditSize(evaluation: SemanticEditEvaluation, step: number): Block {
  const size = evaluation.sizes.find((candidate) => candidate.step === step);
  if (!size || !size.canExport) throw new Error("The requested size is not present or valid in the semantic edit run.");
  return size.block;
}

export type ConflictResolution = "keep-local" | "keep-remote";

export interface EditOperationConflict {
  readonly targetId: string;
  readonly localOperationIds: readonly string[];
  readonly remoteOperationIds: readonly string[];
}

export interface MergeOperationsResult {
  readonly ok: boolean;
  readonly operations: readonly SemanticEditOperation[];
  readonly conflicts: readonly EditOperationConflict[];
  readonly issues: readonly SemanticEditIssue[];
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value) as string;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("The edit source contains a non-finite number.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value !== "object") throw new Error("The edit source is not canonical JSON data.");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

const objectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return objectRecord(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function validInputValues(value: unknown): value is Readonly<Record<string, number>> {
  return objectRecord(value) && Object.entries(value).every(([key, entry]) =>
    key.trim().length > 0 && typeof entry === "number" && Number.isFinite(entry));
}

function validFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^semantic-edit:v2:sha256:[0-9a-f]{64}$/.test(value);
}

/** Strict parser for persisted operation state; geometry validity remains an evaluation result. */
export function parseSemanticEditDocument(value: unknown): SemanticEditDocument | null {
  if (!exactKeys(value, ["schemaVersion", "recipeId", "sourceFingerprint", "sourceInputs", "operations", "past", "future"])
    || value.schemaVersion !== SEMANTIC_EDIT_SCHEMA_VERSION
    || typeof value.recipeId !== "string" || value.recipeId.trim().length === 0
    || !validFingerprint(value.sourceFingerprint)
    || !exactKeys(value.sourceInputs, ["measurements", "options"])
    || !validInputValues(value.sourceInputs.measurements)
    || !validInputValues(value.sourceInputs.options)
    || !Array.isArray(value.operations) || !Array.isArray(value.past) || !Array.isArray(value.future)
    || value.past.length > SEMANTIC_EDIT_HISTORY_LIMIT || value.future.length > SEMANTIC_EDIT_HISTORY_LIMIT) return null;
  const validOperation = (candidate: unknown): candidate is SemanticEditOperation => {
    if (!exactKeys(candidate, ["schemaVersion", "id", "kind", "recipeId", "sourceFingerprint", "moves"])
      || candidate.schemaVersion !== SEMANTIC_EDIT_SCHEMA_VERSION
      || typeof candidate.id !== "string" || candidate.id.trim().length === 0
      || candidate.kind !== "move-anchors" || candidate.recipeId !== value.recipeId
      || candidate.sourceFingerprint !== value.sourceFingerprint
      || !Array.isArray(candidate.moves) || candidate.moves.length !== 1) return false;
    const move = candidate.moves[0];
    return exactKeys(move, ["anchorId", "signature", "deltaCm"])
      && typeof move.anchorId === "string" && move.anchorId.length > 0
      && typeof move.signature === "string" && move.signature.length > 0
      && exactKeys(move.deltaCm, ["x", "y"])
      && typeof move.deltaCm.x === "number" && Number.isFinite(move.deltaCm.x)
      && typeof move.deltaCm.y === "number" && Number.isFinite(move.deltaCm.y);
  };
  const active = value.operations;
  const snapshots = [...value.past, ...value.future];
  if (!active.every(validOperation) || !snapshots.every((snapshot) =>
    Array.isArray(snapshot) && snapshot.every(validOperation))) return null;
  for (const stack of [active, ...snapshots]) {
    if (new Set(stack.map((operation) => operation.id)).size !== stack.length) return null;
  }
  const byId = new Map<string, SemanticEditOperation>();
  for (const operation of [...active, ...snapshots.flat()]) {
    const previous = byId.get(operation.id);
    if (previous && !sameOperation(previous, operation)) return null;
    byId.set(operation.id, operation);
  }
  return value as unknown as SemanticEditDocument;
}

/** Versioned fingerprint of the source pattern. It is conflict metadata, not a revision approval. */
export async function semanticEditSourceFingerprint(
  recipeId: string,
  block: Block,
  cryptoProvider: Crypto | undefined = globalThis.crypto,
  sourceInputs: SemanticEditSourceInputs = { measurements: {}, options: {} },
): Promise<string> {
  if (!recipeId || !cryptoProvider?.subtle) throw new Error("SHA-256 is unavailable; semantic edits are blocked.");
  if (!exactKeys(sourceInputs, ["measurements", "options"])
    || !validInputValues(sourceInputs.measurements) || !validInputValues(sourceInputs.options)) {
    throw new Error("Semantic edit source inputs must be finite, canonical recipe values.");
  }
  const payload = canonicalJson({ schemaVersion: SEMANTIC_EDIT_SCHEMA_VERSION, recipeId, sourceInputs, block });
  const digest = await cryptoProvider.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `semantic-edit:v${SEMANTIC_EDIT_SCHEMA_VERSION}:sha256:${hex}`;
}

function pointForControl(edge: Extract<Edge, { kind: "curve" }>, control: 1 | 2): Point {
  return control === 1 ? edge.curve.control1 : edge.curve.control2;
}

function signature(value: Record<string, unknown>): string {
  return canonicalJson(value);
}

/** All addressable points for every role, derived from recipe-authored edge names. */
export function semanticAnchorCatalog(recipeId: string, block: Block): readonly SemanticAnchor[] {
  const anchors: SemanticAnchor[] = [];
  for (const [roleId, piece] of Object.entries(block.roles)) {
    const edgeNames = piece.edges.map((edge) => edge.name);
    if (new Set(edgeNames).size !== edgeNames.length) {
      throw new Error(`Piece role "${roleId}" has duplicate edge names; semantic anchors are ambiguous.`);
    }
    const add = (anchor: SemanticAnchor): void => {
      anchors.push(anchor);
    };
    const edgeCount = piece.edges.length;
    for (let index = 0; index < edgeCount; index++) {
      const previous = piece.edges[(index - 1 + edgeCount) % edgeCount];
      const next = piece.edges[index];
      const priorEnd = edgeEnd(previous);
      const nextStart = edgeStart(next);
      if (Math.hypot(priorEnd.x - nextStart.x, priorEnd.y - nextStart.y) > JOIN_EPS) {
        throw new Error(`Piece role "${roleId}" has an open junction before "${next.name}".`);
      }
      const id = `anchor:v1/${encode(recipeId)}/${encode(roleId)}/junction/${encode(previous.name)}/${encode(next.name)}`;
      add({
        id,
        kind: "junction",
        recipeId,
        roleId,
        pieceName: piece.name,
        previousEdge: previous.name,
        nextEdge: next.name,
        pointCm: nextStart,
        signature: signature({ recipeId, roleId, pieceName: piece.name, onFold: piece.onFold, kind: "junction", previous: { name: previous.name, kind: previous.kind }, next: { name: next.name, kind: next.kind } }),
      });
      if (next.kind === "curve") {
        for (const control of [1, 2] as const) {
          const controlId = `anchor:v1/${encode(recipeId)}/${encode(roleId)}/edge/${encode(next.name)}/control/${control}`;
          add({
            id: controlId,
            kind: "curve-control",
            recipeId,
            roleId,
            pieceName: piece.name,
            edge: next.name,
            control,
            pointCm: pointForControl(next, control),
            signature: signature({ recipeId, roleId, pieceName: piece.name, onFold: piece.onFold, kind: "curve-control", edge: { name: next.name, kind: next.kind }, control }),
          });
        }
      }
    }
  }
  return anchors;
}

export function emptySemanticEditDocument(
  recipeId: string,
  sourceFingerprint: string,
  sourceInputs: SemanticEditSourceInputs = { measurements: {}, options: {} },
): SemanticEditDocument {
  if (!recipeId.trim() || !validFingerprint(sourceFingerprint)) throw new Error("An edit document needs a recipe and source fingerprint.");
  if (!exactKeys(sourceInputs, ["measurements", "options"])
    || !validInputValues(sourceInputs.measurements) || !validInputValues(sourceInputs.options)) {
    throw new Error("An edit document needs finite recipe source inputs.");
  }
  return { schemaVersion: SEMANTIC_EDIT_SCHEMA_VERSION, recipeId, sourceFingerprint, sourceInputs, operations: [], past: [], future: [] };
}

/** Build one exact-centimetre movement using an anchor from the source draft. */
export function createAnchorMoveOperation(
  recipeId: string,
  sourceFingerprint: string,
  block: Block,
  operationId: string,
  anchorId: string,
  deltaCm: Point,
): MoveAnchorsOperation {
  if (!recipeId.trim() || !validFingerprint(sourceFingerprint)) throw new Error("An edit operation needs a recipe and current source fingerprint.");
  if (!operationId.trim()) throw new Error("An edit operation needs a stable ID.");
  if (!Number.isFinite(deltaCm.x) || !Number.isFinite(deltaCm.y)) throw new Error("Anchor movement must be finite centimetres.");
  const anchor = semanticAnchorCatalog(recipeId, block).find((item) => item.id === anchorId);
  if (!anchor) throw new Error(`Semantic anchor "${anchorId}" is not present in the source draft.`);
  return {
    schemaVersion: SEMANTIC_EDIT_SCHEMA_VERSION,
    id: operationId,
    kind: "move-anchors",
    recipeId,
    sourceFingerprint,
    moves: [{ anchorId, signature: anchor.signature, deltaCm: { x: deltaCm.x, y: deltaCm.y } }],
  };
}

function operationTarget(operation: SemanticEditOperation): string {
  return operation.moves.map((move) => move.anchorId).sort().join("|");
}

function sameOperation(a: SemanticEditOperation, b: SemanticEditOperation): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

function bounded<T>(values: readonly T[], limit: number): readonly T[] {
  const size = Number.isSafeInteger(limit) && limit > 0 ? limit : SEMANTIC_EDIT_HISTORY_LIMIT;
  return values.slice(Math.max(0, values.length - size));
}

/** Append an atomic group; invalid geometry is retained for correction, invalid operation data is rejected. */
export function appendSemanticEditOperations(
  document: SemanticEditDocument,
  operations: readonly SemanticEditOperation[],
  historyLimit = SEMANTIC_EDIT_HISTORY_LIMIT,
): SemanticEditDocument {
  if (operations.length === 0) throw new Error("At least one edit operation is required.");
  const existingIds = new Set(document.operations.map((operation) => operation.id));
  for (const snapshot of [...document.past, ...document.future]) {
    for (const operation of snapshot) existingIds.add(operation.id);
  }
  for (const operation of operations) {
    if (operation.schemaVersion !== SEMANTIC_EDIT_SCHEMA_VERSION || operation.kind !== "move-anchors" ||
        !operation.id.trim() || operation.recipeId !== document.recipeId ||
        operation.sourceFingerprint !== document.sourceFingerprint || operation.moves.length !== 1 ||
        existingIds.has(operation.id)) {
      throw new Error(`Edit operation "${operation.id}" is invalid or conflicts with the current source.`);
    }
    const move = operation.moves[0];
    if (!move.anchorId || !move.signature || !Number.isFinite(move.deltaCm.x) || !Number.isFinite(move.deltaCm.y)) {
      throw new Error(`Edit operation "${operation.id}" contains invalid anchor data.`);
    }
    existingIds.add(operation.id);
  }
  return {
    ...document,
    operations: [...document.operations, ...operations],
    past: bounded([...document.past, document.operations], historyLimit),
    future: [],
  };
}

export function undoSemanticEdit(document: SemanticEditDocument, historyLimit = SEMANTIC_EDIT_HISTORY_LIMIT): SemanticEditDocument {
  const previous = document.past[document.past.length - 1];
  if (previous === undefined) return document;
  return {
    ...document,
    operations: previous,
    past: document.past.slice(0, -1),
    future: bounded([document.operations, ...document.future], historyLimit),
  };
}

export function redoSemanticEdit(document: SemanticEditDocument, historyLimit = SEMANTIC_EDIT_HISTORY_LIMIT): SemanticEditDocument {
  const next = document.future[0];
  if (next === undefined) return document;
  return {
    ...document,
    operations: next,
    past: bounded([...document.past, document.operations], historyLimit),
    future: document.future.slice(1),
  };
}

function withStart(edge: Edge, point: Point): Edge {
  return edge.kind === "line" ? { ...edge, start: point } : { ...edge, curve: { ...edge.curve, start: point } };
}

function withEnd(edge: Edge, point: Point): Edge {
  return edge.kind === "line" ? { ...edge, end: point } : { ...edge, curve: { ...edge.curve, end: point } };
}

function withControl(edge: Extract<Edge, { kind: "curve" }>, control: 1 | 2, point: Point): Edge {
  return control === 1
    ? { ...edge, curve: { ...edge.curve, control1: point } }
    : { ...edge, curve: { ...edge.curve, control2: point } };
}

function translateAnchor(block: Block, anchor: SemanticAnchor, delta: Point): Block {
  const piece = block.roles[anchor.roleId]!;
  const edges = piece.edges.slice();
  if (anchor.kind === "junction") {
    const previousIndex = edges.findIndex((edge) => edge.name === anchor.previousEdge);
    const nextIndex = edges.findIndex((edge) => edge.name === anchor.nextEdge);
    const current = edgeStart(edges[nextIndex]);
    const moved = { x: current.x + delta.x, y: current.y + delta.y };
    edges[previousIndex] = withEnd(edges[previousIndex], moved);
    edges[nextIndex] = withStart(edges[nextIndex], moved);
  } else {
    const index = edges.findIndex((edge) => edge.name === anchor.edge);
    const edge = edges[index] as Extract<Edge, { kind: "curve" }>;
    const current = pointForControl(edge, anchor.control);
      edges[index] = withControl(edge, anchor.control, { x: current.x + delta.x, y: current.y + delta.y });
  }
  return { ...block, roles: { ...block.roles, [anchor.roleId]: { ...piece, edges } } };
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, p: Point): boolean {
  return Math.abs(cross(a, b, p)) <= INTERSECTION_EPS &&
    p.x >= Math.min(a.x, b.x) - INTERSECTION_EPS && p.x <= Math.max(a.x, b.x) + INTERSECTION_EPS &&
    p.y >= Math.min(a.y, b.y) - INTERSECTION_EPS && p.y <= Math.max(a.y, b.y) + INTERSECTION_EPS;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (((abC > INTERSECTION_EPS && abD < -INTERSECTION_EPS) || (abC < -INTERSECTION_EPS && abD > INTERSECTION_EPS)) &&
      ((cdA > INTERSECTION_EPS && cdB < -INTERSECTION_EPS) || (cdA < -INTERSECTION_EPS && cdB > INTERSECTION_EPS))) return true;
  return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}

function hasNonAdjacentCrossing(points: readonly Point[]): boolean {
  const count = points.length;
  if (count < 3) return true;
  if (count < 4) return false;
  for (let a = 0; a < count; a++) {
    const aNext = (a + 1) % count;
    for (let b = a + 1; b < count; b++) {
      const bNext = (b + 1) % count;
      if (a === b || aNext === b || bNext === a) continue;
      if (segmentsIntersect(points[a], points[aNext], points[b], points[bNext])) return true;
    }
  }
  return false;
}

function foldEdgeName(name: string): boolean {
  return /^center(?:Front|Back)?$/i.test(name) || /^fold$/i.test(name);
}

function validateBlock(recipe: GarmentRecipe, measurements: Measurements, block: Block, sizeLabel: string): SemanticEditIssue[] {
  const issues: SemanticEditIssue[] = [];
  const add = (issue: Omit<SemanticEditIssue, "recipeId" | "sizeLabel">): void => {
    issues.push({ ...issue, recipeId: recipe.name, sizeLabel });
  };
  for (const [field, value] of Object.entries(measurements)) {
    if (!Number.isFinite(value)) add({
      code: "measurement-non-finite",
      message: `Graded source measurement "${field}" is not finite at ${sizeLabel}.`,
    });
  }
  for (const [roleId, piece] of Object.entries(block.roles)) {
    const names = piece.edges.map((edge) => edge.name);
    if (new Set(names).size !== names.length) add({ code: "piece-edge-name-duplicate", roleId, message: `Piece "${roleId}" has duplicate semantic edge names.` });
    const finitePoints: Point[] = [];
    for (const edge of piece.edges) {
      finitePoints.push(edgeStart(edge), edgeEnd(edge));
      if (edge.kind === "curve") finitePoints.push(edge.curve.control1, edge.curve.control2);
    }
    if (finitePoints.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      add({ code: "piece-non-finite", roleId, message: `Piece "${roleId}" contains a non-finite coordinate.` });
      continue;
    }
    for (let index = 0; index < piece.edges.length; index++) {
      const edge = piece.edges[index];
      const next = piece.edges[(index + 1) % piece.edges.length];
      const end = edgeEnd(edge);
      const start = edgeStart(next);
      if (Math.hypot(end.x - start.x, end.y - start.y) > JOIN_EPS) {
        add({ code: "piece-open", roleId, message: `Piece "${roleId}" is open between "${edge.name}" and "${next.name}".` });
        break;
      }
    }
    const sewOutline = outlinePoints(piece);
    const area = polygonArea(sewOutline);
    if (!Number.isFinite(area) || area <= AREA_EPS) add({ code: "piece-degenerate", roleId, message: `Piece "${roleId}" has no usable enclosed area.` });
    if (hasNonAdjacentCrossing(sewOutline)) add({ code: "piece-self-intersection", roleId, message: `Piece "${roleId}" has crossing or touching non-adjacent sewing-outline segments.` });
    if (piece.onFold) {
      const foldEdges = piece.edges.filter((edge) => foldEdgeName(edge.name));
      if (foldEdges.length !== 1) {
        add({ code: "fold-edge-ambiguous", roleId, message: `Folded piece "${roleId}" must expose exactly one named center/fold edge.` });
      } else {
        const fold = foldEdges[0];
        if (fold.kind !== "line" || Math.abs(fold.start.x) > FOLD_EPS || Math.abs(fold.end.x) > FOLD_EPS) {
          add({ code: "fold-edge-invalid", roleId, message: `Fold edge "${fold.name}" on "${roleId}" must stay straight on x=0 within ${FOLD_EPS} cm.` });
        }
        if (sewOutline.some((point) => point.x < -FOLD_EPS)) {
          add({ code: "fold-side-crossed", roleId, message: `Piece "${roleId}" crosses to the other side of its x=0 fold.` });
        }
      }
    }
  }
  try {
    for (const check of stitchChecks(block, block.stitches)) {
      if (!check.ok) add({ code: "stitch-invalid", checkName: check.name, message: `${check.name}: ${check.detail}.` });
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Stitch references are invalid.";
    add({ code: "stitch-invalid", message: detail });
  }
  try {
    for (const check of recipe.checks(block, measurements)) {
      if (!check.ok) add({ code: "recipe-check-invalid", checkName: check.name, message: `${check.name}: ${check.detail}.` });
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Recipe checks could not be evaluated.";
    add({ code: "recipe-check-invalid", message: detail });
  }
  for (const pom of recipe.poms) {
    try {
      const value = pom.measure(block);
      const roundedValue = Math.round(value * 10) / 10;
      if (!Number.isFinite(value) || !Number.isFinite(roundedValue)) {
        add({ code: "spec-invalid", checkName: pom.label, message: `Point of measure "${pom.label}" is not finite at ${sizeLabel}.` });
      }
      if (pom.anchor) {
        const point = pom.anchor(block);
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          add({ code: "spec-invalid", checkName: pom.label, message: `Tech-pack callout for "${pom.label}" is not finite at ${sizeLabel}.` });
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : `Point of measure "${pom.label}" could not be evaluated.`;
      add({ code: "spec-invalid", checkName: pom.label, message: detail });
    }
  }
  return issues;
}

/** Deterministic draft checks for the current in-memory Edit preview. They do
 * not make that preview a saved, graded, or exportable style. */
export function inspectSemanticEditCandidate(
  recipe: GarmentRecipe,
  measurements: Measurements,
  block: Block,
  label = "Exploratory preview",
): readonly SemanticEditIssue[] {
  return validateBlock(recipe, measurements, block, label);
}

function applyOperationsToBlock(
  recipe: GarmentRecipe,
  measurements: Measurements,
  sourceBlock: Block,
  operations: readonly SemanticEditOperation[],
  sizeLabel: string,
  expectedSourceFingerprint: string,
): { readonly block: Block; readonly issues: readonly SemanticEditIssue[] } {
  let block = sourceBlock;
  const issues: SemanticEditIssue[] = [];
  for (const operation of operations) {
    if (operation.schemaVersion !== SEMANTIC_EDIT_SCHEMA_VERSION || typeof operation.id !== "string" || !operation.id.trim() || operation.recipeId !== recipe.name ||
        operation.sourceFingerprint !== expectedSourceFingerprint || operation.kind !== "move-anchors" ||
        !Array.isArray(operation.moves) || operation.moves.length !== 1 ||
        !operation.moves[0]?.anchorId || !operation.moves[0]?.signature ||
        !Number.isFinite(operation.moves[0]?.deltaCm?.x) || !Number.isFinite(operation.moves[0]?.deltaCm?.y)) {
      issues.push({ code: "invalid-operation", recipeId: recipe.name, sizeLabel, operationId: operation.id, message: `Operation "${operation.id}" is not valid for recipe "${recipe.name}".` });
      continue;
    }
    const move = operation.moves[0];
    let anchor: SemanticAnchor | undefined;
    try {
      anchor = semanticAnchorCatalog(recipe.name, block).find((candidate) => candidate.id === move.anchorId);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The semantic anchor catalog is invalid.";
      issues.push({ code: "anchor-changed", recipeId: recipe.name, sizeLabel, anchorId: move.anchorId, operationId: operation.id, message: detail });
      continue;
    }
    if (!anchor) {
      issues.push({ code: "anchor-missing", recipeId: recipe.name, sizeLabel, anchorId: move.anchorId, operationId: operation.id, message: `Anchor "${move.anchorId}" is absent at ${sizeLabel}. Rebase or remove this edit explicitly.` });
      continue;
    }
    if (anchor.signature !== move.signature) {
      issues.push({ code: "anchor-changed", recipeId: recipe.name, sizeLabel, anchorId: move.anchorId, operationId: operation.id, message: `Anchor "${move.anchorId}" changed meaning at ${sizeLabel}. Rebase or remove this edit explicitly.` });
      continue;
    }
    block = translateAnchor(block, anchor, move.deltaCm);
  }
  issues.push(...validateBlock(recipe, measurements, block, sizeLabel));
  return { block, issues };
}

/** Re-draft every registered size, replaying the same operation sequence in exact centimetres. */
export function evaluateSemanticEditDocument(
  recipe: GarmentRecipe,
  measurements: Measurements,
  options: GarmentOptions,
  document: SemanticEditDocument,
  currentSourceFingerprint: string,
  currentSourceInputs: SemanticEditSourceInputs = document.sourceInputs,
) : SemanticEditEvaluation {
  if (document.recipeId !== recipe.name || document.schemaVersion !== SEMANTIC_EDIT_SCHEMA_VERSION) {
    const issue: SemanticEditIssue = { code: "invalid-operation", recipeId: recipe.name, message: "The edit document does not match this recipe or schema." };
    return { status: "blocked", sourceFingerprint: currentSourceFingerprint, sizes: [], issues: [issue], canExportSize: () => false, canExportRun: false };
  }
  let changedInputs: string[] = [];
  try {
    if (!exactKeys(currentSourceInputs, ["measurements", "options"])) throw new Error("Malformed source inputs.");
    changedInputs = ["measurements", "options"].flatMap((group) => {
      const before = document.sourceInputs[group as keyof SemanticEditSourceInputs];
      const after = currentSourceInputs[group as keyof SemanticEditSourceInputs];
      if (!validInputValues(before) || !validInputValues(after)) throw new Error("Malformed source inputs.");
      return [...new Set([...Object.keys(before), ...Object.keys(after)])]
        .filter((key) => before[key] !== after[key]).map((key) => `${group}.${key}`);
    });
  } catch {
    const issue: SemanticEditIssue = { code: "invalid-source", recipeId: recipe.name, message: "The current semantic-edit source inputs are invalid." };
    return { status: "blocked", sourceFingerprint: currentSourceFingerprint, sizes: [], issues: [issue], canExportSize: () => false, canExportRun: false };
  }
  if (document.sourceFingerprint !== currentSourceFingerprint || changedInputs.length > 0) {
    const detail = changedInputs.length > 0 ? ` Changed inputs: ${changedInputs.join(", ")}.` : "";
    const issue: SemanticEditIssue = { code: "rebase-required", recipeId: recipe.name, message: `The source pattern or its reviewed inputs changed.${detail} Review the values and rebase or remove the edits before using dependent outputs.` };
    return { status: "rebase-required", sourceFingerprint: currentSourceFingerprint, sizes: [], issues: [issue], canExportSize: () => false, canExportRun: false };
  }
  const graded = gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft, options);
  const sizes = graded.map((size) => {
    const replay = applyOperationsToBlock(recipe, size.measurements, size.block, document.operations, size.label, document.sourceFingerprint);
    const issues = [...replay.issues];
    return { label: size.label, step: size.step, block: replay.block, issues, canExport: issues.length === 0 };
  });
  const issues = sizes.flatMap((size) => size.issues);
  const canExportSize = (step: number): boolean => sizes.some((size) => size.step === step && size.canExport);
  const canExportRun = sizes.length > 0 && sizes.every((size) => size.canExport);
  return { status: issues.length === 0 ? "ready" : "blocked", sourceFingerprint: currentSourceFingerprint, sizes, issues, canExportSize, canExportRun };
}

/** Explicitly rebase only when every stored semantic signature still resolves on the new base draft. */
export function rebaseSemanticEditDocument(
  document: SemanticEditDocument,
  recipe: GarmentRecipe,
  newBaseBlock: Block,
  nextSourceFingerprint: string,
  nextSourceInputs: SemanticEditSourceInputs = document.sourceInputs,
): { readonly ok: boolean; readonly document: SemanticEditDocument; readonly issues: readonly SemanticEditIssue[] } {
  if (document.recipeId !== recipe.name || !validFingerprint(nextSourceFingerprint)
    || !exactKeys(nextSourceInputs, ["measurements", "options"])
    || !validInputValues(nextSourceInputs.measurements) || !validInputValues(nextSourceInputs.options)) {
    return { ok: false, document, issues: [{ code: "invalid-source", recipeId: recipe.name, message: "Rebase requires the matching recipe and a current source fingerprint." }] };
  }
  let anchors: readonly SemanticAnchor[];
  try {
    anchors = semanticAnchorCatalog(recipe.name, newBaseBlock);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The new source has ambiguous semantic anchors.";
    return { ok: false, document, issues: [{ code: "anchor-changed", recipeId: recipe.name, message: detail }] };
  }
  const byId = new Map(anchors.map((anchor) => [anchor.id, anchor]));
  const allOperations = [
    ...document.operations,
    ...document.past.flat(),
    ...document.future.flat(),
  ];
  const issues: SemanticEditIssue[] = [];
  for (const operation of allOperations) {
    for (const move of operation.moves) {
      const anchor = byId.get(move.anchorId);
      if (!anchor) issues.push({ code: "anchor-missing", recipeId: recipe.name, anchorId: move.anchorId, operationId: operation.id, message: `Anchor "${move.anchorId}" cannot be resolved on the new source.` });
      else if (anchor.signature !== move.signature) issues.push({ code: "anchor-changed", recipeId: recipe.name, anchorId: move.anchorId, operationId: operation.id, message: `Anchor "${move.anchorId}" changed meaning; this edit needs a new user-authored target.` });
    }
  }
  if (issues.length > 0) return { ok: false, document, issues };
  const update = (operation: SemanticEditOperation): SemanticEditOperation => ({ ...operation, sourceFingerprint: nextSourceFingerprint });
  return {
    ok: true,
    document: {
      ...document,
      sourceFingerprint: nextSourceFingerprint,
      sourceInputs: nextSourceInputs,
      operations: document.operations.map(update),
      past: document.past.map((snapshot) => snapshot.map(update)),
      future: document.future.map((snapshot) => snapshot.map(update)),
    },
    issues: [],
  };
}

/** Merge operations from competing records; overlapping anchors require a named user resolution. */
export function mergeConcurrentEditOperations(
  local: readonly SemanticEditOperation[],
  remote: readonly SemanticEditOperation[],
  resolutions: Readonly<Record<string, ConflictResolution>> = {},
): MergeOperationsResult {
  const candidates = [...local, ...remote];
  const base = candidates[0];
  if (base && candidates.some((operation) => operation.schemaVersion !== base.schemaVersion ||
      operation.recipeId !== base.recipeId || operation.sourceFingerprint !== base.sourceFingerprint)) {
    return {
      ok: false,
      operations: [],
      conflicts: [],
      issues: [{
        code: "source-conflict",
        message: "Edits from different recipes or source patterns cannot be merged; explicitly rebase them onto one current source first.",
      }],
    };
  }
  const issues: SemanticEditIssue[] = [];
  const indexById = (operations: readonly SemanticEditOperation[]): Map<string, SemanticEditOperation> => {
    const indexed = new Map<string, SemanticEditOperation>();
    for (const operation of operations) {
      const previous = indexed.get(operation.id);
      if (previous && !sameOperation(previous, operation)) {
        issues.push({ code: "identity-conflict", operationId: operation.id, message: `Operation ID "${operation.id}" is duplicated with different contents.` });
      } else indexed.set(operation.id, operation);
    }
    return indexed;
  };
  const localById = indexById(local);
  const remoteById = indexById(remote);
  for (const [id, localOperation] of localById) {
    const remoteOperation = remoteById.get(id);
    if (remoteOperation && !sameOperation(localOperation, remoteOperation)) {
      issues.push({ code: "identity-conflict", operationId: id, message: `Operation ID "${id}" has different local and remote contents.` });
    }
  }
  if (issues.length > 0) return { ok: false, operations: [], conflicts: [], issues };
  const uniqueLocal = [...localById.values()].filter((operation) => !remoteById.has(operation.id));
  const uniqueRemote = [...remoteById.values()];
  const localTargets = new Map<string, SemanticEditOperation[]>();
  const remoteTargets = new Map<string, SemanticEditOperation[]>();
  for (const operation of uniqueLocal) localTargets.set(operationTarget(operation), [...(localTargets.get(operationTarget(operation)) ?? []), operation]);
  for (const operation of uniqueRemote) remoteTargets.set(operationTarget(operation), [...(remoteTargets.get(operationTarget(operation)) ?? []), operation]);
  const conflicts: EditOperationConflict[] = [];
  for (const [targetId, localOperations] of localTargets) {
    const remoteOperations = remoteTargets.get(targetId);
    if (remoteOperations) conflicts.push({ targetId, localOperationIds: localOperations.map((operation) => operation.id), remoteOperationIds: remoteOperations.map((operation) => operation.id) });
  }
  const unresolved = conflicts.filter((conflict) => !resolutions[conflict.targetId]);
  const invalidResolutions = conflicts.filter((conflict) => resolutions[conflict.targetId] !== undefined &&
    resolutions[conflict.targetId] !== "keep-local" && resolutions[conflict.targetId] !== "keep-remote");
  if (invalidResolutions.length > 0) {
    issues.push(...invalidResolutions.map((conflict) => ({ code: "target-conflict" as const, anchorId: conflict.targetId, message: `Conflict resolution for "${conflict.targetId}" must explicitly keep the local or remote edit.` })));
    return { ok: false, operations: [], conflicts, issues };
  }
  if (unresolved.length > 0) {
    issues.push(...unresolved.map((conflict) => ({ code: "target-conflict" as const, anchorId: conflict.targetId, message: `Local and remote edits both change "${conflict.targetId}". Choose the local or remote value.` })));
    return { ok: false, operations: [], conflicts, issues };
  }
  const droppedLocal = new Set<string>();
  const droppedRemote = new Set<string>();
  for (const conflict of conflicts) {
    if (resolutions[conflict.targetId] === "keep-local") conflict.remoteOperationIds.forEach((id) => droppedRemote.add(id));
    else conflict.localOperationIds.forEach((id) => droppedLocal.add(id));
  }
  const operations = [
    ...uniqueRemote.filter((operation) => !droppedRemote.has(operation.id)),
    ...uniqueLocal.filter((operation) => !droppedLocal.has(operation.id)),
  ];
  return { ok: true, operations, conflicts, issues: [] };
}
