# EPIC-17 / G04 V03 — Polo generation-one CUT entity map — Slice 575 exit

## Result

S575 answered whether the missing source CUT geometry could still be present in
S574's saved CLO generation-one DXF as another path/entity form. It cannot be
found within the unchanged **0.001 cm** geometry gate. All nine source CUT
contours miss in every searched block; no CUT path has a qualifying match.
This confirms loss or transformation beyond tolerance somewhere in the tested
combined source→CLO route. It does not attribute that change specifically to
CLO import versus CLO export.

The nine source SEW contours each have a unique exact match that associates the
source pair with one output block (`0_M` through `8_M`). The audit applied every
model-space INSERT transform (all identity transforms in this file), searched
all nine blocks, retained numeric layer labels without assigning semantics,
and tested closed/open POLYLINE and LWPOLYLINE entities, direct LINEs,
same-layer and all-layer connected components reconstructed from open paths,
and all-layer connected networks reconstructed from every path-bearing entity.
The DXF contains no ARC, CIRCLE, ELLIPSE or SPLINE path entities and no
nonzero polyline bulges.

The blocks also contain isolated POINT entities. Three POINTs coincide within
the gate with source CUT vertices in each of the two trouser-leg blocks; the
other seven cuts have zero such vertex matches. Isolated POINTs do not encode
an ordered contour, and none of the nine CUT contours has every vertex
represented by those markers. The file also has TEXT records, which are
non-path entities. These observations do not establish manufacturing layer
semantics.

This slice performs no new CLO import/export, production edit, pattern/stitch
change, geometry adjustment, tolerance or acceptance change, export baseline
change, or compatibility claim. The combined route remains failed at the
geometry subgate; all other V03 gates and all-seven V02 acceptance/holds remain
unchanged. Product-development use and local-only processing remain settled by
the maintainer's written confirmation. The existing CLO session stays open.

## Inputs and reproducible evidence

- Source Polo M: `C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Input\polo-source-m.dxf`, 24,261 bytes, SHA-256
  `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
- Exact CLO generation-one output: `C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Output\polo-line-chain-gen1.dxf`, 117,450 bytes, SHA-256
  `346F38A02748F96247716D9E5A992912CC018CB2EEB4506C092C4F43EEDAF1E3`.
- Repeatable entity/path audit: `analyze-entity-map.mjs` in this packet directory. It reads those hash-identified C:-only fixtures and writes only to `C:\G04-CLO-DXF-Exchange\S575-polo-output-entity-map\Evidence\polo-gen1-entity-map.json`.
- JSON report SHA-256: `3F0A79FAC29E176AD4B56FD448AEDC44042F512109D76F5DC9DF162E13256C47`.
- Entity inventory: nine model-space INSERTs and eight TEXT entities; their nine blocks contain 45 POLYLINEs, 979 VERTEX subentities, 979 POINT entities, nine LINEs, and 27 TEXT entities. By block, the report records entity type, literal layer, open/closed status, placement transform, path candidates, topology, residual and exact SEW association.
- Matching uses the paired exact SEW path to identify a block, then checks CUT against that block and all other blocks. The comparison uses symmetric source-vertex-to-output-segment and output-segment-endpoint-to-source-segment distances. Since every CUT already has a sampled lower-bound residual greater than 0.001 cm, no unmeasured interior distance can reverse a failed candidate into a pass. Connected components use 0.00001 cm Euclidean endpoint proximity only to build adjacency; original segment coordinates are preserved for distance comparison. Both same-layer and cross-layer path networks were searched, including closed path edges.
- Summary: 9/9 unique paired-SEW block associations; 0/9 unique CUT path matches within tolerance anywhere; 9/9 CUTs have no within-gate path anywhere; 0/9 source CUTs have all vertices represented among paired-block POINT markers; zero ambiguous SEW block associations.

## Decision and next action

S575 closes the “CUT exists under another entity/path” hypothesis for this
exact S574 generation-one file. Do not repeat the connected-LINE trial or infer
numeric layer roles. The next slice should isolate the source-to-receiver stage
using already hash-pinned source and gen1 evidence, and propose one distinct
technical diagnostic only if it can separate the product-written input from
the receiver's imported/exported geometry without relaxing the 0.001 cm gate.
No production change follows from S575 alone. Retain all V03 technical gates,
all-seven V02 acceptance, legacy DXF behavior, and protected export identities.

## Verification and durable state

- Admission commands were applied through the validated Control Center CLI at
  board revisions 3413→3415; G04-V03 remained In Progress. Exit commands add
  the evidence and decision at revisions 3415→3417, with no status change.
- Start and exit preflights verify the current board status and evidence; both
  replay wrappers recognize already-applied commands and prevent duplicates.
- Verification passed: analyzer and preflight/replay `node --check`; admission
  and exit command preflights through `applyBoardCommand`; the replay guard
  confirmed the admission was already applied and prevented duplication;
  `npm run control-center:test` (42/42); `git diff --check`; and deterministic
  report regeneration with the same report SHA above. No production
  source/tests changed, so the global repository coverage/build gate is not
  due.
- No independent delegation was safe for this single-file mapping/audit;
  external-agent waits 0 minutes.

## Slice timing and next gate

- Started 2026-10-09 04:36:23 UTC from S574 commit
  `96787c16cfb557c19d902e21edac3b2801837037`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Unique slice number: 575; highest assigned number at admission was 574.
- Elapsed slice time: 2026-10-09 04:36:23–04:45:04 UTC (8m41s): implementation
  and entity analysis approximately 5m; focused verification and durable exit
  approximately 3m41s; external-agent waits 0m; maintainer-decision time 0m.
- **Next gate:** admit a distinct source-versus-receiver-stage diagnostic from
  this confirmed entity omission. Keep the profile identity and all acceptance
  gates as recorded; do not claim exact compatibility or V03 completion.
