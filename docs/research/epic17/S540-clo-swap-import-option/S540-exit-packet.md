# EPIC-17 / G04 V03 — CLO CUT/SEW swap-option diagnostic — Slice 540 exit

## Result

S540 tested CLO 2026.1.310 (r58944)'s documented `Swap Cutting Line and Sewing Line` import option against the same 402-byte synthetic DXF-AAMA positive control used in S532. The control has one 10 cm square `CUT` polyline and one 8 cm inset `SEW` polyline. S540 enabled the swap option, then exported one DXF-AAMA file. This was a targeted, materially different option trial; no garment fixture or already-completed round trip was repeated.

The option did not change the observed source-geometry-to-output-layer mapping. The no-swap S532 baseline and S540 swap output each contain four `POLYLINE` entities distributed as layer 1: one, layer 8: two, and layer 14: one. In both files the source CUT square matches three outputs on layers 1, 14 and 8; the source SEW contour matches one layer-8 output. Thus layer 8 still contains both roles, and the CUT duplicates remain. The documented toggle did not produce a role discriminator in the exported entities and cannot resolve V03 semantic acceptance.

The 2D CLO view rendered the square boundary and inset dotted line after import. No export error appeared. This is evidence for this synthetic input and CLO build/settings only; it is not an industrial profile or apparel acceptance claim. Existing all-seven gates and failures remain unchanged.

## Exact trial and evidence

- The current unsaved nine-piece Polo workspace was first saved as a preserved project copy at `C:\G04-CLO-DXF-Exchange\S540-clo-swap-import-option\Evidence\polo-current-workspace-saved-before-s540.zprj` (SHA-256 `6405F079EADBD999BFDBF22CB7E9993AB9E03087FC13A49847364F015D5E0466`). This copy prevented discarding the active CLO state.
- Input copy: `Input\synthetic-profile-positive.dxf`, 402 bytes, SHA-256 `78BDF785BBBF882E2E91F5F08C7446CA944B8501C6F54B30A2AF07CC34C49147`, identical to S531/S532's positive control.
- Import: DXF-AAMA; Load Type Open; centimeters; 100%; Do Not Rotate; Maintain Original; `Swap Cutting Line and Sewing Line` on; dependent Include Notches on; Import Notch to Pattern Outline; Ratio; Auto Distribute off; Optimize All Curve Points off; Import Draw Curve Points on; Remove Non-Grading Points off.
- Export: DXF-AAMA; Graded Nest; centimeters; 100%; Do Not Rotate; Export Without Grading/Base Lines/Seam Allowance off; Duplicate Notch on Seam Allowance on; Convert Curve Points off; Optimize All Curve Points off; Export Pattern Bounding Box off.
- Output: `Output\synthetic-profile-swap-enabled.dxf`, 3,721 bytes, SHA-256 `62BA3A3F4ABE5131170313A876720F2FD42BBF8D7FA6A2DF6649A7E790A9E447`.
- Baseline: S532 no-swap first export is 3,711 bytes, SHA-256 `F0D6DB9C260986BB73D82D2535956F2097BFD855A6832D6BE26B6B9B797EECCD`.
- Deterministic analyzer `analyze-swap-export.mjs` verifies all three hashes, parses both exports and source, checks each source polyline against the two outputs at the unchanged 0.001 cm screening tolerance, and asserts that swap/no-swap layer counts and source-to-layer mappings match. Report SHA-256 `CA51123B2BEA93BA5D0FE197940A559AD7F7389DC7E52C9C403BFC9A195B7734`; report and two rendered captures are in the named S540 folder under C:.

## Gate disposition

- **Passed for this trial:** fixture identity; observed DXF-AAMA import/export settings; visible two-contour rendering; output parsing and geometry association within 0.001 cm; no export error.
- **Concrete negative finding:** the documented swap option leaves the CUT/SEW geometry-layer mapping and mixed layer 8 unchanged in this controlled case. Do not spend another trial on this same option/fixture.
- **Still open:** normative industrial profile/version and its semantic contract; all-seven exact-profile and representative round-trip acceptance; Polo's five CUT vertex-loss failures; CUT/SEW/mark semantics across the garment outputs; grading and negative-input gates; receiver/profile qualification. Existing S531 malformed-input acceptance remains a concrete failure. No threshold, fixture, acceptance criterion, V02 result, production code, legacy DXF behavior, or protected export identity changed.
- CLO remains open because G04 still needs it. No CLO-SET/CONNECT/cloud action, vendor contact, install, purchase, source pattern edit, physical fit, factory acceptance, or production-readiness claim.

## Verification, board, and time ledger

- Started `2026-10-08 21:50:53 UTC` from clean S539 `0e11b700185cb847fb734d79797c1ed5606cffef` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Highest prior slice 539; S540 unique. Starting board revision 3271; validated start replay `3271→3273`.
- `node --check docs/research/epic17/S540-clo-swap-import-option/analyze-swap-export.mjs` passed. Two analyzer runs produced the same report SHA-256. Input/output file hashes and counts match the packet. The rendered import and post-export evidence were inspected.
- Focused Control Center suite, validated exit replay, board schema, and `git diff --check` are recorded after closeout. No production code/tests changed, so changed-code coverage and the global full gate are not due.
- A later attempt to rerun the one-shot exit preflight against the already-replayed board stopped on the command layer's duplicate-evidence guard (`E-G04-S540-EXIT already exists`). This is expected for an applied add-evidence command; it did not mutate the board or change the earlier successful replay. Do not replay the same command again.
- Elapsed about 8m39s (`21:50:53–21:59:32 UTC`, including final closeout verification): fixture/copy preparation and CLO UI import/export/render `4m30s`; geometry/output inspection and deterministic analyzer `1m10s`; durable packet/context/board and focused regression `2m59s`; external-agent waits `0m`; maintainer-decision time `0m`.

**Next:** reserve S541 and inspect the exact DXF header/version/profile evidence across already hash-pinned outputs against the primary industrial profile documentation. Do not retry the swap option or alter V03 acceptance.
