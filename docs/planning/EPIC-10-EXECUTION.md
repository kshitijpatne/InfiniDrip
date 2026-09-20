# EPIC 10 — Quality and Adversarial Hardening

Status: **COMPLETE — Claude contribution reviewed; Codex repair, integration, and push verified at `c627ac5`**

## Baseline and objective

The execution baseline is the Codex-integrated EPIC 9 result descended from
Slice 130 (`241732e`). EPIC 10 adds only test or developer safeguards around
the existing production contracts. Its purpose is to make realistic invalid
inputs, serialization drift, geometry edge cases, surface-placement failures,
and recipe regressions reproducible without changing the drafting baseline.

Codex owns the scope, prompt, worktree, dependency decision, review of every
actual diff, any production fix, durable documentation, integration, merge,
and push. Claude Code CLI is an individual contributor only. It worked in a
separate branch/worktree, did not push or merge `main`, and did not edit
production geometry or release behavior.

The bounded oracle found a real self-intersecting seam-allowance CUT loop in
the default trouser back and in one extreme woven-shirt input. Codex separately
repaired that defect with a local concave-offset loop trim in
`src/render/allowance.ts`, added a production regression test, and reran the
legacy hash gate. This is a narrowly bounded defect repair, not a replacement
drafting engine or a new geometry source of truth.

## In scope

- Test-only or developer-only additions, including bounded seeded
  `fast-check` properties, permanent regression fixtures, test helpers, and
  narrowly named developer verification scripts.
- A test-only `@flatten-js/core` oracle where an independent comparison is
  justified over already-flattened loops. The oracle must not be imported by
  production code and must not replace the project’s geometry implementation.
- Surface-placement invariants, including transforms, anchors, bounds,
  edge-touch/resolution behavior, coverage/placement constraints, and
  immutability of source geometry where those contracts exist.
- Invalid-input guidance that remains truthful, raw, and actionable; tests
  must detect silent clamping or a guidance message that does not identify a
  correction.
- Deterministic serialization and round trips, old-save compatibility,
  hostile optional/stale fields, and stable rejection/recovery behavior.
- Geometry finiteness and deterministic repeated drafting/grading for all
  seven recipes: tee, darted tee (`fitted`), tank, polo, woven shirt, skirt,
  and trouser.
- Empty-placement export identity, including all eight legacy hashes, with no
  baseline movement.
- A permanent fixture for every regression found during the bounded
  adversarial run.

## Explicit non-goals

- No production geometry replacement, broad algorithm rewrite, tolerance change,
  or change to the current drafting baseline. A narrowly bounded Codex-owned
  repair discovered by the independent oracle is allowed only when it removes
  a real shipped defect, leaves the drafting source of truth intact, and passes
  the complete legacy/output gate.
- No production import of `fast-check` or `@flatten-js/core`.
- No weakened assertions, skipped tests, reduced coverage threshold, changed
  snapshot/hash baseline, or “fix” that merely clamps invalid inputs.
- No unrelated refactor, UI change, Electron/release change, dependency
  upgrade unrelated to the two named test-only libraries, or broad test-suite
  rewrite.
- No physical-fit, manufacturing, or production-readiness claim.

## Ownership, model, and handoff

Contributor: Claude Code CLI headless in a dedicated worktree and branch such
as `claude/epic-10-adversarial-hardening`. Model: the installed Claude Code
5-family Opus or Sonnet model appropriate for bounded test work, recorded in
the return packet. The contributor must use bounded seeds and run counts,
report every failing seed/path, and stop if a failure indicates a production
defect rather than weakening or bypassing the test.

Codex sends the handoff only after EPIC 9 package/lockfile work is integrated,
validates the worktree base, and reviews the actual branch diff with
`git diff <base>...<branch>`. Claude’s return is advisory until Codex reruns
the tests in the integration checkout and accepts each change.

## Slice plan

### Slice 140 — Test dependency and bounded property harness

Owner: Claude in its isolated worktree; Codex owns review. Add only the
approved dev dependencies (`fast-check` and, if used by a justified oracle,
`@flatten-js/core`) and test support for fixed seeds, bounded run budgets,
replayable failure paths, and deterministic fixture naming. Keep the lockfile
change limited to those test-only dependencies.

Acceptance: properties are deterministic, bounded, replayable from their
reported seed/path, and do not import test dependencies into a production
module. Existing tests and the eight hashes are untouched.

### Slice 141 — Persistence and guidance properties

Owner: Claude; Codex review and any production repair.

Cover deterministic serialization, save/load round trips, old supported save
versions, stale/malformed optional fields, and invalid inputs. Guidance must
preserve invalid-state truth, name the issue, and provide an actionable
correction. Tests must fail on silent clamping, nondeterministic key/order
output, or accidental loss of old-save compatibility.

Acceptance: each supported old-save fixture has an explicit expected outcome;
serialized output is byte-stable for equal state; invalid guidance is
actionable; every discovered regression becomes a named fixture.

### Slice 142 — Geometry finiteness and seven-recipe properties

Owner: Claude; Codex reviews any claim that a failure is a test defect.

Generate domain-aware valid and invalid inputs within bounded ranges and run
the existing pipeline for tee, darted tee, tank, polo, woven shirt, skirt, and
trouser. Check finite coordinates, finite measurements, stable recipe
registration, deterministic repeated draft/grade behavior, and valid
interface/stitch references where those are part of the current contract.

Acceptance: no generated accepted case produces `NaN`, `Infinity`, or missing
required references; invalid cases remain invalid with guidance; all seven
recipe identifiers are explicitly exercised; no production output is
silently normalized to make a property pass.

### Slice 143 — Surface invariants and independent oracle

Owner: Claude in isolation; Codex decides whether each oracle comparison is
justified.

Exercise surface placement transforms, anchor/bounds behavior, edge-touch and
resolution constraints, placement coverage, and source-geometry immutability.
Use `@flatten-js/core` only as an independent, test-only oracle on already
flattened loops, with explicit tolerance and disagreement diagnostics. Include
concave, touching, collinear, tiny-edge, self-crossing, and tolerance-boundary
fixtures where the existing flattened-loop contract makes them meaningful.

Acceptance: invariant failures identify the input and seed; oracle cases are
small, bounded, and independently interpreted; disagreements are investigated
and recorded rather than hidden; the two discovered concave-offset defects were
fixed in the Codex checkout and converted to ordinary permanent regression
assertions; production modules have no oracle import.

### Slice 144 — Permanent fixtures and final audit

Owner: Claude prepares the candidate changes; Codex is final reviewer and
integrator.

Turn every relevant discovered failure into a permanent fixture, rerun empty
placement exports and all eight legacy hashes, run the complete serial gate,
and return a concise evidence packet. Remove only genuinely duplicate or
unjustified property cases; do not hide flakes by changing the baseline or
loosening assertions.

Acceptance: the final suite is bounded and deterministic, every property
reports seed/run information, all seven recipes and old-save fixtures are
represented, empty-placement identity remains byte-for-byte unchanged, and
coverage/typecheck/build/parsed-output gates pass.

### Slice 145 — Codex repair of oracle-discovered CUT-loop defects

Owner: Codex. The independent oracle showed that the existing line-offset
construction could fold an outward concave offset back across itself. Codex
added a local segment-intersection cleanup that removes only the inward loop
between crossing offset segments. It does not replace drafting, sampling,
export writers, or the oracle, and it leaves the eight legacy hashes unchanged.

Acceptance: the shipped default trouser back and the replayed woven-shirt
fixture are simple polygons under the test-only oracle; finite geometry,
parsed outputs, all existing tests, and coverage remain green.

### Slice 146 — Codex final integration gate

Owner: Codex. Inspect the full Claude diff and Codex repair, integrate only the
reviewed test/developer additions and the bounded repair, update durable state,
run the complete serial/coverage/build/package/release gate, and push the
result to `origin/main`. This slice completed when Codex verified the remote
ref at `c627ac5`; Slice 147 records the final documentation-only state.

## Verification commands and required evidence

Claude must run commands serially and return exact output locations:

```text
npm test
npm run coverage
npx tsc --noEmit
npm run build
npm run electron:build-main
npm run electron:verify-release
git diff --check
```

Codex reruns the same commands from the integrated checkout, plus the
existing parsed-output suites and the complete EPIC 9 packaged gate. The
return packet must include:

- dependency names/versions and confirmation they are dev-only;
- every property’s fixed seed, run bound, replay command, and final result;
- old-save fixture names and expected compatibility outcomes;
- all seven recipe identifiers and geometry-finiteness results;
- surface invariant and oracle fixture names, tolerances, and any
  investigated disagreements;
- permanent regression-fixture paths;
- empty-placement output identity and all eight unchanged legacy hashes;
- `git diff --check`, coverage, typecheck, production build, and parsed-output
  results;
- a statement that no production geometry, baseline, release behavior, or
  unsupported physical claim changed, except for the separately documented
  bounded concave-offset defect repair that preserves all eight legacy hashes.

## Safe parallel boundaries

- Claude uses a separate worktree and branch rooted at the exact Codex commit
  named in the handoff. It never edits the Codex checkout.
- Claude may edit test files, test-only helpers/fixtures, the package manifest
  and lockfile only for the two approved dev dependencies, narrowly assigned
  developer scripts, and this epic’s evidence notes. It may not edit
  production geometry, export implementations, Electron files, baseline
  hashes, or unrelated docs.
- Codex may implement a production fix only in the Codex checkout after
  reviewing a failing test. Any resulting behavior change gets its own
  bounded slice and full regression gate; Claude does not amend that fix. The
  Slice 145 concave-offset repair is the recorded example.
- EPIC 7’s OpenCode nesting-intelligence implementation remains independent and
  cannot be used to smuggle implementation changes into this branch.

## Exact Claude handoff prompt

```text
You are the isolated Claude Code CLI contributor for EPIC 10 Quality and
Adversarial Hardening in InfiniDrip. Work only in the supplied worktree and
branch. Do not push, merge, rebase the Codex branch, or edit the Codex
checkout.

Read AGENTS.md, CONTEXT-INDEX.md, PROJECT-STATE.md, ARCHITECTURE.md,
docs/PROJECT-DECISIONS.md, docs/OPENCODE-WORKFLOW.md,
docs/planning/EPIC-10-EXECUTION.md, and the exact handoff base commit. Add
only bounded test/developer coverage. Use fixed seeded fast-check properties
with explicit run limits. Use @flatten-js/core only as a test-only oracle on
already-flattened loops when justified. Cover surface-placement invariants,
invalid actionable guidance, deterministic serialization, old-save
compatibility, geometry finiteness, all seven recipes, empty-placement export
identity, and permanent regression fixtures.

Do not replace production geometry, change baselines, weaken tests, add
production imports of test libraries, edit Electron/release behavior, or make
unrelated refactors. If a test exposes a real production defect, stop at a
minimal reproducer and report it for Codex; do not change production code to
make the test pass.

Run the bounded suite serially and return JSON with: base commit, branch,
model, changed files, dependency changes, tests/commands, seeds and run
bounds, fixtures, all seven recipe results, eight-hash result, coverage,
typecheck, build, parsed-output result, diff-check result, and blockers.
Codex will inspect the actual diff and rerun every gate before integration.
```

## Final exit criteria

EPIC 10 is complete: Codex inspected and accepted the isolated Claude diff,
fixed and reviewed the oracle-discovered production issue separately, integrated
all required test-only coverage and permanent fixtures, passed the full
repository and EPIC 9 release gates, preserved all eight legacy hashes,
recorded the evidence in durable docs, and alone merged and pushed the
integrated result to `origin/main` at `c627ac5`.
