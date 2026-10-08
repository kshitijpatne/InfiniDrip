# EPIC-17 / G04 V03 — CLO AAMA workspace recovery — Slice 510 start

## Bounded objective

Follow the user's update that CLO is running by checking whether its current
workspace makes the previously authorized, C:-confined S509 AAMA fixture test
accessible. This slice records only the desktop-control recovery result. It
does not change or weaken any V03 gate and does not infer an AAMA result from a
workspace/menu observation.

## Verified starting boundary

- Recorded at `2026-10-08 17:39:55 UTC` from clean S509 commit
  `18c1318089c169166a31e875c9ca5519a8b4a2ef` on `codex/epic-17-g04`.
- Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned
  slice is 509; S510 is reserved. Board revision 3151 has V01/V02 Done and
  V03/EPIC-17 In Progress.
- Reuse only the hash-verified Polo M source already under
  `C:\G04-CLO-DXF-Exchange\S509-polo-aama-roundtrip\Input`. No new file was
  opened or written during this recovery observation.

## One attempt and stop condition

The fresh CLO inventory returned exactly one CLO window. Its accessibility
tree exposed the normal 2D Pattern Window and File menu. The File menu was
opened. The next single import-menu action failed with:

`point (145, 203) is over CLO_Standalone_OnlineAuth_x64.exe "CLO Standalone OnlineAuth", not target window CLO_Standalone_OnlineAuth_x64.exe "CLO Standalone OnlineAuth"; activate the target or take a fresh screenshot before retrying`

Following the supported recovery, the window list was re-enumerated and still
returned one CLO window. Activating that returned window then failed with the
concrete helper error `no monitor found for window`. Per the Computer Use
recovery rule, stop app input after this failed fresh-window recovery. Do not
reuse the menu index or attempt another UI backend.

## Scope, gates and non-goals

- No DXF file dialog opened; no fixture import, export, reimport, CLO project,
  settings capture or rendered exchange evidence was produced.
- This is a desktop-control/monitor-targeting failure, not an AAMA/CLO format
  failure and not evidence of CLO incompatibility.
- All V03 gates remain open: rights and local handling; exact industrial
  profile; source-scale geometry, units, pieces/layers/marks; grades;
  negative-control behavior; profile-specific generation-two round trip; and
  representative fixtures for all seven recipes.
- Preserve the S503 AAMA-import/ASTM-export findings and the S508 Standard
  second-generation stacking result as separate, mode-specific evidence.
- Keep V01/V02 Done and V03/EPIC-17 In Progress. Preserve the `0.001 cm`
  geometry gate, all-seven criterion, generic/legacy DXF behavior, every
  protected export byte identity, and physical/factory claim limits.
- No product source/tests, pattern geometry, acceptance criteria, export
  baselines, CLO account/privacy settings, or files outside the named C:
  evidence root may change. No cloud/CLO-SET/CONNECT, supplier contact,
  physical sampling, or production-readiness claim.

## Verification plan and timing

This is a documentation/evidence-only recovery record. Run validated board
preflight/replay, focused Control Center tests and `git diff --check`. Record
focused desktop diagnosis, durable records/board time, external waits and
maintainer-decision time separately at exit. The full repository gate is not
due for this documentation-only slice.

**Next gate:** continue independent V03 receiver/profile qualification. Retry
the authorized AAMA fixture only when a fresh, uniquely inspectable CLO window
can be safely targeted by the supported desktop helper.
