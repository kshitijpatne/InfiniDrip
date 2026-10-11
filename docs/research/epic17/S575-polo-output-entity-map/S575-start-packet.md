# EPIC-17 / G04 V03 — Polo generation-one CUT entity map — Slice 575 start

- Started: 2026-10-09 04:36:23 UTC.
- Branch: codex/epic-17-g04.
- Start commit: 96787c16cfb557c19d902e21edac3b2801837037 (S574).
- Refreshed origin/main: a5af5e13c2e967946b3f6035fcea66ff03a5e0e0, ancestor of HEAD.
- Start board revision: 3413; EPIC-17 and G04-V03 remain In Progress.
- Highest assigned slice: 574; this reserves unique S575.

## Question and bounded method

S574's CLO DXF-AAMA generation-one file rendered and re-imported nine pieces,
but a closed-contour comparison found 0/9 source CUT contours within 0.001 cm
and exact SEW path candidates in all nine piece blocks. That result alone does
not show whether CUT geometry was omitted or retained as a different output
entity or path role. This slice audits the actual saved source and gen1 files;
it does not repeat CLO import/export or infer numeric layer meanings.

Parse the source's nine alternating CUT/SEW contour pairs and the exported
DXF's model-space entities, blocks, INSERT transforms, closed and open
POLYLINEs, LWPOLYLINEs and LINEs. For each source CUT path, match against
candidate output paths within the piece block supported by its paired exact
SEW geometry. Reconstruct contiguous LINE chains by block/layer endpoint
adjacency and test their path distances, direction, closure, multiplicity and
piece association. Record entity and layer counts, numeric labels, source
identity method, candidate residuals and unresolved meaning in a JSON report
under the S575 C:-only evidence folder.

## Acceptance and limits

- Pass the audit question only if each source CUT contour has a unique
  within-0.001-cm corresponding output path with a traceable entity and block
  association. Clearly distinguish exact geometry from inferred manufacturing
  semantics; numeric layer names alone do not prove CUT/SEW meaning.
- If source CUT is absent or cannot be mapped from available DXF entities,
  record which entity forms and layers were exhaustively checked and keep the
  candidate failed. Do not repeat an export or lower the tolerance.
- No production code, garment geometry, source stitch graph, exporter,
  acceptance criteria, protected export identities, or V02 state changes.
  No generation two or compatibility claim. CLO stays open and unchanged.
- Read only C:-folder fixtures/output. Write analysis only under
  C:\G04-CLO-DXF-Exchange\S575-polo-output-entity-map\Evidence.
- No independent contributor has safe disjoint ownership: one file-level
  mapping and single analyzer must stay under Codex review. Record no
  delegation or external wait.

## Required verification and exit evidence

Inspect S574's exact source, derivative, gen1 DXF and comparison report;
produce a deterministic C:-only entity-map report; review its per-piece and
per-layer results; retain all G04 V03 and V02 gates. Run helper syntax checks,
the focused Control Center tests, and git diff --check. A full repository
coverage/build gate is not due because this audit changes no production code or
tests. Exit packet must name the one next evidence-based action and separately
record implementation, focused verification, agent waits and maintainer time.
