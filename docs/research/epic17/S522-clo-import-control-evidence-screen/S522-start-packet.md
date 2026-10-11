# EPIC-17 / G04 V03 — CLO import-control evidence screen — Slice 522 start

## Objective and boundary

Check the current official CLO DXF guide against the already measured S503,
S516–S519 controls. Determine whether any documented, untested import setting
is a plausible and safe fix for the five localized Polo CUT-point losses. Do
not touch the open CLO session, exchange files, or acceptance gates.

Started `2026-10-08 19:06:47 UTC` from clean S521 commit `30196f4` on
`codex/epic-17-g04`. Refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest
assigned slice was 521; S522 is unique. Canonical board revision is 3199;
G04-V03 is In Progress and V01/V02 are Done. Ordinary usage is available.

## Required prior results

- S517 isolates one omitted source CUT vertex per failed contour. All other
  source points on those five paths remain within `0.000024 cm`; each removed
  point is `0.0127407–0.0139742 cm` from the receiver shortcut.
- S519 enabled CLO's `Import Draw Curve Points` on the same hash-pinned Polo M
  AAMA fixture. It rendered without a format error but retained the same five
  contour failures; no repeat of that control is authorized by this packet.
- S503 already compared CLO curve optimization off/on; S507 tested a scale
  correction; S508 tested Standard DXF. Do not repeat those settings.
- S519's source inventory is 18 old-style `POLYLINE` and 610 `VERTEX`
  records, without `SPLINE`/`LWPOLYLINE` or native grade data.

## Review question

The current official CLO guide lists `Optimize All Curve Points` and
`Remove Non-Grading Points`; it defines the latter as deleting straight/curve
points without grading information. Determine whether the latter could
preserve the missing geometry or is counter-indicated for these non-graded
generic fixtures. Check that no other documented, untested control specifically
promises source-vertex retention. Any terminology from the guide is vendor
documentation, not a guarantee of CLO's actual geometry behavior.

## Non-goals and gates

- No UI operation, import/export, account interaction, download, or external
  message. Keep CLO as the user left it.
- Do not infer any legal rights or local-only data handling from this help
  page; rights review remains separate.
- Preserve the strict `0.001 cm` gate, all-seven scope, industrial-profile,
  piece/layer/grade/negative-input and round-trip gates, legacy DXF behavior,
  and all protected export byte identities.
- No pattern geometry or product code changes; no compatibility, physical-fit,
  factory, or production-readiness claim.

## Exit evidence

Record the exact official controls already tested, any remaining distinct
controls and their documented effect, and whether another CLO trial is
evidence-backed. Link the official source and S519 measurements. Update the
canonical board only through its validated command layer. If no new supported
mechanism exists, direct the next step to a newly evidenced rights-reviewed
receiver/profile rather than another same-fixture UI setting.

## Source

- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
  updated 2026-09-28. Current page accessed 2026-10-08; documents import
  settings and their stated effects, but does not guarantee exact vertex
  preservation.
- Prior measured result: `docs/research/epic17/S519-clo-point-retention-control/S519-exit-packet.md`.
