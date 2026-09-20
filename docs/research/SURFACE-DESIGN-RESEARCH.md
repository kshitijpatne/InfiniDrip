# Surface Design — Research Record

_Slice 122 foundation record; Epic 6 exit reconciled 2026-09-20. The research
record remains the source for shipped boundaries and deferred questions._

## Why this Epic exists

ROADMAP §1.3 splits "design additions" into two unrelated problems: (a) structural
details that change pattern geometry (pockets, darts, plackets, collars — deep engine
work, already covered by Epics 1–4), and (b) surface design that does not change
geometry (prints, patches, colour blocking, fabric preview). This Epic is (b) only.

PROJECT-DECISIONS originally recorded surface design as a separate later Epic after
the trouser block, explicitly independent from unfinished garment geometry. MVP-PLAN §3.3 keeps
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
4. Persistence is additive. Placement state rides the existing save/recovery format
   as an optional section with no format-version bump; old saves load with empty
   placement. Raw invalid placement values stay visible and get guidance; nothing
   silently clamps.
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

## Epic 6 exit reconciliation (2026-09-20)

Slices 122–130 are merged to `origin/main`. The shipped scope includes the
headless model/math/overlay, Style-panel placement sets per garment/style,
optional persistence, true-scale artwork-space preview, opt-in calibrated print
sheet, tech-pack placement page, and warn-only invalid-entry guidance. The
cross-garment mounted-app audit covers all seven recipes, and Slice 130 adds
measured warn-only bounds, resolution-floor, and coverage guidance using the
accepted digital contracts below. Piece clipping and on-piece artwork
repositioning, embroidery machine formats, 3D/VTO, and physical validation
remain deferred; no production-readiness claim follows from this digital
evidence.

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

## Blocked warnings and their resolution (Slices 128–130)

Slice 128 recorded three missing decisions. Slice 130 resolves them as
warn-only digital checks:

1. Out-of-bounds: define the anchor. Is artwork positioned relative to a
   piece landmark, the piece bounding box, or the fold/grainline — and which
   control captures that anchor from the user?
2. Resolution floor: capture source dimensions. Should placements record
   source pixel dimensions (a schema addition), or is effective size checked
   against a declared print-process minimum? What minimum, sourced from
   where?
3. Ink coverage: define the budget. Coverage of what area (piece, marker,
   garment), measured how, with what researched threshold?

The implementation does not clip, reposition, gate exports, or make a physical
fit/print-quality claim. Unknown source dimensions remain unratable rather than
being guessed.

## Slice 130 resolutions

Slice 130 answers the three blocked questions with explicit, bounded
contracts instead of deferring them again:

### Anchor contract

Artwork offsets measure from the centre of the named piece's true-scale cut
bounding box at base size (the same size the tech-pack sketch draws). Both
the box and the artwork corners derive from real drafted geometry, so
out-of-bounds is a measured containment fact: any artwork corner outside the
piece box warns, edge-touching counts as inside (matching the existing
overlap convention). Piece roles resolve exactly: block role first, then
piece name; anything else warns with the available role list. Frames rebuild
per draw from the live draft, so measurement edits move the boundary and the
warnings follow without stored state. The panel caption states the anchor.

### Print floor derivation

150 DPI is the widely published minimum for textile print reproduction.
150 / 2.54 = 59.055… px/cm; the contract floors to 59 and warns below it.
Warn-only; placements without persisted source dimensions are unratable and
never warn. Source dimensions are optional persisted fields, so old saves
load silently and no version bump was needed.

### Coverage formula

Coverage = (width × height × scale²) / (cut-outline shoelace area). Both
areas are real measurements, not estimates. The warn threshold is a ratio of
1 — artwork at or above piece area cannot print without full-bleed intent —
which is a physical containment boundary, not a production budget. Below 1
the ratio stays silent; no ink-hand or curing claim is made.

### Artwork IDs stay editable

The row Name input keeps ids user-editable, so invalid-ID guidance always
has a focusable correction target. Rows are addressed by position, so two
rows may transiently share an id without collapsing into each other; the
add form still rejects duplicates for new entries.
