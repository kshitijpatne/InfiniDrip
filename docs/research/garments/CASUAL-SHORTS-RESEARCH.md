# Casual shorts research

_Slice 150 research record. This document scopes a future digital garment; it
does not authorize implementation or claim physical fit._

## Product scope

- **Named garment:** relaxed casual woven fly-front shorts, derived from the
  shipped straight-leg trouser block.
- **Target use:** an adult everyday short with a separate waistband, button and
  zipper fly, paired angled front pockets, and a straight turned hem.
- **P0:** one stable-woven construction; adjustable finished short inseam, hem
  opening, rise/waistband, fly and front-pocket geometry; all ordinary views,
  grading, nesting, surface placement and six output families.
- **P1 after P0:** optional paired back patch pockets and belt loops. These add
  visible value but are not required to prove the lower-body derivative.
- **Out:** elastic/drawcord waist, swim/athletic/boxer construction, cargo
  pockets, cuffs or hem bands, knit shorts, jeans shorts, skirts/culottes,
  liners, child sizing, physical sampling and production claims.

This is a separate `shorts` recipe, not a `trouser` label change. It needs
different length/opening/pocket defaults, different guidance and a different
finished-measurement story while sharing verified lower-body primitives.

## Decision summary

| Question | Verdict | Reason |
| --- | --- | --- |
| Can the trouser be truncated by substituting a short `inseam`? | **Reject** | `trouserMetrics` puts the knee at 52% of the supplied inseam. At short lengths that invents a knee inside the upper leg and changes both side and inseam interpolation. |
| Reuse waist, hip, hip depth, crotch depth, thigh and ease inputs? | **Include unchanged** | These are the same body landmarks and the local measurement reference defines rises from waistband top and inseam from crotch to hem for bottoms. |
| Reuse the trouser rise/crotch curves unchanged? | **Parameterized derivative, provisional** | The same relaxed woven seat/rise foundation is appropriate digitally, but remains physically unvalidated. The derivative may not change it merely to make short hems easier. |
| Reuse the current knee measurement/control? | **Exclude from P0 UI** | An above-knee short does not reach the anatomical knee. The knee can remain a body record for future longer variants but must not shape a short whose hem is above it. |
| Reuse fly, waistband and front-pocket concepts? | **Include with shorts defaults and dynamic checks** | Jalie 2107 implements pants and shorts with the same fly/waist/pocket construction, while the supplied shorts spec confirms those POM families. Current pocket/fly defaults are too long for many shorts. |
| Add elastic waist, cargo and back pockets immediately? | **Defer** | They materially expand roles and construction without proving the core short derivative. Back patch pockets/belt loops are the first additive follow-up. |

## Existing-engine reuse audit

### Correct reuse

- `Measurements.waist`, `hip`, `hipDepth`, `crotchDepth`, `thigh` and `ease`
  retain their documented lower-body meanings.
- The four off-fold front/back leg roles, separate front/back crotch curves,
  mirrored left/right quantities, waist seam, rise seam, side seam and inseam
  ownership remain the correct starting topology.
- The current waistband, fly and pocket option concepts remain useful; option
  values are recipe-owned, so shorts may have different defaults/bounds without
  altering saved trouser behavior.
- Generic block composition, real stitch interfaces, allowances, grading by
  redraft, guidance, persistence-by-recipe, nesting, surface, projector and
  export writers are the correct pipeline.

### Reuse that would be false

- The current full-length lower-leg station graph is not a reusable short-leg
  graph. It always creates thigh, knee and hem stations and derives knee from
  garment length.
- `plausibility.ts` currently treats `inseam` 55–105 cm as the expected finished
  trouser input. Lowering that global range would weaken trouser guidance and
  still conflate a body/full-length control with short style length.
- The trouser default `legOpening` of 40 cm and default pocket bag depth of
  23 cm are not suitable short defaults. A 23 cm bag can reach or cross a common
  short hem; the existing guidance already detects that failure.
- The current straight-leg rule that knee must be at least as wide as the hem is
  irrelevant when the garment ends before the knee.

### Required shared seam, not a rewrite

Extract a lower-body upper-block result ending at a named upper-thigh station,
then let the trouser continuation and short continuation own their separate
below-thigh station logic. The short continuation consumes a recipe-owned
finished crotch-to-hem length and opening circumference. If its hem is above the
anatomical knee, it connects upper thigh directly to hem; it never relocates the
knee. The shipped trouser output must remain byte-identical.

## Measurements and adjustable parameters

The numeric seeds below are **product starting decisions**, not body standards.
The supplied NIFT-derived shorts record (17.8 cm inseam, about 12.7 cm pocket
length and about 3.2 cm waistband) and Jalie's pants/shorts construction inform
them but do not prove a universal fit.

| Aspect | Proposed input | Initial range / seed | Source or decision | Guidance needed |
| --- | --- | ---: | --- | --- |
| Waist, hip, hip depth, crotch depth, thigh | existing body fields | existing domains | shipped lower-body contract; L2/L4 | existing plausibility plus shorts collisions |
| General room | `ease` | existing shorts style target, provisional 8–16 cm | product decision; must be evaluated as a finished circumference | positive finished waist/seat/thigh |
| Short length | `shortsInseam` option | 5–45 cm / 20 cm / 0.5 step | product decision; L1 provides a 17.8 cm example; W1 supports a distinct shorten/lengthen line | hem after crotch; components above hem; no invented knee |
| Hem opening | `hemOpening` | 40–90 cm / 60 cm / 0.5 step | product decision derived from upper-thigh context, not trouser knee | positive; coherent with actual hem station; left/right equal |
| Front/back rise ease | reuse IDs | retain trouser domains and initial values pending rendered audit | shipped derivative | back greater than front; waistband/fly fit |
| Waistband depth | reuse ID | 2–6 cm / 3.5 cm / 0.5 step | L1 example about 3.2 cm; product seed | less than both rises; closure marks contained |
| Fly length | reuse ID | 6–18 cm / 11 cm / 0.5 step | L1 records about 10.8–12.1 cm; W1 uses a real bottom mark | must end above crotch and hem; zipper compatibility stated |
| Pocket opening | reuse ID | 8–20 cm / 12 cm / 0.5 step | L1 records an 8.9 cm opening; product seed | line stays in front; usable opening not asserted physically |
| Pocket angle | reuse ID | 35–70 degrees / 58 degrees | shipped transparent control | front-rise/CF/hem collision |
| Pocket drop | reuse ID | 0–10 cm / 2 cm / 0.5 step | shipped control; L1 records placement below waistband | opening starts below waist and above hem |
| Pocket-bag depth | reuse ID | 8–25 cm / 13 cm / 0.5 step | L1 records about 12.7 cm; product seed | bag boundary stays above hem and inside side/rise |
| Hem turn | construction value, not P0 style input | 2.5 cm initial | W1 uses an ordinary folded hem; L5 says straight hems can support a wider turn | twice-turn/fold geometry must not cross adjacent seams |

Range checks remain warn-never-clamp. A finite value outside a range stays
visible so guidance can name the correction. The eventual execution packet must
confirm the exact option IDs and bounds against rendered XS–XL geometry before
code begins.

## Construction and geometry research

| Rule or dimension | Source 1 | Source 2 | Agreement / conflict | Adopted treatment |
| --- | --- | --- | --- | --- |
| Bottom measurements use waist, hip, front/back rise, outseam, inseam, thigh and opening landmarks | L2 | L4 page 5 | Agree on stable landmark meanings | Preserve body landmarks; add a distinct finished short length. |
| Pants and shorts may share front/back, pocket, fly and waistband construction | W1/W2 | L1 garment 2 | Agree at feature/operation level; styles differ | Reuse interfaces, not values or the lower-leg station formula. |
| Shortening/lengthening must preserve parallel grain and redraw sides | W1 instructions p.1 | L3/L4 alteration and grain guidance | Agree | A short derivative keeps the leg grain and re-trues side/inseam paths; no arbitrary horizontal clip of exported polygons. |
| Fly requires a real bottom mark, facing/shield relationship and topstitch path | W1/W2 | L1 operation sequence | Agree; current trouser fly is deliberately minimal | P0 may reuse the existing simple fly contract but must verify it fits the shorter front; jeans-level fly fidelity is not pulled in. |
| Straight turned hem needs allowance and corner treatment | L5 pages 13–15 | W1 step 7 | Agree | Use a named straight hem edge and recipe allowance; inspect side/inseam joins after offset. |
| Pockets require size and placement controls and reinforcement | L1/L2 | W1 pattern inventory/instructions | Agree | Retain paired angled front pockets with recipe-specific depth/opening and dynamic containment checks. |
| One fixed short length is not universal | W1 provides modification line | Commercial patterns span short to knee-length styles | Agreement is only conceptual | User owns finished short inseam; named style targets are guidance envelopes, not fit claims. |

## Source conflicts and pressure findings

| Conflict / risk | Pressure test | Resolution |
| --- | --- | --- |
| `inseam` currently means finished trouser length, but global plausibility starts at 55 cm | Enter the L1 example 17.8 cm | Do not weaken the global field. Use a recipe-owned short length and a derivative draft input. |
| Existing knee station is 52% of garment length | 20 cm short puts the digital knee about 10.4 cm below crotch | Upper-thigh-to-hem short continuation; knee is omitted when outside the garment. |
| Existing 23 cm bag versus 20 cm default short | Bag reaches below hem even before allowance | Short default 13 cm plus actual-boundary containment; guide user to shorten bag/opening or lengthen short. |
| Existing 15 cm fly versus very short styles | Fly can approach hem and pocket bag | 11 cm seed and dynamic bottom-of-fly clearance; very short valid styles may require a smaller fly or exclusion. |
| NIFT example is swimwear-style elastic construction; target is woven fly-front | Similar numeric POMs could invite false construction reuse | Use it only as a measurement/operation example. W1 is construction authority for fly-front woven shorts. |
| Zero or near-zero short length | Degenerate side/inseam and allowance joins | Preserve raw value, block readiness, report minimum geometry-driven correction; never emit zero-length edges. |

## Guardrails and actionable guidance

- Short length must place the hem below both front/back crotch stations by the
  required geometric and allowance clearance. Message: increase short inseam.
- When hem lies above anatomical knee, no knee edge/mark/stitch is emitted.
  When a future longer style crosses the knee, the execution packet must define
  a continuous transition rather than switching topology silently.
- Hem opening must be positive and create finite, non-crossing side/inseam
  paths. Compare it to the interpolated finished circumference at the actual hem,
  not to the absent knee.
- Fly bottom must stay above the crotch transition and short hem. Name
  `flyLength` or `shortsInseam` as the correction.
- Pocket opening must remain inside the front panel; pocket bag, allowance and
  placement must remain above the hem and out of the rise/CF boundary. Name the
  first failing option and show the computed limit.
- Waistband depth must stay below both finished rises; closing marks and fly
  overlap must remain inside the actual band.
- Paired roles must remain mirrored and quantity-correct. No optional feature
  may leave zero-length stitches, orphan marks or an unmatched bag.
- Stable-woven material is required for P0. A knit selection remains visible
  and produces an actionable material/construction warning, not a reinterpreted
  draft.

## Pattern pieces, interfaces, and stitches

### P0 inventory

- front left/right and back left/right short panels;
- one full separate waistband;
- one simple fly shield/support role under the existing trouser contract;
- left/right pocket bags.

This preserves eight physical roles. P1 adds two back patch pockets and one
belt-loop strip cut into declared quantities. No role is put on fold merely to
reduce layout area.

### Interfaces

- paired side seams and inseams end at aligned hem corners;
- center-back seam and front-fly/rise relationship;
- four waist edges to the waistband bottom;
- both real pocket-opening paths to their matching bags;
- waistband short-end closure and button/buttonhole marks.

### Allowances and construction order

Start from the trouser's documented woven allowance map, but give the new hem a
named 2.5 cm starting turn and re-inspect every convex/concave join. Proposed
order: prepare pockets; attach bags; prepare fly/front rise; join back rise;
join inseams; join side seams; attach/close waistband and fastening; finish
straight hems. This is digital construction metadata, not proof of sewability.

## Grading contract

Grade waist/hip/depth/thigh through the existing lower-body measurement rule and
redraft every size. Keep `shortsInseam`, opening, pocket and fly style options
constant in P0; they are finished style decisions, not body dimensions. Do not
apply the trouser's +1.5 cm per-size finished inseam delta to the short length.
Every size must independently pass actual seam, component-containment,
allowance and output checks.

## Render and export verification

Future implementation must render and inspect:

- default M plus XS/XL;
- short inseam 5, 20 and 45 cm; opening 40/60/90 cm;
- shortest length with maximum fly, pocket opening/drop/depth and waistband;
- maximum length with both above- and below-knee topology candidates if the
  final scope admits them;
- zero/negative and out-of-range raw values without clamping;
- stable woven and incompatible knit selection;
- pre-shorts save, shorts default save, invalid recovery and undo/redo;
- empty/populated surface designs;
- narrow/wide directional single-size and graded nesting after Epic 7;
- Pattern, assembled, Body front/back/side/pair, Size run, Spec, Nesting, Check
  and preview-only Edit;
- parsed SVG, DXF, tiled PDF, A0, projector and tech-pack outputs plus visual
  inspection of marks, allowances, quantities and representative PDF pages.

All protected existing hashes remain byte-identical. Tests alone are
insufficient. This matrix is a future gate, not evidence that the recipe exists.

## Physical validation plan

Paused by maintainer decision. When reopened: record body measurements, actual
woven fabric and prewash/shrinkage, zipper/button, calibrated output, predicted
waist/seat/rises/inseam/outseam/opening/pocket POMs, sewn POMs, movement and
pocket/closure observations, then map corrections to named parameters. No such
sample exists.

## Future implementation packet

Classification: **addition** to the garment library, using an **enhancement** to
the lower-body station contract. Estimated **7–9 slices**:

1. pure upper-block/short-continuation contract with unchanged trouser bytes;
2. short panels, options, hem and actual seam interfaces;
3. shorts-specific fly/pocket/waist defaults and component containment;
4. allowance, marks, guidance, POM/BOM/construction data;
5. recipe/UI/persistence/Body/assembled integration;
6. grading, surface, nesting and parsed export matrix;
7. adversarial/rendered exit, durable context and clean full gate;
8–9. contingency only if the current lower-body split or A0/tiled layout exposes
   a real shared defect.

Prerequisites: Epic 7 reviewed/merged for final nesting semantics; Polo V2 need
not be a geometry prerequisite. Implementation requires a new Codex-authored
execution packet and must start from verified `main`.

## Decisions and unresolved questions

### Confirmed by this research

- Build casual woven fly-front shorts before joggers or jeans.
- Use a distinct recipe and distinct finished short-length option.
- Do not move the anatomical knee when the garment ends above it.
- P0 keeps the current trouser's simple waistband/fly/front-pocket family;
  back pockets and belt loops are P1.
- No global plausibility-range weakening, baseline movement or material-engine
  expansion is justified.

### Blocking questions for the execution packet

- Confirm whether the longest P0 short may pass the knee. The recommended
  simpler P0 caps the validated topology above the knee and lowers the maximum
  after actual XS–XL station measurement if 45 cm crosses it.
- Confirm exact geometry-driven minimum length/opening values after the upper
  block is extracted. The proposed numeric bounds remain visible product
  guardrails, not silent geometry clamps.
- Decide whether P1 back patch pockets/belt loops join the same epic only after
  P0 exits cleanly.

## Sources

Accessed 2026-09-20.

- **L1** — `F:\tank-sketches\scribd - garment-design - files\aqm1_spec_sheet_detailed_reference.docx`, *AQM 1 Specification Sheet Detailed Reference*, based on a National Institute of Fashion Technology Chennai apparel-quality assignment; swimwear-shorts POMs and operation sequence. Construction differs from target and is used only where stated.
- **L2** — `F:\tank-sketches\scribd - garment-design - files\garment_measurement_quick_reference.docx`, *Garment Measurement Quick Reference*, based on *All Garments Measurement, Manual - How to Measure*, March 2012.
- **L3** — `F:\tank-sketches\scribd - garment-design - files\pattern_making_body_measurements_reference.docx`, *Pattern Making and Grading Reference*, based on *Principles of Pattern Making and Grading*.
- **L4** — `F:\tank-sketches\scribd - garment-design - files\226112995-Pattern-Making.pdf`, *Patternmaking* teaching slides, especially pp. 5 and 13–15; bibliography on p.16.
- **L5** — `F:\tank-sketches\scribd - garment-design - files\stitches_seams_detailed_reference.docx`, *Stitches and Seams Detailed Reference*, based on S. H. Shin, *Apparel Manufacturing*, ch.14.
- **W1** — Jalie, [Pants and Shorts 2107 product record](https://jalie.com/products/mens-pants-and-shorts-sewing-pattern), woven pants/shorts feature inventory and 1 cm included allowance.
- **W2** — Jalie, [Pants and Shorts 2107 instructions](https://cdn.shopify.com/s/files/1/0267/4075/2568/files/product_printing_guide_2107.pdf?v=1605550925), six-page official construction record covering pieces, length modification, pockets, fly, waistband and hem.
- **W3** — Jalie, [2107 zipper-fly tutorial](https://jalie.com/blogs/jalie-sewing-tutorials/sewing-the-zipper-fly-on-pants-pattern-2107), official step-level clarification of fly marks, facing, shield, zipper and bartacks.
- **W4** — FreeSewing, [Titan trouser-block options](https://freesewing.org/docs/designs/titan/options), open implementation documentation consulted for independent parameter/dependency comparison; its percentage defaults and silent behavior are not adopted.

