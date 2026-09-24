# Phase 9 artwork-library expansion scope

_Slice 207 research and selection record. Scope approved by the maintainer at
the direction level on 2026-09-23; no artwork files or application code are
changed by this research slice._

## Objective and limits

Add a small, useful second source to the existing eight-item local reference
library without turning Phase 9 into a generic image dump. The four selected
records below come from the Cleveland Museum of Art (CMA), span actual printed
textile, garment-scale ikat, embroidered motif, and a paper print study, and
add three currently empty discovery categories without forcing an unrelated
work into them.

Implementation uses only each official API record's `images.print` JPEG. The
bytes remain unchanged, source URLs remain provenance text, and images resolve
from the local application bundle. No API, CDN, museum page, or other network
resource may be requested at runtime. The full-resolution TIFFs are not in
scope. No clean artwork or production-repeat tile is claimed; each image is a
reference photograph or paper study. Existing Met IDs and bytes remain
unchanged. No garment recipe, paid service, account, database, or remote-fetch
feature is authorized.

## Rights and provenance checks

For every selected accession number, Codex checked the live official CMA API
record on 2026-09-23 local time: `share_license_status` is `CC0`,
`copyright` is null, the item has a `print` rendition, and the returned source
metadata provides the creator/culture/medium, credit line, dimensions and exact
rendition filename/size. The corresponding CMA object page was visually
checked and displayed its Public Domain badge and reuse statement. The CMA
Open Access page says CC0 images can be used without fees; its Terms also
disclaim warranties and third-party-rights responsibility. This is recorded
source evidence, not an independent legal opinion. Recheck item status and
current terms before any future change that redistributes these bytes. No paid
image service was used or requested.

| Stable ID (planned) | CMA work / creator / credit | API internal ID | Item page / API record | Official print JPEG | Planned discovery categories | Curatorial role and limitations |
|---|---|---:|---|---|---|---|
| `builtin-cma-109638` | *Je T'aime (No. 632)*, 1927; designed by Kneeland (Ruzzie) Green for Stehli Silks Corporation; credit: Gift of the Stehli Silks Corporation | 109638 | [item](https://www.clevelandart.org/art/1928.269) · [API](https://openaccess-api.clevelandart.org/api/artworks/1928.269) | `1928.269_print.jpg`; 1843 × 3400; 6,262,868 bytes | typography/logo; abstract | Actual roller-printed silk with repeated angular lettering visible in rows. The object title supplies the phrase “Je T'aime” (“I love you”); retain the title/text context. The photo is not a clean repeat tile. |
| `builtin-cma-167454` | *Woman's Robe (munisak)*, 1850–75; maker not identified; credit: Gift of Arlene C. Cooper | 167454 | [item](https://www.clevelandart.org/art/2009.267) · [API](https://openaccess-api.clevelandart.org/api/artworks/2009.267) | `2009.267_print.jpg`; 3400 × 2294; 6,568,666 bytes | abstract; ornamental/traditional; texture/material | Bukhara silk velvet ikat. The rendered garment visibly carries a varied, repeating ikat surface; folds, seams, sheen, robe silhouette and lighting are part of the photograph, so it is a study rather than clean artwork or a tile. |
| `builtin-cma-95605` | *Gift Cover (Fukusa) with Carp in Waves*, 1868–1912; maker not identified; credit: Gift of Mr. and Mrs. J. H. Wade | 95605 | [item](https://www.clevelandart.org/art/1916.1324) · [API](https://openaccess-api.clevelandart.org/api/artworks/1916.1324) | `1916.1324_print.jpg`; 2905 × 3400; 3,693,345 bytes | organic/natural; novelty/illustrative; texture/material | Centered embroidered carp-and-wave composition on silk with metallic thread. Useful as a focal/panel reference; thread relief and shine are photographic, and the composition is not a repeat. Do not turn cultural interpretation into a design instruction. |
| `builtin-cma-111658` | *Sparrows, Bamboo and Falling Snow*, c. late 1820s; Keisai Eisen; credit: Bequest of Edward L. Whittemore | 111658 | [item](https://www.clevelandart.org/art/1930.192) · [API](https://openaccess-api.clevelandart.org/api/artworks/1930.192) | `1930.192_print.jpg`; 2583 × 3400; 2,880,589 bytes | dot/spot; organic/natural; novelty/illustrative | Japanese color woodblock paper study. The image shows scattered snow marks, bamboo and sparrows; `dot/spot` means a visible spot motif here, not a regular polka-dot repeat. Paper margins and single-scene composition remain; restrict the curated uses to panel/focal/placement. |

The proposed advisory width caps are curator estimates, not print guarantees:
20 cm for the tall lettering textile, 32 cm for the robe photograph, 25 cm
for the embroidered cover, and 20 cm for the woodblock sheet. Each stays below
the 59 px/cm source-axis floor with some margin, but presentation caveats still
prevent museum photographs/paper from being represented as production art.
The application must continue to calculate guidance from the actual source
dimensions and selected placement; these estimates never clamp or alter a
design.

## Bundle impact

The existing eight JPEGs total 27,505,499 bytes. The four selected CMA print
JPEGs total 19,405,468 bytes (about 18.50 MiB), a projected total of
46,910,967 bytes (about 44.74 MiB), before any build/container overhead. This
is roughly a 70.5% increase in bundled source-image bytes. Slice 208 must
record the actual production-build asset total and verify that no original Met
image changed. The image set is deliberately limited to the official print
renditions rather than the much larger TIFFs. Do not silently substitute
lower-resolution web thumbnails or recompress/crop the source images to hide
the cost of this choice.

## Candidates held out

- The 11.08 MB *Vestment fragment with stars in staggered squares* (1928.648)
  was visually confirmed as a genuine geometric textile fragment, but adds a
  large asset where geometric/ornamental coverage already exists. It is a
  reasonable later candidate if a materially broader textile collection is
  explicitly preferred over the current bundle-size boundary.
- *Strawberry Thief* (1937.696) is a strong CC0 textile but overlaps the
  existing floral/bird references. *Plaid tiraz* (1919.27) is a worn narrow
  band whose marks are not sufficiently legible to call typography. The
  Kashmir shawl is reserved because the selected four provide a more diverse
  bounded set. The Crazy Quilt is more directly useful for patchwork
  construction/color blocking than surface-print exploration.
- Claude's AIC candidate record found item-level public-domain API flags, but
  the official item/image pages were blocked by a Cloudflare challenge during
  normal access; pixel dimensions and image presentation were not verified.
  Those candidates are not selected. Do not solve or bypass the challenge.

## Slice 208 implementation acceptance

- Add only the four selected original print JPEGs, each as a distinct,
  institution-namespaced stable ID. Preserve every existing ID, file byte and
  saved-design reference.
- Generalize catalog provenance typing without weakening validation; record
  the CMA item/API URLs, CC0/Public Domain evidence, credit line, retrieval and
  rights-check date, official print filename, MIME, dimensions, byte length,
  exact SHA-256, and unmodified-source statement.
- Mark every new record `textile-photograph` or `paper-study`, never
  `clean-artwork`; mark every `imageIsSeamlessTile` false. Record motif
  visibility separately from repeat-boundary evidence. Preserve uncertainty
  about orientation, paper/specimen edges, textile folds, sheen and resolution.
- Add no more than the four selected images, and make no runtime remote
  requests. Confirm actual `dist` image bytes and production bundle delta.
- Keep all recommendations advisory; no catalog selection changes garment,
  measurement, design or export values. Run focused catalog checks, the full
  100% coverage and byte-identity gates, the production build, rendered local
  UI checks, and the existing import-plus-library persistence rehearsal.

After implementation, practice the combined local import and catalog flow and
record remaining taxonomy gaps honestly. Phase 9's final review remains open;
the garment queue still requires its own explicit maintainer approval.

## Sources

- [CMA Open Access](https://www.clevelandart.org/open-access)
- [CMA Terms and Conditions](https://www.clevelandart.org/terms-and-conditions)
- [CMA Open Access API documentation](https://openaccess-api.clevelandart.org/)
- The four accession-specific item and API URLs in the table above.
