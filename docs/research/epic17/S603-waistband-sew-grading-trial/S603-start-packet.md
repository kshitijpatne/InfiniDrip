# EPIC-17 / G04 V03 — source-derived waistband sewn-line grading trial — Slice 603 start

## Verified start

- Started `2026-10-09 10:05:22 UTC` on `codex/epic-17-g04` from clean S602
  commit `b351fc82eeeca90e7158dd26f44013c272e9e0b7`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S602 is the highest assigned slice; S603 is unique. Start board revision
  3542; EPIC-17/G04-V03 In Progress, G04-V02 Done.
- Ordinary usage is allowed (primary 4%, weekly 78%). CLO 2026.1.310
  (r58944) remains open in its existing process. S602's fresh screenshot and
  accessibility tree both showed its main 2D workspace and no modal/spinner.
- The saved S565 seed project exists on C: and matches its recorded SHA-256
  `CD2D620B42148A21E800F6D7DD6183757955B2BEC19FD745BB86FDCD3D3B8423`.
  Keep every file used for the CLO project, DXF exchange, and rendered evidence
  inside `C:\G04-CLO-DXF-Exchange\S603-waistband-sew-grading-trial\`.
- The current S601 reimport scene and saved project are preserved. S603 opens
  only a byte-verified working copy of the S565 disposable project; it will
  not close or restart CLO or overwrite source inputs.

## Objective

Test S567's source-derived five-size grade deltas on the four-segment
waistband sewn-outline path in the saved S565 disposable CLO project. S565's
corrected CUT grade assignment matches all five source size CUT contours, but
larger-size SEW contours fail. S567 identifies the exact sewn-outline source
coordinates and deltas. This is a practical grading subgate test, not a Polo
corner remedy and not an all-seven profile acceptance test.

## Source evidence and precise trial

`S567-clo-dxf-grade-guidance/S567-exit-packet.md` maps the four waistband
SEW vertices, ordered from upper-left, to current source fixtures:

| Size | Source SEW vertices (cm) | Per-point delta from prior size (cm) |
|---|---|---|
| XS | `(59,70.5) (102,70.5) (102,67) (59,67)` | — |
| S | `(61,72) (106,72) (106,68.5) (61,68.5)` | `(+2,+1.5) (+4,+1.5) (+4,+1.5) (+2,+1.5)` |
| M | `(63,73.5) (110,73.5) (110,70) (63,70)` | `(+2,+1.5) (+4,+1.5) (+4,+1.5) (+2,+1.5)` |
| L | `(65,75) (114,75) (114,71.5) (65,71.5)` | `(+2,+1.5) (+4,+1.5) (+4,+1.5) (+2,+1.5)` |
| XL | `(67,76.5) (118,76.5) (118,73) (67,73)` | `(+2,+1.5) (+4,+1.5) (+4,+1.5) (+2,+1.5)` |

The point order follows the actual size coordinates; values above are exact
source-derived grade increments. CLO's Edit Grading should be used only after
the selected path is positively identified as the internal SEW contour
matching XS. If it is not distinguishable from the CUT outline or an
unrelated/internal path, stop without input.

For the one bounded run, export the isolated waistband as **DXF-ASTM / Graded
Nest**, centimeters, 100%, Do Not Rotate, with base sizes and grading included,
using the recorded S565 controls. Analyze the single output against the pinned
XS/S/M/L/XL waistband CUT and SEW sources with the existing S564 analyzer and
the fixed `0.001 cm` limit. Reimport only if the output has identifiable five
size groups and the analysis is interpretable; capture actual rendered output.

## Acceptance and stop conditions

- A trial-level pass requires all 10 source contours (CUT and SEW for five
  sizes) to match their corresponding exported size/role at or below `0.001
  cm`, source-size identity to survive, and reimport/render to show the expected
  five-size exchange without a format/application error.
- Any missing size/role, mislabeled size, ambiguous contour identity, any
  contour above `0.001 cm`, or inconclusive reimport/render is a failure/hold.
  Preserve the exact output and error. No threshold or semantic inference from
  numeric layers.
- This can advance only a narrowly supported waistband grade-round-trip
  observation. It cannot satisfy all-seven grading/options, general profile
  conformance, mark/identity/semantics, negative-input, Polo-geometry,
  repeated-round-trip or full V03 gates.

## Non-goals and safety

- No source pattern, stitch graph, product code, generic DXF writer, protected
  export identity, acceptance rule, or legacy behavior changes.
- No unrelated CLO UI exploration, second application, web account, cloud,
  vendor contact, install, purchase, or transmitted data.
- No physical fit, factory acceptance, or production-readiness claim.
- Single live stateful CLO project interaction is not safely delegable; Codex
  owns the test and reviews its actual output.

## Time and verification

Record UI open/copy/grading/export/reimport time, measurement analysis,
rendered review, durable closeout/focused verification, external-agent waits,
and maintainer-decision time separately. Reuse the prior deterministic S564
analyzer where its inputs map; add only a narrowly scoped check if required to
assert source-size identity for this output. No production source changes are
planned. If none occur, no full repository gate or code coverage run is due.
