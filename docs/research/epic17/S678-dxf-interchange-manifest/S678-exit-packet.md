# S678 exit — exact DXF package manifest

## Result

S678 adds a versioned companion manifest for the opt-in centimeter DXF candidate. It records recipe/piece roles, selected size and grade rule, recipe options, and source stitch relationships. Its drawing digest binds the manifest to the exact DXF bytes; a canonical revision digest binds the manifest contents. Generation checks the selected grade row and re-drafts from the supplied recipe, size and options before packaging, so mismatched blocks fail closed.

This fixes a product-side identity/grade/seam-record gap in our own candidate package. It does not change the legacy DXF writer, cut geometry, construction marks, default UI output, or any protected export. It does not make metadata travel through an external application, and it is not a compatibility or standards claim.

## Verification

- Focused exporter, candidate-package, legacy, and protected regression checks: **42/42 passed** across seven files.
- Changed production module coverage: **100% statements, branches, functions, and lines**.
- `npm run build` passed; Vite emitted its existing large-chunk advisory.
- `npm run control-center:test` passed **42/42**.
- `git diff --check` passed.
- Package tests generate and verify every registered recipe at every grade row, check deterministic option-key ordering, and reject grade/block mismatches and altered DXF/manifest/schema/malformed values.

## Generated and reviewed evidence

Seven M-size packages were generated under `C:\G04-CAD-Interchange\S678-package`. Each manifest verifies against its paired drawing. The seven candidate drawing SHA-256 values exactly match S677's reviewed M-size drawings, confirming S678 did not alter geometry or visible marks. `tee-M.manifest.json` was inspected: schema `infinidrip.g04.dxf-package/1`, Tee/M identity, three piece roles, four stitch relationships, exact drawing digest, and package revision digest. The same package generator verifies all grade rows in automated tests.

The inherited S677 DXF-derived SVG/PNG review remains valid because the drawing bytes are identical. Those renders are diagnostic records, not an external receiver's output. The manifest itself is machine-readable sidecar evidence; it has not been proven to survive an import/export cycle.

## Gate disposition and next action

S678 passes its source-side package/identity/grade/seam-binding checks. V03 overall remains **unproven**: receiver preservation, supported-option exchange, output geometry and marks, malformed-input behavior at the receiver, repeatability, and readable rendered output still need evidence. Keep all V03 acceptance, thresholds, seven-recipe coverage, supported-option coverage, and protected identities unchanged. No gate is promoted based on the sidecar alone.

Next: reconcile the selected receiver's already-recorded import/export output against this exact package and existing fixtures. Identify the precise loss in our generated input versus receiver behavior, then make only evidence-backed product-side changes; do not select another application or vary formats/settings without a named gate. If the current receiver cannot preserve a required property, record that measured limit and stop that route rather than infer compatibility.

## Slice ledger

Started 2026-10-10 17:51:58 UTC from clean S677 commit `280580ad0a940cb7b7819f2ac1d21bc804c783ad` on `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Slice 677 was highest and S678 unique. Board start revision 4025; validated start replay reached 4027.

Closed 2026-10-10 17:56:42 UTC. Elapsed about 4m44s: implementation and review about 2m; focused checks, coverage, build, and board checks about 17s of measured process time; package generation and evidence inspection about 1m; documentation/board closeout about 1m27s; external-agent waits 0; maintainer-decision time 0. No full repository gate was run; reserve it for the settled integrated Epic candidate. No physical fit, factory, standards-conformance, or production-readiness claim.
