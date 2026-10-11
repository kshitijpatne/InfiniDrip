# S681 exit — source-bound DXF mark identity

## Result

The source exporter already drew mark shapes on typed `MARK_*` layers, but it
dropped each mark's source name and optional label. S681 adds those identities
to the candidate package sidecar. Package schema is now version 2. Every source
mark record has a stable ID scoped to recipe and piece role, its source name,
kind, DXF entity type and layer, source-space geometry, optional text and role,
and its one-based entity position in the exact DXF. The DXF hash and manifest
revision bind that table to the drawing.

The verifier checks each mark ID/name, entity position, type and layer against
the drawing's parsed entity sequence; duplicate IDs/positions and missing or
mismatched target entities fail closed. It does not treat the sidecar as a
replacement for the visible mark.

## Verification and output evidence

- Focused DXF, package, consumer and protected-export suites: **45/45 passed**
  across seven files.
- Changed production module coverage: **100% statements, branches, functions
  and lines**.
- `npm run build` passed; existing large-chunk advisory only.
- `npm run control-center:test` passed **42/42**.
- Every grade row for all seven recipes produced exact source-mark records.
  The canonical 73-row S330 matrix generated and verified all packages.
- All 73 S681 drawing hashes are byte-identical to their corresponding S680
  drawings. This change alters manifest metadata only; legacy export bytes and
  protected identities are unchanged.
- Fresh SVG/PNG diagnostic output was rendered from the generated DXF entity
  records. The contact sheet and representative outputs were reviewed; the
  image hashes match the evidence record. These are source renders, not an
  external receiver's screen.
- Evidence is restricted to `C:\G04-CAD-Interchange\S681-mark-identity`.
  Evidence JSON SHA-256:
  `b7322fce9e2aa7c7d5f62a26a5eaee4ff35ff1a440d662f0bf60eee2c2c7dd01`.
  Canonical S330 matrix SHA-256:
  `69627e68f8d8e1c724c91d23fb885cbbc6b9fbccc42512d1d4c3e19ef14d8739`.
  Contact sheet SHA-256:
  `d7003e5201488210173b39711632cefffb7502b1416340419b2f5a538dd76dae`.

## V03 disposition and next action

S681 closes the source-side mark identity omission only. No external receiver
was run and no V03 gate is promoted. Existing evidence still shows independent
receiver/profile failures: CLO's tested route misses geometry/marks and
malformed-input handling; DGS imports no registered pattern; LibreCAD's R12
save removes the centimeter declaration; and generic OpenCAD's malformed-file
path accepts invalid input and is not an industrial apparel profile. These
results do not become source-code passes by changing the exporter. No new CAD
application or repeat of a failed app/mode/format is queued.

Use the already-recorded receiver evidence for a concise V03 matrix. If a
source change is indicated, tie it to a specific failing criterion and prove
it in code first. Keep all seven recipes, supported options/grades, `0.001 cm`
geometry, unit and identity binding, malformed-input rejection, repeatability,
readable output, rights/profile review, legacy bytes and protected identities
unchanged. V03 remains In Progress. This slice does not claim apparel-standard
conformance, physical fit, factory acceptance or production readiness.

## Slice ledger

- Started 2026-10-10 18:13:08 UTC from clean S680 `5042e110`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  Board start replay 4037→4039; highest prior slice 680; S681 unique.
- Closed 2026-10-10 18:21:52 UTC; exit replay 4039→4041.
- Elapsed about 8m44s: implementation/source review ~3m; focused verification,
  coverage and build ~1m; package generation/render/hash review ~1m; docs and
  board closeout ~1m; external-agent wait ~1m for bounded Sol review;
  maintainer-decision time 0.
- Full repository/global coverage and final integrated output gate remain for
  the settled Epic/PR candidate. No acceptance threshold changed.
