# EPIC-17 / G04 V03 — CLO AAMA round-trip attempt — Slice 509 exit

## Result

**The planned AAMA exchange was not run.** This is a desktop-control access
failure, not a CLO AAMA import/export result. CLO's graphics information notice
did not display a DXF error, but repeated supported interactions did not reach
the pattern workspace. The helper then reported
`foreground window did not report a process id`; its one fresh-window recovery
found a changed window count and could not recapture the workspace. No DXF was
opened. All V03 gates remain open and unchanged; G04-V03 remains In Progress.

## Setup and observed failure

- Started from S508 `2ec3867859c169166a31e875c9ca5519a8b4a2ef`, with refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` as an ancestor.
  S509 was reserved as the next unique slice. Board start replay advanced
  `3147→3149` and preserved V01/V02 Done and V03/EPIC-17 In Progress.
- Copied the pinned source to
  `C:\G04-CLO-DXF-Exchange\S509-polo-aama-roundtrip\Input\polo-aama-m.dxf`.
  It is 24,261 bytes and SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- CLO was stopped after the S508 closeout. On relaunch, the returned app
  inventory exposed two same-titled windows: a graphics-information dialog
  (`id 161679680`) above a startup/login splash (`id 217189798`). The graphics
  notice described Intel-graphics performance; it was not a DXF error.
- The supported accessibility click and keyboard Return did not clear the
  notice. A coordinate click on the captured dialog did not produce a usable
  workspace. A later capture returned the exact helper error
  `foreground window did not report a process id`.
- The required fresh-window recovery re-enumerated CLO and found only one
  returned window (`id 217189798`); the window set no longer matched the
  inspected pair. No stale coordinate or index was used afterward.
- No source fixture was opened in CLO, no import/export/reimport occurred, and
  no native project or render was created. Only the hash-verified source copy
  and empty purpose-named C: folders exist. The app remains running at a
  startup window according to the last inventory. It was not force-closed;
  another normal close could not be performed after the helper failure.

## Gate disposition

- **AAMA mode:** unknown; no practical format operation occurred.
- **CLO compatibility or suitability:** no conclusion from this slice.
- **V03:** rights/local handling, exact industrial profile, source-scale
  geometry/layers/marks/units, native grades, negative-control behavior,
  profile-specific round-trip, and all-seven representative fixtures remain
  required. S503's AAMA-import/ASTM-export results, S507 ASTM record loss, and
  S508 Standard stacking finding remain unchanged.
- **Unchanged:** V02 and its all-seven requirement, V03 acceptance, the
  `0.001 cm` contour threshold, generic and legacy DXF behavior, protected
  export byte identities, and physical/factory evidence limits. No product
  source, test, fixture bytes, acceptance rule, or baseline changed.

## Durable evidence and verification

- S509 start packet, source copy, hash, startup-window inventory observations,
  helper error, and this exit record distinguish the access failure from any
  DXF result. No CLO settings or renders are claimed.
- No repository production code changed; changed-code coverage does not apply.
  The validated exit command links `E-G04-S509-EXIT` and records the access
  hold without changing V03 status or acceptance. Exit preflight passed at
  revision 3151; validated replay advanced `3149→3151`. Focused
  `npm run control-center:test` passes 42/42, and `git diff --check` passes.
- Elapsed from `2026-10-08 17:31:11 UTC` to closeout: about 6 minutes.
  Implementation: `0m`; focused desktop-control diagnosis: `~4m`; durable
  records/board: `~2m`; external-agent waits: `0m`; maintainer-decision time:
  `0m`.

**Next action:** continue independent V03 evidence/research that does not depend
on CLO's inaccessible UI. Resume the AAMA fixture trial only when the supported
window API returns a uniquely inspectable CLO workspace; do not treat this
startup failure as an AAMA or CLO exchange failure.
