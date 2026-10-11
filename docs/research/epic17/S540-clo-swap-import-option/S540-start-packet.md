# EPIC-17 / G04 V03 — CLO CUT/SEW swap-option diagnostic — Slice 540 start

## Verified start

- Started `2026-10-08 21:50:53 UTC` from clean S539 `0e11b700185cb847fb734d79797c1ed5606cffef` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 539; reserve unique S540. Canonical board revision 3271; EPIC-17 and G04-V03 In Progress, V01/V02 Done. `get_goal` confirms the admitted objective remains active.
- Maintainer confirms written CLO trial-use and local-processing approval; S538 records it. CLO 2026.1.310 is already open and should stay open.
- Current screenshot shows the already-used nine-piece Polo workspace with no export dialog. Do not repeat Polo. S532's 402-byte synthetic AAMA positive control is the selected fixture because its CUT square and inset SEW contour are fully known and all prior files/measurements are under C:.

## Objective and scope

Run one controlled differential test of CLO's documented `Swap Cutting Line and Sewing Line` import option. Import the S531/S532 synthetic CUT/SEW fixture with the swap option enabled, export DXF-AAMA to `C:\G04-CLO-DXF-Exchange\S540-clo-swap-import-option`, then inspect the exported entity geometry and role/layer attributes against the hash-pinned input and the S532 no-swap export. Render and review the imported pattern and capture the exact option state and export dialog.

This changes one documented importer option only. It is not a new garment, production change, profile selection, or acceptance relaxation. If role identity is not recoverable, record the concrete result and retain V03 holds. If geometry is altered or entities are still mixed, do not infer semantic correctness. All import/export files and captures stay in the named C: folder. Keep the existing CLO session open; do not use cloud features, change account/settings, or overwrite any prior evidence.

## Acceptance and gates

- Verify the fixture hash against S531/S532 before import and record the exact CLO build and all visible import/export settings.
- Verify actual visible import and export dialogs before each action; save no path outside the named C: folder.
- Capture rendered output and parse the export for CUT/SEW geometry, duplicates, layers, counts, units/version, and any semantic distinction, comparing against both the source and S532's no-swap export.
- Preserve V03's all-seven recipe, industrial-profile, semantic, grading, negative-input, and round-trip gates; preserve all existing numeric thresholds and protected exports. This one synthetic diagnostic cannot clear V03.
- No production source/tests change. Run deterministic output analysis, relevant script syntax, validated board command replay, Control Center focused tests, and `git diff --check`; no full repository gate is due.

## Delegation and time ledger

The task is one stateful CLO option differential tied to output capture; no safe disjoint external coding-agent work exists. Record UI/testing, analysis/render review, records/board/focused regression, external-agent waits, and maintainer-decision time separately at exit.
