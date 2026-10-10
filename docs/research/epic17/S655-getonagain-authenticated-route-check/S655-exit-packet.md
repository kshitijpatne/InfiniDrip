# EPIC-17 / G04 V03 — authenticated GetonAgain route preflight — Slice 655 exit

## Result

The user completed authentication manually. The signed-in `GMS Untitled` workspace is the garment nesting module, not the bundled Pattern Design & Grading module. Its File → Open dialog is titled `Open marker file`, defaults to `Marker File (*.mkr)`, and starts in the installed application directory. This proves a local marker-file dialog only; it is not a DXF import route. The File menu shows `Output Auto CAD dxf`, but it is disabled in the empty workspace. Its Export submenu offers Plot, Bitmap (disabled), 1:1 Marker Bitmap (disabled), Excel (disabled), Printer, and Batch; it exposes no DXF import/export command in the observed empty state. No marker or pattern was selected.

A single launch of bundled `DGS.exe` (file/product version 2023.1.0.0 / V2023.1, `Pattern Design & Grading`) failed to expose a targetable window. A fresh app/window inventory confirmed DGS is not running and has no window. No matching Windows Application event appeared in the ten-minute post-launch query. GMS remains running, authenticated, and untouched at its blank workspace. No credentials, code, DXF, or pattern file was entered by Codex.

This is not a DXF round-trip failure: no fixture operation occurred. GetonAgain V2024.1 cannot yet be selected or qualified because the only authenticated module lacks an observed direct DXF input route and the corresponding DGS module does not start. No V03 acceptance gate passes; all holds remain.

## Gate disposition

- Manual user authentication and GMS workspace reachability: **passed**.
- Local GMS `.mkr` marker open dialog: **observed**, but it does not establish DXF locality/compatibility.
- GMS direct local DXF import: **unproven / not exposed by the inspected Open route**.
- GMS DXF export: **unproven**; the visible `Output Auto CAD dxf` command is disabled without a loaded marker. The separate Export submenu contains no DXF item in this state.
- DGS Pattern Design & Grading build: **verified present**; interactive launch/window availability: **failed in this attempt**.
- Exact DXF profile/contract, source geometry and marks, units, identity/relations, grades/options, malformed-input rejection, repeatability, rendered readability, and all-seven coverage: **unproven**.
- Standards conformance: **unproven and not claimed**. No physical fit, factory acceptance, or production readiness claim.

## Scope, safety, and unchanged acceptance

This was a bounded UI/launch preflight only. The prepared S648 input at `C:\G04-CLO-DXF-Exchange\S648-getonagain-fixture-preflight\Input\polo-m-idr-profile-r14-first.dxf` was not opened, moved, or modified. No file was saved or imported/exported. No format, mode, entity, setting, source, or geometry permutation occurred. The user-confirmed product-development/local handling permission remains recorded; this UI result does not independently verify processing locality for DXF.

All original V03 gates remain unchanged: an eligible documented receiver/profile; 0.001 cm source geometry; units; piece/grade identity and seam relations; marks; malformed-input rejection; repeatable round trips; rendered readability; all seven recipes and supported options/grades; protected export identities; and legacy DXF behavior. V01/V02 remain Done; G04-V03 stays Blocked; EPIC-17 stays In Progress. No ANSI/AAMA or ASTM conformance claim is made.

## Verification and durable closeout

- Start state: S654 `2fec8081badeb495d1502b3e28512f5da85fd4a4`, branch `codex/epic-17-g04`, clean worktree, refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` an ancestor; board revision 3769; S654 highest, S655 unique.
- One malformed start-evidence JSON command was rejected before board mutation. The corrected command succeeded at revision 3770.
- Actual UI and one DGS launch check were inspected through Windows Computer Use. The user signed in; Codex did not authenticate or enter a credential/code.
- Focused verification: `npm run control-center:test` passed 42/42. `git diff --check` initially found one new blank line at EOF in each of `CONTEXT-INDEX.md` and `PROJECT-STATE.md`; the trailing blank line was removed and the final `git diff --check` passed. No production source or tests changed; changed-code coverage is not applicable.
- Validated board command-layer replay: start evidence at 3769→3770; exit evidence/description/comment replay ended at revision 3778. G04-V03 remains Blocked and EPIC-17 remains In Progress.
- Time: implementation/source changes 0; UI/build evidence review approximately 5 minutes; durable packet/state/board work and focused verification approximately 4 minutes; external-agent waits 0; maintainer-decision wait 0. Initial UI inspection began immediately after the user message; its exact start timestamp was not retained.

## Next action

Make one targeted, read-only diagnosis of why the installed DGS executable fails to produce a window (installed prerequisites/configuration/log evidence), without rerunning GMS authentication or changing system settings. If no safe local correction or supported DXF route is evidenced, stop this receiver candidate and report the exact access/receiver decision required. Do not open the prepared fixture until a direct, local DXF input route and exact source-matched contract are visible. The next commit is uniquely reserved as `Slice 655: record authenticated GetonAgain route check`; its hash will be visible in branch history after commit.

