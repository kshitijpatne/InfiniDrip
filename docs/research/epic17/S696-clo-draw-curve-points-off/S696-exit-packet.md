# EPIC-17 / G04 V03 — S696 exit packet

## Outcome

S696 completed its single authorized, one-variable CLO 2026.1.310 Standard DXF check. The exact hash-pinned S693 Polo M candidate was imported with **Import Draw Curve Points off** and exported once with the recorded S694 settings. The setting was visually checked in the live CLO dialog; no screenshot was saved. CLO showed nine pieces without an error or warning. This is not a passing round trip.

The exact candidate regenerated from current source byte-for-byte: `7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`; package revision `cc0e1c5f111b2485ffdc7fafac60820f654d6bd541620fff47af51e747a3846d`. Raw returned DXF: 367,129 bytes, SHA-256 `5f746e7dea08c18a0325c2fa74a7c8556b1ae5258021ddf0f395aebb45f1700d`, declares millimeters. Comparison copy is only a coordinate/unit normalization copy, SHA-256 `95fdcb5a4f36273eda7272ea9754ebf567f37b338db63f9f64b3e2274be72dbe`; original remains immutable.

At unchanged `0.001 cm` threshold, six of nine CUT contours fail: Polo front `0.001035292`, back `0.002988904`, outer stand `0.011015103`, inner stand `0.039767815`, upper collar `0.011015104`, under collar `0.011018592 cm`. Sleeve `0.000997600 cm` and both plackets `0.000004809 cm` pass. Independent symmetric comparison of the actual returned drawing confirms all nine SEW paths pass, maximum `0.000014124 cm`. The three source buttonhole anchors remain misplaced by `1.4999966 cm` each. Return entity inventory has 132 polylines, no `LINE`/`POINT`/`CIRCLE` typed marks, and numeric layers `1`, `7`, `8`, `14`. The rendered whole-pattern overlay and inner-stand detail were inspected; visible contour differences and missing marks fail faithful-output review. PNG SHA-256: overlay `535faa2c95703627c561a26a032a32570ac3aa23c10d084974289b68ee9489f3`; inner stand `4668baae4956b3eb3a1d871a5ab7e7c7e8c84a14dba6d19a3cc9ec2e389c63a2`. Exact machine reports: `S696-localization/S696-localization-report.json`, `S696-entity-inventory.json`, `S696-buttonhole-mark-check.json`, `S696-sew-contour-check.json`, `S696-normalization-report.json`, and `S696-render-report.json` under the named C: evidence folder.

All external CAD files, screenshots/session backup, scripts, machine reports and renders remain under `C:\G04-CAD-Interchange\S696-clo-draw-curve-points-off\`. Hash-pinned report, setting summary, mark/inventory checks, SEW check and renders are listed below. The reused localizer's narrative was corrected from seven CUT failures to six; its measured piece rows already showed six.

## Gate reconciliation and next action

`S696-v03-gate-matrix.md` reconciles every fixed V03 gate and labels exact route/fixture evidence. `S696-v03-completion-plan.md` removes the proposed LibreCAD current-source pilot after the bounded Sol review: even a technical pass cannot satisfy LibreCAD's already documented generic-CAD profile classification. S690's one-fixture geometry pass is not a path to the admitted industrial/apparel gate. Prior route records already cover the tested alternatives; no further application, format, or setting trial is scheduled without evidence that it can satisfy that gate. The full read-only review is in `S696-sol-review.md`.

V01/V02 remain Done; all 146 V02 faces remain as previously accepted. V03 remains unaccepted/Blocked and EPIC-17 remains In Progress. No acceptance, all-seven/options/grades, fixed threshold, legacy export behavior or protected byte identity changed. No physical fit, factory acceptance, exact standards conformance or production-readiness claim.

## Verification and board

- `npm run control-center:test`: 42/42 passed.
- `git diff --check`: passed.
- Changed production-code coverage: not applicable; no production code changed.
- Full repository 100% coverage/build/browser/output gate: pending at the settled integrated candidate.
- Board start/exit replay: revision 4117→4118→4124 (`E-G04-S696-START/EXIT`, gate matrix, completion plan, Sol review and correction comment), all through the validated command layer. V03 stays Blocked; Epic stays In Progress.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor; no merge/PR exists yet.

## Slice accounting and handoff

- Start: 2026-10-10 22:48:54 UTC from S695 `54897bee2eeb552d9e35a1690036b6728d3bc540`; worktree `codex/epic-17-g04`. Highest slice 695; S696 unique. Goal remains active; no goal mutation.
- Implementation: 0 minutes (diagnostic only).
- Receiver operation and UI setting check: approximately 3 minutes.
- Focused geometry/mark/render diagnosis: approximately 4 minutes, including an added independent 9/9 SEW comparison.
- Durable records, board replay and focused checks: approximately 5 minutes.
- External review wait: approximately 3 minutes for one read-only Sol high review; Codex verified recommendations against the cited primary records.
- Maintainer decision time: 0 minutes. Approximate total elapsed: 15 minutes.
- Next action: preserve the active goal and pursue V03 only when an already available, rights-cleared local apparel/industrial receiver/profile can be evidenced. S696 Sol review rejects repeating the generic LibreCAD route because it cannot satisfy profile eligibility. No product workaround, standards claim, or acceptance relaxation is authorized.



\n