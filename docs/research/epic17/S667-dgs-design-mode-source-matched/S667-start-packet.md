# EPIC-17 / G04 V03 — DGS source-matched Design-mode check — Slice 667 start

## Verified start and scope

- Started: 2026-10-10 09:37:05 UTC.
- Branch: `codex/epic-17-g04`; clean tree at S666 commit
  `f70d19921580eecd7d65e12f72ad067fdd7302c8`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  remains an ancestor of HEAD. Slice 666 is the highest assigned; S667 is
  reserved uniquely. Control Center board revision is 3911; EPIC-17 and
  G04-V03 remain In Progress and V01/V02 Done.
- Reuse the exact S664 source-matched Polo M file at
  `C:\G04-CLO-DXF-Exchange\S664-getonagain-grainline-profile-trial\Candidate\polo-m-idr-profile-r14-grainline.dxf`.
  It is 155,176 bytes, SHA-256
  `DFC15003F11AFEC33C4AADB3286D3354A808D834DCD1979B7CB2EE0BC94F07F2`.
  No input edits or copies.

## Single decisive check

In the already open DGS V2024.1 / VID:20250610 process, import this exact DXF
once through the same AutoCAD route and frozen unit/text/grainline settings
used in S664, changing only the documented import mode from Pattern to
Design. Record the displayed settings and every warning. Compare the actual
rendered/design output and any inspectable geometry/identity to the same nine
source pieces at the unchanged 0.001 cm gate. This tests whether the repeated
Pattern-mode grainline warning is specific to the mode and whether Design
retains measurable source drawing data. It is diagnostic only; it cannot
qualify all-seven recipes/options/grades or the V03 profile.

## Stop and advance criteria

- If DGS reports a warning/loss, omits or alters any source piece/entity,
  produces an unreadable render, or cannot expose measurements sufficient to
  check the source within 0.001 cm, stop this exact candidate and record the
  observable reason. Do not export or try another DGS setting, entity,
  encoding, build, or file.
- Only if this import is warning-free and all nine CUT/SEW/mark pieces,
  source identity and geometry are independently verifiable at 0.001 cm may
  one AutoCAD/No RUL export, parse, and reimport be attempted. Hold every other
  V03 gate unless direct evidence clears it.
- All inputs, settings evidence, screenshots, output and reports stay under
  `C:\G04-CLO-DXF-Exchange\S667-dgs-design-mode-source-matched\`.
  DGS and CLO stay open during this active goal.
- No product geometry, source stitch graph, legacy DXF writer, protected
  export identity, acceptance criterion, fixed threshold or standards claim
  changes. No physical fit, factory acceptance, or production-readiness claim.

## Delegation and gates

This is one serial, stateful GUI import with shared window ownership; no safe
disjoint implementation or review work exists for an external agent. Codex
retains control and reviews the actual UI, output evidence, packet and board.
Run focused fixture/preflight checks and Control Center tests, `git diff
--check`, and validated board replay. Changed-production-code coverage is
not applicable unless production code unexpectedly becomes in scope. Save
the full repository coverage/build/render gate for the settled Epic candidate.

## Next action

Create the C-only evidence manifest, inspect the actual import dialog, freeze
all S664 controls, change only Pattern→Design, import exactly once, capture
the receiver result, and close S667 durably before reserving S668.

## In-slice evidence amendment — permitted diagnostic export

The actual Design import completed without a warning dialog and rendered all
nine source piece outlines with their internal drawing strokes. The status
bar remained `0/0`, unlike Pattern mode's 9/9 registered patterns; identity,
piece ownership and numeric coordinates are therefore not exposed as pattern
records in the Design workspace. The File menu nevertheless enables
`Export DXF file`. To distinguish a display-only design import from an
export-capable data route without relying on assumptions, perform exactly one
local diagnostic export using the dialog's Auto CAD and No rul file choices,
with every other export option left at its observed default. Compare that
export to the pinned input using the existing independent parser. This is an
evidence-scoped extension of the S667 diagnostic, not a new format/setting
permutation: the settings resolve the distinct source-retention/identity gate
that the warning-free Design render cannot answer. Stop after this one output
if patterns, block identities, CUT/SEW/mark entities or the 0.001 cm coordinate
gate fail; otherwise use only one reimport of this same output.

The observed Auto CAD export dialog does not expose a RUL-file option. After
selecting Auto CAD it shows the following actual controls: All pattern of
style selected; Ignore NULL material checked; Ignore seam unchecked; OverLap
selected; Output design line checked; Output pattern checked; Output base size
only unchecked; outward notch unchecked. The dialog provides no separate No
RUL choice in this mode. Keep all displayed defaults, redirect the export path
to the S667 C:-only Output folder, then parse that one result. A passing parse
may justify one reimport of the same output; a concrete loss ends the
candidate. The result will be described as DGS's observed Auto CAD export
behavior, not a formal or normative profile.
