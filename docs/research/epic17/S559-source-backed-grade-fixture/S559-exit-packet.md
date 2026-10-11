# EPIC-17 / G04 V03 — Source-backed per-size fixtures and CLO trial — Slice 559 exit

## Result

Slice 559 closes the question of whether current product source can produce
repeatable, source-linked per-size pattern fixtures. `gradeRun` re-drafts from
the repository's current grade tables; the seven recipes use four distinct
rule sets: Tee/Fitted/Tank/Polo share `TSHIRT_GRADE`, Woven uses
`WOVEN_SHIRT_GRADE`, Skirt uses `SKIRT_GRADE`, and Trouser uses
`TROUSER_GRADE`. Each supports a five-size run (XS/S/M/L/XL). These rules are
current digital product defaults; they are not physical-fit evidence or an
industry grading standard.

The fixture generator produced 35 per-size DXFs (seven recipes × five sizes)
under `C:\G04-CLO-DXF-Exchange\S559-source-backed-grade-fixture`, alongside a
manifest with source hashes, measurements, piece roles, generated file hashes,
and applicable code checks. The current legacy writer receives one size's
`Piece[]`; it writes the geometry on CUT/SEW layers and has no size, grade-rule,
or multi-size relationship input. The files are therefore real
source-generated per-size specimens, not one genuine graded DXF or Rule File.

Using the already-open CLO 2026.1.310 (r58944) session, the Tee XS file was
imported once with DXF-AAMA, centimeters, 100%, no rotation, curve points on,
curve optimization off, CUT/SEW swap off, notches Both at Ratio. The visible
2D result contains the three expected tee pieces, with cut/sew contours
displayed. It was exported once as DXF-AAMA, Graded Nest selected, centimeters,
100%, no rotation, Duplicate Notch on Seam Allowance enabled, other optional
toggles disabled. CLO reported no error.

An exact cyclic coordinate comparison found all 6/6 Tee XS CUT/SEW outlines
within the existing 0.001 cm tolerance; maximum coordinate delta is
0.000017 cm. The output contains three pattern blocks named `0_M`, `1_M`, and
`2_M`, although the source file was generated from the XS grade step. The
one-size file lacks size metadata, and the observed CLO path assigns M in the
exported identity. The output header is `$ACADVER=AC1009` and does not include
`$INSUNITS`; neither fact establishes AAMA edition or unit semantics by
itself. The selected Graded Nest setting does not create missing sizes or
grade rules. Thus the practical run proves a narrowly successful Tee XS
geometry round-trip at a user-selected centimeter scale, but **fails the
size-identity subgate** and does not test/clear graded nesting, grade-rule
interchange, grade retention, all-seven round trips, semantics, marks, or the
known Polo contour gate.

## Scope and decision effects

- **Pass, narrow:** seven-by-five per-size fixtures are generated from current
  repository grade data; the Tee XS trial preserved all six measured contours
  within tolerance through the specified CLO interface route.
- **Fail:** in that same trial, the exported block size identity is M rather
  than source XS. This is visible and recorded, not inferred from DXF version.
- **Still unknown/held:** how a profile-compliant graded DXF/Rule File encodes
  named sizes and point-grade relationships; whether CLO can consume such a
  fixture from this product; whether size/piece IDs, CUT/SEW semantics and
  marks survive a grade-bearing round trip; whether options can be represented
  correctly; and whether the other six recipes pass a grade-bearing exchange.
- **Still failed from prior evidence:** five Polo CUT contours exceed the
  unchanged 0.001 cm contour gate; tested CUT/SEW output has ambiguous mixed
  layer semantics; direct mark matches remain incomplete; the malformed-input
  trial was silently accepted. See S557/S558 and the current matrix.

No permission question remains. The maintainer's written confirmation covers
product-development DXF evaluation and local processing. All exchange input,
output, manifest, and screenshots remain under the one named C: folder. The
pre-test CLO session copy is preserved there; CLO remains open for remaining
V03 work. No source pattern geometry, production code, legacy exporter
behavior, protected export identity, tolerance, criterion, or claim changed.
No physical fit, factory acceptance, or production readiness is claimed.

## Evidence

- Fixture source/generator: `create-per-size-fixtures.mjs`; source-generation
  receipt: `C:\G04-CLO-DXF-Exchange\S559-source-backed-grade-fixture\fixture-manifest.json`.
- CLO input: `tee-XS.dxf`, 6,721 bytes, SHA-256
  `565d1413ecf213900017f96a3f6e3e5b3686c511cac2b644cdde0878141fc030`.
- CLO output: `tee-XS-clo-output.dxf`, 45,000 bytes, SHA-256
  `26d5f9631fae6c63b0661ebcaf5acd1159367816643dbfa0743bed04ebaaa952`.
- Comparison: `tee-xs-roundtrip-analysis.json`; six measured outlines pass,
  largest cyclic coordinate delta `0.000017 cm`; output block suffixes show
  M rather than XS. Its SHA-256 is recorded by the CLI after final replay.
- Render: `tee-xs-import-render.jpg` shows the actual CLO 2D import.
- CLO safety copy: `clo-session-before-grade-test.zprj`.

## Next action

Do not repeat the one-size Tee trial. Continue V03 with a narrowly defined
source/format investigation into size identity and grade-bearing profile
encoding, using CLO's documented Rule File/graded-DXF path only after the exact
representable input is established. Resolve the known contour and semantic
failures only through specific new evidence. Keep all seven recipes, unchanged
gates, legacy behavior, and protected export identities. G04-V03 stays In
Progress; V01/V02 remain Done.

## Verification, board, and time

- `create-per-size-fixtures.mjs` generated 35 files; the manifest records all
  seven recipes and five sizes each. Tee, Fitted, Tank, Polo and Skirt checks
  passed for the generated rows where checks are defined; Woven and Trouser
  recipes expose no recipe checks (`checkCount: 0`), so no sewing validation is
  implied.
- `analyze-clo-xs-roundtrip.mjs` passed its source/output identity assertions
  and 6/6 outline/tolerance assertions; both helpers pass `node --check`.
- Screenshot inspection confirmed visible expected Tee pieces. `git diff
  --check` passed. `npm run control-center:test` passed 42/42; canonical board
  command preflight passed and validated replay advances the board to 3353.
- At the normal slice checkpoint, `get_goal` returned **active** with the
  original G04 objective through safe merge; its wording remains aligned and
  the admitted objective is still needed. No UI resume is needed.
- Started 2026-10-09 00:06:03 UTC from S558 `3965653`, board revision 3349;
  exit time: 2026-10-09 00:20:01 UTC. Elapsed active time 13m58s: source
  inspection/fixture generation ~3m; CLO interaction/import/export/capture
  ~4m; analysis and focused verification ~4m; durable packet/state/board
  closeout ~2m58s. External-agent waits 0m; maintainer-decision time 0m. No
  safe disjoint subtask existed because the only receiver trial required a
  controlled single-session import/export and the rest was directly coupled
  to its output. Full repository coverage is not due: production code/tests
  did not change and this slice is not independently releaseable.
