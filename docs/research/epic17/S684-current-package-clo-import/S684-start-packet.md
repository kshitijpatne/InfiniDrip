# EPIC-17 / G04 V03 — current package CLO import — S684 start

## Verified start

- Started 2026-10-10 18:36:33 UTC from clean commit `47da60e14c1293b847117cececde1ef6b7a6cc38` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- S683 is the highest closed slice; S684 is the next unique slice.
- Canonical Control Center board revision 4049 keeps EPIC-17/G04-V03 In Progress and V01/V02 Done.
- The active CLO window is confirmed at version 2026.1.310. Its native Open File dialog is currently visible; no file has been selected or imported.
- The full EPIC-17 goal record remains active and includes the admitted V01→V02→V03 scope through safe merge.

## Exact bounded action

Continue the S683 one-file check, without opening/restarting CLO or changing app, format, mode, options, or acceptance. Import only:

`C:\G04-CAD-Interchange\S683-current-package-clo-roundtrip\polo-default-M.dxf`

The pinned source DXF SHA-256 is `a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c`; its paired v2 manifest SHA-256 is `aa0a186287e8960559677252524e2e0c1643968524aa297af627d6ee8fd57f2c`. The manifest declares Polo M, eight resolved options, nine pieces, 38 named marks and centimeters. It remains evidence metadata; only the DXF enters CLO.

## Decision gates

1. Record the exact import settings and every warning. Inspect all nine pieces, CUT/SEW contours, visible marks, centimeter scale and useful-scale readability against the pinned source. Keep the `0.001 cm` geometric limit and existing semantic requirements.
2. Stop on the first measured miss. Do not export a failed import. A failure is evidence about the observed output only; attribute it to our file only if a source-to-output comparison isolates that cause.
3. Only after every applicable import check passes, export once through the same already-authorized CLO Standard DXF route, compare the actual saved file, reopen it once and inspect the second-generation result.
4. This single Polo M check cannot pass the seven-recipe / all-supported-option / grade, malformed-input, repeatability, full profile, rights, or complete readable-output gates by itself. Keep all V03 acceptance and all holds unchanged.

## Scope and non-goals

No product code, pattern geometry, export baseline, board acceptance, or threshold change is authorized in S684. Do not try another software candidate, DXF version, mode, entity encoding, or setting. Preserve all legacy DXF behavior and protected byte identities. Make no standards-conformance, fit, factory-acceptance, or production-readiness claim. Keep all files and captures for this action under `C:\G04-CAD-Interchange\S683-current-package-clo-roundtrip\`.

## Exit evidence

Record whether the file actually entered CLO; settings and warnings; measured source/output deltas; screenshots/rendered view if the native import completes; focused record/board checks; unresolved gates; and one next action. CLO stays open while the Epic remains in progress. Full repository coverage, integrated output review, PR, safe merge, ancestry and required deployment remain final gates.
