# Slice 772 — T03 operation editing and validation

**Status:** Starting. **Start:** 2026-10-13 03:10:01 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** `f802820f7a20fc7e1210d8fa709e0403ac4898bd`
(`Slice 771: add sourced T03 operation record contract`). Fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The clean branch has S771 as its highest assigned slice; S772 is unique.
Canonical board revision 4589 records G05-T01/T02 Done, G05-T03 and EPIC-18
In Progress. S772 start evidence will attach to G05-T03 and EPIC-18; their
statuses remain unchanged.

## Authority and contract gap

The unchanged digest-bound S762 admission authorizes G05. The current exact
sequence is the S765 resequencing addendum and `EPIC-18-GOAL.md`; the original
S762 slice table is historical. S771 completed the standalone operation
record/source contract. S772 is the admitted functional editor/validator;
S773 remains the distinct component/BOM/pattern reconciliation and all-seven
rendered/source review boundary.

The S771 schema-v1 value union deliberately covers only source-confirmed,
unresolved, and conflicting values. S772 must also distinguish the admitted
recipe-default, estimate, and user-decision cases. Add these as explicit
schema-v2 value states while retaining strict schema-v1 parsing and preserving
the rule that only `SOURCE_CONFIRMED` is source evidence. Non-source states
must carry their own origin metadata: recipe defaults identify the recipe,
recipe-version marker, and in-app locator; estimates carry method and
assumptions; user decisions carry a rationale. None may be silently promoted
to a source claim or supply an implicit value.

## Bounded implementation

Implement a local T03 editor and read-only validation summary backed by the
versioned S771 operation contract. Add operation record schema v2 for the
explicit value origins above; preserve schema-v1 parsing. Add `operationData`
to an additive TechPackRecord schema v3, carrying forward the existing T02
`pomData`. Saving uses the current immutable style-revision/CAS path so T03
content participates in revision digests and historical T01/T02 records remain
readable. Keep the existing style-revision payload v1/v2 shapes unchanged;
the current v2 payload already contains the nested tech-pack snapshot. Verify
this compatibility in tests rather than introducing a top-level payload bump.

The editor may add/remove explicitly unresolved operation shells and edit the
strict record set. Validation reports absent, unresolved, conflicting,
recipe-default, estimated, user-decided, and source-confirmed states with
actionable guidance. It must display provenance categories distinctly and
must never count an estimate, recipe default, or decision as source-confirmed.
If it displays existing `recipe.techPack` construction strings, keep them in a
separate, read-only, visibly labeled defaults section; do not seed them into
operation facts. Keep component/seam links syntactic and source/user-state
aware; their existence and relation to pattern/BOM inventory belong to S773.

Persisted operation records must survive save, reload, revision-history
verification, project-package round-trip, and project copy without changing
historical v1/v2 TechPack records or revision payloads. Use synthetic fixtures
only; no garment construction facts or external citations are available in
this slice. Review the actual rendered editor on a simple and a complex
representative existing recipe; all-seven rendered/source review remains S773.

## Acceptance and gates

- Focused tests cover schema-v1/v2 operation records, every value origin,
  source separation, invalid metadata, actionable incomplete/conflict states,
  T01/T02/v3 TechPack compatibility, add/edit/remove, invalid JSON, stale CAS,
  save/reload, revision digests, project-package round-trip, and copy behavior.
- Every changed production module reaches 100% statement, branch, function,
  and line coverage. `npx tsc --noEmit --pretty false` passes.
- Actual isolated-browser review exercises the rendered editor, explicit
  provenance labels, validation findings, and successful local save/reload;
  no physical or production acceptance is inferred.
- Protected export identity remains 9/9; no export baseline moves. After
  validated board exit/replay, Control Center tests and `git diff --check`
  pass.
- Do not run the global/Epic, integrated build, Electron, or release gates
  early; those remain at S780.
- Close S772 with hash-bound exit/replay evidence and one unique commit whose
  subject begins `Slice 772:`. G05-T03 remains In Progress until S773 closes
  the cross-record and all-recipe review gates.

## Holds, risks, and ownership

No construction source set is available. All operation state in tests/browser
proof is synthetic; no actual stitch, machine, seam, allowance, finish,
pressing, label, packaging, test, or compliance facts are entered. Recipe
defaults, estimates, and user decisions remain distinguishable from sourced
facts. No paid standards text, new provider/service, export format, physical
fit, supplier/factory acceptance, regulatory determination, or production
readiness is authorized or claimed. All eight protected legacy export
identities and the local-first/no-cost boundary remain unchanged.

No safe disjoint delegation exists: the schema-v2 origin states, TechPack
schema-v3 persistence, immutable revision integration, editor, and validation
share one evolving record contract. A separate renderer assignment before
that contract is exercised would create integration churn rather than a stable
handoff. Keep the work in Codex; external-agent and maintainer-decision waits
are zero unless new evidence changes this.

## Start evidence and elapsed time

The packet digest will be attached to G05-T03 and EPIC-18 by validated
commands; no status transition is needed because G05-T03 is already In
Progress. Record final board revision, tests, rendered evidence, elapsed
implementation/verification time, external-agent wait, maintainer-decision
wait, and any verified stopping point in the slice exit packet.
