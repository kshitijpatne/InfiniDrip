# EPIC 8 — True-Shape Nesting Proof and Controlled Redesign

Status: **SLICE 162 COMPLETE AS A PROOF-CONTRACT / NO-RUNTIME-ADMISSION
DECISION. A SOLVER, WASM OR RUNTIME DEPENDENCY REMAINS UNAUTHORIZED.**

Owner: **Codex**. OpenCode or Claude Code may assist only with isolated,
bounded benchmark/documentation work under `docs/OPENCODE-WORKFLOW.md`.
Codex owns the contract, constraint semantics, adapter/worker boundary, actual
diff review, repairs, integration and any push to `origin/main`.

Research authority: `docs/research/NESTING-REDESIGN-RESEARCH.md` and the
deferred-nesting section of `docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md`.

This packet scopes a proof and controlled redesign. It does **not** authorize a
new runtime dependency, production adoption, changed export baseline, or a
claim that the current application produces a production marker.

## Objective and product value

Give InfiniDrip a defensible path to reduce conservative bounding-box waste for
concave garment pieces without losing the current application's honesty,
offline behavior, deterministic fallback, typed geometry, or export contracts.

The candidate path is an isolated Sparrow/Jagua proof that receives
InfiniDrip-owned flattened loops and apparel constraints, returns a fixed-seed
candidate transform set, and is then checked by InfiniDrip's own validator. The
current shelf packer remains the default and fallback unless every admission
gate passes and the maintainer explicitly promotes the result.

## Classification

- **Primary:** redesign of the existing nesting strategy behind a compatibility
  boundary.
- **Secondary:** opt-in addition only if the proof earns a user-facing mode.
- **Not:** a drafting rewrite, new garment Epic, production-marker claim, or
  license-free import of an external geometry engine.

## Start gate

Before implementation begins:

1. Rebase from the current `origin/main`; Epic 7's reviewed integration at
   `db14b63` must remain an ancestor. Do not use the stale pre-Epic-7 baseline.
2. Decide whether Epic 8 is being run after Epic 11 or in an isolated parallel
   worktree. If Epic 11 changes Polo geometry before promotion, rerun the full
   corpus against the merged geometry.
3. The checkout must have no unrelated changes in the intended files.
4. The exact Sparrow, Sparrow Studio, Jagua-RS and generated WASM revisions must
   be pinned and their full dependency/license/notice tree recorded.
5. Product/engineering must accept the fold, quantity, grain/nap, mirror and
   multi-material contract or explicitly narrow the supported proof subset.
6. The baseline gate must pass before any adapter or worker is admitted.

## Fixed product and architecture decisions

1. `nestPieces` remains the default and unconditional fallback.
2. The external solver receives only a versioned, InfiniDrip-owned instance and
   returns only candidate transforms, seed and diagnostics. It never becomes a
   drafting or annotation source of truth.
3. InfiniDrip re-applies transforms to the original cut/sew loops and validates
   finiteness, closedness, overlap, bounds, clearance, grain, fold, nap,
   quantity, pair/mirror and identity rules before accepting a result.
4. Unsupported or unknown apparel semantics reject the candidate visibly and
   fall back; no silent clamping, mirroring, unfolding or rotation is allowed.
5. Proof slices do not change the UI, save schema, exports or legacy bytes.
   Any later opt-in UI must display engine mode, seed, and fallback reason.
6. A candidate layout is never evidence of physical fit, sewability,
   manufacturing readiness or guaranteed material savings.

## Provisional slice plan

Slice numbers are provisional and assume Epic 11's reserved `155–161` range
remains ahead of this Epic. The product owner may reschedule the Epic, but the
dependency and integration boundaries do not change.

### Slice 162 — constraint and legal admission contract

Define the versioned nesting instance, solver result, transform, diagnostic and
fallback types. Resolve the supported physical quantity/fold representation for
the current recipes; identify unsupported cases. Pin exact upstream revisions,
licenses, notices, artifact provenance and offline rebuild expectations.

Acceptance: no unresolved legality or fold/quantity ambiguity is hidden in the
adapter; contract tests cover empty, malformed, unknown and valid instances.

Non-goals: no solver invocation, UI, production dependency, export change or
new recipe metadata without a consumer.

Owner/model: Codex; Sol-high for contract/legal-boundary review, Luna-max for
mechanical fixture work.

### Slice 163 — owned flattening and solver adapter proof

**Blocked by Slice 162 runtime-admission gates.** The original scope cannot
start until a separate artifact-and-worker reproducibility packet supplies the
owned lockfile, full notice/source plan, offline build provenance and contained
worker evidence recorded in `docs/research/EPIC-8-SLICE-162-ADMISSION.md`.

Convert eligible `FlatPiece` cut/sew loops into the pinned solver input without
mutating source pieces. Preserve role/name/size identity and explicit grain,
fold, nap, pair and quantity metadata. Capture the solver's seed, transforms,
time limit and raw diagnostics without treating solver geometry as truth.

Acceptance: round-trips are deterministic; unsupported pieces are rejected with
reasons; input immutability and identity mapping are proven.

Non-goals: no call from `nestPieces`, no default behavior change, no UI or
export writer wiring.

Owner/model: Codex; Sol-high for geometry/constraint boundary, Luna-max for
fixture and serialization coverage.

### Slice 164 — isolated worker and timeout/fallback harness

Run the candidate offline in a disposable or isolated Rust/WASM worker with a
fixed seed, bounded time and cancellation. Record worker errors, malformed
responses, timeout behavior, memory observations and deterministic replay.

Acceptance: the current shelf result is returned on every failure path; the
worker cannot block the UI thread or write outside its owned boundary; a clean
offline supported-host run is reproducible.

Non-goals: no packaged production adoption, no auto-update/network service, no
solver-controlled export.

Owner/model: Codex; Sol-high for worker isolation, legal/artifact and failure
review. A contributor may run bounded harness work only from a Codex packet.

### Slice 165 — exact apparel placement validator

Apply candidate transforms to the original typed loops and validate closed
finite geometry, bounds, overlap, minimum separation, grain/nap, fold-edge,
mirror/pair, quantity and identity rules. Keep the shelf packer as the trusted
comparison and fallback result.

Acceptance: adversarial fixtures reject every invalid transform class; valid
fixtures preserve labels, cut/sew correspondence and marks; flattening and
tolerance boundaries are explicit and deterministic.

Non-goals: no alternate drafting geometry, no automatic repair by clamping or
moving an invalid result.

Owner/model: Codex; Sol-high only for the geometry oracle/validator contract,
Luna-max for repetitive fixture expansion.

### Slice 166 — seven-recipe benchmark and promotion decision

Compare the candidate and shelf baseline across all seven current recipes,
single-size and graded marker scopes, narrow/default/wide fabrics, concave and
fold pieces, duplicate quantities, directional/nap mode, maximum clearance,
invalid inputs, and timeout/failure paths. Measure length, utilization, runtime,
memory, replay identity and fallback frequency.

Acceptance: a reproducible report contains raw inputs, seeds, outputs, checksums,
host/toolchain, and all failed cases. Provisional promotion requires zero
validator failures/regressions, fixed-seed identity, median length reduction of
at least 5% or a maintainer-approved exception, p95 worker time <=5 seconds for
selected-size and <=15 seconds for graded-marker cases, bounded memory, and no
legacy-hash movement.

Non-goals: no cherry-picked “best” examples, no hiding regressions, no physical
material-savings claim.

Owner/model: Codex; Luna-max for matrix execution, Sol-high for anomalies and
the go/no-go decision.

### Slice 167 — optional user-facing mode (conditional)

Only if Slice 166 earns promotion, add a clearly labelled opt-in true-shape
mode around the existing nesting view. Show solver/baseline mode, seed,
constraints, candidate/fallback status and honest limitations. Preserve the
existing mode as a one-click fallback and keep invalid input visible.

Acceptance: mounted UI is responsive; every unsupported/failure state explains
the fallback; old saves load unchanged; no export or baseline changes occur
without a separate approved contract.

Non-goals: no default switch, no export adoption, no production marker label.

Owner/model: Codex; Luna-max for mechanical UI wiring after a short Sol-high
contract review.

### Slice 168 — controlled downstream/export decision (conditional)

If and only if the maintainer approves export use after the benchmark, define
how candidate transforms preserve cut/sew geometry, marks, folds, labels,
calibration and format-specific constraints. Re-run every parsed consumer and
legacy hash gate. Otherwise record a proof-only exit and do not touch writers.

Acceptance: no transformed output reaches a writer without owned validation;
all formats parse; fallback and cancellation remain recoverable; any baseline
change has a separate written decision.

Non-goals: no automatic multi-bolt allocation, hole nesting, machine toolpaths,
or cross-OS performance claim.

Owner/model: Codex; Sol-high for the contract and output review.

### Slice 169 — Epic 8 exit and durable handoff

Choose exactly one outcome: proof-only/no-go, opt-in planning mode, or approved
downstream integration. Record the evidence, exact revisions/licenses, corpus,
seeds, timings, failure matrix, limitations and the next safe roadmap lane.
Update the state, architecture, decisions and roadmap records. Codex alone may
commit and push a promoted result.

Acceptance: no unresolved P0 defect, stale status or contradictory scope;
100%-coverage/typecheck/build gates pass for any repository code; parsed-output
and hash gates pass when affected; no physical or production claim is made.

Owner/model: Codex; Sol-high for final review, Luna-max for repeatable gates.

## Expected file boundary

The proof should initially be additive and isolated, using new contract,
adapter, validator, worker/harness and fixture files under `src/export/` or an
explicit worker boundary. Existing `src/export/nesting.ts`, `marker.ts`,
writers, UI, persistence and Electron packaging remain untouched until an
admission decision requires them. Any shared primitive change requires a
before/after consumer audit and a new written decision.

## Permanent exit gates

- 100% statements, branches, functions and lines for repository code;
- TypeScript and production build pass;
- fixed-seed replay is byte-identical for accepted candidate transforms;
- owned placement validation passes and rejects malformed/unsupported cases;
- all seven recipes and both nesting scopes are represented in the benchmark;
- timeout, cancellation, malformed output, offline and package paths are tested;
- current shelf packing remains the deterministic fallback;
- parsed outputs and all eight protected legacy hashes remain unchanged unless a
  separate baseline decision is approved; and
- no physical-fit, production-marker, sewability, manufacturing or guaranteed
  material-saving claim is made.

## Return contract

Every slice returns the exact commit, changed files, focused/full gate results,
benchmark artifacts, legal/revision record, fallback evidence, baseline status,
known limitations and a statement that no contributor pushed `main`. Codex
reviews the actual diff and evidence before accepting the next slice.

