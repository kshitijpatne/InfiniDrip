# EPIC-17 / G04 V03 — source-derived CLO sew-line grade trial — Slice 568 exit

- Closed: 2026-10-09 03:27:04 UTC.
- Started: 2026-10-09 03:26:20 UTC at S567 commit `04a8e0a` on
  `codex/epic-17-g04`.
- Refreshed `origin/main` was `a5af5e1`, an ancestor of the start commit.
  Board replay: start 3385→3387; exit 3387→3389.
- CLO 2026.1.310 remains running. No UI input, project copy, import, export,
  or C: file operation occurred in S568.

## Concrete observation and effect

The prescribed `sky.list_windows()` inventory returned one CLO top-level
window only: id `257823880`, title `CLO Standalone OnlineAuth`. There is no
separately targetable modal window. A fresh `get_window_state` of that
returned window produced:

- screenshot: CLO's main workspace with no visible Export DXF modal;
- accessibility tree: a child window named `Export DXF`, showing DXF-AAMA,
  Graded Nest, centimeters, 100%, and Do Not Rotate.

The two observations still disagree. This prevents safely selecting the
internal sew line, changing its grade points, saving an S568 project copy, or
exporting. Input would target a hidden/mismatched dialog or canvas with no
reliable way to verify which control receives it. No attempted action or
export result is inferred. This is a computer-use observation failure; it is
not evidence CLO rejects the file format.

The exact test remains the S567 source-backed plan: grade internal-line
segment points at per-step deltas `(+2,+1.5)`, `(+4,+1.5)`, `(+4,+1.5)`,
`(+2,+1.5)` cm; then export one DXF-ASTM/Graded Nest sample and compare all
five source CUT/SEW outlines at 0.001 cm before same-app re-import review.
Use it only after screenshot and accessibility state agree.

## Gate and slice disposition

- V03 remains In Progress. No profile/rights, seven-recipe, semantic,
  grading, marks, malformed-input or round-trip gate is cleared or changed.
- No pattern/product code, grade rule, source geometry, protected byte
  identity, legacy behavior, or acceptance threshold changed.
- Start/exit evidence and comments are linked through the validated board
  command layer, revision 3385→3387→3389.
- Focused checks: start/exit command preflight and syntax checks passed;
  Control Center tests passed 42/42; `git diff --check` passed. No production
  code changed; full repository tests/coverage were not due.
- Timing estimate: CLO surface inventory and safe-state evaluation 0m40s;
  focused checks and records 0m20s; external-agent waits 0m; maintainer
  decision time 0m.
- Next: investigate an official CLO scripting/automation route for this exact
  installed version that might expose grading/export without ambiguous mouse
  targeting. Do not use an API/SDK unless official documentation covers the
  installed version. Continue independent V03 work; keep CLO open.
