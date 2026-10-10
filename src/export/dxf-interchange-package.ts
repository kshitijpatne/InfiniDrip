import type { Block } from "../drafting/block";
import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe } from "../drafting/recipe";
import type { GradedSize } from "../drafting/grading";
import type { PatternMark } from "../drafting/pattern-mark";
import type { Point } from "../geometry";
import { blockPieces } from "../drafting/block";
import { exportDxfCentimeters } from "./dxf-centimeters";

const SCHEMA_VERSION = "infinidrip.g04.dxf-package/2" as const;

type DxfPatternMarkRecord = {
  readonly id: string;
  readonly pieceId: string;
  readonly entityOrdinal: number;
  readonly name: string;
  readonly kind: PatternMark["kind"];
  readonly entityType: "LINE" | "CIRCLE" | "POINT";
  readonly layer: string;
  readonly sourceGeometry:
    | { readonly kind: "segment"; readonly start: Point; readonly end: Point }
    | { readonly kind: "point"; readonly at: Point };
  readonly label?: string;
  readonly labelRole?: "label" | "instruction";
};

export interface DxfInterchangePackageManifest {
  readonly schemaVersion: typeof SCHEMA_VERSION;
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
  }[];
  readonly patternMarks: readonly DxfPatternMarkRecord[];
  readonly stitches: Block["stitches"];
  readonly revisionId: string;
}

export interface DxfInterchangePackage {
  readonly dxf: string;
  readonly manifest: DxfInterchangePackageManifest;
}

function resolveOptions(recipe: GarmentRecipe, options: GarmentOptions): GarmentOptions {
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new Error("Package options must be a recipe option object");
  }
  const definitions = [...(recipe.options ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  const unknown = Object.keys(options).find((id) => !definitionsById.has(id));
  if (unknown) throw new Error(`Unsupported ${recipe.name} option "${unknown}"`);

  return Object.fromEntries(definitions.map((definition) => {
    const supplied = Object.prototype.hasOwnProperty.call(options, definition.id);
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
    return [definition.id, value];
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

function pieceRecords(recipe: GarmentRecipe, block: Block): DxfInterchangePackageManifest["pieces"] {
  return Object.entries(block.roles).map(([role, piece]) => ({
    id: `${recipe.name}:${role}`,
    role,
    name: piece.name,
    onFold: piece.onFold,
    edges: piece.edges.map((edge) => edge.name),
  }));
}

function patternMarkRecords(recipe: GarmentRecipe, block: Block): readonly DxfPatternMarkRecord[] {
  const records: DxfPatternMarkRecord[] = [];
  const ids = new Set<string>();
  let entityOrdinal = 1;
  for (const [role, piece] of Object.entries(block.roles)) {
    const marks = piece.marks ?? [];
    for (const [markIndex, mark] of marks.entries()) {
      const id = `${recipe.name}:${role}:mark:${mark.name}`;
      if (!mark.name.trim() || ids.has(id)) {
        throw new Error(`Pattern mark identity must be non-empty and unique: "${id}"`);
      }
      ids.add(id);
      const isLine = "start" in mark;
      records.push({
        id,
        pieceId: `${recipe.name}:${role}`,
        entityOrdinal: entityOrdinal + 2 + markIndex,
        name: mark.name,
        kind: mark.kind,
        entityType: isLine ? "LINE" : mark.kind === "button" ? "CIRCLE" : "POINT",
        layer: `MARK_${mark.kind.toUpperCase()}`,
        sourceGeometry: isLine
          ? { kind: "segment", start: mark.start, end: mark.end }
          : { kind: "point", at: mark.at },
        ...(mark.label !== undefined ? { label: mark.label } : {}),
        ...(mark.labelRole !== undefined ? { labelRole: mark.labelRole } : {}),
      });
    }
    entityOrdinal += 2 + marks.length;
  }
  return records;
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
): Promise<DxfInterchangePackage> {
  const resolvedOptions = resolveOptions(recipe, options);
  const size = recipe.sizes.find((entry) => entry.label === graded.label);
  if (!size || size.step !== graded.step) {
    throw new Error(`Selected size "${graded.label}" does not match the recipe's grade table`);
  }

  const sourceBlock = recipe.draft(graded.measurements, resolvedOptions);
  if (canonicalJson(sourceBlock) !== canonicalJson(graded.block)) {
    throw new Error("Selected pattern block does not match the recipe, size and options");
  }

  const dxf = exportDxfCentimeters(blockPieces(sourceBlock), recipe.allowances, recipe.notches);
  const drawingSha256 = await sha256(dxf);
  const core = {
    schemaVersion: SCHEMA_VERSION,
    profileLabel: "generic-dxf-centimeters-with-recipe-marks" as const,
    limitations: [
      "The manifest supplements the DXF; it does not replace CUT/SEW geometry or visible construction marks.",
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
    pieces: pieceRecords(recipe, sourceBlock),
    patternMarks: patternMarkRecords(recipe, sourceBlock),
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
  if (manifest.schemaVersion !== SCHEMA_VERSION || typeof manifest.drawingSha256 !== "string" || typeof manifest.revisionId !== "string") return false;
  const units = manifest.units as { length?: unknown; dxfInsunits?: unknown } | undefined;
  if (units?.length !== "cm" || units.dxfInsunits !== 5 || !hasCentimeterHeader(candidate.dxf)) return false;
  if (await sha256(candidate.dxf) !== manifest.drawingSha256) return false;
  if (!Array.isArray(manifest.patternMarks)) return false;
  const refs = dxfEntityRefs(candidate.dxf);
  const ids = new Set<string>();
  const ordinals = new Set<number>();
  for (const value of manifest.patternMarks) {
    if (value === null || typeof value !== "object") return false;
    const mark = value as Partial<DxfPatternMarkRecord>;
    if (typeof mark.id !== "string" || !mark.id || ids.has(mark.id)) return false;
    if (typeof mark.pieceId !== "string" || typeof mark.name !== "string" || !mark.name.trim()) return false;
    if (!Number.isInteger(mark.entityOrdinal)) return false;
    const ordinal = mark.entityOrdinal as number;
    if (ordinal < 1 || ordinals.has(ordinal)) return false;
    if (typeof mark.entityType !== "string" || typeof mark.layer !== "string") return false;
    const entity = refs[ordinal - 1];
    if (!entity || entity.type !== mark.entityType || entity.layer !== mark.layer) return false;
    ids.add(mark.id);
    ordinals.add(ordinal);
  }
  const { revisionId, ...core } = manifest;
  try {
    return await sha256(canonicalJson(core)) === revisionId;
  } catch {
    return false;
  }
}
