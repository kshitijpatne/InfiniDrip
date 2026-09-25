# EPIC-15/G02 — Constrained semantic edit model (Slice 237)

**Status:** Slice 237 implementation and focused exit gates complete. F03
started at Control Center revision 286 after F02 closed with verified Slice
235–236 evidence; F03 remains In Progress until S238 and S239 close.
**Scope:** A deterministic, user-authored edit operation model over the seven
registered recipes. This packet defines stable geometry anchors, typed moves,
undo/redo, source conflicts and rebase, garment geometry guards, and size-run
behavior. Slice 238 owns style-record persistence and downstream output wiring.

## Product decisions fixed for this slice

- Coordinates and movement deltas are in the existing pattern plane's
  centimetres. Measurements and design options remain separate source values;
  an edit never rewrites them.
- A corner ID names its two neighboring edges, not an array position:
  `anchor:v1/{recipe}/{role}/junction/{previousEdge}/{nextEdge}`. A curve
  control ID names a curve and its control slot:
  `anchor:v1/{recipe}/{role}/edge/{edge}/control/{1|2}`. All path segments are
  encoded. IDs resolve against the current recipe draft; missing or ambiguous
  names are conflicts, never guesses.
- One operation moves exactly one semantic anchor and stores an exact finite
  `(dx, dy)` in centimetres plus the semantic signature observed when it was
  authored. The UI may append several single-anchor operations as one atomic
  gesture group; the group creates one undo snapshot so connected seam edits
  do not expose an intermediate state as a usable pattern.
- The same displacement operation is replayed on each recipe-generated size.
  Every size is checked independently. One invalid size blocks its pattern,
  spec, nesting, and export; a whole-run output is blocked if any included size
  is blocked. No size is silently skipped or clamped.
- An operation is authored against an explicit source token. A changed source
  blocks derived outputs until an explicit rebase. Rebase preserves its
  centimetre delta only when the same semantic anchor and its edge/fold
  signature still resolve. Changed or missing topology becomes an actionable
  conflict; the model never retargets by edge index or nearest point.
- The caller must derive the source token from the exact fresh, unedited
  `recipe.draft(baseMeasurements, options)` for the active style. It must not
  reuse the document token without checking the current source. Rebase must
  derive its next token from the exact candidate base block. Slice 238 owns this
  call boundary and its end-to-end stale-source test.
- Two edits from competing style revisions that target the same semantic
  anchor conflict. Disjoint targets can be rebased only through the explicit
  rebase call. A merge also rejects operations from different recipes, schema
  versions, or source fingerprints before considering target conflicts.
  Resolving a same-anchor conflict requires an explicit choice of local or
  remote operation; values are never silently summed.
- Undo and redo move immutable operation-list snapshots, with the same
  30-entry bound already used for in-memory design history. A new operation
  clears redo history. Slice 238 persists this document with the style.
- Every geometry edit affects pattern, POM/spec, grade, nesting, relevant
  views, and garment exports. Derived values are recalculated from edited
  blocks. Surface-art sheet SVG remains independent. This is a dependency rule,
  not a fit or production-readiness claim.

## Validation contract

Apply the operation sequence to a fresh recipe draft and validate the result
without mutating source inputs. Each size reports its issues and output gate.
The deterministic checks are:

1. every coordinate and graded source measurement is finite;
2. every piece loop closes at its named edge junctions and has non-zero area;
3. the exported sewing-outline polyline has no non-adjacent segment crossing;
4. every `onFold` piece has one named `center`, `centerFront`, `centerBack`, or
   `fold` edge on `x=0`, and the rest of its sampled outline remains on the
   cuttable side of that fold;
5. all declared block stitches satisfy their existing recipe-owned match or
   ease checks, `recipe.checks` remains satisfied, and each POM value after
   the spec sheet's one-decimal rounding plus each optional tech-pack callout
   coordinate is finite;
6. every registered recipe size is independently replayed and checked.

The fold tolerance is the exporter's existing `FOLD_EPS` (0.01 cm). Ordinary
stitch tolerance and intentional ease bands come from `stitchChecks`, not a
new product estimate. Area and intersection epsilons are numerical safeguards,
not apparel standards. The output guard checks the same sampled sewing outline
used by rendering/export; it cannot establish physical fit, fabric behavior,
or factory acceptance.

Invalid but structurally addressable operations remain in the user's candidate
operation list so the user can correct connected geometry. Their actual draft
may be shown with actionable issue text, but dependent output is not current
and must not be exported. Malformed/non-finite operation input is rejected and
must remain visible in the UI's raw editor state when Slice 238 wires the
controls.

## Slice 237 rendered preview boundary

The existing Edit view is still a disposable front/edit-role `Piece` preview;
Slice 237 does not persist it, grade it, or use it for exports. To make that
boundary concrete before Slice 238, the Edit view now runs the same deterministic
piece/stitch/recipe checks on the candidate preview. It renders each issue with
an accessible alert, including invalid graded measurements/POMs/callout
coordinates, and states plainly that the preview cannot be saved or exported
and current outputs still use the parametric draft. Invalid source inputs pause
the editor and its preview checks. Passing this preview-only check is explicitly
not evidence of physical fit, drape, or factory acceptance. Slice 238 replaces
this transitional surface with saved semantic operations and applies the output
gate to the actual style.

The browser proof drives the real app through its export stage, records the
parametric SVG SHA-256 before the invalid edit, moves a handle to invalid
geometry, captures the warning, and confirms the downloaded SVG remains
byte-identical. Reset then restores the valid draft. The retained screenshot is
`evidence/S237-invalid-edit-preview.png`; the repeatable verifier is
`electron/verify-semantic-edit-preview.cjs`.

## Delegation assessment

No safe independent contributor slice exists here. The semantic IDs, operation
replay, garment constraints, preview diagnostics, and output boundary share one
contract across the seven registered recipes. Splitting implementation or
review across those coupled surfaces would weaken the pressure test. Codex
owns this slice and verifies the complete diff and rendered/output evidence.

## Exclusions and exit gate

No persistence schema, backup format, exporter baseline, measurement model,
garment recipe, AI feature, physical sampling, supplier flow, paid service, or
hosted feature changes in Slice 237. The current freeform Edit snapshot remains
exploratory until Slice 238 replaces it with the validated operation path; it
does not become a saved or production-approved pattern by this packet.

Exit requires unique semantic IDs for every anchor across all roles of all
seven recipes; tests for typed operation application, closure, fold, crossings,
stitches, every-size replay, changed/missing anchors, source conflicts,
explicit rebase, same-anchor conflict resolution, undo/redo, and malformed
input; 100% statement/function/branch/line coverage for the new production
model; and the rendered browser proof above showing actionable invalid preview
state and byte-identical parametric exports. The full repository,
protected-export, and final browser/Electron exit gates remain in Slice 240.
