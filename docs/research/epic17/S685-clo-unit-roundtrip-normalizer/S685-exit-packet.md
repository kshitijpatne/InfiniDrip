# S685 exit — exact source-to-CLO output comparison

## Result

The source DXF writer is not where the measured unit-label error originates.
`exportDxfCentimeters` writes `$INSUNITS=5` (centimeters), and the package
verifier requires that header, centimeter metadata, and the exact source drawing
hash. The S684 input was that verified package. In the one observed CLO
Standard DXF return, CLO wrote `$INSUNITS=4` (millimeters) while retaining
centimeter-sized coordinate numbers. The route also changed geometry and mark
representations, so a header-only correction is not safe. No production code
change or normalization was made.

## Reproducible evidence

- Source: `C:\G04-CAD-Interchange\S683-current-package-clo-roundtrip\polo-default-M.dxf`, 28,713 bytes, SHA-256 `a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c`.
- Paired manifest: same folder, SHA-256 `aa0a186287e8960559677252524e2e0c1643968524aa297af627d6ee8fd57f2c`.
- Returned drawing: `C:\G04-CAD-Interchange\S684-current-package-clo-import\polo-default-M-clo-roundtrip.dxf`, 77,189 bytes, SHA-256 `f54d6f3c221d8478e13fdae703f0e69d466882962620fb2bc4014becd5fbe180`.
- Comparison report: `C:\G04-CAD-Interchange\S684-current-package-clo-import\S685-dxf-comparison.json`, SHA-256 `4C2CE7C9D8DCAF8A4788948C6539498ABA19EBE0F47FF5C535C273226A41DD9B`.
- The report is regenerated from the immutable source and returned drawings by `compare-dxf-roundtrip.mjs`. It compares every source CUT/SEW outline against paths in the corresponding receiver piece block, handles DXF polyline bulges, and uses the fixed `0.001 cm` limit. It also compares each source drawing mark entity with the returned piece geometry. This is a geometry comparison, not a claim that layer or mark identity survived.

## Measurements

- **Unit label: failed.** Source declares centimeters (`5`); returned file declares millimeters (`4`) with unchanged numeric coordinate values. This produces a tenfold size error for a downstream app following the returned label.
- **CUT/SEW geometry: failed.** All 9 sewn outlines are within `0.000028 cm`. Four cut outlines are within the `0.001 cm` limit. Five exceed it: back `0.012741 cm`, outer stand `0.012977 cm`, inner stand `0.013974 cm`, upper collar `0.012990 cm`, under collar `0.012999 cm`.
- **Drawing-mark geometry: failed.** The source drawing has 108 simple LINE/POINT/CIRCLE mark entities. The returned piece blocks contain geometry within `0.001 cm` for 100; 8 do not: one front cut-line, three buttonhole points, and four collar notches. The largest cut-line miss is `13.0384 cm`; buttonhole point misses are `1.49998 cm`; collar notch misses range `0.81616–0.89718 cm`.
- **Identity/layers: unproven.** The source uses semantic `CUT`, `SEW`, and `MARK_*` layers and a sidecar with named mark and piece identities. CLO's output uses numeric layers and generic block names and carries no source IDs. Even where geometry is nearby, the receiver file alone cannot establish the original mark identity.
- No output was reopened in CLO or modified after the failure. No additional software, format, mode, setting, fixture or encoding was tried. The existing import was visually inspected in CLO during S684; S685 inspected the exact saved return through the entity comparison.

## Gate effect and safe next action

This exact CLO route does not pass the unit, full-geometry, all-mark, or identity checks for even the single Polo M fixture. A unit-label rewrite would conceal measured differences; rebuilding the return from the source would no longer be a demonstrated round trip. Therefore this slice makes no source correction and claims no V03 pass. The evidence is specific to the one observed CLO 2026.1.310 Standard DXF route and settings, not every CLO mode or an industry standard.

V03 remains In Progress. The accepted seven-recipe, option/grade, malformed-input, repeatability, readability, rights, receiver/profile, and round-trip gates are unchanged. Next, use the existing V03 matrix to update gate status with this concrete result and select a completion path that does not mask the receiver differences or change criteria. Do not start another software/profile trial by default. Full repository coverage, integrated output review, PR, safe merge to `origin/main`, ancestry verification, and required deployment remain open.

## Slice accounting

- Start: 2026-10-10 18:49:15 UTC. Durable closeout: 2026-10-10 18:54:24 UTC; elapsed 5m09s.
- Implementation: no production implementation; comparison utility and evidence packet only, approximately 1m20s.
- Focused verification and closeout: source/output parsing, contour and mark comparison, utility syntax check, state/board closeout, approximately 3m49s.
- External-agent wait: 0 minutes. Maintainer-decision time: 0 minutes.
- Focused Control Center suite: recorded at closeout. Changed-production-code coverage does not apply because no production code changed. Full repository gate was not run.
