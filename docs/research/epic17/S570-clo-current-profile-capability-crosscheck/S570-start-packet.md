# EPIC-17 / G04 V03 — CLO current profile capability cross-check — Slice 570 start

- Started: 2026-10-09 03:40:10 UTC.
- Branch: `codex/epic-17-g04`.
- Start commit: `c6dda6fc19dbe9abca75f9d26382dd55dde38da4` (S569).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of HEAD.
- Start board revision: 3393; `G04-V03` is In Progress.
- Highest assigned slice: 569; this reserves unique S570.

## Scope and purpose

Cross-check the current first-party CLO DXF help for installed-version-period
profile, graded-size and layer/semantic claims, and record one fresh observation
of the already-running CLO UI. Reconcile only newly documented claims against
the established S525/S539/S541/S542/S547/S557/S559/S562/S565/S569 evidence.
This is a documentation/evidence slice; it will not rerun a DXF exchange,
change product code, alter acceptance, or retry known UI controls.

## Acceptance and exit evidence

- Cite the current official CLO help page and state precisely what it does and
  does not document about AAMA/ASTM profile identity, grade encoding, CUT/SEW,
  marks, and round-trip fidelity.
- Capture current CLO screenshot and accessibility text separately; retain the
  observed mismatch and any helper error. Do not act on the app from a
  contradictory state.
- Map the results to the existing V03 matrix, identify any gate newly cleared
  (expected: none), and name the next distinct evidence action.
- Preserve all-seven recipe scope, existing tolerances, rights/locality
  confirmation, protected byte identities, generic DXF behavior, and V03 gates.

## Non-goals, risks and holds

No app settings, mouse/keyboard input, new file/import/export operation,
profile selection, implementation, installation, cloud action, vendor contact,
spend, or acceptance change. CLO remains open. The key risk is mistaking a
product help page's broad compatibility statement for a specific normative
edition or for measured receiver behavior. Written product-development and
local-processing authorization is settled.

## Verification and ownership

Codex owns the source cross-check, current-state capture, evidence reconciliation,
validated board replay, focused Control Center test and final review. No
independent low-risk subtask has disjoint ownership: the small source review and
state capture jointly define this evidence. No external agent is needed.

Focused evidence checks: source citations and packet consistency; board
command-layer preflight/replay; `npm run control-center:test`; `git diff --check`.
No production code changes, so changed-code coverage and the full repository
gate are not due.
