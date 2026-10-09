# G04 / V03 current evidence matrix — Slice 615

S615 repeats S614's single Polo M Standard-DXF→ASTM CLO trial with import
scale changed from 100% to 1000%. Exported geometry is unchanged (only style
name and creation time differ); the 0.1× scale mismatch remains. No V03 gate
clears. See `S615-exit-packet.md` and its hash-pinned local evidence.

| V03 gate | Current disposition | Evidence and limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **No passing candidate selected** | CLO selectors, ASTM label and AC1009 header do not establish a normative industrial profile. | Rights-reviewed receiver/profile with representative successful exchange evidence. |
| Permission/local handling | **Settled for bounded CLO evaluation** | Maintainer confirmed product-development use and local-only processing. | Keep CLO artifacts in the approved local C: evidence folders. |
| Seven recipes/repeated exchange | **Incomplete** | S615 covers one Polo M source/revision, one import and one export/re-import. | All seven recipes, supported options/grades, repeated exchanges and artifact accounting. |
| CUT/SEW geometry at `0.001 cm` | **Fail for tested CLO routes** | S609 AAMA: 4/9 CUT and 9/9 SEW pass, five CUTs fail. S614 and S615 Standard input remain 0.1×; S615 also has 8/18 exact source-path vertex matches only after diagnostic 0.1 scaling, with 10 changed contours. | Every accepted CUT/SEW contour within the unchanged gate at source scale. |
| Piece/revision/size identity | **Partial** | Nine pieces render in CLO; numeric blocks remain observed, not proven stable semantic bindings. | Stable source piece/revision/size binding across qualified exchange. |
| CUT/SEW roles and layer semantics | **Incomplete** | Output layers are numeric (`1`, `84`, `14`, `87`, `8`, `85`); diagnostics do not infer manufacturing meaning. | Documented role/layer/mark semantics verified through round trip. |
| Marks/notches/labels/seam allowance | **Incomplete** | Re-import scene shows gross shapes; screenshot does not establish complete mark fidelity or readable detail. Seam-allowance notice says Custom mode preserves shape. | Source-linked, readable proof for all required marks and seam allowances. |
| Units/scale | **Fail for tested Standard-DXF path** | 100% and 1000% imports produce geometry-identical output for the fixture; front remains 2.850001 × 7.3274 versus source 28.5 × 73.274. Source declares no `$INSUNITS`/`$MEASUREMENT`. | A correct, independently measured unit convention across representative fixtures. |
| Sizes/grades/options | **Incomplete** | One Polo M base fixture only. | Supported grade/option matrix with every relevant file accounted for. |
| Malformed input | **Open** | No negative-input test in S615. | Clear, actionable rejection of malformed fixtures. |
| Rendered detail | **Gross piece presence only** | Nine recognizable piece shapes visible in CLO screenshot; no full detail/readability acceptance. | Useful-zoom review for accepted output across recipes/options. |
| Exact-format claim | **Not supported** | GUI mode label, successful open/export, `ASTM` file name and AC1009 version do not prove exact edition or interoperability. | Rights/profile evidence and representative successful all-seven round trips. |
| Legacy DXF/protected identities | **Preserved** | S615 is research-only; product writers and baselines unchanged. | Preserve through settled integrated Epic verification. |

## Disposition and next action

Keep V03 open. Do not repeat Standard-DXF import at a changed scale; S615
shows that 1000% did not alter emitted geometry. Next isolate the import-unit
selector (mm versus cm) on the same unitless source while keeping 100% scale,
export settings, source, and all other controls fixed. Do not rescale files,
change geometry, lower the gate, or claim compatibility. Preserve all-seven
acceptance and every existing hold.
