# EPIC-17 / G04 V03 — Polo unit-invariance control — Slice 550 start

## Verified start

Started `2026-10-08 23:05 UTC` on `codex/epic-17-g04` from committed S549 `0490538`; refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. The worktree was clean before packet creation. Highest assigned slice is 549; reserve S550. Canonical board revision is 3313 and G04-V03 is In Progress. The active goal remains needed through EPIC-17 completion and safe merge. Ordinary usage is allowed (primary 57%).

## Objective and method

Complete the one Polo unit-invariance exchange that S549 prepared but could not run. The exact millimeter fixture is geometrically identical to the S545 centimeter Polo M source after inverse scaling. Import it once into the already-running CLO 2026.1.310 session as DXF-AAMA in millimeters, at 100% scale and no rotation, using the same remaining import/export settings as S545. Export once to a separate S550 C:-only folder, convert measured output lengths back to centimeters, compare all 18 source contours, and visually inspect the rendered import and export.

The S549 ambiguity is cleared for this attempt: fresh CLO screenshot and accessibility observations now both show the same loaded 2D pattern canvas, with no Export DXF dialog in the accessibility tree and no separate modal window. Continue only while a fresh observation keeps the target state coherent.

## Scope, boundaries, and acceptance

- Source DXF SHA-256: `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`. S549 mm fixture SHA-256: `8fb314343cdf54557e4d331b5aabc1916dc1ab77f45ac5a791d76f9ebe6874af`.
- Import/export DXFs, CLO project copies if needed, screenshots, and analysis outputs must remain under `C:\G04-CLO-DXF-Exchange\S550-polo-unit-invariance-control\` only. Preserve the S549 fixture and source unchanged.
- Run exactly one millimeter AAMA import/export cycle. Do not change unrelated settings, repeat a settings matrix, restart/close CLO, edit pattern geometry, change V03 criteria, or claim industrial profile or semantic qualification from this control.
- Preserve the existing `0.001 cm` contour acceptance. Record all 18 CUT/SEW outcomes, the five known Polo CUT discrepancies, topology/vertex deltas, exact input/output hashes, receiver settings, and rendered import/export evidence.
- If all contours pass, this control isolates numeric unit representation as a likely contributor and documents only that result. If the same corners fail, record that unit representation does not explain the observed loss; keep the gate failed and pursue a distinct, evidence-led cause. Any target-state mismatch, import warning/error, incomplete output, or uninspectable rendering stops the cycle and is reported exactly.

## Remaining V03 gates and non-goals

This one-recipe differential does not establish an exact current apparel profile edition, CUT/SEW/mark semantics, grading/options, malformed-input rejection, all-seven round-trip, or independent receiver qualification. V03 acceptance and every existing hold stay unchanged. No external contact, production-code change, source topology change, protected export baseline change, physical sampling, fit claim, factory claim, or production-readiness claim is in scope. No independent agent owns a safe, separable task for this single stateful CLO run.

## Exit evidence and timing

At exit, record the CLO UI steps, focused data and rendered review, hashes and unchanged gate outcomes; update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the canonical board through the validated command layer. Report implementation/time spent preparing evidence, focused verification, external-agent waits, and maintainer-decision time separately. No full repository gate is due unless production source/tests change.

**Next action:** execute one controlled S550 AAMA millimeter import/export only after copying and verifying the fixture under the named S550 C: folder; exit gate is the comparison and rendered evidence above.
