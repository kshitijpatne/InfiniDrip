# EPIC-15/G02 — Slice 237 exit

**Status:** Slice 237 complete; F03 remains In Progress. Slice 238 is next.
**Control Center:** F03 began at revision 286; Slice 237 evidence is attached to
F03 before its review transition. The full F03 contract is in
`F03-CONSTRAINED-EDIT-S237.md`.

## Delivered

- Added a deterministic, recipe-agnostic semantic edit model. Corner IDs name
  their adjacent recipe edge names; curve-control IDs name an edge and control
  slot. Every path segment is URI-encoded. Duplicate names and open anchor
  junctions fail explicitly.
- Added canonical source SHA-256 fingerprints, exact centimetre anchor moves,
  strict operation validation, immutable append/undo/redo snapshots with a
  30-entry bound, explicit source rebase, and operation merge rules. Each move
  is one anchor; a gesture batch is appended atomically as one undo step.
- Replayed edits over each recipe's registered size run and gated pattern,
  spec, nesting and export readiness per size. Invalid runs are not silently
  clamped or partially exported.
- Validated finite coordinates and graded measurements, closed loops, non-zero
  area, non-adjacent crossings of the exported sewing-outline polyline, named
  `x=0` fold geometry, recipe-owned stitch/ease checks, `recipe.checks`, finite
  one-decimal POM output, and finite optional tech-pack callout points.
- Added actionable, accessible checks to the existing Edit preview. The preview
  remains temporary and disconnected from saved style and exports; warnings
  state that the outputs remain the parametric draft. Invalid source inputs
  pause both preview evaluation and exports. Passing digital checks are not a
  fit, drape, factory or production claim.

## Verification

| Check | Result |
|---|---|
| `npx vitest run --coverage --coverage.include=src/edit/semantic-edit.ts src/edit/semantic-edit.test.ts` | 29/29 tests; semantic-edit model 100% statements, branches, functions and lines |
| `npx vitest run src/ui/view.test.ts` | 85/85 |
| Focused `src/ui/app.test.ts` Edit-preview, source-error, reset, role-switch, keyboard and drag cases | 8 relevant tests passed across the focused runs |
| `npm run build` | TypeScript and Vite production build passed |
| `node electron/verify-semantic-edit-preview.cjs` | Chromium 151 passed against the production build; three actionable issues rendered; Reset restored the valid preview |
| Parametric SVG before versus after invalid Edit preview | Both downloads: 5,997 bytes, SHA-256 `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d` |

Rendered evidence:

- Screenshot: `evidence/S237-invalid-edit-preview.png`, 118,638 bytes,
  SHA-256 `9578b14a94cac5e10010d945f0b3b3050308fcdb5d9414dd4aae15d7453309f1`.
- Repeatable verifier: `electron/verify-semantic-edit-preview.cjs`, SHA-256
  `2404b104892627f98a3522eed6e781b65c8ba337ac964122449b90c5d5665b3e`.

The proof drives the built app into Export, downloads the unchanged parametric
SVG, moves an Edit handle to invalid geometry, captures the visible alert, and
downloads the SVG again. The hashes match exactly, and Reset returns the Edit
preview to its valid state.

## Slice boundaries and remaining work

Slice 237 does not persist semantic operations or connect them to the current
style. Slice 238 must replace the temporary editor path with saved operations,
compute the source fingerprint from the exact fresh, unedited base draft on each
evaluation, append each drag/keyboard gesture as one atomic operation group,
and propagate or block dependent pattern/POM/spec/grade/nesting/view/export
outputs. It must close the S236 woven `hemTurn` and tank `shoulderWidth`
propagation gaps or explicitly keep those outputs blocked. Slice 239 owns
immutable parent-linked revisions and frozen export manifests. Slice 240 owns
the whole-repository 100% coverage, protected-export identity, browser/Electron
restart and final merge gates.

The outline intersection check uses the same sampled sewing outline as current
render/export; it can miss behavior between samples and cannot establish cloth
drape, physical fit, manufacturing feasibility, or factory acceptance. The
full repository coverage and eight protected legacy export identities have not
been re-run as Slice 237 gates; they remain mandatory at Slice 240. No recipe,
physical sampling, supplier work, paid service, hosted feature, AI design
shortcut, or production-readiness claim was added.
