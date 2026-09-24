import { MIN_PRINT_PX_PER_CM } from "../../guidance/surface-notes";
import {
  ARTWORK_CATALOG,
  describeArtworkApiRightsEvidence,
  type ArtworkCatalogRecord,
  type ArtworkCategory,
  type ArtworkGarmentFamily,
  type ArtworkPieceRoleGroup,
  type ArtworkPrintUse,
} from "./catalog";

export interface ArtworkCatalogFilters {
  readonly categories?: readonly ArtworkCategory[];
  readonly garmentFamilies?: readonly ArtworkGarmentFamily[];
  readonly pieceRoleGroups?: readonly ArtworkPieceRoleGroup[];
  readonly printUses?: readonly ArtworkPrintUse[];
}

export interface ArtworkCatalogSearch {
  readonly query?: string;
  readonly filters?: ArtworkCatalogFilters;
}

export type ArtworkSuitabilityLevel = "recommended" | "possible" | "needs-review";

export interface ArtworkPlacementScale {
  /** Defaults to the record's suggested maximum. */
  readonly widthCm?: number;
  /** Defaults to a height that preserves the source image's aspect ratio. */
  readonly heightCm?: number;
}

export interface ArtworkUseAssessment {
  readonly assetId: ArtworkCatalogRecord["assetId"];
  readonly printUse: ArtworkPrintUse;
  readonly level: ArtworkSuitabilityLevel;
  readonly reason: string;
  readonly assessedWidthCm: number | null;
  readonly assessedHeightCm: number | null;
  readonly estimatedPxPerCm: number | null;
  readonly selectable: true;
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLowerCase().trim().replace(/\s+/gu, " ");
}

function searchableValues(record: ArtworkCatalogRecord): readonly string[] {
  return [
    record.title,
    record.description,
    ...record.tags,
    record.creator,
    record.culture,
    record.date,
    record.medium,
    record.source.institution,
    record.source.itemRecordUrl,
    record.source.itemIdentifier,
    record.source.creditLine,
    record.source.rightsLabel,
    describeArtworkApiRightsEvidence(record.source.apiRightsEvidence),
  ];
}

function matchesValues<T>(selected: readonly T[] | undefined, available: readonly T[]): boolean {
  if (selected === undefined || selected.length === 0) return true;
  return selected.some((value) => available.includes(value));
}

function matchesSearch(record: ArtworkCatalogRecord, query: string): boolean {
  return searchableValues(record).some((value) => normalizeSearchText(value).includes(query));
}

function matchesFilters(record: ArtworkCatalogRecord, filters: ArtworkCatalogFilters): boolean {
  return matchesValues(filters.categories, record.categories) &&
    matchesValues(filters.garmentFamilies, record.use.garmentFamilies) &&
    matchesValues(filters.pieceRoleGroups, record.use.pieceRoleGroups) &&
    matchesValues(filters.printUses, record.use.printUses);
}

/** Literal normalized phrase search plus OR-within-field / AND-across-field filters. */
export function searchArtworkCatalog(
  request: ArtworkCatalogSearch = {},
  catalog: readonly ArtworkCatalogRecord[] = ARTWORK_CATALOG,
): readonly ArtworkCatalogRecord[] {
  const query = normalizeSearchText(request.query ?? "");
  const filters = request.filters ?? {};
  return catalog.filter((record) => matchesSearch(record, query) && matchesFilters(record, filters));
}

const ADVISORY_SUFFIX =
  " This reference remains selectable. Guidance does not change design values or validate production printing, physical fit, or sewability.";
const KNOWN_PRESENTATIONS: readonly string[] = ["textile-photograph", "paper-study", "clean-artwork"];
const KNOWN_DIRECTIONALITIES: readonly string[] = ["upright", "vertical-bands"];

function assessment(
  record: ArtworkCatalogRecord,
  printUse: ArtworkPrintUse,
  level: ArtworkSuitabilityLevel,
  reason: string,
  widthCm: number | null,
  heightCm: number | null,
  pxPerCm: number | null,
): ArtworkUseAssessment {
  return {
    assetId: record.assetId,
    printUse,
    level,
    reason: `${reason}${ADVISORY_SUFFIX}`,
    assessedWidthCm: widthCm,
    assessedHeightCm: heightCm,
    estimatedPxPerCm: pxPerCm,
    selectable: true,
  };
}

function hasCompleteProvenance(record: ArtworkCatalogRecord): boolean {
  const source = record.source;
  const requiredText = [
    record.assetId,
    record.title,
    record.creator,
    source.institution,
    source.itemRecordUrl,
    source.apiRecordUrl,
    source.originalImageUrl,
    source.originalImageFilename,
    String(source.apiInternalId),
    source.creditLine,
    source.reusePolicyUrl,
    source.checkedOn,
    record.retrievedOn,
    record.modification,
    record.image.filename,
    record.image.mimeType,
    record.image.sha256,
    record.image.localImageUrl,
    record.technical.repeatEvidence,
    record.technical.seamlessEvidence,
    record.technical.directionEvidence,
  ];
  const evidence = source.apiRightsEvidence;
  const apiRightsVerified = evidence?.kind === "met-public-domain-flag"
    ? evidence.field === "isPublicDomain" && evidence.value === true
    : evidence?.kind === "cma-cc0-share-status" &&
      evidence.field === "share_license_status" &&
      evidence.value === "CC0" &&
      evidence.copyright === null;
  return requiredText.every((value) => value.trim().length > 0) &&
    /^[\da-f]{64}$/iu.test(record.image.sha256) &&
    source.rightsLabel === "Public Domain" &&
    Number.isInteger(source.apiInternalId) && source.apiInternalId > 0 &&
    /^\d{4}-\d{2}-\d{2}$/u.test(source.checkedOn) &&
    /^\d{4}-\d{2}-\d{2}$/u.test(record.retrievedOn) &&
    apiRightsVerified;
}

/** Explain one print-use decision without filtering, disabling, or editing the asset. */
export function assessArtworkUse(
  record: ArtworkCatalogRecord,
  printUse: ArtworkPrintUse,
  placement: ArtworkPlacementScale = {},
): ArtworkUseAssessment {
  const range = record.use.suggestedPlacementWidthCm;
  if (![range.minimum, range.maximum].every(Number.isFinite) ||
      range.minimum <= 0 || range.maximum < range.minimum) {
    return assessment(
      record,
      printUse,
      "needs-review",
      "The catalog does not have a usable suggested width range. Review its scale guidance before applying this reference.",
      null,
      null,
      null,
    );
  }

  const widthCm = placement.widthCm ?? range.maximum;
  if (!Number.isFinite(widthCm) || widthCm <= 0) {
    return assessment(
      record,
      printUse,
      "needs-review",
      "Enter a positive, finite placement width in centimetres before assessing scale.",
      null,
      null,
      null,
    );
  }

  if (!hasCompleteProvenance(record)) {
    return assessment(
      record,
      printUse,
      "needs-review",
      "The source, rights, or local asset record is incomplete. Verify its provenance before use.",
      widthCm,
      null,
      null,
    );
  }

  if (!record.use.printUses.includes(printUse)) {
    return assessment(
      record,
      printUse,
      "needs-review",
      `This reference was not curated for ${printUse} use. Review it before applying.`,
      widthCm,
      null,
      null,
    );
  }

  const { widthPx, heightPx } = record.image;
  if (![widthPx, heightPx].every((value) => Number.isFinite(value) && value > 0)) {
    return assessment(
      record,
      printUse,
      "needs-review",
      "The source image dimensions are not usable, so its print resolution cannot be assessed. Verify the file.",
      widthCm,
      null,
      null,
    );
  }

  const heightCm = placement.heightCm ?? widthCm * heightPx / widthPx;
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    return assessment(
      record,
      printUse,
      "needs-review",
      "Enter a positive, finite placement height in centimetres before assessing scale.",
      widthCm,
      null,
      null,
    );
  }

  const xPxPerCm = widthPx / widthCm;
  const yPxPerCm = heightPx / heightCm;
  const estimatedPxPerCm = Math.min(xPxPerCm, yPxPerCm);
  if (!Number.isFinite(xPxPerCm) || !Number.isFinite(yPxPerCm)) {
    return assessment(
      record,
      printUse,
      "needs-review",
      "The selected placement scale cannot be assessed. Enter practical, finite width and height values.",
      widthCm,
      heightCm,
      null,
    );
  }

  const blockers: string[] = [];
  if (estimatedPxPerCm < MIN_PRINT_PX_PER_CM) {
    blockers.push(
      `At ${widthCm} × ${heightCm} cm, the lower-axis source estimate is about ${Math.floor(estimatedPxPerCm)} px/cm, below the app's ${MIN_PRINT_PX_PER_CM} px/cm print-guidance floor. Reduce the placement size or choose a higher-resolution source.`,
    );
  }
  if (printUse === "all-over" && record.technical.imageIsSeamlessTile !== true) {
    blockers.push("The bundled image is not a verified seamless repeat tile; review or prepare a repeat before all-over use.");
  }
  if (!KNOWN_PRESENTATIONS.includes(record.technical.presentation)) {
    blockers.push("The source image presentation is unconfirmed or unrecognized, so its visible background or edges need review.");
  }
  if (blockers.length > 0) {
    return assessment(record, printUse, "needs-review", blockers.join(" "), widthCm, heightCm, estimatedPxPerCm);
  }

  const caveats: string[] = [];
  if ((printUse === "all-over" || printUse === "border/trim") && record.technical.repeatMotif !== "visible") {
    caveats.push("Repeat boundaries are unconfirmed for this use.");
  }
  if (printUse === "border/trim" && record.technical.imageIsSeamlessTile !== true) {
    caveats.push("A production repeat or trim unit is not verified; check alignment where this motif repeats.");
  }
  if (!KNOWN_DIRECTIONALITIES.includes(record.technical.directionality)) {
    caveats.push("Artwork directionality is unconfirmed or unrecognized; check its orientation for this placement.");
  }
  if (record.technical.presentation === "textile-photograph") {
    caveats.push("This is a museum photograph of a textile, so specimen edges or background may remain visible.");
  }
  if (record.technical.presentation === "paper-study") {
    caveats.push("This is a photographed paper design study, so paper margins or surface may remain visible.");
  }
  if (widthCm < range.minimum || widthCm > range.maximum) {
    caveats.push(`The selected ${widthCm} cm width is outside the curator's ${range.minimum}–${range.maximum} cm starting range.`);
  }

  if (caveats.length > 0) {
    return assessment(
      record,
      printUse,
      "possible",
      `${caveats.join(" ")} Inspect the image and use the existing resolution guidance.`,
      widthCm,
      heightCm,
      estimatedPxPerCm,
    );
  }

  return assessment(
    record,
    printUse,
    "recommended",
    `Catalog evidence supports ${printUse} use at ${widthCm} × ${heightCm} cm, with about ${Math.floor(estimatedPxPerCm)} px/cm and no recorded use-specific limitation.`,
    widthCm,
    heightCm,
    estimatedPxPerCm,
  );
}
