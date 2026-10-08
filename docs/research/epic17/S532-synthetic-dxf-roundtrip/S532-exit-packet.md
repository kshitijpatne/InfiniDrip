# EPIC-17 / G04 V03 — CLO synthetic DXF-AAMA round-trip — Slice 532 exit

## Result

In the single already-running CLO 2026.1.310 (r58944) process, the S531
positive synthetic DXF-AAMA control imported, exported, and re-imported into a
fresh project. The 402-byte input SHA-256 is
`78BDF785BBBF882E2E91F5F08C7446CA944B8501C6F54B30A2AF07CC34C49147`.
It contains a 10 cm square CUT polyline and an 8 cm inset SEW polyline.
All exchange inputs, outputs, captures and derived evidence are in
`C:\G04-CLO-DXF-Exchange\S532-synthetic-roundtrip\`.

Import used DXF-AAMA, centimeters, 100%, no rotation, original grain,
notches-at-both ratio, `Import Draw Curve Points` on, `Optimize` off, and
`Remove Non-Grading Points` off. Export used DXF-AAMA, Graded Nest, centimeter
at 100%, no rotation; Text Codec was unchecked; `Duplicate Notch on Seam
Allowance` was checked; other visible export options were unchecked. Re-import
used the same import profile and settings. CLO showed the outer boundary and
inset dashed sew contour. It displayed an information dialog that seam
allowances were imported in Custom mode to preserve their shape; no export
error appeared.

The first exported DXF is 3,711 bytes, SHA-256
`F0D6DB9C260986BB73D82D2535956F2097BFD855A6832D6BE26B6B9B797EECCD`. Its
header identifies AC1009. It has four POLYLINEs, sixteen VERTEXs, sixteen
POINTs, one LINE, eleven TEXT entities, and one INSERT. Three copies of the
outer CUT geometry are present on numeric layers `1`, `14`, and `8`; the inner
SEW geometry also uses layer `8`, so that layer mixes CUT and SEW geometry.
Source-to-generation-one maximum vertex deviation is `0.0000022361 cm` for
both CUT and SEW. The three CUT copies coincide.

A second export from the re-imported file used the same settings. It is 3,716
bytes, SHA-256
`2536AE820AA65048A35FF822B98DC790F1E28AE1980A4E38CCA0385C0BFFE99A`. Entity
counts and layer pattern stayed the same; no new geometry copies appeared.
Source-to-generation-two maximum deviation is `0.0000036056 cm`; generation
one to generation two maximum deviation is `0.0000014143 cm`. Every measured
deviation is below this slice's `0.001 cm` screening threshold. These results
show stable geometry for this simple synthetic shape and observed settings.

## Gate disposition and limitations

- Positive synthetic import/export/re-import geometry screening: **pass** for
  this simple fixture and CLO build/settings only.
- Negative malformed-input behavior: **failed** in S531; CLO silently
  accepted that malformed input and omitted its inset SEW contour. This
  concrete failure remains in the V03 evidence set.
- Semantic interchange: **not passed**. Output duplicates CUT geometry and
  mixes CUT and SEW on layer `8`; entity counts or geometric closeness do not
  establish standardized layer semantics.
- Industrial CAD profile, applicable receiver rights, local-only handling,
  seven-recipe representative fixtures, grades, complete semantics, and full
  round-trip acceptance: **not established**. The S526 trial-purpose/data
  review is an independent hold. No G04 pattern bytes were used.
- No V03 acceptance, V02 hold, source geometry, legacy DXF behavior, protected
  export identity, or product code changed. G04-V03 remains In Progress.
- CLO stayed open throughout; there was no close or relaunch.

Rendered evidence: `Evidence-positive-import.png`, `Evidence-export-options.png`,
`Evidence-export-complete.png`, `Evidence-reimport-settings.png`,
`Evidence-import-seam-allowance-warning.png`, `Evidence-roundtrip-import.png`,
`Evidence-gen2-export-options.png`, and `Evidence-gen2-export-complete.png` in
the named C: folder. The warning capture contains only the dialog, not other
desktop content.

## Verified closeout

Started `2026-10-08 20:44:31 UTC` from S531 commit `2ce6173` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor. S532 is unique.
Start board replay: `3239→3240→3241`; validated exit replay: `3241→3242→3243`
on G04-V03. Preflight on a C:-only board copy matched both commands before
canonical replay. Control Center tests passed 42/42; canonical board validation
passed at revision 3243; `git diff --check` passed. No source or test code
changed; changed-code coverage and the full repository gate do not apply.

Elapsed `20:44:31–20:53:15 UTC` (~8m44s): CLO import/export/re-import and
captures ~5m15s; geometry/entity parsing and visual-output review ~1m30s;
durable closeout, board preflight/replay and focused validation ~1m59s;
external-agent wait 0m; maintainer-decision time 0m. No independent safe
delegation existed for this stateful UI round trip.

**Next action:** reconcile the V03 evidence matrix against the unchanged
acceptance gates and the S526 rights/data-handling hold. Do not repeat this
synthetic fixture or use G04 product bytes under the current unresolved trial
terms. Identify a receiver/profile path whose exact build, permitted use,
local handling, and apparel semantics can be verified; keep CLO open while
G04 remains active. V03 remains In Progress until all original gates pass.
