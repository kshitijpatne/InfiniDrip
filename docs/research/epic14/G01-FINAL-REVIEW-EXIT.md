# EPIC-14 / G01 final review and exit

**Review date:** 2026-09-24<br>
**Exit slice:** Slice 228<br>
**Remediation included:** Slice 227, commit `cf4d35166838ab62bf31e111718fd5ab2c6f3a51`<br>
**Board decision:** EPIC-14 (G01) closes as an evidence, contract, and digital-readability review. Closure does not mean every future product capability is implemented.

## Exit decision

The admitted evidence packets C01, C02, C05, and C06 were accepted; the C03 and C04 contracts were completed in order; and the final review reconciled A-01–A-12. The confirmed PDF readability defects were fixed in the separate Slice 227 remediation. The resulting current UI Tech Pack route now produces a paginated, readable **draft** pack for the seven existing recipe families, while the prior writer and its eight protected export identities remain unchanged.

The evidence supports closing G01's admission and professional-baseline objective. It does not support claims of professionally certified patterns, a complete factory-ready tech pack, AAMA/ASTM CAD interoperability, exact fit, physical drape, a fitted 3D garment, supplier suitability, or production readiness. Physical sampling remains held. No new garment, supplier contact, paid source, hosted service, marketplace transaction, or user-facing AI design agent was introduced.

## Accepted inputs and integrity check

All six board-linked packet documents were re-hashed against their recorded SHA-256 values on the review date; all six matched. Their research snapshots and acceptance records are dated 2026-09-24. The source-specific age, evidence class, conflicts, and limits remain in the packets; this exit does not turn time-sensitive vendor pages or supplier listings into current verified offers.

| Packet | Board evidence | Accepted record |
| --- | --- | --- |
| C01 | `E-EPIC14-C01-BASELINE` | Seven-recipe source/code audit and inspected output baseline: `C01-RECIPE-PROFESSIONAL-BASELINE.md` |
| C02 | `E-EPIC14-C02-PARITY` | Standards and tool comparison, including Genpire claims versus disclosed evidence and public-review limits: `C02-STANDARDS-AND-TOOL-COMPARISON.md` |
| C05 | `E-EPIC14-C05-3D-FEASIBILITY` | Measurement-driven avatar and pattern-linked simulation dossier, including asset rights and calibration boundaries: `C05-3D-AVATAR-AND-SIMULATION-DOSSIER.md` |
| C06 | `E-EPIC14-C06-STARTER-UPCYCLE-SUPPLIER` | Starter rubric, assortment uncertainty, photo/upcycling evidence tiers, and supplier workflow dossier: `C06-STARTER-ASSORTMENT-UPCYCLE-SUPPLIER-DOSSIER.md` |
| C03 | `E-EPIC14-C03-S222` | Accepted body/garment/style/donor measurement, one-size, grading, and capture contract: `C03-MEASUREMENT-AND-DONOR-CAPTURE-CONTRACT.md` |
| C04 | `E-EPIC14-C04-S226` | Accepted tech-pack/view/revision/CAD contract and exact current DXF boundary: `C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md` |

The C02 packet preserves, rather than resolves by assumption, the access and vendor-evidence limits: paid standards were not acquired; ASTM D6673 is not a current implementation target; apparel-CAD receiver behavior has not been round-tripped; and public marketing, reviews, and supplier-directory entries do not establish independently tested performance, current terms, or supplier capacity. C05 preserves the SMPL-X commercial-license question. C06 preserves the inconsistent Maker's Row pricing evidence and the lack of verified live supplier terms.

## Digital output replay

The existing C01 evidence includes actual UI assembled-view captures for all seven current recipes, including the simple Tee and more complex Polo. Slice 227 changes the current `#export-techpack` action to call `exportTechPackV2`; the UI integration test exercises that whole-style download route, and the committed renderer script invokes the same exporter for all seven recipes. The PDFs and every page raster are retained under `evidence/G01/techpack-v2/`.

| Replay | Input and path | Observed output | Review result and limit |
| --- | --- | --- | --- |
| Simple style — Tee | Current Tee recipe, `STANDARD_M`, default options, no fabric override or artwork; current UI download route is covered by `src/ui/app.test.ts`. | 4-page PDF; 317 extracted words; pattern-piece overview, measurement spec, BOM/construction, fit-record sheet. | Page text is within bounds with no word-box overlap. The piece overview is independently scaled and explicitly not for cutting. This is not a completed garment technical flat or personal-measurement fit proof. |
| Difficult style — Polo | Current Polo recipe, same deterministic input policy; C01's assembled UI capture plus the current V2 export. | 6-page PDF; 691 extracted words; button-placket and collar pieces, graded measurement table, paginated BOM/construction, fit-record sheet. | No text is outside page bounds or overlaps another text box. Long operation text wraps. Recipe defaults remain draft values, not independently approved factory instructions. |
| Difficult style — Woven shirt | Current Woven Shirt recipe, same deterministic input policy; C01's assembled UI capture plus the current V2 export. | 6-page PDF; 552 extracted words; paginated BOM/construction and the current recipe measurement table. | No text is outside page bounds or overlaps another text box. This does not prove fabric-specific sewability or supplier acceptance. |
| Other existing recipes | Darted Tee, Tank, Skirt, and Trouser, each with `STANDARD_M` and default options. | 4, 4, 4, and 5 pages respectively. | All seven output PDFs are included and hashed in `evidence/G01/techpack-v2/MANIFEST.json`. |

All 33 pages were rasterized at 150 DPI. A Poppler `pdftotext -bbox-layout` scan checked 2,953 word boxes: **0 out-of-page boxes and 0 intersecting word boxes**. Visual review covered all seven first-page overviews and the spec, BOM, construction, and fit-record pages for the representative simple/complex outputs. The complete raster set is retained for inspection. The scan measures digital page layout only; it is not an apparel construction review.

The manifest pins the PDFs and all 33 PNGs by byte length and SHA-256, records the deterministic inputs and the source commit, and includes `LAYOUT-AUDIT.json`. Recreate the PDFs from this source with:

```text
npx vite-node --script docs/research/epic14/evidence/G01/render-techpack-v2.ts
```

The Poppler environment printed missing display-font-map diagnostics for Symbol/ArialUnicode during raster inspection; `pdffonts` reported only standard Helvetica Type 1 / WinAnsi in the PDF. The pages rasterized and extracted as described. Recheck in a target desktop PDF viewer before relying on a different renderer's font configuration.

### Slice 227 change and compatibility boundary

- The current UI uses the additive readable writer. It paginates the pattern-piece overview at four pieces per page, independently scales each illustration, labels pieces, and says `NOT TO SCALE - never cut from this overview`.
- POM names and grade values remain in the Measurement Spec page. Long BOM values and construction steps wrap; dense content continues to later pages.
- The old four-page `exportTechPack` path remains available and unchanged in behavior. The eight existing Tee and Darted Tee legacy SVG/DXF/tiled-PDF/Tech-Pack SHA-256 regression identities passed unchanged. Existing empty-artwork identity checks also passed for all seven recipe families.
- This remediation removes observed digital collisions and clipping. It does **not** add finished front/back technical flats, editable production BOM rows, full per-field provenance, approval/version freeze, supplier-specific costing, CAD exchange semantics, qualified apparel-technician review, or factory release.

## A-01–A-12 decision ledger

“Accepted” means the fact, boundary, owner, and next gate are clear enough for G01 to close. It does not mean the future capability is implemented or qualified.

| ID | G01 disposition | Evidence and verification | Owner and required next gate | Remaining facts / permitted claim |
| --- | --- | --- | --- | --- |
| A-01 Recipe/professional parity | **Baseline accepted; professional qualification open.** Seven existing deterministic recipe families were inspected. | C01 source and output matrix; C02 professional comparison; seven S227 rendered packs; eight legacy hash checks. | G06 and G07. Before a B1 starter claim: recipe/variant construction, panels/edges, POMs, BOM, grading, UI, render, and all exports pass a documented matrix and qualified technical review. | Current default recipes are digital drafts. No independent apparel technician has accepted each recipe; no physical fit evidence exists. |
| A-02 Project/style/version foundation | **Known gap assigned; not implemented here.** Current persistence is a single local workspace with separate artwork bytes. | C01 repository/schema audit; roadmap A-02. | G02 must deliver stable project/style identities, multi-style assets, versioned records, migration, export/import, backup/recovery, and storage-pressure evidence while retaining old-save behavior. | Quota behavior, cross-style asset ownership, version graph and migration failures remain engineering questions. Keep current single-style behavior available until migration is proven. |
| A-03 Measurements and one-size creation | **Contract accepted; feature not implemented.** Body measurements, finished POMs, style controls, and grade rules must stay distinct. | C03 recipe-by-recipe map, capture guidance, invalid/conflicting-input policy, and maintainer's one-size-first decision. | G03 after G02. A wearer-measurement path must produce one explicit size first; a graded run requires separately selected/approved grade rules and its own checks. | Several current code values still share one `Measurements` record; field methods and body-to-pattern rules need recipe-level validation. The present app does not provide the proposed measurement-first shortcut. |
| A-04 Tech-pack depth/readability | **Digital readability defect remediated; production pack remains open.** | C01 collision/clipping evidence; C04 accepted field, revision, view, and page contracts; S227 PDFs, rasters, bounds scan, and export tests. | G04/G05. Build complete technical flats and structured editable sections, source/provenance per field, approvals, version freeze, QA/sample fields and route-specific exports; obtain qualified review on simple and difficult styles before professional claims. | Current POMs are geometry/formula-derived and BOM/construction are recipe defaults. This draft pack is not a production-approved tech pack. |
| A-05 CAD interoperability | **Exact current boundary accepted; interoperability unproven.** | C04 DXF entity and unit review; existing writer and export fixtures. | G04 must choose a named licensed receiver/profile, define units and semantic mark/grade behavior, then prove representative receive/save/round-trip fixtures in that target. | Current generic DXF has no declared units or grade metadata and no verified apparel-CAD receiver. Do not label it AAMA/ASTM compatible. |
| A-06 Garment views | **View contract accepted; finished views not implemented.** | C01 actual schematic UI captures; C04 view semantics; S227 makes pattern-piece overview legible but explicitly non-scale. | G04 owns front/back technical flats for every supported recipe/variant; G09 D04 owns pattern-linked side/oblique/inside views. Pass a recipe/variant collision and visibility matrix. | Current assembled/body side presentation is schematic. The S227 page is a piece overview, not a finished-garment flat or 3D view. |
| A-07 Measurement-driven avatar | **Feasible architecture documented; runtime and commercial asset choice open.** | C05 literature and license review; C03 measurement vocabulary/residual limits. Blender/GLB transports geometry and controls but does not infer a unique body from sparse measures. | G09 D01–D02: rights-cleared stable-topology avatar, named landmarks and paths, deterministic measurement fitting, residual/tolerance policy, explicit underdetermination controls, adversarial shape tests. | Sparse circumferences do not define posture or surface distribution. SMPL-X commercial terms are unresolved; do not ship its model/tooling without rights. A mannequin is not a scan. |
| A-08 Garment simulation | **Research basis accepted; no garment solver exists in the product.** | C05 solver/material review and C04 semantic-view contract; current source has no pattern-to-cloth runtime. | G09 D03–D07: semantic panels/seam pairs; assembly; body/self-collision; material tests and calibrated parameter classes; solver numeric/visual/device matrix; edits propagated through 2D and 3D. Physical fit remains a separate later gate. | Fabric name, GSM, or texture is not a mechanical-property calibration. No current image or solver establishes physical drape or fit. |
| A-09 Vetted starter library | **Admission rubric accepted; no professionally vetted catalog claimed.** | C01 existing recipe audit and C06 diversity, rights, duplicate, and B1 admission rubric. | G06 must create a rights-traceable taxonomy of meaningfully distinct designs; each counted starter passes the G06 B1 evidence matrix and qualified review. | Seven recipes are not seven professionally vetted starter collections. No arbitrary 500-blank target. |
| A-10 Assortment, demand, and cost | **Unknowns and calculation boundary accepted; no forecast implemented.** | C06 assortment review; roadmap A-10; current product contains no verified live price/MOQ/availability feed. | G08 plans user-approved assortment scenarios; G11/G12 consume source-dated supplier quotes. Calculations must disclose input source, date, confidence, material/color MOQ and size quantities. | Demand, price, inventory, yield/shrinkage, capacity, lead time, freight/tax and returns are unknown unless supplied. No market forecast or factory cost claim. |
| A-11 Reference and upcycling | **Photo-first exploration allowed; photo-only feasibility not established.** | C03 donor capture tiers and recipe-specific source maps; C06 source-garment evidence tiers and measurement coaching requirements. | G10 must offer visible-feature annotation from photos, teach the donor-specific measurements needed, and withhold cut-feasibility claims until source panels/material/condition/usable area and the proposed target pattern are sufficiently evidenced and checked. | Photos can start exploration but cannot reveal hidden seams, exact panel dimensions, grain, stretch, damage or remaining cloth. Measurements improve feasibility; measurement capture alone still does not reveal hidden construction. |
| A-12 Supplier/manufacturer bridge | **Local workflow is a future option; no live marketplace is present.** | C06 workflow, supplier-profile and RFQ schema, commercial-role, privacy and evidence review. | G11 may build a local simulated, version-pinned RFQ/quote workflow. G12 needs separate launch authorization, verified supplier documents and terms, privacy/legal/commercial role, support and operating-cost decisions. G15/G16 remain later physical/operational gates. | No supplier identity, contact, capacity, current MOQ, price, reliability, payment, order, manufacturing or shipping claim is verified. No outreach or transaction was made. |

## Required technical and repository gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Full Vitest suite and coverage | **Pass:** 1,563 tests; 100% statements (13,950/13,950), functions (947/947), and branches (4,936/4,936). | `npm run coverage` on the S227 tree after adding the empty-cell/page-boundary cases. |
| TypeScript and production build | **Pass.** | `npm run build` completed; 110 modules transformed. |
| Protected export identities | **Pass:** all eight existing SHA-256 fixtures unchanged. | `src/export/regression.test.ts`, included in the full suite. |
| New pack pressure cases | **Pass:** seven recipe piece-inventory/page-count checks, dense BOM/construction pagination, empty BOM cells at the page boundary, artwork appendix retention, and current UI download route. | `src/export/techpack.test.ts`, `src/export/techpack-surface.test.ts`, and `src/ui/app.test.ts`. |
| Actual rendered output | **Pass for digital layout only:** 7 PDFs, 33 pages rasterized, 2,953 word boxes, 0 out-of-page boxes, 0 word-box overlaps. | This directory's PDFs, PNGs, `LAYOUT-AUDIT.json`, and `MANIFEST.json`; representative C01 UI captures remain in `evidence/C01/`. |
| Control Center | **Final status is set through the validated CLI and re-tested in this slice.** Every linked EPIC-14 work item has verified non-incomplete evidence; the Epic has this verified exit report. | Canonical `ops/control-center/data/board.json`; assertions in `ops/control-center/app/board.test.mjs`; `npm run control-center:test`. |

## Closure and next boundary

EPIC-14's G01 scope closes with this ledger, the separate S227 readability fix, complete digital test/build evidence, and a hash-verified exit report. The board keeps all future goals in Backlog. The next roadmap candidate is G02 / EPIC-15, but this G01 close does not start or authorize it. G03 measurement-first creation, G04/G05 production-oriented views and tech packs, G09 3D, G10 upcycling, and G11/G12 supplier workflow retain the gates above. No physical sample was requested, made, or accepted.
