# EPIC-17 / G04 V03 — CLO DXF-ASTM practical trial — Slice 609 start

## Verified start

- Started 2026-10-09 11:16:15 UTC on `codex/epic-17-g04` from S608 commit
  `954a4a4056f7c3039b37de795423f7ca98865741`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S608 is the highest assigned slice; S609 is reserved. Working tree was
  clean. Canonical board revision is 3566; EPIC-17/G04-V03 remain In Progress
  and G04-V02 remains Done.
- User confirmed in writing that CLO trial use for product-development DXF
  evaluation is permitted and imported/exported DXF files remain local. No
  further permission confirmation is needed. CLO 2026.1.310 is already running;
  use the uniquely identified existing G04 session and leave CLO open.
- S608 identifies an actually different, officially documented CLO mode:
  DXF-ASTM is CLO's documented export route for grading. The S595 periodic
  DXF-AAMA experiment is not repeated here.

## Objective and bounded method

Use the exact hash-pinned original Polo M source fixture
`C:\G04-CLO-DXF-Exchange\S536-polo-aama-vertex-preservation\Input\polo-standard-m.dxf`
(SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`)
with CLO's documented DXF-ASTM export mode once. Work only with disposable
CLO scene state and write all newly created/imported/exported evidence under
`C:\G04-CLO-DXF-Exchange\S609-clo-dxf-astm-practical-trial\`. Capture the
exact import/export settings and any dialog or error. Compare the emitted DXF
to all 18 source CUT/SEW contours (nine pieces), source layers, piece/block
identity, notches/marks and rendering at the existing `0.001 cm` geometry
gate. Reimport the output once in CLO and inspect that it opens and renders;
retain the emitted file and reimport screenshot. Do not save over any source,
prior fixture, or project.

This one-profile trial can support or reject only this CLO build/settings and
this Polo M fixture. It does not establish a grading pass merely by using the
ASTM menu label, a normative edition, universal compatibility, or all-seven
acceptance. If the mode is missing, errors, loses any required geometry or
semantics, or is not measurable against exact source, preserve that result and
keep every V03 hold. Do not adapt source geometry or writer output to force a
pass.

## Gates, non-goals, and verification

- Keep all V03 acceptance, all-seven coverage, exact `0.001 cm` tolerance,
  V02-before-V03, legacy DXF behavior and protected output identities intact.
- No production source, generated pattern, stitch graph, baseline, acceptance
  criterion or product claim changes. No second receiver, new recipe, UI
  redesign, external upload, or files outside the named C: folder.
- Codex owns the coupled import/export/render review; no safe delegated slice.
  Record exact observed settings and file hashes, run a reproducible source-
  bound analyzer, inspect the reimported rendered result, validate the board
  commands, run Control Center tests and `git diff --check`.
- No physical fit, factory acceptance or production-readiness claim.

## Single next action

In the existing, uniquely identified CLO 2026.1.310 session, import the pinned
S536 Polo M source, export one disposable DXF-ASTM fixture to the S609 C:
folder, then reimport that exact output once for rendered inspection and
source-bound analysis. Stop if CLO presents an ambiguous/conflicting dialog
or the session identity changes.
