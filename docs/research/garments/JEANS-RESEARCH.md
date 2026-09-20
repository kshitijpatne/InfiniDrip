# Jeans research

_Slice 153 research record. This document defines a future rigid-denim
five-pocket derivative; it does not authorize implementation or prove fit,
shrinkage, seam performance or production readiness._

## Product scope

- **Named garment:** relaxed straight-leg, mid-rise, rigid-denim five-pocket
  jeans with a zipper fly.
- **Target use:** an adult everyday woven jean that exposes familiar construction
  truth in pattern, previews and technical outputs without pretending to model
  wash, drape or factory sewing behavior.
- **P0:** front/back leg foundation; two shaped back yokes; two scoop front
  pockets with lining/facing/yoke roles; one coin pocket; two back patch pockets;
  zipper fly facing/extension and shield; straight outer/inner waistband; belt
  loops; button/buttonhole, bartack/optional-rivet and topstitch marks.
- **Out:** stretch/skinny jeans, selvedge single-piece layout optimization,
  button fly, contoured waistband, cargo/carpenter details, pocket embroidery,
  distressing/wash simulation, shrinkage compensation, custom hardware libraries,
  children's garments, physical validation and production claims.

Five-pocket means two front pockets, one coin pocket and two back pockets. It is
not satisfied by relabeling the current trouser's two pocket bags.

## Decision summary

| Question | Verdict | Reason |
| --- | --- | --- |
| Is jeans a new lower-body block? | **No; parameterized trouser derivative** | Waist/hip/rise/thigh/knee/inseam landmarks and straight-leg foundation are shared, but every reused curve remains physically unvalidated. |
| Can the shipped `trouser` recipe become jeans through material/preview styling? | **Reject** | Current pockets are mark-plus-quadrilateral bags, front fly is deliberately minimal, backs have no yoke/pockets, waistband has one role, and no belt-loop/topstitch/hardware contract exists. |
| First material scope | **Rigid non-stretch denim/bottomweight only** | W1/W2 and W8 show traditional straight five-pocket constructions in non-stretch denim. Stretch sources require explicit stretch and recovery behavior the app does not hold. |
| Waistband | **Straight outer + inner/facing roles in P0** | A straight waistband supports a traditional rigid straight-leg jean and minimizes new geometry. Contoured shaping remains a later variant. |
| Back yoke | **Real seam/component, not render decoration** | W3/W4 describe the yoke as shaping and a real flat-felled/topstitched join. It must split each back and seam-walk; a painted V is false. |
| Topstitch/rivets | **Construction marks + BOM/operations; optional rivet callouts** | They add authentic, useful output detail but do not become cutting geometry or machine-setting claims. |
| Automatic shrinkage allowance | **Reject** | W7 says shrinkage depends on fiber, yarn, construction, processing, finishing, manufacturing and care; arbitrary fixed specifications are not sound. |

## Existing-engine reuse audit

### Reuse unchanged

- Lower-body body fields, grade-by-redraft approach, option/persistence-by-recipe,
  composed blocks, stitches, named marks, allowances, POM/tech-pack pipeline,
  nesting, surface placement and current output writers.
- The separate front/back crotch concept, four off-fold legs, left/right pairing,
  side/inseam/center-back ownership and straight-leg stations are the digital
  foundation for the same relaxed silhouette.
- The current rigid woven material behavior (`family: woven`, 0% stretch) is a
  safe draft-category default. Adding a user-facing `Rigid denim` label can map
  to that behavior without changing geometry, but weight/recovery/shrinkage
  remain unknown.

### Parameterized derivative

- Rise, waistband depth, thigh/knee ease, opening and finished inseam can begin
  from the trouser option family, with jeans-specific style defaults and
  guidance.
- Pocket placement controls remain useful concepts but must drive new front
  cut topology and multiple pieces rather than the current internal line.
- The fly length remains a meaningful user control, but the jeans fly needs a
  facing/extension, zipper relationship, shield and bartacks tied to the real
  left/right front construction.

### Reuse rejected

- `trouserPocket` cannot represent a scoop opening, facing, pocket lining/yoke
  and coin pocket. In P0, the front cut outline must contain the opening; every
  facing/lining interface must equal its actual seam path.
- `trouserFly` exposes one rectangular shield against identical front marks. It
  cannot be described as the W1/W5 jeans zipper fly without explicit asymmetric
  extension/facing and shield ownership.
- The one-role full trouser waistband cannot describe outer and inner/facing
  layers, CF extensions, interfacing/closure marks and belt-loop joins.
- Splitting a back with a straight decorative line is not a jeans yoke. The new
  paired yoke/back-lower paths must sew together and preserve the total waist,
  seat, side and center-back relationships.

## Measurements and adjustable parameters

Existing trouser options keep their IDs only where semantics remain identical.
The numeric seeds below are inspectable product starting points, not universal
jeans standards. Final bounds require the future execution packet's actual
XS–XL geometry audit.

| Aspect | Proposed input | Initial range / seed | Basis | Required guidance |
| --- | --- | ---: | --- | --- |
| Waist/hip/depth/thigh/knee/inseam/ease | existing body fields | current domains | shipped lower-body contract; L1 | all current plausibility checks |
| Rise, waistband, thigh/knee ease, opening, fly | reuse trouser options | current domains; jeans style target may choose new seeds | shared semantics | current checks plus component intersections |
| Back-yoke depth at CB | `yokeDepth` | 5–15 cm / 9 cm / 0.5 | product seed; W3/W4 establish function, not one dimension | below waistband, above fullest seat/crotch; both sides trued |
| Front pocket opening | reuse/refine `pocketOpening` | 10–22 cm / 15 cm / 0.5 | product seed; L1/W1/W2 | cutout stays between waist/side/CF/fly |
| Front pocket-bag depth | reuse/refine `pocketBagDepth` | 16–35 cm / 24 cm / 0.5 | product seed; L1 defines finished pocket-bag measure | bag stays inside front and clear of fly/knee |
| Front pocket drop/shape | `pocketDrop` plus one curvature decision | current drop; fixed P0 curve family | current contract plus W1/W2 | no self-intersection; facing and lining seam-walk |
| Coin pocket width/height | `coinPocketWidth`, `coinPocketHeight` | 5–10 / 5–10 cm; 8 x 7 seed | product seed; W1/W2 establish the component | contained by pocket/yoke; opening positive |
| Back pocket width/height | `backPocketWidth`, `backPocketHeight` | 10–20 / 10–22 cm; 14 x 15 seed | product seed; L1 defines position/size POMs | contained by back lower; paired/mirrored placement |
| Back pocket drop/inboard offset | `backPocketDrop`, `backPocketOffset` | 2–15 / 2–15 cm; geometry audit sets seed | L1 measurement taxonomy; product decision | clear yoke, side and center-back allowances |
| Primary/second topstitch | fixed P0 marks at 0.3/0.6 cm where specified | fixed exception | W1 official instructions use 3 and optional 6 mm; W6/A&E shows appearance/process dependence | no mark crosses an allowance/corner; never claim machine settings |
| Belt loops | fixed six in P0 | fixed construction exception | W1 cuts six; W2 inventory supports belt loops; other sources vary | actual waist marks ordered and away from fly/pockets |

Why two fixed exceptions are acceptable: topstitch offsets and six-loop quantity
are a bounded construction presentation for the first recipe, not body fit or
piece size. Future style variation needs a separate option contract; P0 must not
expand shared options to booleans/enums merely to expose every jeans aesthetic.

## Construction and geometry research

| Rule / feature | Source 1 | Source 2 | Agreement / conflict | Adopted treatment |
| --- | --- | --- | --- | --- |
| Traditional five-pocket inventory includes scoop fronts, coin pocket, paired back pockets, yoke, fly, waistband and loops | W1 official instructions | W2 and W3/W4 | Strong agreement; exact counts/shape differ | All are P0 roles/marks; do not call two trouser bags “five-pocket.” |
| Rigid and stretch jeans are separate material/fit contracts | W2/W8 recommend rigid non-stretch; W1 requires 20% stretch | W7 documents material-dependent dimensional stability | Direct conflict if combined | P0 is relaxed rigid woven only. Stretch jeans is a later engine/material epic. |
| Yoke shapes the waist/seat and is a real seam | W3 | W4 | Agree; curve/width vary by style | Split both back roles; pair seam-walked yoke/back-lower interfaces; preserve outer balance. |
| Front pocket is a cut opening plus facing/lining/yoke | W1 lines 35–41 | W4 front-pocket construction | Agree | New cut topology and roles; current construction line is insufficient. |
| Fly requires extension/facing, zipper, shield and bartacks | W1 lines 42–72 | W5 | Agree | Explicit asymmetric front/fly contract with actual seam/mark interfaces; zipper remains BOM hardware, not geometric teeth. |
| Waistband is attached around real waist and resolves CF/CB/side landmarks | W1 lines 83–97 | W4/W10 | Agree; straight vs contoured differs | P0 straight outer/inner pieces with CF extension and CB/side marks. Contoured is future. |
| Topstitch is structural/visual and material/machine dependent | W1 uses 3/6 mm marks | W6/A&E describes thread/needle/process tradeoffs | Agree; A&E values are process guidance | Export marks and ordered operations only; no automatic SPI, needle or thread-size settings. |
| Cotton/denim shrinkage cannot be one fixed compensation | W7 | L4/L5 fabric-preparation principles | Agree | No geometry compensation. Guidance asks for actual prewash/test; future measured warp/weft shrinkage input is a separate architecture decision. |
| Allowances depend on seam type, curvature, fabric and machinery | L4 pp.13–15 | W3 flat-fell process / W1 1 cm construction | Agree but different systems use different values | Jeans owns an explicit allowance map; flat-fell/lapped needs unequal trimming/folding metadata, not a universal 1 cm offset claim. |

## Source conflicts and pressure findings

| Conflict / edge case | Pressure test | Resolution |
| --- | --- | --- |
| Jalie W1 is a 20%-stretch slim/bootcut jean; target is relaxed rigid straight | Apply its fit/material defaults to current woven block | Reject those defaults. Use W1 only for piece/interface/operation evidence; W2/W3/W8 support rigid inventory. |
| Straight versus contoured waistband | Women's sources favor contoured; men's/heritage sources show straight | P0 picks straight for bounded reuse and calls it a style decision, not superior fit. Contoured is a later variant. |
| Back pocket scaling | W10 reports one pattern kept pockets identical across sizes; product principle favors adjustability | Do not universalize that pattern choice. User-adjustable pocket dimensions/placement redraft per size and must remain contained. |
| Current front pieces are perfect mirrors | Real zipper fly construction has left/right ownership and trimming/facing differences | Derive left/right from one base but apply named asymmetric front/fly roles; do not mirror final marked topology blindly. |
| Extreme yoke depth | May consume pocket zone, seat station, or make acute allowance joins | Dynamic CB/side/yoke containment and minimum seam-radius guidance; preserve raw value and block readiness. |
| Tiny/large back pocket or coin pocket | Can exit host panel or cross seams after grading | Check true outline plus allowances at every size; name dimension/offset correction. |
| Heavy material and stacked yoke/CB/waist seams | Digital geometry stays finite while physical bulk fails | Record physical unknown; do not claim sewability or choose machine settings. |
| Shrinkage/skew | A hardcoded percent would be wrong across denim/finishing/care | No automatic correction. Future explicit measured warp/weft values only after product decision. |

## Guardrails and actionable guidance

- Preserve all finite invalid inputs verbatim. Range and relationship warnings
  identify exact fields and computed limits; no hidden replacement.
- Yoke bottom must remain below the waistband seam and above the crotch/critical
  seat region; paired yoke/back-lower seam paths must match by arc length at each
  size. Show whether to reduce yoke depth or adjust rise/body depth.
- Front scoop cutout, facing and lining must remain inside front waist/side/fly
  bounds with usable positive interfaces. Coin pocket must fit wholly in the
  designated pocket/yoke role including allowances.
- Back pockets must remain below yoke topstitch/allowance, inside side and CB
  seams, above the knee/hem, and mutually mirrored.
- Fly length/extension/shield/topstitch/bartacks must remain above the crotch
  transition and inside the waistband/pocket boundaries. Zipper length guidance
  derives from the live fly; no universal hardware is silently selected.
- Waistband lower interfaces must equal the assembled waist. Outer/inner top and
  short ends must remain compatible; button/hole and loop marks must be ordered.
- Primary/secondary topstitch paths must not cross cut boundaries, allowance
  corners, pockets or each other. They are marks/operations, never extra seams in
  the checker unless they truly join layers.
- Rigid woven is the only valid P0 family. Knit/stretch selections get an
  actionable incompatibility warning; the draft is not silently tightened.
- Missing shrinkage/weight/recovery remains unknown. UI/report copy may advise
  testing/prewashing but cannot state a compensated size or fabric performance.

## Pattern pieces, interfaces, marks and operations

### Proposed P0 physical roles

- front left/right; back lower left/right; back yoke left/right;
- front pocket facing left/right; front pocket lining/bag left/right; front
  pocket yoke/stay left/right;
- one coin pocket;
- back patch pocket left/right;
- fly facing/extension support and one fly shield;
- waistband outer left/right and waistband inner left/right, joined at CB;
- one belt-loop strip cut into six declared loops.

Exact role count depends on whether a fly extension is integral to one front or
separate. The execution packet must select one topology and enumerate physical
quantities; it may not hide pieces in renderer-only overlays.

### Required interfaces

- each yoke bottom to its back-lower top, then paired CB yoke/back-rise paths;
- left/right side seams and inseams with knee notches;
- scoop opening to facing; facing/lining/yoke bag closure; pocket waist/side
  basting ownership; coin pocket to its host;
- front fly/rise, zipper-facing/extension and shield joins;
- assembled waist to outer waistband; outer to inner top/ends; CB waistband join;
- back-pocket placement boundaries and belt-loop lower/upper attachment marks.

### Proposed construction metadata

Prepare/topstitch back and coin pockets; attach back pockets; join yokes to back
lower; assemble front pocket units; construct fly/zip/shield; join inseams and
side seams; complete CB/seat seam as selected; prepare/attach waistband and
loops; mark optional bartack/rivet locations; hem. This order must be reconciled
with the chosen seam finish. It is not manufacturing proof.

## Grading contract

Continue measurement-driven redrafting; do not overlay isolated manual point
grades. Existing lower-body body deltas may seed the first size run, but every
new interface needs its own containment/seam checks. Style options remain
constant unless a future evidence-backed option-grade table is authorized.

Yoke depth, pocket dimensions and placements remaining constant is a P0 product
decision, not a claim that all brands grade jeans this way. XS–XL must be
rendered to prove that constant style dimensions do not leave a host panel.

## Render and export verification

Future implementation must exercise and visually inspect:

- default M, XS, XL; minimum/maximum rises, yoke depth, fly and pocket values;
- maximum yoke plus highest back pocket; minimum yoke plus largest pocket;
- largest front opening/bag/coin pocket at smallest waist/front panel;
- shortest fly versus zipper/bartack/topstitch, and longest fly versus crotch;
- minimum/maximum leg opening and inseam with all added components;
- rigid denim/default woven plus incompatible low/high-stretch selections;
- missing material weight/shrinkage and explicit guidance without invented data;
- old saves, default new save, raw invalid recovery, undo/redo;
- empty/populated surface designs, including artwork attached to split back/front
  roles without assuming continuity across a seam;
- single/graded narrow/wide directional nesting after Epic 7;
- Pattern, assembled front/back, Body views, Size run, Spec, Nesting, Check and
  preview-only Edit;
- parsed SVG, DXF, tiled PDF, A0, projector and tech-pack outputs, with real
  piece quantities, marks, allowance joins and representative PDF pages viewed.

All existing hashes remain byte-identical. Tests alone cannot establish physical
bulk, fit, recovery, shrinkage, wash behavior or machine compatibility.

## Physical validation plan

Paused. A future sample must record wearer/body landmarks, chosen rigid-denim
weight/construction/finish, warp/weft test shrinkage and prewash, zipper/button/
rivets/thread, calibrated output, predicted and sewn POMs, seam/topstitch method,
after-wash POMs, pocket/closure use and balance/comfort observations. No such
evidence exists.

## Future implementation packet

Classification: **addition** plus a targeted **redesign** of the trouser pocket/
fly component family for a distinct recipe. Estimated **11–14 slices**, replacing
the roadmap's earlier 6–10 directional estimate:

1. freeze rigid straight five-pocket options, roles and asymmetric fly contract;
2. pure back split/yoke geometry with seam-walk properties;
3. front scoop cut topology, facing/lining/yoke bag interfaces;
4. coin and back pockets with placement/containment;
5. real jeans fly facing/extension/shield/zipper marks;
6. outer/inner straight waistband, loop and closure contract;
7. allowances, topstitch/bartack/rivet marks and construction metadata;
8. guidance, POM/BOM and grade matrix;
9. recipe/UI/persistence and honest material labeling;
10. front/back assembled/Body/Spec/Check representations;
11. surface/nesting/export parsing and rendered evidence;
12. adversarial cross-size exit, documentation and clean full gate;
13–14. contingency for allowance intersections or output pagination exposed by
   the higher role count.

Prerequisites: Epic 7 merged for final nesting semantics; stable lower-body
shared contract; a separate Codex-authored execution packet. Polo V2 is not a
geometry prerequisite but remains ahead in the current implementation queue.

## Decisions and unresolved questions

### Confirmed by this research

- Build rigid relaxed straight-leg jeans first; defer stretch/skinny behavior.
- Use a distinct `jeans` recipe and retain the trouser as unchanged baseline.
- P0 is a truthful five-pocket inventory with real yoke, pocket and fly
  interfaces, straight two-layer waistband, loops and construction marks.
- Do not hardcode shrinkage, recovery, SPI, needle or factory process settings.
- The earlier 6–10 slice estimate is too optimistic for the app's verification
  standard; 11–14 is the defensible range.

### Blocking execution-packet questions

- Choose integral versus separate left/right fly-extension topology after a
  focused front-curve audit; one authoritative source of truth must serve draft,
  preview, marks and exports.
- Resolve exact yoke seam construction and how it redistributes shape without
  changing the shipped trouser outline or pretending a cosmetic split creates
  physical shaping.
- Confirm straight-waistband CF extension/overlap and precise pocket defaults
  from rendered XS–XL containment before implementation.
- Decide whether a `Rigid denim` material label may be added as 0%-stretch UX
  metadata in the same epic or should remain BOM/guidance copy only.

## Sources

Accessed 2026-09-20.

- **L1** — `F:\tank-sketches\scribd - garment-design - files\garment_measurement_quick_reference.docx`, *Garment Measurement Quick Reference*, bottom and pocket POM taxonomy.
- **L2** — `F:\tank-sketches\scribd - garment-design - files\pattern_making_body_measurements_reference.docx`, *Pattern Making and Grading Reference*, grain, alteration and grade-interface checks.
- **L3** — `F:\tank-sketches\scribd - garment-design - files\stitches_seams_detailed_reference.docx`, *Stitches and Seams Detailed Reference*, process-selection evidence; not hardcoded machine authority.
- **L4** — `F:\tank-sketches\scribd - garment-design - files\226112995-Pattern-Making.pdf`, *Patternmaking* teaching slides, pp.5 and 12–15 on lower-body landmarks, production layers and allowance dependencies.
- **W1** — Jalie, [Women's Stretch Jeans 2908 instructions](https://cdn.shopify.com/s/files/1/0267/4075/2568/files/2908.pdf?v=1729000051), official seven-page role/interface/operation evidence. Its 20%-stretch fit is explicitly not adopted.
- **W2** — Wardrobe by Me, [Men's Five-Pocket Jeans product record as distributed by Les Tissées](https://lestissees.com/products/jeans-sewing-pattern-mens-sizes-26-42), traditional rigid-denim straight-leg inventory.
- **W3** — Thread Theory, [Jeans sew-along: yoke, inseams and side seams](https://threadtheory.ca/blogs/sew-alongs/jeans-sew-along-yoke-inseams-and-side-seams), yoke shaping, flat-fell construction and side-seam reinforcement.
- **W4** — Thread Theory, [Jeans sew-along index](https://threadtheory.ca/blogs/sew-alongs/tagged/jeans-sew-along), front-pocket/yoke/waistband sequence and style conflicts.
- **W5** — Thread Theory, [Jeans sew-along: the fly](https://threadtheory.ca/blogs/sew-alongs/jeans-sew-along-the-fly), fly shield, zipper and bartack relationships.
- **W6** — American & Efird, [Denim / Jeanswear technical resources](https://www.amefird.com/technical-tools/thread-selection/end-use-markets/denim-jeanswear/) and [Denim - How to Sew X-Heavy Thread Sizes](https://www.amefird.com/wp-content/uploads/2010/01/Denim-How-to-Sew-X-Hvy-Thread-Sizes-2-8-10.pdf), evidence that thread/topstitch choices depend on process/equipment; no values are hardcoded.
- **W7** — CottonWorks, [Shrinkage and Skewing](https://cottonworks.com/learning-hub/quality-assurance/shrinking-and-skewing/), dimensional-stability factors and rejection of rigid arbitrary shrinkage specifications.
- **W8** — Anna Allen, *Helene Selvedge Jeans* product specification as distributed by [MaaiDesign](https://www.maaidesign.com.au/products/pdf-pattern-helene-selvedge-jeans-anna-allen-clothing), independent rigid-denim five-pocket, yoke, straight-waistband and hardware inventory.
- **W9** — Closet Core Patterns, [Ginger Jeans sew-along](https://blog.closetcorepatterns.com/ginger-jeans-sewalong/), independent sequence/component cross-check; its stretch-denim product assumptions are not adopted.
- **W10** — Thread Theory, [choose a size and test for fit](https://threadtheory.ca/blogs/sew-alongs/mens-jeans-sew-along-choose-a-size-and-test-for-fit), waistband/fly test assembly and evidence that digital geometry does not remove the need for sampling.
