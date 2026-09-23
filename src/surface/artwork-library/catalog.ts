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

export interface ArtworkCatalogRecord {
  readonly assetId: `builtin-met-${number}`;
  readonly title: string;
  readonly description: string;
  readonly creator: string;
  readonly culture: string;
  readonly date: string;
  readonly medium: string;
  readonly source: {
    readonly institution: "The Metropolitan Museum of Art";
    readonly itemRecordUrl: string;
    readonly apiRecordUrl: string;
    /** Provenance only; never use as an image source at runtime. */
    readonly originalImageUrl: string;
    readonly rightsLabel: "Public Domain";
    readonly apiIsPublicDomain: true;
    readonly creditLine: string;
    readonly reusePolicyUrl: string;
    readonly checkedOn: "2026-09-23";
  };
  readonly retrievedOn: "2026-09-23";
  readonly modification: "Unmodified Met primaryImage JPEG bytes.";
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
    /** All V1 records are source photographs or paper studies, not seamless tiles. */
    readonly imageIsSeamlessTile: false;
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
  return {
    institution: "The Metropolitan Museum of Art",
    itemRecordUrl: metItemUrl(objectId),
    apiRecordUrl: metApiUrl(objectId),
    originalImageUrl,
    rightsLabel: "Public Domain",
    apiIsPublicDomain: true,
    creditLine,
    reusePolicyUrl: metReusePolicyUrl,
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
        maximum: 30,
        basis: "Editorial starting range for the larger, upright floral motif, informed by the 1,673 px source width; review resolution and specimen edges after placement.",
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
];
