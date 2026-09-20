# Surface Design — Research Record

_Slice 122, EPIC-6 foundation. Docs-only. No code, geometry, or export behavior changes in this slice._

## Why this Epic exists

ROADMAP §1.3 splits "design additions" into two unrelated problems: (a) structural
details that change pattern geometry (pockets, darts, plackets, collars — deep engine
work, already covered by Epics 1–4), and (b) surface design that does not change
geometry (prints, patches, colour blocking, fabric preview). This Epic is (b) only.

PROJECT-DECISIONS records surface design as a separate later Epic after the trouser
block, explicitly independent from unfinished garment geometry. MVP-PLAN §3.3 keeps
prints, patches, colour blocking, and fabric preview in scope, and keeps embroidery
machine formats (DST/PES) out as a v2 file-writer.

## Library decision (inherited, to verify before use)

ROADMAP §3.1 records the decision: **Fabric.js** (MIT, TypeScript-native, built-in
SVG↔canvas parser, drag/scale/rotate/clip). It was verified in
`docs/research/ASSET-RESOURCES.md` as the artwork-placement layer. The Slice 126
scratch probe confirmed Fabric.js 7.4.0, its MIT license, and the representative
piece-path SVG round trip, but no dependency was added because the accepted UI
uses numeric controls and string-rendered SVG. Direct canvas manipulation remains
deferred and must re-verify the then-current version before a dependency lands.

## Contract (fixed for EPIC-6)

1. Geometry is never modified by surface work. Drafting, grading, POM measurement,
   checks, nesting math, and export writers keep their current behavior and outputs.
2. Artwork placement is a per-piece overlay: an artwork reference plus a transform
   (translate/scale/rotate) plus an optional clip to the piece boundary, with an
   explicit z-order. Nothing in `Piece`, `Block`, `Stitch`, or the grammar changes.
3. Preview is honest: a flat placement preview, never a drape simulation. No fit or
   sewability claim comes from artwork.
4. Persistence is versioned. Placement state rides the existing save format as a new
   versioned section; old saves load with empty placement. Raw invalid placement
   values stay visible and get guidance; nothing silently clamps.
5. Exports keep true scale. Cutting files (SVG/DXF/tiled PDF/A0/projector) are
   byte-identical when placement is empty. Print/embroidery placement appears only
   as a placement spec addition to the tech pack plus an opt-in print-ready output;
   the 10 cm calibration square and all eight legacy hashes stay pinned.
6. Guidance warns, never blocks silently: out-of-bounds artwork, low effective
   resolution at true scale, and ink-coverage notes are warnings with field-linked
   corrections.

## Conflicts and open questions

- The Slice 126 probe covers the representative `M`/`L`/`C`/`Z` path grammar, not
  the full interactive canvas stack or every future piece-path feature. Any later
  direct-manipulation consumer must repeat the prove-or-stop check before adding
  Fabric.js.
- Whether placement belongs per size or per style (shared across the graded run) is
  decided in Slice 123: default is per style, shared across sizes, recorded explicitly.
- Print-vendor file requirements beyond the tech-pack spec page are out of scope;
  Slice 127 records what the spec page carries and what it does not promise.

## Estimates vs decisions

- Slice counts in `EPIC-6-EXECUTION.md` are plans, not velocity claims.
- The Fabric.js choice is a prior maintainer-visible decision, not a Slice 122
  invention. Anything it cannot do becomes a recorded Epic stop, not a silent
  substitution.

## Fabric.js verification verdict (Slice 126, scratch probe — repo untouched)

- Exact version probed: **7.4.0** (npm registry latest at probe time).
- License: **MIT**, `LICENSE` file present in the published package.
- Types: bundled (`dist/index.d.ts`); no `@types` package needed.
- Runtime footprint: **zero** runtime dependencies (`canvas` and `jsdom` are
  optional peers only).
- SVG fidelity: a representative piece-path-grammar SVG (`M`/`L`/`C`/`Z` with
  millimetre-rounded centimetre numbers) round-tripped through
  `loadSVGFromString` → `toSVG` with an **identical command sequence and
  maxDelta 0** on all 18 coordinates.
- Decision: **proven but not added.** Slice 126 editing is numeric-control
  based and the preview is string-rendered SVG, so no canvas library is
  needed; adding the dependency would be lockfile churn with no consumer.
  Direct canvas manipulation (drag/scale artwork on the piece) remains
  deferred and must re-verify against the then-current Fabric.js version
  before any dependency lands, since the proof above covers the SVG
  path grammar only, not the interactive canvas stack.

## Print anchor decision (Slice 127)

Artwork-space centimetres are the print specification: the print sheet and
the tech-pack page describe each entry by id, kind, piece role, true-scale
size, transform, stack order, and source. Piece association is by role name
only. No on-piece anchor point (relative to a piece landmark, fold, or
grainline) is invented, because the placement model carries no anchor field
and inventing one would silently decide positioning the user never entered.
Positioning artwork on pieces — and any clipping of artwork to piece
boundaries — stays explicitly out of scope until a slice adds a real,
user-visible anchor control with its own research, validation, and tests.

## Blocked warnings and their unblock questions (Slice 128)

Out-of-bounds, resolution-floor, and ink-coverage warnings are explicitly
not implemented. Each needs a product decision this Epic does not contain:

1. Out-of-bounds: define the anchor. Is artwork positioned relative to a
   piece landmark, the piece bounding box, or the fold/grainline — and which
   control captures that anchor from the user?
2. Resolution floor: capture source dimensions. Should placements record
   source pixel dimensions (a schema addition), or is effective size checked
   against a declared print-process minimum? What minimum, sourced from
   where?
3. Ink coverage: define the budget. Coverage of what area (piece, marker,
   garment), measured how, with what researched threshold?

Until these are answered, validity warnings are the complete, honest
guidance boundary. No invented threshold ships in their place.
