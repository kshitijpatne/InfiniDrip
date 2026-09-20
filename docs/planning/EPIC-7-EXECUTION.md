# EPIC 7 — Independent Post-Epic-6 Evidence Audit

_Status: scoped by Codex on the Slice 130 baseline. This is a separate,
OpenCode-owned workstream. It is not part of the active Epic 9–10 completion
goal and it must not edit the Codex checkout._

## Purpose and starting point

Epic 6 closed at Slice 130. The current approved baseline is
`origin/main` at `241732e` (`Slice 130: record verified origin baseline`). The
older `bc7ae73` reference is superseded by that accepted Slice 130 tip and is
not an Epic 7 base.

The repository has no earlier durable definition of Epic 7. To avoid inventing
product behavior, this Epic is deliberately an independent evidence and
decision packet: OpenCode audits the current product against its durable
contracts, reports reproducible findings, and proposes bounded follow-up work.
It does not implement those follow-ups.

## Ownership and model assignment

- **Owner:** OpenCode CLI, controlled by Codex under `docs/OPENCODE-WORKFLOW.md`.
- **Codex authority:** Codex owns the handoff, branch/worktree setup, review of
  the actual diff and evidence, acceptance/rejection, and any later fix or merge.
- **Recommended model:** `opencode/muse-spark-1.3-contributor-free`, or the
  maintainer-approved current OpenCode equivalent if that identifier is no
  longer available.
- **Reasoning:** default/low-intensity for inspection and evidence collection;
  no speculative design work.
- **Branch/worktree:** `opencode/epic-7-evidence-audit` in its own worktree,
  created from the immutable Slice 130 baseline.
- **Push/merge:** OpenCode must not push, merge, or modify `main`.

## Scope

OpenCode must perform a read-only, evidence-backed audit of:

1. The seven registered recipes (`tee`, `fitted`, `tank`, `polo`,
   `woven-shirt`, `skirt`, and `trouser`) across the existing Pattern, Body,
   Style, Check, Export, save/recovery, and responsive surfaces.
2. The six existing export paths (SVG, DXF, tiled PDF, A0 PDF, Projector SVG,
   and Tech Pack), including parsed output and the eight legacy hashes.
3. The Slice 130 surface-placement boundary: valid entries, invalid entries,
   warn-only guidance, correction targets, save/recovery behavior, and the
   documented digital cut-box-centre anchor.
4. The durable context for stale claims, missing acceptance evidence, scope
   collisions, and prohibited physical-fit or production-readiness language.
5. The open-source audit's accepted boundaries for developer-only testing and
   geometry oracles. Do not recommend a runtime geometry replacement.

Every finding must be classified as one of:

- **reproducible defect** — a minimal reproduction and observed output exist;
- **evidence gap** — a required check has not been run or recorded;
- **documentation drift** — a durable claim no longer matches code or evidence;
- **deferred/product decision** — not actionable without maintainer authority;
- **no finding** — the current contract is supported by inspected evidence.

The report must distinguish sourced facts, repository observations, estimates,
and recommendations. It must not turn a digital check into a physical-fit,
sewability, manufacturing, or production-readiness claim.

## Slice plan

These slices are reserved for the independent workstream. Codex may reorder or
stop them after review, but OpenCode must keep each return packet bounded.

### Slice 132 — Baseline and audit matrix

**Scope:** record the exact base commit and create a matrix of the seven
recipes, six exports, surface states, persistence states, responsive widths, and
required evidence. Inspect the current code and durable documents before making
any recommendation.

**Owner/model:** OpenCode / `opencode/muse-spark-1.3-contributor-free`.

**Acceptance criteria:** the matrix names the exact command or live action,
expected result, actual result, and evidence path; no implementation change is
made; no test or baseline is weakened.

**Non-goals:** no source, test, package manifest, lockfile, Electron, export,
geometry, or durable-context edits.

### Slice 133 — Independent rendered and parsed audit

**Scope:** run the audit matrix against the real mounted app and real generated
outputs. Exercise valid and invalid surface placements, save/load and recovery,
all seven recipes, all six export kinds, and the existing responsive matrix.

**Acceptance criteria:** findings contain exact reproduction steps, screenshots
or parsed measurements where relevant, console diagnostics, output filenames,
and hashes/counts; an empty-placement run records all eight legacy hashes.

**Non-goals:** no fixes, no output-baseline movement, no package/build changes,
no cross-OS claim, and no physical validation.

### Slice 134 — Return packet and bounded recommendations

**Scope:** write one report at `docs/research/EPIC-7-AUDIT.md` containing the
matrix, findings, evidence inventory, limitations, and at most five prioritized
follow-up recommendations. Recommendations must name the affected contract,
owner, dependency, and a stop condition.

**Acceptance criteria:** the report is internally consistent with the actual
checkout; every claimed pass has a command or rendered/output artifact; every
unverified item is labelled unknown; `git diff --check` passes.

**Non-goals:** no implementation of recommendations and no edits to the Epic 9
or Epic 10 execution documents.

## Required verification commands

Run from the isolated worktree, using serial Vitest execution when host
contention makes the parallel run unreliable:

```powershell
git rev-parse HEAD
git status --short --branch
npm test -- --maxWorkers=1 --minWorkers=1
npm run coverage -- --maxWorkers=1 --minWorkers=1
npx tsc --noEmit
npm run build
git diff --check
```

The report must also name the exact focused parsed-output and live-browser
commands used. OpenCode must not claim a command was run when it only inspected
an older execution record.

## Required rendered/output evidence

- Real mounted-app observations for all seven recipes, including a valid and an
  invalid surface-placement case.
- Parsed SVG, DXF, tiled PDF, A0 PDF, Projector SVG, and Tech Pack evidence.
- Eight unchanged legacy hashes with empty placement state.
- Save/load and unfinished-recovery evidence, including invalid raw values and
  explicit discard/recovery behavior.
- Responsive checks at 1280, 900, 700, 560, and 390 px where the current
  contract applies, plus a clean browser console.
- A report of unsupported platform checks rather than an inferred cross-OS pass.

## Safe parallel boundary

Epic 7 is safe to run in parallel with Codex work only from its own worktree.
OpenCode may add only `docs/research/EPIC-7-AUDIT.md` after Slice 132's matrix
is accepted. It must not modify:

- `src/**`, `electron/**`, `package.json`, `package-lock.json`, `vite.config.ts`,
  or any generated release artifact;
- `docs/planning/EPIC-9-EXECUTION.md`, `docs/planning/EPIC-10-EXECUTION.md`,
  `PROJECT-STATE.md`, `ARCHITECTURE.md`, `ROADMAP.md`, or `CONTEXT-INDEX.md`;
- export baselines, coverage thresholds, test commands, or governance rules.

Codex integrates only the report, after inspecting its actual diff and evidence.
If the audit discovers a product defect, OpenCode reports it and stops at the
boundary; Codex decides whether a separately scoped fix belongs in Epic 9,
Epic 10, or a later Epic.

## Exact OpenCode handoff prompt

> Work only in a new worktree from `origin/main` at `241732e`, on branch
> `opencode/epic-7-evidence-audit`. Read `AGENTS.md`, `CONTEXT-INDEX.md`,
> `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`,
> `docs/OPENCODE-WORKFLOW.md`, `docs/planning/ROADMAP.md`,
> `docs/research/DESKTOP-RELEASE-RESEARCH.md`, and this execution document.
> Perform the three bounded slices exactly as written. Inspect actual code,
> rendered UI, and parsed outputs. Do not implement fixes. Do not modify source,
> tests, Electron, package manifests, lockfiles, baselines, or Codex planning
> documents. Add only `docs/research/EPIC-7-AUDIT.md` after the matrix is
> complete. Report uncertainty instead of inferring evidence. Return the JSON
> packet below and include the exact commands, artifact paths, hashes, and live
> observations used.

## Required return JSON

```json
{
  "status": "complete|blocked|needs_follow_up",
  "summary": "...",
  "branch": "opencode/epic-7-evidence-audit",
  "changed_files": ["docs/research/EPIC-7-AUDIT.md"],
  "tests_run": [],
  "coverage": "...",
  "build_and_typecheck": "...",
  "rendered_or_export_evidence": [],
  "known_limitations": [],
  "follow_up_needed": []
}
```

The JSON is a report, not acceptance. Codex must verify the actual worktree,
diff, commands, artifacts, and every finding before promoting anything.
