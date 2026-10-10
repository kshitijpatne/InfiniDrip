import type { Block } from "../drafting/block";
import type { GarmentOptions } from "../drafting/options";
import type { GarmentRecipe } from "../drafting/recipe";
import type { GradedSize } from "../drafting/grading";
import { blockPieces } from "../drafting/block";
import { exportDxfCentimeters } from "./dxf-centimeters";

const SCHEMA_VERSION = "infinidrip.g04.dxf-package/1" as const;

export interface DxfInterchangePackageManifest {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly profileLabel: "generic-dxf-centimeters-with-recipe-marks";
  readonly limitations: readonly string[];
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
  readonly stitches: Block["stitches"];
  readonly revisionId: string;
}

export interface DxfInterchangePackage {
  readonly dxf: string;
  readonly manifest: DxfInterchangePackageManifest;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new Error("DXF package metadata must contain only JSON-compatible values");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

export async function createDxfInterchangePackage(
  recipe: GarmentRecipe,
  graded: GradedSize,
  options: GarmentOptions = {},
): Promise<DxfInterchangePackage> {
  const size = recipe.sizes.find((entry) => entry.label === graded.label);
  if (!size || size.step !== graded.step) {
    throw new Error(`Selected size "${graded.label}" does not match the recipe's grade table`);
  }

  const sourceBlock = recipe.draft(graded.measurements, options);
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
    drawingSha256,
    recipe: { id: recipe.name, label: recipe.label },
    options: { ...options },
    grade: {
      selectedSize: { label: graded.label, step: graded.step },
      sizeRun: recipe.sizes.map((entry) => ({ ...entry })),
      rule: { ...recipe.grade },
    },
    pieces: pieceRecords(recipe, sourceBlock),
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
  if (await sha256(candidate.dxf) !== manifest.drawingSha256) return false;
  const { revisionId, ...core } = manifest;
  try {
    return await sha256(canonicalJson(core)) === revisionId;
  } catch {
    return false;
  }
}
