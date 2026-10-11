# EPIC-17 / G04 V03 — S595 input-side stage diagnosis — Slice 608 start

## Verified start

- Started 2026-10-09 11:00:11 UTC from S607 commit
  `ed07289cb614ced8f6215b52d16abf79bad4d26c` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S607 is the highest assigned slice; reserve S608. The dedicated
  worktree was clean, and the canonical board is revision 3562 with
  EPIC-17/G04-V03 In Progress and G04-V02 Done.
- The goal record is active and still matches the admitted EPIC-17 objective.
  User-confirmed CLO product-development authorization and local-only file
  handling remain settled. Keep the existing CLO 2026.1.310 process running.
- S601 explicitly confirms that the saved S595 CLO project is the imported
  input-side scene, not a reimport of the failed S595 output. This makes a
  read-only query of that project a specific stage-attribution check rather
  than a repeat export or a repeat of S606's S565 query.

## Objective and bounded method

Use the already documented, read-only `GetPatternInputInformation` getter on
the hash-pinned S595 input-side CLO project. Compare all returned shapes with
the exact S595 periodic-SPLINE input fixture and its hash-pinned original
source, then compare any unambiguously corresponding paths with the pinned
S595 emitted DXF's measured CUT results. Use only coordinate/unit scaling
already evidenced by S606; allow cyclic start/reversal where applicable, but
do not translate, rotate, refit, project, or infer CUT/SEW semantics from API
names. Save the helper, raw capture, comparison, hashes and UI capture only in
`C:\G04-CLO-DXF-Exchange\S608-clo-input-side-stage-diagnosis\`.

This can distinguish a source-corresponding path already changed in the
input-side model from a path that remains input-exact there but differs in the
emitted file, only where exact piece/path correspondence is unambiguous at the
existing `0.001 cm` gate. A missing or transformed getter path, unresolved
identity, or API limit yields “stage not attributable,” not a guessed cause.
The getter is undocumented for units and manufacturing semantics; results
remain source-specific observations, not a claim about CLO's general behavior.

## No-go actions and acceptance

- Do not grade, change geometry, save the CLO project, export/reimport a DXF,
  modify production code, or change any V03 criterion or threshold.
- This slice passes only its diagnostic goal if the saved input-side scene is
  confirmed, all getter calls are captured without errors, exact source/input/
  output hashes are verified, and every result is either uniquely compared or
  explicitly left unattributable with the reason and residual. Review the
  actual CLO scene and any returned-path detail at useful zoom.
- This diagnostic clears no V03 gate and accepts no receiver/profile. Keep the
  five S595 Polo CUT failures and all all-seven, profile/rights, identity,
  CUT/SEW semantics, marks, grades/options, malformed-input, repeated-round-
  trip and rendered-output gates open. Preserve V02-before-V03, legacy DXF
  behavior, protected export identities, and no-fit/factory claims.

## Focused verification and ownership

Codex owns this single live-session, read-only probe; no safe independent
delegation exists. Verify evidence hashes and reproducible comparison outputs,
run the focused Control Center suite for board replay and `git diff --check`.
No production source/test change is planned, so changed-production-code
coverage is not applicable; full repository coverage/build remain for the
settled Epic/PR candidate. Record UI/research, focused verification,
documentation/board, external waits, and maintainer-decision time separately
at exit.

## Single next action

Load the hash-pinned S595 input-side project in the existing CLO session,
observe its identity and current scene, then run the read-only getter once.
Stop the diagnosis if the scene or returned shape correspondence is ambiguous.
