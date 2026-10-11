# EPIC-17 / G04 V03 — S710 returned-file identity and fail-closed checks

## Verified start

- Start: 2026-10-11 02:04 UTC from S709 commit
  `15274f91cdcf9cd99f6cbb1df0112b0b978860c8` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S709 is highest; S710 is reserved once.
- Canonical board revision 4167; G04-V01/V02 Done, G04-V03 and EPIC-17 In
  Progress. The goal stays active. Primary usage is 80%; ordinary use remains
  allowed.
- Only pre-existing untracked repository files are the two S700 coverage
  diagnostics. Do not delete or stage them; keep them on the final cleanup
  inventory. All exchange files/outputs stay under the named C: folders.

## Objective and fixed boundaries

Implement a separate verifier for a receiver-rewritten named-block DXF against
the original, unchanged G04 interchange manifest. Preserve the existing
source-package exact-DXF hash check. Reconcile piece/revision/grade/option,
geometry, units, layers, marks and stitch relation identity without claiming
the generic LibreCAD route qualifies as industrial CAD. Reuse the saved S708
Polo M return as evidence; no receiver UI, new software, source geometry edit,
new encoding, or 73-option sweep.

At the same time, exercise the existing malformed/unsupported fixtures through
the product verifier/import boundary, requiring visible error or blocked
status and no misleading success. C04 allows either user-visible outcome.
Keep every V03 acceptance criterion, `0.001 cm` threshold, all-seven/options/
grades, rights/profile, repeatability, readable-output, legacy DXF, protected
identity, final full gate, cleanup, PR/merge, ancestry, deployment, and
production end-to-end requirement unchanged.

## Required evidence and gates

- Inspect the current package verifier and named-block parser; do not mutate
  `verifyDxfInterchangePackage`'s original-byte integrity contract.
- Design focused malformed, missing/duplicate/extra block, wrong identity,
  wrong unit, geometry, mark/layer, and relation cases. Tests must prove
  fail-closed behavior.
- Compare against the actual saved S708 LibreCAD return without committing
  CAD files or machine paths. Keep any one-off reports/scripts on C:.
- Focused tests and changed-code coverage: 100% statements, branches,
  functions, and lines. Preserve protected legacy export byte identities.
- Run `npx tsc --noEmit` and `git diff --check`; update architecture/state,
  slice packet, admission/context and validated board commands.
- Full repository tests/global coverage/build/browser/Electron are reserved
  for the settled integrated Epic/PR candidate.

## Non-goals, risk, and ownership

No new CAD application or receiver experiment, no profile qualification,
industrial/ANSI/AAMA/ASTM conformance claim, no acceptance or threshold
change, no geometry/stitch/cut change, no broad UI or unrelated refactor, no
physical sampling or factory claim. There is no safe disjoint implementation
task: returned-file parsing and manifest relation checks share the same
contract. Codex owns code, tests and integration. Goal remains active and no
maintainer decision or UI action is pending.
