# Slice 250 — explicit grade-plan record and review

**Status:** Complete; see `S250-EXIT.md` for verified implementation evidence.
**Base:** Slice 249, `717af40`.
**Parent work item:** EPIC16-M03, In Progress after M02 completion at Control
Center revision 340.
**Scope authority:** `docs/planning/EPIC-16-ADMISSION.md` M03 and Slice 250;
`docs/research/epic14/C03-MEASUREMENT-AND-DONOR-CAPTURE-CONTRACT.md` §
“Grading contract”; and the confirmed decision
`docs/PROJECT-DECISIONS.md` “EPIC-16 custom one-size output identity”.

## Objective

Give a custom one-size style an explicit, versioned, reviewable grading plan
whose inputs and approval state are user-authored and bound to the exact base
style revision. Continue to show the one-size design as the default. Do not
silently attach existing XS–XL rules or interpret them as a population chart.

## In-scope plan contract

A plan must strictly record, without inferred values:

- its schema version and owning project/style identity;
- whether its basis is a named population/source or an explicitly
  user-authored product-defined digital range with no standards-compliance
  claim;
- a named source or decision, its version/date where known, and the declared
  size interval plus unsupported edge cases;
- the exact base style, base-size label, and base measurement/design revision;
- ordered, unique size labels and explicit per-measure, relevant POM/control
  values or increments, including the base row and any explicit exceptions or
  overrides;
- an editable/unreviewed versus reviewed/approved state with explicit local
  user review and approval events; and
- a deterministic digest of the base inputs and plan content used to identify
  stale approvals.

The repository's current recipe grade constants, Standard M fixture,
unspecified missing values, or arbitrary XS–XL labels cannot fill plan fields.
If a plan does not explicitly resolve required recipe values, it remains
invalid/unapproved and cannot be treated as current. Changing its base inputs
or plan content invalidates approval and requires another review.

## Slice boundary

Slice 250 owns the strict versioned record, validation, custom-style-scoped
local persistence, edit/review/approve lifecycle, base-revision binding,
stale-state visibility, and project backup/import compatibility for the plan.
It must preserve existing SaveFile v1–v6 and legacy style records and their
protected export bytes. Existing styles stay on their current default graded
path. Custom styles without an approved plan remain one-size.

Even after a user approves a plan, Slice 250 does not generate graded output.
The graded run, cross-size drafting, POM and cutting reconciliation, visible
base-to-size diff, and whole-run export integration belong to Slice 251. The
UI must say graded output is not available until that integration is complete;
it must not present an approved record as a generated/verified run.

## Non-goals

- Selecting a real-world population, body chart, brand size range, or numerical
  grade increments on behalf of the user.
- Copying, migrating, or relabeling the existing XS–XL recipe rules for a
  custom style.
- Changing any legacy style's current graded behavior, export bytes, or
  baselines.
- Fit qualification, standards conformity, sample approval, physical sewing,
  factory readiness, or a recommendation that an entered profile fits a person.
- Wiring the approved rule into existing pattern, marker, projector, tech-pack,
  or frozen-output generators; those are Slice 251.

## Acceptance and verification gates

1. Strict parser rejects unknown keys, missing/ill-typed values, duplicate or
   ambiguous labels/steps, invalid base references, incomplete rules,
   unsupported fields, and malformed approval history without repairing or
   silently filling them.
2. The plan is attached only to its custom style, binds to that style's current
   base revision, and round-trips through reload and portable project backup /
   import without changing legacy package or SaveFile identities.
3. A plan with no source/decision, no declared size interval, unresolved
   required per-measure/POM/control values, or unsupported exceptions cannot
   enter Approved state.
4. Approval is an explicit user action after review. Editing the plan or base
   invalidates approval visibly. A stale or invalid plan cannot enable
   generated graded or whole-run output during Slice 250.
5. No-plan custom styles retain usable one-size POM and selected-size exports;
   legacy styles retain the previous graded path and all protected bytes.
6. TypeScript, focused tests, full repository tests at 100% statement,
   branch, function and line coverage, app/Electron builds, Control Center,
   protected export identities, and rendered browser review pass. Test and
   inspect the record through an actual custom-style workflow, including reload,
   edit-after-approval invalidation, and one-size fallback.

Claude Code and OpenCode completed disjoint, read-only audits of the plan
contract and existing grade/output consumers in separate worktrees. Their
reports are evidence only. Codex owns all shared data-model, migration,
workflow, UI, grading and export implementation and reviews each result only
after the contributor returned the required `WORK FINISHED` signal. Slice 250
has passed its acceptance and verification gates; the grade-plan integration
and output reconciliation remain Slice 251.
