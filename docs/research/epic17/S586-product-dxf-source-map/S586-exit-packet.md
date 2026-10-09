# EPIC-17 / G04 V03 — Product DXF source map — Slice 586 exit

## Result

S586 completed a read-only source-to-output map for the seven retained
M/default recipe fixtures. The repeatable audit verified the SHA-256 identity
of all seven product DXFs and all seven corresponding CLO DXF-AAMA generation
two outputs before parsing them. Its machine report is
`C:\G04-CLO-DXF-Exchange\S586-product-dxf-source-map\Evidence\product-source-profile-map.json`
(SHA-256 `DAB581580F3F21FF11E6F31E05CA979F8A3169B60D46B7405784CCBC732AB87D`).
The current `src/export/dxf.ts` and `src/export/pattern-mark.ts` match their
fixture-generation revision exactly, so the source findings apply to the
verified files.

## Directly encoded in product source

- The current writer emits only `SECTION / ENTITIES / ENDSEC / EOF` in an
  R12-style DXF. It writes closed `POLYLINE` entities on literal `CUT` and
  `SEW` layers and writes marks on `MARK_<kind>` layers. The app stores
  coordinates in centimetres, flips Y against the layout height, and rounds
  output coordinates to 0.001 cm.
- Neither DXF header `$ACADVER` nor `$INSUNITS` is emitted. No layer table,
  named blocks/inserts, text attributes for piece/revision identity, native
  grading/rule records, or mark names/IDs/optional labels are serialized.
  Button marks are circles; line marks are lines; other point marks are
  points. These statements describe the product's current encoding; they do
  not claim a receiver assigns the same semantics.
- The export path accepts the selected `Piece[]` and allowance. It has no
  revision, size-grade relationship, or exchange-profile argument. All seven
  inspected fixtures are size M with default options.

## Observed source-to-CLO output map

Across seven recipes and 41 named source pieces, the verified cohort contains
41 CUT contours, 41 SEW contours, and 100 source marks. Exact direct-geometry
comparison at 0.001 cm matched 36 CUT contours and all 41 SEW contours. The
five CUT contours without direct matches are all in Polo; S516/S536/S585
independently measure the five localized Polo CUT-corner losses above the
unchanged 0.001 cm gate. CLO associates all 41 pieces uniquely by SEW
geometry, but the source DXFs themselves do not emit stable piece names. This
geometry-based association is useful observed evidence, not file-encoded
piece identity.

Of the 100 marks, 22 have a direct same-kind/geometry match and 78 do not.
Those 78 are **not** proof of loss: this audit does not semantically decode
transformed, split, or receiver-generated marks. The 83 total source entities
without direct geometry matches consist of five Polo CUT contours and those
78 marks. Do not conflate the 83 all-entity count with the 78 mark-only
count.

The CLO generation-two files have nine mixed CUT/SEW semantic layer
assignments across the cohort. The source separately encodes CUT and SEW;
therefore that observed mixing is not evidence that the current writer put
those contours on the same source layer. Nor does a numeric CLO layer label
establish manufacturing meaning. The retained S516 rendered screenshot
(`C:\G04-CLO-DXF-Exchange\S516-clo-aama-roundtrip\Evidence\11-aama-reimport-render.png`,
SHA-256 `EFF83C9EFFBA697E71FA93C559BBC663EF920580BC07ED0D9A4C91457087391E`)
was opened and reviewed: the major nine-piece Polo layout is visible; the
capture is too coarse to certify fine marks or contour tolerances.

## What this establishes—and what it does not

The product has concrete V03 source-profile gaps in explicit file units,
stable piece/revision identity, serialized mark identity/labels, and native
grade relationships. These are legitimate targets for a future additive
profile path that leaves legacy DXF bytes unchanged. They do **not** explain
the measured Polo CUT-corner loss: source CUT and SEW contours are already
separate, and the geometry-identical R2000 `LWPOLYLINE` plus `$INSUNITS`
trial also retained the same five losses (S536). S574/S575's connected-line
and line-network alternatives likewise failed; do not present another entity
encoding, units header, or mark label as a verified corner repair.

The S557 comparison's 78 non-direct mark matches do not establish which
marks, if any, were lost. The selected-size writer does not prove grades or
supported-option exchange. CLO's documented `DXF-AAMA` identity and the
maintainer's written product-development/local-processing confirmation are
already supported; the CLO route's technical round-trip still fails or is
incomplete. The unchanged V03 geometry, semantic layer, mark, grade/options,
malformed-input, rendered-detail, and representative all-seven round-trip
gates remain open. No V03 acceptance criterion, V02 state, tolerance,
protected export identity, or claim boundary changed.

## Next action

S587 should make an implementation-ready, additive source-profile contract
from already retained primary profile evidence and the facts in this map:
explicit units/version, stable piece/revision/size identity, CUT/SEW layer
semantics, mark identity/label representation, and the limit of selected-size
grade data. It must distinguish requirements documented by the chosen profile
from product-level identity metadata, preserve the existing generic writer
byte-for-byte, and carry an exact testable fixture plan. Only after that
contract is tied to the selected receiver/profile should Codex implement a
separate writer and run a materially changed exchange. The source-map work
does not justify another CLO retry of the unchanged input, and it does not
clear the Polo cut-geometry gate.

## Verification, state, and timing

- `node --check` and `node audit-product-source-profile.mjs` passed. The
  auditor hash-checked 7 source and 7 receiver artifacts, asserted 41 CUT,
  41 SEW and 100 mark entities, 36 direct CUT matches, 41 direct SEW matches,
  22 direct mark matches, 5 unmatched CUT contours, 78 marks without a direct
  match, and 83 total entities without direct geometry matches.
- Existing rendered output was inspected. `npm run control-center:test`
  passed 42/42. `git diff --check` passed. No production or test source,
  fixture, CLO output, baseline, or threshold changed; no full coverage/build
  gate is due on this evidence-only slice.
- Started 2026-10-09 06:15:19 UTC from S585 commit
  `4befb327bc027d8573b578fe1f696796af7c9bb0`. `origin/main` remained an
  ancestor; S586 is unique. Board start replay was 3457→3459; exit replay
  3459→3461 is validated and status-neutral. EPIC-17/G04-V03 remains In
  Progress and V01/V02 remain Done.
- Elapsed time, separately: evidence/source inspection 2m15s; analysis and
  report verification 1m30s; rendered review and artifact/hash checks 0m45s;
  focused Control Center/audit checks 0m20s; durable records, board replay,
  and final checks 3m05s; implementation 0m; external-agent waits 0m;
  maintainer-decision time 0m. Total approximately 7m55s. No physical-fit,
  factory-acceptance, or production-readiness claim is made.
