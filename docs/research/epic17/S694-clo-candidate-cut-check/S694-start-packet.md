# EPIC-17 / G04 V03 — S694 start: one candidate CUT recheck in CLO

## Verified start and reserved slice

- Start: 2026-10-10 22:25:29 UTC.
- Worktree/branch: `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`, `codex/epic-17-g04`.
- Clean source start: S693 commit `1d75e65b969150d98184b9c6fdcbb92e4d5be71b`.
- Fetched `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the active branch.
- Highest assigned slice: 693; this packet reserves S694 uniquely.
- Canonical Control Center board start revision: 4109. EPIC-17 is In Progress; G04-V01/V02 Done; G04-V03 Blocked on its remaining exchange evidence gates.
- Goal remains active; no goal status change.

## Exact scope

Use the S693 adaptive-cut Polo STANDARD_M size-M candidate and the already-installed CLO 2026.1.310 **same Standard DXF route**, with the S689 mm-input conversion applied consistently to this new file (all planar coordinate group values 10/11/20/21 and circle radius 40 scaled x10; `$INSUNITS=4`). Import/export/reopen once. Compare only returned CUT contours to this exact submitted candidate after unit normalization, retaining the fixed `0.001 cm` maximum-distance gate. Also verify the unchanged sewn paths and save the returned file and rendered output. This check is justified solely because S693 made a source-backed change to the exact CUT geometry that failed in S689.

All interchange files, reports and diagnostic renders must stay under `C:\G04-CAD-Interchange\S694-clo-candidate-cuts\`. Source DXF remains immutable. Preserve legacy `exportDxf` behavior, every protected export byte identity, all seven recipe and supported-option requirements, and all V03 gates.

## Stop and pass conditions

- **Stop immediately** on import warning, missing/extra piece, any CUT path over 0.001 cm, or other concrete drawing failure. Record exact evidence and do not test another setting, mode, entity encoding, format, receiver, or fixture.
- If CUT paths pass, record only that this representative candidate geometry gate passed for this exact CLO route. Do not qualify CLO or pass V03: existing independent mark, identity, malformed-input, repeatability, readable-output, rights/profile, breadth/grade and receiver-matrix gates remain as recorded in S689/S691.
- Acceptance, thresholds, construction mapping, and V02/V03 criteria are not changed. No new software or receiver is introduced.

## Verification and boundary gates

- Inspect imported/reopened geometry and save the actual returned DXF; hash-pin input and output.
- Run the existing exact-file comparator against the submitted S693 candidate, with the same coordinate normalization and fixed tolerance. Render and inspect whole-pattern and detail output from actual returned geometry.
- Because this is evidence-only, focused verification is the source/return comparison, artifact hashes/render review, packet integrity and `npm run control-center:test`; no changed production coverage applies. Do not run full repository coverage/build before the integrated candidate.
- Update the V03 gate matrix/PROJECT-STATE, record focused result and time accounting, and close the canonical board through the validated command layer. Commit this slice once as `Slice 694: ...`.
- No physical sampling, fit, factory-acceptance, standards-conformance or production-readiness claim.

## Decisions and delegation

The same-app/route check and actual screen operation have already been authorized. No design decision or manual user action is pending. No independent disjoint low-risk task is available; Codex owns this short, coupled UI/import/comparison check. No external-agent wait is needed.

## Prior evidence and why this is not a repeated trial

S689 used a millimeter representation to address CLO's unit scaling and measured five CUT contour failures at 0.012742–0.013969 cm, eight visible-mark mismatches, generic returned identities, and unreadable saved overview. It retired that source candidate. S692 then traced the five cut omissions to an actual offset cusp, and S693 implemented a separately revision-bound adaptive offset curve and inspected its actual rendered geometry. This one same-route check tests whether that material source change clears the one gate it targets. It does not retest settled unit/mark/profile questions.
