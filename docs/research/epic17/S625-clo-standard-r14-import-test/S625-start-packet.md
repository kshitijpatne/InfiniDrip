# EPIC-17 / G04 V03 — CLO Standard-DXF R14 import hypothesis — Slice 625 start

## Verified start

- Started 2026-10-09 14:57:20 UTC from clean S624 commit `368aa9611fad15af99cacebdfe970d7521bdcd1c` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S624 is the highest assigned number; S625 is uniquely reserved. Board revision 3637 keeps EPIC-17/G04-V03 In Progress and G04-V02 Done. The goal remains active and matches the current admitted objective.
- The maintainer has confirmed in writing that CLO may be used to evaluate product-development DXF interoperability and that imported/exported files are processed locally. This confirmation is sufficient; no further rights/locality question is pending.
- S624 created and source-pinned an Open CAD Studio v2026.40.1 R14 Polo M file at `C:\G04-CLO-DXF-Exchange\S624-opencadstudio-desktop-r14-receiver\Output\polo-m-r14.dxf` (SHA-256 `AA6E409E84345DB89E094CC3AE8F131BEC0EC0B21373B57B3DC0DCDF7D3A7C1C`). Its source generic Polo M DXF came from product revision `c4b1eac8` (SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`). S624 verified the R14 conversion preserved all CUT/SEW contours exactly. It also records that the source has no `$INSUNITS`; the CLO import unit will be explicitly set to centimeters.
- The intended CLO 2026.1.310 application is already running. Do not launch, restart, close, or change its build. Confirm the unique visible 2D pattern workspace before the first import action.

## Bounded question

Does changing this exact current-source Polo M fixture from its original R12/AC1009 DXF representation to a geometry-identical R14/AC1014 container make CLO's Standard-DXF native CUT/SEW geometry pass the existing pre-export gate? If every contour passes, perform one bounded same-profile export and reimport of this one fixture. This test distinguishes a DXF version/container sensitivity from the measured geometry failure; it does not establish profile conformance or close all V03 gates.

## Method and fail-closed gates

1. Copy the hash-pinned S624 Polo R14 file to `C:\G04-CLO-DXF-Exchange\S625-clo-standard-r14-import-test\Input\polo-m-r14.dxf`; verify SHA-256 before opening. Keep the source fixture, CLO project, any exported DXF, scripts, JSON and rendered evidence under this S625 folder on C:.
2. Use the already-running CLO 2026.1.310 UI and import as **Standard DXF** with centimeters, 100%, Do Not Rotate, Maintain Original grain; swap CUT/SEW off; auto-distribute off; Optimize All Curve Points off; Import Draw Curve Points on; Remove Non-Grading Points off; annotations off; auto-trace off. Record the observed dialog values and any informational notice without changing preferences.
3. Save any disposable CLO project under the named C: folder. Capture CLO's rendered 2D output there. Query all nine patterns using `GetPatternCount`, `GetPatternPieceName`, and `GetPatternInputInformation`; preserve the raw API result. Geometrically associate source CUT/SEW contours to native shapes without using pattern order, display labels, or numeric DXF layers as semantic proof. Do not translate, rotate, scale-fit, snap, or repair coordinates.
4. Pre-export gate: exactly nine unambiguous pieces; every one of the nine source CUT and nine source SEW contours within `0.001 cm` of its matched native contour; declared centimeter import is consistent with numeric coordinates; rendered output contains the expected pieces with no clipping or gross damage. If any condition fails, do not export. Record the exact misses and stop the R14 version hypothesis.
5. Only if the entire pre-export gate passes, export once through CLO's **Standard DXF** selected-pattern route to `Output\polo-m-standard-export.dxf`, record every export setting and emitted `$ACADVER`/`$INSUNITS`, reimport that exact output with the same settings into a clean tab/project, query all contours again, and capture output rendering. The round-trip passes only if all 18 contours remain within `0.001 cm`, identities/counts are unambiguous, and the output is readable. No further profile changes in this slice.

## Scope, holds, and non-goals

- One version-controlled receiver hypothesis on one Polo M fixture. No source-pattern, recipe, stitch, cut geometry, generic/legacy DXF writer, baseline, acceptance, tolerance, board status or V02 change.
- A pass is fixture/build/profile-specific only. The full V03 industrial profile, units contract, apparel mark and identity semantics, grading/options matrix, all-seven receiver round trips, malformed-input policy and full output readability gates remain in force.
- No G09/D04 views, G05 tech-pack work, UI redesign, new recipe, physical sample, supplier contact, launch spend, hosted service or production-readiness claim.
- No safe delegation: one stateful CLO session, same-fixture import, native API geometry query and rendered evidence form a dependent chain under Codex control.

## Verification and next gate

Run start/exit preflights, syntax-check slice helpers, `npm run control-center:test`, validated board replay, and `git diff --check`. There is no production-code change; changed-code coverage is not applicable. Preserve the single global coverage/build/output gate for the settled integrated Epic/PR candidate.

## Single next action

After validated start replay, re-observe the already-running CLO window. If exactly one usable 2D pattern workspace is visible, stage the C:-only input and perform this single Standard-DXF R14 pre-export test. Do not continue to export unless every specified pre-export gate passes.
