# S629 independent review return

Contributor: Claude Code CLI, model `claude-opus-5-5`, `xhigh`, normal `--print` mode with plan/read-only restrictions. Exact handoff: `claude-handoff.md`. The detached worktree started at S628 `f5e284fcdd1a11e63ac161c938a1218aab5997bf`; it was clean and removed after return. The contributor changed no files and performed no import/export. Explicit terminal response: **WORK FINISHED**.

## Independent findings

- The reviewer manually matched 13 source LINE marks to separate open two-vertex output POLYLINEs in the same named piece blocks. Maximum observed endpoint residual was `0.00002 cm`; CLO changed entity type and numeric layers do not retain source mark names. Four outer/inner stand and upper/under collar placement lines coincide with source and output CUT/SEW boundary segments. They exist as separate coincident DXF entities but cannot be distinguished by layer semantics or rendered appearance alone.
- All eight source button CIRCLE marks became closed 12-vertex polylines. Maximum vertex radial error is about `0.000026 cm`; 30-degree chords have about `0.0051 cm` sagitta, above `0.001 cm`. This is a visible-representation conversion, not a whole-curve tolerance pass.
- The eight source buttonhole POINTs do not survive as discrete output POINT entities. Seven lie on a single long output polyline which is already the candidate for a different source line mark; it is candidate-only shared coincidence, not one-to-one buttonhole identity. The remaining inner-stand point has no mark geometry at the source location; the nearest output outline is about 1 cm away.
- The saved S628 import/reimport overviews are too zoomed out to establish individual mark readability. No apparel mark semantics or V03 acceptance is claimed.

## Limitations and Codex reconciliation

The reviewer did not run shell tools and did not recompute hashes; it hand-read code/DXF records and calculated approximate residuals. Codex's deterministic local analyzer recomputes and pins both S628 DXF hashes, includes the matching geometry, direct CUT/SEW outline exclusion, one-to-one checks, output path lengths, and curve sagitta. Codex confirmed the review's findings. The local source-bound analyzer locates the four coincident placement marks on both CUT and SEW boundary segments; the reviewer described the visually corresponding seam boundary. This difference does not alter the disposition: the marker geometry is coincident with an outline and has no recoverable profile layer identity.