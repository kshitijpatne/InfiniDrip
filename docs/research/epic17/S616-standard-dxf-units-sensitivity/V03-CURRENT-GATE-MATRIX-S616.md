# G04 / V03 current evidence matrix — Slice 616

S616 changed only CLO Standard-DXF import Unit to Millimeter on the same Polo
M source used by S614/S615. The ASTM export geometry is identical to the prior
Centimeter run (only filename metadata/time differs), with the same 0.1× size
loss. No V03 gate clears; see `S616-exit-packet.md`.

| V03 gate | Current disposition | Evidence and limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **No passing candidate selected** | CLO selector labels and AC1009 header do not establish a normative industrial profile or edition. | Rights-reviewed profile plus representative successful interoperability. |
| Permission/local handling | **Settled for bounded CLO evaluation** | Maintainer confirmed product-development use and local-only processing. | Keep CLO files in the approved local C: evidence folders. |
| Seven recipes/repeated exchange | **Incomplete** | S616 is one Polo M source/revision and one import/export/re-import. | Seven recipes and applicable options/grades across required repeated exchanges. |
| CUT/SEW geometry at `0.001 cm` | **Fail for tested CLO routes** | S609 AAMA passes 4/9 CUT and 9/9 SEW; five CUTs fail. S614–S616 Standard input emits the same 0.1× geometry; 8/18 exact paths match only at diagnostic 0.1 scale and ten paths have changed vertices. | Every accepted CUT/SEW contour within `0.001 cm` at true source scale. |
| Piece/revision/size identity | **Partial** | Nine blocks render, but names/order remain numeric observations, not proven persistent bindings. | Stable source piece/revision/size identity through a qualified exchange. |
| CUT/SEW roles and layer semantics | **Incomplete** | Output layers stay numeric (`1`, `84`, `14`, `87`, `8`, `85`). | Documented roles and manufacturing marks verified in round trip. |
| Marks/notches/labels/seam allowance | **Incomplete** | Re-import scene proves gross shape presence only; CLO reports seam allowance entered in Custom mode. | Source-linked readable detail, labels, notches and seam-allowance evidence. |
| Units/scale | **Fail for tested Standard-DXF path** | 100% vs 1000% scale and cm vs mm selectors all emit geometry identical to the tested 0.1× result. Source has no `$INSUNITS` or `$MEASUREMENT`. | Correct, independently measured unit behavior on qualified representative fixtures. |
| Sizes/grades/options | **Incomplete** | One Polo M base file only. | Full applicable grade/option matrix with per-file binding. |
| Malformed input | **Open** | Not tested in S616. | Reliable rejection and actionable error evidence. |
| Rendered detail | **Gross presence only** | Nine shapes visible; no acceptance of labels, marks or useful-zoom detail. | Useful-zoom review across accepted all-seven output. |
| Exact-format claim | **Not supported** | DXF-ASTM label and AC1009 header do not prove normative edition or interoperability. | Rights/profile documentation and successful all-seven round trips. |
| Legacy DXF/protected identities | **Preserved** | Research-only work; product writers and baselines unchanged. | Preserve through settled integrated Epic verification. |

## Disposition and next action

Keep V03 open. Stop repeating the same unitless Standard-DXF fixture with only
unit/scale controls changed. Compare the source's Standard-DXF data contract
against its existing AAMA path and locate a source-backed receiver/profile
route that can test geometry, semantics and identity without changing the
acceptance gates. Do not rescale exports, change cut geometry, lower the gate,
or claim compatibility; retain all-seven acceptance and every hold.
