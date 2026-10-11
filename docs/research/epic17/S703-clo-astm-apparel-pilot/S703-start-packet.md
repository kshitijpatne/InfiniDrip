# EPIC-17 / G04 V03 — S703 CLO DXF-ASTM apparel-profile pilot

## Verified start

- Start: 2026-10-11 00:04:51 UTC from S702 `f06e9691b8ccb5c7ea8b3e0fb3c0e9a21e4dd61a`.
- Branch `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- S702 is highest assigned; reserve S703. Board revision 4141; EPIC-17 In Progress, V03 held, goal active.
- Existing candidate: `C:\G04-CAD-Interchange\S700-named-piece-package\polo-m-named-pieces.dxf`, SHA-256 `142e6d8aaf79e15eb703ca339023e35192b458128328a7e18c93a7e6f2579634`.
- Receiver: already installed/open CLO 2026.1.310. No install or app switch.

## Objective

One controlled empirical test of CLO's first-party documented DXF-ASTM apparel
profile, using the exact current Polo M source-package drawing and the existing
local CLO session. S700 used Standard DXF and therefore did not test this
distinct profile. Keep input unchanged, preserve all files under
`C:\G04-CAD-Interchange\S703-clo-astm-pilot\`, and compare the actual returned
file/render against the same-revision source.

## Exact controls and stop gates

Import format: DXF-ASTM; scale: centimeters; rotation 0; no auto-distribute,
no curve-point optimization, no geometry simplification, and no notch
relocation. Export once as DXF-ASTM, centimeters, no rotation, current M only,
no grade synthesis, with the same notch duplication choice as the previous
pilot. Record every visible setting and the exact error text if import fails.

Stop if the source fails to import, any of the nine expected pieces is absent,
units/layout are incorrect, or any source CUT/SEW contour or required mark
fails the existing 0.001 cm checks. No second setting/format trial. A full
pass on this Polo M fixture only permits a later option/grade-breadth plan; it
does not alone pass V03, establish standards conformance, or close the Epic.

## Fixed acceptance and verification

Keep all seven recipes, supported options/grades, identity/marks, malformed
input, repeatability, readable-output, rights/profile, protected legacy byte
identities, and every other admitted V03 gate unchanged. Render/inspect actual
output; record source/import/return hashes. CAD and derived artifacts remain
on C:. No source geometry or legacy DXF edits in this receiver pilot.

At exit, record implementation time, focused comparison/render review, UI
operation, external waits and maintainer decisions separately. The check is
bounded and does not use a separate coding agent.
