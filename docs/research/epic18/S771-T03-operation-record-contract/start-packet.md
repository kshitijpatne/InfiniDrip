# Slice 771 — T03 sourced operation-record contract

**Status:** Starting. **Start:** 2026-10-13 02:54:10 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** `25cd67b1f9c180598b844e905595ca744a670b8c`
(`Slice 770: add source-aware T02 callout and size-run checks`). Fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The clean branch has S770 as its highest assigned slice; S771 is unique.
Canonical board revision 4582 records G05-T01/T02 Done, G05-T03 Backlog, and
EPIC-18 In Progress.

## Authority and checkpoint

The unchanged digest-bound S762 admission authorizes G05. The current ordered
sequence is the S765 resequencing addendum and `EPIC-18-GOAL.md`; it supersedes
the older slice numbers in the original S762 boundary table. S770 closed T02
at board revision 4582. S771 is the next admitted T03 boundary. It is followed
by S772 operation editing/validation and S773 BOM-to-pattern/component
reconciliation and rendered/source review. This slice does not absorb either
later boundary.

## Bounded work

Add a standalone strict schema-v1 contract and parser for recipe-scoped T03
construction-operation records. It must support the seven admitted recipe IDs
without seeding any operation or construction facts. Every represented fact
is source-confirmed, explicitly unresolved, or explicitly conflicting. Source
references must be portable and identify a title and locator; conflicting
facts require distinct source references. Unknown facts carry no assumed
value and include a reason and actionable next step.

Represent a stable operation ID and sourced operation name/order, explicit
component and seam references, and independently sourced fact entries for
construction method, machine settings, stitch type, seam construction,
seam allowance, finish, pressing, labels, packaging, tests, and compliance.
Allowance values are finite and paired with an explicit supported length
unit. Component/seam references are syntactically validated only here; the
contract does not assert that a reference exists in a recipe, pattern, or BOM.

Keep the contract additive and standalone. Do not edit T01/T02 schemas,
persist operations in a style revision, build operation editing/validation UI,
seed recipe operations, generate outputs, or reconcile component/BOM/pattern
inventory. Those belong to later admitted boundaries. S771 has no new rendered
product output; verify the strict parsed record shape with synthetic test
fixtures only. User-facing editing/render proof is due at S772/S773.

## Acceptance and gates

- Focused parser tests cover exact schema keys, all source states, portable
  references, component/seam links, unique operation/fact IDs, numeric/unit
  validation, bounds, all seven recipe IDs, and rejection of malformed or
  contradictory input. Fixtures are synthetic and are not recipe evidence.
- Every changed production module reaches 100% statement, branch, function,
  and line coverage. `npx tsc --noEmit --pretty false` passes.
- Protected export identity remains 9/9; no export baseline moves. After the
  validated exit replay, Control Center tests and `git diff --check` pass.
- Do not run global/Epic, integrated build, browser/Electron, or release gates
  early; these remain reserved for S780.
- Write S771 exit and post-replay evidence before closing the slice. Reserve
  no number other than S771 here, and land exactly one commit beginning
  `Slice 771:`.

## Holds, risks, and ownership

No sourced operation set is available in this slice, so all seven recipe sets
remain empty; schema-valid synthetic examples prove parser behavior only.
Parsing a citation cannot establish the truth or currency of its source. No
machine setting, stitch/seam construction, allowance, finish, press method,
label, packaging, test, or compliance value is inferred. No physical fit,
supplier/factory acceptance, regulatory conformity, or production-readiness
claim is made. Existing local-first/no-cost limits and all eight protected
export identities remain unchanged.

No safe disjoint delegation exists: the new record types, strict source-state
parser and branch-complete tests form one schema contract, with no UI/output
ownership to separate. Keep the boundary in Codex; external-agent wait and
maintainer-decision wait are both zero unless new evidence changes this.

## Start evidence and elapsed time

The packet digest will be attached through validated commands to G05-T03 and
EPIC-18; a separate validated status command starts G05-T03. Record the
resulting board revision and verified command/test output at exit. At the
slice boundary, split elapsed time among implementation, focused verification,
external-agent waits, and maintainer-decision waits, and record any verified
stopping point if a usage reset interrupts work.
