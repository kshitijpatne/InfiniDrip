# Slice 773 — T03 pattern/BOM reference reconciliation

**Status:** Starting. **Start:** 2026-10-13 04:13:24 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** `652605fde0cf48eb3a105636c7a8cd0373e4e0cd` (`Slice 772: add
T03 operation editor and validation`). Fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor. The
clean branch has S772 as its highest assigned slice; S773 is unique. Canonical
board revision 4597 records G05-T01/T02 Done, G05-T03 and EPIC-18 In Progress,
and UIQ-10 Backlog. Validated S772 exit/replay evidence is hash-linked to T03
and EPIC-18.

## Authority and boundary

The admitted EPIC-18/G05 sequence in
`docs/planning/EPIC-18-S765-RESEQUENCING.md` assigns S773 to T03
BOM-to-pattern/component reconciliation and all-seven rendered/source review;
it is the last T03 slice. S772 provides strict schema-v1/v2 operation records,
schema-v3 TechPack persistence, and the local editor/validation summary. The
current board keeps G05-T03 In Progress; this slice may close it only after all
acceptance evidence passes through the validated status commands. EPIC-18 stays
In Progress; UIQ-10 stays Backlog for its separate S774 admission.

No authoritative garment construction source set is available. No stitch,
machine setting, needle, thread, SPI, allowance, finish, pressing, label,
packaging, test, or compliance value will be inferred. This slice reconciles
only code-derived pattern topology with explicit local T01/T03 references.
Pattern roles and `Stitch` declarations are application-model identifiers, not
source evidence or proof of sewability/fit. T01/BOM values and T03 origin
labels remain unchanged and visible; only SOURCE_CONFIRMED T03 values count as
source evidence.

## Bounded implementation

1. Derive a deterministic in-app reference inventory from each existing
   `GarmentRecipe.draft` result for the active saved design. Preserve each exact
   `Block.roles` key as the component's underlying role identity. T03's existing
   stable-ID parser only accepts lowercase IDs, while some role keys are
   camel-cased; expose a deterministic lowercase component reference ID and the
   exact role key together, and accept either when reconciling existing T01/T03
   values. Seam IDs identify each `Block.stitches` declaration using its label
   and complete edge/mark topology. Detect duplicate or malformed derived IDs
   and report them rather than silently merging.
2. Reconcile T01 BOM `componentRef` values to that recipe's pattern component
   inventory. Reconcile each operation component reference to both the pattern
   inventory and a matching valid BOM component reference. Reconcile operation
   seam references to the recipe's derived stitch inventory.
3. Render a read-only inventory and actionable findings in the existing T03
   editor. Keep absent and unresolved links visible; report invalid or stale
   references as conflicts. Do not fill an empty T01/T03 record from recipe
   defaults or generate manufacturing steps.
4. Exercise every recipe ID (`tee`, `fitted`, `tank`, `polo`, `woven-shirt`,
   `skirt`, `trouser`) in focused tests and source review. Use synthetic link
   records only; verify reference IDs, missing/unknown/conflicting mappings,
   unresolved provenance, unsupported recipe paths, and all validation
   guidance. Review the actual browser-rendered T03 surface on all seven
   existing recipe patterns in an isolated local origin.
5. Close G05-T03 only if every-seven reconciliation and rendered/source gates
   pass and the editor clearly disclaims manufacturing/physical acceptance.
   If the all-recipe review finds a bounded defect, retain T03 In Progress and
   record the single remediation action with a new slice number.

## Acceptance and verification gates

- T01 BOM links resolve only to existing pattern role IDs; operation component
  refs resolve to existing roles and their explicit valid BOM link; operation
  seam refs resolve to exact derived pattern stitch IDs.
- Missing, unresolved, malformed, unknown, conflicting, or stale references
  remain distinct and have an actionable correction. Matching an in-app role or
  stitch never upgrades provenance or asserts construction correctness.
- Existing schema-v1/v2/v3 TechPack records, immutable revision digests,
  project packages/copies, and S772 save/reload behavior remain compatible.
- Changed production modules reach 100% statement, branch, function, and line
  coverage. TypeScript and protected export identity 9/9 pass with no baseline
  change. Focused package/revision checks run for any affected persistence path.
- Actual browser review covers all seven recipe inventories and findings;
  emitted findings agree with the saved recipe, BOM and operation values.
- After validated board exit/replay and (if acceptance passes) T03 status
  transition, `npm run control-center:test` and `git diff --check` pass. Keep the
  S780 integrated/global/build/Electron/release gates deferred.

## Ownership, risks, and clock

No safe disjoint delegation exists: reference identity, cross-record
reconciliation, ProjectManager integration, and all-seven rendered review share
one recipe inventory. The shared `F:\designApp` checkout remains untouched.
Known risks are grouped BOM rows, recipe-specific component naming, and
duplicate/non-stable stitch labels; retain explicit findings when a mapping
cannot be established instead of guessing. No review or maintainer decision is
pending. Record implementation, focused verification, rendered review,
external-agent wait, and maintainer-decision wait separately in the exit
packet.

## Start evidence

The packet SHA-256 will be attached to G05-T03 and EPIC-18 using the validated
Control Center CLI without changing either status. The single next action is
to implement the reference inventory and reconciliation described above.
