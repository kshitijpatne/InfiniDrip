# InfiniDrip trouser research and digital contract

_Slice 94 research record — reviewed 2026-09-12._

This document defines the evidence boundary for the first trouser block. It is
the source of truth for the Epic 3 contract until a later, explicitly recorded
decision changes it. It distinguishes sourced construction guidance from
product decisions, digital estimates, and the physical questions that remain
unanswered.

## Product scope

The first trouser is a **relaxed casual straight-leg trouser** for a woven
fabric. It is a reusable lower-body block, not a denim, tailored, cargo,
jogger, or shorts pattern. The V1 block contains:

- separate front and back leg panels for a center-front fly and center-back
  seam;
- a separate, closed waistband component;
- a simple front fly/zip closure with one waistband fastening represented by
  explicit pattern marks and construction data; and
- one minimal angled side/front pocket opening and pocket bag per side.

Back pockets, cargo pockets, coin pockets, pleats, belt loops, elastic waists,
drawcords, cuffs, stretch-specific behavior, and decorative details are out of
scope. The chosen pocket and closure are conservative V1 product decisions,
not claims that they are the only correct trouser constructions.

The later shorts and jogger relationship is part of the contract, but those
garments are not implemented in Epic 3. They reuse the lower-body block's
waist/seat/rise/crotch, grading, waistband, closure, pocket, check, and export
interfaces. Shorts change the hem/length policy; joggers change the lower-leg
and hem/waist treatment. Their own ease and construction choices must be
researched before implementation.

## Evidence boundary

The local references are condensed working references supplied for this
project. They are useful for terminology and construction checklists; they do
not provide a universal trouser formula. The reviewed local sources are:

| ID | Source | Relevant evidence |
| --- | --- | --- |
| L1 | `F:\\tank-sketches\\scribd - garment-design - files\\226112995-Pattern-Making.pdf`, pp. 2–5, 8–15 | Block/master-pattern lifecycle; body girths and verticals; waist, hip, upper hip, thigh, knee, calf, ankle, inside/outside leg, crotch depth/body rise; size charts and regression examples are context, not universal formulas; seam allowance varies with stress, curvature, fabric, and machinery. |
| L2 | `aqm1_spec_sheet_detailed_reference.docx` | Finished POM discipline; relaxed/extended waist; waistband height; front/back rise including waistband; seat at a fixed distance below waistband; thigh, leg opening, inseam, fly and pocket POMs; operation order. |
| L3 | `garment_measurement_quick_reference.docx` | Flat finished-garment measuring convention; separate front/back rise, outseam, inseam, thigh, knee, leg opening, waistband, and pocket measurements; relaxed and extended measurements must not be conflated. |
| L4 | `pattern_drafting_quick_reference.docx` | A pattern is a 2D template; wearing ease and design ease are separate; collect and verify measurements, draft, test, evaluate, revise, and store. |
| L5 | `pattern_making_body_measurements_reference.docx` | Body measurement technique, balance/grain checks, fit-test workflow, and grading principles. Its example bodice ease values are not trouser values. |
| L6 | `stitches_seams_detailed_reference.docx` | Lockstitch, chain, overedge, and blind-chain use cases. Machine settings and SPI examples require material testing and are not pattern behavior. |

The following open references were also reviewed on 2026-09-12:

- [New Mexico State University — Making Perfect Pants](https://pubs.nmsu.edu/_c/C227/)
  identifies waist/hip, thigh, knee, sitting crotch depth, and separate front
  and back crotch-length concerns; it recommends comparing body measurements
  plus ease with the pattern and fitting before applying the zipper.
- [Cornell University — Draping the Human Form: pants](https://fit.cit.cornell.edu/textiles/draping/drapes/pants/steps/print.html)
  uses a T-square crotch-depth measurement, a hip balance line, separate front
  and back hip arcs, and shallower front versus deeper back crotch shaping in
  a basic slack drape.
- [University of Minnesota — Building patternmaking theory: a case study of published patternmaking practices for pants](https://experts.umn.edu/en/publications/building-patternmaking-theory-a-case-study-of-published-patternma/)
  reports that variation was needed for all seven studied body shapes; this is
  evidence against treating a single published ease or crotch rule as a
  universal fit solution.
- [Virginia Tech — The development of a method for determining the best-fit shape for the crotch seam of men's pants](https://vtechworks.lib.vt.edu/items/d0cf1577-d74a-41a9-990b-ea620e1dd67c)
  describes the crotch as a difficult fit area and reports that the best-fit
  curve differed from the pattern curve; it also notes that ease and style
  features lacked an established scientific incorporation method.

### Evidence conclusions

1. Use separate body measurements, finished POMs, and design controls. A
   finished rise including the waistband is not interchangeable with a body
   crotch depth, and a relaxed waist is not an extended waist.
2. The digital block may use a transparent, parameterised approximation for
   crotch curves and ease, but it must name the approximation and expose the
   controls. It must not present a regression example or a single textbook
   formula as a universal fit law.
3. Front and back rise/crotch behavior must be represented separately. The
   block must preserve the center-front/center-back, hip, knee, hem, and grain
   landmarks needed to inspect balance.
4. Seam allowances are construction data, not hidden geometry. V1 uses the
   existing semantic allowance table and records every special allowance; a
   future material-specific allowance decision is separate.
5. Digital checks can establish finite, coherent, connected, exportable
   geometry. They cannot establish fit, comfort, production readiness, or
   physical seam performance.

## Existing-engine reuse audit

The existing engine already provides the right seams between a recipe and the
product surfaces:

- `Measurements`, `FIELDS`, `inputError`, facets, plausibility, raw invalid
  input preservation, and versioned persistence provide the established
  measurement contract. New lower-body measurements must be added to all six
  registries deliberately, not hidden in a trouser-only object.
- `Block`, role-keyed `Piece`, named edges/curves, internal `Mark`s, `Stitch`,
  `Interface`, `Component`, `assembleComponents`, `GradeRule`, `draftAtSize`,
  `gradeRun`, `Pom`, `PieceNotches`, allowances, `garmentReport`, and the
  generic SVG/DXF/PDF/projector/tech-pack writers are reusable mechanisms.
- Existing skirt waistband code is an implementation reference only. It is a
  folded skirt strip with skirt-specific assumptions and a closure-inert
  parameter. It is not silently reused for a trouser waistband. The trouser
  waistband gets a named contract and its own tests; a future shared
  parameterised waistband component may follow the two-consumer rule.
- Knit bodice, tank, polo, and woven-shirt geometry are not trouser geometry.
  Existing lower-body croquis/render helpers may supply presentation framing,
  but the pattern geometry remains the single source of truth.
- Existing numeric recipe options are suitable for V1 construction dimensions.
  A fixed V1 construction type is acceptable; any exposed numeric dimension
  must be persisted, validated, rendered, and reflected in guidance/output.

## Measurement and option contract

All values are centimetres. Names below are intentional: do not use the
upper-body `length` field as a trouser outseam or inseam, because that would
make one control mean different things in the same measurement registry.

### Body and direct controls

| ID | Role | Meaning in the draft | Initial digital range/seed | Source status |
| --- | --- | --- | --- | --- |
| `waist` | body circumference | Body waist girth; lower finished waist uses the declared lower-body ease. | Existing 50–140; STANDARD_M remains 84 | Existing engine field; range is an app guardrail, not a size chart. |
| `hip` | body circumference | Body seat/lower-hip girth at the fullest relevant level. | Existing 60–150; STANDARD_M remains 100 | Existing engine field; source terminology reviewed in L1–L3 and online references. |
| `hipDepth` | body vertical | Waist-to-seat/hip landmark used for balance and seat shaping. | Existing 10–40; STANDARD_M remains 20 | Existing engine field; exact placement remains a measurement protocol choice. |
| `crotchDepth` | body vertical | Sitting waist-to-seat-surface depth, measured with a stable waist reference. It anchors the front/back rise relationship; it is not a finished rise POM. | 16–40; provisional seed 27 | Terminology/method supported by L1, L2, L4 and the online references; numeric seed is a product estimate. |
| `thigh` | body circumference | Upper-thigh girth at the documented point, one inch/2.5 cm below the crotch reference. | 40–90; provisional seed 58 | Point supported by L1–L3 and NMSU; range/seed are digital estimates. |
| `knee` | body circumference | Knee girth at the documented knee landmark. | 30–70; provisional seed 40 | Landmark supported by L1–L3 and NMSU; range/seed are digital estimates. |
| `inseam` | finished vertical | User-owned finished length from crotch seam to hem. It is kept separate from a measured body inseam until a future measurement protocol chooses otherwise. | 55–105; provisional seed 78 | Finished POM is supported by L2/L3; seed is a product estimate. |
| `ease` | design parameter | Total lower-body ease applied to the waist/seat circumferences by the trouser draft. It is not silently reused as thigh, knee, or rise ease. | Existing -30–30; provisional trouser seed 8 | Existing engine parameter; trousers must document its exact placement. |

The existing global defaults remain valid for existing garments. A trouser
default will add the new lower-body fields explicitly rather than infer them
from torso proportions. A missing field in an older save gets a documented
standard trouser fallback; a live invalid value remains visible and pauses the
draft/export verdict.

### Recipe-owned construction/style options

The first implementation uses numeric options for dimensions while keeping the
construction type fixed and explicit. Option values are stored by recipe ID.

| ID | Meaning | Initial range/seed | Contract |
| --- | --- | --- | --- |
| `frontRiseEase` | Finished front rise minus body `crotchDepth`, measured from the top waistband reference to the crotch point. | -2–8; 1 | A direct style control; no hidden clamp. |
| `backRiseEase` | Finished back rise minus body `crotchDepth`, measured on the back center line. | 2–14; 9 | Independent from front rise and used by the back crotch/seat. |
| `waistbandDepth` | Finished waistband height. | 2–8; 4 | Drives the separate waistband piece and finished front/back rise POMs. |
| `thighEase` | Additional finished upper-thigh circumference. | 0–20; 8 | Applied only to thigh; it is not folded into general `ease`. |
| `kneeEase` | Additional finished knee circumference. | 0–15; 5 | Applied only to knee. |
| `legOpening` | Finished hem/leg-opening circumference for the straight leg. | 25–65; 40 | Drives both front/back hem widths and the straight-leg silhouette. |
| `flyLength` | Finished visible front fly length. | 8–25; 15 | Must fit inside the front rise and is represented by marks/pieces. |
| `pocketOpening` | Finished side/front pocket opening length. | 8–25; 16 | Must remain inside the front panel and be paired across sides. |
| `pocketAngle` | Angle of the pocket opening down from the side-waist start. | 35–70°; 58° | A user-adjustable construction dimension; guidance catches an opening that leaves the front panel. |
| `pocketBagDepth` | Finished pocket-bag depth below the opening. | 12–35; 23 | Drives pocket-bag geometry; it cannot extend below the hem or beyond the side seam. |
| `pocketDrop` | Vertical position of the pocket opening below the waistband reference. | 0–15; 2 | A named placement control, not a pixel offset hidden in the renderer. |

The `frontRiseEase`/`backRiseEase` naming makes the relationship to the body
measurement explicit. The finished POMs are derived as
`crotchDepth + riseEase`; the body-panel top is offset by `waistbandDepth` so
the finished POM includes the separate band. The exact default relationship is
provisional digital behavior and must be covered by guidance and rendered
evidence, not described as a validated body-fit formula.

## Drafting and component contract

The V1 `trouser` block uses these roles, with no seam allowance in the base
geometry:

| Role | Purpose | Fold policy |
| --- | --- | --- |
| `frontLeft`, `frontRight` | Mirrored front leg panels with real center-front/fly, side, inseam, waist, and hem edges plus knee landmarks. | Off fold; two physical fronts. |
| `backLeft`, `backRight` | Back leg panels with separate center-back, side, inseam, waist, and hem edges plus knee landmarks. | Off fold; two physical backs in V1 so the back rise/seat seam is explicit. |
| `waistband` | One separate finished strip with top/bottom and short-end closure seams plus center-front/center-back marks. | Off fold; full finished strip. |
| `flyShield` | Simple internal front-fly support piece tied to the center-front/fly marks. | Off fold. |
| `pocketBagLeft`, `pocketBagRight` | Paired minimal pocket bags joined to the named pocket-opening interfaces. | Off fold; two physical bags. |

Every leg panel has named `waist`, `side`, `inseam`, `crotch`, `knee`, `hem`,
and the relevant `centerFront` or `centerBack` edge. Internal marks identify
grain/crease, knee, hip, pocket placement, fly top/bottom, button/buttonhole,
and waistband fold/center references. Marks do not change bounds, seam
allowances, or nesting geometry.

The required sewn interfaces are explicit and length-checked:

- left/right side seams: front side ↔ matching back side;
- left/right inseams: front inseam ↔ matching back inseam;
- center-back seam: back-left ↔ back-right crotch/center-back;
- front fly: both front center-front/fly edges ↔ fly shield/facing contract;
- left/right pocket: front pocket opening ↔ matching pocket-bag opening;
- waistband: the leg waist perimeter ↔ waistband lower edge, with the front
  and back joins labelled separately; and
- waistband short ends: a closed-band seam with a center-back placement mark.

The exact curve control points, seam allowance values, and fly/pocket piece
outline are resolved in Slices 96–98 from this contract. They are not copied
from the skirt or a top garment and are not hidden in a render-only overlay.

### Slice 98 pocket resolution

The V1 pocket is a deliberately small, inspectable construction: on each front
panel, an angled opening starts 3.5 cm inboard of the side-waist endpoint and
travels down/inward by the live `pocketOpening` length at the live
`pocketAngle`. The paired bag uses that exact opening as its upper seam edge,
then closes as a four-edge quadrilateral whose bottom is `pocketBagDepth` below
the opening endpoint. Left/right openings and bags are geometric mirrors. The
bag shape is otherwise fixed in V1; opening length, angle, drop, and depth are
the meaningful user dimensions. No facing, coin pocket, decorative topstitch,
or hidden render-only cut line is introduced.

The pocket-opening line is a construction mark on each front piece, and the
bag's `opening` edge is the matching sew edge. Slice 98 also declares one
allowance map and a notch/grainline row for every emitted role. These are
digital sewing contracts only; a physical bag opening, bag shape, and seam
allowance still require a sewn sample before any fit or production claim.

### Slice 99 guidance, measurement, and production-data resolution

The V1 grade is explicit and constant across the run: waist +4 cm, hip +4 cm,
hip depth +1 cm, sitting crotch depth +1 cm, thigh +2 cm, knee +1.5 cm, and
finished inseam +1.5 cm per size step. Ease and all construction options stay
constant; each size is a fresh draft through the same trouser recipe contract.

The POM table reads finished values from the assembled edges: finished waist,
waistband depth, seat/hip, front/back rise including the waistband, thigh,
knee, inseam, outseam, leg opening, fly length, both pocket openings, bag
depth/width, and pocket drop. Hip depth is labelled as a body reference. The
front-only anchor rule is respected by leaving the back-rise row table-only;
no back coordinate is mislabelled as a front callout in the tech-pack sketch.

Guidance reports, without clamping, waist/hip and hip-depth/crotch ordering,
positive finished dimensions, back-rise-over-front-rise relationship,
waistband and fly reach, thigh-to-knee-to-opening progression, and the pocket
range/panel/rise/knee/hem checks. Each warning names the measurement or option
whose value should change. The BOM and ordered construction notes name the
four-panel body, separate waistband, fly support/zip, fastening, and paired
pocket bags; quantities, hardware, and operation details remain provisional
until material and sewn-sample evidence exists.

### Slice 100 application resolution

`TROUSER` is the single registry source for the lower-body fields, style target
table, draft adapter, checks, guidance, size run, grade rule, POMs, notches,
allowances, tech pack, and the eleven numeric construction options. The style
names remain digital target envelopes; they are not fit or production claims.

The recipe declares the `lower` body region and `frontLeft` exploratory Edit
role because the trouser block has eight roles rather than the conventional
single `front` role. Existing recipes retain the optional region/edit-role
fallback, so the shared application contract stays compatible with legacy
recipe objects.

Pattern, Size run, Spec, Nesting, Check, Guidance, persistence, and export
handlers continue to use the generic recipe/block contracts. The lower-body
Body front/back/pair views and the assembled trouser preview now read the live
four-panel block, waistband, fly shield, and paired bags, including actual
edges/marks and option overlays. The Side view is explicitly labelled as a
schematic drafting envelope and carries no fit or drape assertion. Edit remains
a transient preview-only surface and does not save geometry overrides.

The application warns and gates the digital verdict when a trouser is paired
with a knit material; it does not silently reinterpret the woven construction.
Slice 100 adds no physical sample, production-readiness, surface-design,
Polo-V2, shorts, or jogger evidence. Parsed trouser output and live responsive
browser verification remain the work of Slices 101–102.

### Slice 101 output resolution

The existing output writers remain the contract boundary; the new trouser does
not introduce a parallel format or a render-only export shape. The actual
selected-size artifact run is kept in the thread evidence folder
`epic3-slice101-outputs/` and is independently reopened by structural parsers
before visual review.

The first true-scale L-size A0 attempt exposed a real layout failure: the
generic nest reported `fits=false` and a 291.056 cm fabric-length estimate,
while the one-page render could not show all eight long trouser pieces. This
was resolved as an explicit recipe capability, `a0Overflow`, rather than a
generic fallback that would alter existing outputs. When enabled, the A0
writer emits one whole piece per landscape A0 page, rotates a long piece only
when it fits at true scale, retains notches/grainlines/marks/fold labels, and
embeds the 10 cm calibration square. A piece that cannot fit either
orientation throws instead of scaling or silently clipping. Existing recipes
leave the capability off, so the legacy one-page path and all eight baseline
hashes remain unchanged.

The first rendered trouser tiled PDF also exposed that the established writer
was drawing global virtual-sheet coordinates into page-local MediaBoxes. The
writer therefore has a second explicit capability,
`tiledPdfLocalCoordinates`, used by `TROUSER`: it subtracts the tile origin,
reapplies the page margin, and keeps clipping/registration marks in the page's
coordinate system. The default false path is unchanged for legacy byte
identity. This is a digital output correction, not a claim about home-printer
production behavior.

The tech-pack sketch keeps the same live geometry and tables but uses compact,
staggered labels for the eight small trouser components so the rendered first
page is legible. Parsed evidence is: SVG root valid with 16 polygons; DXF with
16 polylines, construction layers, and no `NaN`; 80 tiled pages; 8 A0 pages
with all selected-size piece labels and calibration evidence; 5 projector
layers with 80 polygons; and 4 tech-pack pages containing all POM labels,
BOM material text, and construction steps. Representative A0, tiled, and
tech-pack PNGs were visually inspected. These establish finite, coherent
digital output only. No garment has been cut or sewn, and no physical fit,
comfort, seam-performance, or production-readiness conclusion follows.

### Slice 102 live application resolution

The integrated recipe was exercised in the actual browser rather than accepted
from test JSON. With the valid Cotton-woven state, waist 84 → 86 changed the
finished waist 94 → 96 and changed the rendered pattern. Pocket angle 99 stayed
typed and paused the draft with a focused Review action; a valid-range
inseam-55 / pocket-bag-depth-35 combination exposed a front side-seam warning
and a focused bag-depth correction without clamping. Restoring the values
re-enabled all six outputs. Pattern, Body front/back/side/pair, assembled
preview, Size run, Spec, Nesting modes and fabric width, Check, Edit,
Guidance, Save/Load, and the six export buttons were exercised. Six existing
garments passed live Pattern/Body/Spec/Check spot checks. Page-level overflow
was absent at 1280, 900, 700, 560, and 390 px; the corresponding rendered
screenshots remain in `epic3-slice101-outputs/`.

This closes digital integration evidence only. The correction targets,
material warning, and output notices are application behavior; they are not
physical fit, sewing, comfort, shrinkage, or production evidence. Slice 103
completed the final full project gate and Epic exit report; no later garment
or surface-design scope is implied.

### Slice 96 geometry resolution

Before implementation, the first digital approximation is fixed as follows:

- Each leg panel uses a quarter of the finished waist/seat/thigh/knee/leg-
  opening circumference at its named horizontal station. The side profile is
  shared by front and back so the side seams match; the straight-leg lower
  profile transitions through the hip, upper-thigh, knee, and hem stations.
- The front and back panels share the inner-leg/knee/hem path and its crotch
  point so the paired inseams match exactly. The front `centerFront` crotch
  endpoint uses `crotchDepth + frontRiseEase - waistbandDepth`; the back
  `centerBack` endpoint uses `crotchDepth + backRiseEase - waistbandDepth`.
  The shared inner crotch point is anchored to the back-rise station, so the
  extra front/back balance is expressed in the two named crotch curves rather
  than by making the sewn inseams different lengths.
- The front crotch curve is a named cubic Bézier with a shallower, less
  projecting control path; the back curve is a separate named cubic Bézier
  with more projection and depth. The control points are transparent recipe
  geometry and are tested through their real edge lengths/paths.
- All four leg pieces are off fold in V1. This makes the center-front fly and
  center-back seam explicit; it is a V1 role choice, not a claim that every
  trouser must use four panels.

This resolution closes the Slice 96 curve/panel ambiguity for digital work.
It does not establish physical fit, crotch comfort, or production readiness;
those remain deferred until the maintainer explicitly reopens sampling.

### Slice 97 component resolution

The separate waistband is resolved as one full, off-fold strip. Its lower edge
has the full finished waist length and joins the four leg-panel waist edges as
one named multi-edge stitch. It carries center-front/center-back placement and
fastening marks; it is not the skirt's half-circumference folded strip.

The simple V1 closure is resolved as one fixed-type fly shield with a small
fixed digital width and a user-adjustable `flyLength`. Each front panel gets a
named fly line mark of that length; the two marks join the shield's two named
attachment edges. This is enough to make the closure a real component and
exportable construction data without pretending to model every zip, fly,
underlap, or hardware variant.

These are digital component decisions for V1. The exact width, seam allowance,
hardware, and sewing order remain provisional until physical/material evidence
exists; no physical closure or waistband validation has occurred.

## Guidance and invalid combinations

Guidance warns without clamping or replacing a value. It should identify the
field/option to review and provide a correction direction. In addition to the
shared finite/range checks, the trouser guidance must cover:

- `waist < hip`, `hipDepth < crotchDepth`, and positive, finite inseam;
- front/back rise order and plausible relationship to `crotchDepth`;
- `flyLength` fitting within the front rise after the waistband depth;
- finished thigh/knee widths remaining positive and in a coherent straight-leg
  progression toward the declared `legOpening`;
- pocket opening/bag depth/position remaining within the front panel and above
  the hem; and
- mirrored left/right construction controls staying paired.

Corrections must be actionable (for example, “increase back rise ease or
decrease front rise ease until the back rise remains greater than the front” or
“shorten pocket-bag depth or increase inseam”). A failed guidance report must
prevent the digital readiness verdict and all output writers from claiming a
valid result. No invalid combination is silently clamped to a nearby draft.

## Grading contract

The user's base measurements are the base size. The initial straight-leg grade
is a transparent measurement delta table, provisional until the first real
sample is available:

| Measurement | XS/S/M/L/XL step used by `gradeMeasurements` |
| --- | ---: |
| waist | 4 cm |
| hip | 4 cm |
| hipDepth | 1 cm |
| crotchDepth | 1 cm |
| thigh | 2 cm |
| knee | 1.5 cm |
| inseam | 1.5 cm |

`ease` and recipe-owned style dimensions remain constant across the run in V1;
rise still changes with the graded `crotchDepth`, and leg widths change with
the graded body girths. A later size study may define proportional option
grading, but it must not be smuggled into the V1 grade rule. Every graded size
must be redrafted through the same recipe and pass the same checks/POM/output
parsers.

## Checks, POMs, and output evidence

The recipe must declare lower-body POMs for waist, waistband height, seat/hip,
front rise, back rise, thigh, knee, inseam, outseam, leg opening, fly length,
and each pocket opening/bag dimension. Labels must distinguish body versus
finished values and identify the reference line/landmark.

The digital checker must prove finite geometry, named edge connectivity, seam
matching, notch placement, grain marks, positive pattern bounds, and coherent
graded growth. It must not call the block “fit,” “production-ready,” or
physically validated.

The existing generic writers must be exercised with the live `trouser` block:
SVG, DXF, tiled PDF, A0 PDF, projector SVG, and all tech-pack pages. Parsed
checks must verify that all declared roles, edge/mark labels, POMs, BOM rows,
construction steps, and option-derived details are present. The eight existing
legacy export hashes remain an immutable regression gate.

## Physical validation still required later

No InfiniDrip garment has been cut, sewn, or fit on a real body. Epic 3 may
produce only digital geometry and rendered/output evidence. When physical
sampling is explicitly reopened, the validation record must at minimum choose
the actual fabric and shrinkage treatment, measure the wearer using the same
landmarks, sew a sample with recorded seam/pressing/closure methods, record
waist/seat/rise/thigh/knee/inseam/leg-opening POMs, inspect balance/grain/crotch
comfort/pocket usability/waistband behavior, and map each correction back to a
parameter or a documented truing decision. None of that evidence exists yet.

## Decisions, estimates, and unresolved questions

### Product decisions in force

- Relaxed casual straight-leg woven trouser is the only Epic 3 garment.
- Separate waistband, simple front fly/zip closure, and minimal paired pocket
  bags are in V1.
- Shorts and joggers are documented as later derivatives only.
- Surface design remains a later independent Epic.
- Physical validation and production-readiness claims remain deferred.

### Digital estimates/provisional choices

The numeric seeds/ranges, the transparent crotch-curve approximation, the
four-panel role split, 4 cm waistband seed, and initial grade increments are
engineering estimates for a testable digital block. They are not sourced body
standards and are not a fit claim. Each becomes a named recipe constant or
option and is covered by tests and rendered evidence.

### Resolved before geometry, not hidden during geometry

Slices 95–98 must record the final choice and test for: the exact rise/crotch
curve construction, front/back curve control points, whether the fly shield is
one or two pieces in the final roles, pocket opening angle and bag shape, seam
allowance map, and waistband short-end seam placement. The contract above fixes
the interfaces and user-visible semantics; it does not authorize silently
inventing any of those details.

## Physical/source follow-up

The next research revision is required if physical sampling is reopened, if a
new fabric family is added, or if shorts/joggers are scoped. Until then this
record is the durable boundary for Epic 3 digital implementation.
