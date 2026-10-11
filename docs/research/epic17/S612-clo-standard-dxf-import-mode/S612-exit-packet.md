# EPIC-17 / G04 V03 — CLO Standard DXF import-mode trial — Slice 612 exit

## Verified boundary and result

- Closed 2026-10-09 11:45:39 UTC on `codex/epic-17-g04`, starting at
  `c2b24705a53a02663e9c5073151b4b7150200be0` (S611). Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it remains an
  ancestor. Board start revision was 3578 and the S612 admission replay moved
  it to 3580. The closeout replay moves 3580→3582. EPIC-17 and G04-V03 remain
  In Progress; G04-V02 remains Done.
- **The planned CLO test did not run.** The documented computer-use API
  inventory returned `apps: []`; `cua.listWindows()` and
  `cua.getApp({windowId:257823880})` both failed because those methods are not
  available in the active runtime. The latter window ID is carried from prior
  verified work, but this session cannot freshly inventory or bind it. No
  screenshot of the current app, fresh accessibility state, CLO input, or
  file operation was obtained. The browser inventory is unrelated and was not
  used to control CLO.
- No app was closed, opened, or relaunched. No S612 folder, imported/exported
  DXF, rendered output, or result analysis was created; no CLO window or
  project was changed. This is a computer-use access blocker, **not a CLO
  format failure**. It provides no evidence for or against Standard DXF and
  clears no V03 gate.
- The written authorization for CLO product-development evaluation and local
  DXF handling remains settled. All future import/export and rendered evidence
  remain restricted to the named C: work folder in the start packet. Do not
  ask the maintainer to repeat that authorization.

## Gate disposition and next action

All G04-V03 acceptance criteria and all-seven recipe criteria remain unchanged
and held. In particular, the concrete S609/S610 result still shows five of
nine Polo M CUT contours failing the fixed `0.001 cm` source-bound gate while
9/9 SEW paths pass. Testing Standard DXF could isolate whether the AAMA input
mode is implicated, but it cannot alone establish the industrial profile,
rights, seven-recipe coverage, semantics, grades, negative-input behavior,
repeated exchange, or rendered detail required for V03.

Next action: restore a supported, freshly verifiable native CLO-window binding
in computer use, without closing/relaunching the existing app, then execute
the single controlled Standard-DXF import trial from the S612 start packet.
If that access surface remains unavailable, stop UI repetitions and continue
with source-backed V03 evidence that does not require CLO. Do not infer an
import/export result from the current lack of UI access.

## Verification and time accounting

- The proposed CUA calls were attempted once each and their exact capability
  failures recorded above. No repeat attempt, app lifecycle action, or browser
  action occurred. CLO stays open as last user reported.
- Documentation-only; changed-code coverage is not applicable. Board
  preflight/replay, focused Control Center tests, and `git diff --check` are
  recorded at closeout. No external-agent waits or maintainer decision time.
- Elapsed time (11:43:51–11:45:39 UTC): repository/API state review about 1
  minute; boundary record and focused checks about 1 minute; external-agent
  waits 0; maintainer-decision time 0.
