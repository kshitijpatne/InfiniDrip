# Artwork Library V1 — execution contract

_Phase 8 of the approved no-cost pre-garment sequence. Slice 201 has curated and
verified the initial local corpus. Slices 202–203 add search/guidance and UI;
Phase 9 evaluates the result with the maintainer before any garment queue._

## Goal and boundary

Ship a small, useful, fashion-oriented local artwork collection that can be
searched, filtered, inspected and used as a reference while authoring a surface
placement. The initial V1 corpus is eight public-domain textile designs from
The Metropolitan Museum of Art (The Met), selected for floral, scenic, bird,
geometric, stripe and ornamental variety. This is a curated starter collection,
not a claim to cover every category or style.

Everything stays on-device or in the application bundle. The library must not
call an image host, museum API, account service, database, or other remote
service at runtime. User-imported artwork remains in the separate Slice 200
local store. Bundled items are read-only application assets and use stable IDs
of the form `builtin-met-<Met object ID>`; a saved design refers to the bundled
item by that ID and does not copy its bytes into browser or desktop storage.
Existing `assetId`, `sourceName`, and source-pixel-dimension fields are enough;
do not add a design schema version just for the library.

For the first implementation, keep a versioned catalog beside the bundled
images in source-controlled application assets. Bundle image URLs at build
time. The catalog's source-record URLs and attribution are text metadata only;
the app must never fetch them. Do not crop, recolor, trace, or otherwise alter
the source images in V1. Keep stable IDs and assets available to old saved
designs if the catalog later expands or changes.

## Catalog record

Every item must provide:

- stable asset ID; title; concise description; creator/maker (or an explicit
  unknown value); source institution and item-record URL;
- item-level rights evidence: the page's `Public Domain` label, the Met API's
  `isPublicDomain: true`, the API record URL, attribution/credit line, and the
  reuse-policy URL;
- retrieval date, modification statement, source-image filename, MIME type,
  pixel dimensions, and SHA-256 of the exact bundled bytes;
- one or more approved categories and searchable tags;
- technical and garment-use metadata: raster/vector, transparency, repeat
  status and its evidence, whether the image itself is a seamless tile,
  directionality, suggested print uses, current garment families, piece-role
  groups, and a suggested placement-width range in centimetres with its basis.

Use the exact category vocabulary from the parent plan: geometric;
stripe/check/grid; dot/spot; botanical/floral; organic/natural;
abstract; ornamental/traditional; typography/logo; texture/material; and
novelty/illustrative. It is valid for a category to have no V1 entries; do not
force an unrelated asset into it. Multi-category items may appear under each
relevant category.

Treat source facts and curator observations separately. A textile's repeated
motif does not prove that the downloaded photograph is a seamless repeat tile.
Record unknown or unconfirmed properties as such. Suggested scale is editorial
starting guidance in centimetres, not a source measurement, manufacturing
specification, print-quality guarantee, or physical-fit claim.

## Search, filters, and recommendations

Search title, description, tags, creator and source as literal, normalized
text. Filters cover category, garment family, piece-role group and print use.
Different active filter fields combine with AND; multiple values selected
within a single field combine with OR. Filtering must not remove entries from
the underlying catalog or permanently hide a potentially useful asset.

Every recommendation must display a plain-language reason and remain advisory:

- **Recommended** only where source/curator evidence supports that use and the
  image's technical limits do not contradict the suggested scale.
- **Possible** where the design plausibly suits the use but a non-blocking
  property—such as repeat boundaries, direction or exact scale—is uncertain.
- **Needs review** where provenance, image presentation, resolution or another
  important suitability property is incomplete or conflicts with the proposed
  use.

Evaluate guidance per print use (all-over, border/trim, panel, focal graphic or
placement); never present the result as a physical, fit, print-production or
sewability validation. Every result remains selectable regardless of guidance.

## Approved slice sequence

### Slice 201 — seed the verified local corpus

**Scope:** add the eight selected source images, versioned typed catalog and a
focused verifier for required metadata, unique IDs, local-only image paths,
file existence, MIME/dimensions and exact SHA-256. Update this plan and current
project context with the accepted corpus and verification evidence.

**Acceptance:** every item passes both item-page and API rights checks; every
image is present and visually reviewed; all metadata required above is complete
or explicitly marked unknown; the verifier catches a changed/missing asset or
duplicate ID; no UI, remote runtime request, user-store mutation, export, or
garment behavior is added.

**Non-goals:** library UI/search, an image editor, generating seamless repeats,
external API integration, image transformation, asset import redesign, or a
new garment recipe.

### Slice 202 — search and suitability rules

**Scope:** implement the pure catalog search, AND-across-fields/OR-within-field
filter behavior and explained per-use guidance in isolated, fully tested
functions.

**Acceptance:** every record remains discoverable; exact matching inputs are
covered; each guidance level has a visible reason; unknown properties do not
silently become positive claims; all nine categories remain filterable.

### Slice 203 — local library authoring UI

**Scope:** browse, search, filter, inspect provenance/technical details, and
choose a bundled item for a new or existing surface placement in the Style
panel. Use the stable built-in ID and the existing local asset-reference fields;
resolve bundled bytes from build-time assets, not the user-import store.

**Acceptance:** selection attaches the chosen image and metadata without
changing unrelated design values; source/license are inspectable; keyboard and
narrow-screen operation work; no network request occurs; save/reload preserves
the selected ID and local image preview; imported artwork still uses its
existing separate storage path.

## Candidate-selection record (2026-09-23)

The Met Open Access API documents `isPublicDomain`, `primaryImage`, and
`primaryImageSmall`; it does not require registration or an API key. For every
chosen item, the current collection page must also show `Public Domain` and
`Download Image`, and the API record must have `isPublicDomain: true` plus a
non-empty `primaryImage`. V1 stores the unmodified `primaryImage` bytes, not a
runtime URL.

### Slice 201 verification record

On 2026-09-23, all eight selected object pages were rechecked for the
item-specific `Public Domain` and `Download Image` labels, and each API object
record was rechecked for `isPublicDomain: true` and a non-empty `primaryImage`.
The catalog's source-image URL matches the API value for each object. All eight
original files were decoded and visually reviewed; their recorded dimensions,
byte lengths, and SHA-256 digests are checked by
`src/surface/artwork-library/catalog.test.ts`. The bundled images are not
cropped or edited. The full application coverage gate passes at 100% across all
four metrics, the production TypeScript/Vite build passes, and the export
byte-identity regressions remain green.

The current seed has eight entries and covers seven of the ten category values:
geometric, stripe/check/grid, botanical/floral, organic/natural,
ornamental/traditional, texture/material, and novelty/illustrative. Dot/spot,
abstract, and typography/logo have no matching seed entry and stay empty. This
is not yet the broader, dense library implied by the long-term product idea;
Phase 9 specifically requires trying the working V1 and asking the maintainer
whether to expand or revise it. The UI must identify each file as a museum
reference photograph or paper study—not a seamless, print-ready tile—and retain
the per-image resolution warning where applicable.

| Met object | Work | Curation role | Item record |
|---|---|---|---|
| 221932 | *Textile printed with game birds* (Bannister Hall, ca. 1815) | bird/flower all-over textile reference | <https://www.metmuseum.org/art/collection/search/221932> |
| 221939 | *Floral print* (French, 19th century) | colorful botanical field | <https://www.metmuseum.org/art/collection/search/221939> |
| 221948 | *Floral print* (Hartmann et Fils, 1799) | large-scale botanical repeat reference | <https://www.metmuseum.org/art/collection/search/221948> |
| 221951 | *Floral print with figures* (French, possibly Nantes, 1785–90) | scenic/focal textile reference | <https://www.metmuseum.org/art/collection/search/221951> |
| 229298 | *Piece with pheasants and exotic flowers* (Bromley Hall, 1765–75) | birds, branches and flowers; large motif | <https://www.metmuseum.org/art/collection/search/229298> |
| 710048 | *Textile Design with Alternating Lozenges over a Striped Background* (Alsace, 1840) | geometric and stripe/check design | <https://www.metmuseum.org/art/collection/search/710048> |
| 710711 | *Textile Design with Vertical Strips of Alternating Lens-Shapes and Circles…* (Alsace, 1840) | directional geometric/ornamental design | <https://www.metmuseum.org/art/collection/search/710711> |
| 69802 | *Textile fragment with geometric pattern* (China, 16th century) | woven geometric texture/reference | <https://www.metmuseum.org/art/collection/search/69802> |

Selection is deliberately not a generic illustration dump. The accepted pages
identify printed textiles or textile designs, and the inspected images show
usable motif, repeat, border, or textile-surface references. Some catalog
photographs include textile edges or paper; the UI must disclose that the
bundled image is a reference image, not a clean seamless production tile.

Candidates with an API `isPublicDomain: false` or no image are excluded even if
nearby collection pages describe the Open Access program generally. Low-detail
records and records with contradictory download evidence are also excluded
from this first bundle; they may be reconsidered only after stronger item-level
evidence and visual review.

## Phase 9 maintainer gate

After the local library is built and tried alongside Slice 200 import, record
the maintainer's explicit choice to expand, revise the taxonomy/formats or
recommendations, change placement behavior, or keep V1. Completion of this
phase does not approve or start a garment queue.

## Authoritative source references

- [The Met Collection API documentation](https://metmuseum.github.io/) — API
  fields, access requirements, and item/image record semantics.
- [The Met Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access)
  — reuse policy for public-domain images.
- Each object-specific page in the table above — current rights label, work
  metadata and downloadable image record.
