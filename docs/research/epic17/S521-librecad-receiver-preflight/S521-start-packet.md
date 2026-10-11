# EPIC-17 / G04 V03 — LibreCAD receiver preflight — Slice 521 start

## Objective and boundary

Determine whether the current official LibreCAD stable build is a promising,
rights-clear independent receiver for one tightly controlled generic DXF
round-trip. Do not call it an apparel CAD or industrial-profile receiver
without evidence. Prepare one reusable all-seven test plan so any approved
software operation happens once, with fixed settings and objective output
comparisons.

Started `2026-10-08 18:59:38 UTC` from S520 commit `b78ef47` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned
slice was 520; S521 is reserved. Board revision is 3195; V01/V02 Done and
V03/G04 In Progress. Primary usage at start was 4%; ordinary usage was
available.

## Candidate facts and limits

- Current official LibreCAD source identifies version 2.2.1.5 as the stable
  release, published under GPLv2. Its official source/docs describe generic
  DXF/DWG read/write, DXF versions R12/R14/2000/2004/2007, and working with
  layers, blocks, and inserts. The installed-program and Start-menu checks
  found no LibreCAD on this device.
- LibreCAD is a general 2D CAD editor, not apparel CAD. No source reviewed here
  says it implements AAMA-292/ASTM D6673, garment-pattern semantics, or factory
  acceptance. Therefore it is a **candidate generic DXF receiver only**.
- C04 documents the current InfiniDrip writer as an entities-only generic DXF
  with R12-era polylines, `CUT`/`SEW`/`MARK_*` layers, centimeter coordinate
  convention, flipped CAD-up Y, and no declared `$ACADVER`, units, piece IDs,
  or native grade relationship. A generic R12 round trip cannot silently be
  described as an AAMA/ASTM profile.
- CLO remains open and idle. S519's same-fixture point-retention failure is
  closed to repeats. This candidate screen causes no CLO UI or file operation.

## Single controlled pilot if authorized

1. Obtain the maintainer's approval to download/run LibreCAD 2.2.1.5 from the
   official release page. Keep every imported/exported DXF, rendered capture,
   and diagnostic in
   `C:\G04-CLO-DXF-Exchange\S521-librecad-r12-receiver\`.
2. Generate/import one current-revision baseline DXF for each of the seven
   supported recipes, fixed to one declared source size and settings; add the
   documented Tee XS/M/XL size-family fixtures and the malformed truncated
   group-code negative fixture. Record LibreCAD's actual opened version and
   import/save format settings once.
3. Save each positive drawing once as DXF R12, without geometry edits. Preserve
   source files as read-only and hash both source and output. Capture one
   settings view and one actual received drawing per recipe; inspect separate
   piece selectability, visible layers, scale, orientation, and warnings.
4. Compare entity type/layer, counts, closedness, piece bounds and every
   coordinate against the source; require maximum coordinate error `<=
   0.001 cm`. Check for lost/merged CUT, SEW, folds, notches, and internal
   marks. The malformed fixture must be rejected or visibly reported, never
   silently repaired and passed.
5. If any mandatory gate fails, stop the candidate test after preserving that
   concrete failure. If it passes, report only the observed exact LibreCAD
   build and generic R12 fixture behavior; the separate apparel industrial
   profile/semantic claims remain unproven until supported by evidence.

## Non-goals and authorization boundary

- No installation/download has been authorized by this slice yet. No software
  will be downloaded or run until the maintainer approves this exact free
  candidate and one-pass test.
- No CLO interaction, support message, cloud transfer, paid product, system
  service, pattern/source edit, standard/tolerance/gate change, export
  baseline change, compatibility claim, physical-fit claim, or factory claim.
- No safe independent contributor ownership split exists for the receiver
  selection and shared acceptance boundary; Codex retains ownership.

## Exit criteria

Record current candidate facts, why a controlled test would be useful, the
exact one-pass plan and its limit, and the missing authorization. Update the
canonical board only through its validated command layer. Keep all G04/V03
criteria unchanged. This preflight alone is not a round-trip result or V03
completion.

Start evidence: `S521-start-board-commands.json`.

## Primary sources

- LibreCAD, [official repository and license](https://github.com/LibreCAD/LibreCAD).
- LibreCAD, [official DXF version support FAQ](https://dokuwiki.librecad.org/doku.php/usage:faq),
  which lists R12, R14, 2000, 2004, and 2007 and warns that not all DXF features
  are supported.
- LibreCAD, [official 2.2.1.5 release page](https://github.com/LibreCAD/LibreCAD/releases/tag/v2.2.1.5).
- LibreCAD, [official user manual](https://docs.librecad.org/_/downloads/en/2.2.0_a/pdf/),
  including its description of block/insert handling.
- InfiniDrip, `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`,
  “CAD decision and round-trip acceptance boundary”.
