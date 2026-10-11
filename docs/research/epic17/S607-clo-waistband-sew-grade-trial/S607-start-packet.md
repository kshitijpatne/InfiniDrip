# EPIC-17 / G04 V03 — CLO waistband SEW-grade trial — Slice 607 start

## Verified start and goal

- Start: 2026-10-09 10:50 UTC on `codex/epic-17-g04`, from S606 commit
  `b00abc87b60e53108408e9908a4c19ce0d376a56`. `origin/main` was refreshed at
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and is an ancestor. Highest
  assigned slice is 606; reserve S607. Worktree was clean at reservation.
- Canonical board revision 3558: EPIC-17/G04-V03 In Progress and G04-V02
  Done. Goal remains the admitted G04 objective through evidence, all gates,
  PR, safe merge, ancestry and any required deployment.
- User has confirmed product-development use is authorized and CLO import /
  export is local. The existing CLO 2026.1.310 (r58944) process stays open.
  All S607 CLO project, DXF, script, screenshot and report files must be under
  `C:\G04-CLO-DXF-Exchange\S607-clo-waistband-sew-grade-trial\` only.

## Scope and method

S606 matched the S565 corrected-sizegroup1 pattern index 2 / child shape 2
coordinates to its source waistband SEW contour with maximum vertex residual
`0.0000610352 mm`; pattern index 2 / child shapes 0 and 1 matched source CUT.
This is source-specific geometry evidence, not CLO API semantic proof or proof
that an Edit Grading selection targets child shape 2.

S607 makes one tightly scoped practical check in the already open disposable
S565 project:

1. Inspect the current Edit Grading state and identify whether its selected
   points can be unambiguously tied to the exact waistband SEW path mapped in
   S606, as distinct from the CUT outline. Capture the UI and state before any
   edit. If ambiguous, make no grading change and close this slice with the
   exact ambiguity evidence.
2. If unambiguous, apply only the S567 source-derived five-size SEW deltas to
   this disposable project: each step moves points 0/3 by `(+2,+1.5 cm)` and
   points 1/2 by `(+4,+1.5 cm)`. Do not alter CUT grades, cut geometry,
   product source or any other piece.
3. Export one DXF-ASTM Graded Nest at centimeters, 100%, Do Not Rotate, with
   all five sizes. Save to this S607 C: folder. Reimport the emitted DXF once
   into a disposable workspace in the same folder. Compare each of the five
   source CUT and SEW contours at the unchanged `0.001 cm` maximum vertex
   residual. Capture and inspect actual rendered output and import/export
   settings/notices. Preserve all diagnostics, including failures.

## Acceptance, holds and non-goals

- Pass this slice's trial only if selection identity is unambiguous, all five
  sizes' CUT and SEW contours satisfy `0.001 cm`, and rendered reimport is
  legible and consistent. Any ambiguous selection, geometry mismatch, lost
  path, import/export error or misleading render fails closed and retains the
  grade/exchange hold.
- A successful waistband-only trial does not clear any admitted V03 gate,
  which still requires all seven recipes, profile/rights evidence, semantics,
  marks, malformed-input behavior and repeated round trips. It is not an exact
  format-compatibility claim.
- Do not change product source, the pattern/stitch graph, recipe scope,
  acceptance criteria, the `0.001 cm` threshold, protected DXF identities or
  legacy behavior. No physical sampling, fit/factory acceptance or production
  readiness claim.

## Evidence and gates

Retain the byte-verified source project, trial project if edited, exact emitted
and reimported DXFs, reproducible comparison report, settings/error capture
and rendered screenshots under the C: folder. Hash the evidence. Update
`PROJECT-STATE.md`, `CONTEXT-INDEX.md`, this admission record and the canonical
board through its validated command layer at exit. Focused verification is
the five-size source comparison plus Control Center suite and diff checks; no
production source changes means no changed-code coverage requirement. Full
repository build/coverage remains for the settled Epic/PR candidate.

No safe independent delegation exists for this exact live-app trial; Codex
owns observation, any disposable-project edits, comparison and review.
