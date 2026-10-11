# EPIC-17 / G04 V03 — S704 source and gate reconciliation exit

## Result

S704 restores the complete `CONTEXT-INDEX.md` and `PROJECT-STATE.md` history
from exact S702 `f06e9691` content and prepends current S703 evidence without
rewriting S703 history. The unintended S703 truncation is corrected in this
separately numbered slice. The S703 unit report and wording are corrected:
the hash-pinned source declares centimeters with `$INSUNITS=5`; the returned
CLO AC1009 drawing has no `$INSUNITS`. Its helper omitted header variables
because it grouped only group-0 entities. The C:-only JSON report records this
parser limitation.

The refreshed matrix reconciles each unchanged V03 gate against S703's actual
CLO DXF-ASTM output, S690 LibreCAD R2000, existing package/source tests and
installed-route evidence. CLO is retired for repeated tests of the same CUT
and POINT failures. The only existing receiver route with a one-fixture pass
for contours, marks, layers, units and reopen is LibreCAD 2.2.1.5 / DXF 2000;
its generic-CAD status remains explicit, and the admitted industrial-profile
gate is not claimed passed. No new app, receiver search, or repeated CLO/DGS/
OpenCAD variation is planned.

A code-backed mark correction is identified for the next slice: preserve each
buttonhole as one logical point at its exact source center, while writing the
same centered 0.25 cm cross that the existing PDF renderer uses for non-button
point marks, only in the versioned candidate package. This addresses CLO's
measured POINT omission and can be verified through the already installed
R2000 route. It does not address the separate CLO curve loss and does not
change any source garment geometry or legacy export.

## Gate and plan

The complete status-by-gate matrix is `V03-CURRENT-GATE-MATRIX-S704.md`; the
short prioritized plan is `V03-COMPLETION-PLAN-S704.md`. V01/V02 remain Done;
V03 remains held; EPIC-17 remains In Progress; the goal remains active. All
seven recipes, 73 supported options, grades, `0.001 cm` checks, rights,
identity/layers/marks, malformed-input, repeatability, readable output,
protected legacy byte identities, final coverage/build/render gates, cleanup,
PR/merge, ancestry and deployment remain unchanged. No standards-conformance,
physical-fit, factory-acceptance or production-readiness claim is made.

Next: S705 implements the candidate-only buttonhole cross encoding with a
versioned manifest/verifier and tests; preserve the legacy `exportDxf` and all
protected byte identities. If focused proof passes, S706 uses the existing
LibreCAD R2000 route once on the exact current Polo M candidate and its
rendered output, then proceeds to the same-profile all-seven/grade/negative/
repeat matrix only on a representative pass.

## Verification and closeout

- Start: 2026-10-11 00:17:34 UTC from S703 `4914366c`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S703 highest; S704 is unique.
- Board start replay revision 4145; correction comment and exit evidence/comment
  validated through revision 4148. G04-V03 remains Blocked; EPIC-17 remains In
  Progress.
- No product source changed. `npm run control-center:test` passed 42/42 and
  `git diff --check` passed after board closeout. No full repository gate is
  due for this documentation/evidence-only slice.
- Implementation: 0m; source/gate reconciliation and history restoration:
  approximately 5m; focused verification and board closeout: approximately 1m;
  external-agent wait 0m; maintainer-decision time 0m. No files were deleted. Current untracked
  repository cleanup candidates remain the two historical S700 changed-coverage
  diagnostics; inspect and decide at the final cleanup boundary only.
