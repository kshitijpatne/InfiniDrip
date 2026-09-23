# Phase 2 — repository and newcomer audit

_First-pass audit completed 2026-09-22. No files were deleted, history was not
rewritten, and the README/architecture rewrites are deliberately deferred to
Phase 5._

## Scope and snapshot

The audit followed `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, and
`docs/PROJECT-DECISIONS.md`. Claude independently pressure-tested
`README.md` and `ARCHITECTURE.md` as a reader with no coding or fashion
background. OpenCode independently inventoried tracked files and history;
Codex verified the findings against this checkout.

At the Slice 187 base (`b74ff80`), Git reports 344 tracked files: 211 under
`src/`, 76 under `docs/`, 34 under `ops/`, seven under `electron/`, and the
remaining root configuration and project guidance. No tracked build output,
coverage report, log, temporary file, or binary artwork library was found.
The existing untracked `coverage-p1.log`, `p1-focused.log`, and `tmp/` in the
primary checkout are user-owned and were left untouched.

## Repository inventory and cleanup proposal

| Classification | Evidence | Disposition |
| --- | --- | --- |
| Required source and test inputs | `src/`, `electron/`, `ops/`, `package.json`, lockfile, and Vite/Vitest/TypeScript configuration are tracked; tests sit with the features they verify. | Keep. |
| Durable product and project evidence | `docs/` contains current decisions, planning, research, release evidence, and historical records. `ops/control-center/data/board.json` is the canonical delivery-board state. | Keep. Treat `docs/archive/` as historical evidence, not current instructions. |
| Superseded but intentionally retained | `apparel_design_resources.md` identifies itself as superseded; `CONTEXT-INDEX.md` and `docs/research/ASSET-RESOURCES.md` say it is retained for provenance. | Keep unless the maintainer separately changes that decision. |
| Generated/local output | `.gitignore` excludes `node_modules/`, `dist/`, `dist-electron/`, root `release/`, `coverage/`, `.vite/`, and the generated web artifact manifest. None is tracked. | No repository cleanup needed for these outputs. Preserve any local files. |
| Possible de-tracking candidate | `docs/archive/RESUME-LOG.md` is described by `CONTEXT-INDEX.md` as a personal proof/resume staging record, not current project status or implementation instructions. It is referenced by `PROJECT-STATE.md`, `docs/planning/ROADMAP.md`, `docs/planning/SLICES-BRIEF.md`, and the archived handoff. | Do not remove in this first pass. If the maintainer wants it out of the current tree, first decide how to repair those references; the Git history would remain unless separately authorized. |
| Optional local-tooling configuration | `.claude/launch.json` contains local Vite attach/run launch presets. Its adding commit explicitly describes it as a dev-server preview config; the presets are not required by build or tests. | No removal proposed: it is an intentional convenience, and its use by local tooling outside the repository is unknown. |

No high-confidence accidental or generated tracked file was found. The
personal `RESUME-LOG.md` is retained as historical supporting documentation;
no exact removal was authorized, so no files were deleted. A later request to
de-track it should repair its current references in the same change; this would
not erase its content from earlier Git history.

## Historical slice-number check

**Can duplicate historical slice numbers be corrected while preserving the
file tree of every rewritten commit? Yes, technically.** Rewording commit
subjects alone can keep each commit's tree unchanged, but changes the rewritten
commit IDs and descendant IDs and invalidates signatures; shared refs/clones
would also be disrupted. The available history contains 24 duplicated numeric
slice groups (including 22, 119, 125, 134, 161, 162, 169, 170, 173, and 175).
No history was rewritten: the approved Phase 2 plan and repository workflow
require explicit authorization for that operation. New commits continue with
one unique, monotonically increasing slice number; Slice 187 is the current
maximum at this audit boundary.

## Newcomer pressure test

### What reads clearly already

Both documents explain the five stages, the broad path from measurements and
choices to shared pattern geometry and exports, the local-only boundary, and
the fact that digital checks do not establish physical fit or production
readiness. They also distinguish the project Control Center from a user
workspace. Those points agree with the current project decisions.

### Misunderstandings to address before the later rewrite

1. **Who is the app for?** The README describes capability but not its intended
   audience. The older `docs/planning/MVP-PLAN.md` says customer confirmation is
   still needed and only implies indie makers/home sewers. Do not turn that
   implication into a confirmed product decision without maintainer input.
2. **Fashion and implementation vocabulary.** A reader may not know “grading,”
   “size run,” “recipe,” “components/blocks,” or “nesting,” and the internal
   name `nestPieces`; output labels such as A0 and tech pack also need plain
   explanations. Define or replace these terms in newcomer-facing prose.
3. **Epic 8 status and scope.** The README omits Epic 8, leaving an unexplained
   numbering gap. The architecture guide and authoritative records define it
   as a completed proof-only/no-go result, not unfinished clone development.
   Any reconsideration is a bounded helper/adapter proof around an external
   solver, not a clone or fork; runtime use remains unadmitted. Keep this
   distinction consistent in the later rewrite.
4. **Where to start next.** Both guides point broadly to `docs/planning/` but do
   not link the actual active sequence,
   `docs/planning/PRE-GARMENT-EXECUTION.md`.
5. **Who is “the maintainer”?** The term is used as a gate without a plain
   explanation of the role. The later rewrite should explain the role without
   inventing a new organization or permission system.
6. **Welcome versus tutorial.** `ARCHITECTURE.md` describes a compact first-load
   welcome, while the approved plan says a replayable, field-by-field tutorial
   is still future work. Later wording and the implementation should make that
   distinction precise; the actual first-load experience still needs live
   verification.

The audience choice is the only product-positioning ambiguity found. The
remaining findings can be resolved with plain language and verified product
facts during Phase 5, after the tutorial matches the product. No edits to
`README.md` or `ARCHITECTURE.md` were made during this audit.

### Audience finding resolution — 2026-09-22

The maintainer later confirmed that the intended audience includes both home
sewists and DIY makers, and independent designers and patternmakers. This
decision is recorded in `docs/PROJECT-DECISIONS.md` and reflected in the
newcomer-facing guides. It resolves the audience ambiguity without claiming
that either group has completed a user study.

## Review boundary

The read-only audit is complete and accepted without cleanup or history
rewrites. The `RESUME-LOG.md` candidate remains tracked under the
non-destructive default; no later removal is implied. Phase 3 is now active:
research and specify the first-load tutorial before implementation.

The review packet was linked to the Phase 2 board item at board revision 19;
the item was subsequently accepted as `Done` at revision 20 with closure
transition evidence. Separate closure evidence `E-PREQUEUE-PHASE2-CLOSURE`
records the non-destructive disposition at revision 24. The Phase 3 item
reached `In Progress` at revision 23.
`npm run control-center:test` passed 25/25 tests, and `git diff --check`
passed. No application source or export baseline was changed.
