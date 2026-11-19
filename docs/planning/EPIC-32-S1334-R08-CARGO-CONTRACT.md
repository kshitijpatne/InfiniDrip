# EPIC-32 S1334 — R08 Cargo Trouser contract

**Authority:** Existing maintainer-admitted sequential 56-blank EPIC-32/G18 goal.
**Baseline:** `origin/main` `19a8826c9e75760d057ff6135c4d2900ea3b21ff`.
**Decision type:** Bounded digital starter-profile contract; this slice earns no blank credit.

## Product decision

Add one identity-scoped `Cargo Trouser` profile to the existing `trouser`
recipe. R08 uses two mirrored side-leg patch-pocket bodies with a centered
box-pleat mark and a matching flap per side. Use hook-and-loop placement
references for the selected flap profile. Keep the existing four leg panels,
separate waistband, fly, and front pocket bags.

The box-pleat-and-flap architecture is a specific sourced example in C1, not a
universal rule. C2 shows a different contract using center inverted pleats,
back/bottom bellows and buttons; those features are deliberately outside this
minimal R08 profile. Do not add gussets/bellows, rear pockets, belt loops,
reinforcement, closure-material specifications or load/capacity claims in
S1335.

## Editable digital dimensions

All values below are software product choices for the first editable profile.
They are not copied from C1/C2, do not map to either document’s size labels,
and are not manufacturing or fit standards.

| Option | Default | Allowed range | Step | Meaning |
|---|---:|---:|---:|---|
| Cargo-pocket finished width | 18 cm | 12–24 cm | 0.5 cm | Finished body width after the centered pleat is folded. |
| Cargo-pocket body height | 20 cm | 14–26 cm | 0.5 cm | Digital finished body height from top edge to lower edge. |
| Center pleat intake | 4 cm | 0–8 cm | 0.5 cm | Added cut width represented by centered fold/placement marks. |
| Flap depth | 5 cm | 3–9 cm | 0.5 cm | Digital flap height; flap width follows the pocket-body width. |
| Vertical offset | 0 cm | −6–6 cm | 0.5 cm | Moves both pockets from the software mid-thigh anchor, midway between the draft’s hip and knee stations. |

The option definitions must be scoped to the stable R08 starter entry. The
paired left/right pieces remain mirrored and share these values. Closure type
is fixed as part of this single starter profile; closure choice is not a
numeric measurement control in the current option model. A different closure
architecture would require a separately admitted profile/contract.

## Pattern and construction contract for S1335

- Add two distinct cuttable cargo-pocket body pieces and two matching flap
  pieces. Add leg-panel placement outlines/marks so both pattern and technical
  flat show where the pockets attach.
- Encode the centered box pleat with named fold/placement marks on the cargo
  body; use an alignment reference at the center. Do not treat these marks as
  exterior cut edges or as proof of sewn pocket volume.
- Show the selected flap/closure placement. Do not invent stitch type, stitch
  density, textile, reinforcement, fastener performance or manufacturing
  sequence beyond the digital operation text.
- Define seam-allowance and notch behavior for each new cut piece. The pocket
  perimeter is an applied/topstitched boundary; do not create a false
  edge-to-edge seam-length match to the trouser leg. Use matching placement
  geometry/marks on the leg panels.
- Add POMs from the actual drafted pieces/marks for body width, body height,
  pleat intake, flap depth and placement. Keep their labels explicitly digital
  and preserve unrelated shared Trouser POMs.
- Add concise Tech Pack operations that name the body, pleat folds, placement,
  flap and closure references. Material and stitch performance remain
  unspecified.
- The technical flat must show the paired pocket bodies and flaps from the
  selected R08 route, with marks aligned to the drafted block and without
  leaking into generic Trouser or R01–R07.

## Required invalid-value and correction behavior

Preserve out-of-range restored values for review; never silently clamp them.
Show a field-specific actionable correction for each failed rule:

1. Values below/above a listed range: move the named option back into its
   visible range.
2. Pleat intake must leave positive finished body width; if it consumes the
   body, reduce intake or increase body width.
3. Flap depth must remain smaller than body height; reduce the flap or increase
   body height.
4. Both body and flap must remain within the drafted leg-panel envelope and
   clear the waistband, existing front pocket opening, fly, knee and hem. On a
   collision, reduce width/height or move the vertical offset toward the
   mid-thigh anchor. Do not auto-move or shrink a piece.
5. Left and right pocket geometry must remain mirrored and use the same
   parameters.

These are deterministic digital geometry checks, not ergonomic placement or
physical-fit validation.

## S1335 focused acceptance plan

- Confirm stable R08 entry identity, supported controls, option isolation,
  save/reopen preservation, generic/R01–R07 route isolation and eight existing
  output routes.
- Verify the actual block contains the four new cut pieces, named pleat/flap/
  placement marks, intended seam allowances/notches and no false stitched seam
  interface.
- Exercise defaults and range/relational/panel-collision invalid scenarios;
  the invalid value remains visible and guidance identifies a correction.
- Review the rendered technical flat and actual output artifacts for the R08
  route. Confirm edits change relevant output while protected legacy bytes stay
  identical.
- Run only the predeclared changed-area tests and changed-code four-metric
  coverage for the app slice. Use one validation process at a time. Do not run
  repository-wide coverage, the full coverage suite, broad coverage shards, or
  a substitute grouping before the terminal EPIC-32 gate.
- After app merge, exact-main release and stable/immutable live acceptance,
  R08 may become blank 56/56. Integrated replay/output review, frozen-candidate
  global gate and EPIC closeout remain separate required steps.

## Not established

No sewn sample, physical fit, comfort, wear, pocket capacity/retention, fabric
response, validated grading/nesting, production efficiency, supplier readiness,
production readiness or lossless external interchange is claimed. These are
non-blocking boundaries for this digital implementation.
