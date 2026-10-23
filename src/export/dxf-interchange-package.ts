import type { Block } from "../drafting/block";
import type { GarmentOptions } from "../drafting/options";
import { notchesForRecipeOptions, type GarmentRecipe } from "../drafting/recipe";
import { optionAppliesToStarterEntry } from "../drafting/options";
import type { GradedSize } from "../drafting/grading";
import type { Measurements } from "../drafting/measurements";
import type { PatternMark } from "../drafting/pattern-mark";
import type { Piece } from "../drafting/piece";
import type { Point } from "../geometry";
import { blockPieces } from "../drafting/block";
import { outlinePoints } from "../render";
import { exportDxfCentimeters } from "./dxf-centimeters";
import { adaptiveSeamAllowance, CUT_GEOMETRY_ALGORITHM } from "./adaptive-cut";
import { layoutPieces, polylineBounds } from "./layout";
import {
  dxfEntityTypeAndLayer,
  expandNamedDxfDrawing,
  readNamedDxfDrawing,
  wrapDxfEntitiesInNamedBlocks,
} from "./named-dxf-blocks";

const SCHEMA_VERSION = "infinidrip.g04.dxf-package/5" as const;
const PREVIOUS_SCHEMA_VERSION = "infinidrip.g04.dxf-package/4" as const;
const OLDER_SCHEMA_VERSION = "infinidrip.g04.dxf-package/3" as const;
const LEGACY_SCHEMA_VERSION = "infinidrip.g04.dxf-package/2" as const;
const DEFAULT_INTERCHANGE_LAYOUT_GAP_CM = 2;
const TROUSER_INTERCHANGE_LAYOUT_GAP_CM = 5;

type DxfPatternMarkRecord = {
  readonly id: string;
  readonly pieceId: string;
  readonly entityOrdinal: number;
  readonly blockName: string;
  readonly sourceRevisionId: string;
  readonly name: string;
  readonly kind: PatternMark["kind"];
  readonly entityType: "LINE" | "CIRCLE" | "POINT";
  readonly entityCount?: number;
  readonly displayEncoding?: "centered-cross/1";
  readonly layer: string;
  readonly sourceGeometry:
    | { readonly kind: "segment"; readonly start: Point; readonly end: Point }
    | { readonly kind: "point"; readonly at: Point };
  readonly label?: string;
  readonly labelRole?: "label" | "instruction";
};

export interface DxfInterchangePackageManifest {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly cutGeometryAlgorithm: typeof CUT_GEOMETRY_ALGORITHM;
  readonly profileLabel: "generic-dxf-centimeters-with-recipe-marks";
  readonly limitations: readonly string[];
  readonly units: { readonly length: "cm"; readonly dxfInsunits: 5 };
  readonly drawingSha256: string;
  readonly recipe: { readonly id: string; readonly label: string };
  readonly options: GarmentOptions;
  readonly grade: {
    readonly selectedSize: { readonly label: string; readonly step: number };
    readonly sizeRun: GarmentRecipe["sizes"];
    readonly rule: GarmentRecipe["grade"];
  };
  readonly pieces: readonly {
    readonly id: string;
    readonly role: string;
    readonly name: string;
    readonly onFold: boolean;
    readonly edges: readonly string[];
    readonly blockName: string;
    readonly sourceRevisionId: string;
    readonly drawingTransform?: { readonly xOffset: number; readonly yOffset: number; readonly drawingHeight: number };
  }[];
  readonly patternMarks: readonly DxfPatternMarkRecord[];
  readonly stitches: Block["stitches"];
  readonly revisionId: string;
}

export interface DxfInterchangePackage {
  readonly dxf: string;
  readonly manifest: DxfInterchangePackageManifest;
}

function resolveOptions(recipe: GarmentRecipe, options: GarmentOptions, starterEntryId?: string): GarmentOptions {
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new Error("Package options must be a recipe option object");
  }
  const allDefinitions = recipe.options ?? [];
  const definitions = allDefinitions
    .filter((definition) => optionAppliesToStarterEntry(definition, starterEntryId))
    .sort((a, b) => a.id.localeCompare(b.id));
  const definitionsById = new Map(allDefinitions.map((definition) => [definition.id, definition]));
  const unknown = Object.keys(options).find((id) => {
    const definition = definitionsById.get(id);
    return definition === undefined || !optionAppliesToStarterEntry(definition, starterEntryId);
  });
  if (unknown) throw new Error(`Unsupported ${recipe.name} option "${unknown}"`);

  return Object.fromEntries(definitions.flatMap((definition) => {
    const supplied = Object.prototype.hasOwnProperty.call(options, definition.id);
    if (!supplied && definition.optional) return [];
    const value: unknown = supplied ? (options as Record<string, unknown>)[definition.id] : definition.defaultValue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${recipe.name} option "${definition.id}" must be a finite number`);
    }
    if (value < definition.min || value > definition.max) {
      throw new Error(`${recipe.name} option "${definition.id}" must be between ${definition.min} and ${definition.max}`);
    }
    if (definition.step <= 0 || Math.abs((value - definition.min) / definition.step - Math.round((value - definition.min) / definition.step)) > 1e-8) {
      throw new Error(`${recipe.name} option "${definition.id}" must match its ${definition.step} step`);
    }
    return [[definition.id, value]];
  }));
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record).filter((key) => record[key] !== undefined).sort()
      .map((key) => JSON.stringify(key) + ":" + canonicalJson(record[key]));
    return "{" + entries.join(",") + "}";
  }
  throw new Error("DXF package metadata must contain only JSON-compatible values");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hasCentimeterHeader(dxf: string): boolean {
  const lines = dxf.replace(/\r\n/g, "\n").split("\n");
  return lines.some((line, index) =>
    line === "$INSUNITS" && lines[index - 1] === "9" && lines[index + 1] === "70" && lines[index + 2] === "5",
  );
}

interface PieceIdentity {
  readonly id: string;
  readonly role: string;
  readonly blockName: string;
  readonly sourceRevisionId: string;
}

function dxfIdentifier(value: string): string {
  return value.normalize("NFKD").replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_|_$/gu, "").toUpperCase();
}

function baseMeasurementsForSize(recipe: GarmentRecipe, graded: GradedSize): Measurements {
  const base = { ...graded.measurements } as { -readonly [K in keyof Measurements]: number };
  for (const [rawKey, increment] of Object.entries(recipe.grade)) {
    const key = rawKey as keyof Measurements;
    base[key] = graded.measurements[key] - increment * graded.step;
  }
  return base;
}

async function pieceIdentities(
  recipe: GarmentRecipe,
  block: Block,
  options: GarmentOptions,
  graded: GradedSize,
): Promise<readonly PieceIdentity[]> {
  const sourceRevisionId = await sha256(canonicalJson({
    recipeId: recipe.name,
    options,
    selectedSize: { label: graded.label, step: graded.step },
    gradeRule: recipe.grade,
    patternBlock: block,
  }));
  const identities = Object.entries(block.roles).map(([role]) => {
    const id = `${recipe.name}:${role}`;
    return {
      id,
      role,
      sourceRevisionId,
      blockName: `IDR_${dxfIdentifier(recipe.name)}_${dxfIdentifier(role)}_${sourceRevisionId.slice(0, 16).toUpperCase()}`,
    };
  });
  if (new Set(identities.map(({ blockName }) => blockName)).size !== identities.length) {
    throw new Error("Piece block identity collision");
  }
  return identities;
}

function pieceRecords(
  recipe: GarmentRecipe,
  block: Block,
  identities: readonly PieceIdentity[],
  transforms: readonly { readonly xOffset: number; readonly yOffset: number; readonly drawingHeight: number }[],
): DxfInterchangePackageManifest["pieces"] {
  const identityByRole = new Map(identities.map((identity) => [identity.role, identity]));
  return Object.entries(block.roles).map(([role, piece], index) => {
    const identity = identityByRole.get(role)!;
    return {
      id: `${recipe.name}:${role}`,
      role,
      name: piece.name,
      onFold: piece.onFold,
      edges: piece.edges.map((edge) => edge.name),
      blockName: identity.blockName,
      sourceRevisionId: identity.sourceRevisionId,
      drawingTransform: transforms[index]!,
    };
  });
}

function patternMarkRecords(
  recipe: GarmentRecipe,
  block: Block,
  identities: readonly PieceIdentity[],
): readonly DxfPatternMarkRecord[] {
  const records: DxfPatternMarkRecord[] = [];
  const ids = new Set<string>();
  const identityByRole = new Map(identities.map((identity) => [identity.role, identity]));
  for (const [role, piece] of Object.entries(block.roles)) {
    const identity = identityByRole.get(role)!;
    const marks = piece.marks ?? [];
    let entityOrdinal = 3;
    for (const mark of marks) {
      const id = `${recipe.name}:${role}:mark:${mark.name}`;
      if (!mark.name.trim() || ids.has(id)) {
        throw new Error(`Pattern mark identity must be non-empty and unique: "${id}"`);
      }
      ids.add(id);
      const isLine = "start" in mark;
      const isCross = !isLine && mark.kind === "buttonhole";
      const entityCount = isCross ? 2 : 1;
      records.push({
        id,
        pieceId: `${recipe.name}:${role}`,
        entityOrdinal,
        blockName: identity.blockName,
        sourceRevisionId: identity.sourceRevisionId,
        name: mark.name,
        kind: mark.kind,
        entityType: isLine ? "LINE" : mark.kind === "button" ? "CIRCLE" : isCross ? "LINE" : "POINT",
        entityCount,
        ...(isCross ? { displayEncoding: "centered-cross/1" as const } : {}),
        layer: `MARK_${mark.kind.toUpperCase()}`,
        sourceGeometry: isLine
          ? { kind: "segment", start: mark.start, end: mark.end }
          : { kind: "point", at: mark.at },
        ...(mark.label !== undefined ? { label: mark.label } : {}),
        ...(mark.labelRole !== undefined ? { labelRole: mark.labelRole } : {}),
      });
      entityOrdinal += entityCount;
    }
  }
  return records;
}

function pieceBlockGroups(
  pieces: readonly Piece[],
  recipe: GarmentRecipe,
  identities: readonly PieceIdentity[],
): readonly { readonly name: string; readonly leadingEntityCount: number; readonly trailingEntityCount: number }[] {
  const notchesByPiece = new Map(recipe.notches.map((table) => [table.pieceName, table]));
  return pieces.map((piece, index) => {
    const identity = identities[index]!;
    const marks = (piece.marks ?? []).reduce((total, mark) =>
      total + (!("start" in mark) && mark.kind === "buttonhole" ? 2 : 1), 0);
    const notchTable = notchesByPiece.get(piece.name);
    return {
      name: identity.blockName,
      leadingEntityCount: 2 + marks,
      trailingEntityCount: notchTable ? notchTable.notches.length + 5 : 0,
    };
  });
}

function dxfEntityRefs(dxf: string): readonly { readonly type: string; readonly layer: string }[] {
  const lines = dxf.replace(/\r\n/g, "\n").split("\n");
  const refs: { type: string; layer: string }[] = [];
  let start = 0;
  while (start + 3 < lines.length && !(lines[start] === "0" && lines[start + 1] === "SECTION" &&
    lines[start + 2] === "2" && lines[start + 3] === "ENTITIES")) start += 1;
  if (start + 3 >= lines.length) return refs;
  for (let index = start + 4; index + 1 < lines.length;) {
    if (lines[index] !== "0") { index += 2; continue; }
    const type = lines[index + 1]!;
    if (type === "ENDSEC" || type === "EOF") break;
    if (type === "VERTEX" || type === "SEQEND") { index += 2; continue; }
    let layer = "";
    let next = index + 2;
    while (next + 1 < lines.length && lines[next] !== "0") {
      if (lines[next] === "8") layer = lines[next + 1]!;
      next += 2;
    }
    refs.push({ type, layer });
    index = next;
  }
  return refs;
}

export async function createDxfInterchangePackage(
  recipe: GarmentRecipe,
  graded: GradedSize,
  options: GarmentOptions = {},
  starterEntryId?: string,
): Promise<DxfInterchangePackage> {
  const baseOptions = resolveOptions(recipe, options, starterEntryId);
  const size = recipe.sizes.find((entry) => entry.label === graded.label);
  if (!size || size.step !== graded.step) {
    throw new Error(`Selected size "${graded.label}" does not match the recipe's grade table`);
  }

  const resolvedOptions = recipe.resolveOptionsForSize && graded.step !== 0
    ? recipe.resolveOptionsForSize({
      baseMeasurements: baseMeasurementsForSize(recipe, graded),
      sizeMeasurements: graded.measurements,
      step: graded.step,
      draft: recipe.draft,
      baseOptions,
    })
    : baseOptions;

  const sourceBlock = recipe.draft(graded.measurements, resolvedOptions);
  if (canonicalJson(sourceBlock) !== canonicalJson(graded.block)) {
    throw new Error("Selected pattern block does not match the recipe, size and options");
  }

  const pieces = blockPieces(sourceBlock);
  const cutOutlines = pieces.map((piece) => adaptiveSeamAllowance(piece, recipe.allowances));
  const layoutGapCm = recipe.name === "trouser"
    ? TROUSER_INTERCHANGE_LAYOUT_GAP_CM
    : DEFAULT_INTERCHANGE_LAYOUT_GAP_CM;
  const identities = await pieceIdentities(recipe, sourceBlock, resolvedOptions, graded);
  const sourceFlats = pieces.map((piece, index) => ({ name: piece.name, sew: outlinePoints(piece), cut: cutOutlines[index]! }));
  const layout = layoutPieces(sourceFlats, layoutGapCm);
  const transforms = pieces.map((_, index) => {
    const sourceBounds = polylineBounds(cutOutlines[index]!);
    const drawingBounds = polylineBounds(layout.pieces[index]!.cut);
    return {
      xOffset: drawingBounds.minX - sourceBounds.minX,
      yOffset: layout.pieces[index]!.cut[0]!.y - cutOutlines[index]![0]!.y,
      drawingHeight: layout.height,
    };
  });
  const flatDxf = exportDxfCentimeters(
    pieces, recipe.allowances, notchesForRecipeOptions(recipe, resolvedOptions), cutOutlines, "cross", layoutGapCm,
  );
  const dxf = wrapDxfEntitiesInNamedBlocks(flatDxf, pieceBlockGroups(pieces, recipe, identities));
  const drawingSha256 = await sha256(dxf);
  const core = {
    schemaVersion: SCHEMA_VERSION,
    cutGeometryAlgorithm: CUT_GEOMETRY_ALGORITHM,
    profileLabel: "generic-dxf-centimeters-with-recipe-marks" as const,
    limitations: [
      "The manifest supplements the DXF; it does not replace CUT/SEW geometry or visible construction marks.",
      "Buttonhole point crosses are display glyphs centered on source anchors, not cut or stitch paths.",
      "The profile label describes this package schema only and is not an apparel-standard or receiver-compatibility claim.",
    ],
    units: { length: "cm", dxfInsunits: 5 } as const,
    drawingSha256,
    recipe: { id: recipe.name, label: recipe.label },
    options: resolvedOptions,
    grade: {
      selectedSize: { label: graded.label, step: graded.step },
      sizeRun: recipe.sizes.map((entry) => ({ ...entry })),
      rule: { ...recipe.grade },
    },
    pieces: pieceRecords(recipe, sourceBlock, identities, transforms),
    patternMarks: patternMarkRecords(recipe, sourceBlock, identities),
    stitches: sourceBlock.stitches.map((stitch) => ({
      label: stitch.label,
      a: { edges: stitch.a.edges.map((reference) => ({ ...reference })) },
      b: { edges: stitch.b.edges.map((reference) => ({ ...reference })) },
      ...(stitch.ease ? { ease: { ...stitch.ease } } : {}),
    })),
  };
  const revisionId = await sha256(canonicalJson(core));
  return { dxf, manifest: { ...core, revisionId } };
}

export async function verifyDxfInterchangePackage(value: unknown): Promise<boolean> {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { dxf?: unknown; manifest?: unknown };
  if (typeof candidate.dxf !== "string" || candidate.manifest === null || typeof candidate.manifest !== "object") return false;
  const manifest = candidate.manifest as Record<string, unknown>;
  const schema = manifest.schemaVersion;
  const hasPieceBlocks = schema === SCHEMA_VERSION || schema === PREVIOUS_SCHEMA_VERSION;
  if (![SCHEMA_VERSION, PREVIOUS_SCHEMA_VERSION, OLDER_SCHEMA_VERSION, LEGACY_SCHEMA_VERSION].includes(schema as never) ||
      typeof manifest.drawingSha256 !== "string" || typeof manifest.revisionId !== "string") return false;
  if ([SCHEMA_VERSION, PREVIOUS_SCHEMA_VERSION, OLDER_SCHEMA_VERSION].includes(schema as never) &&
      manifest.cutGeometryAlgorithm !== CUT_GEOMETRY_ALGORITHM) return false;
  if (schema === LEGACY_SCHEMA_VERSION && manifest.cutGeometryAlgorithm !== undefined) return false;
  const units = manifest.units as { length?: unknown; dxfInsunits?: unknown } | undefined;
  if (units?.length !== "cm" || units.dxfInsunits !== 5 || !hasCentimeterHeader(candidate.dxf)) return false;
  if (await sha256(candidate.dxf) !== manifest.drawingSha256) return false;
  if (!Array.isArray(manifest.patternMarks)) return false;
  const ids = new Set<string>();
  const ordinals = new Set<string>();
  let refs: readonly { readonly type: string; readonly layer: string }[] = [];
  let blocksByName = new Map<string, readonly string[]>();
  let piecesByBlock = new Map<string, Record<string, unknown>>();
  if (hasPieceBlocks) {
    if (!Array.isArray(manifest.pieces) || manifest.pieces.length === 0 ||
        manifest.recipe === null || typeof manifest.recipe !== "object") return false;
    const recipe = manifest.recipe as Record<string, unknown>;
    if (typeof recipe.id !== "string") return false;
    for (const value of manifest.pieces) {
      if (value === null || typeof value !== "object") return false;
      const piece = value as Record<string, unknown>;
      if (typeof piece.id !== "string" || typeof piece.role !== "string" ||
          piece.id !== `${recipe.id}:${piece.role}` || typeof piece.blockName !== "string" ||
          !/^[A-Z0-9_]{1,200}$/u.test(piece.blockName) || typeof piece.sourceRevisionId !== "string" ||
          !/^[a-f0-9]{64}$/u.test(piece.sourceRevisionId) ||
          !piece.blockName.endsWith(piece.sourceRevisionId.slice(0, 16).toUpperCase()) ||
          piecesByBlock.has(piece.blockName)) return false;
      if (schema === SCHEMA_VERSION) {
        const transform = piece.drawingTransform as Record<string, unknown> | undefined;
        if (!transform || !Number.isFinite(transform.xOffset) || !Number.isFinite(transform.yOffset) ||
            !Number.isFinite(transform.drawingHeight)) return false;
      }
      piecesByBlock.set(piece.blockName, piece);
    }
    try {
      const drawing = readNamedDxfDrawing(candidate.dxf);
      const blockNames = new Set(drawing.blocks.map((block) => block.name));
      if (blockNames.size !== drawing.blocks.length || blockNames.size !== piecesByBlock.size ||
          drawing.inserts.length !== piecesByBlock.size || new Set(drawing.inserts.map(({ name }) => name)).size !== drawing.inserts.length ||
          drawing.inserts.some(({ name }) => !piecesByBlock.has(name) || !blockNames.has(name))) return false;
      expandNamedDxfDrawing(candidate.dxf);
      blocksByName = new Map(drawing.blocks.map((block) => [block.name, block.entities]));
      for (const entities of blocksByName.values()) {
        const types = entities.map((entity) => dxfEntityTypeAndLayer(entity).type);
        if (types.filter((type) => type === "POLYLINE" || type === "LWPOLYLINE").length < 2) return false;
      }
    } catch {
      return false;
    }
  } else {
    refs = dxfEntityRefs(candidate.dxf);
  }
  for (const value of manifest.patternMarks) {
    if (value === null || typeof value !== "object") return false;
    const mark = value as Partial<DxfPatternMarkRecord>;
    if (typeof mark.id !== "string" || !mark.id || ids.has(mark.id)) return false;
    if (typeof mark.pieceId !== "string" || typeof mark.name !== "string" || !mark.name.trim()) return false;
    if (!Number.isInteger(mark.entityOrdinal)) return false;
    const ordinal = mark.entityOrdinal as number;
    if (ordinal < 1) return false;
    if (typeof mark.entityType !== "string" || typeof mark.layer !== "string") return false;
    if (hasPieceBlocks) {
      if (typeof mark.blockName !== "string" || typeof mark.sourceRevisionId !== "string") return false;
      const piece = piecesByBlock.get(mark.blockName);
      const entities = blocksByName.get(mark.blockName);
      const entityKey = `${mark.blockName}:${ordinal}`;
      if (!piece || !entities || mark.pieceId !== piece.id || mark.sourceRevisionId !== piece.sourceRevisionId || ordinals.has(entityKey)) return false;
      const entityCount = schema === SCHEMA_VERSION ? mark.entityCount : 1;
      if (!Number.isInteger(entityCount) || (entityCount !== 1 && entityCount !== 2)) return false;
      const isCross = schema === SCHEMA_VERSION && mark.displayEncoding === "centered-cross/1";
      if (isCross && (entityCount !== 2 || mark.entityType !== "LINE" || mark.kind !== "buttonhole" || mark.layer !== "MARK_BUTTONHOLE" ||
          !mark.sourceGeometry || mark.sourceGeometry.kind !== "point")) return false;
      if (!isCross && (entityCount !== 1 || mark.displayEncoding !== undefined)) return false;
      const markEntities = entities.slice(ordinal - 1, ordinal - 1 + entityCount);
      if (markEntities.length !== entityCount || markEntities.some((entity) => {
        const identity = dxfEntityTypeAndLayer(entity);
        return identity.type !== mark.entityType || identity.layer !== mark.layer;
      })) return false;
      if (isCross) {
        const transform = piece.drawingTransform as { xOffset: number; yOffset: number; drawingHeight: number };
        const geometry = mark.sourceGeometry as { kind: "point"; at: Point };
        if (!Number.isFinite(geometry.at?.x) || !Number.isFinite(geometry.at?.y)) return false;
        const centerX = geometry.at.x + transform.xOffset;
        const centerY = transform.drawingHeight - (geometry.at.y + transform.yOffset);
        const coordinates = markEntities.map((entity) => {
          const pairs = entity.trim().split(/\r?\n/u);
          const values = new Map<number, string>();
          for (let index = 0; index + 1 < pairs.length; index += 2) values.set(Number(pairs[index]), pairs[index + 1]!);
          return [10, 20, 11, 21].map((code) => Number(values.get(code)));
        });
        const expected = [
          [centerX - 0.25, centerY, centerX + 0.25, centerY],
          [centerX, centerY - 0.25, centerX, centerY + 0.25],
        ];
        if (coordinates.some((line, index) => line.some((value, coordinate) =>
          !Number.isFinite(value) || Math.abs(value - expected[index]![coordinate]!) > 0.000001))) return false;
      }
      for (let offset = 0; offset < entityCount; offset += 1) {
        const currentKey = `${mark.blockName}:${ordinal + offset}`;
        ordinals.add(currentKey);
      }
    } else {
      if (ordinals.has(String(ordinal))) return false;
      const entity = refs[ordinal - 1];
      if (!entity || entity.type !== mark.entityType || entity.layer !== mark.layer) return false;
      ordinals.add(String(ordinal));
    }
    ids.add(mark.id);
  }
  const { revisionId, ...core } = manifest;
  try {
    return await sha256(canonicalJson(core)) === revisionId;
  } catch {
    return false;
  }
}
