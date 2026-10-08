# EPIC-17 / G04 V03 — CLO AAMA workspace recovery — Slice 510 exit

## Result

**No AAMA exchange occurred.** After the user reported that CLO was running,
the fresh app inventory returned one window whose accessibility tree exposed
the normal 2D pattern workspace. The File menu opened. The next import-menu
action was rejected as targeting a point outside the target window; the
required fresh-window activation recovery then failed with `no monitor found
for window`. No DXF was selected or opened. This is a desktop-control failure,
not a CLO or AAMA format result.

## Observed sequence

- Starting commit: S509 `18c1318089c169166a31e875c9ca5519a8b4a2ef` on
  `codex/epic-17-g04`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Board
  revision 3151; S509 was highest and S510 was reserved.
- `sky.list_apps()` returned one CLO app window, id `257823880`, titled
  `CLO Standalone OnlineAuth`. The accessibility tree exposed the normal CLO
  menus and 2D Pattern Window; this distinguishes the new state from S509's
  earlier startup splash.
- One File-menu action succeeded and exposed `Import`. Its next single action
  returned:
  `point (145, 203) is over CLO_Standalone_OnlineAuth_x64.exe "CLO Standalone OnlineAuth", not target window CLO_Standalone_OnlineAuth_x64.exe "CLO Standalone OnlineAuth"; activate the target or take a fresh screenshot before retrying`.
- `sky.list_windows()` then re-enumerated one CLO window. The required
  activation/refresh recovery failed with `no monitor found for window`. No
  stale menu index or coordinate was reused after that error.
- The pinned Polo M fixture was not opened. No AAMA/ASTM/Standard setting was
  changed; no exchange DXF, native project, settings capture or rendered DXF
  output was created. No new files were written to the C: exchange root.
- CLO was left running after the helper lost monitor access. No force termination
  was used; a normal app close could not be performed through the unavailable
  helper. This satisfies neither an exchange test nor a CLO result.

## Gate disposition

All V03 gates remain open and unchanged: rights/local handling, exact industrial
profile, source-scale geometry/units/piece-layer-mark semantics, native grades,
negative-control behavior, generation-two round trip and representative
fixtures for all seven recipes. S503's AAMA-import/ASTM-export, S508's
Standard-mode stacking, and this access failure remain distinct findings.
V01/V02 stay Done; V03 and EPIC-17 stay In Progress. Preserve the `0.001 cm`
gate, all-seven criterion, legacy DXF behavior, protected export byte
identities and all physical/factory claim limits.

## Verification and timing

- Start-board preflight passed at revision 3153 and validated replay advanced
  `3151→3153` without status or acceptance changes. Exit replay advances
  `3153→3155` and links this record to G04-V03.
- Focused `npm run control-center:test`: 42/42 passed. `git diff --check`
  passed before closeout edits; staged check is recorded with the commit.
- No production code or tests changed; changed-code coverage does not apply.
  No full repository gate is due for this documentation-only slice.
- Slice timing (UTC, approximate): start followed the S509 exit at 17:35:59;
  the exact first UI-observation time was not captured. UI recovery/diagnosis
  about 2m; durable records and validated board replay about 3m; focused tests
  under 1m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** continue the independent, evidence-bounded V03 receiver/profile
qualification. Retry the already-authorized AAMA fixture only when a newly
observed CLO workspace can be safely targeted by the supported helper. Do not
infer a format result from this access failure or weaken any gate.
