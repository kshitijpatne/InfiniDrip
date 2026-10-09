# EPIC-17 / G04 V03 — S617 import-stage CUT contour inspection — Slice 619 start

## Verified start

- Started 2026-10-09 13:06:49 UTC from committed S618 `afd6e3e6931091d55012da035bc816a03d0940e0` on `codex/epic-17-g04`. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice is 618; reserve S619. Worktree is clean before this packet. Canonical board revision 3610 records EPIC-17/G04-V03 In Progress and G04-V02 Done.
- S617's high-resolution comparison shows five CUT outlines lose one vertex at source edges 0.0456–0.0470 cm; surviving vertices are within 0.000025 cm. Its CLO scene saved immediately after source import and before export is `C:\G04-CLO-DXF-Exchange\S617-standard-dxf-units-header\Evidence\source-import-standard-dxf-cm-units.zprj`; output and input byte hashes and export results are in the S617 exit packet. The import scene and export scene are already durable C:-only evidence.

## Bounded question and scope

Read-only inspect the saved import-stage CLO project data, if its documented/native structure makes the actual CUT contour coordinates recoverable. Compare the exact five source short-edge/corner neighborhoods from S613 with their geometry in the pre-export scene. Determine separately for all five whether the source vertex/edge is (a) present within tolerance, (b) absent/merged before export, or (c) not recoverable from the saved representation. This distinguishes an import-stage loss from downstream export loss without running another exchange.

Keep all extraction, parsed records, comparison output, and screenshots under `C:\G04-CLO-DXF-Exchange\S619-s617-import-stage-geometry\`. Do not save derived CAD files elsewhere, change the source, S617 evidence, or the open CLO scene, or claim a processing stage from a preview alone. If project internals do not expose reliable contour coordinates, record that limit and stop this method rather than guessing or relaunching CLO.

## Gates and non-goals

- Acceptance: exact project/source hashes verified; parser or view method identified and reproducible; each of the five short-edge neighborhoods reported with source identity and measured result or explicit non-recoverable status; output evidence reviewed and hash-pinned; all V03 criteria and holds unchanged.
- Research/inspection only. No product code, tests, DXF writer, pattern geometry, source stitch graph, export baseline, unit/precision threshold, layer semantics, all-seven requirement, V02/V03 status, receiver/profile claim, or acceptance criterion changes.
- No new CLO round trip in this slice, no broad UI work, and no physical fit/factory claim. CLO stays open while G04 is active.
- Focused verification: `node --check` and a source/project hash-pinned comparison preflight. Run focused Control Center tests and validated board closeout; reserve full repository tests/100% coverage for the integrated Epic/PR candidate.
- No safe independent delegation: determining whether a proprietary native project retains imported contour points needs one controlled parser/evidence owner; splitting it adds no safe parallel work.

## Board start

Validated board start replay will be 3610→3612. G04-V02 and every V03 status/gate remain unchanged.

## Single next action

Inventory and hash the exact S617 pre-export `.zprj` on C:, inspect only its documented or verifiably structured geometry payload, and compare the five source neighborhoods to the source-pinned coordinates.
