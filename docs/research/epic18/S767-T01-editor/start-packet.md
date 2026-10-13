# Slice 767 — T01 editor and all-recipe propagation

**Status:** In Progress. **Start:** 2026-10-12 22:36:08 UTC. **Reserved
slice:** 767, unique after the landed S766 commit. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Starting
commit:** S766 `66379ae19dee15c72e5816c601f51c5b2d5463aa`; fresh fetch confirms
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor. The
worktree was clean at start. **Canonical board:** revision 4556; EPIC-18 and
G05-T01 are In Progress. G05-T02–T05, G05-EXIT and UIQ-10 remain Backlog;
UIQ-09 remains Backlog pending EPIC-19.

## Authority and exact boundary

This is the next ordered boundary in
`docs/planning/EPIC-18-S765-RESEQUENCING.md`. It executes S767's admitted T01
editor and propagation work after S766 established immutable payload-v2 T01
snapshots and strict historical payload-v1 compatibility. The hash-bound
S762 admission remains unchanged; the active S765 amendment moves the
originally planned editor from S766 to this S767 boundary.

Implement one local editor against the frozen `TechPackRecord` schema for all
seven supported recipes: Tee, Darted Tee, Tank, Polo, Woven Shirt, Skirt and
Trouser. Cover style/revision metadata, six cover fields, fabric/trim material
rows, BOM rows, colorways and row-to-material/color assignments. Preserve
field-level source/provenance and evidence state. A user can enter confirmed
facts or explicitly mark a value unresolved with a reason and next action.
Do not invent supplier, article, lot, composition, construction, cost or
color facts.

Content edits save as exactly one new immutable payload-v2 revision. The save
must use the existing serialized workflow and repository compare-and-swap,
reject stale project/style/head state without partial writes, bind the exact
T01 child to the new head, and reset scoped approval to DRAFT. Existing frozen
outputs remain intact as historical bytes; the new revision is visibly not
their captured revision. Preserve the existing parser and package contracts.

The cost-input view must reflect the current material and BOM records,
including entered amount, currency, cost basis, quantity and quantity basis.
The record currently accepts multiple quantity bases and a free-form cost
basis; no common, admitted aggregation formula exists. Display those exact
inputs and their unresolved state. Do not calculate or label a garment cost
total in this slice.

## Scope and ownership

Codex owns integration and revision truth in:

- `src/ui/project-workflow.ts` and `src/ui/project-workflow.test.ts` — strict
  T01 update, one-child revision creation, CAS/stale and approval reset.
- `src/ui/project-manager.ts` and `src/ui/project-manager.test.ts` — editor
  state, safe save gating, feedback, refresh and preservation of unsaved
  design state.
- `src/ui/view.ts` — stylesheet registration only if needed; user-facing
  hosting already exists at `#project-manager-host`.
- `src/ui/studio.css` — manager-level cost-input/status styling, if needed.

The following isolated rendering candidate is assigned to Claude Code in its
own worktree, with exclusive ownership of exactly these new files:

- `src/ui/tech-pack-editor.ts`
- `src/ui/tech-pack-editor.test.ts`
- `src/ui/enhancements/tech-pack/tech-pack-editor.css`

Its contract is a pure, escaping-safe renderer exported as
`renderTechPackEditor({ record, recipeLabel, disabled })`. It renders every
editable record field and nested entity with stable `data-t01-*` attributes;
it performs no persistence, revision creation, recipe-specific mutation or
cost arithmetic. The S767 main worktree owns editor event handling and the
stylesheet import. The handoff must preserve the frozen schema and may not
edit `tech-pack-records.ts`, workflow, repository, package/export, or any
shared integration file. Claude must run its isolated component tests and
report an explicit `WORK FINISHED` signal plus the actual diff. Codex reviews
and integrates only after that signal.

No schema/storage/package/export-format changes, exporter implementation or
legacy output changes are in scope. No new recipe, launch service, supplier
contact, paid source/tool, physical sample/fit, factory acceptance or
production-readiness claim is authorized. S767 does not add a review/approve/
freeze action; it shows current scoped state, resets to DRAFT on edits and
preserves older frozen artifacts.

## Acceptance and gates

1. Cover, material/trim, BOM, colorway and assignment values can be added,
   edited, removed where valid, saved and reloaded through the T01 editor.
2. Every scalar retains editable source/provenance/evidence metadata. Unknown
   values remain explicit and require an actionable reason/next step; invalid
   combinations show the parser's correction and are not silently clamped.
3. One content save appends exactly one v2 child with the exact updated T01
   record and DRAFT review state. A stale editor fails closed with actionable
   reload guidance and leaves storage unchanged. Unsaved design edits cannot
   be overwritten by a T01 save.
4. Material and BOM cost inputs update in the visible T01 cost-input view;
   unknown input stays unknown and no unsupported aggregate is computed.
5. An existing frozen capture remains byte-verifiable and visible as historical
   after a T01 edit; the new T01 revision is not represented as frozen or
   approved.
6. Focused behavior is verified across all seven recipes. Every changed
   production TypeScript module reaches 100% statements, branches, functions
   and lines. TypeScript, focused tests, protected export identity and
   `git diff --check` pass. Control Center passes after any board change.
7. Capture and inspect actual rendered editor output for each supported recipe
   in a real browser; include the resulting evidence in the exit packet.
   Browser/rendered verification is in scope here. The integrated global,
   Electron and release gates remain S780.

## Dependencies, risks and unresolved facts

S763 freezes the typed schema; S764 persists/migrates it; S765 remaps nested
package-copy provenance; and S766 binds it into immutable revision-v2 content.
All are complete and digest-linked to the board. No unresolved product choice
blocks this editor. The cost-basis semantics are intentionally unresolved and
nonblocking because S767 displays inputs without deriving totals. Supplier
identities/specifications and physical truth remain unknown and must stay
explicit.

The main risk is preserving one coherent transaction while editing nested
records: entity IDs and references must remain unique and non-dangling, and
the editor must not lose a newer concurrent style head or unsaved design.
Focused parser/workflow/UI coverage and the real-browser review are the exit
gates. No separate safe coding task remains after assigning the isolated pure
renderer; the renderer does not own persistence or behavior.

Conditional effort assumption: approximately 1–3 focused engineering days,
including contributor wait/review, workflow integration, seven-recipe tests
and browser evidence. No delivery date is promised and no gate is reduced.
External-agent waits and maintainer-decision waits begin at zero and will be
recorded separately at exit.

## Single next action

Start the isolated renderer handoff from S766 commit
`66379ae19dee15c72e5816c601f51c5b2d5463aa` after this packet is digest-linked
to G05-T01 and EPIC-18 on the validated board. In parallel, implement only the
Codex-owned workflow/CAS and Project Manager integration. Do not inspect or
merge the contributor diff until its explicit `WORK FINISHED` signal.
