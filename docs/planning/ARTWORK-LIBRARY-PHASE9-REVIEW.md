# Artwork library V1 — Phase 9 review

_Review date: 2026-09-23. The maintainer approved the expansion recommendation
on 2026-09-23. Phase 9 remains active through the bounded follow-up work and
practice gate. No garment queue is authorized by this review._

## Boundary

This is a no-cost, local-only review of the existing Phase 8 V1. It does not
add, remove, or transform artwork, change taxonomy or guidance, fetch artwork
at runtime, or approve a garment queue. The supporting execution contract is
`ARTWORK-LIBRARY-V1-EXECUTION.md`; Phase 9's required review topics are in
`PRE-GARMENT-EXECUTION.md`.

## Findings

| Review question | Evidence | Assessment |
|---|---|---|
| Can someone find artwork? | Slice 203's recorded browser run found the expected single result for `birds`; keyboard Enter opened the library with visible focus. The interface has literal search and combined category, garment-family, piece-role, and print-use filters. | The interaction is discoverable in the recorded run. The search is phrase-based, not token-based; keep that distinction visible in help if users expect multiword token search. |
| Do the categories make sense? | The catalog exposes all ten approved categories and assigns relevant multi-category tags. The eight-item seed covers seven categories; `dot/spot`, `abstract`, and `typography/logo` have no entries. | The taxonomy is coherent as a starting point, but the small seed leaves visible gaps. Empty categories should remain empty until a genuinely relevant, rights-verified item is found. |
| Are provenance, filename, and asset ID distinct? | Each catalog item has a stable `builtin-met-*` ID, local filename and hash, source institution/item/API/policy references, rights label, credit line, retrieval date, and modification statement. Source URLs are attribution text; the render URL is a separate build-time local asset URL. | The data model separates identity, local file, and provenance. They must remain separately labeled in the UI; a source URL is not an image-fetch instruction. |
| Does selection survive reload? | Slice 203's recorded manual run selected `builtin-met-221932`, saved and reloaded it, and confirmed the local preview and stable ID. It also recorded that the user-import store remains separate and replacing a placement preserves unrelated fields. | The existing evidence supports local persistence and path separation. The combined import-and-library workflow was not independently repeated in this review. |
| Are recommendations useful without restricting choice? | Phase 8 defines explained `Recommended`, `Possible`, and `Needs review` guidance across five print uses. Every item remains selectable; the guidance is advisory and does not change design values. Textile photographs and paper studies are not represented as clean production tiles. | The model preserves user choice and communicates uncertainty. Resolution and specimen-edge caveats are important because these are reference images, not validated production artwork. |
| Are formats sufficient? | All eight bundled items are raster JPEGs without transparency. The separate local-import workflow accepts PNG, JPEG, WebP, and sanitized SVG. | JPEG is sufficient for browsing these references, but the bundled set does not offer vector, transparency, or a clean print-ready repeat. These are different needs from reference imagery and should be labeled, not conflated. |
| Is the library meaningfully varied? | Visual inspection of all eight bundled files found five primarily floral/botanical works, including bird/scenic motifs, plus three geometric/stripe-oriented works. Six are textile specimen photographs and two are paper studies; all come from The Met's historical textile/design collection. | There is useful motif and scale contrast, but the source, era, format, and subject range are narrow. This is a curated reference starter, not the dense, broad artwork library originally envisioned. |

### Rendered-evidence limitation

The Slice 203 verification record contains the prior rendered-browser checks
for search, keyboard operation, narrow width, local preview, save/reload, and
no remote catalog/image request. During this review the in-app browser could
not connect to the available local loopback server, so those interaction
checks were not independently repeated. This record does not claim a fresh
end-to-end user trial of importing and selecting bundled artwork in one
session.

## Recommendation and maintainer decision

Recommend expanding V1 before calling the artwork workflow finished. That
better matches the earlier request for a broad, fashion-oriented, searchable
collection. Keep the boundary local and no-cost: add only individually
provenanced and rights-verified assets that serve garment print uses; cover
underrepresented categories only when suitable works exist; distinguish
reference photographs/paper studies from clean artwork and verified repeat
tiles; retain advisory suitability guidance; and make no runtime network
requests. Any expansion should account for bundled file size and must not
silently treat a museum image as print-ready artwork.

The maintainer approved this expansion direction on 2026-09-23. The next slice
must scope a bounded addition before adding files: candidates must be individually
provenanced and rights-verified; category gaps are filled only with relevant
works; clean/repeat-ready assets must be distinguished from reference imagery;
the assets remain bundled with no runtime fetching; and bundle size is measured.
The expansion must not claim that museum reference images are production-ready.
No garment queue starts from this review; a separate explicit garment direction
remains required after the pre-garment gate.
