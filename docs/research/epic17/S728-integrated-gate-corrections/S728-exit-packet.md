# EPIC-17 / G04 — S728 integrated-gate corrections exit

## Result

S728 closes its integrated-gate repair scope. It corrected the diagnosed
Vitest/Node discovery mismatch without dropping the six historical Node tests,
added the missing option-only Trouser fly-underlap measurement inventory row,
made the Woven open-vent projection fail closed when source-adjacent edges do
not match, corrected depth-zero vent expectations to match the source recipe,
reconciled superseded pre-S459 UI expectations, and preserved source-stitch
identity while representing back sleeve bands as detached view details. The
S425 rendered replay retains its assertions with a 30-second timeout.

These changes do not change V03 acceptance, any garment cut geometry or stitch
graph, supported recipes/options/grades, the 0.001 cm receiver threshold,
legacy DXF output, protected export byte identities, or release gates. No
software was installed or tested. V03 technical evidence remains as accepted
in S726; the exact compatibility claim remains limited to the 11 audited and
render-reviewed LibreCAD 2.2.1.5 / Drawing Exchange DXF 2000 returns, with no
standards or industrial-apparel conformance claim.

## Focused verification

- Projection, geometry, option measurement inventory, technical-flat panel,
  S348/S349 crosswalk, and S425 browser checks passed. The modified live-view
  module retained 100% statement, branch, function, and line coverage.
- All six historical Node-native research test files were run explicitly by
  Node: 12/12 tests passed.
- `git diff --check` passed.

## Settled integrated gates

- Full repository Vitest and coverage gate passed after the final source/test
  correction: 158 files, 2,366 tests, 100% statements, branches, functions,
  and lines; duration 1,561.35 seconds. Full log:
  `C:\G04-CAD-Interchange\S728-integrated-gate-corrections\vitest-full-coverage-final-after-ts-fix.log`
- Production build and Electron TypeScript build passed. The production bundle
  reports a large-chunk advisory; it is non-failing and unrelated to S728's
  accepted output criteria.
- Control Center tests passed 42/42; web release tests passed 10/10.
- Packaged Electron verification passed. Twelve export products validated
  (six formats/routes each produced identical button/menu bytes), three
  fail-closed save/path cases passed, offline reload and lifecycle checks
  passed, and renderer errors were zero. All generated import/export evidence
  is physically on C: under
  `C:\G04-CAD-Interchange\S728-integrated-gate-corrections\electron-release\`.
  Verification JSON SHA-256:
  `7E562F53BC89AC151BDB92A58885FC4497974941AB5A5D3C322F66F45A7FA3AC`.
- Production-build Chromium replay covered 73 configurations and 146 front/
  back faces across all seven recipes. It reported zero held/issue faces,
  invalid options or output identities, revision mismatches, colorway
  mismatches, callout target misses, label overlaps, or browser errors. Replay
  matrix SHA-256:
  `DEA5D7DE64FD5EF783B98CCB9E744030F250F4E4FAC4729D5E2DE5AEA2A44E14`.
- A separate actual-SVG text bounding-box audit across every named layer found
  zero overlapping text pairs in all seven recipes. Audit SHA-256:
  `1667FD501ECC1EFE4391BFAE32688043BBA8B12D8E1F12DB9C8704F8894A898E`.
- Manual review covered the current default front views for Tee, Fitted,
  Tank, and Skirt; current default and boundary outputs for Polo, Woven, and
  Trouser; and 250% views of ten option-sensitive faces. The actual current
  rendered outputs showed no crossed leaders, unreadable marker collisions,
  or browser errors. Rendered replay and review images remain under
  `C:\G04-CAD-Interchange\S728-integrated-gate-corrections\`.

## Exit state and next action

All S728 acceptance checks passed. EPIC-17, G04, and the goal remain In
Progress until final repository cleanup, PR review, safe merge, refreshed
origin/main ancestry, required deployment, and production end-to-end checks
are complete. No acceptance is reopened or weakened. The next action is to
finish the final candidate hygiene/release checklist and prepare the PR from
this verified branch.

Elapsed wall time from the recorded S728 start (2026-10-11 08:05:03 UTC) to
closeout was approximately 2 hours 13 minutes. Implementation and focused
verification were not separately timed in the inherited work log; the full
coverage run itself took 26 minutes 1.35 seconds. External-agent wait: 0
minutes. Maintainer-decision time during this slice: 0 minutes.
