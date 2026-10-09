# EPIC-17 / G04 V03 — Woven zero-depth vent source repair — Slice 627 start

## Verified start

- Started `2026-10-09 15:40:30 UTC` from committed S626 `d46927ca4647cf1f3915ceddd4938480aef3dc76` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Checkout was clean; S626 is the highest assigned slice, so S627 is reserved.
- Canonical Control Center board revision 3647 has EPIC-17/G04-V03 In Progress and G04-V02 Done. Validated start replay will append evidence/comment only. No status or criterion change is proposed.
- S626 found the only non-finite row in the canonical 73-option matrix: Woven `sideVentDepth=0`. Its source writer gets NaNs because `curvedHemAndVent` emits a zero-length `vent` edge with a 1 cm seam allowance. The evidence and cause are recorded in `docs/research/epic17/S626-opencad-all-options-r14-roundtrip/S626-exit-packet.md`; the user's written CLO use/local-processing authorization is settled.

## Bounded objective

Repair Woven's supported closed-vent (`sideVentDepth=0`) representation so the front and lower-back sewing and cutting geometry remain finite and continuous at the side-to-hem join, while the vent edge and its `VENT TOP` mark are absent when there is no vent. Preserve the existing nonzero vent geometry and source stitch graph. Verify the exact case through current-source DXF generation and rerun all 73 canonical supported-option rows against the same local Open CAD Studio v2026.40.1 R14 receiver at the unchanged `0.001 cm` gate, including named construction marks and byte-identical second generations. Perform one bounded CLO DXF-AAMA import/export/reimport on the repaired Woven zero-vent fixture only if the native UI remains available without restarting CLO; inspect native contours before export and export only if the full bounded pre-export contour gate passes.

This fixes a product-source defect affecting an admitted supported option. It does not certify the R14 general-CAD receiver as an apparel exchange profile or make a broad CLO profile/compatibility claim.

## Scope and acceptance

- Production ownership is limited to `curvedHemAndVent` in `src/drafting/shirt.ts`, with focused regressions owned in `src/drafting/shirt.test.ts` and/or `src/export/woven-shirt-final.test.ts` as needed. No other recipe, option range, draft, source stitch graph, technical-flat mapping, shared DXF writer or exporter behavior is in scope.
- At zero vent depth, the front and back-lower pieces have no zero-length `vent` edge and no `ventTop` mark. Their `sideLower` and curved hem meet at the original side-hem landmark. All pattern, allowance/CUT, DXF and marks coordinates are finite. The source stitch graph and piece count remain unchanged.
- At the supported 0.5 cm control and existing default/nonzero depths, vent endpoints/edge naming, `VENT TOP` mark and geometry are byte/coordinate-equivalent to the starting implementation. Do not convert or clamp a nonzero user value.
- Focused tests cover both branches and all changed production statements/branches/functions/lines. Existing export byte identities and the legacy DXF writer remain unchanged; no baseline update is authorized.
- Regenerate the exact S330 matrix from current source; hash-pin its S330 canonical matrix. Require finite coordinates before invoking a receiver. Run two R14 generations for every valid one of 73 rows; compare CUT, SEW and named `MARK_*` source geometry one-to-one at `0.001 cm`, exact layer/type/count inventory, AC1014, and repeated-generation bytes. S626's malformed NaN input is a negative-input control, not a source fixture pass, and is not changed or silently substituted.
- If the already-running CLO desktop surface is available, perform one C:-confined Woven zero-vent DXF-AAMA test with the observed S478 settings and exact profile. Import, query/render, and compare native CUT/SEW geometry before export. Export/reimport only if every tested source contour meets `0.001 cm` and rendered review has no gross damage. Otherwise preserve evidence and make no export; no repeated Standard-DXF Polo trials.
- Keep all CLO/receiver files in `C:\G04-CLO-DXF-Exchange\S627-woven-zero-vent-source-repair\`. CLO stays open. Do not close/relaunch it.

## Non-goals and gates

No broad seam-allowance redesign, DXF format/version/units metadata change, CLO automation/profile setting change, altered supported option or user-visible range, new acceptance exception, all-seven reduction, industrial profile or exact-compatibility claim, physical sampling, factory acceptance or production-readiness claim. Preserve V02 Done, every V03 acceptance gate, all prior holds, legacy DXF behavior, protected export identities and the `0.001 cm` threshold. Full repository 100% coverage/build/render/output checks remain for the settled integrated Epic/PR candidate.

No safe delegated work is independent: the draft edit, finite-geometry regression, option-matrix export, receiver review and closeout all depend on the same zero-vent geometry.

## Verification and next action

Run focused Woven draft/export tests and 100% changed-code coverage first. Diagnose failures without changing coverage configuration. Then regenerate/convert/analyze the exact 73 rows using a fresh named C: folder, inspect actual rendered receiver output for the affected Woven case if the established receiver UI workflow is available, run preflights and Control Center tests, and record hashes/times/holds. No full repository gate is scheduled by this slice.

**Single next action:** replay the validated S627 start evidence and comment, verify board state, then make the smallest zero-depth-only topology fix and focused tests.
