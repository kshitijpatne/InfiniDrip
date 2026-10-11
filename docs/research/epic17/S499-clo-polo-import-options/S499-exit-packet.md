# EPIC-17 / G04 V03 — Slice 499 Polo import-option diagnosis

## Result and stop condition

No import/export trial ran. CLO was explicitly launched for the bounded
four-profile option matrix, but after startup the Windows Computer Use helper
lost a usable handle before the file chooser could be opened. The attempted
click returned `window is not a usable app window`. After refreshing app and
window enumeration, `get_window_state` returned
`foreground window did not report a process id`. A further fresh
`list_windows()` still listed one CLO startup window; `list_apps()` reported
CLO running. Per the computer-use recovery rule, no more coordinates or input
were sent. Normal File → Quit could not be reached, so closure was not
verified. No taskkill or forced process termination was used.

The S499 test matrix is inconclusive, not a format finding. No S499 output,
project or screenshot was created. The sole copied input remains under
`C:\G04-CLO-DXF-Exchange\S499-clo-polo-import-options\Input\polo-standard-m.dxf`
and matches source SHA-256
`796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.

S498's concrete findings remain: Polo has five CUT contours outside 0.001 cm
in each of two actual generations; Tee/Woven M subsets meet their measured
geometric comparisons; and the imported negative control missing final EOF
was silently accepted. Do not infer the cause of Polo's loss from this failed
S499 UI start. V03 stays In Progress with all rights, local-handling,
industrial-profile, layer/mark, native-grade, negative-control,
independent-receiver, all-recipe and round-trip gates unchanged.

## Start and scope

Started `2026-10-08 14:53:34 UTC` from S498
`01de6ccde1432de48ced567e0823a8f3c1075fe2` on `codex/epic-17-g04`;
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S498
was highest; S499 reserved. Board start advanced `3101→3103`; V03 and the Epic
remained In Progress. Goal active; primary usage 14%, weekly 39%.

Planned scope was the fixed 2×2 local import matrix (DXF-AAMA/DXF-ASTM crossed
with “Optimize All Curve Points” off/on), all other settings fixed, output
confined to the dedicated C: folder. The source was copied and hash-checked.
The UI did not reach a usable state, so the matrix was not started. No
geometry, source, app setting, account, terms, rights, network, ACL, security,
driver or acceptance changes occurred. No cloud/CLO-SET/CONNECT upload.

## Verification and next action

Only the source hash and validated board closeout were verified; no receiver
behavior is inferred. `npm run control-center:test` and `git diff --check`
are the focused durable-record checks. No full repository/build/coverage gate
is due for this documentation/evidence-only interruption.

Elapsed estimate (`14:53:34–14:55:38 UTC`): implementation `0m`; focused
launch/UI observation `2m`; durable closeout `1m`; external-agent waits `0m`;
maintainer-decision time `0m`.

**Next:** do not rerun this UI matrix until CLO exposes one usable, responsive
window. In the meantime, diagnose the S498 Polo source/output point removals
from already captured C: artifacts without assuming they are caused by an
import-format setting. Preserve the S498 negative-control failure and all
V03 gates. CLO remains listed as running but could not be closed through its
UI after the window-handle failure.
