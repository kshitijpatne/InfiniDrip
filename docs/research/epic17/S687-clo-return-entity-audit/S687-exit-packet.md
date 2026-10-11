# S687 exit — CLO returned-entity audit

## Result

The S685 mark misses are not explained by the comparator overlooking returned
`LINE`, `POINT`, or `CIRCLE` entities. S687 verified the exact S685-pinned
source, returned drawing, and comparison-report SHA-256 values, then parsed all
nine returned piece blocks. The blocks contain 125 `LWPOLYLINE` entities and
zero `LINE`, `POINT`, or `CIRCLE` entities. Their layer names are numeric, so
the source's named mark layers are absent in those returned blocks.

The audit accounts for all eight S685 misses: one cut-line, three buttonhole
points, and four collar notches. Their existing closest returned-geometry
distances remain `13.0384 cm`, `1.499979 cm` (each of the three points), and
`0.81616–0.89717 cm`, respectively, against the unchanged `0.001 cm` gate.
Because the full piece blocks contain no separate typed mark entities, the
polyline-only comparison did not omit a hidden `LINE`/`POINT`/`CIRCLE` layer of
the output. This confirms the measured missing/displaced geometry for this
one saved CLO return; it does not prove what another CLO route would do.

The audit found no comparator fix and no source-encoder change that is proven
to restore the eight marks. It does not establish that every part of the
product exporter is free of defects; it establishes that the reported S685
misses are present in the exact saved receiver output. No product source,
receiver file, acceptance criterion, or protected export was changed. No
application was opened and no import/export was repeated.

## Evidence and reproduction

- Source: `C:\G04-CAD-Interchange\S683-current-package-clo-roundtrip\polo-default-M.dxf`,
  SHA-256 `a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c`.
- Returned CLO drawing:
  `C:\G04-CAD-Interchange\S684-current-package-clo-import\polo-default-M-clo-roundtrip.dxf`,
  SHA-256 `f54d6f3c221d8478e13fdae703f0e69d466882962620fb2bc4014becd5fbe180`.
- Prior comparison:
  `C:\G04-CAD-Interchange\S684-current-package-clo-import\S685-dxf-comparison.json`,
  SHA-256 `4c2ce7c9d8dcaf8a4788948c6539498aba19ebe0f47ff5c535c273226a41dd9b`.
- Reproducible all-entity audit:
  `inspect-returned-mark-entities.mjs` → `S687-returned-entity-audit.json`.
  The helper reads the existing C: files only and stops if any pinned digest or
  the expected eight-miss count changes.

## Gate effect and next route

This closes only the comparator-omission question for the saved S685 file. It
does not clear V03. The tested CLO route still fails units, five CUT outlines,
and eight visible marks; returned identity remains unproven because a returned
C04 sidecar was not tested. Other available tested routes retain their own
recorded failures. No safe source-code correction is supported by this audit.

Do not run another representation trial on the basis of this audit. Reopen
receiver work only if existing evidence names a specific source serialization
defect or a different already available, rights-cleared receiver/profile that
could pass the fixed industrial exchange contract. Then name the distinct
gate first and run one decisive exact-file pilot. Keep all-seven recipes,
supported options/grades, 0.001 cm, mark/identity, malformed-input,
repeatability, readable-output, legacy-byte and final merge gates unchanged.

## Verification and slice ledger

- Start: 2026-10-10 19:09:53 UTC from clean S686 `a6543cf1`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor;
  S687 was the next unique slice. Board start replay: 4061→4063.
- `node --check inspect-returned-mark-entities.mjs`: passed. The audit helper
  reproduced all eight distances and pinned hashes; returned named-piece
  counts were 9 blocks, 125 polylines, and zero typed line/point/circle
  entities.
- `npm run control-center:test`: 42/42 passed. `git diff --check` passed.
  No production code changed; changed-code coverage is not applicable. The
  full repository gate remains due only on the settled integrated candidate.
- Board start/exit replay was 4061→4063→4065 through the validated command
  layer. EPIC-17/G04-V03 remains In Progress; acceptance is unchanged.
- Implementation: no product-code implementation; diagnostic and report
  about 4 minutes. Focused verification and closeout: about 3 minutes.
  External-agent wait: 0 minutes. Maintainer-decision time: 0 minutes.
- Close: 2026-10-10 19:18:53 UTC; elapsed 9m. These time categories are
  approximate wall-clock accounting, not instrumented CPU timings.

No physical-fit, factory-acceptance, or production-readiness claim is made.
