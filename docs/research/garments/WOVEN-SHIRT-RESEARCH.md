# Relaxed woven shirt research

_Slice 85, 2026-09-12. Research before implementation. Evidence, estimates and
product decisions are separated below. No physical validation is claimed._

## Product scope

Approved: relaxed short-sleeve button-up with point collar, separate stand, full
front placket, back yoke, one patch pocket, turned sleeve band, curved hem and
small side vents. The maintainer confirmed during Slice 85 that **six or seven
evenly spaced front-placket buttons exclude the additional collar-stand button**.
This is a reusable digital component-library foundation, not a fitted bust block
or posture reconstruction.

Excluded: long/two-piece sleeves, sleeve plackets, complex cuffs, multiple pockets,
pleated backs, darts/princess seams, decorative details, Polo V2 and trousers.
Physical validation remains on hold; no sampling is scheduled.

## Evidence and provenance

The five applicable supplied Word references were read as paragraphs and complete
tables. They identify condensed educational documents, not five independent
primary drafting systems. Relevant PDF pages were read and p.15's hem diagrams
rendered and inspected. Word rendering was attempted but the bundled runtime
lacks LibreOffice; no Word-layout claim depends on extraction. Sources unchanged.

| Source | Finding used | Consequence |
|---|---|---|
| L1 PDF, pp.3-4,7-9 | Distinct body girths/lengths/widths and construction landmarks; population-specific sizing | Model/geometry: independent neck; no imported example size chart |
| L1 pp.12-15 | Shell/lining/interlining differ; allowances depend on seam/fabric; curved hems need narrower turns and considered corners | Geometry/export: layers, named allowances, hem/vent inspection |
| L2 AQM, Technical Reading Notes/tables | POM level/state; pocket size versus position; preparation before joining | POM/docs/tests: landmarks and operations; exclude assignment dimensions/costs/codes/machine abbreviations |
| L3 Measurement, Principles/Tops/Pockets | Close fasteners, relaxed measurements; chest 1 cm below armhole; HSP/CF/CB, collar/stand, sleeve including cuff, pocket origin | Model/UI/POM: body/finished and straight/seam labels |
| L4 Drafting, Ease/Workflow | Ease depends on garment/fabric/wearer; mark and true draft | Geometry/guidance/tests: user-owned ease, seam-walking, continuity, grain/notches |
| L5 Pattern Making, sections 1,5,8,10-13 | Independent neck/arm/body; grade connected landmarks, collar to neck and sleeve to armhole | Model/grading/tests: neck independence, remeasured connections, explicit balance limits |
| L6 Stitches/Seams, Definitions/Selection | Geometric joins, stitch formation and edge finishing differ | BOM/docs: operation descriptions, no machine settings or performance claims |

L5's illustrative ease additions are not a shirt specification. L1's example hip
series ends with a decrease; it is not an InfiniDrip grade table. L3 chest level
(1 cm) differs from L2's sweatshirt example (1 inch): choose and label 1 cm for
this shirt without altering existing recipes.

The fullness Word reference remains deferred: this block has no darts, gathers,
pleats or tucks. The Polo CAD PDF/screenshots are routed to Polo V2 only by the
newer maintainer decision; they justify no shirt formulas or Polo V1 changes.

## Existing-engine reuse audit

| Capability | Treatment and reason |
|---|---|
| Edge/Piece/Block/Component/Interface/Stitch and internal marks | Reuse: closed named panels, measured joins, fold/placement/button marks |
| Tee/Polo bodice and derive() | Do not reuse as woven construction: chest-derived neck, knit silhouette and fixed slope are not woven evidence |
| Existing sleeve | Do not directly reuse: fixed 1.5 cap ease/taper and capHeight+sleeveLength hem position are knit-era choices; shirt length includes cap and band |
| Quarter-ellipse neckline mathematics | Reusable technique, not a sourced proportion; smooth CB-fold tangent essential |
| Polo collar/stand/placket | Reuse vocabulary, not geometry: partial slit is not full opening; overlap/shaped stand need own contract |
| Grade/POM/check/nest/writers | Generic pipeline with shirt-owned tables, allowances and physical inventory |
| Croquis/Edit | Render-only; previews consume shirt draft; Side schematic and Edit front-piece preview-only |

Slice 85 changes no implementation/model. Slice 86 resolves additive neck input,
front-overlap accounting, physical quantities and usable collar/stand seams.

## Construction and geometry research

| Rule | Independent evidence | Agreement/conflict and treatment |
|---|---|---|
| Neck/torso independently sized | L1/L5; W1; W2 | Independent neck or finished control; chest-derived collar insufficient |
| Deliberate wearing room | L4/L5; W2 | Principle agrees; numeric systems differ. W2 chest 15% and L5 examples not universal |
| Layered collar and separate layered stand | W3; W4 | Lower stand joins neckline; collar fits usable upper seam between notches, excluding closure ends |
| Turn of cloth matters | W3; W4 | Equal flat layers do not prove roll; define treatment and retain physical uncertainty |
| Full placket has front edges/folds/stabilization | W5; W2 | Cut-on/separate both exist; two separate folded plackets valid; neither front on fold |
| Buttons depend on usable length/strain positions | W6; W7; W3 | W6 intervals 7.9375/8.255/8.89 cm exclude collar; W7 suggests about 6.35 against gaping. Adjustable 8 cm start, not universal |
| Yoke/facing enclose upper seams | W3; W8 | Two physical layers, matched back/yoke/shoulder; no imported pleats |
| Pocket top open, sides/base attached | L2/L3; W9 | Separate size/location; placement is not a cutout or closed top seam |
| Folded band matches opening | W10; W11 | Ring seam/fold/inner turn and measured attachment; Kalle dolman cuff is not our set-in band |
| Curved hem uses narrow turn | L1 p.15; W3 hem | Principle agrees; Fairfield quarter-inch turns pattern-specific |
| Vent is unsewn side segment with stop/finished edges | W11; L1 p.15 | Sewn interface excludes vent; Cottage deep hem not our curved-hem design |

Separate HSP/CF/CB, shoulder, underarm, yoke, hem and vent landmarks. Neckline
proportions, armhole distribution and balance remain estimates without more
wearer dimensions. Collar follows actual neckline seams, leaf the usable stand
seam. Cap solver preserves bicep width and reports infeasible combinations.
Interfacing preparation is separate from shell inventory; current marker has
no material-layer model.

## Measurements and adjustable parameters

These are **research-informed proposals to finalize in Slice 86**, not universal
dimensions or maintainer fit decisions. Cm unless noted. Ranges are warnings.

| Aspect | Proposed start/input | Guidance/basis |
|---|---|---|
| Body | Existing chest/waist/hip/shoulder/bicep; independent neck around 40 | L1/L3/L5/W1; never infer neck from chest |
| Length/depth | Existing finished length 70 / armholeDepth 24 | Hem/vent below underarm; slope between HSP/underarm |
| Chest ease | Existing user-owned ease; relaxed target about 10-20 | L4/W2; waist/hip also clear shell |
| Neck ease/shape | About 1 ease; adjustable width/back drop; solve front drop | W1/W2; report impossible target, do not replace width |
| Shoulder slope | About 4 vertical drop | L5; adjustable balance estimate |
| Hem sweep | Added full circumference relative to chest | L3/W2; warn insufficient waist/hip room, no auto-widening |
| Stand | About 2.5 high, 1 front rise | W3/W4; estimated 1.5-4 high, usable upper seam positive |
| Collar | About 6 leaf depth, 2 point extension | W3/W4; estimates, ordered points and leaf/stand relationship |
| Placket | About 3 finished face | W5; estimated 2-4.5, button/hole clearance |
| Front buttons | 6/7, default 7; interval 8; first 5 below neck | Maintainer count; W6/W7 conflict; advisory 6-9, end clearance |
| Button/hole | About 1 diameter / 1.3 hole | W3 example; estimate; hole larger, thickness unresolved |
| Yoke | About 10 below HSP at CB | W3/W8; straight unpleated estimate; between neck/shoulder and underarm |
| Pocket | About 12 wide x 13 high; inner edge 6 from CF, top 19 below HSP | L2/L3/W9; adjustable estimates, whole boundary inside front |
| Sleeve | Existing length, cap top to finished band edge | L3; exceeds cap+band |
| Arm room/cap ease | About 6 / 0.5 | L5/W2; estimates; preserve width; front/back balance checked |
| Band/opening | About 3 deep; adjustable sleeve taper | W10/W11; opening equals attachments, no gathers |
| Hem/vent | About 3 side hem rise / 3 vent length | L1/W3/W11; estimates; stop below underarm, modest curve |

Proposed construction defaults (not wearing ease): 1 cm general seams, 0.6
enclosed collar/stand seams, 1 total body hem (two 0.5 turns), separate pocket-top
turn. Inspect exact corners/allowances. Exclude automatic machine settings,
shrinkage compensation and universal POM tolerances.

## Guardrails and actionable guidance

- Preserve invalid raw values and name corrections. Fractional/unsupported count
  needs an explicit invalid-count state, never a replacement with 6/7.
- Neck consumes shoulder, front neck reaches underarm or target is too short:
  show calculated limit; change neck room/width/drop or shoulder/armhole.
- Insufficient body room: show body/finished girths and required ease/sweep.
  Circumference checks do not diagnose posture or full-bust shaping.
- Yoke/armhole, pocket/body, side/vent/hem, button/hem collisions: check actual
  geometry, show limits, suggest moving/reducing component or increasing length.
- Infeasible cap/short sleeve: preserve width/length, show required correction.
- Stand/leaf/neck mismatch: seam-walk named usable interfaces at every size.
- Button/hole centres coincide after folding and overlap, including collar closure.

## Pattern pieces, interfaces, and stitches

Proposed shell inventory: two fronts; back lower on CB fold; two yoke layers on
CB fold; two sleeves; two folded bands; two folded front plackets; upper/under
collar on CB fold; outer/inner stand on CB fold; one patch pocket: **16 physical
roles**. `onFold` means real fold, not a missing mirrored panel. Interfacing is
separate preparation, not falsely included in shell yardage.

Interfaces: shoulders/yokes; lower back/both yokes; armholes including yoke
segments/sleeves; sleeve underarms; openings/folded bands; fronts/plackets;
completed neckline/placket tops/stands; collar bases/usable stand uppers; paired
collar outer seams/stand ends; pocket sides/base/placement. Side stitches stop
above open vents.

Operations: stabilize/identify; prepare plackets/pocket; attach one pocket;
enclose back/shoulders in yokes; collar/stand onto completed neckline; set sleeves;
close underarms/sides to vent stops; attach bands; finish vents/curved hem;
transfer buttons/holes. Digital metadata, not physical manufacturing proof.

## Render and export verification

Slice 85: inspect sources/diff; run existing full coverage/typecheck/build and
byte-identity gate. Later inspect default, altered-valid, invalid and XS-XL:
neck/stand/leaf lengths, overlap cancellation, yoke continuity, cap balance,
pocket containment, vent stops, band lengths, folds/allowances and quantities.
Cover Pattern, assembled, Body Front/Back/schematic Side, Size run, Spec,
Nesting, Check and preview-only Edit.

Use real SVG/projector DOM parsing, DXF entities and PDF consumers for tiled/A0/
tech-pack, plus rendered page inspection. Eight tee/darted-tee SHA baselines stay
unchanged. Final milestone exit remains Slice 93, beyond requested 86-92 work.

## Physical validation status

Person/body record, fabric testing, calibrated physical output, sewn POMs, fit,
roll, recovery, washing, sewability and production readiness: **not recorded,
not validated, intentionally deferred**. No physical plan activated.

## Decisions and unresolved questions

Confirmed: feature/deferral scope, front/stand button count, digital-only milestone,
preview-only Edit. Starting values are estimates for Slice 86. No source supplies
one complete formula for this exact block. Slice 86 resolves measurement addition,
overlap, seam/fold representation, collar turn treatment and ownership before code.
Physical behavior, posture/bust shaping and factory tolerances remain future
questions, never disguised as completed evidence.

## Sources

All read/accessed 2026-09-12. L1-L6 directory:
`F:\tank-sketches\scribd - garment-design - files\`.

- L1 `226112995-Pattern-Making.pdf`, *Patternmaking*, 16-slide teaching deck;
  author unidentified on reviewed slides; bibliography p.16, not a claim to
  have read its listed books.
- L2 `aqm1_spec_sheet_detailed_reference.docx`, *AQM 1 Specification Sheet
  Detailed Reference*; basis: NIFT Chennai, Apparel Quality Management Assignment 1.
- L3 `garment_measurement_quick_reference.docx`, *Garment Measurement Quick
  Reference*; basis: *All Garments Measurement, Manual - How to Measure*, March 2012.
- L4 `pattern_drafting_quick_reference.docx`, *Pattern Drafting Quick Reference*;
  basis: *Comprehensive Guide to Pattern Drafting*, 10-page document.
- L5 `pattern_making_body_measurements_reference.docx`, *Pattern Making and
  Grading Reference*; basis: *Principles of Pattern Making and Grading*, B.Sc.
  Costume Design and Fashion course, 134-page original.
- L6 `stitches_seams_detailed_reference.docx`, *Stitches and Seams Detailed
  Reference*; basis: S. H. Shin, *Apparel Manufacturing*, Chapter 14.
- W1 Thread Theory, [Fairfield custom fit](https://threadtheoryblog.wordpress.com/2016/05/24/fairfield-sew-along-creating-a-custom-fit-2-of-2/), 2016-05-24.
- W2 FreeSewing, [Simon shirt Design Options](https://freesewing.eu/docs/designs/simon/options/). Its silent overrides are not adopted.
- W3 Thread Theory, [Fairfield Sew-Along](https://threadtheoryblog.wordpress.com/category/fairfield-button-up-sew-along/), collar/yoke/hem/buttons/short-sleeve entries, 2016.
- W4 Heather Lou, Closet Core, [Traditional shirt collar](https://blog.closetcorepatterns.com/traditional-method-sewing-shirt-collar-closet-case-patterns/).
- W5 Heather Lou, Closet Core, [Standard button placket](https://blog.closetcorepatterns.com/sewing-standard-button-placket-kalle-sewalong/), 2017-05-15.
- W6 Proper Cloth, [Number of Buttons on Shirt Front](https://propercloth.com/reference/number-of-buttons-shirt-front/), includes 2020-06-04 change.
- W7 Louise Cutting, Threads, [Buttonhole Orientation](https://www.threadsmagazine.com/project-guides/fit-and-sew-tops/qa-buttonhole-orientation).
- W8 Heather Lou, Closet Core, [Shirt Yoke](https://blog.closetcorepatterns.com/sewing-a-shirt-yoke-the-burrito-method/).
- W9 Heather Lou, Closet Core, [Curved Shirt Patch Pocket](https://blog.closetcorepatterns.com/sewing-a-curved-shirt-patch-pocket-kalle-sewalong/).
- W10 Heather Lou, Closet Core, [Sleeve Cuffs](https://blog.closetcorepatterns.com/sewing-the-arm-cuffs-kalle-sewalong/), 2017-06-15.
- W11 Betsy Blodgett, Sewing Workshop, [Cottage Side Seams and Vents](https://sewingworkshop.com/new-blog/the-cottage-sew-along-part-five-side-seams-and-vents), 2018-06-27.
