# EPIC-17 / G04 V03 — AAMA swap-lines import check — Slice 621 start

## Verified start

- Started 2026-10-09 13:35:34 UTC from clean S620 commit `66fc68fdf8f4c42bdfd7c6f232098305d385cb8a` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 620; reserve S621. Board revision 3618 records EPIC-17 In Progress, G04-V02 Done and G04-V03 In Progress. CLO 2026.1.310 remains open.
- The maintainer has provided written confirmation that the CLO trial may be used for InfiniDrip product-development evaluation and that DXF import/export processing is local. This clears these two prerequisites for the practical fixture test; it does not select an exact compatibility claim or clear any V03 gate.
- The C:-only input copy is `Input\polo-source-m-cut-lines.dxf`, SHA-256 `a95e2cbafaa14555421517505ca83225e9e0acb26dbadb4b7fa62ac5a0d1b675`, matching S574's hash-pinned fixture.

## Bounded question and method

Run one controlled CLO DXF-AAMA import of the hash-pinned S574 Polo M connected-LINE fixture, changing only **Swap cut and sewing lines** from off to on. Preserve all other S574 import settings, including units, scale, notch settings, curve handling and pattern mode. Record visible settings/notices, save the imported project only in `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\`, and query the CLO 2026.1.310 native point lists before export. Compare source CUT/SEW contours and pattern ordering using the S620 analyzer without inferring semantics from CLO's undocumented `Base Line` label.

The practical acceptance for this diagnostic is evidence of whether all nine source CUT contours are represented in native geometry within the unchanged 0.001 cm gate, alongside expected piece count, closure and rendered import review. If CUT fails at import, stop this CLO AAMA path for the fixture; do not export. If it passes, the next slice may run the already-specified ASTM export/reimport gates with this exact option profile. Do not infer a pass from the setting label alone.

## Holds and non-goals

- Keep all V03 rights/profile, fixture breadth, geometry, units, marks, grading, negative-input, repeatability, rendering, round-trip and exact-compatibility gates unchanged. No V02, all-seven, legacy DXF, protected export identity, tolerance or acceptance change.
- No product code, source pattern, recipe geometry, DXF writer, export baseline, grade data, or unrelated UI changes. No paid terms, new account, vendor contact, hosted service, or transfer of files outside C:. Do not save over S574 evidence. No physical-fit, factory-acceptance or production-readiness claim.
- Use only `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\` for the S621 copy/input, imported project, CLO output, rendered evidence and machine-readable reports. Keep CLO open throughout the active goal.
- No safe independent delegation: this is a single controlled import in the already-open CLO session, and the output must be observed in that session.

## Verification and next gate

Hash the copied source; record exact import settings and visible messages; query pre-export native geometry; run source-bound measurement, syntax/preflight checks, `npm run control-center:test`, validated board exit replay and `git diff --check`. No production code changes are planned, so changed-production-code coverage does not apply. Keep the full repository gate for the settled integrated Epic/PR candidate.

**Next action:** copy and hash the S574 source fixture into the S621 C:-only folder, import with only swap-lines enabled, then inspect native geometry before any export.
