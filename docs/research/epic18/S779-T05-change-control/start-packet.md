# Slice 779 start — T05 dependency invalidation and compatibility

**Status:** Started 2026-10-13 18:18 UTC. **Owner:** Codex.
**Branch/worktree:** `codex/epic-18-g05` at
`C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp`.
**Starting commit:** S778 `e5c62ada9cec87b9e5daafff093824e91bd9ace0`.

## Verified checkpoint and authority

- `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is freshly fetched and
  remains an ancestor. The highest assigned slice is 761 on `origin/main` and
  778 on this branch; 779 is the next unique number.
- There are no tracked or staged changes at start. Five pre-existing
  untracked S778 render files remain (`evidence/S778-freeze-{390x844,
  1280x800}.png` and three `tmp/pdfs/s778-*.png` files). They are outside this
  slice's ownership and will not be staged or modified.
- The canonical Control Center board is revision 4657. EPIC-18 and G05-T05
  are In Progress; T01–T04 and UIQ-10 are Done; G05-EXIT is Backlog. Verified
  S778 start and exit evidence are linked to G05-T05 and EPIC-18. The S779
  validated start replay will link its own packet before implementation.
- S778 landed as `Slice 778: freeze approved local Tech Pack share`; its
  exit, replay and actual output evidence are in
  `docs/research/epic18/S778-T05-freeze/`. S778 completed exact-revision scoped
  approval/freeze, deterministic artifact manifest/digests, original ZIP/PDF
  byte retention and local downloads. G05-T05 remains open.
- The exact active boundary is S779 in
  `docs/planning/EPIC-18-S765-RESEQUENCING.md`; the original authority remains
  `docs/planning/EPIC-18-ADMISSION.md`. The C04 revision/share lifecycle is in
  `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`.
- Cross-project status before start agrees in `CONTEXT-INDEX.md`,
  `PROJECT-STATE.md`, `ARCHITECTURE.md`, `docs/PROJECT-DECISIONS.md`,
  `docs/planning/EPIC-18-GOAL.md`, the S765 sequence addendum, and board
  revision 4657. The overall EPIC-18/G05 goal remains active.
- Usage at start: primary window 25% used, weekly window 19% used; ordinary
  usage is allowed.

## Intended outcome and exact boundary

Complete the second and final T05 implementation boundary. When any relevant
saved Tech Pack input changes, invalidate current dependent review/check/output
state and any approval bound to the old revision, surface an actionable
stale/current distinction, and keep every prior frozen artifact's exact bytes
available. Verify that existing schema-v1/v2 package and draft Tech Pack
history remains readable and that the new schema-v3 freeze does not reinterpret
or rewrite historical bytes. Verify all eight protected legacy export byte
identities without moving a baseline. Cover the shared paths across all seven
supported recipe IDs with synthetic/local fixtures where applicable.

Historical frozen manifests and artifact bytes are immutable evidence; stale
means no longer current for the edited head, not that the original packet is
deleted or rewritten. The user must be able to identify which revision is
current and which frozen files are historical, with an explicit next action.
An edit must not silently inherit approval or silently replace prior frozen
bytes. Preserve the C04 lifecycle, digest semantics, existing draft Tech Pack
compatibility and all export identities.

S779 closes G05-T05 only if this boundary and S778's freeze-creation
acceptance both pass. S780 remains the settled integrated/global gate; S781
remains merge, main CI/deployment and Epic closeout.

## Acceptance and required gates

1. Tests prove relevant save/edit paths invalidate affected checks, review,
   approval and current-output state for the new revision; unaffected scopes
   remain valid where C04 permits. Stale heads fail closed. All previous
   frozen artifact bytes remain byte-identical and downloadable after edits,
   and the UI identifies the old revision as historical and the new head as
   current.
2. Compatibility tests parse, validate and round-trip existing schema-v1/v2
   packages and draft Tech Pack records without rewriting their revision or
   export identity. New schema-v3 artifacts remain distinct and explicitly
   bound to their source revision.
3. Run focused tests for changed production code and achieve 100% statement,
   branch, function and line coverage for every changed production module or
   exact changed range. Do not weaken existing assertions or move baselines.
4. Run the protected export regression and identity gate covering all eight
   protected hashes. Record exact output hashes and prove they are unchanged.
5. Re-run TypeScript and the changed-control rendered/browser review at
   390×844 and 1280×800. Inspect an actual save/edit/freeze sequence and the
   retained historical ZIP/PDF, not tests alone. Require keyboard operation,
   actionable stale/current guidance, readable retained-download controls,
   and no horizontal page overflow.
6. Replay board evidence through the validated Control Center command layer;
   run `npm run control-center:test` and `git diff --check`. Keep G05-T05 and
   EPIC-18 In Progress until both T05 boundaries are evidenced. Do not run
   the settled global gate early; S780 owns it.

## Non-goals, risks, decisions and delegation

- No changes to patterns, garment recipes, BOM/POM/operation facts, grading,
  legacy export semantics, protected hashes, or supplier/physical/production
  status. No new garment or user-authored source data.
- No network, identity service, database, cloud sync, paid provider, supplier
  contact, authenticated approval, or production handoff. Local reviewer
  labels remain self-attested.
- No unresolved product decision blocks this boundary. C04 and S778 define
  the approved local-share and digest behavior. If implementation reveals a
  genuine ambiguity, document it and continue only independent, non-blocked
  checks until resolved.
- A separate contributor has no safe disjoint ownership: edit-triggered
  invalidation, approval/current-state overlays, old-byte preservation, and
  package/revision compatibility share the same workflow and UI surfaces.
  The eight protected identity suite is a direct deterministic gate, not an
  independent code task. Codex retains implementation and integrated review;
  external-agent wait is planned at zero.

## Time accounting

Start: 2026-10-13 18:18 UTC. At exit record implementation, focused
verification, rendered/output review, external-agent wait and maintainer
decision wait separately. Agent and maintainer waits start at zero.

## Next action

After the validated S779 start evidence is linked to G05-T05 and EPIC-18,
implement change-driven invalidation and stale/current presentation in the
existing local workflow; then verify prior-byte retention, compatibility and
all eight protected export identities against the acceptance gates above.
