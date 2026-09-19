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
`docs/research/ASSET-RESOURCES.md` as the artwork-placement layer. Slice 122 does not
re-verify the API; Slice 123 must confirm the exact Fabric.js version, its SVG import
fidelity for our piece paths, and its license file before any dependency is added.
No dependency is added in this slice.

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

- Fabric.js SVG import fidelity for our exact piece-path output (curves, folds,
  marks) is assumed from the catalogue, not yet proven in-repo. Slice 123 proves it
  with a parsed round-trip test or records the failure and stops the Epic.
- Whether placement belongs per size or per style (shared across the graded run) is
  decided in Slice 123: default is per style, shared across sizes, recorded explicitly.
- Print-vendor file requirements beyond the tech-pack spec page are out of scope;
  Slice 127 records what the spec page carries and what it does not promise.

## Estimates vs decisions

- Slice counts in `EPIC-6-EXECUTION.md` are plans, not velocity claims.
- The Fabric.js choice is a prior maintainer-visible decision, not a Slice 122
  invention. Anything it cannot do becomes a recorded Epic stop, not a silent
  substitution.
