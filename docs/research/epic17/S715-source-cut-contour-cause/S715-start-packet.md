# EPIC-17 / G04 V03 — S715 source-side cut contour diagnosis

## Verified start

- Start: 2026-10-11 03:12 UTC from S714 commit d9fdb3f9cde665dd27ea7f2e8e9f88b0d1461412 on codex/epic-17-g04.
- Refreshed origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0 remains an ancestor. Highest assigned slice across visible history is S714; S715 is reserved once.
- Canonical board revision 4187; EPIC-17 and G04-V03 are In Progress. S714 start/exit evidence is linked.
- Only the two previously untracked S700 diagnostic files remain untracked. No other dirty tracked changes; raw CAD and measurement evidence stay under the named C: evidence folder.
- Usage checked at start: ordinary usage allowed; primary 6%, weekly 42% informational.

## Objective and boundaries

Determine why the five S714 CUT contours exceed the fixed 0.001 cm limit by comparing the exact source vertices to the saved return vertices for the back, outer stand, inner stand, upper collar and under collar. Inspect the current interchange-only cut writer, adaptive offset tolerance, coordinate rounding, layout transform and emitted point ordering. Distinguish removed redundant points from shape-changing receiver edits and test any source-side candidate against the original exact source contour.

A source edit is allowed only if geometry checks demonstrate that the emitted DXF remains within the unchanged 0.001 cm source-shape threshold, without changing garment/pattern/stitch geometry, legacy DXF, protected byte identities, units, or V03 acceptance. If a concrete candidate is shown to address the measured point-loss cause, run one same-route CLO 2026.1.310 DXF-ASTM return on the modified current-source Polo M fixture in the existing named C: folder. Do not repeat an unchanged route or test another application, format, setting, or entity encoding.

## Required gates

- Preserve the fixed 0.001 cm round-trip threshold, all-seven-recipe and supported-option/grade scope, every V03 identity/units/geometry/layer/marks/repeatability/malformed-input/readability/rights/profile criterion, and legacy byte identities.
- Focused tests and 100% statement/branch/function/line coverage for changed production code; protected export-identity regressions; TypeScript; validated Control Center tests; git diff --check.
- Inspect any candidate DXF's source geometry before the single decisive same-route receiver check. Review actual returned contours and output; do not infer a pass from code tests.
- Do not run the full repository gate until the settled integrated Epic/PR candidate. Keep final coverage/build/browser/Electron/rendered review, final necessary-file cleanup, PR, safe merge, refreshed ancestry, required deployment and production E2E as explicit completion gates.
- Keep the goal active. Do not mark it stalled, paused, or blocked.

## Non-goals and delegation

No garment pattern/stitch graph change; no acceptance relaxation; no new CAD software or third-party receiver; no broad option matrix until a representative current-source route passes; no formal standards claim; no physical-fit/factory claim. No safe independent ownership exists for this shared DXF geometry/verifier work, so Codex owns investigation and integration.

## Decision boundary

If source points removed by the receiver are geometrically redundant within tolerance, implement an interchange-only simplification that keeps all original extrema, joins and source marks and proves the source geometry delta below the fixed limit, then test the same CLO route once. If the five shapes were materially altered rather than simplified, do not paper over them with pattern changes; isolate the writer/input cause from the existing bytes and implement only a demonstrably corrective source change. Continue independent source diagnosis without asking the maintainer for already-settled decisions.

