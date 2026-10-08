# EPIC-17 / G04 V03 — Polo unit-invariance UI recovery — Slice 551 start

## Verified start

Started `2026-10-08 23:09 UTC` on `codex/epic-17-g04` from S550 commit `1abe453`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. The checkout was clean before packet creation. Highest assigned slice is 550; reserve S551. Canonical board revision is 3317 and G04-V03 is In Progress. The admitted goal remains active through safe merge. Ordinary usage is available. CLO is already running; do not close or relaunch it.

## Objective

Attempt the prepared single Polo unit-invariance test using screenshot-backed coordinate input for the visibly exposed Windows Save File picker. Save a safety copy of the currently open CLO project, then import the exact cm-equivalent mm DXF, export once as DXF-AAMA in millimeters at 100% and no rotation with S545-equivalent remaining settings, compare all 18 contours after inverse scaling, and inspect the rendered output. This is a stateful practical test, not implementation of the format.

## Inputs and boundaries

- Use only `C:\G04-CLO-DXF-Exchange\S551-polo-unit-invariance-ui-recovery\` for the source fixture, mm fixture, saved CLO project copy, DXF export, screenshots, and analysis. Copy only hash-pinned inputs from S550; recheck source `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca` and mm `8fb314343cdf54557e4d331b5aabc1916dc1ab77f45ac5a791d76f9ebe6874af`.
- The screenshot clearly exposes a native Save File picker in the CLO window. Its current accessibility capture omits the picker controls and `list_windows()` reports no separate picker. Use the Computer Use screenshot-coordinate path only for controls visibly present in the fresh screenshot. After each action, refresh and inspect. If input is rejected, focus cannot be visually confirmed, or any screenshot/state mismatch worsens, stop further UI input and preserve all V03 holds.
- Do not enter any unrelated user information, upload data, install software, change privacy/security settings, or use any non-C: import/export path. Do not modify pattern geometry, options, recipe source, protected DXF baselines, or acceptance criteria.

## Acceptance and interpretation

- At most one unit-equivalence AAMA import/export. Compare source and output topology and symmetric contour distance in centimeters using the unchanged `0.001 cm` gate; retain exact hashes and rendering evidence.
- Passing would clear only the specific unit-representation comparison for Polo M/default. A repeat failure would show that unit representation alone does not explain the current discrepancy; it would not prove a format defect.
- The five Polo CUT contour failures, exact industrial profile/edition, CUT/SEW/mark semantics, grades/options, malformed-input rejection, all-seven same-profile evidence, and qualified receiver acceptance remain open unless directly proven. No V03 acceptance changes.

## Exit and non-goals

No physical fit, factory acceptance, production-readiness or exact-format compatibility claim without the admitted evidence. No safe independent delegation exists for this single shared-app session. At exit, write hashes, exact UI outcome, output analysis/render review, time split (implementation, focused verification, agent waits, maintainer decisions), Project State, Context Index, and validated board evidence. Full repository gates remain reserved for the settled Epic candidate because no production source is changing.

**Next action:** copy and hash-verify the two inputs in the named C: folder; then use one fresh screenshot observation to target the visible Save File location/name controls and proceed only if the action is verifiably accepted.
