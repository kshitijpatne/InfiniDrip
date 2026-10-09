# EPIC-17 / G04 V03 — CLO internal-line grading selection research — Slice 604 exit

## Verified boundary

- Started 2026-10-09 10:20 UTC from S603 commit `b711f3c29dbba0700504f37bda956d13310bb57b` on `codex/epic-17-g04`. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S603 was the highest assigned slice; S604 is unique. Validated start replay moved the canonical board from revision 3546 to 3548; EPIC-17/G04-V03 remain In Progress and G04-V02 remains Done.
- Product-development evaluation of CLO and local-only exchange-file handling are confirmed in writing. No further confirmation is needed. CLO remained open; this slice made no UI input or file operation.
- S604 reviewed only the question left by S603: whether CLO's primary documentation provides a reliable, version-relevant way to distinguish an internal sewn-line point from a CUT-outline point before typing grading values.

## Findings and evidence class

1. **Directly documented, current CLO help:** [Set Grading](https://support.clo3d.com/hc/en-us/articles/115015798567-Set-Grading), updated September 29, 2026, says Edit Grading selects a pattern outline or point and describes grade-point options. Its green halo specifically denotes Grade Points after conversion of *pattern outline* points; it does not document a semantic cue for internal-line point selection. The page also says alignment can be arranged by internal lines, but alignment is not a selection identity indicator.
2. **Directly documented, older CLO staff guidance:** [Internal lines follow grading](https://support.clo3d.com/hc/en-us/community/posts/4437185131417-Internal-lines-follow-grading?page=1), CLO Designers reply dated February 22, 2022, says to select an internal-line segment point with Edit Grading and extend it to the grading edges. The same thread records another user's inability to grab the point and a “Lines or points are too close together” error. This establishes that the operation is supported in principle, not that CLO 2026.1.310 provides a reliable identification cue on the S565 waistband.
3. **Directly documented, CLO API reference:** [CLO API list](https://developer.clo3d.com/list.html) exposes `GetPatternInternalShapePoints` (internal-line/internal-shape geometry) and `GetPatternOutlinePoints` (outline-point geometry). `SetPatternPointsGradingPositionOffsets` explicitly edits selected **pattern outline points**. The documented list did not expose a matching internal-shape point-grading setter or a getter for the currently selected GUI grading point. The API documentation's exact compatibility with CLO 2026.1.310 is not stated. The geometry getters are therefore a promising read-only way to identify/map the internal path in the current project, but they do not authorize or perform grading edits.
4. **Directly documented, API behavior:** `TraceBaselineAsInternalShape` says a traced internal line inherits its baseline's per-size grading. The S565 input path is an imported internal line, not a source baseline proven to be eligible for that transformation; using this API as a repair would change the project and is outside this documentation-only slice.
5. **Observed in S603:** the selected-point table showed 20.0 mm X / 0.0 mm Y at each size step, inconsistent with S567's source-derived waistband SEW movements. The UI did not identify which contour/point produced those values. S603 correctly entered no values, saved no CLO project, and ran no exchange.

## Decision and gates

No trustworthy, version-specific selection cue was found. General staff instructions do not resolve the identity ambiguity observed in S603. Keep the five-size waistband trial held; do not repeat the GUI selection or edit until the internal path and outline points have first been separately identified from same-project geometry evidence.

No V03 acceptance gate clears. Preserve the 0.001 cm contour threshold, the all-seven-recipe requirement, V02-before-V03 ordering, legacy DXF behavior, protected export identities, and every other V03 gate. No format compatibility, physical-fit, factory-acceptance, or production-readiness claim is made.

## Next bounded action

S605: use only the documented read-only CLO geometry getters, if callable in the already-running exact CLO session, to capture the S565 waistband's internal-shape points and outline points, then match each independently to S567's source CUT and SEW geometry. First confirm runtime availability and non-mutation. Do not invoke any setter, grade value, save, or DXF exchange. If the exact runtime getter is unavailable or the returned geometry cannot uniquely identify the two paths, stop and retain the hold. If identity is uniquely established, present the exact selected-point mapping and verification plan; no grading mutation is authorized by S605.

## Verification and closeout

- No production code or test changed. No full repository gate or changed-code coverage run was applicable.
- Validated Control Center exit replay moved board revision 3548→3550, linked `E-G04-S604-EXIT`, and left EPIC-17/G04-V03 In Progress and G04-V02 Done. Control Center tests: 42/42 passed. `node --check` passed for both replay/preflight scripts; exit preflight passed; `git diff --check` passed.
- The documented sources above were opened and checked directly. A constrained Claude CLI research process was also started with the requested exact model identifier, but it exited without a retrievable result or explicit `WORK FINISHED` signal; no external finding was accepted or used. Codex independently checked each controlling primary source.
- Focused verification: S604 packet/preflight, validated board command replay, Control Center suite, and `git diff --check` (results recorded in commit/terminal at closeout).
- Timing: source review 2m30s; durable documentation/board/state updates 2m; focused verification 1m; external-agent wait 0m30s (no usable return); maintainer-decision time 0m.
