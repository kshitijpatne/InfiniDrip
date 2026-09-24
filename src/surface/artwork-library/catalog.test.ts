import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ARTWORK_CATALOG, ARTWORK_CATEGORIES, GARMENT_FAMILIES, PIECE_ROLE_GROUPS, PRINT_USES } from "./catalog";
import { assessArtworkUse } from "./search";

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Not a JPEG image.");
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("Malformed JPEG marker.");
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const segmentLength = bytes.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  throw new Error("JPEG dimensions were not found.");
}

describe("bundled artwork catalog", () => {
  it("uses unique stable built-in IDs and the approved searchable vocabularies", () => {
    const ids = ARTWORK_CATALOG.map((record) => record.assetId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^builtin-(?:met|cma)-\d+$/u.test(id))).toBe(true);
    expect(ARTWORK_CATALOG).toHaveLength(12);
    expect(ARTWORK_CATALOG.filter((record) => record.assetId.startsWith("builtin-cma-"))
      .map((record) => record.assetId))
      .toEqual(["builtin-cma-109638", "builtin-cma-167454", "builtin-cma-95605", "builtin-cma-111658"]);
    expect(new Set(ARTWORK_CATALOG.flatMap((record) => record.categories))).toEqual(new Set(ARTWORK_CATEGORIES));
    expect(ARTWORK_CATEGORIES).toEqual([
      "geometric",
      "stripe/check/grid",
      "dot/spot",
      "botanical/floral",
      "organic/natural",
      "abstract",
      "ornamental/traditional",
      "typography/logo",
      "texture/material",
      "novelty/illustrative",
    ]);
    expect(GARMENT_FAMILIES).toEqual(["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"]);
    expect(PIECE_ROLE_GROUPS).toContain("front");
    expect(PRINT_USES).toEqual(["all-over", "border/trim", "panel", "focal graphic", "placement"]);
  });

  it("verifies required provenance, local asset paths, image dimensions, and exact bytes for every record", () => {
    for (const record of ARTWORK_CATALOG) {
      expect(record.title.length).toBeGreaterThan(0);
      expect(record.description.length).toBeGreaterThan(0);
      expect(record.creator.length).toBeGreaterThan(0);
      expect(record.culture.length).toBeGreaterThan(0);
      expect(record.date.length).toBeGreaterThan(0);
      expect(record.medium.length).toBeGreaterThan(0);
      const isMet = record.assetId.startsWith("builtin-met-");
      expect(record.source.institution).toBe(isMet ? "The Metropolitan Museum of Art" : "Cleveland Museum of Art");
      expect(record.source.rightsLabel).toBe("Public Domain");
      expect(record.source.apiInternalId).toBe(Number(record.assetId.substring(record.assetId.lastIndexOf("-") + 1)));
      if (isMet) {
        expect(record.source.apiRightsEvidence).toEqual({
          kind: "met-public-domain-flag", field: "isPublicDomain", value: true,
        });
      } else {
        expect(record.source.apiRightsEvidence).toEqual({
          kind: "cma-cc0-share-status", field: "share_license_status", value: "CC0", copyright: null,
        });
      }
      expect(record.source.creditLine.length).toBeGreaterThan(0);
      const sourcePathParts = new URL(record.source.originalImageUrl).pathname.split("/");
      expect(record.source.originalImageFilename).toBe(sourcePathParts[sourcePathParts.length - 1]);
      const expectedHosts = isMet
        ? ["www.metmuseum.org", "collectionapi.metmuseum.org", "images.metmuseum.org"]
        : ["www.clevelandart.org", "openaccess-api.clevelandart.org", "openaccess-cdn.clevelandart.org"];
      expect(new URL(record.source.itemRecordUrl).hostname).toBe(expectedHosts[0]);
      expect(new URL(record.source.apiRecordUrl).hostname).toBe(expectedHosts[1]);
      expect(new URL(record.source.originalImageUrl).hostname).toBe(expectedHosts[2]);
      expect(record.source.reusePolicyUrl).toContain(isMet ? "metmuseum.org" : "clevelandart.org");
      expect(record.source.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(record.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(record.modification).toBe(isMet
        ? "Unmodified Met primaryImage JPEG bytes."
        : "Unmodified CMA print rendition JPEG bytes.");
      expect(record.image.mimeType).toBe("image/jpeg");
      expect(record.image.format).toBe("raster");
      expect(record.image.hasTransparency).toBe(false);
      expect(record.categories.length).toBeGreaterThan(0);
      expect(record.categories.every((category) => ARTWORK_CATEGORIES.includes(category))).toBe(true);
      expect(record.tags.length).toBeGreaterThan(0);
      expect(record.technical.repeatEvidence.length).toBeGreaterThan(0);
      expect(["textile-photograph", "paper-study"].includes(record.technical.presentation)).toBe(true);
      expect(record.technical.imageIsSeamlessTile).toBe(false);
      expect(record.technical.seamlessEvidence.length).toBeGreaterThan(0);
      expect(record.technical.directionEvidence.length).toBeGreaterThan(0);
      expect(record.use.printUses.length).toBeGreaterThan(0);
      expect(record.use.printUses.every((use) => PRINT_USES.includes(use))).toBe(true);
      expect(record.use.garmentFamilies.every((family) => GARMENT_FAMILIES.includes(family))).toBe(true);
      expect(record.use.pieceRoleGroups.length).toBeGreaterThan(0);
      expect(record.use.pieceRoleGroups.every((group) => PIECE_ROLE_GROUPS.includes(group))).toBe(true);
      expect(record.use.suggestedPlacementWidthCm.minimum).toBeGreaterThan(0);
      expect(record.use.suggestedPlacementWidthCm.maximum).toBeGreaterThan(record.use.suggestedPlacementWidthCm.minimum);
      expect(record.use.suggestedPlacementWidthCm.basis.length).toBeGreaterThan(0);

      const expectedLocalUrl = new URL(`./assets/${record.image.filename}`, import.meta.url);
      const actualLocalUrl = new URL(record.image.localImageUrl, import.meta.url);
      expect(actualLocalUrl.protocol).toBe(expectedLocalUrl.protocol);
      expect(actualLocalUrl.host).toBe(expectedLocalUrl.host);
      expect(actualLocalUrl.pathname).toBe(expectedLocalUrl.pathname);
      expect(record.image.localImageUrl).not.toBe(record.source.originalImageUrl);

      const bytes = readFileSync(fileURLToPath(expectedLocalUrl));
      expect(bytes.byteLength).toBe(record.image.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(record.image.sha256);
      expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
      expect(readJpegDimensions(bytes)).toEqual({ width: record.image.widthPx, height: record.image.heightPx });
    }
  });

  it("uses the real CMA CC0 evidence in advisory checks and fills the selected taxonomy gaps", () => {
    const cmaRecords = ARTWORK_CATALOG.filter((record) => record.assetId.startsWith("builtin-cma-"));
    for (const record of cmaRecords) {
      const result = assessArtworkUse(record, "panel");
      expect(result.level).toBe("possible");
      expect(result.selectable).toBe(true);
      expect(result.reason).toContain("This reference remains selectable.");
    }
    expect(cmaRecords.find((record) => record.assetId === "builtin-cma-109638")?.categories)
      .toContain("typography/logo");
    expect(cmaRecords.find((record) => record.assetId === "builtin-cma-109638")?.categories)
      .toContain("abstract");
    expect(cmaRecords.find((record) => record.assetId === "builtin-cma-111658")?.categories)
      .toContain("dot/spot");
  });
});
