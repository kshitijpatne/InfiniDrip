# EPIC-17 / G04 V03 — Slice 501 Polo import-option practical retry

## Verified start

Started `2026-10-08 15:03:15 UTC` from clean S500 `fe8623acc173ed51205a96db5b6806f807798010` on `codex/epic-17-g04`; refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S500
was highest; S501 is reserved. Board revision 3113 has EPIC-17/G04-V03 In
Progress, V01/V02 Done. Goal is active and still matches the objective.
Primary usage 16%; weekly 40%.

## Scope

Retry S499's unrun four-cell CLO matrix after S500 sent a graceful close request
and verified that the previous process exited. Import the exact Polo M fixture
once in each profile: DXF-AAMA/curve optimization off, DXF-AAMA/on,
DXF-ASTM/off, DXF-ASTM/on. Keep units cm, scale 100%, no rotation, original
grain, notches to both and ratio fixed; export each as DXF-ASTM with unique
names. Compare the five localized source points and full affected contours to
both S498 generations at the unchanged 0.001 cm threshold. Capture actual UI
settings, notices, output hashes and rendered pieces.

All inputs/exports/projects/captures stay under
`C:\G04-CLO-DXF-Exchange\S501-polo-import-options`. The source copy must match
SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
Do not upload or use CLO-SET/CONNECT. Close CLO once the trial ends. No
production code, pattern geometry, tolerance, protected export identity, V03
criteria, rights/local-handling state, or claim changes.

## Stop/acceptance boundary

Use only a fresh, targetable CLO window. If the app again cannot provide a
usable window, record the exact error, stop UI input, and do no import/export.
If the four cells run, the result only identifies whether the tested UI
options affect this receiver's behavior; it does not prove industrial format
conformance or clear any V03 gate. Polo's failure, negative-control failure,
rights/local processing, semantic marks/layers, native grading, and independent
receiver gates remain until all corresponding evidence passes.

Focused checks: hash assertions, four-cell geometry comparison/rendered review,
validated board replay, and `git diff --check`. No full repository gate applies
to this practical-evidence slice.

**First action:** hash-pin the input under the named C: folder, then relaunch
CLO once and inspect the fresh app/window objects before interacting.
