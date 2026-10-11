# EPIC-17 / G04 V03 — LibreCAD receiver preflight — Slice 521 exit

## Result

S521 closes the candidate screen and test-plan work. LibreCAD 2.2.1.5 is a
free, GPLv2 general-purpose 2D CAD candidate with documented generic DXF
read/write, including R12. It is **not an apparel-CAD receiver** and the
reviewed sources do not establish AAMA/ASTM conformance, garment-grade
semantics, or factory acceptance. A passing test could add one narrow generic
R12 round-trip result; by itself it could not satisfy G04 V03's industrial
apparel exchange-profile gate.

The app is not installed on this device. S521 did not download, install, or
launch it. All planned exchange files and captures are confined to
`C:\G04-CLO-DXF-Exchange\S521-librecad-r12-receiver\`. CLO remains open and
untouched; no repeated CLO operation occurred.

## What a single test would establish

The packet's fixed plan would test one current-revision DXF per each of the
seven recipes, one Tee XS/M/XL size-family set, and one malformed truncated
DXF. It would save each valid drawing once as R12 without edits, compare every
entity/layer and coordinate under the existing `0.001 cm` gate, inspect one
actual received drawing per recipe, and require visible rejection/reporting
of malformed input. It would answer whether this exact LibreCAD build can
preserve these generic files through one R12 round trip. It would not establish
apparel semantics, a named industrial profile, grades in an apparel receiver,
or V03 completion. The V03 all-seven, rights/local-handling, profile, identity,
semantic, negative-input, and generation-two gates remain unchanged.

## Decision and next action

No installation or download authorization was inferred. The one missing
decision is whether the maintainer authorizes downloading/running this free
official build for the C:-confined generic-format trial. Alternatively, the
maintainer may install it and confirm the exact version is available; no other
manual setup is required. If authorized, perform the packet's one planned
pilot once and report its narrow result. If not, do not install it or claim a
receiver result; the admitted industrial-profile gate remains open pending a
rights-cleared apparel-CAD receiver/build or other direct evidence that meets
the unchanged gate.

## Verification and closeout

- Refreshed `origin/main` at `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it
  is an ancestor of the active branch. S520 `b78ef47` was the parent; S521 is
  the next unique slice.
- Start board replay: `3195→3197`. Exit board replay:
  `3197→3199`. G04-V03 remains In Progress; V01/V02 remain Done.
- Preflight confirmed the LibreCAD candidate's scope and did not write files;
  exit replay uses the validated Control Center command layer.
- `npm run control-center:test`: 42/42 passed. `git diff --check` passed.
- No production code, test thresholds, export baseline, protected byte
  identity, acceptance criteria, or garment geometry changed.
- No changed production code required changed-code coverage. This
  documentation/board-only slice does not require the full repository gate;
  full gates remain for the settled integrated Epic/PR candidate.
- No independent delegation had safe, disjoint ownership for this receiver
  qualification decision.

Started `2026-10-08 18:59:38 UTC`; closed `2026-10-08 19:02:53 UTC`
(`3m15s`): candidate/test-plan review 0m50s; durable packet/state/board work
2m10s; focused verification 0m15s; external-agent waits 0m;
maintainer-decision time 0m (authorization remains a pending dependency, not
an elapsed wait). Primary usage remained available.

## Primary sources

- LibreCAD, [official repository and GPLv2 license](https://github.com/LibreCAD/LibreCAD).
- LibreCAD, [official DXF version support FAQ](https://dokuwiki.librecad.org/doku.php/usage:faq),
  listing R12/R14/2000/2004/2007 and warning that not all DXF features are
  supported.
- LibreCAD, [official 2.2.1.5 release page](https://github.com/LibreCAD/LibreCAD/releases/tag/v2.2.1.5).
- LibreCAD, [official user manual](https://docs.librecad.org/_/downloads/en/2.2.0_a/pdf/),
  including layers and block/insert handling.
- InfiniDrip, `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`,
  the admitted CAD and round-trip acceptance boundary.
