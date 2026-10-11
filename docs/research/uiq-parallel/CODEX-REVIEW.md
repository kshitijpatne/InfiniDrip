# UIQ-02 / UIQ-05 isolated candidate review

Status: **Both isolated local-web candidates independently accepted; board421 children Done.** This report accepts no
production rollout, app wiring, numbered Epic, merge/push/deployment or physical
claim. Admission is `docs/planning/UIQ-PARALLEL-ADMISSION.md`.

## Delivery and review

Both contributors returned explicit WORK FINISHED before their outputs were
inspected. Claude Sonnet5/high delivered foundation in its own worktree;
OpenCode Muse Spark1.3/xhigh/normal delivered artwork in its own worktree.
Neither committed, pushed, installed dependencies or edited existing product
files. Codex copied only their admitted files and reviewed the actual source,
CSS, tests and previews. A resumed read-only Luna audit inspected the original
artwork contributor snapshot; it is additional evidence, not acceptance of the
later corrected root candidate.

| Finding | Disposition and proof |
|---|---|
| Foundation selectors could affect an unscoped lookalike;72% glass could lose contrast on white | Root-qualified selectors;88% glass; two independent regressions; native outside-sentinel browser comparison |
| Foundation preview omitted required selected/disclosure states | Medium selected, native disclosure with44px/focus styling; keyboard/media/target browser assertions |
| Controlled artwork selection removed keyboard focus and collapsed provenance | Update existing buttons/status only; preserve nodes, images and open details. Unit controlled-callback regression and real click/Enter/Space proof |
| Artwork grid could exceed a narrow containing track | `minmax(min(100%,280px),1fr)` and root border-box; actual card/grid and document width assertions at320/390/480/960/1440 |
| Same-origin image URL could target a non-bundled endpoint | Require exact existing bundler-resolved catalog URL in addition to HTTP(S), credentials and origin checks. Same-origin endpoint/query-redirect negatives; no endpoint request in browser log |
| Disposed and obsolete detached controls retained listeners | Separate abortable control/card listener lifetimes; abort obsolete cards on filtering and all listeners on disposal. Detached input/select/clear/image/button assertions prove inertness |
| Packaged Electron file URLs are rejected | Explicit integration hold, not a packaged-app pass. This admission verifies isolated local-web candidates only. File support must use exact trusted bundled URLs, not arbitrary file paths, and receive Electron verification under UIQ-GATE before desktop wiring. Current app is unchanged |
| Raw ordinary global gate discovers downloaded upstream test suites | Preserve original output. Do not install React/Next/upstream deps or move/delete research. Rerun all InfiniDrip tests with only the foreign research checkout path excluded; unchanged product/coverage/configuration required |

## Verified evidence so far

- Latest focused gate:61/61 (foundation28, artwork33),100% statements,
  branches, functions and lines for both new production modules. Earlier59/60
  counts are superseded snapshots, not the current acceptance count.
- Source and standalone preview TypeScript checks passed. Settled production
  build and preview check69198 exit0; normal pre-existing >500KB bundle advisory
  retained, no warning suppression. Build artifacts retain the unchanged
  production entry hashes; candidates are not imported by the live app.
- All49 operational tests passed, including34 Control Center tests, delivery
  proofs and readiness drill. Canonical local board413 tracks both children in
  Review. The active Epic17 board is never replaced or written.
- `evidence/browser-pressure-test.json`:18 asserted browser cases, zero failures,
  source hashes, all12 local images decoded, genuine trusted-image network
  failure, rejected remote/endpoint URLs, independent mounts, selection/filter/
  cleanup, no egress, keyboard, target/contrast, narrow/zoom-equivalent reflow,
  reduced-motion and forced-colors. Zoom-equivalent widths are not claimed as
  a measured browser zoom setting. Assertions are in
  `ops/ui-candidates/verify-candidates.mjs`, not inferred from script exit alone.
- In-app Chromium independently verified final endpoint fallback, literal
  hostile text, one-card long-text reflow (scroll375/client375), controlled
  selection focus and zero WCAG A/AA audit violations. Screenshots were visually
  inspected: no overlapping/clipped text, advisory caveats visible and focus
  contrast clear. Actual screenshots include `in-app-long-narrow.png`,
  `in-app-combined-desktop.png`, `foundation-desktop.png` and forced-colors PNGs.
-279 protected pre-existing product/asset/configuration files matched the
  admission SHA256 snapshot. Source/catalog/math/export/baseline/configuration
  changes remain prohibited. Protected export-identity tests passed9/9 during
  the first global attempt; final settled global proof still required.

## Global gate diagnostic history

**Superseded by the final result below.** Earlier failures/waits remain diagnostic history, not the current status.

At 2026-10-02 06:02 UTC, the exact one-worker full terminal **2056** remains running, with output in `evidence/full-coverage-one-worker.log`. Quiet output is not evidence of completion. Both child cards remain Review, not accepted. The subsequent root-only Luna remediation audit returned WORK FINISHED with no remaining bounded defect; it explicitly did not run or verify the full gate. No source/test/configuration changes were made during the settled run.

The original full coverage command98056 discovered foreign research suite
failures and was deliberately stopped, exit1, after validating its exact owned
Vitest PID55300/command. Only that test process tree was terminated; no files or
other task processes were removed. Its stdout diagnostics remain in
`evidence/full-coverage.log`; this was an aborted unsuccessful attempt, not a
completed product gate. Clean global command31370 ran with only
`tmp/ui-repo-sources/**` additionally excluded from test discovery; existing
ops/node_modules/.git exclusions, every product assertion, configured source
coverage and100% thresholds are unchanged. All operational tests run separately.
Clean global31370 completed134/135 suites,2090/2091 tests in1129.62s,
with one unchanged test exceeding its original5000ms timeout: Single/Marker
preview preference without dirty/undo history. No global coverage pass was
emitted. All135 expected application suites were discovered. Exact affected
test55253 then passed in1815ms with the same timeout and every assertion intact;
focused total7.52s, shell wall10.40s. No protected app/test/configuration change.

A same-workload scheduling comparison (the affected case plus Tee field and
all-garment nesting smoke, three actual tests) passed with both settings:
default39.08s /sampled peak working set1,534,029,824 bytes; one worker28.14s
/644,165,632 bytes. JSON results are `profile-default.json` and
`profile-one-worker.json`. Measurements sample the owned process tree once per
second, not an exact continuous allocation trace. This supports a one-worker
CLI scheduling retry, not a test timeout or configuration change. The ordinary
full run's main worker was observed above3GB RSS; no OOM is claimed. Repository
defaults are unchanged. The new full one-worker gate retains all135 suites,
all2091 tests, original timeouts/assertions and100% coverage thresholds.

## Final acceptance — 2026-10-02 06:26 UTC

Immutable exit proof: `CANDIDATE-EXIT.json`. Terminal2056 exited0:135/135 suites,
2091/2091 tests in1824.91s. Independently compared all135 discovered filenames
with the current repository-owned src test inventory; none omitted or foreign.
The export byte-identity suite passed9/9. Global coverage JSON independently
aggregates24582/24582 statements/lines,1483/1483 functions and11193/11193 branches:
100% each, no skipped covered items. No source/test/configuration changes after
the settled run; CLI worker scheduling and foreign-research discovery exclusion
are not changes to assertions, timeouts, defaults, thresholds or baselines.

Final protected-file comparison:279/279 identical. All five browser source
hashes match the corrected root;18/18 rendered assertions pass,310 local
requests and5 local Vite sockets with zero external requests/sockets. Focused
61/61 and four-metric100%, source/preview TypeScript, settled build and49
operational tests pass. The successful broader gate supersedes the failed
default-worker run; its timeout, exact-test diagnosis and representative
memory/scheduling comparison remain recorded honestly above.

Codex attached the SHA256-bound verified exit proof and screenshot/review notes
through the validated board command layer, then reviewer-closed only
UIQ02-CANDIDATE and UIQ05-CANDIDATE at revision421. Both have null release IDs;
their delivered dates mean isolated acceptance only. Parent UIQ-02/UIQ-05 and
UIQ-GATE remain Backlog with null delivery/release. The additive18-command
packet is the handoff, never an old-board replacement. Accepted versions are
the corrected root hashes in CANDIDATE-EXIT.json, **not** the original contributor
worktree snapshots. No commit, numbered landing, main push, deployment, new
asset, dependency, or Epic17 write/interruption occurred.

Post-closure operational verification passed49/49 with zero skipped/cancelled
tests in1198.26ms; stdout is `evidence/operational-tests-final.log`. Documentation,
board and evidence-only updates do not invalidate the successful source gate.

## Integration handoff (not admitted here)

Parents UIQ-02/UIQ-05/UIQ-GATE remain unshipped. After settled merged Epic17,
obtain a separately admitted integration packet covering current main rebase,
fresh unique numbered slices, exact shared app ownership, feature-flag default
and old-path fallback, desktop file-asset policy, CSS/token conflicts, current
asset/catalog compatibility and the complete settled release gates. Do not
cherry-pick old board/context wholesale. Replay candidate records additively on
the newest lane board. No new dependency, asset acquisition, source rights
claim, telemetry, React migration, body snapshot or live design mutation is
part of these candidates.
