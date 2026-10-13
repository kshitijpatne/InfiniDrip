# Slice 776 start — UIQ-10 production-pack presentation

**Status:** Started 2026-10-13 06:26:33 UTC. **Owner:** Codex.
**Branch/worktree:** `codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.

## Verified checkpoint and authority

- Start from clean S775 commit
  `030d11b64f4e57877b5226bfcd2192e7db5aaf33` (`Slice 775: add
  revision-bound production-pack output`).
- Fresh `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor
  of the branch. Highest assigned slice is 775, so 776 is unique.
- The canonical Control Center board is revision 4625. EPIC-18 and G05-T04
  are In Progress; G05-T01/T02/T03 are Done; UIQ-10 is Backlog with verified
  S774 admission evidence; G05-T05 and G05-EXIT are Backlog.
- Parent scope is the admitted EPIC-18/G05 plan and active
  `docs/planning/EPIC-18-S765-RESEQUENCING.md`. This slice is separately
  authorized by `docs/planning/UIQ-10-ADMISSION.md`, after S775's actual
  revision-bound PDF/ZIP output, round-trip and rendered/file review.
- S775 exit evidence is in
  `docs/research/epic18/S775-T04-output-package/exit-packet.md`; its checked
  PDF/ZIP outputs and digests remain the reference inputs for this UI layer.
- The overall EPIC-18 goal remains active. This packet reserves S776 and does
  not restart EPIC-18 or admit any future Epic.

## Intended outcome and exact boundary

Present S775's existing production-pack model as readable, revision-bound
forms and tables. Add the three admitted section presets—Complete pack,
Materials + construction, and Measurements + QA—with per-section selection.
Keep identity/revision, source/open-items, and approval/disclaimer content
visible in every selection. Show approval state and field scope only when its
revision exactly matches the displayed committed revision. Preserve unknown,
unresolved, conflicting, estimated, and user-entered states with their source
labels and next actions; do not infer, normalize, clamp, hide, or turn them
into supplier or production acceptance.

The presentation must be read-only and consume the exact verified S775 output
model. It must not implement PDF/ZIP serialization, parse packages, write
storage, create revisions, change approval, or duplicate any T01/T02/T03
calculations. A missing, stale, mismatched, or failed output must show an
explicit unavailable/stale state and an actionable next step; it must never
leave an older pack presented as current. Mark synthetic Tee/Woven Shirt
fixtures as synthetic. Resolve artwork only from explicitly referenced local
assets and never fetch remote source URLs.

## Files and integration ownership

Only the files admitted by UIQ-10 are planned:

- Add `src/ui/tech-pack-presentation.ts` and
  `src/ui/tech-pack-presentation.test.ts` for pure read-only view-model/markup
  behavior.
- Add `src/ui/enhancements/tech-pack/tech-pack-presentation.css`, scoped to
  one presentation root class, and import it from `src/ui/view.ts`.
- Add a minimal named mount/section-selection adapter at the existing
  whole-run Tech Pack/output surface in `src/ui/app.ts`; add focused mounted
  coverage to `src/ui/app.test.ts`.
- Save actual file and viewport findings at
  `docs/research/epic18/S776-UIQ-10-presentation/rendered-review.md`.

Do not modify record schemas, T01/T02/T03 editors or validators,
`src/ui/style-revisions.ts`, project package/import paths, the S775 writer,
legacy `src/export/techpack.ts`, freeze/T05 behavior, recipes, grading,
protected output fixtures, dependencies, or unrelated UI enhancements. If the
S775 API cannot support this presentation within the admitted files, stop and
record the blocker for a separately numbered scope decision.

## Acceptance and required gates

1. Exercise safe empty/unavailable, all sections, each preset, custom section
   selection, unknown/unresolved/conflicting values, matching and mismatching
   approval scope, stale revision, output error, and stale asynchronous
   completion. Preserve keyboard operation and obvious focus order.
2. Focused tests cover every conditional/rendering branch. Each changed
   production module reaches 100% statement, branch, function, and line
   coverage. TypeScript passes.
3. Keep S775's Tee and Woven Shirt generated outputs as inputs. Inspect the
   actual rendered PDF and structured file content, then inspect the mounted
   UI in a real browser at 390×844 and 1280×800. Record selected sections,
   revision/digest match, approval wording, visible unknowns, table
   readability, keyboard/focus behavior, and no horizontal overflow, with
   screenshots/inspection evidence.
4. Re-run the protected export byte-identity regression; do not move a
   baseline. Run the focused Control Center suite after validated board replay
   and `git diff --check`. Do not run the global coverage suite or full
   integrated browser/Electron gate here; those stay at S780.
5. At S776 exit, link reviewed exit evidence to UIQ-10, G05-T04, and EPIC-18;
   keep UIQ-10 and G05-T04 In Progress until S777's final field/numeric and
   scoped-approval review passes.

## Risks, decisions, and delegation

- Blocking decisions: none. The S774 admission resolves presentation scope
  and S775 has proven the required output contract. No additional product
  decision is needed to start.
- Main implementation risks are accidentally showing a stale snapshot as
  current, resolving artwork through a remote URL, hiding unknown values when
  toggling sections, or implying approval for a different revision. Fail
  closed on identity mismatch and preserve the always-visible sections.
- No safe independent ownership exists: view semantics, section callback,
  revision invalidation, and actual-browser review are coupled. Codex retains
  implementation and integration review; no delegation is planned.
- No payment, supplier contact, new garment, physical sewing/fit, factory
  acceptance, compliance, or production-readiness work or claim is admitted.

## Time accounting

Start time is 2026-10-13 06:26:33 UTC. At the S776 boundary, record elapsed
implementation, focused verification/rendered review, external-agent wait,
and maintainer-decision time separately. External-agent and maintainer-decision
wait start at zero.
