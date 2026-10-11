# EPIC-17 / G04 V03 — S693 adaptive interchange cut geometry

## Verified start

- Start time: 2026-10-10 22:01:56 UTC.
- Branch `codex/epic-17-g04`, clean S692 commit
  `146b60a9d0961e8cfb76be58637cb53efcaf14e4`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- S692 is the highest assigned number; S693 is reserved uniquely.
- The canonical board is revision 4106. EPIC-17 is In Progress; G04-V01/V02
  are Done; G04-V03 remains held on its independent exchange evidence gates.
- Goal record checked at the S692 boundary: active; objective remains complete
  EPIC-17 through implementation, evidence, final gates, safe merge and
  deployment. No goal status change.

## Scope

Implement an additive, explicitly versioned adaptive offset representation
for the G04 DXF interchange package only, addressing the source-proven cubic
offset cusp from S692. Keep source pattern geometry, recipe allowances, sew
paths, legacy `exportDxf` bytes and protected identities unchanged. Make the
candidate algorithm part of the signed package revision, retain existing
package verification behavior for already issued `/2` packages, and fail
closed on invalid or nonconvergent geometry. Generate actual rendered output
and compare the new CUT path against source-derived offset geometry.

This is not receiver qualification and cannot pass V03 by itself. No new
receiver, format, encoding, setting, UI, recipe, sewing convention, physical
sampling or acceptance change is in scope. Reuse the existing seven-recipe,
73-option and grade/package fixtures; do not export another local CAD trial
until the candidate's own geometry and rendered gates pass.

## Acceptance and exit gates

- New package declares a unique cut-geometry algorithm/schema revision; its
  drawing digest and package revision cover the resulting exact DXF bytes.
- Legacy DXF and protected export byte identities remain exact.
- The candidate offsets each source curve with its configured edge allowance,
  adaptively bounds sampled deviation below the 0.001 cm coordinate limit,
  preserves closed outlines, detects self-crossings/nonconvergence, and fails
  closed rather than emitting invalid outlines.
- Test exact error at independent dense parameters, the S692 cusp fixture,
  mixed edge allowances, straight/collinear/concave cases, invalid geometry,
  and all seven recipes/73 option rows/grade rows.
- Inspect actual candidate DXF rendered as SVG/PNG at whole-pattern and detail
  views for the five former vertices and representative non-cusp cut joins.
- Focused changed-area tests and 100% statement/branch/function/line coverage;
  no repository-wide gate until the integrated Epic/PR candidate.

## Non-goals and risks

Do not change physical pattern contours, sew graph, measurement options,
allowance values, legacy renderer or DXF baselines. The offset cusp is a
property of the mathematical 1 cm offset, not authority to redesign the
garment. A DXF polyline can represent its sampled locus; the implementation
must measure approximation error and detect invalid topology. Existing V03
receiver eligibility, rights, identity/marks, negative-input, repeatability,
readability and breadth proof remain open after this slice.

## Delegation

No disjoint low-risk task is available: algorithm design, candidate DXF bytes,
identity/version behavior and render inspection share the same geometry
contract. Codex owns implementation and integration; no external agent is
queued.

## Next action

Implement the scoped algorithm and package binding. Run targeted tests and
changed-code coverage, render and inspect the resulting actual DXF, and close
the slice durably. If an accurate, closed, non-crossing offset cannot be
generated under the fixed coordinate tolerance without changing legacy
behavior, fail closed and record the exact counterexample before choosing any
follow-up.
