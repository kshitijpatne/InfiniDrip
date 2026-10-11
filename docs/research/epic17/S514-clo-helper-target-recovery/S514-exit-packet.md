# EPIC-17 / G04 V03 — CLO helper target recovery — Slice 514 exit

## Finding and exact scope

The maintainer's report that CLO 2026.1.310 is running was verified by the
supported app inventory: one window was returned, ID `257823880`, titled
`CLO Standalone OnlineAuth`, with the installed executable path
`C:\Program Files\CLO Standalone OnlineAuth\CLO_Standalone_OnlineAuth_x64.exe`.
No close, relaunch, click, keystroke, script execution, file operation, or CLO
project/DXF operation was performed in S514.

The selected-window metadata and accessibility content identified CLO, but the
captured screenshot visibly showed Codex. The prescribed single recovery
reselected the same CLO window after a fresh inventory; the second capture
still showed Codex while its accessibility/document data identified CLO.
Because the visual surface and target identity did not agree after recovery,
S514 stopped app input. This is a concrete desktop-helper targeting/capture
failure; it is not a CLO error and gives no evidence about DXF compatibility.

## Installed build and bounded API-file inspection

Read-only inspection of the installed directory confirmed executable file and
product version `2026.1.310.58944` and found `CLOAPIInterface.dll` (291,136
bytes). Binary symbol inspection found `ImportDXF`, `ImportDXFW`, `ExportDXF`,
and `ExportDXFW`, with `ImportDxfOption`/`ExportDxfOption` signatures. The
bounded install search found no API headers, sample scripts, or Python binding
documentation that maps the installed build's numeric profile constants.

This improves the evidence that the exact installed build links the API entry
points described by CLO's public docs. It does not prove Python bindings are
available in the running app, identify AAMA/ASTM/Standard enum values, prove
profile selection, or demonstrate any import/export behavior. No format or
acceptance gate changes.

## Non-redundant practical plan

Do not rerun the already measured Standard DXF cases (S503, S505, S507, S508),
the AAMA-import/ASTM-export matrix (S503), or their unit/scale variations.
Do not retry the prior failed AAMA menu access (S509/S510) as if it were an
exchange test. When the supported desktop control provides a visually
verifiable CLO target, perform one instrumented pilot using the existing
hash-pinned Polo M fixture, confined to
`C:\G04-CLO-DXF-Exchange\S514-clo-api-smoke\` (or a fresh numbered folder if
that name already exists):

1. Verify from inside CLO that the installed Python bridge exposes
   `ImportDXF`/`ExportDXF`; record exact return values and any error text.
2. Select a UI-documented export/import profile only if the UI itself exposes
   that profile. Do not guess API enum integers or infer profile from an
   undocumented default. First target the not-yet-tested AAMA export and
   reimport path only if the dialog can be positively identified and settings
   recorded; otherwise stop with that precise API/profile blocker.
3. Compare parsed piece identity, source-scale CUT contours at the unchanged
   `0.001 cm` tolerance, marks/layers, grades where present, and two-generation
   reimport/render behavior against the existing fixture. Preserve logs,
   hashes and rendered output. Do not expand to seven recipes unless this
   single-profile pilot qualifies.
4. Use only the bounded local trial evaluation the maintainer already
   authorized in S503. Keep files/captures in the named C: folder; no cloud
   upload, account change, paid access, or new installation is authorized.
   This practical candidate test does not itself clear the separate V03
   receiver-rights/profile selection gate. Keep the running app open during
   the ongoing Epic; close it once, normally, only after the whole goal no
   longer needs CLO.

If the UI cannot be safely targeted, do not repeat the capture loop. Continue
independent V03 documentation/reconciliation and preserve the exact helper
error as an access blocker. CLO must remain running while the admitted work
still needs it.

## Gate disposition and verification

V01/V02 remain Done; V03 and EPIC-17 remain In Progress. All V03 profile,
rights/local handling, exact geometry, marks/layers, grade, negative-control,
two-generation round-trip, all-seven fixture, protected export-identity, and
claim-limit gates remain unchanged. S514 made no production-code or pattern
changes; no rendered exchange output exists and none is claimed.

- Start/exit board revisions: `3167→3169→3171`.
- `npm run control-center:test`: 42/42 passed. `git diff --check` passed.
- No changed production code; no full repository gate is due.
- Elapsed `2026-10-08 17:56:30–17:59:43 UTC` (3m13s): implementation 0m;
  helper/install inspection 1m20s; focused verification 43s; records/board
  1m10s; external-agent waits 0m; maintainer-decision time 0m.

## Sources

See `S513-exit-packet.md` for the official CLO API and help sources. S514's
installed executable and API DLL findings are direct read-only local
inspection of the exact installed build; binary symbol presence is not
treated as a format or round-trip test.
