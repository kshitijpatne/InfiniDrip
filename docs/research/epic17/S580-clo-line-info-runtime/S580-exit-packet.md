# EPIC-17 / G04 V03 — CLO outline-line info runtime check — Slice 580 exit

## Result

S580 ran the documented read-only `GetPatternLineInfo(index)` getter once for
each of the nine indexed pattern objects in the already-open CLO 2026.1.310
workspace. The getter returned successful JSON for all nine. Every returned
line sequence was closed and continuous, and every reported bounding box
matched the returned endpoints. Eight of nine line sequences match a
hash-pinned source contour labeled `SEW` by the source DXF at the fixed
0.001 cm threshold. No returned sequence matches any source contour labeled
`CUT` within that gate. This is geometric correspondence; the CLO API does
not assign CUT/SEW semantics, so no manufacturing role is inferred from a
pattern name or line index.

The one remaining API index, `3`, returned a closed four-line shape with a
3.0001 × 3.0001 mm bounding box. Its best direct-frame comparison is 117.2061
mm from source contour 7 (`SEW`); its closest source CUT contour is 130.7948
mm away. No within-gate source match exists. Its four reported line lengths
also differ from straight endpoint chord lengths by as much as 0.2079 mm,
consistent with the documented lack of curve-control data but not enough to
identify the shape. No source piece identity is assigned to it.

For the eight matching paths, maximum symmetric source-to-API residuals are
0.000140–0.000246 mm (0.0000140–0.0000246 cm), well inside 0.001 cm. The
shortest best CUT comparison is still 14.1423 mm, far outside the gate. The
source-to-API comparison used only the unit conversion supported by the CLO
documentation (source cm × 10 = API mm), with no fitted translation,
rotation, scale, or reflection. The API returned line counts
`33, 33, 31, 4, 4, 58, 58, 44, 44`; source sew-curve vertex counts align with
eight of those paths, while the unmatched index 3 remains unexplained.

This advances only the API-evidence subgate: exact-build boundary coordinates,
per-line lengths, line counts and bounds can be read. It does not clear any
V03 acceptance criterion or establish a format/profile compatibility claim.
It does not tell whether the CUT discrepancy arises during CLO import,
internal representation, API exposure, export, or piece-index association.
The previous S574/S575 generation-one round trip still fails the unchanged
0.001 cm CUT-geometry subgate. Rights and local handling remain settled by
the maintainer's written confirmation. All other V03 gates, all-seven V02,
legacy DXF behavior, protected export identities and claim limits remain
unchanged.

## Evidence and method

- CLO build shown in the live UI: `2026.1.310`; nine patterns returned with
  names `0` through `8`.
- The exact script was statically reviewed before one run. It calls only
  `GetPatternCount`, `GetPatternPieceName(index)`, and
  `GetPatternLineInfo(index)` and writes its JSON only to the S580 named
  folder on `C:`. Script SHA-256:
  `976260C34C2ECD7E0085E57CD61020E91792200D6438758CD931BF0F77A6CB65`.
- Raw API response JSON:
  `C:\G04-CLO-DXF-Exchange\S580-clo-line-info-runtime\Evidence\pattern-line-info.json`;
  309,175 bytes; SHA-256
  `B5B199F4DD85D538631BB78BD066E843483DB7F60EDB0D6193FFBC4F8E1C5878`.
- Actual live CLO screenshot:
  `C:\G04-CLO-DXF-Exchange\S580-clo-line-info-runtime\Evidence\clo-s580-run.jpg`;
  SHA-256
  `CA506B27CD5D5F47A9024D7908054EB205620F445CC709FB199D41F49AB9161D`.
- Pinned source: `polo-source-m.dxf`, SHA-256
  `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
  The S574 derivative report confirms its CUT contours were converted to
  endpoint-identical connected LINEs without changing source coordinates.
- Reproducible comparison helper:
  `compare-line-info.mjs`. It reads the pinned source and API JSON, validates
  the nine-result schema, checks continuous/closed line sequences, endpoint
  bounding boxes and endpoint-derived lengths, then computes symmetric
  vertex-to-segment residuals to each source CUT/SEW contour. It does not fit
  a transform or promote source layer labels into CLO semantics for
  acceptance. The report also has a separate bounding-box-minimum translation
  diagnostic; it is excluded from direct match counts and gates.
- Comparison helper SHA-256:
  `82289984BA1A2864EF1A3D05D80EEC0023331F3230C90AA06FD1712A8F4E1BB7`.
- Machine-readable output:
  `C:\G04-CLO-DXF-Exchange\S580-clo-line-info-runtime\Evidence\source-boundary-comparison.json`;
  SHA-256 `165A6E074B0E58EA783AA61C0245B023029803165B0DFC514477D95BA3271EA5`.
- Comparison stdout summary:
  `C:\G04-CLO-DXF-Exchange\S580-clo-line-info-runtime\Evidence\comparison-run-summary.json`.
- All CLO-import/export/project and rendered evidence remains under its named
  `C:\G04-CLO-DXF-Exchange\S580-clo-line-info-runtime` or S574 folder. The
  app stayed open. No DXF was re-exported, project saved, pattern mutated,
  source cut geometry edited, or proprietary project member decoded.

## Verification, board, and next action

- S580 start/exit board replay: 3433→3435→3437. The validated exit evidence
  and comment are recorded at revision 3437. G04-V02 remains Done and
  G04-V03 remains In Progress.
- `node --check compare-line-info.mjs` passes. The analyzer completes with
  9/9 successful, continuous and closed line sequences; 9/9 endpoint-derived
  bounds match; 8/9 reported lengths match their straight endpoint chords
  within 0.001 cm; 8/9 source SEW geometry matches; 0/9 source CUT geometry
  matches. Script allowlist, result structure and C:-only destinations were
  manually verified.
- `npm run control-center:test` and `git diff --check` are required at the
  durable exit. No production source or tests changed, so the full repository
  coverage/build gate is not due for this evidence-only slice.
- Start time 2026-10-09 05:05:10 UTC; exit time 2026-10-09 05:20:21 UTC;
  elapsed 15m11s. Approximate time: implementation/analysis helper 3m20s;
  focused CLO/API and geometry verification 6m45s; durable packet/state/board
  and focused gates 5m06s; external-agent waits 0m; maintainer-decision time
  0m.
- No independent delegation was safe for a single-app exact-build query.
- Current goal record was checked at this normal slice boundary: it remains
  active and its objective matches EPIC-17/G04 through safe merge. It remains
  needed until all admitted criteria and merge gates are complete.
- **Next:** reserve S581 after refreshing Git/history/board. Use the distinct,
  documented read-only `GetPatternInternalShapePoints` getter in the existing
  CLO session to determine whether the source CUT geometry is exposed through
  internal-shape data. Respect its separate pseudo-bounding-box frame; compare
  only using an evidenced coordinate mapping and the unchanged 0.001 cm gate.
  No export/project save, source or pattern mutation, proprietary decoding, or
  scope/gate change. Keep CLO open.
