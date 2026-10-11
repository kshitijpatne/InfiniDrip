# EPIC-17 / G04 V03 — CLO millimeter-normalized input test — S689 start

## Verified start

- Started 2026-10-10 19:54:22 UTC from clean S688 `bc30d838`
  (`Slice 688: reconcile V03 source audit`) on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S689 is the next unique slice. Board revision 4071 had G04-V03
  Blocked and EPIC-17 In Progress; V01/V02 Done.
- The user explicitly asked Codex to find and test a concrete source-side
  solution. Their prior authorization for local CLO import/export applies.
  CLO is already open; no install, login, upload or hosted service is needed.

## Evidence-backed hypothesis

The exact S685 CLO return changed `$INSUNITS` from 5 (centimeters) to 4
(millimeters) while leaving coordinate numbers unchanged. On the observed
route, the returned file therefore represents the garment at one-tenth its
intended physical size. Five shallow CUT corners also lost one vertex each,
with residuals of 0.012741–0.013974 cm. Test whether the receiver's observed
millimeter convention and small imported model scale are contributing to both
the unit miss and vertex simplification.

Prepare one diagnostic copy of the exact S681 Polo M package: multiply every
geometric coordinate and radius by 10 and declare `$INSUNITS=4`. That is the
same physical geometry expressed in millimeters. Preserve the original entity
types, order, layers, vertices, closed state, bulges, piece layout, marks,
selected size, recipe revision, and options. Do not change the CLO version,
profile, settings, or source construction. Keep all exchange files and
screenshots only under `C:\G04-CAD-Interchange\S689-clo-millimeter-input-test\`.

This single source-unit normalization is specifically tied to the measured
output behavior. It is not a new CAD candidate or a standards claim.

## Decisive verification and stop conditions

1. Before CLO, prove the scaled drawing retains the same parsed entity counts,
   types, layer names, piece ordering, topology and physical coordinates after
   dividing by 10. Verify `$INSUNITS=4` and pin input hashes.
2. Use the already-open CLO 2026.1.310 Standard DXF route once. If the UI state
   is ambiguous, stop and reobserve; do not open/close CLO or repeat actions.
   Stop before export if import warns, a piece is absent, or geometry cannot be
   reviewed.
3. Export and reopen the exact returned file once. Normalize returned
   millimeter coordinates back to centimeters and compare every CUT/SEW path
   and mark with the unchanged `0.001 cm` gate; inspect actual saved rendering.
4. Stop the candidate at its first fixed-gate miss. Do not run another setting,
   encoding, scale, or entity variation. If the route passes this Polo M
   diagnostic, it remains only a representative pilot; C04 identity/grade,
   malformed-input, repeatability, all-seven/options and readability gates
   still require evidence.

No product implementation, export baseline, acceptance, or protected byte
identity changes in this diagnostic slice. No fit, factory, production
readiness, ANSI/AAMA or ASTM claim.

## S689 measured result and disposition

The controlled trial is complete. The hash-pinned candidate expressed the same physical source geometry in millimeters, and CLO 2026.1.310 Standard DXF returned `$INSUNITS=4` with coordinates still in millimeters. The exact return reopened in CLO with all nine pieces and no import warning. After normalizing only a comparison copy back to centimeters, all nine SEW paths pass the fixed `0.001 cm` comparison. **The unit/scale gate passes for this one diagnostic pilot.**

The unchanged geometry and mark gates fail: five of nine CUT paths each lose a source vertex, with maximum residuals `0.012742–0.013969 cm`; eight of 108 visible source marks have no matching returned geometry (one cut line, three buttonhole points, four collar notches). This is the same set of failures as S685. The returned file contains nine generic numbered piece blocks and 125 `LWPOLYLINE` entities, no typed `LINE`, `POINT`, or `CIRCLE` marks, and only numeric layers. It therefore does not preserve mark identity. The saved CLO overview is dark and clipped, so readable output is not established.

**Decision:** reject this CLO Standard route for V03 and stop. Do not alter production DXF geometry, loosen the `0.001 cm` gate, restore missing details from a sidecar, or retry another scale/encoding. Such restoration would hide what the receiver actually changed. S689 found no source-code defect; its input transform and comparison scripts are diagnostics only. The original centimeter DXF remains authoritative and unchanged. Full gate reconciliation and a concrete route recommendation are in `S689-V03-route-decision.md`; machine evidence is retained in `C:\G04-CAD-Interchange\S689-clo-millimeter-input-test\` and identified there by SHA-256.
