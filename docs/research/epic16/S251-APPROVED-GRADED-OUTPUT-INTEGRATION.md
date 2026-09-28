# Slice 251 — approved graded output integration

**Status:** In progress; implementation boundary follows Slice 250.
**Base:** Slice 250, `043378b`.
**Parent work item:** `EPIC16-M03` remains In Progress. Slice 251 is the final
M03 implementation slice before EPIC-16 final review.
**Scope authority:** `docs/planning/EPIC-16-ADMISSION.md` M03 and Slice 251;
`docs/research/epic16/S250-EXIT.md`; and the maintainer decision in
`docs/PROJECT-DECISIONS.md` that whole-run files stay withheld until a grade
plan is approved.

## Objective

Use only a current, explicitly approved custom-style grade plan to draft and
inspect its declared size run, reconcile the generated pattern measurements,
POMs and cutting quantities against the plan, and expose selected-size and
whole-run outputs only when the corresponding digital checks pass. Keep the
one-size path usable when no approved plan exists and preserve all legacy
graded behavior and protected export bytes.

## Implementation boundary

- Dispatch custom one-size styles through a separate plan-driven path. Do not
  route them through the shared legacy grade-rule/default XS–XL path.
- Derive each declared size's recipe inputs explicitly from the saved base plus
  that size's authored deltas. Do not infer a constant for an absent input,
  extrapolate from the size position, or silently clamp unsupported values.
- Treat measurement and option deltas as drafting inputs. Treat each declared
  POM target as a separate expected result; measure the generated geometry and
  report the target, generated value and difference per size without
  conflating a measurement rule with a POM result.
- An exception is not a hidden default. Any exception that leaves a required
  drafting input unresolved blocks generation for its affected size. An
  unsupported exception or a missing POM target remains visible and blocks
  the whole-run outputs that claim a complete size run.
- Recheck project/style identity, recipe, capture revision, immutable design
  head and base fingerprint at every generation/export boundary. A stale,
  invalid, unapproved or concurrently changed plan cannot emit graded output.
- Verify every size's drafted geometry, POM rows and construction/options;
  reconcile each output's piece/size labels and cut quantities with the same
  complete size run before enabling whole-run Tech Pack, Projector, Marker or
  frozen capture. Preserve one-size outputs without a plan.
- Keep quantities and digital estimates labeled as design data. Do not imply a
  production marker, exact fabric yield, fit or physical validation.

## Acceptance criteria

1. For each of the seven recipes, a completed approved plan yields one
   deterministic input set and freshly drafted block per declared size,
   including supported per-size recipe options. The base row reproduces the
   saved custom one-size block and values.
2. Generated measurement inputs and all recipe POMs are inspectable for every
   plan size. POM target, generated POM and numerical difference are distinct
   in review output. A POM target is never silently substituted for computed
   geometry.
3. Cutting and export size/piece quantities reconcile to the same declared
   size run. Unsupported input exceptions, missing targets, invalid drafting,
   stale bindings, or output mismatch visibly block the affected whole-run
   artifact; no partial run is labeled complete.
4. No-plan, draft, reviewed-only, stale, invalid, and concurrent-change states
   retain selected-size one-size outputs and keep custom graded/whole-run and
   frozen outputs unavailable. A current approved plan enables only outputs
   whose geometry and quantity checks pass.
5. Legacy styles retain their previous graded controls, artifact bytes and
   baseline identities. Custom-plan dispatch does not alter the legacy
   `gradeRun` / `draftAtSize` behavior.
6. Cover every recipe, non-linear size deltas, non-default base position,
   option changes, supported and unsupported exceptions, absent or mismatched
   POM targets, stale plan/base, invalid geometry, cut quantities, each
   selected-size and whole-run output, and freeze/reload behavior.
7. Preserve 100% statement, branch, function and line coverage; strict app and
   Electron builds; Control Center tests; all eight protected legacy export
   identities; and actual rendered/drafted/parsed output review.

## Non-goals

- Supplying or endorsing a population, size chart, measurement procedure or
  grade increments on the user's behalf.
- Inferring the numeric rules for a chart from existing recipe constants or
  extending the plan beyond its explicitly declared labels.
- Physical-fit validation, standards conformity, sample approval, sewing,
  factory readiness, or claims about production yield.
- Broad Tech Pack redesign, new garment families, external-provider features,
  or changes to unrelated manual UI quality findings.

## Maintainer decision — exact POM reconciliation

Resolved by the maintainer on 2026-09-27: exact numeric equality between each
applicable generated POM and its plan target, using unrounded centimetre values.
No tolerance or display rounding can turn a mismatch into a pass. A mismatch
blocks that size; any blocked or unresolved size blocks whole-run artifacts.
Show the target, generated value and raw difference. An explicit
`not applicable` exception is allowed only when the output identifies its
reason; it does not count as a numeric match. An exception that leaves a
required drafting input unresolved blocks the size and whole run. This is a
digital plan/output correspondence rule, not physical fit or sample tolerance.

## Verification and exit

The exit report must record every recipe and size actually reviewed, target vs
generated POM differences, cutting/export quantity proof, actual output
parsing, stale and exception-blocking evidence, test/coverage/build results,
protected identity hashes, and all remaining digital/physical limitations.
Update `PROJECT-STATE.md`, `ARCHITECTURE.md`, this packet, the admission and the
validated Control Center in the same landed slice as the behavior.
