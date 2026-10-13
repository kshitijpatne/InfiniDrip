# Slice 770 — T02 callout and size-run checks

**Status:** Complete. **Start:** 2026-10-13 02:15:23 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** `65032f5dba1272b6edc3a926d08a878126f8dbb3`
(`Slice 769: add revision-bound T02 sample and QA records`). Fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The hash-bound S770 start packet digest is
`9a1c4ad0064304f9f9f8c758f2086b67961c27010f6db82eea6f67fa69aa928d`.
The board was revision 4577 at exit preparation; validated evidence replay
will attach this packet to G05-T02 and EPIC-18 and close G05-T02.

## Scope and result

S770 completes the digital T02 callout and size-run checks for the seven
existing recipes. A recipe POM is linked only to a T02 definition with the
same exact display label. Missing and duplicate matches, unresolved or
conflicting source facts, malformed ranges, mismatched base sizes, sample
sizes outside a sourced range, invalid recipe sizes, and unavailable/non-finite
predictions remain visible with a correction or next action. Inputs are not
silently clamped, substituted, or rewritten.

The local project manager now evaluates the current T02 definition draft and
active recipe at render time. Custom one-size styles use the saved T01 base
size as their only T02 run step; an absent or blank ID shows an invalid empty
run instead of silently selecting another size. Pattern-generated per-size
values are displayed in a separate predictions table, not represented as
source-confirmed measurements or sample actuals. The T02 grade-rule field
contains only a source rule ID and version, not formula parameters, so this
slice checks references and size relationships but cannot verify external
grade arithmetic.

No T02 source definitions were entered into the isolated browser fixture. This
preserves the expected unresolved state and proves that render does not infer
source facts from recipe predictions. The fixture used a separate localhost
origin and storage from the user's application.

## Acceptance and verification

| Gate | Result |
|---|---|
| Focused tests | Pass: 45/45 across `tech-pack-t02-validation.test.ts` (12), `tech-pack-t02-editor.test.ts` (9), and `project-manager.test.ts` (24). The coverage run verifies all size-run fallback and invalid-result branches. |
| Changed production coverage | Pass: 100% statements, branches, functions, and lines in `tech-pack-t02-validation.ts`, `tech-pack-t02-editor.ts`, and `project-manager.ts`. |
| TypeScript | Pass: `npx tsc --noEmit --pretty false`. |
| Protected export identity | Pass: `npm run test -- src/quality/export-identity.test.ts`, 9/9. No protected export baseline moved. |
| Actual rendered behavior | Pass: live isolated Chrome render at `http://127.0.0.1:4193/`, after selecting and saving each recipe into a separate immutable local style revision. The T02 accessibility render shows `0/N` source-complete callouts and `size run needs action` for every recipe, exact-label corrective actions for each missing definition, the XS–XL run with M as base, and a prediction table explicitly separate from sample actuals and production sources. Visual screenshots were inspected for Darted Tee, Tank, and Trouser; the rendered accessibility state and prediction block were checked for all seven. |
| Recipe matrix | Pass: Tee 0/10; Darted Tee 0/11; Tank 0/7; Polo 0/21; Woven Shirt 0/10; Skirt 0/3; Trouser 0/17. All fixture definition sets remain empty, so no unsupported source-completeness claim appears. |
| Control Center and diff hygiene | Pending final validated evidence/status replay; then run `npm run control-center:test` and `git diff --check`. |
| Integrated/global/Electron/release gates | Not due; remain at the settled S780 candidate boundary. |

## Board and durable checkpoint

The validated S770 start replay advanced canonical board revision 4575→4577.
The exit replay will add `E-G05-S770-EXIT` to G05-T02 and EPIC-18, then mark
G05-T02 Done using the same verified exit evidence. EPIC-18 remains In
Progress; G05-T03 through G05-T05, G05-EXIT, and UIQ-10 remain Backlog.
Commands are:

- `docs/planning/EPIC-18-S770-EXIT-T02-BOARD-COMMAND.json`
- `docs/planning/EPIC-18-S770-EXIT-EPIC-BOARD-COMMAND.json`
- `docs/planning/EPIC-18-S770-EXIT-T02-STATUS-BOARD-COMMAND.json`

The packet digest will be replayed by the validated Control Center command
layer; board test assertions verify the packet bytes, both evidence links,
G05-T02's Done transition, and EPIC-18's continuing In Progress status.
`PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `ARCHITECTURE.md`, the active sequence,
and the goal ledger record this same checkpoint. The hash-bound S762 admission
and its maintainer-approved gates remain unchanged.

## Risks, holds, and elapsed time

No safe independent ownership split exists for the shared validator/editor
contract and all-recipe output; external-agent wait was 0 minutes. No
maintainer decision was required; decision wait was 0 minutes. Exact display
labels remain the only available POM join key. No formula payload exists for
the recorded grade-rule source, and no physical sample has been sewn or
fit-validated. Supplier/factory acceptance, standards conformance, and
production readiness remain unverified and are not claimed.

Elapsed time was about 30 minutes (02:15:23–02:45 UTC): approximately 13
minutes for implementation and render review, 17 minutes for focused
verification/diagnosis and durable closeout, 0 minutes waiting for an external
agent, and 0 minutes waiting for a maintainer decision. Two coverage runs
identified and then closed specific uncovered renderer, custom one-size, and
T01 fallback branches; the final focused gate passes at 100% in all four
metrics. No full repository gate or Epic build was run ahead of S780.

## Next action

Start S771 from the verified S770 commit and board boundary. Implement the
admitted T03 sourced operation records, explicit unknowns, component/BOM
integrity checks, and all-recipe rendered review; preserve local-first/no-cost
scope and all physical, supplier, and production-acceptance holds.
