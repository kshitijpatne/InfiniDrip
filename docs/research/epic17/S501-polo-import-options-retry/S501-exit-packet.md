# EPIC-17 / G04 V03 — Slice 501 Polo import-option retry

## Result: repeatable startup window blocker

The planned four-profile matrix did not run; no DXF was imported or exported.
After confirming the prior CLO process had exited, S501 launched a fresh
process (PID `44612`). The app list exposed exactly one CLO startup window,
but `get_window_state` failed with `foreground window did not report a process
id`. After re-enumerating windows and selecting the single returned CLO
window, a second capture returned the same error. No coordinates or UI input
were sent after those two failures.

A graceful OS `CloseMainWindow` request was accepted. The exact CLO process
remained present after seven seconds with a nonzero main-window handle and
`Responding=True`; there was no accessible app prompt to complete shutdown
through the supported computer-use path. No forced termination was used. CLO
may still be consuming resources; closure is not verified.

The Polo M fixture was copied to
`C:\G04-CLO-DXF-Exchange\S501-polo-import-options\Input\polo-standard-m.dxf`
and matches the expected SHA-256
`796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`. No S501
output, project, or screenshot exists. All four option cells remain untested.

## Gate status

S500's coordinate evidence still proves the same non-collinear source vertex
is absent from five Polo M CUT contours in both captured S498 generations;
the exact gate remains `0.001 cm`. S501 does not establish a format or
receiver problem; it records a repeated UI-helper/window-state failure only.
All V03 rights/local-handling, industrial-profile, semantic-layer/mark,
native-grade, negative-input, independent-receiver, all-recipe and round-trip
gates remain. Preserve the Polo geometry failure and S498 malformed-input
failure. No source geometry, app settings, acceptance criteria or protected
export identity changed. No cloud/CLO-SET/CONNECT upload.

## Start, verification and next action

Started `2026-10-08 15:03:15 UTC` from S500 `fe8623a` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board start/exit
revisions `3113→3115→3119`; EPIC-17/G04-V03 remain In Progress, V01/V02 Done.
The goal remains active and aligned with the admitted objective.

Only the source hash, app/window listings, exact capture errors, and validated
board state were verified. Control Center tests and `git diff --check` cover
the durable records; no full repo/coverage/build gate is applicable to this
interruption slice.

Elapsed estimate (`15:03:15–15:05:18 UTC`): implementation `0m`; focused
launch/window recovery and graceful-close observation `1m`; durable records
and board verification `1m`; external-agent waits `0m`; maintainer-decision
time `0m`.

**Next:** do not repeat launches until the CLO window can be inspected or its
normal shutdown is resolved. Continue independent V03 evidence work from the
already captured files. The fresh four-cell test remains unrun; preserve the
0.001 cm threshold and all acceptance gates.
