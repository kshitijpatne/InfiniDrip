# C04 — Technical-pack, view, revision, and CAD contract

**Status:** In progress; Slices 223–224 record the current-output audit and
canonical record/revision contract.<br>
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

## Slice 224 — canonical production-record and revision contract

### Source facts and product decisions

**Sourced:** Techpacker's official documentation describes component/card
records for sketches, materials and measurements, related attachments and
annotations, plus saved versions and prior shared versions. Its current help
center describes saving a version as a snapshot. This is useful workflow
evidence for linking information to a component and preserving sent versions.
See Techpacker's public [component/card documentation](https://documentation.techpacker.com/techpack.html),
[current tech-pack/version guide](https://helpcenter.techpacker.com/hc/en-us/articles/42614589516179-How-to-create-Tech-Packs),
and [version access/restore guide](https://helpcenter.techpacker.com/hc/en-us/articles/360033521034-How-to-create-a-techpack-version),
accessed 2026-09-24. These are vendor feature descriptions, not a universal
industry rule or proof of factory acceptance. C02's Techpacker, CLO-SET and
Browzwear comparisons remain specialized product evidence; their feature lists
do not define InfiniDrip's schema. RFC 8785 and [NIST FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
are used only to support deterministic representation and change-detection
semantics. NIST's page includes a planning note that FIPS 180-4 is slated for
revision; the C04 contract does not claim FIPS compliance.

**Decision:** use one typed, linked style revision as the source of truth. A
PDF, image, DXF or line sheet is a generated view of that revision; edits happen
to editable records and create a new revision. A page must not become a
separate source of measurements, BOM or approvals. Component records may be
edited independently in the interface, but must resolve to one coherent style
revision before the system calls the record internally approved or freezes a
shareable packet.

### Canonical record graph

These are logical record types, not a database or API implementation. Every
entity has a stable ID scoped to its style, schema version and revision
reference. When the same conceptual entity persists across revisions, its ID
persists; renamed labels do not change identity, and retired IDs are never
reused. Each revision snapshots the exact entity versions it references.

| Record | Required contract fields | Why / current gap |
| --- | --- | --- |
| **Style** | Stable `styleId`; name/style code; garment family and recipe ID/version; owner; created/updated timestamps; intended use; declared measurement units. | Current app/recipe name and local saved design are not a cross-revision product identity. |
| **Style revision** | Stable `revisionId`; `styleId`; parent revision; ordered display revision; schema/rule versions; edit reason; author/time; canonical content digest; author/reviewer decisions with scope/time; state. | Every page currently renders live recipe inputs but is not bound to an immutable approved revision. |
| **Design inputs** | Each input's stable field ID, value, unit, C03 `semanticKind`, C03 `provenance`, capture/source/method, validation state and dependency references. | Recipe measurements/options currently do not consistently retain field-level provenance. |
| **Size contract** | Explicit mode `single_size` or `graded_run`; base-size label and underlying measurement/spec values; for `graded_run`, approved grade-rule ID/version, ordered size labels, increment/rule per target dimension and scope. | C03 requires one size first; a multi-size run requires separately selected/approved rules and must not be inferred from body measurements. |
| **Component/pattern piece** | Stable `componentId` and role; geometry/rule revision; displayed name; cut quantity/layers; cut-on-fold and orientation; grain/stretch direction when known; seam-allowance policy; marks/notches; included sizes; view IDs. | Current pieces have display names, fold flags, geometry and optional marks; a printed name is not a durable component identity. |
| **Seam relationship** | Stable `seamId`; two named component/edge references; seam pairing/match method and measured lengths; allowance/finish; construction operation; revision and validation status. | Current checks may compare named edges, but exports do not give a receiver a semantic paired-seam map. |
| **Technical view/callout** | Stable `viewId`, view type/state, camera/projection or drawing basis, revision; stable `calloutId`; target component/edge/seam/POM/artwork reference; label/detail/line style; page/layout role. | Current labels are generated from piece names and front-only optional POM anchors; no complete view/callout object graph exists. |
| **POM specification** | Stable `pomId`; C03 semantic kind; definition/method/garment state; units; geometry or view mapping; target value per included size; tolerance status (`SPECIFIED`, `NOT_SPECIFIED_BY_DECISION`, or `UNRESOLVED`), interval and authority/source when specified, with optional per-size overrides; formula/input/revision references. | Current `Pom` has a label, block function, optional front anchor and one optional symmetric tolerance; `SpecRow` has labels/values/tolerance only. |
| **BOM/material/trim** | Stable row/article IDs; component/placement; material or trim category; composition/content, construction, weight, width/dimensions, finish, colorway and direction/behavior where relevant; quantity/value/unit and quantity basis; requiredness/status; provenance/source; substitutions; currency/cost type/date when supplied. | Current BOM output is three free-text fields and cannot distinguish a default estimate, marker quantity, supplier quote or order quantity. |
| **Construction operation** | Stable `operationId`; sequence; affected component/seam references; operation/process; seam/stitch construction fields as known; machine/needle/thread parameters only when specified; critical-to-quality checkpoint and acceptance method/source; unresolved reason. | Current ordered strings are not component-linked or sufficiently structured to establish a factory method. |
| **Colorway/artwork/labels/packaging** | Stable IDs; approved color/material mapping; placements and dimensions; source file/digest; creator/source/license state; position/scale/rotation and target component; label content/location; packaging specification/source/status. | Artwork placement export exists, but the record is not a colorway approval, label/packaging spec or rights ledger. |
| **Cost record** | Amount, currency, basis/unit, included/excluded costs, scenario, source/provenance, quote/estimate date, supplier/article or formula references, expiry/status. | No current recipe quantity or default cost is an independently validated quote. Missing cost is unresolved or not provided, never zero. |
| **Digital validation** | Rule/check ID/version; input revision; pass/fail/warning; affected IDs; time; output/evidence reference. | Existing digital checks validate declared software invariants only; their scope cannot silently grow into physical-fit evidence. |
| **Sample/QA round** | Exact source `revisionId`; sample/round ID; size, colorway/material/article/lot; made-by/date/source; method/instrument; measured actual per stable POM; variance to that revision's prediction/tolerance; issue/action/disposition; evidence references and reviewer/time. | Current Fit Record is paper-only. No current physical sample or stored actual readings are evidenced. |
| **Export/packet manifest** | Exact revision and schema/rule versions; selected sizes/colorways; deterministically sorted artifact IDs, media types and byte lengths; per-file SHA-256 digests; generator version; unresolved/blocked list; creation time; packet digest. | Current exports are separate files without one immutable manifest binding their shared design state. |

#### Field envelope and provenance

All measurable or decision-bearing fields use a common envelope, whether
stored as a scalar or structured value:

```text
fieldId, semanticKind, value, unit,
provenance, sourceRef, method, capturedBy, capturedAt,
inputRefs, ruleId/ruleVersion,
validationState, unresolvedReason, evidenceRefs
```

`sourceRef`, `method`, `inputRefs`, `ruleId` or `evidenceRefs` may be absent
only when they do not apply to that provenance; absence cannot imply approval.
Use C03's exact provenance values: `USER_CAPTURED`, `USER_SELECTED`, `PRESET`,
`INHERITED`, `CALCULATED`, `SUPPLIER`, `SAMPLE_ACTUAL`, `IMAGE_OBSERVED` and
`UNRESOLVED`. `confidence` stays `NOT_ASSESSED` unless a defined method,
population/domain, uncertainty basis and validation record justify another
state under C03. Do not create a percentage or a `high confidence` shortcut.

| Value case | Required provenance/trace | Forbidden inference |
| --- | --- | --- |
| Manually entered body, garment, BOM or cost value | `USER_CAPTURED` or `USER_SELECTED`; retain unit, method/selection and actor/time. | A user entry is not independently measured, approved or a supplier fact. |
| Recipe default or chosen library block | `PRESET`, with recipe/block ID and version. | A default is not a user measurement, sourced body population, brand fit or accepted construction. |
| Geometry/POM/spec calculation | `CALCULATED`, exact input IDs, formula/rule version, geometry/revision and units. | Calculation does not establish physical fit or tolerance authority. |
| Inherited unchanged value | `INHERITED`, prior revision and original provenance/source. | Inheritance does not upgrade evidence or approval. |
| Supplier offer/material fact | `SUPPLIER`, supplier identity, article/quote ID, dated evidence, currency/unit/expiry and revision it concerns. | A directory listing or stale quote is not current availability, price, capacity or an order. |
| Actual physical sample observation | `SAMPLE_ACTUAL`, sample round, exact revision, garment size/material, method, instrument, actor/time and evidence. | A blank form, render or simulated result is not a physical measurement. |
| Photo-derived observation | `IMAGE_OBSERVED`, source asset/license state, identified feature/region, scale status and observable limits. | An unscaled photo cannot establish exact dimensions, composition, strength, stretch/recovery or cut feasibility. |
| Required missing/conflicting fact | `UNRESOLVED`, affected field/dependencies, why it matters and next evidence/action/owner. | Empty, zero, dash, default or guessed values cannot make an unresolved field look complete. |

Every target value also states whether it is body input, design choice, pattern
parameter, calculated finished POM, source fact or actual sample result under
C03. A tolerance status is `SPECIFIED`, `NOT_SPECIFIED_BY_DECISION` (with the
decision source/actor/time/reason), or `UNRESOLVED` (with the missing source or
method and next action). Only `SPECIFIED` carries a sourced interval per POM,
with optional per-size overrides; asymmetric lower/upper limits are
representable. The comparison method, garment state and units are bound to
that interval. A pass/fail result cannot be computed when tolerance or method
authority is unresolved or intentionally unspecified. Output labels distinguish
“Not specified” from “Unresolved”; neither is an empty dash. Units are stored
per quantity; conversions retain source value and the deterministic conversion
rule. Cost always includes currency and basis.
Quantities distinguish, for example, `m per garment`, `m per marker/run`,
`pieces per garment`, supplier pack/MOQ and ordered total.

#### Stage-aware completeness

One global “complete” flag is unsafe because a concept, reviewable drawing,
quote request and production release have different information needs.

| Stage | Required to enter the stage | Allowed unresolved information | Result label |
| --- | --- | --- | --- |
| **Editable draft** | Style/revision identity; selected recipe/version; unit-bearing input records; explicit one-size or separately approved grade mode; valid geometry for any pattern export. | Facts not needed for the operation the user is performing, including source, cost, material article and physical evidence; every unresolved item stays visible. | `Draft` or `Draft with unresolved fields`; never fit-approved. |
| **Internal digital review** | All draft requirements; deterministic checks run against exact inputs; every view/spec/BOM/operation is traced or visibly unresolved; blocking geometry errors preserved. | Unapproved external methods, material facts, tolerance authority and physical fit may remain unresolved with named follow-up; they block claims/exports that depend on them. | `Digital checks passed/failed` plus separate unresolved and physical-evidence state. |
| **User-approved design snapshot** | Named user approval against exact revision digest and explicit scope (design/options, size mode, colorways and content). | Qualified technical review, supplier facts, sample, fit and production remain separate; their absence prevents those labels. | `User approved for stated scope`; not factory-ready. |
| **Supplier quote packet** | A later supplier-workflow decision defines process, sizes/colorways, material/operation facts or explicit questions, quantity/MOQ basis, requested delivery and currency; packet pins one frozen revision and lists quote blockers. | Supplier-dependent prices/availability and explicitly asked supplier questions. | `Quote request` with unresolved questions; not an order or production authorization. |
| **Production release** | **Not admitted by C04/G01.** Requires a later owner-approved stage policy, exact material and construction, approved required grade, immutable supplier agreement, closed critical unknowns, qualified review and the maintainer-reopened physical-sample gate. | No release-critical field may be silently unknown or guessed. | No current InfiniDrip record may claim production release or factory-ready status. |

Supplier-specific mandatory fields cannot be finalized here without a chosen
supplier process, geography, delivery terms, order quantity and product
category. This contract defines the field support and makes facts visible; G05
and authorized G12 work must define the supplier/quote-specific requiredness
matrix before outbound use.

### Revision, approval, freeze and dependency semantics

**Decision: revision states are explicit immutable snapshots.**

```text
DRAFT → REVIEW → APPROVED (scoped) → FROZEN_FOR_SHARE
  └──────────── corrections create a new child draft revision ──────────────┘
FROZEN_FOR_SHARE → SUPERSEDED only when a successor exists; old bytes stay
available and unchanged. Restoring old content creates another new child draft.
```

- Each edit writes to a draft revision. `APPROVED` records who approved which
  scope and exact revision digest; approval is not implied by a passed digital
  check or by the actor who authored it.
- A frozen revision and its manifest are read-only. A change creates a child
  revision with a parent pointer and change summary; never overwrite a version
  already shared or referenced by a quote, sample or approval.
- Restoring a version copies it into a new draft revision, not mutation in
  place. It retains original lineage and citations while requiring fresh
  approval.
- `FROZEN_FOR_SHARE` means only “these exact records/files were packaged for
  this stated audience and purpose.” It does not mean production release,
  supplier acceptance, physical fit, rights clearance or order authorization.
- Sample, quote, review and communication records refer to an exact revision
  ID and digest; they never float to “latest”. A later comparison may re-use
  an old physical reading only through an explicit method/landmark crosswalk;
  it creates a new evaluation and never rewrites the recorded reading or its
  original acceptance decision.
- Digital checks are stateful records, not a revision-level boolean. A change
  to any input in a check's dependency set marks its result `STALE` until rerun.
  Failed values remain visible with actionable errors; they are not clamped or
  replaced.
- Approval invalidation is scope-specific and conservative. If a changed field
  is in the approval's dependency graph, the child revision starts unapproved
  for that scope. Prior evidence is linked as lineage, not copied as fresh
  approval.

| Changed source record | Dependent outputs/checks to invalidate or regenerate | Evidence that remains pinned to the old revision |
| --- | --- | --- |
| Body or desired-measure input | Draft geometry; pattern pieces; seam/mark geometry; derived POMs; size output; views/callouts; pattern/PDF/CAD exports; dependent digital checks. | Prior user approvals, frozen packet, sample actuals and supplier quote. |
| Recipe/block/formula/options | Affected geometry/components/edges; seams; POM calculations; construction/BOM selections; views; size checks; exports. Use declared graph dependencies; do not mark unrelated fields stale by guess. | Prior revision records and physical observations. |
| Size mode, base size, grade rule or labels | All affected size geometries, per-size POMs, grade tables, size labels, marker inputs, views/specs and exports. A single-size design does not gain a grade implicitly. | Existing sample actuals retain the size/rule context of their revision. |
| Material, article, color or quantity basis | Linked BOM/colorway/cost, operations/compatibility, marker consumption if applicable, affected views and packet files. Recalculate pattern geometry only when the named drafting rule consumes a material property. | Unchanged body and geometry inputs; earlier quote/sample remain old-revision evidence. |
| Artwork, label or packaging placement/content | Linked component/placement, colorway, rights/status review, technical/detail views, artwork/BOM page and packet. Pattern geometry only if an approved rule explicitly depends on it. | Unchanged POM/seam records; prior approved artifact remains pinned. |
| Operation, stitch/seam or seam allowance | Linked component/seam graph; operation list; construction/detail views; relevant cut outline/allowance and pattern files. Recalculate a finished POM only if its geometry/method dependency changes. | Prior sample readings and supplier decisions remain pinned to the prior method/revision. |
| POM definition, method, unit, target or tolerance | Corresponding POM values, diagram/callout, size table, sample comparison, relevant check and every spec/packet export. Changing tolerance invalidates pass/fail disposition. | Actual readings remain immutable with original method; remapping needs an explicit crosswalk, never overwrite. |
| Technical-view/page template or exporter version | Generated view/artifact outputs only; preserve engineering inputs. Record renderer and schema versions in manifest. | Prior emitted bytes and any shared packet remain retrievable. |
| Supplier quote, MOQ, capacity or delivery term | Supplier/cost record and related quote decision; new quote or explicit delta request against a new frozen digest if style facts changed. | Style revision does not silently mutate; past quotes remain dated evidence only. |

If one edit has a wider dependency than listed, dependency metadata must define
it before implementation; unknown dependency means the affected approval,
check or export is marked stale, not assumed unchanged.

### Frozen manifest and cryptographic boundary

**Decision:** use two deterministic digests with separate meanings:

1. `revisionContentDigest = SHA-256(UTF-8(JCS(revisionPayload)))`, where JCS
   is [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html). The payload
   contains the immutable style/revision identity, parent, schema and rule
   versions, selected recipe/options/measurements/size mode, all linked
   component/POM/BOM/operation/colorway/cost records, provenance, validation
   evidence references, and cryptographic digests of source assets. It excludes
   the digest field itself, approval/freeze events, view-rendered files and
   volatile `createdAt`/`lastViewedAt` metadata. Approval events reference the
   digest and are recorded separately, avoiding a self-referential hash.
2. `packetDigest = SHA-256(UTF-8(JCS(packetManifestPayload)))`. The manifest
   contains the exact `revisionContentDigest`, requested audience/purpose,
   selected sizes/colorways, schema/rule/exporter versions, immutable
   `approvalRefs`, unresolved list, and each emitted artifact's stable ID,
   fixed generated path, media type, byte length and SHA-256 of its exact bytes.
   It excludes its own digest, the later freeze event and volatile generation
   timestamps. The artifact list is sorted by stable ID; ordered semantic rows
   and page order retain explicit sequence values.

JCS property ordering and JSON number rules make serialization reproducible.
The contract requires UTF-8 canonical bytes, unique object keys/record IDs,
rejection of `NaN`/infinity, explicit units for every quantity and source
values retained across deterministic unit conversions. Current application
numbers fit the JavaScript binary64 data model; future values beyond that
precision must use an explicit decimal-string plus scale/unit representation,
not a lossy JSON number. Before JCS, every unordered record collection is
sorted by stable ID; ordered collections use explicit sequence/order fields.
Unicode strings remain code-point-identical; the serializer does not silently
normalize design names or source text. Generated paths use safe stable IDs and
a deterministic extension, never user-supplied filesystem paths.

NIST's [Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
describes message digests as a means to detect whether data changed. These
digests are integrity/change identifiers only. They do not prove source
authenticity, license rights, a person's identity, data accuracy, approver
authority or recipient acceptance; those require separate provenance and
approval records. An external share must show the style/revision, purpose,
digest, selected size/colorway, included files and unresolved questions for
explicit user selection. This contract does not create or send a handoff.

### Slice 224 review record and exit boundary

- Compared the contract to C03's exact value/provenance vocabulary and
  one-size/grade split; it does not introduce a competing enum or imply that
  any current recipe is fit-qualified.
- Recorded stage-specific readiness, component/POM/BOM/operation/colorway/
  sample/cost/export record requirements, conservative dependency invalidation,
  scoped approval and immutable revision/freeze behavior.
- Added Techpacker's public card/version documentation as a vendor workflow
  comparator, and RFC 8785/NIST FIPS 180-4 as primary deterministic-hash
  references. They support design rationale only, not apparel or production
  certification.
- No database, code, serializer, export, supplier message or sample changed.

Slice 224 exits with the conceptual record/revision contract defined. It does
not finish C04; Slice 225 still owns drawings/layout/CAD semantics and fixtures,
and Slice 226 owns integrated challenge and final acceptance.
