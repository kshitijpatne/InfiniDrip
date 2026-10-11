# EPIC-17 / G04 V03 — periodic-SPLINE pre-export boundary check — Slice 596 start

## Verified start and scope

- Started `2026-10-09 08:49:06 UTC` on `codex/epic-17-g04` from landed S595
  `02c4848326e1edebdf765bf03db25378835dae28`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S595 is the highest assigned/landed slice; S596 is reserved uniquely.
- Board revision `3514`: EPIC-17/G04-V03 In Progress; G04-V02 Done. The
  admitted all-seven scope and every V03 gate remain unchanged.
- CLO 2026.1.310 is already running. Use the saved S595 **post-import,
  pre-export** project only:
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Evidence\CLO\S595-periodic-spline-import.zprj`,
  SHA-256 `f402095a5907b0719cce2c76bee4e42e3607016c369ba38c30a9bef03ca834d4`.
  Its source is the exact S595 periodic-SPLINE candidate
  (`e050b9dd3e49677494878be9460e0e740bebe3ce1f97a731a328786e706caebc`).
- All S596 scripts, API capture, screenshots and analysis stay within
  `C:\G04-CLO-DXF-Exchange\S596-clo-periodic-import-boundary\`.

## Question and bounded operation

S595's source proof is exact, but the subsequent CLO export fails five CUT
contours. S580 already queried CLO's documented `GetPatternLineInfo(index)`
against a different, line-based Polo input and found eight SEW matches and no
CUT matches. S596 tests only whether the *new periodic-SPLINE input* is
geometrically observable in the saved S595 pre-export scene. This distinguishes
the current imported-scene/API observation from the already measured exported
DXF without repeating import/export or changing a CLO option.

1. Verify the saved project and source/candidate hashes, then open that saved
   project in the existing CLO window. Do not close or relaunch CLO.
2. Run one allowlisted, read-only query for `GetPatternCount`,
   `GetPatternPieceName(index)`, and `GetPatternLineInfo(index)` on indexes
   0–8. Write raw results and a screenshot only to the named S596 C: folder.
   Do not call setters, save the project, or import/export another DXF.
3. Compare returned lines in CLO's documented direct millimeter frame against
   all source CUT/SEW contours from the hash-pinned S536 baseline and against
   the five periodic CUT contours. Preserve source role labels only as literal
   source metadata. Require unique, direct-frame geometry correspondence at
   `0.001 cm`; do not fit a transform or infer CUT/SEW meaning from API index,
   piece name, or output layer.
4. Report whether any source geometry is uniquely observable at the pre-export
   API query and whether the result can distinguish receiver import from later
   output behavior. If results remain unlabelled or ambiguous, state that the
   test cannot attribute a processing stage and do not invent a cause.

## Limits, non-goals and gates

- This is evidence-only. No product implementation, source/cut/stitch
  geometry, production DXF writer, legacy output, protected export identity,
  V02 output, profile, setting, threshold or acceptance wording changes.
- No second DXF exchange, new format/profile candidate, broad API survey,
  proprietary project decoding, or extra CLO trial.
- Do not treat the documented API call as proof of importer causation: its
  contract does not assign CUT/SEW roles and S580 reports no source CUT match
  for its different input. The S595 output's five failures and the fixed
  `0.001 cm` gate remain binding.
- Preserve all-seven recipes/configurations, receiver rights/profile,
  stable identity, CUT/SEW semantics, marks, units, grading/options,
  malformed-input, useful-detail and repeated-round-trip gates. No industrial
  compatibility, physical-fit, factory-acceptance or production-readiness
  claim.
- No independent low-risk delegated task exists for this single live-app
  read-only measurement; Codex owns capture, comparison and review.

## Focused checks and exit evidence

At exit: validate exact file/project/API hashes; validate the getter script's
allowlist and result schema; run a fixed-coordinate analyzer with the unchanged
gate; inspect the live CLO state/screenshot; run board command clone preflight,
validated CLI replay, Control Center tests and `git diff --check`. No
production code changes means the full repository gate remains reserved for
the settled Epic/PR candidate. Record app/API analysis time, verification,
board/documentation, external waits and maintainer-decision time separately.

## Single next action

Run the one read-only outline query on the saved S595 pre-export scene, then
compare only with the pinned source/candidate geometry. No new DXF exchange.
