# C04 — Technical-pack, view, revision, and CAD contract

**Status:** In progress; Slice 223 records the current-output audit and the
contract decisions that bound later C04 work.<br>
**Snapshot:** 2026-09-24.<br>
**Authority:** G01 contract/evidence only. No exporter implementation, new
garment, external CAD license, supplier handoff, production-readiness claim,
or physical sample is authorized here.

## Purpose and decision boundary

C04 translates the accepted C01/C02/C03/C05/C06 evidence into a testable
technical-pack and exchange contract. Its job is to specify what a future
versioned product record and its outputs must contain, what each output can
prove, how edits affect dependent records, and which gaps must remain visible.
It does not certify a universal factory-ready document: the reviewed sources
do not establish one universal tech-pack schema, and no current InfiniDrip
export has been accepted by a named apparel CAD receiver or factory.

This is a design contract, not a description of shipped capability. Current
behavior is labeled **Observed**; standards and vendor documentation are
**Sourced**; product rules are **Decision**; unresolved external or empirical
questions are **Open gate**. Calculated/predicted records and actual physical
evidence stay distinct throughout.

## Slice sequence

| Order | Work | Deliverable and gate |
| --- | --- | --- |
| 223 | Audit current tech-pack, POM, pattern and DXF behavior against C01 and source code. | This observed-baseline record; no unsupported output or interoperability claim. |
| 224 | Define the canonical pack-record fields, provenance, revision lifecycle, dependency invalidation, approvals and frozen-manifest semantics. | Field-level contract consistent with C03's semantic and provenance vocabulary. |
| 225 | Define view inventory, semantic callout mapping, page/render rules, current DXF profile and future CAD route. | Exact separation of finished flats, pattern layouts, specs, samples and CAD; explicit no-go where a receiver or rights proof is absent. |
| 226 | Reconcile simple/difficult fixtures, negative cases, traceability, source limits and all C04 criteria. | Reviewed C04 packet with evidence; only then move the final G01 review to Ready. |

Each landed change gets its own unique slice number at execution. This order is
serial; a contract section is not accepted merely because a prior slice added
it.

## Slice 223 — observed implementation baseline

### Technical-pack PDF

**Observed in `src/export/techpack.ts`:** the PDF has four default sections and
may append one or more artwork-placement pages when artwork exists:

| Current section | Exact current behavior | Evidence limit |
| --- | --- | --- |
| Page 1, titled “Tech Pack” | Drafts the recipe at the supplied measurement set; flattens each pattern piece, lays the pieces out side by side, fits the whole layout to the page, labels pieces, and draws optional POM leaders only for POMs with front-piece anchors. | This is a fitted cut-piece layout, not a finished-garment front/back/side technical-flat set. It is not true-scale because it is scaled to the page. Piece labels and leaders can collide. The C01 rendered Polo and woven-shirt pages show actual collisions and extensive unused page area. |
| Page 2, “Measurement Spec (cm)” | `gradeRun` drafts the recipe's configured size sequence; `specSheet` calculates recipe POM queries from each graded block; values are rounded to 0.1 cm; a POM-level tolerance is repeated by size or shown as `-`. | Values are calculated from current digital geometry, not measured garments. The table does not attach field-level origin, method, approval, formula revision, or a status explaining an absent tolerance. |
| Page 3, BOM and construction | Prints each recipe's material, placement, and quantity strings plus ordered construction strings. Some recipes select option/fabric-dependent text. | `BomRow` currently has only `material`, `placement`, and `qty`; the values may be defaults/estimates. There is no stable BOM row identity, composition/article/usable width, quantity basis, source, cost currency/date, approved substitute, operation-to-seam link, or persisted supplier confirmation. |
| Page 4, Fit Record | Prints the base-size predicted POMs and blank lines for fabric, sewer, date, actual value, and pass; it is a plain printable page. | It is not an editable/persisted sample-round record. Writing on the paper does not update InfiniDrip. No physical sample is evidenced by a blank form. |
| Optional artwork pages | Lists artwork placement IDs, kind, piece role, dimensions, transforms and source name; invalid placements are labeled. | A placement sheet is not a full colorway/artwork approval record or source-license record. It does not supply garment technical flats. |

`exportTechPack` receives the current recipe, measurements, optional fabric,
options, artwork placements and a style label. The recipe owns POM functions,
grade rules, current size steps, BOM/construction strings and seam allowances.
The data does not yet represent one versioned style graph binding every page,
asset, input, review and export to a frozen release.

**Observed visual evidence:** the C01 actual PDF inventory and SHA-256 manifest
are in [`evidence/C01/MANIFEST.json`](evidence/C01/MANIFEST.json). The actual
rendered first pages
[`Polo`](evidence/C01/polo-techpack-page-1.png) and
[`woven shirt`](evidence/C01/woven-shirt-techpack-page-1.png) show overlapping
piece labels; POM leaders run across the available drawing area. This confirms
a current legibility defect, not merely a theoretical layout risk. Other C01
recipe PDFs remain required test fixtures; the two complex pages are the
observed difficult cases.

### POM and predicted/actual distinction

**Observed:** `Pom` holds a label, a function that reads a drafted `Block`, an
optional front-piece point anchor, and an optional numeric tolerance.
`SpecRow` holds a label, size values and optional tolerance. `specSheet` computes
the values directly from each graded block and rounds them to one decimal
centimeter. `sampleSpec` supplies page-four predicted values. These are useful
geometry queries; they do not measure an actual sample.

**Decision:** C04 reuses C03's exact `semanticKind`, `provenance`, confidence,
source/method, formula/input dependencies and unresolved-state vocabulary. A
draft-derived POM remains `FINISHED_POM + CALCULATED`, bound to its exact style
and pattern revision. A physical reading is `FINISHED_POM + SAMPLE_ACTUAL`,
bound to a named sample round, garment size, material/colorway and immutable
design revision. Predicted values never get overwritten by actual readings.
An optional tolerance that has no authority remains explicitly unspecified;
it is never converted into a pass/fail judgment.

### Pattern layout and DXF

**Observed in `src/export/layout.ts`, `src/export/dxf.ts`, and
`src/export/pattern-mark.ts`:**

- A `Piece` stores a name, a closed outline made of named line/curve edges, an
  `onFold` flag, optional dart edge references and optional construction marks.
- `flattenPiece` produces true-scale centimeter sew and cut outlines. The cut
  outline is computed with the chosen seam-allowance policy.
- `layoutPieces` places the passed pieces left to right at true scale with a
  1 cm outside margin and 2 cm inter-piece gap; it does not nest or rotate them.
- `exportDxf` writes a minimal text DXF entity section using old-style closed
  `POLYLINE`/`VERTEX`/`SEQEND` entities on `CUT` and `SEW` layers. It flips Y
  into the CAD-up direction. Pattern marks emit line, circle or point entities
  on `MARK_*` layers. Coordinates follow the app's centimeter convention.
- The returned file has an `ENTITIES` section and `EOF`; it does not currently
  emit a header/table/metadata contract, explicit drawing-unit declaration,
  stable pattern-piece record, grade-rule file, size-run package, paired seam
  relationship, full marker/cutter data, BOM or production spec.
- The writer serializes the pieces passed to it. It does not itself make a
  graded run or preserve a base-to-grade relationship. DXF parsing success
  would establish syntax/geometry only, not apparel-CAD compatibility.

**Sourced:** Autodesk describes DXF as a tagged drawing-data representation;
its documentation distinguishes file version and unit variables. ASTM
D6673-10 was withdrawn in 2019; the former practice described DXF pattern data
plus a separate ASCII grade-rule exchange, and explicitly excluded production
specifications and relationships between 2D/3D pattern pieces. It is historical
scope evidence, not a current compliance target.

**Decision:** the current export must be described narrowly as a generic,
minimal DXF of the passed piece geometry and marks. Do not claim AAMA/ASTM,
apparel CAD, grade-rule, cutter, plotter or factory interchange. Do not add an
apparel-specific profile to C04 without the named receiving application,
version, exact data scope, rights review and a receiving-app or independent
parser round trip. No target app/license has been selected or tested in this
packet; a future profile stays an explicit gate rather than a guessed standard.

## Sources and limits used in Slice 223

- InfiniDrip code: [`techpack.ts`](../../../src/export/techpack.ts),
  [`pom.ts`](../../../src/drafting/pom.ts),
  [`recipe.ts`](../../../src/drafting/recipe.ts),
  [`layout.ts`](../../../src/export/layout.ts),
  [`dxf.ts`](../../../src/export/dxf.ts),
  [`pattern-mark.ts`](../../../src/drafting/pattern-mark.ts).
- Accepted C01 output audit: [`C01`](C01-RECIPE-PROFESSIONAL-BASELINE.md),
  including the PDF manifest and rendered page evidence.
- Accepted C02 standard/tool evidence: [`C02`](C02-STANDARDS-AND-TOOL-COMPARISON.md).
- Accepted C03 semantics and provenance: [`C03`](C03-MEASUREMENT-AND-DONOR-CAPTURE-CONTRACT.md),
  especially its `semanticKind`, provenance and `SAMPLE_ACTUAL` contract.
- Autodesk, [DXF file format](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-235B22E0-A567-4CF6-92D3-38A2306D73F3.htm),
  [DXF header variables](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm),
  and [drawing insertion units](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm),
  accessed 2026-09-24. These describe generic DXF/AutoCAD fields, not apparel
  CAD behavior or InfiniDrip interoperability.
- ASTM, [D6673-10 — withdrawn in 2019](https://store.astm.org/d6673-10.html),
  accessed 2026-09-24. Public scope/significance text is used only to describe
  the former exchange scope and its omissions; no standard text is copied into
  product logic.
- ASTM, [D6193-16(2025)](https://store.astm.org/d6193-16r25.html),
  accessed 2026-09-24. It is a source vocabulary for stitch/seam classification
  and selection context, not a complete operation specification or an
  InfiniDrip conformance claim.

These sources establish data-format and standards scope only. They do not prove
that an InfiniDrip PDF, DXF, pattern, measurement, material choice or operation
will be accepted by any factory. C02's public vendor features are untested in
paid accounts and remain comparator evidence, not an acceptance oracle.

## Slice 223 review record and exit boundary

- Re-read the production source for the tech-pack writer, POM query/data model,
  recipe-owned BOM shape, flattened pattern layout, DXF writer and pattern-mark
  serializer; checked the described writer behavior against the relevant
  source tests.
- Re-opened the actual C01 rendered Polo and woven-shirt page-one images. Both
  visibly contain colliding labels; the rendered page evidence and full seven-
  recipe PDF SHA-256 manifest are retained under `evidence/C01/`.
- Ran `npx vitest run src/export/techpack.test.ts src/export/export.test.ts`:
  2 files and 46 tests passed. This verifies current writer behavior; it does
  not establish apparel acceptance or physical fit.
- Checked all 17 local Markdown links in this packet and ran `git diff --check`.
- No product code, exporter output, baseline hash, supplier workflow or physical
  sampling path changed.

Slice 223 exits with the current output capability/limit matrix recorded. It
does not satisfy the full C04 acceptance criteria. Slice 224 must establish the
canonical field/provenance and revision/freeze contract; Slice 225 must close
the technical-view and CAD decision boundary; Slice 226 must run the combined
traceability/fixture review and attach verified C04 evidence before final G01
review can start.
