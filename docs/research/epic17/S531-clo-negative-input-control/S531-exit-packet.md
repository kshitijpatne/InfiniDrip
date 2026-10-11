# EPIC-17 / G04 V03 — CLO malformed DXF negative control — Slice 531 exit

## Result

CLO 2026.1.310 (r58944) silently imported the deliberately malformed synthetic
DXF-AAMA fixture as a single solid rectangular piece. It displayed no warning
or error and returned to the 2D canvas. The malformed file omits the group-code
`0` line immediately before the second `VERTEX` in the `CUT` POLYLINE. It is
396 bytes with SHA-256
`4A4D6544D433BC9DCC72C0901ECA4862472A545CC3A536679C177E6DB36FCAEC`.

The positive control is the same 402-byte generic square `CUT`/inset `SEW`
fixture with that group-code line intact (SHA-256
`78BDF785BBBF882E2E91F5F08C7446CA944B8501C6F54B30A2AF07CC34C49147`). With
the same DXF-AAMA import settings—centimeters, 100%, no rotation, maintain
original grain, notch both, `Import Draw Curve Points` checked, `Optimize`
unchecked, and `Remove Non-Grading Points` unchecked—the positive control
shows an outer piece boundary and the inset dashed sew contour. The malformed
case shows the outer square only; the inset contour is absent. Thus CLO accepts
the file while omitting expected geometry, without a visible indication. This
fails the malformed-input rejection gate for this tested profile/settings.

The captured malformed result is
`C:\G04-CLO-DXF-Exchange\S531-clo-negative-input-control\Evidence\malformed-import-accepted-no-warning.png`
(SHA-256 `EE3D4AA9B71B0DAF713FD4A58A0B56FC0722B4B414201FA604256B51933EC2E5`).
The positive render is
`C:\G04-CLO-DXF-Exchange\S531-clo-negative-input-control\Evidence\positive-control-import.jpg`.
Input fixtures, screenshots and saved CLO projects are confined to that
purpose-specific C: folder. No G04 pattern data or source geometry was used.

## Scope and gate disposition

- The practical malformed-input check is **failed**: the importer silently
  accepted a malformed file and omitted its inset `SEW` geometry.
- This finding is limited to CLO 2026.1.310's DXF-AAMA import path and the
  settings recorded above. It is not a claim about every CLO release/profile.
- No industrial profile, exact format compatibility, complete semantic
  preservation, grading, export round-trip, local-only handling, or rights
  criterion is cleared. In particular, the S526 trial-purpose and data
  handling questions remain independent blockers; this slice used only
  synthetic, non-garment data.
- No G04 pattern, source code, cut geometry, stitch graph, protected export
  baseline, V02 hold, or acceptance criterion changed. EPIC-17/G04-V03 remains
  In Progress with all V03 gates held.
- The existing CLO process remains open; no close/relaunch occurred. The
  pre-test project copy and positive-control session were preserved in the
  C: folder. No project outside that folder was edited.

## Verification and closeout

Started `2026-10-08 20:33:39 UTC` from S530 `0045765` on
`codex/epic-17-g04`. Refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S531 is unique;
board start replay was `3235→3237`; exit replay through the validated command
layer is `3237→3238→3239` on G04-V03. Control Center tests, canonical board
validation, exit replay preflight and `git diff --check` are required.
No production code or tests changed; changed-code coverage and the full
repository gate do not apply.

Elapsed `20:33:39–20:42:09 UTC` (~8m30s): CLO interaction and positive/negative
comparison ~4m20s; fixture/hash and screenshot evidence checks ~1m10s; durable
records, board replay and focused checks ~3m; external-agent wait 0m;
maintainer-decision time 0m. No delegation was safe for this stateful UI test.

**Next action:** continue with one C:-only, synthetic positive-control DXF
export/re-import in the already-running CLO session. Capture the exact export
mode, settings, output bytes and geometry comparison. Do not repeat this
negative-control case or use G04 pattern bytes; retain every V03 hold and
reconcile the independent S526 rights/data gate before any product fixture.
