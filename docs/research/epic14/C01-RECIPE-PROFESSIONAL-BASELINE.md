# C01 — Seven-recipe professional baseline audit

**Status:** reviewed and accepted 2026-09-24; Slice 216<br>
**Observed:** 2026-09-24 against repository `4a21b11` (`Slice 214: map Epic 14 execution sequence`)<br>
**Scope:** read-only code audit plus real rendered in-app output for all seven registered recipes. No pattern code was changed and no physical sample, factory acceptance, fit, or production-readiness claim is implied.

## Executive finding

InfiniDrip already has a substantial deterministic digital drafting foundation: seven parametric recipes; named pattern-piece roles; editable measurements and, on four garments, construction options; seam, notch, grainline, and grade-order checks; geometry-derived points of measure (POMs); five-size XS–XL default runs; size-specific re-drafting; and downloadable SVG, DXF, PDF, and tech-pack artifacts. These are real capabilities, verified against the app and source.

That capability is not yet equivalent to a professionally released production package. The actual tech-pack PDF is a four-page, internally generated document. Its first page lays out cut pattern pieces; it is not a conventional front/back technical-flat sheet. On the Polo and Woven shirt exports, multiple component labels overlap and are not reliably readable. Tech-pack BOM quantities are fixed recipe strings rather than marker-derived consumption. Fabric and trim identities, supplier/source, field provenance, approval state, frozen revision, and entered sample results are absent. The exported DXF is the repository's minimal R12 entity writer; no apparel CAD round-trip was demonstrated. Digital checks confirm the implemented geometry invariants, not fit on a body, material behavior, or sewn construction.

**Conclusion:** the current app is a credible editable digital prototype and a useful controlled drafting base. The observed artifacts do not support calling every tech pack factory-ready, every output industry-standard, or the garment fit-accurate. Professional parity work should first make output legible, source-aware, revision-controlled, and exchange-tested; physical claims remain held until physical validation is explicitly reopened and evidence exists.

## Method and evidence boundary

1. Read the registry and recipe-specific contracts in `src/drafting/recipe.ts`, recipe modules, POM/grade code, export code, and relevant tests.
2. Opened the real application at `http://127.0.0.1:5175/`, followed the guided `Garment → Measure → Style → Check → Export` flow for each registered recipe, and inspected the rendered pattern/assembled/check stages.
3. Kept the built-in `STANDARD_M` values and each recipe's default style/options. No individual body data, external material values, or sourced size standard was entered.
4. Exported each real tech-pack PDF through the app, rendered it, and inspected page layout and extracted text. The evidence PDFs and selected screen/page images are committed beside this report.
5. Recomputed the default `garmentReport` for every recipe through the repository's own Vite module loader. All seven returned `ok: true`; the observed report contained between five and fourteen digital checks per recipe.
6. The full product coverage gate completed: 100% statements, branches, functions and lines across 101 included files (13,772 statements, 4,891 branches, 937 functions). The full suite included the export byte-identity regression tests; the production build also passed. These software gates do not establish a fabric test, external CAD round-trip, independent technical review or physical fit.

The UI itself labels the assembled preview **“schematic, not a fit simulation”** and tells the user digital checks do not replace physical fit validation. The result below respects that boundary.

## Current recipe inventory

Counts below are measured from the live recipe registry and default drafted blocks on the audit date. `Fields` means inputs declared by that recipe; it does not mean every field is a body measurement. `Checks` is the default `garmentReport` count, not a count of physical tests. All seven default reports passed their currently implemented digital checks.

| Recipe | Declared fields | Extra options | Default block pieces | Geometry POMs | Built-in size run | BOM rows / sew notes | Default digital checks |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| Tee | 7 | 0 | 3 | 10 | XS–XL, M base | 5 / 6 | 7, pass |
| Darted tee | 7 | 0 | 3 | 11 | XS–XL, M base | 5 / 7 | 7, pass |
| Tank | 8 | 0 | 2 | 7 | XS–XL, M base | 5 / 5 | 5, pass |
| Polo | 7 | 8 | 9 | 21 | XS–XL, M base | 6 / 9 | 13, pass |
| Woven shirt | 11 | 13 | 12 | 10 | XS–XL, M base | 6 / 8 | 14, pass |
| Skirt | 5 | 0 | 3 | 3 | XS–XL, M base | 5 / 5 | 6, pass |
| Trouser | 8 | 11 | 8 | 17 | XS–XL, M base | 5 / 7 | 12, pass |

Source: registry and metadata in [`recipe.ts`](../../../src/drafting/recipe.ts), measurement/option contracts in [`shirt-contract.ts`](../../../src/drafting/shirt-contract.ts) and [`trouser-contract.ts`](../../../src/drafting/trouser-contract.ts), and the modules referenced by the registry. Count checks were repeated via `garmentReport`/`blockPieces` at audit time.

### Per-recipe gap and action matrix

The common risks in the next table affect every recipe; this table records the particular exposure, consequence, and downstream owner for each recipe. A recipe can pass all digital checks and still have the same material, CAD, revision, and physical-evidence gaps described below.

| Recipe | Severity / recipe-specific evidence | Affected source/output | Downstream consequence | Candidate owner/action |
| --- | --- | --- | --- | --- |
| Tee | **P2.** The basic knit tee declares seven inputs and ten finished POMs; its per-size run grades six listed body dimensions while ease is carried unchanged. This is deterministic, but does not establish a body population, fabric/stretched-seam domain, or brand-approved measurement/grade standard. | `src/drafting/recipe.ts` (`TEE`), `tshirt.ts`, `tshirt-grade.ts`, `tshirt-pom.ts`, tech-pack page 1 and spec table. | A precise-looking XS–XL table can be mistaken for a sourced or fit-validated chart. Long POM leaders also reduce page readability in the current template. | C03 defines semantic body/POM/grade source and approval; C04 defines technical-flat/POM-callout layout; later G06 adds scoped technical review. |
| Darted tee | **P2.** The recipe adds bust-dart geometry, dart intake POM and an extra construction operation, but shares the tee measurement fields, `TSHIRT_GRADE`, size labels and knit BOM. No physical sample or material-specific dart/fit validation exists. | `recipe.ts` (`FITTED`), `fitted.ts`, `fitted-tables.ts`, shared `tshirt-grade.ts`; actual export `darted-tee-techpack.pdf`. | Designers may assume dart intake, cup/body shape and finished ease are graded or validated as a fitted block. Reusing a tee grade does not validate a bust-shaped size range. | C03 decides measurement/grade semantics; later G06 garment-specific block review establishes a declared supported fit domain; sampling remains held. |
| Tank | **P2.** Eight editable fields include `strapWidth`, `neckDrop`, and `neckWidthEase`, but its declared grade is shared `TSHIRT_GRADE`. Of those grade keys, chest, shoulder width, length and armhole depth affect this recipe; bicep and sleeve length are not Tank fields. `gradeRun` changes only fields present in the grade rule, so the tank-specific neckline/strap controls remain constant across the run. It has seven POMs and two body panels. | `recipe.ts` (`TANK`), `tank.ts`, `tshirt-grade.ts`, `grading.ts`, `tank-techpack.pdf`. | A five-size display can hide a grade decision: shoulder/strap and neckline proportions do not scale with size under the current rule. The appropriate rule depends on a stated fit/population and needs approval, not an automatic invented increment. | C03 makes the grade rule explicit/approved; later G06 technical review tests all supported sizes and documents the neckline/strap domain. |
| Polo | **P1.** This is a 9-piece block with 8 construction options and 21 POMs. Actual page-one PDF rendering shows component labels collide at the top/right; POM leaders cross a large part of the sheet. In grading, option dimensions are not entries in `TSHIRT_GRADE`, so the collar/placket/vent/drop controls remain the same across the default size steps. | `recipe.ts` (`POLO`), `polo.ts`, `tshirt-grade.ts`, `grading.ts`, `src/export/techpack.ts`; [observed page 1](evidence/C01/polo-techpack-page-1.png) and [`polo-techpack.pdf`](evidence/C01/polo-techpack.pdf). | Component identity/callouts are not reliably legible in this production document. A user may assume custom construction dimensions grade with body size even though the size run changes only the declared graded measurements. | C04 owns the legible, reflowed technical-flat/pattern-view contract; C03 owns one-size-first and separately approved grading semantics; later G06 pressure-tests option/size combinations. |
| Woven shirt | **P1.** This is a 12-piece block with 13 options, 10 POMs and 14 passing digital checks. Actual first-page rendering shows multiple component labels overlap. Its size rule changes declared body measurement fields; the extra option dimensions are not present in that grade rule. The BOM's main fabric remains a broad label and static estimated length. | `recipe.ts` (`WOVEN_SHIRT`), `shirt.ts`, `shirt-contract.ts`, `shirt.ts` grade/POM tables, `src/export/techpack.ts`; [observed page 1](evidence/C01/woven-shirt-techpack-page-1.png) and [`woven-shirt-techpack.pdf`](evidence/C01/woven-shirt-techpack.pdf). | Poor label readability blocks confident interpretation of complex components; button/collar/yoke/pocket options and fabric consumption still require explicit, versioned size/material decisions. | C04 owns page layout and BOM/operation schema; C03 owns grade/option state; later G06 reviews complete shirt block, variants and construction. |
| Skirt | **P2.** Current recipe is a straight woven-skirt block with three pieces, five input fields and three finished POMs (waist, hip, length); its preset styles vary length/ease, while its pattern grammar remains the same straight block. Size run uses waist/hip/length increments. It passes six digital checks. | `src/drafting/recipe.ts` (`SKIRT`), `src/style/style.ts` (`SKIRT_STYLES`), `src/drafting/skirt.ts` (`SKIRT_GRADE`, `SKIRT_POMS`), `skirt-techpack.pdf`. | A user may mistake style presets for support of different skirt construction or shape families. The pack does not show a finished POM for every body/design input; the intended meaning needs to be explicit. | C04 maps each intended finished spec to a POM or explains why it is pattern-only; later G06 declares supported style/fabric/construction variants and technical-review coverage. |
| Trouser | **P2.** This is an 8-piece block with 11 options and 17 POMs; all 12 current digital checks pass. The declared trouser grade changes seven body dimensions; ease and separate construction options such as rise ease, waistband depth, leg opening and pocket shape are not grade-rule fields. The actual PDF page is more legible than Polo/Woven but some leaders run long. | `recipe.ts` (`TROUSER`), `trouser.ts`, `trouser-contract.ts`, `trouser-tables.ts`, `grading.ts`, [`trouser-techpack.pdf`](evidence/C01/trouser-techpack.pdf). | The size run can appear complete while important style dimensions remain constant. Static material consumption does not account for fabric width, marker layout, size demand or losses. | C03 defines and approves per-size grade behavior; C04 owns POM callout and consumption basis; later G06 reviews rise, seat, leg, pocket and construction across the declared size/fabric domain. |

### Cross-recipe gap ownership

| Severity | Finding | Affected files/surface | Consequence | Candidate owner/action |
| --- | --- | --- | --- | --- |
| P1 | Polo/Woven label and callout collisions; some construction text clips instead of wrapping. | `src/export/techpack.ts` and shared drawing/text layout; current PDFs attached above. | A correct value cannot be trusted if the recipient cannot unambiguously read the sheet. | C04 defines layout rules and visual acceptance fixtures; fix under an explicitly admitted future implementation slice. |
| P1 | Static BOM estimates and no sourced material identity/quantity basis. | `recipe.ts` per-recipe `TechPack.bom`; `src/export/techpack.ts`. | Not comparable factory quotes or material purchase quantities; may be mistaken for guaranteed yield. | C04 BOM schema; later G02/G05 version/provenance/consumption work; keep estimate vs supplier/marker fact explicit. |
| P1 | Generic DXF R12 writer has no receiving-apparel-CAD round-trip evidence. | `src/export/dxf.ts`; app DXF export. | “DXF export” may be read as production interchange despite absent apparel semantics/grade metadata. | C04 chooses target CAD/profile, acceptance fixture, external round-trip and claim wording. |
| P1 | No revision-frozen factory handoff or editable actual-sample record is demonstrated. | Current one-design local save/export flow, `src/drafting/fit-compare.ts`, tech-pack page 4. | Supplier questions, actual sample variance and approvals cannot be attributed to an exact released design state. | G02/G05 define durable versioned source/provenance/approvals; physical loop remains held. |
| P1 | No sewn sample or external qualified technical review is recorded. | All seven recipes and all associated output evidence. | Fit, drape, material behavior, construction success and factory readiness remain unknown. | Digital reviewers may close C01/C02 only within their evidence scope; G15/maintainer gate for sampling. |

### What those numbers do and do not establish

- The code has meaningful garment-specific structures: e.g. the Polo has a placket, collar/stand roles, vents, and eight named options; the Woven shirt has yoke, placket, pocket, collar/stand and sleeve-band controls; the Trouser has eight roles and eleven controls. These are more than image-only blanks.
- The recipe options expose concrete geometry decisions, but the count says nothing by itself about whether all style variants, fabrics, sizes, or industrial constructions are independently validated.
- POM values are calculated from named drafted geometry in centimeters and then emitted for each graded block. POM labels and calculations are code-defined. Some have diagram anchors; unanchored POMs are table-only. A computed value is internally consistent with that geometry, not an independently validated garment measurement.
- The default XS–XL run applies repository-owned grade increments. The tee-family run changes chest by 5 cm, shoulder width by 1.2 cm, bicep by 1.5 cm, length by 2 cm, armhole depth by 0.6 cm, and sleeve length by 0.8 cm per size step; ease is unchanged. Trouser and skirt have their own rules. These are product code constants, not evidence that a population's body dimensions, brand grade, or customer fit have been validated.
- The app's generic digital checks include matching declared seams, certain construction relationships, notches/grainlines, and ordered growth across sizes. They are valuable regression gates. A passing result cannot validate the input assumptions or omitted physical properties.

## Professional baseline and observed status

The comparison baseline is deliberately scoped. ISO 8559 addresses body measurement and body-size designation; ISO 18890 addresses methods for measuring garment dimensions; ASTM D6193 addresses stitch/seam classification and assembly recommendations. These references do not provide one universal tech-pack page template or prove that InfiniDrip conforms. Competitor docs in C02 show how products provide structured BOM/POM, grading, revision and 2D/3D workflows; those product claims are not independent accuracy proof. Detailed source scope, status and tool-by-tool evidence are in [C02](C02-STANDARDS-AND-TOOL-COMPARISON.md). The criteria below are the functional evidence needed for a dependable supplier discussion, not a claim of formal ISO/ASTM compliance.

| Capability required for a dependable professional handoff | Present and verified | Gap / status |
| --- | --- | --- |
| Parametric style/pattern editing | Deterministic recipes, visible field controls, presets, and recipe-specific option controls. Invalid values can receive actionable guidance. | Input taxonomy and source are not consistently expressed as body measure, finished measure, derived measure, ease, or construction option. No common versioned style record exists for a production handoff. |
| Pattern structure | Named pieces/roles, edge geometry, seam relationships, seam allowances, notches, grainlines, and recipe checks exist. | Code/test validity does not demonstrate industry-reviewed pattern blocks or physical sewability. More demanding seam/mark/allowance construction detail varies by recipe. |
| POM and specification table | Geometry-derived POMs and a size-by-size spec table are generated. Optional tolerances can be displayed; absent tolerances remain blank. | No universal POM standard mapping, source/provenance, approval record, per-size tolerance validation, or entry of actual sample measurements. A few POMs are table-only; the complex page leaders/layout need repair. |
| Grading | Each recipe can re-draft its current XS–XL run from explicit code-owned grade rules. | The app currently exports that default run without a separate user-approved grade contract. Grade values and labels are not traced to a selected, licensed, population/brand-specific source or physical grade validation. Do not treat the default run as an approved customer grade. |
| Technical views | Page 1 includes front/back or component cut-shape diagrams with POM labels/leaders. The app's separate 2D pattern view is usable for inspecting the cut pieces. | The pack page is a compressed pattern-piece layout, not a complete front/back technical flat set with controlled callouts and construction details. Polo and Woven shirt evidence shows overlapping component labels; leader lines span too far. |
| BOM and material definition | Each recipe has material, placement, and quantity text; some BOM/construction output changes with selected options. | Quantities such as “1.2 m”, “1 cone”, or “3” are static defaults. They are not derived from fabric width, size/quantity mix, marker efficiency, shrinkage, cutting loss, or supplier package size. Composition, weight, finish, stretch direction/behavior, color/dye, usable width, article/lot, trim specification, supplier, cost, and evidence source are not captured as a complete approved material definition. |
| Construction and workmanship | Ordered short construction notes exist; option-aware notes cover some Polo/Woven/Trouser choices. | No factory-verified operation method or full seam/stitch specification per operation, machine/needle/thread setting, workmanship acceptance criteria, operator sequence, critical-to-quality flag, or attached annotated construction reference. At least one Polo construction sentence is clipped at the right edge in the exported PDF; the template does not wrap long construction text. |
| Document lifecycle | App exports a four-page PDF and marks digital versus physical evidence separately. | No immutable revision package, field-level provenance, revision diff, reviewer approvals, sample-round record, factory questions/answers, or frozen supplier handoff has been demonstrated. Page four is a print-and-write fit-record form; it does not persist actual measurements in the app. |
| CAD / cutting interchange | Repository writes SVG and a simple R12 DXF; PDF has tiled/full-sheet pattern outputs. | No vendor CAD import/export round-trip or independent inspection of apparel-specific graded pattern metadata, internal lines, notches, units, seam/grade rules, or plot scale was performed. “DXF” alone does not establish interchange compatibility. |
| Evidence and claim control | The UI visibly says the assembled drawing is schematic and physical validation remains pending. Digital tests are extensive across garment modules. | No garment has sewn/fit evidence in the repository. Keep all physical fit, drape, wash, bulk-production and factory-acceptance claims unverified. Physical sampling remains on hold by maintainer decision. |

## Ranked findings for downstream design

**P1 — output legibility for complex garments.** The Polo and Woven shirt first pages put many pattern-piece labels into an overfull fixed layout; labels collide, and callout leaders run across the page. This was observed in the actual PDF render, not inferred from source. The attached images [`polo-techpack-page-1.png`](evidence/C01/polo-techpack-page-1.png) and [`woven-shirt-techpack-page-1.png`](evidence/C01/woven-shirt-techpack-page-1.png) are release-quality evidence for a future layout fix. A document that cannot be read reliably should not be described as a professional factory handoff.

**P1 — technical-flat and pattern-file distinction.** A garment schematic/technical flat communicates the complete visible garment design; a cut-pattern layout communicates panel shapes/cutting geometry. These serve different readers and tasks. The present pack page is the latter kind of page and does not supply a complete, clean front/back flat set. C04 must define the intended view inventory and placement/callout rules before implementation is estimated.

**P1 — material/consumption numbers look firmer than their evidence.** Static quantities and broad material labels are useful draft placeholders, not purchase quantities or sourced specifications. Every future BOM field needs an origin, status, unit, and basis; unresolved values must stay marked unresolved. Consumption must state if it is a user estimate, block/template estimate, marker result, supplier quote, or confirmed order figure.

**P1 — DXF interchange is unproven.** A syntactically valid generic DXF file may not retain apparel CAD semantics. C02/C04 must pick receiving CAD software and agree exact supported exchange data, units, grades, internal construction marks, and round-trip acceptance before a compatibility claim is allowed.

**P1 — no revision-frozen approval or recorded sample loop.** The current print-friendly fit record is not a versioned fit-data subsystem. A future record must bind comments and measured results to exact garment/style/size/material/pattern revision, keep predicted and actual values separate, and show unresolved variance rather than overwriting the spec.

**P1 — digital proof has a defined ceiling.** All seven default designs pass the implemented checks, but there is no sewn garment, body fit, fabric test, wash test, or factory signoff. The existing UI language correctly declares this limit. Sampling remains on hold; its future gate must not be replaced by more digital tests.

**P2 — one label system hides input meaning.** Recipe field names alone do not fully distinguish body dimensions from finished measurements and design ease. C03 should provide the canonical taxonomy and required body-measurement instruction/source/provenance model before measurement-first creation or avatar work.

## Future tech-pack acceptance contract to take into C03/C04

These are requirements to scope and resolve, not changes approved in C01:

1. Each package identifies garment/style ID, style and pattern revision, base-size/grade contract, units, intended use, author/reviewer, status, and generation date. A supplier handoff references a frozen revision hash.
2. Every value distinguishes its semantic type and provenance: user-entered, recipe-derived, inherited from approved block, calculated, sourced standard, supplier-confirmed, sample-measured, or unresolved. Preserve who/when/source and confidence where applicable.
3. Body measurement inputs and finished-garment POMs are separate tables with measurement method, diagram anchor, size/run scope, source, ease relation where relevant, tolerance authority, and actual-result slots. No inferred body value is silently presented as approved finished spec.
4. Each pattern piece gets a stable name/ID, intended quantity/cut direction/fold, grainline, notch and drill/internal-mark inventory, seam-allowance policy, and mapping to visible flat callouts. Exports state units/scale and are checked on the exact receiving CAD/cutting system selected in C04.
5. Technical flats and cut-pattern layouts are separate outputs. Multi-piece pages must wrap, reflow, paginate, or deliberately enlarge instead of overlapping. Require programmatic layout checks plus visual review of the actual exported file for every supported recipe class.
6. BOM rows hold exact material/article identity, composition/content, weight, usable width, construction/finish, color, stretch direction/behavior if relevant, trim dimensions/material, placement, quantity basis/unit, supplier/source, quote/date, and unresolved status. Marker-based consumption and loss assumptions must be labeled as such.
7. Operations connect to seams and components; define seam/stitch/construction choices, machine/needle/thread where known, critical construction checkpoints, and sourced or approved workmanship limits. Unknowns remain explicit.
8. Revision/approval and sampling records retain immutable predicted spec, actual result, variance, disposition, author/date, evidence attachments, and state. Digital pass, fit approval, production release, and physical evidence are distinct states.
9. Exports need a deterministic fixture suite for all recipes and valid variants, PDF text/overflow assertions, actual image review, units/scale checks, byte-identity regression protection, and external CAD round-trip evidence before format claims.

## Evidence files

All seven PDFs and actual assembled-preview screen captures were exported in the guided app flow using default `STANDARD_M` data. The two focused page renders show the complex-layout defect.

The files are inventoried with byte sizes and SHA-256 digests in [`evidence/C01/MANIFEST.json`](evidence/C01/MANIFEST.json); the manifest identifies the repository revision and default input context for this observation.

| Recipe | Actual tech-pack PDF | Assembled preview |
| --- | --- | --- |
| Tee | [tee-techpack.pdf](evidence/C01/tee-techpack.pdf) | [tee-assembled-reviewed.png](evidence/C01/tee-assembled-reviewed.png) |
| Darted tee | [darted-tee-techpack.pdf](evidence/C01/darted-tee-techpack.pdf) | [darted-tee-assembled-reviewed.png](evidence/C01/darted-tee-assembled-reviewed.png) |
| Tank | [tank-techpack.pdf](evidence/C01/tank-techpack.pdf) | [tank-assembled-reviewed.png](evidence/C01/tank-assembled-reviewed.png) |
| Polo | [polo-techpack.pdf](evidence/C01/polo-techpack.pdf) | [polo-assembled-reviewed.png](evidence/C01/polo-assembled-reviewed.png) |
| Woven shirt | [woven-shirt-techpack.pdf](evidence/C01/woven-shirt-techpack.pdf) | [woven-shirt-assembled-reviewed.png](evidence/C01/woven-shirt-assembled-reviewed.png) |
| Skirt | [skirt-techpack.pdf](evidence/C01/skirt-techpack.pdf) | [skirt-assembled-reviewed.png](evidence/C01/skirt-assembled-reviewed.png) |
| Trouser | [trouser-techpack.pdf](evidence/C01/trouser-techpack.pdf) | [trouser-assembled-reviewed.png](evidence/C01/trouser-assembled-reviewed.png) |

## Source map

- Recipe metadata and the seven-recipe registry: [`src/drafting/recipe.ts`](../../../src/drafting/recipe.ts).
- Tee size labels and increments: [`src/drafting/tshirt-grade.ts`](../../../src/drafting/tshirt-grade.ts).
- POM value semantics and optional tolerance/anchor behavior: [`src/drafting/pom.ts`](../../../src/drafting/pom.ts).
- Body/finished comparison is calculation infrastructure only; actual inputs must be supplied: [`src/drafting/fit-compare.ts`](../../../src/drafting/fit-compare.ts).
- DXF writer: [`src/export/dxf.ts`](../../../src/export/dxf.ts). Tech-pack layout/export: [`src/export/techpack.ts`](../../../src/export/techpack.ts) and adjacent `src/export/` modules.
- Relevant independent recipe, grading, POM, pattern, export and quality tests are in `src/drafting/` and `src/export/`; passing them establishes software invariants, not external apparel or physical validation.
- The professional standard/tool evidence and the exact boundary of standards claims belong to [C02](C02-STANDARDS-AND-TOOL-COMPARISON.md); C01 does not assert formal ISO/ASTM conformance.

## Exit decision

C01 passed its digital research exit on 2026-09-24: the source/recipe matrix was cross-checked against C02, actual PDF/render evidence and hashes are recorded, and the verified packet is attached to `EPIC-14-C01` in the Control Center. This packet does not approve implementation of a remediation, new recipe, CAD claim, supplier handoff, or physical sample. Its findings inform C03/C04, which remain queued until C01 and C02 evidence are accepted.
