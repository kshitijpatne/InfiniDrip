# S629 read-only independent review handoff

## Slice and objective

Slice 629 is auditing source-authored `MARK_*` geometry against the already-produced S628 CLO 2026.1.310 DXF-AAMA export for the exact one-size Woven zero-vent fixture. Independently determine, per source piece and mark entity, whether output geometry directly represents the same geometric mark within 0.001 cm. Use S628's input, output, reports, and source parser. Do not operate CLO or create another exchange.

## Why delegation is safe

This is a read-only independent interpretation check on immutable S628 files. It has no source, product code, board, output fixture, or shared working-tree ownership. Codex owns any implementation, decision, and final evidence. Require only directly measurable correspondence; report ambiguity as unresolved.

## Worktree and files

Use a separate detached worktree at the exact S628 commit `f5e284fcdd1a11e63ac161c938a1218aab5997bf`.

Read `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, this handoff, `docs/research/epic17/S628-named-block-piece-identity-pilot/S628-exit-packet.md`, and `analyze-named-block-roundtrip.mjs`.

Read-only C: inputs:
- `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Input\woven-zero-vent-named-piece-blocks.dxf`
- `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Output\woven-zero-vent-named-piece-blocks-clo-export.dxf`
- `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Evidence\named-block-preflight.json`
- `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Evidence\named-block-roundtrip.json`

No files may be edited, generated, or saved. Do not modify board state. No export or import operations.

## Exact question

For each source piece/block and every source entity on a `MARK_*` layer, identify source type/layer/coordinates/attributes, the plausible corresponding geometry in that piece's output block, direct coordinate/shape residuals under the existing 0.001 cm threshold, and whether a one-to-one assignment is justified. Distinguish exact geometric preservation from tessellation/conversion, candidate-only proximity, absent geometry, and unresolvable ambiguity. Output entities use numeric layers; use them only as locators. Do not assign layer semantics. In particular inspect source `LINE`, `CIRCLE`, and `POINT` mark types and output `LINE`, `CIRCLE`, `ARC`, `POLYLINE`, `POINT`, `TEXT` and related entities. Exclude the source-bound CUT/SEW outlines from being counted as marks.

Do not conclude that a mark's apparel meaning, industrial-profile semantics, visibility/readability, or V03 acceptance passes from shape coincidence. No new external research is needed. Do not suggest a design decision or acceptance change.

## Return contract

Return concise JSON followed by the exact signal `WORK FINISHED`. JSON fields:
`status`, `summary`, `source_hash`, `output_hash`, `per_piece_marks` (each source mark and candidate/residual/disposition), `ambiguous_cases`, `method_limits`, `recommended_next_measurement`.

The review is read-only, so report `changed_files: []`, `tests_run: []`, `coverage: "not applicable"`. Do not claim V03 is complete.