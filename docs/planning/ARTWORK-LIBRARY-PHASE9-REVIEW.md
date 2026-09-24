# Artwork library V1 — Phase 9 review

_Review date: 2026-09-24. The maintainer accepted the bounded 12-item local
reference V1 exit on this date. Phase 9 is complete; this decision does not
authorize a garment queue._

## Boundary and evidence

This is a no-cost, local-only review of the expanded Phase 8 V1. Slice 208
added only the four Cleveland Museum of Art references approved in Slice 207;
Slice 209 added rendered drop-persistence verification without changing the
catalog scope. This review authorizes no additional artwork, spending,
runtime fetching, or garment work. The binding implementation and practice
record is [`ARTWORK-LIBRARY-V1-EXECUTION.md`](ARTWORK-LIBRARY-V1-EXECUTION.md);
the exact rights-checked CMA shortlist and asset evidence is
[`ARTWORK-EXPANSION-PHASE9-SCOPE.md`](../research/ARTWORK-EXPANSION-PHASE9-SCOPE.md).

| Review question | Evidence | Assessment |
|---|---|---|
| Can someone find artwork? | Slice 203 recorded `birds` search and keyboard Enter/focus. Slice 208 practiced `Sparrows` and `CC0` searches and the Dot/spot filter against the expanded 12-item catalog. | Search/filter behavior is evidenced. Search is phrase-based, not token-based; that distinction should remain visible in help. Keyboard search was not repeated against the expanded catalog. |
| Do the categories make sense? | All ten approved categories are represented across twelve records. Slice 208 filled the previous gaps with four item-level reviewed CMA references. | Taxonomy coverage is complete but thin. Some categories rely on one reference; the woodblock snow-spot study is not a polka-dot print. Tags must not overstate subject or production suitability. |
| Are provenance, filename, and asset ID distinct? | Catalog records distinguish stable Met/CMA asset IDs, local file and hash, source institution/item/API/policy references, rights evidence, credit and retrieval information. Source URLs are attribution, not image-fetch instructions. | The data model separates identity, local file, and provenance. Keep those values separately labeled in the UI. |
| Does selection survive reload? | Slice 203 recorded a bundled-reference save/reload. Slice 208 staged a CMA reference and separately imported local Met image, saved and reloaded both stable IDs. Slice 209 verifies actual browser/Electron drop, replacement, and reload/restart persistence. | Local persistence and separation of bundled versus imported IDs are evidenced. The combined practice was run by Codex, not an independent user trial. |
| Are recommendations useful without restricting choice? | Phase 8 explains `Recommended`, `Possible`, and `Needs review` guidance across five print uses. Every item remains selectable; guidance is advisory and does not change design values. | The model preserves user choice and communicates uncertainty. Resolution, specimen-edge, folds, sheen, and paper-study caveats matter because these are references, not validated production artwork. |
| Are formats sufficient? | All twelve bundled items are raster JPEGs without transparency. The separate local-import flow accepts PNG, JPEG, WebP, and sanitized SVG. | V1 has no bundled vector, transparency, clean production artwork, or verified seamless repeat. These are distinct future needs, not claims satisfied by this reference set. |
| Is the library meaningfully varied? | Twelve references now come from The Met and Cleveland Museum of Art, cover all ten taxonomy categories, and include textile photographs and paper/design studies. Slice 208 practiced the expanded catalog in a local preview. | Source and category variety improved, but subject, format, and production-readiness coverage remain narrow. This is a useful local reference V1—not the dense production-art library originally envisioned. |

### Rendered-evidence limits

Slice 208's recorded practice used a separate local preview at 1280×720 and
covered the 12-item count, searches, category filtering, CMA staging, combined
bundled-plus-imported save/reload, and browser-console status. Slice 209 used
real Chromium and Electron renderers for drop/replacement, unsafe-SVG
rejection, stable-ID reload/restart, a 375px viewport, and remote-request
checks. Slice 203 remains the recorded evidence for library keyboard
search/focus and narrow-width browse behavior on the original eight-item
catalog; those specific library interactions were not repeated against the
expanded catalog. Catalog tests verify that all ten categories have records,
but rendered practice sampled the Dot/spot filter rather than cycling every
category. The documented practice was run by Codex and is not an independent
maintainer or end-user usability trial. These limits are disclosed, not
treated as production-readiness evidence.

## Maintainer decision

The maintainer accepted the bounded twelve-item collection on 2026-09-24 as the
completed local reference V1 for Phase 9, with the limitations above. This is acceptance
of the stated pre-garment scope, not a claim that the library is dense,
production-ready, or independently usability-tested.

The denser fashion-oriented production-art library is queued as future
`CAPABILITY-G17`, after completion of all already-scoped G01–G16 work. It is
backlog only: its detailed scope must be refined before execution; the future
scope checkpoint is recorded in [`ARTWORK-LIBRARY-G17-QUEUE.md`](ARTWORK-LIBRARY-G17-QUEUE.md). This does
not authorize paid licenses, services, acquisitions, remote runtime fetching,
or work on a garment queue. Any future assets must have item-level provenance
and rights evidence, be relevant to garment-design use, and distinguish
reference photos/studies from clean artwork and repeat-verified production
tiles. Local/no-cost and no-runtime-network constraints remain in force unless
the maintainer explicitly reopens them.

Closing Phase 9 is not approval of the next garment direction. The garment
queue remains closed until a separate explicit maintainer decision.
