# Polo V2 fidelity research

_Completed 2026-09-20 as the research and decision record for Epic 11. This
document refines the shipped Polo V1; it does not claim physical fit,
sewability, collar roll, recovery, or wash performance._

## Product scope

- **Garment:** the existing short-sleeve loose knit Polo, upgraded without
  creating a second recipe or changing its stable `polo` identifier.
- **User problem:** V1 is digitally complete but its pattern uses a rectangular
  collar stand, its preview shows Polo details only from the front, and its
  placket base, hem and side-seam treatment omit common construction cues. A
  maker can export the pattern, but the result understates important Polo
  structure and makes the back view less trustworthy than the front.
- **Epic 11 outcome:** one parametrically shaped collar and stand derived from
  the actual neckline; matching front and back preview treatment; explicit
  placket-base clip/reinforcement marks; open side vents; and an adjustable
  dropped back hem.
- **Target user:** a maker using the existing measurement, grading, checking,
  nesting and export workflow who needs a more construction-faithful Polo.
- **Classification:** redesign. The work changes Polo geometry and downstream
  Polo output, but it preserves the shared engine and all other recipes.

## Goals and success measures

1. Every collar/stand seam is generated from the current size's real neckline
   and passes the named-interface checker across the full size run.
2. Front and back previews describe the same drafted stand, collar, vents and
   hem relationship instead of using an unrelated decorative overlay.
3. The placket base contains enough true-scale cut and reinforcement marks to
   support the documented triangle/clip construction without inventing a new
   exterior seam or pattern piece.
4. V2 side vents and back drop remain adjustable, persist through old/new
   saves, and produce actionable warnings for incompatible combinations.
5. All Polo cutting and report outputs parse at true scale; all non-Polo output
   and the eight protected legacy export hashes remain byte-identical.

## Non-goals

- **No sleeve rib/band in Epic 11.** Sources support the feature, but they do
  not establish one universal reduction. The current draft graph also does not
  receive the selected fabric's stretch/recovery. A fixed reduction would be a
  hidden material assumption. This remains a separate material-aware addition.
- **No independent manual point grading.** The app grades by re-drafting each
  size from its measurement table. The local CAD assignment's isolated 0.25 cm
  shifts do not form a complete size specification and must not be layered on
  top of the existing grade.
- **No upper/under-collar turn-of-cloth differential.** Sources support a small
  upper-collar allowance, but the correct value is material-dependent. Paired
  collar layers remain equal until physical/material evidence supports eased
  seams.
- No alternate collar shapes, button counts, button-spacing controls, pocket,
  yoke, long sleeve, 3D drape, or final-design Edit integration.
- No physical-fit, production-readiness, manufacturing or wash-performance
  claim while sampling remains on hold.

## Existing-engine reuse audit

### Reuse without semantic change

- The loose tee body, set-in sleeve, front slit, two folded plackets, four
  collar/stand physical roles, recipe-owned options, pattern marks and named
  stitches remain the correct Polo foundation.
- `GarmentRecipe`, the component grammar, grading-by-redraft, POM, checking,
  nesting, surface placement, persistence and export routes already carry live
  Polo options. V2 must remain a conventional recipe consumer.
- `Piece.marks` is the correct boundary for placket cut/clip/reinforcement
  instructions because these marks are internal construction data, not outside
  cutting edges.

### Reuse only after extraction or review

- The woven shirt proves an open-vent edge topology, vent-stop marks and folded
  band component, but its functions are garment-specific and its folded band
  has no knit negative-ease rule. V2 may extract a small generic vented-hem
  helper only if the woven-shirt output remains byte-identical. It must not
  reuse the woven band as a Polo rib.
- Existing `polo-details.ts` is a useful render boundary, but its paths are
  front-only and are not the drafted collar/stand geometry. V2 needs one pure
  geometry helper consumed by drafting and both schematic views so those
  representations cannot drift.

### Do not reuse

- The current rectangular `standPiece()` and straight `collarPiece()` are V1
  engineering placeholders. Matching their lengths digitally does not make
  their shape a faithful collar construction.
- The local CAD assignment's point shifts, sleeve-rib subtraction, and exact
  hem/slit values are evidence of one worked example, not universal formulas.

## Evidence review and adopted treatment

| Decision | Independent evidence | Conflict or limitation | Epic 11 treatment |
|---|---|---|---|
| Stand and collar must originate from the real neckline | Threads measures and marks CB, shoulder, CF and extension from the actual neckline; Mueller & Sohn measures the front/back neckline before constructing the collar/stand | Published dimensions are style-specific | Use the current drafted front+back neckline seam lengths and landmarks; never copy a fixed source dimension |
| A shaped stand needs separate lower and upper seam curves | Threads raises and curves the stand at CF; Mueller & Sohn shapes and blends the stand/collar seams; the local CAD reference shows a curved finished stand | The amount of rise varies by style | Add adjustable `standFrontRise`; solve/verify seam lengths rather than assuming parallel rectangles |
| Collar base must follow the stand upper seam | Threads mirrors the stand curve for the collar base; Jalie and Style Arc sandwich the collar between two stand layers | Turn-of-cloth allowances vary by fabric | Match both collar bases to the actual stand-upper seam; keep upper/under layers equal in this digital release |
| Collar/stand landmarks are construction-critical | Threads specifies CB, shoulder and CF notches; Jalie aligns notches across collar/stand/neckline | Current Polo only has generic front-end marks | Add CB, shoulder and CF marks/notches derived from cumulative neckline length |
| Placket base needs clip/reinforcement truth | Jalie exposes and stitches the base triangle; Maelo marks/clips a triangle; Style Arc stabilizes the opening and permits a box-X finish | Exact triangle width is pattern/seam-allowance dependent | Keep the centre-front slit and attachment interfaces; add two diagonal clip lines derived from the 1 cm attachment allowance plus a named base reinforcement line/box cue |
| Side vents are a normal Polo construction option | Jalie includes side slits and stops the side seam at them; Style Arc finishes/bar-tacks the split; Maelo stops at a generated slit notch | No universal vent depth | Include adjustable vents; default 6 cm is a documented product choice from the local CAD reference, not an industry standard |
| A dropped back hem is a valid Polo variation | The local CAD reference uses a 1.5 cm longer back; Maelo supports a generated back drop and hems each body separately | Jalie/Style Arc establish vents but not a universal back drop | Include adjustable back drop with 1.5 cm default; keep 0 cm valid |
| Sleeve bands are common | Jalie drafts band pieces; Maelo uses a binding piece; the local CAD example subtracts 2 cm from opening length | Reduction depends on fabric stretch/recovery and the public instructions do not expose a universal rule | Defer until material stretch is an explicit draft input or an independently adjustable band-ease contract is approved |
| Collar grading follows the graded neckline | Kamaraj Fashion Technology material derives collar increments from front/back neck sections and preserves the neck seam curvature; the current engine re-drafts each size | The local CAD reference supplies only isolated 0.25 cm moves, not a complete grade | Re-draft V2 geometry at each size and assert all seam/landmark relationships; add no second grade system |

## Adopted option contract

Existing defaults and bounds remain unchanged:

| Option | Default | Bounds / step | Meaning |
|---|---:|---:|---|
| `placketLength` | 14 cm | 14-30 / 0.5 | Finished attachment/opening length |
| `placketWidth` | 3 cm | 2-4 / 0.5 | Finished visible face |
| `standHeight` | 2 cm | 1-3 / 0.5 | Finished stand depth |
| `collarLeafDepth` | 5 cm | 4-7 / 0.5 | Stand seam to collar point/deepest leaf extent |

V2 adds:

| Option | Default | Bounds / step | Source classification |
|---|---:|---:|---|
| `standFrontRise` | 0.75 cm | 0-2 / 0.25 | Product choice within source-supported shaped-stand behavior; 0 preserves a straight-rise fallback |
| `collarPointExtension` | 1.5 cm | 0.5-3 / 0.25 | Existing V1 engineering value exposed as an honest adjustable shape control |
| `sideVentDepth` | 6 cm | 0-15 / 0.5 | Product choice from the local CAD example; 0 deliberately disables vents |
| `backHemDrop` | 1.5 cm | 0-5 / 0.5 | Product choice from the local CAD example; 0 produces equal front/back length |

Values remain verbatim. Static bounds support the shared numeric control; the
guidance engine owns dynamic compatibility checks and never silently clamps.

## Geometry and construction contract

### Collar and stand

1. Read front and back neckline interfaces from the composed Polo body. Record
   cumulative landmarks at CB, shoulder and CF.
2. Construct the stand lower seam as a smooth curve whose measured arc length
   equals the neckline interface within the existing stitch tolerance. The
   centre-back edge remains perpendicular and on fold. `standFrontRise`
   controls the front-end rise without changing the target seam length.
3. Construct the stand upper seam from the same landmark progression at the
   selected `standHeight`; measure its real arc length. Do not assume that it
   equals the lower neckline seam.
4. Construct both collar bases to the measured stand-upper seam. Shape the
   outer edge from `collarLeafDepth` and `collarPointExtension`, maintaining a
   perpendicular centre-back fold and a finite, non-self-intersecting outline.
5. Emit matching CB, shoulder and CF notches/marks on neckline, stands and
   collars. All marks must survive SVG, DXF, tiled PDF, A0 and projector output.
6. Keep outer/inner stand and upper/under collar as four real physical roles.
   Do not collapse layers into cut-quantity text.

### Placket base

- Preserve the current on-fold front and the named `placketOpening` mark used
  by both placket attachment stitches.
- Add two diagonal internal cut/clip marks at the base, derived from the 1 cm
  attachment allowance, and replace the generic horizontal cue with a named
  base reinforcement/box line that matches the documented construction order.
- Do not add a separate gusset, exterior centre-front seam, or unmeasured
  decorative triangle.

### Vents and dropped back hem

- Split each lower side into a sewn side interface above the vent and an open
  vent edge below it. Only the sewn portions participate in the side stitch.
- The front hem remains at the selected body length. Extend only the back hem
  by `backHemDrop`; its vent edge therefore includes that additional drop.
- Keep front and back vent tops aligned so the stitched side interfaces match.
- Emit vent-top marks, separate vent allowances and distinct front/back hem
  POMs. No curved hem is added in Epic 11.

## Guardrails and actionable guidance

| Invalid or risky state | Detection | Required correction text behavior |
|---|---|---|
| Stand rise exceeds stand height | `standFrontRise > standHeight` | Name both values; reduce rise or increase stand height |
| Stand/collar curve is non-finite, reverses or self-intersects | Geometry validation before downstream use | Identify the affected option(s) and suggest restoring the nearest declared range; preserve raw values |
| Collar point extension overwhelms leaf depth or crosses CF/CB geometry | Outline/intersection and minimum-edge checks | Reduce point extension or increase leaf depth |
| Vent disabled while back drop remains positive | `sideVentDepth === 0 && backHemDrop > 0` | Set back drop to 0 or enable a vent; never change either automatically |
| Nonzero vent too shallow to finish | `0 < sideVentDepth < 3` | Increase vent to at least 3 cm or set it to 0 |
| Vent reaches the armhole/upper body | Compare vent top with armhole depth plus a 4 cm sewn-side reserve | Reduce vent depth to the exact computed maximum |
| Drop exceeds selected vent depth | `backHemDrop > sideVentDepth` when vent is enabled | Reduce drop or increase vent depth |
| Placket collides with the hem/vent region | Existing placket clearance extended to the front vent top | Report the exact maximum placket length or vent adjustment |
| Seam/interface mismatch | Existing checker tolerance | Report both measured lengths and the named interface; no pass-through claim |

## Pattern pieces, interfaces and POMs

- **Physical roles remain nine:** front, back, sleeve, button placket,
  buttonhole placket, outer stand, inner stand, upper collar, under collar.
- **New/changed interfaces:** shaped neckline-to-outer-stand; shaped
  stand-to-collar pairs; sewn front/back side edges ending at aligned vent
  tops. Open vent edges are never included in the side stitch.
- **New marks:** CB/shoulder/CF collar landmarks, left/right placket base clips,
  base reinforcement, and front/back vent tops.
- **New POMs:** stand front rise, collar point extension, front side-vent depth,
  front body length, back body length and back hem drop. Existing Polo POMs
  remain.
- **Construction metadata:** stabilize opening; attach and fold plackets; clip
  base triangle; secure base; join shoulders; assemble collar/stand; attach to
  neckline; set sleeve; close underarm/side to vent stops; finish vents and
  separate hems; add buttons/buttonholes.

## Render and export verification

Every implementation slice must retain focused unit coverage and the full
project gate. The Epic exit matrix must include:

1. Default M, XS and XL with default V2 options.
2. Full graded run with changed but valid collar and vent values.
3. Every static option boundary.
4. Crossed-risk pairs: stand 1/rise 2; leaf 4/point 3; vent 0/drop 1.5;
   vent 3/drop 5; vent 15 with the shortest supported body; placket 30 with a
   short body; and minimum/maximum neck with the collar extremes.
5. Pre-Epic-11 Polo save with the four new options missing; V2 round-trip; raw
   invalid recovery values preserved and warned.
6. Pattern, Body front/back, assembled, Size run, Spec, Nesting, Check and
   surface-placement views. Surface cut-box anchoring must stay truthful after
   the body bounds change.
7. Real DOM parsing for SVG/projector, entity inspection for DXF, and real PDF
   consumers for tiled, A0 and tech-pack files. Inspect rendered output, not
   parser success alone.
8. Narrow and wide fabric layouts. Epic 11 consumes the final Epic 7 nesting
   contract but does not modify its estimator, buffer or fit verdict.
9. Exact byte identity for all non-Polo exports and all protected legacy
   hashes. Polo fixture changes require an explicit V1-to-V2 reason in the
   implementation commit; no unrelated baseline may move.

## Failure and pressure-test analysis

- **False seam equality:** parallel-offset-looking curves can have different
  arc lengths. Every seam is measured from its actual curve, never inferred
  from endpoints or a shared horizontal span.
- **Offset/allowance failure:** tight stand or collar curves can create invalid
  cut outlines. Exercise minimum stand height, maximum rise and maximum point
  extension through the existing exact/repair validation and reject a broken
  outline visibly.
- **Grade drift:** the stand upper seam can diverge from its collar base if one
  is graded independently. Both must be regenerated from the same size's
  composed neckline.
- **Zero-length topology:** disabled vents must use the original uninterrupted
  side/hem topology rather than emitting zero-length vent edges.
- **Preview drift:** front and back schematics must consume the same pure collar
  geometry facts as the draft; tests must fail if a preview reintroduces a
  rectangle or front-only stand.
- **Material overclaim:** a visually plausible collar or rib is not evidence of
  roll, recovery or wash behavior. The tech pack must retain that limitation.
- **Parallel-work collision:** Epic 11 implementation may not begin until Epic
  7 is merged and reviewed. It must not edit `nestPieces`, nesting-planning
  persistence, Epic 7 files, Electron release code or export baselines.

## Physical validation plan

Physical sampling remains explicitly paused. When reopened, record wearer
measurements, selected knit and stabilizer, calibration result, all collar and
vent POMs, stand/collar seam measurements before attachment, collar roll,
placket-base flatness, vent stress, hem balance, recovery and wash behavior.
Until that evidence exists, Epic 11 can claim only digital construction and
output consistency.

## Decisions and unresolved questions

### Decisions fixed by this packet

- Epic 11 upgrades the existing `polo` recipe rather than adding `polo-v2`.
- Shaped stand/collar, back representation, placket-base marks, vents and
  dropped back hem are P0.
- The four V2 options/defaults/bounds in this record are the implementation
  contract.
- Sleeve rib, turn-of-cloth differential and manual grade offsets are excluded.
- Epic 11 implementation starts only after Epic 7 is merged and Codex has
  confirmed the shared checkout is clean.

### Questions deliberately left to physical evidence

- Material-specific upper-collar ease and collar-roll shaping.
- Sleeve-rib reduction by knit stretch and recovery.
- Whether the 0.75 cm stand rise, 6 cm vent and 1.5 cm drop should change after
  a sewn sample. These are transparent product starting values, not standards.

## Sources

All web sources accessed 2026-09-20. No source code was copied.

1. Mehady Islam, *CAD Assignment: T-Shirt, Polo Shirt, Grading*, 2015,
   `F:\tank-sketches\290184313-T-shirt-Poloshirt-Cad-Drawing.pdf`, reviewed
   pages 16-22. This is a worked educational example, not a universal standard.
2. Kathleen Cheetham, Threads, [Draft a Two-Piece Collar with a Stand](https://www.threadsmagazine.com/project-guides/fit-and-sew-tops/draft-a-two-piece-collar-with-a-stand), online extra to Threads 138.
3. Sabine David, Mueller & Sohn, [Pattern Construction for Collar with Stand](https://www.muellerundsohn.com/en/allgemein/pattern-construction-for-collar-with-stand/), 2022-03-01.
4. Jalie, [3137 Men's Polo Shirts sewing instructions](https://d2culxnxbccemt.cloudfront.net/sew/content/uploads/2016/08/29134157/Pattern-Instructions-PDF8.pdf), six-page instructions.
5. Jalie, [3137 Polo Shirts for Boys and Men](https://jalie.com/products/boys-and-mens-polo-shirts-sewing-pattern), construction/features and fabric requirement.
6. Style Arc, [Jess Knit Polo photo tutorial](https://www.stylearc.com/magazine/sewing-tutorials/jess-knit-polo/), collar stand, placket base and vent construction.
7. Maelo, [How to Sew a Polo Shirt](https://maelodesign.com/blogs/Sewing_a_Polo_Shirt), modeler-linked placket, collar/stand, sleeve binding, side slit and back-drop workflow.
8. Kamaraj Women's College, *Pattern Making and Grading*, 2022-2023,
   [basic collar grading, pp. 45-46](https://kamarajwomenscollege.ac.in/wp-content/uploads/Allied-1-Pattern-Making-and-Grading.pdf).
9. `F:\tank-sketches\scribd - garment-design - files\garment_measurement_quick_reference.docx`, *Garment Measurement Quick Reference*, especially collar F3-F7, sleeve I/L and relaxed/stretched states.
10. `F:\tank-sketches\scribd - garment-design - files\pattern_drafting_quick_reference.docx`, *Pattern Drafting Quick Reference*, measurement, ease and test-pattern principles.
11. `F:\tank-sketches\scribd - garment-design - files\stitches_seams_detailed_reference.docx`, *Stitches and Seams Detailed Reference*, knit-compatible stretch seam and sample-testing limits.
