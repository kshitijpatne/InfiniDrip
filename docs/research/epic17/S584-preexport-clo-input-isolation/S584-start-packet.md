# EPIC-17 / G04 V03 — CLO pre-export input isolation — Slice 584 start

## Verified start

- Start: 2026-10-09 05:47:57 UTC from S583 commit
  `8a933cb63b9261e00e9738adc4069a4b3f44c68f` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; the worktree is clean before this packet.
- Canonical board revision 3449: G04-V02 Done; G04-V03 In Progress. Highest
  assigned slice 583; reserve S584.
- The goal is active and matches the admitted EPIC-17/G04 objective. Ordinary
  usage is available (primary 13%, weekly 70%).
- CLO 2026.1.310 is already running. User confirmed written rights for this
  product-development evaluation and local-only file processing; no further
  rights/locality check is a blocker.
- The source fixture and saved **post-input-import, pre-export** CLO project
  are the hash-pinned S574 artifacts. Saved project SHA-256:
  `43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25`.

## Objective and method

Determine whether the S583 `GetPatternInputInformation` geometry observations
are already present in the saved CLO project immediately after source import
and before export. In the current open app, open the hash-verified S574
`clo-after-line-chain-import.zprj` without closing CLO. Run one read-only
capture of `GetPatternCount`, `GetPatternPieceName(index)`, and
`GetPatternInputInformation(index)` for indexes 0–8. Compare its raw point
sequences with the S583 snapshot under the same fixed, translation-only
comparison method and compare both to the pinned S574 source/fixture.

This one stage-isolation check is justified by S583's concrete uncertainty:
its current project stage was not recorded. A matching pre-export result would
place the observed paths in the pre-export project snapshot, but the API docs
still do not promise CUT/SEW semantics; do not claim that the importer itself
caused the loss unless the source, project identity, returned fields and
independent output evidence together support that conclusion. If results
differ, record the exact differences and do not attribute the difference to
export without a controlled stage comparison.

## Scope and safety boundary

- CLO calls: count, piece name and the documented read-only
  `GetPatternInputInformation` getter only. No undocumented methods.
- No DXF import/export, file conversion, geometry edit, setters, project save,
  simulation, cloud operation, or CLO restart. The hash-pinned project is
  opened from and all evidence is saved under the named C: exchange folder.
- Keep the S574 profile identity, 0.001 cm geometry gate, representative and
  all-seven V03 criteria, all-seven V02 status, protected export byte
  identities, and legacy DXF behavior unchanged. No compatibility, fit,
  factory, or production-readiness claim.
- Codex owns the live app operation and evidence review. No safe independent
  task exists for a single-state exact-build check.

## Acceptance and verification

Pass the slice if the pre-export project opens in the running app without a
blocking error, the getter returns for all nine indexes or records exact
per-index failures, and raw strings plus parsed JSON are saved. Verify the
opened project hash before UI interaction, and save an app screenshot showing
the saved-project identity and post-query state. Compare with the S583 captured
state and pinned source geometry using the exact fixed scale, translation-only
mapping, no scale/free rotation, and the 0.001 cm gate. Preserve no-match and
repeated-shape ambiguity explicitly.

Run script/JSON/hash checks, focused Control Center tests, validated board
preflight/replay/status checks, and `git diff --check`. No production source or
tests change; no full repository gate is due. Update the durable project state
and context index before closing the slice.

## Next-action rule

This is the final single-state diagnostic before returning to direct exchange
acceptance. After S584, select a concrete next V03 test only from the observed
result and remaining admitted gates. Do not repeat API surveys or the prior
S574 generation-one exchange; do not change the profile, tolerance, or scope.
