/**
 * The bundled V1 artwork reference catalog.
 *
 * `localImageUrl` is the only URL intended for rendering. Museum page, API,
 * and original-image URLs below are provenance text and must never be fetched
 * by the application.
 */

export const ARTWORK_CATEGORIES = [
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
] as const;

export type ArtworkCategory = typeof ARTWORK_CATEGORIES[number];

export const PRINT_USES = ["all-over", "border/trim", "panel", "focal graphic", "placement"] as const;
export type ArtworkPrintUse = typeof PRINT_USES[number];

export const GARMENT_FAMILIES = ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"] as const;
export type ArtworkGarmentFamily = typeof GARMENT_FAMILIES[number];

export const PIECE_ROLE_GROUPS = [
  "front",
  "back",
  "sleeve",
  "collar",
  "placket",
  "pocket",
  "skirt-panel",
  "trouser-leg",
] as const;
export type ArtworkPieceRoleGroup = typeof PIECE_ROLE_GROUPS[number];

export type ArtworkApiRightsEvidence =
  | {
    readonly kind: "met-public-domain-flag";
    readonly field: "isPublicDomain";
    readonly value: true;
  }
  | {
    readonly kind: "cma-cc0-share-status";
    readonly field: "share_license_status";
    readonly value: "CC0";
    readonly copyright: null;
  };

export function describeArtworkApiRightsEvidence(evidence: ArtworkApiRightsEvidence): string {
  return evidence.kind === "met-public-domain-flag"
    ? "The Met API: isPublicDomain = true"
    : "CMA API: share_license_status = CC0; copyright = null";
}

export interface ArtworkCatalogRecord {
  readonly assetId: `builtin-met-${number}` | `builtin-cma-${number}`;
  readonly title: string;
  readonly description: string;
  readonly creator: string;
  readonly culture: string;
  readonly date: string;
  readonly medium: string;
  readonly source: {
    readonly institution: "The Metropolitan Museum of Art" | "Cleveland Museum of Art";
    readonly itemIdentifier: string;
    readonly apiInternalId: number;
    readonly itemRecordUrl: string;
    readonly apiRecordUrl: string;
    /** Provenance only; never use as an image source at runtime. */
    readonly originalImageUrl: string;
    readonly originalImageFilename: string;
    /** Item-page label; API evidence is captured separately without conflating rights mechanisms. */
    readonly rightsLabel: "Public Domain";
    readonly apiRightsEvidence: ArtworkApiRightsEvidence;
    readonly creditLine: string;
    readonly reusePolicyUrl: string;
    readonly checkedOn: string;
  };
  readonly retrievedOn: string;
  readonly modification: "Unmodified Met primaryImage JPEG bytes." | "Unmodified CMA print rendition JPEG bytes.";
  readonly image: {
    readonly filename: string;
    readonly mimeType: "image/jpeg";
    readonly format: "raster";
    readonly widthPx: number;
    readonly heightPx: number;
    readonly byteLength: number;
    readonly sha256: string;
    readonly hasTransparency: false;
    /** Build-time local URL for UI rendering; not the provenance image URL. */
    readonly localImageUrl: string;
  };
  readonly categories: readonly ArtworkCategory[];
  readonly tags: readonly string[];
  readonly technical: {
    readonly repeatMotif: "visible" | "unconfirmed";
    readonly repeatEvidence: string;
    readonly presentation: "textile-photograph" | "paper-study" | "clean-artwork" | "unconfirmed";
    readonly imageIsSeamlessTile: boolean;
    readonly seamlessEvidence: string;
    readonly directionality: "upright" | "vertical-bands" | "unconfirmed";
    readonly directionEvidence: string;
  };
  readonly use: {
    readonly printUses: readonly ArtworkPrintUse[];
    readonly garmentFamilies: readonly ArtworkGarmentFamily[];
    readonly pieceRoleGroups: readonly ArtworkPieceRoleGroup[];
    readonly suggestedPlacementWidthCm: {
      readonly minimum: number;
      readonly maximum: number;
      readonly basis: string;
    };
  };
}

export function artworkSourceReferenceText(record: ArtworkCatalogRecord): string {
  return `${record.title} — ${record.source.institution} record ${record.source.itemIdentifier} (${record.source.rightsLabel})`;
}

const metApiUrl = (objectId: number): string =>
  `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;

const metItemUrl = (objectId: number): string =>
  `https://www.metmuseum.org/art/collection/search/${objectId}`;

const metReusePolicyUrl = "https://www.metmuseum.org/about-the-met/policies-and-documents/open-access";

function metSource(
  objectId: number,
  originalImageUrl: string,
  creditLine: string,
): ArtworkCatalogRecord["source"] {
  const imagePath = new URL(originalImageUrl).pathname;
  return {
    institution: "The Metropolitan Museum of Art",
    itemIdentifier: String(objectId),
    apiInternalId: objectId,
    itemRecordUrl: metItemUrl(objectId),
    apiRecordUrl: metApiUrl(objectId),
    originalImageUrl,
    originalImageFilename: imagePath.slice(imagePath.lastIndexOf("/") + 1),
    rightsLabel: "Public Domain",
    apiRightsEvidence: { kind: "met-public-domain-flag", field: "isPublicDomain", value: true },
    creditLine,
    reusePolicyUrl: metReusePolicyUrl,
    checkedOn: "2026-09-23",
  };
}

function cmaSource(
  itemIdentifier: string,
  apiId: number,
  originalImageUrl: string,
  originalImageFilename: string,
  creditLine: string,
): ArtworkCatalogRecord["source"] {
  return {
    institution: "Cleveland Museum of Art",
    itemIdentifier,
    apiInternalId: apiId,
    itemRecordUrl: `https://www.clevelandart.org/art/${itemIdentifier}`,
    apiRecordUrl: `https://openaccess-api.clevelandart.org/api/artworks/${itemIdentifier}`,
    originalImageUrl,
    originalImageFilename,
    rightsLabel: "Public Domain",
    apiRightsEvidence: {
      kind: "cma-cc0-share-status",
      field: "share_license_status",
      value: "CC0",
      copyright: null,
    },
    creditLine,
    reusePolicyUrl: "https://www.clevelandart.org/open-access",
    checkedOn: "2026-09-23",
  };
}

const ALL_GARMENTS: readonly ArtworkGarmentFamily[] = [...GARMENT_FAMILIES];
const ALL_OVER_ROLES: readonly ArtworkPieceRoleGroup[] = ["front", "back", "sleeve", "skirt-panel", "trouser-leg"];
const PANEL_ROLES: readonly ArtworkPieceRoleGroup[] = ["front", "back", "sleeve", "skirt-panel"];

export const ARTWORK_CATALOG: readonly ArtworkCatalogRecord[] = [
  {
    assetId: "builtin-met-221932",
    title: "Textile printed with game birds",
    description: "A dense, warm-ground cotton print with game birds, flowers, and palm-like foliage.",
    creator: "Bannister Hall (manufactory)",
    culture: "British, Preston",
    date: "ca. 1815",
    medium: "Cotton",
    source: metSource(
      221932,
      "https://images.metmuseum.org/CRDImages/es/original/DP-14675-013.jpg",
      "Gift of William Sloane Coffin, 1926",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-221932.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 2605,
      heightPx: 4000,
      byteLength: 4441756,
      sha256: "8bf1250b6774b9b78a29433a74f1471460bc17264654f2d01eff13f977cf49e5",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-221932.jpg", import.meta.url).href,
    },
    categories: ["botanical/floral", "organic/natural", "novelty/illustrative"],
    tags: ["game birds", "flowers", "palm foliage", "chintz", "cotton", "dense repeat", "warm ground"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "The photograph shows the bird-and-foliage motif in multiple rows; exact repeat boundaries are not identified.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "This is a photograph of a rectangular textile specimen, not a prepared repeat tile.",
      directionality: "upright",
      directionEvidence: "Birds and plant forms have an evident upright orientation in the source photograph.",
    },
    use: {
      printUses: ["all-over", "panel", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 10,
        maximum: 28,
        basis: "Editorial starting range for the dense motif, informed by the 2,605 px source width; review resolution and the photographed edges after placement.",
      },
    },
  },
  {
    assetId: "builtin-met-221939",
    title: "Floral print",
    description: "A light-ground cotton print with widely spaced, colorful flowering branches.",
    creator: "Not identified in the item record",
    culture: "French",
    date: "19th century",
    medium: "Cotton",
    source: metSource(
      221939,
      "https://images.metmuseum.org/CRDImages/es/original/DP-23381-001.jpg",
      "Gift of William Sloane Coffin, 1926",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-221939.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 3331,
      heightPx: 4000,
      byteLength: 4444525,
      sha256: "109690e65bc602403869f4aced507541abcdb9eca56846fd7b0bb1b02a9f0edc",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-221939.jpg", import.meta.url).href,
    },
    categories: ["botanical/floral", "organic/natural"],
    tags: ["flower", "flowering branch", "botanical", "cotton", "light ground", "spaced motif"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "Multiple flower-and-branch arrangements appear across the photographed fabric; repeat interval is not identified.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The bundled file is a museum photograph of a textile specimen with visible ground and specimen boundaries.",
      directionality: "unconfirmed",
      directionEvidence: "The source image shows flowering branches, but does not establish a required print-up direction.",
    },
    use: {
      printUses: ["all-over", "panel", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 10,
        maximum: 32,
        basis: "Editorial starting range for the spaced floral field, informed by the 3,331 px source width; review resolution and specimen edges after placement.",
      },
    },
  },
  {
    assetId: "builtin-met-221948",
    title: "Floral print",
    description: "A large-scale cotton floral with abundant flowering branches and a richly detailed ground.",
    creator: "Hartmann et Fils (manufactory)",
    culture: "French, Munster",
    date: "1799",
    medium: "Cotton",
    source: metSource(
      221948,
      "https://images.metmuseum.org/CRDImages/es/original/DP267726.jpg",
      "Gift of William Sloane Coffin, 1926",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-221948.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 1673,
      heightPx: 3889,
      byteLength: 3707501,
      sha256: "37fe2e7cbd238faa22a4c97c3ab0859f6d820fe2caabe473b84a916a6f903821",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-221948.jpg", import.meta.url).href,
    },
    categories: ["botanical/floral", "organic/natural", "ornamental/traditional"],
    tags: ["large floral", "flowering branch", "botanical", "cotton", "historic print", "ornamental"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "A repeated branching floral field is visible on the textile; the source does not mark a repeat unit.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The original is a photograph of a long textile specimen; its edges and surface are not a seamless digital tile.",
      directionality: "upright",
      directionEvidence: "The larger branching stems and flower heads establish a visible upright orientation.",
    },
    use: {
      printUses: ["panel", "focal graphic", "placement", "all-over"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 12,
        maximum: 28,
        basis: "Editorial starting range for the larger, upright floral motif, informed by the 1,673 px source width and the app's existing 59 px/cm resolution floor; review specimen edges after placement.",
      },
    },
  },
  {
    assetId: "builtin-met-221951",
    title: "Floral print with figures",
    description: "A scenic printed cotton with figures, architectural elements, and floral ornament.",
    creator: "Not identified in the item record",
    culture: "French, possibly Nantes",
    date: "1785–90",
    medium: "Cotton",
    source: metSource(
      221951,
      "https://images.metmuseum.org/CRDImages/es/original/LC-26_265_47.jpg",
      "Gift of William Sloane Coffin, 1926",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-221951.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 2509,
      heightPx: 3926,
      byteLength: 4872128,
      sha256: "3172f10514fc9e6dbc6cd57ea14803cef0f15ac27eed518a7edc5af9ba7154e7",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-221951.jpg", import.meta.url).href,
    },
    categories: ["botanical/floral", "ornamental/traditional", "novelty/illustrative"],
    tags: ["figures", "scenic", "flower", "architectural", "printed cotton", "focal motif", "historic textile"],
    technical: {
      repeatMotif: "unconfirmed",
      repeatEvidence: "The image shows a scenic design, but the photographed section does not establish how the scene repeats on the full textile.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "This is a museum photograph of printed cotton, not a prepared repeat tile; the photograph includes specimen ground and edges.",
      directionality: "upright",
      directionEvidence: "Figures and architectural elements have a clear upright orientation.",
    },
    use: {
      printUses: ["panel", "focal graphic", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: PANEL_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 18,
        maximum: 42,
        basis: "Editorial starting range for a scenic panel or focal composition, informed by the 2,509 px source width; confirm crop and resolution for a specific placement.",
      },
    },
  },
  {
    assetId: "builtin-met-229298",
    title: "Piece with pheasants and exotic flowers",
    description: "A tall, monochrome textile design with pheasants, flowers, and meandering branches.",
    creator: "Bromley Hall Printworks (manufactory)",
    culture: "British, Bromley Hall, Middlesex",
    date: "1765–75",
    medium: "Fustian, copperplate printed",
    source: metSource(
      229298,
      "https://images.metmuseum.org/CRDImages/es/original/DP268145.jpg",
      "Rogers Fund, 1970",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-229298.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 632,
      heightPx: 1893,
      byteLength: 1041182,
      sha256: "ac7b2758624629b4a5f4bb29dd2f3ae4e871921be934688a2c3b1792fe40ab27",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-229298.jpg", import.meta.url).href,
    },
    categories: ["botanical/floral", "organic/natural", "novelty/illustrative"],
    tags: ["pheasant", "bird", "exotic flowers", "meandering branch", "monochrome", "copperplate print", "large motif"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "Several vertically arranged bird-and-branch motifs are visible in the photographed textile piece; repeat boundaries are not identified.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The bundled image is a narrow photograph of a textile piece, not a repeat tile.",
      directionality: "upright",
      directionEvidence: "The tall branch and perched birds have an evident upright orientation.",
    },
    use: {
      printUses: ["focal graphic", "placement", "panel"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: PANEL_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 4,
        maximum: 10,
        basis: "Conservative editorial range for this tall focal motif; the original is only 632 px wide, so larger placements may receive low-resolution guidance.",
      },
    },
  },
  {
    assetId: "builtin-met-710048",
    title: "Textile Design with Alternating Lozenges over a Striped Background",
    description: "A paper study of alternating diamond shapes over narrow vertical stripes.",
    creator: "Anonymous, Alsatian, 19th century",
    culture: "Alsatian; made in Mulhouse, Alsace",
    date: "1840",
    medium: "Gouache on paper",
    source: metSource(
      710048,
      "https://images.metmuseum.org/CRDImages/dp/original/DP889362.jpg",
      "Museum Accession, transferred from the Library",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-710048.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 1526,
      heightPx: 1349,
      byteLength: 855259,
      sha256: "40639b7eb9f6a5e78e3d0ca7d3fcbb7f0763a5efd15c882d67f4e0601db8af33",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-710048.jpg", import.meta.url).href,
    },
    categories: ["geometric", "stripe/check/grid"],
    tags: ["lozenge", "diamond", "vertical stripe", "gouache", "paper design", "geometric repeat", "Alsace"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "The design sheet shows multiple lozenges and repeating vertical lines; the sheet is a study, not a marked production repeat.",
      presentation: "paper-study",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The source is a photographed rectangular sheet of paper with visible margins.",
      directionality: "vertical-bands",
      directionEvidence: "The striped ground runs vertically in the source design; rotating it changes the stripe direction.",
    },
    use: {
      printUses: ["all-over", "border/trim", "panel", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 6,
        maximum: 18,
        basis: "Editorial starting range for the compact geometric motif, informed by the 1,526 px source width; paper margins remain visible and resolution guidance still applies.",
      },
    },
  },
  {
    assetId: "builtin-met-710711",
    title: "Textile Design with Vertical Strips of Alternating Lens-Shapes and Circles Framed by Pearls Separated by Vertical Strips of Lozenges over a Striped Background",
    description: "A colorful paper study of vertical ornamental bands, lens shapes, circles, and lozenges.",
    creator: "Anonymous, Alsatian, 19th century",
    culture: "Alsatian; made in Mulhouse, Alsace",
    date: "1840",
    medium: "Gouache on paper",
    source: metSource(
      710711,
      "https://images.metmuseum.org/CRDImages/dp/original/DP889466.jpg",
      "Museum Accession, transferred from the Library",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-710711.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 2227,
      heightPx: 1732,
      byteLength: 1849496,
      sha256: "3df0f9e1f2634bac1318c741642f3141910e2b633ede00fb979f43a7cfdce624",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-710711.jpg", import.meta.url).href,
    },
    categories: ["geometric", "stripe/check/grid", "ornamental/traditional"],
    tags: ["vertical bands", "lens shapes", "circles", "lozenge", "pearls", "gouache", "ornamental", "Alsace"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "The study shows repeated vertical bands and recurring forms; the paper sheet does not identify production repeat boundaries.",
      presentation: "paper-study",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The original is a photographed paper design with sheet edges, not a seamless textile tile.",
      directionality: "vertical-bands",
      directionEvidence: "The artwork is organized in vertical strips; rotation changes its directional layout.",
    },
    use: {
      printUses: ["all-over", "border/trim", "panel", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 8,
        maximum: 22,
        basis: "Editorial starting range for a directional decorative band, informed by the 2,227 px source width; paper edges and the actual repeat remain visible/uncertain.",
      },
    },
  },
  {
    assetId: "builtin-met-69802",
    title: "Textile fragment with geometric pattern",
    description: "A silk lampas fragment with a richly textured, repeated geometric motif.",
    creator: "Not identified in the item record",
    culture: "China; Ming dynasty",
    date: "16th century",
    medium: "Silk lampas",
    source: metSource(
      69802,
      "https://images.metmuseum.org/CRDImages/as/original/LC-46_133_61_front.jpg",
      "Anonymous Gift, 1946",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified Met primaryImage JPEG bytes.",
    image: {
      filename: "met-69802.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 5229,
      heightPx: 1730,
      byteLength: 6293652,
      sha256: "220d66b1146632af27871db6f3e5f06eba62264f8cc3f35d530d2bcdbf1c3fc6",
      hasTransparency: false,
      localImageUrl: new URL("./assets/met-69802.jpg", import.meta.url).href,
    },
    categories: ["geometric", "texture/material"],
    tags: ["silk lampas", "woven texture", "geometric repeat", "textile fragment", "Ming", "China", "historic textile"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "The photographed fragment shows recurring geometric motifs; its cut edges do not establish the full repeat unit.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The source is a museum photograph of a woven textile fragment, with its specimen boundary visible.",
      directionality: "unconfirmed",
      directionEvidence: "A repeating motif is visible, but the source record does not establish intended up/down orientation for reuse.",
    },
    use: {
      printUses: ["all-over", "panel", "focal graphic", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 10,
        maximum: 30,
        basis: "Editorial starting range for the visible woven motif, informed by the 5,229 px source width; the photo border and fragment scale are not production repeat or print specifications.",
      },
    },
  },
  {
    assetId: "builtin-cma-109638",
    title: "Je T'aime (No. 632)",
    description: "A roller-printed silk with repeated angular lettering designed for Stehli Silks Corporation.",
    creator: "Kneeland (Ruzzie) Green",
    culture: "America, New York",
    date: "1927",
    medium: "Silk crepe: plain weave, roller printed",
    source: cmaSource(
      "1928.269",
      109638,
      "https://openaccess-cdn.clevelandart.org/1928.269/1928.269_print.jpg",
      "1928.269_print.jpg",
      "Gift of the Stehli Silks Corporation",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified CMA print rendition JPEG bytes.",
    image: {
      filename: "cma-1928-269.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 1843,
      heightPx: 3400,
      byteLength: 6266281,
      sha256: "1f7c5eaef97874bb8d994dded1257cc8e82deae9f7d858e6f29463b7d6ff2495",
      hasTransparency: false,
      localImageUrl: new URL("./assets/cma-1928-269.jpg", import.meta.url).href,
    },
    categories: ["typography/logo", "abstract"],
    tags: ["roller printed", "silk", "lettering", "angular motif", "Stehli Silks", "textile design"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "Repeated angular lettering appears in rows across the photographed silk; exact repeat boundaries are not marked.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "This is a photograph of a silk specimen, not a prepared repeat tile; its photographed edges and surface remain part of the image.",
      directionality: "upright",
      directionEvidence: "The lettering has a visible reading orientation in the photographed print; review orientation before using it as a garment-scale reference.",
    },
    use: {
      printUses: ["all-over", "panel", "focal graphic", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: PANEL_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 8,
        maximum: 20,
        basis: "Curator estimate informed by the 1,843 px source width; preserve the photographed specimen context and inspect lettering scale after placement.",
      },
    },
  },
  {
    assetId: "builtin-cma-167454",
    title: "Woman’s Robe (munisak)",
    description: "A Bukhara silk velvet robe with a richly varied ikat surface shown in its garment context.",
    creator: "Not identified in the item record",
    culture: "Uzbekistan, Bukhara",
    date: "1850–75",
    medium: "Silk: velvet ikat",
    source: cmaSource(
      "2009.267",
      167454,
      "https://openaccess-cdn.clevelandart.org/2009.267/2009.267_print.jpg",
      "2009.267_print.jpg",
      "Gift of Arlene C. Cooper",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified CMA print rendition JPEG bytes.",
    image: {
      filename: "cma-2009-267.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 3400,
      heightPx: 2294,
      byteLength: 6572081,
      sha256: "750370536cd8e7e208e4f4dbd6cb8d13fedaf38f6f0fc527c41538b8c668d59c",
      hasTransparency: false,
      localImageUrl: new URL("./assets/cma-2009-267.jpg", import.meta.url).href,
    },
    categories: ["abstract", "ornamental/traditional", "texture/material"],
    tags: ["Bukhara", "silk velvet", "ikat", "robe", "garment photograph", "textile surface"],
    technical: {
      repeatMotif: "visible",
      repeatEvidence: "The robe shows repeated ikat patterning; a photograph of the garment does not establish a repeat unit or exact repeat boundary.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The robe silhouette, folds, seams, sheen and lighting are part of the source photograph; this is not a clean textile swatch or repeat tile.",
      directionality: "upright",
      directionEvidence: "The robe is shown upright as a garment; the photograph does not specify a production print-up direction.",
    },
    use: {
      printUses: ["all-over", "panel", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: ALL_OVER_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 12,
        maximum: 32,
        basis: "Curator estimate informed by the 3,400 px source width; the robe silhouette, folds, seams, sheen and lighting remain visible, so inspect crop and scale after placement.",
      },
    },
  },
  {
    assetId: "builtin-cma-95605",
    title: "Gift Cover (Fukusa) with Carp in Waves",
    description: "A silk gift cover with a centered embroidered carp-and-wave composition and metallic thread.",
    creator: "Not identified in the item record",
    culture: "Japan, Meiji period (1868–1912)",
    date: "1868–1912",
    medium: "Silk: embroidered; metallic thread",
    source: cmaSource(
      "1916.1324",
      95605,
      "https://openaccess-cdn.clevelandart.org/1916.1324/1916.1324_print.jpg",
      "1916.1324_print.jpg",
      "Gift of Mr. and Mrs. J. H. Wade",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified CMA print rendition JPEG bytes.",
    image: {
      filename: "cma-1916-1324.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 2905,
      heightPx: 3400,
      byteLength: 3683248,
      sha256: "e1383bb2d3bfeee4254122d98a59f4e863774bd5b664cafea30d11b4ee4ab9c4",
      hasTransparency: false,
      localImageUrl: new URL("./assets/cma-1916-1324.jpg", import.meta.url).href,
    },
    categories: ["organic/natural", "novelty/illustrative", "texture/material"],
    tags: ["carp", "waves", "embroidered", "metallic thread", "silk", "focal composition"],
    technical: {
      repeatMotif: "unconfirmed",
      repeatEvidence: "The image shows one centered carp-and-wave scene; no repeating motif unit is established.",
      presentation: "textile-photograph",
      imageIsSeamlessTile: false,
      seamlessEvidence: "Thread relief, metallic sheen, photographed textile edges and surface are retained; the centered composition is not a repeat tile.",
      directionality: "upright",
      directionEvidence: "The carp and wave composition has a visible upright orientation in the source image.",
    },
    use: {
      printUses: ["panel", "focal graphic", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: PANEL_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 10,
        maximum: 25,
        basis: "Curator estimate informed by the 2,905 px source width; metallic thread and embroidery relief are photographic surface details, not a production-print specification.",
      },
    },
  },
  {
    assetId: "builtin-cma-111658",
    title: "Sparrows, Bamboo and Falling Snow",
    description: "A Japanese color woodblock print depicting sparrows, bamboo and scattered falling snow.",
    creator: "Keisai Eisen",
    culture: "Japan, Edo period (1615–1868)",
    date: "c. late 1820s",
    medium: "Color woodblock print",
    source: cmaSource(
      "1930.192",
      111658,
      "https://openaccess-cdn.clevelandart.org/1930.192/1930.192_print.jpg",
      "1930.192_print.jpg",
      "Bequest of Edward L. Whittemore",
    ),
    retrievedOn: "2026-09-23",
    modification: "Unmodified CMA print rendition JPEG bytes.",
    image: {
      filename: "cma-1930-192.jpg",
      mimeType: "image/jpeg",
      format: "raster",
      widthPx: 2583,
      heightPx: 3400,
      byteLength: 2870622,
      sha256: "15392fa7c4ea9467bd09d06b610bf6a53ae30e3f4ecea970ead3bc554d76d958",
      hasTransparency: false,
      localImageUrl: new URL("./assets/cma-1930-192.jpg", import.meta.url).href,
    },
    categories: ["dot/spot", "organic/natural", "novelty/illustrative"],
    tags: ["sparrows", "bamboo", "falling snow", "woodblock print", "spot motif", "paper study"],
    technical: {
      repeatMotif: "unconfirmed",
      repeatEvidence: "Scattered snow marks are visible within a single scene; they are not a regular polka-dot or repeat unit.",
      presentation: "paper-study",
      imageIsSeamlessTile: false,
      seamlessEvidence: "The paper margins and single-scene composition remain in this photographed print; no repeating boundary is claimed.",
      directionality: "upright",
      directionEvidence: "The print depicts upright bamboo and birds; review orientation and paper margins when adapting the reference.",
    },
    use: {
      printUses: ["panel", "focal graphic", "placement"],
      garmentFamilies: ALL_GARMENTS,
      pieceRoleGroups: PANEL_ROLES,
      suggestedPlacementWidthCm: {
        minimum: 8,
        maximum: 20,
        basis: "Curator estimate informed by the 2,583 px source width; the paper margins and single-scene composition remain visible and are not print specifications.",
      },
    },
  },
];
