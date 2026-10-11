# EPIC-17 / G04 V03 — Complete option-bound package inputs — S680 start

## Verified boundary and scope authority

- Started 2026-10-10 18:03:37 UTC from clean S679 commit `dff78e78` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 679; S680 is unique.
- Canonical Control Center board revision 4033 keeps EPIC-17 and G04-V03 In Progress; V01/V02 Done.
- The goal remains active with the full admitted scope.
- Existing evidence: S626/S627's pinned S330 matrix has 73 canonical configurations across seven recipes; S678 packages all grade rows at default options but does not exercise that 73-row option matrix. The current manifest copies caller-supplied options, so omitted defaults are not explicitly recorded and runtime invalid values are not rejected by the package boundary.

## Scope

Make package creation materialize every recipe option's actual selected value (explicit input or recipe default), reject unknown/non-numeric/non-finite/out-of-range/off-step values, and draft/hash using that exact resolved option set. Reuse the exact canonical `docs/research/epic17/S330-integrated-browser/matrix.json` to generate and verify all 73 source packages at STANDARD_M. Keep the existing per-recipe grade-row checks and unit/DXF hash binding.

Save the generated 73 DXF/manifest package evidence only under `C:\G04-CAD-Interchange\S680-option-packages`. Preserve existing default-M evidence and all source geometry, legacy behavior, and protected exports.

## Acceptance and verification

- All 73 canonical rows yield a verified sidecar with complete option values and explicit centimeters tied to `$INSUNITS=5`.
- Invalid/unknown options fail closed; omitted defaults and explicit defaults yield the same resolved options and revision.
- Focused package/DXF/protected tests and changed-code coverage: 100% statements, branches, functions and lines.
- Build, Control Center tests, board validation, `git diff --check`, rendered/evidence checks. All existing DXF generation hashes/baselines remain unchanged.

## Non-goals and limitations

No receiver launch/import/export, CAD app or mode change, receiver-loss workaround, profile/conformance claim, grade interchange claim beyond source-package row generation, malformed-receiver claim, acceptance reduction, UI, source pattern edit, geometry change, physical/factory claim, or protected baseline move. The 73-row package matrix is source evidence only; it does not promote any external V03 gate or prove receiver preservation.

## Slice ledger

Record implementation, focused verification, package generation/output review, board/docs closeout, external waits and maintainer-decision time separately at the verified exit boundary. No safe disjoint task exists for the shared package contract; Codex owns integration and review.

## Work finding

The 73-row replay exposed a second product-side defect in the repaired Woven
zero-vent fixture: its valid pattern block contains optional fields whose value
is `undefined`. The manifest's canonical comparison treated those fields as
invalid JSON, although JSON serialization omits them. S680 corrects the
comparison to use JSON-compatible object semantics. This is source evidence;
it says nothing about receiver import or output.
