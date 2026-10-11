# G04 V02 source-to-view proposals — Slice 321

## Start and verified boundary

- **Start:** 2026-10-01 01:16:34 UTC. This resumed audit starts from S320's verified repository boundary; the timestamp records S321 work, not the original Epic start.
- **Goal:** inspect every current V02 face hold against exact drafted roles, joins, pattern-specific source notes and S319 rendered output; make source-versus-decision status explicit; create annotated views of the exact draft; present concrete view mappings and ask only for decisions that remain outside source evidence.
- **Git:** branch `codex/epic-17-g04`, S320 `5e03d371dc0986a95e4472bd642d63b07d201468`; refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and is an ancestor. Worktree had only the new S321 overlay folder, created during this research; no pre-existing user changes. Highest assigned slice is 320; reserve S321.
- **Board at start:** canonical `ops/control-center/data/board.json`, revision 791. EPIC-17 and G04-V02 are In Progress; V01 Done, V03 Backlog. S319 remains the controlling output replay: 73 configurations, 146 requested faces, 32 option fields; 28 accepted and 118 held.
- **Required gates:** this evidence-only boundary uses the validated Control Center command layer, board schema validation, `npm run control-center:test`, rendered/annotated artifact inspection and `git diff --check`. No production module changes, so changed-production coverage/build/DXF gate is not applicable. Full global coverage and integrated Epic/browser/output gates remain required on the settled PR candidate.
- **Blocking decisions:** approval of view-only conventions for sleeve face runs and pair display; approval of a proportional exterior collar station where source has no corresponding outer-edge landmark; Woven closure construction or an explicit all-seven acceptance revision; and an admissible resolution for the Trouser source graph conflict. No proposed semantic view mapping is implemented in S321.
- **Non-goals:** keep pattern/cut geometry and stitch graph unchanged; no unsupported partial face; no V03 until G04 V02 acceptance passes; no acceptance weakening without explicit approval; preserve DXF and protected export bytes. No physical sample, fit/factory claim, supplier contact, new recipe, broad UI, G09/D04 assembled views or G05 tech-pack content.

## Refreshed hold census

The S319 same-revision browser matrix and S320 source/reference audit remain authoritative. No additional held family or configuration appeared in this resumed audit.

| Recipe | S319 configurations | Held faces | Source state rechecked in S321 |
|---|---:|---:|---|
| Tee | 1 | 2 | cap edge order and shared cap crown/hem geometry are authored; visible face contour and instance convention are not |
| Fitted | 1 | 2 | same source sleeve as Tee; different fitted body armhole does not add a view rule |
| Tank | 1 | 0 | both faces accepted |
| Polo | 17 | 34 | outer stand has a source shoulder junction; upper/under collar outer cubic has no shoulder point |
| Woven | 28 | 56 | front quantity two and placket-to-side labels are authored; placket layer order is not; collar outer and cap relations remain distinct holds; back ease stitch remains inconsistent with the solved face |
| Skirt | 1 | 0 | both faces accepted |
| Trouser | 24 | 24 fronts | back faces accepted; no rigid front mapping satisfies current fly marks and front waist joins |
| **Total** | **73** | **118** | **28/146 accepted; 118/146 held** |

Options are the full S319 matrix, not only defaults. It includes all supported minima/maxima plus combined fixtures for Polo's collar/stand values, Woven's stand/collar, button, pocket, yoke, band, vent and hem values, and Trouser's rise, waistband, leg, fly and pocket values. Tee/Fitted shape varies with the live measurements, including their separately drafted body armholes. All proposed source-derived relations must be validated against the same live Block and design revision; S321's annotated geometry uses default `STANDARD_M` to make the topology legible and does not stand in for that matrix.

## Overlay artifacts and method

`docs/research/epic17/S321-pattern-overlays/` contains recipe-specific JSON, SVG and Chromium-rendered PNG for Tee, Fitted, Polo, Woven and Trouser, plus the generator. The JSON directly stores the geometry drafted from current recipe source at S320 commit `5e03d371dc0986a95e4472bd642d63b07d201468`; it deliberately does not invent a `live-draft` view revision. Each role is drawn in its own tile at its source coordinates. The candidate sleeve split and collar transfers are orange and explicitly labeled proposal-only. The overlays were visually inspected. Several dense marks in collar/placket tiles overlap at this display scale; exact IDs/coordinates remain readable in JSON. They are source-topology evidence, not proposed finished-flat screenshots, and they establish neither readable final labels nor acceptable joins/layers.

## Source facts and proposed mappings

### Tee and Fitted sleeve

**Directly encoded in pattern source:** `src/drafting/sleeve.ts` emits one off-fold sleeve role with ordered edges `capLeft`, `capRight`, `sideRight`, `hem`, `sideLeft`. In both default drafts, the cap arcs share crown `(21.5, 0)`; cap endpoints are `(0, 1.7869)` and `(43, 1.7869)`. The hem runs `(40, 23.7869)` to `(3, 23.7869)`. The sleeve-cap stitch orders `capLeft + capRight` against `front.armhole + back.armhole`, so its seam intervals are ordered front then back. Fitted reuses this sleeve role with its own front/back armhole geometry. There is no visible-face contour, hem split, or view-instance count field.

**Pattern-specific reference:** S290 reviewed Maelo BL-020, Nuffield's T-shirt teaching resource and ASG sleeve-setting guidance. They support ordinary set-in sleeve sewing, cap easing and a generic pair/cut-flat practice; none names an exterior projection boundary or transform for this exact role. No unchecked source-specific lead remains in S320's source audit.

**Concrete proposed design decision (orange dashed line in both sleeve overlays):** for each sleeve instance, define a view-only front half with `capLeft`, `sideLeft`, and the left hem segment from `(3,23.7869)` to `(21.5,23.7869)`; define the back half with `capRight`, `sideRight`, and the right hem segment from `(21.5,23.7869)` to `(40,23.7869)`. The front cap attaches to the front armhole; back cap to back armhole. Display two mirrored sleeve instances across left/right garment sides, with body silhouette/seams below sleeve outline and cap joins sharing the existing armhole contour without a second overdraw. Do not draw the split as a cut seam or add it to the pattern; it is only a view partition. Apply the exact live crown and hem endpoints at each size/measurement, not the default numeric coordinates.

**Assumption/effect:** the seam order supports cap-half assignment, but the hem midpoint split and view-pair convention are not authored or specified by the reviewed local sources. This gives complete front/back-facing sleeve contours without rotating a whole source piece through the bodice; it can still suggest a front/back dividing seam if rendered as a visible line, so the split itself must remain a hidden mapping boundary. Approval is needed before implementing that semantic rule. If not approved, all four faces stay held.

### Woven sleeve and sleeve band

**Directly encoded in pattern source and research:** the source sleeve has the same left/right cap edge structure, and `sleeveBand.top` stitches to `sleeve.hem`; the band has center `bandFold`. The Woven maintained recipe record `docs/research/garments/WOVEN-SHIRT-RESEARCH.md` specifies two sleeves and two folded bands. Its sleeve-cap ease stitch orders `capLeft + capRight` against front armhole, yoke armhole-upper, then back armhole-lower. It does not mark which visible outer runs belong to a face or how the three body intervals subdivide the cap intervals. The Fairfield reference in S286 supports the Woven yoke and shoulder/collar construction but not the missing sleeve face projection.

**Concrete proposed design decision:** show two mirrored sleeve and sleeve-band instances. To split the authored cap's ordered path against the three authored body intervals, compute the cumulative body path `front.armhole → yoke.armholeUpper → back.armholeLower`; use the end of `front.armhole` as the proposed front/back view boundary. Transfer that cumulative fraction to the ordered cap path `capLeft → capRight` by normalized arclength. Use the cap prefix plus `sideLeft` and left hem half on FRONT_FLAT, and cap suffix plus `sideRight` and right hem half on BACK_FLAT. Render `yoke.armholeUpper` with the back-facing seam layer because the yoke is a back piece. Show each folded `sleeveBand` as one uncut view instance at the sleeve opening, with its existing `bandFold` mark; align band `top` to sleeve `hem` and show the band edge over the attachment without redrawing the joined hem as a second outline.

**Assumption/effect:** the source gives ordered aggregate seam paths but no exact break from a cap point to the yoke/back transition; normalized arclength transfer is a proposed view convention, not construction evidence. The two sleeve/band count is stated by the maintained Woven recipe record. This proposal preserves authored cut edges and sew interfaces, but cannot cure S287's independent assembly conflict if the actual rigid placement still fails the aggregate ease/topology gate. Do not release Woven back on this proposal alone; the full generated front/back candidate must satisfy all joins and pass rendered crossing review.

### Polo outer stand and collar

**Directly encoded in pattern source:** `outerStand` is on-fold. Its exterior sequence contains `backCollar` from CB to a shared endpoint `(7,-4.5)` and `frontCollar` continuing from that exact endpoint to CF. The current mark/edge data identify this shared junction as the shoulder station. This directly establishes the stand's exterior contour split; no proportional inference or new cut notch is needed. The other boundary edges are the front end and neckline. This source fact can be mapped using the existing on-fold axis and the exact `backCollar`/`frontCollar` IDs under the already authorized source-backed view-metadata authority.

**Directly encoded:** `upperCollar` and `underCollar` each expose a stitched base path (`backCollarBase` and `frontCollarBase`) with CB, shoulder and CF source landmarks; each has one `outer` cubic from the front tip to CB and no station on that cubic. The cubic's default endpoint/control data and exact base seam paths are in the Polo JSON overlay.

**Pattern-specific references:** S288/S294 checked the official Jalie 3137 instructions, Maelo BL-018, Threads' two-piece collar method, Müller & Sohn's separate-stand article, and Massey's collar drafting thesis. They establish construction methods and base-seam shoulder notches, but none binds the current shoulder notch to a point on this authored Polo outer cubic. No unchecked supplied source can locate that point.

**Concrete proposed design decision:** calculate the normalized seam-length fraction `r = length(backCollarBase)/(length(backCollarBase)+length(frontCollarBase))` from CB toward CF on the same live collar piece. Mark the `outer` cubic at the point `length=r×length(outer)` when traversed backward from its CB endpoint toward its front tip. Use the same `r` for upper and under pieces because their base and outer paths are source-equal. On `FRONT_FLAT`, expose the CF→projected-shoulder portion; on `BACK_FLAT`, expose projected-shoulder→CB; retain both cut layers in their authored over/under layer relation and do not draw the mapping station as a sew line or alter the cubic.

**Assumption/effect:** equal normalized arclength across base and outer edges is a view convention only; no reference establishes it as a construction rule. It preserves source curvature while choosing a repeatable station across all options. Approving it would resolve the outer-collar station gap but must still pass face assembly, crossing, overlap, and readability review. Declining it leaves all 34 Polo requests held by the unlocated outer-collar station even though the outerStand station is now sourced.

### Woven collar and stand

**Directly encoded / existing pattern-specific reference:** the Woven `outerStand.neckline` joins the authored front and rear neckline stitch lengths, and S286's Fairfield comparison derives the shoulder station on that neckline by the exact rear-neckline length. Its exterior `collar` edge is a separate CB→CF straight edge with no shoulder point. Upper/under collar `stand` edges stitch to the stand's collar edge, while their `outer` edges are straight CF→CB runs with no shoulder station. Thus the sourced stand seam station does not by itself locate the station on either external contour.

**Pattern-specific references:** S285/S286 and S294 inspected Fairfield's specific collar/yoke sequence, its seam shoulder notches, and the other collar references described above. Fairfield supports matching construction notches on the seam but supplies no cross-edge point on these exact outer contours.

**Concrete proposed design decision:** let `r = rearNecklineLength/(rearNecklineLength+frontNecklineLength)` from CB toward CF, using current front neckline plus back/yoke neckline lengths in their authored stitch order. Transfer `r` to the Woven outerStand `collar` edge from CB to CF and to each upper/under `outer` edge from CB to CF. Keep the sourced station on `outerStand.neckline` as seam evidence, but use the transferred points—not the seam edge—as the visible outside-face boundary. Split each outer collar edge into CB→station for BACK_FLAT and station→CF for FRONT_FLAT; preserve the existing on-fold axis and upper/under ordering.

**Assumption/effect:** the source gives the reference fraction on the stand/neck seam, not its location on the collar exterior. Applying that fraction across all three exterior runs is a product/view decision. It makes front/back collar output consistent under the existing live collar length options without moving cut geometry; it does not claim a factory notch or physically sampled collar roll. Approval is needed before implementation. Without it, all 56 Woven faces stay held.

### Woven front pair and placket closure

**Directly encoded:** `shirtPanel` describes a separate half-width front on `centerFront`; S297's validated `WOVEN_SHIRT_PHYSICAL_ROLES` declares two mirrored physical front instances. `WOVEN_SHIRT_PLACKET_STITCHES` labels `buttonPlacket` at the right front center-front and `buttonholePlacket` at the left front center-front. Both stitch interfaces still target the shared source role edge; code does not declare which physical copy is on top. `buttonPlacket` carries button marks; `buttonholePlacket` carries buttonhole marks. Their drafted outline dimensions are equal at the default fixture (5×61.8 cm before live option changes).

**Checked references:** S299 compared Closet Core Kalle's attached front placket; S320 additionally checked Jalie 3137, OTTOBRE Henley plackets, the Coffin listing and available construction leads. Those examples describe their own closure geometry and do not assign these exact two roles or their finished layer order. No new relevant specific source remains unchecked; the maintainer already confirmed no Woven construction sheet is available.

**Concrete proposed design decision A:** retain the source's named `right front`/`left front` assignment: place `buttonPlacket` on the right half-front and `buttonholePlacket` on the left half-front. For the exterior FRONT_FLAT, display the right-front instance at viewer-left and left-front at viewer-right; S297 supplies their mirrored relation around `centerFront`, while this viewer orientation is the proposed orthographic convention. Show the button-bearing right-hand placket above the buttonhole left-hand placket in the center-front overlap. Preserve `frontOverlap` as overlap width only; it does not choose direction. Draw buttons/buttonholes at their source marks on the top/bottom layers respectively. This makes a complete Woven closure but adopts a common men's shirt direction as an explicit local style decision.

**Alternative B, as explicitly requested:** retain the Woven closure and all Woven faces held, and approve a documented revision to G04's all-seven-recipe acceptance criterion that makes this Woven closure/recipe an explicit exception. This is an acceptance change, not a V02 pass under the admitted all-seven requirement. It requires updating the admission, roadmap/exit statement and canonical board, and V02 cannot close with its original acceptance criterion.

**Effect:** A enables the current all-seven target without changing cut geometry; B keeps the closure honest but formally narrows the target and leaves the original criterion unmet. Neither is source-established. The S319 Woven back sleeve-cap ease conflict remains independently unresolved under either choice.

### Trouser front

**Directly encoded:** at `STANDARD_M`, `frontLeft.waist` runs `(0,0)→(23.5,0)`, `frontRight.waist` runs `(0,0)→(-23.5,0)`; both `centerFront` edges lie on x=0 from y=24 to y=0, so the two source panels are mirrored and upright around a natural CF axis. Both `flyEdge` marks are the same directed vertical x=0, y=0→15. The separate `flyShield` is 3.5 cm wide, with distinct left/right edges 3.5 cm apart. The exact stitches pair `frontLeft.flyEdge` to `flyShield.left`, `frontRight.flyEdge` to `flyShield.right`, and the waistband has separate front center joins.

**Pattern-specific references:** S289/S308 exercised the exact source graph across default plus option extrema and recorded that Sasha and OTTOBRE fly examples use different facing/shield constructions. They do not define a transform for this role graph.

**Conflict:** under the upright mirrored source orientation, both fly marks coincide on x=0, so they cannot simultaneously attach to the shield's distinct edges without an additional placement relation, modified interface, or non-rigid/piece edit. The constrained candidate that attaches both fly marks in S308 flips one panel 180° and then fails the independently declared front waistband center join. The accepted candidate cannot both satisfy current fly attachments, upright half-fronts and exact waistband center-front joins. S308 observed the same failure through default and 22 option extrema; S319 still holds all 24 front configurations. No view transform can resolve contradictory constraints while preserving every current source relation.

**Disposition/recommended decision:** do not approve a guessed view mapping or release a partial front. Keep the complete front held until the pattern's source contract is revised to author a realizable fly relation while preserving the waistband join and physical front identities. That requires a new, separately approved pattern-source/construction decision; the current view-only metadata authorization is insufficient. This is not solved by searching another general fly tutorial. The 24 Trouser backs remain accepted. No same-geometry option presented here can unblock this hold.

## Decision request

No answer is needed on a fact already encoded above. Decisions still required before dependent semantic mappings can be implemented:

1. **Sleeves:** approve the Tee/Fitted cap-half + side + hem-half mapping, with two mirrored instances and no visible partition line? For Woven, also approve the specific normalized-arclength transfer from `front.armhole` to the ordered three-edge body/cap stitch path, with the yoke on the back face? **Recommended: approve the Tee/Fitted relation; approve the Woven transfer only as a view convention if its seam-join/output checks pass.** Consequence: gives each recipe an exact candidate boundary while keeping cut geometry fixed; Woven remains held if its current aggregate stitch cannot assemble coherently.
2. **Polo/Woven collar exteriors:** approve normalized CB-to-CF arclength transfer from the sourced base/neckline shoulder fraction onto only the unmarked exterior edge(s), as described above? **Recommended: approve as a view-only product convention.** Consequence: places a deterministic face boundary across current options but is not source evidence of a physical notch. The Polo outerStand station needs no such decision because its exterior shoulder junction is directly encoded.
3. **Woven closure:** choose **A** (approve right button placket above left buttonhole placket; preserves seven-recipe criterion) or **B** (approve a documented hold and explicit all-seven acceptance revision; G04 does not pass the original criterion). **Recommended: A** if the all-seven goal remains. Consequence: A completes this closure by a product decision; B formally narrows G04 and leaves Woven held.
4. **Trouser front:** approve a follow-on source construction revision that changes the conflicting fly interface relation while preserving upright front panels and the exact waistband joins? **Recommended: authorize investigation/proposal only, not a source edit yet.** Consequence: a new pattern-source decision and separate approval will be required; until then the 24 front faces stay held. There is no coherent same-geometry mapping to approve.

S321 does not implement any of these proposed decisions. The default recommendation for the Trouser question preserves the current hard hold and does not weaken all-seven acceptance.

## Open facts and acceptance impact

- S319 remains 28/146 faces accepted, 118 held. The Polo outerStand station fact is now classified as directly encoded; this does not yet release a Polo face. No other face status changes.
- Woven button/right and buttonhole/left roles are source-named, but the upper/lower overlap remains a maintainer decision. Maintain the user's exact two-option decision request above.
- V02's admitted acceptance remains all seven recipes. Do not call it passed while any supported face is held. If decision B is approved, record the formal scope/acceptance revision and report the original all-seven criterion unmet.
- Applicable MQF-004–007, MQF-011, MQF-012 remain review checks to mark **To be reviewed** at their G04 output exits; MQF-015 stays for V03. Treat these as output review only; preserve post-G17 deferrals.
- Unchanged scope boundaries, source bibliography, and accessible-source limitations are in S320 and the cited S285/S286/S288/S289/S294/S297/S299/S308 packets. No exact S320 lead remains unchecked; no additional generic reference search was performed.

## Slice exit

- **Implementation:** research-only overlays and proposal ledger. No production code, construction metadata, source geometry, cut geometry, exports, option validation, or live output changed.
- **Focused verification:** generator completed from the S320 source commit; five exact-draft JSON/SVG sets and five Chromium-rendered PNGs were inspected. This verifies source topology only, not candidate assembled flats. Canonical board schema validates at revision 799; `npm run control-center:test` passes 33/33; `git diff --check` passes. The first Control Center run exposed a stale regression expectation for the latest summary-card comment; the board state was correct, the test was updated to assert S321's latest comment and linked evidence, then the full focused suite passed. No production tests/build/export gate applies.
- **Acceptance:** investigation and concrete proposals complete; user decisions and all currently held output remain pending. V02/V03 statuses do not change.
- **Elapsed:** 01:16:34–01:29:10 UTC (12m36s). Research/source and exact topology review 6m; overlay generation and visual inspection 4m; production implementation 0m; Control Center test/diagnosis and board schema/diff verification 1m30s; durable packet/context/board closeout 1m06s; external-agent waits 0m; maintainer-decision time 0m (four decisions now requested).
- **Board:** validated command layer links `E-G04-S321-START` and `E-G04-S321-EXIT` to G04-V02, the EPIC-17 summary work item and Epic record. Final canonical board revision 799; EPIC-17/G04-V02 remain In Progress, V01 Done and V03 Backlog. All 118 holds remain.
- **Landed slice:** `Slice 321: propose V02 source topology mappings`; commit identifier is recorded in branch history.
- **Next action:** receive the four grouped decisions above, then implement only approved view mappings in new slices with exact focused coverage and rendered output review. Keep Trouser held unless its source contract is separately revised; do not start V03 until the all-seven V02 acceptance is satisfied.
