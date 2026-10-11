# G04 V03 gate reconciliation after Slice 672

This matrix supersedes S671's pre-receiver status for the CLO Standard-DXF
route. It incorporates the actual CLO import, exploratory export, saved native
snapshot, source-bound geometry comparison, entity inventory, and prior DGS
and generic OpenCAD results. Acceptance, all-seven/option/grade coverage, the
`0.001 cm` threshold, and protected identities are unchanged.

| Gate | Status | Strongest evidence | Shared cause | Remaining proof or change |
|---|---|---|---|---|
| Receiver rights and local handling | **Passed for bounded CLO evaluation** | Maintainer-confirmed written approval is recorded in `docs/PROJECT-DECISIONS.md`; all S672 files are on C:. | Eligibility only; separate from technical quality. | No repeat rights question. Any new receiver needs its own existing authorization/rights evidence. |
| Industrial receiver/profile | **Failed for tested candidates; no qualifying route yet** | CLO 2026.1.310 Standard DXF misses CUT, units, marks/layers and readable saved output. DGS product import/export routes are retired after blank import or metadata-only output. OpenCAD R14 evidence is a generic converter, not an apparel CAD profile. | Candidate qualification blocks every downstream exchange claim. | Identify a genuinely viable local receiver/profile, or build a transparently named product adapter that passes every empirical gate through an eligible receiver. No standards claim from UI labels. |
| Geometry and units | **Failed** | CLO S672: 9/9 SEW and 4/9 CUT pass. Five CUT residuals are `0.00706865`–`0.00755961 cm` against `0.001 cm`. Header changes `$INSUNITS=5`→`4`, while coordinates retain centimeter-scale numbers. DGS S667 separately changed units without coordinate conversion. | Receiver curve simplification and unit serialization. | A candidate must round-trip all CUT/SEW at `0.001 cm`, with exact scale/origin/orientation/unit interpretation. Existing CLO candidate is disqualified; no more settings/density variants. |
| Piece/revision/grade identity and relations | **Failed for source identity in S672; completeness unproven** | CLO emits ordinal `0_M`–`8_M` blocks, not source names/revision IDs. OpenCAD R14 preserved simple names but lacks qualified apparel-grade/relation behavior. | Receiver naming plus missing bound sidecar/metadata. | Produce stable source-bound identities and mismatch rejection through export/re-import, including grades and relations. |
| CUT/SEW semantic layers and construction marks | **Failed** | S672 uses numeric layers `1,7,8,14`; source CUT/SEW and MARK_* names are lost. Source has 18 outlines plus placement points, cutlines, placement/fold lines, buttons and buttonholes; receiver output has 57 LWPOLYLINEs and no POINT/LINE/CIRCLE entity types. Earlier CLO mark audits also found omissions/movement. | Entity/layer remapping, not the measured SEW contour. | Inventory every source semantic entity; preserve typed identity/location/layer/value or a bound sidecar and prove actual native output/rendering. |
| All seven recipes, 73 supported options, and grades | **Unproven** | V02 passed 7 recipes, 73 options, 146 views; no CAD candidate passed representative interchange. | Requires a passing representative profile first. | Replay existing seven-recipe/73-option/grade matrices after candidate qualification; every applicable row must pass. |
| Malformed input and invalid-option fail-closed | **Failed on tested paths** | CLO S531 silently accepted malformed AAMA input and omitted SEW; OpenCAD S626 accepted nonfinite input. | Parser validation and silent-repair behavior. | Use existing negative fixtures against an otherwise-qualified exact profile and require rejection without partial/altered output. |
| Warning-free valid import | **Failed on prior candidate routes; CLO S672 valid-import status is incomplete** | DGS S664 displayed grainline-outside warnings; S668 registered 0/0; S672 drew nine pieces but carries CUT/marks/units failures and no complete warning-state closeout. | Warning semantics and incomplete source mapping. | Capture and resolve any receiver warnings on the single qualified route; do not treat nine visible shapes as full acceptance. |
| Repeatability and two-way round trip | **Unproven for S672; failed on prior tested routes** | S672 export exists due a documented procedural deviation but was not re-imported after the input gate failed. Prior CLO S632 repeat exports differed and retained geometry/mark failures; DGS output had no geometry; OpenCAD R14 output was byte-repeatable but not industrial apparel CAD. | Depends on a representative passing import and complete semantics. | Only after a candidate passes the representative gates: two frozen-revision exports, clean re-imports, and semantic or byte-stable comparison. |
| Readable receiver and saved output | **Failed for S672 saved snapshot** | The actual CLO PDF snapshot has nine pale outlines at whole-layout scale and no piece labels. Native geometry presence is visible, but the saved/rendered output is not adequately readable. | Line style/contrast and receiver labels. | Actual whole and detail renders must be legible with source-bound names and required marks. |
| Legacy DXF and protected byte identities | **Passed so far; final integrated gate pending** | No production exporter or baseline changed in S672. | Future production changes. | Run protected identity and legacy regressions at the settled Epic/PR boundary. |
| V02 prerequisite | **Passed** | S459 verified seven recipes, 73 configurations and 146 rendered faces; board remains V01/V02 Done. | None. | Preserve accepted V02 scope; no change. |

## S672 measurement record

Pinned measurement and entity reports live outside the repository under
`C:\G04-CLO-DXF-Exchange\S672-clo-standard-source-path-density\Evidence\Analysis\`.
The source fixture hash is
`487FAD7533BDA83306D3F4FA2DFEF523E469E62F3D808EFF0A9C98A7E38B77F8`; output
hash is `E0AB634DD03562C33CC3CD07F70C320BDFDB2A917045A48AA75AB6748C3E631F`.
The saved receiver project, PDF snapshot and PDF raster are also confined to
that C: folder. The exit packet records the unplanned export deviation and
does not call it a round trip.

The `/2` grainline convention remains approved, but no gate cleared by that
approval is inferred: it was a settled design mapping, not evidence that a
receiver complies with it. All design approvals and face holds remain as
recorded. No physical-fit, factory-acceptance or production-readiness claim.
