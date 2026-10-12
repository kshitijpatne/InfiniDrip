# InfiniDrip architecture guide

## UIQ-08 inspection-toolbar integration boundary

The isolated Slice 757 candidate and rendered evidence are complete. Comparison
shows improved grouping from solid controls, but translucency has no meaningful
effect because the real toolbar is not layered over artwork. Keep translucency
out of production absent new evidence. The candidate-only deployment did not
ship app behavior. The maintainer has now separately admitted a bounded
integration of the solid, opaque grouping behind embedded `uiq_inspection_toolbar`.
That flag is not remotely switchable; disabling it in production requires a
reviewed code-default change and redeployment. The exact legacy toolbar remains
the OFF/unknown/stale fallback. The full candidate repository gate passed with 100% global
coverage using two command-scoped workers after the default parallel run showed
three contention-sensitive failures. No repository worker setting changed.
Slice 759 integrates that solid-only treatment behind the embedded flag and
merged through PR #40 at `bb0bfd22`; Slice 760 verified the automatic workflow
and actual stable/immutable public outputs. UIQ-08 is Done at board revision
4512. Evidence is in `docs/release/UIQ-08-INTEGRATION-S759-EXIT.md`,
`docs/release/UIQ-08-INTEGRATION-S760-CLOSEOUT.md`, and
`docs/research/uiq08-integration/evidence/`. The flag has no remote switch.
The deploy runner reported a transient Wrangler npm audit advisory (tracked
separately in `PROJECT-STATE.md`). See
`docs/planning/UIQ-08-INTEGRATION-ADMISSION.md`,
`docs/planning/UIQ-08-INTEGRATION-GOAL.md`, the candidate packet, and
`docs/research/uiq08/CODEX-REVIEW.md`.

This guide explains how measurements and choices move through InfiniDrip and
become digital sewing-pattern files. You do not need coding or sewing
experience to follow it.

## What the app does

InfiniDrip is a local workspace for turning garment measurements and design
choices into a two-dimensional pattern draft. It is intended for both home
sewists and DIY makers, and independent designers and patternmakers. People
choose a garment, enter measurements, adjust design choices, review digital
checks, and save pattern files and planning views.

A sewing pattern is a set of shapes that can be cut from fabric and joined to
make a garment. InfiniDrip draws and checks those shapes on a screen. It does
not simulate cloth draping on a body, sew a sample, or prove that a finished
garment will fit or be ready for factory production.

The app currently includes seven garment types: Tee, Darted tee, Tank, Polo,
Woven shirt, Skirt, and Trouser. A Darted tee uses sewn-in folds called darts
to shape the fabric.

## The person's path through the app

1. **Garment:** Choose one of the seven garment types.
2. **Measure:** Enter the body and length measurements it uses.
3. **Style:** Choose how roomy the fit should be, fabric and its stretch,
   color, garment options, and where a design should appear on the garment.
4. **Check:** Review the Check view. Some warnings block Export; others are
   advice.
5. **Export:** Choose settings and save the pattern or its technical reference
   files.

On first use, the app offers an optional tour of the controls. It can be skipped
and replayed. It does not alter design values, mark a design as checked, or
start an export.

The shipped UIQ-02 integration applies the accepted native foundation panel
and warning primitives to the active guided-tour panel only. This is scoped to
the tour and does not restyle the app shell or other panels. The embedded
`uiq_foundation` flag defaults on; its off path retains the previous tour
markup and styles. The flag is local metadata/programmatic only, not a
user-facing or remote kill switch. Changing the default and deploying a new
build is required to roll back for preview users. The completed/suppressed
replay prompt retains the legacy rendering. PR #21 is merged to main at
`5726a1ff6f73e11a3f78999dcabfcba1c51fcc55`; production workflow `38158498775`
passed and `https://infinidrip-preview.pages.dev` returned HTTP 200. See
`docs/release/UIQ-02-INTEGRATION-S735-CLOSEOUT.md` for deployment proof and
`docs/release/UIQ-02-INTEGRATION-S734-EXIT.md` for the implementation gates.

The shipped UIQ-03 presentation is inside the existing Design readiness
disclosure behind embedded `uiq_guidance`, with the exact existing checklist as
its fallback. It renders readiness, fit intent and digital validity from
existing state; it does not change validation, navigation, correction data,
persistence, drafting or exports. PR #23 merged it at `8ef63471`; main workflow
`38173525917` passed and a fresh browser verified
`https://infinidrip-preview.pages.dev` at HTTP 200 with the panel visible and no
page errors or off-origin requests. Slice 736's implementation gates are in
`docs/release/UIQ-03-INTEGRATION-S736-EXIT.md`; Slice 737's release/board proof
is in `docs/release/UIQ-03-INTEGRATION-S737-CLOSEOUT.md`. Closeout PR #24 and
main workflow `38176394059` also passed, and the same public URL was verified
again. UIQ-03's goal is complete. At that closeout boundary UIQ-04/05/07 were
Backlog; UIQ-04 later completed through Slices 739–740, and UIQ-05 was admitted
on 2026-10-11 as the next serial integration. S741 merged in PR #28 at
`7f5e6263`; S742 deployment and stable/immutable live browser checks passed.
UIQ-05 is Done at canonical board revision 4404 after the closeout evidence;
its durable closeout and current-state reconciliation are complete. UIQ-07 was
separately admitted for integration into the existing first-run welcome only.
PR #36 merged Slice 755 at `8282ad4c`; workflow `38259487661` passed and Slice
756 verified both stable and immutable public deployments with the welcome,
existing actions and physical-fit caveat present, one H1, functional Start,
zero overflow/errors/off-origin requests. UIQ-07 is Done at board revision
4464. See `docs/release/UIQ-07-INTEGRATION-S756-CLOSEOUT.md`. UIQ-08+ stay
unadmitted.

UIQ-06 is complete through Slice 751 and deployed. Slice 745 changes only presentation of the
existing Nesting readout: precomputed scope/required/planned/waste/on-hand
values are separated from the fit estimate and directional-print caveat. No
nesting result, validation, physical-fit claim, control or persisted value
changes. The embedded `uiq_operational_clarity` flag defaults on after this
release is accepted; its local off/unknown/stale path retains the exact legacy
markup and wording. This is a code-default rollback contract, not a remote
switch. Slice 747 made one presentation-only correction in measurement history:
it labels the recorded time as UTC and separates source detail; the original
canonical timestamp and all provenance, values and persistence remain intact.
Slice 748 made the existing grade-plan and Check POM matrices' horizontal
overflow visible and keyboard-scrollable where needed, labels each exception
reason with its size, and keeps numeric comparison columns readable beside long
reasons. Grade calculations, exception records, review/approval/readiness and
export behavior remain unchanged. Slice 749 clarified two local-project
messages: the project panel describes local storage without implying unsaved
edits are saved, and recovery explains that the last saved version remains
unchanged until explicit Save. Recover/Discard actions, persistence, history,
package import/export and frozen output behavior are unchanged. Desktop/mobile
render and clean-profile browser/Electron evidence is in
`docs/research/uiq06/S749-PROJECT-RECOVERY-READABILITY-EXIT.md`; the S750
settled local release gate passed, and Codex-owned PR #31 merged to
`origin/main` as `caa1c751`. Main deployment run `38201698605` passed; stable
and immutable public URLs passed live responsive/no-egress verification. The
The validated board records UIQ-06 Done at revision 4451 with S750–S754
evidence. PR #32/run `38203805432`, PR #33/run `38205969649`, and PR #34/run
`38207414640` passed the full main tests/build/artifact/Pages deployment
workflow. The final run reused the existing bundle (zero files uploaded);
stable and latest immutable preview URLs returned HTTP 200. S752's live
pressure run recorded BUG-UI-048, a
separately tracked 7.65625px overlap between mobile “More views” and “Assembled”
controls at 320px; it is pre-existing and Backlog-only, with no fix admitted.
S751 evidence and limits are in
`docs/research/uiq06/S751-MERGE-DEPLOYMENT-EXIT.md`; UIQ-06 boundaries
and exact flag-off fallback remain in `docs/planning/UIQ-06-ADMISSION.md`.

## How measurements become pattern shapes

The current design is the common source for most views, checks, planning tools,
and exports:

```text
measurements + design choices
              ↓
   chosen garment's rule set
              ↓
       pattern-piece shapes
              ↓
shared views, checks and planning
              ↓
       digital files to save
```

For Woven `sideVentDepth=0`, the front and back drafts join the side seam
directly to the curved hem: the degenerate vent edge and `VENT TOP` marker do
not exist, and the side-vent POM has no geometry anchor. Positive vent depths
retain the explicit vent edge and marker. The zero-depth case is represented
as a closed construction rather than a zero-length open seam, preventing the
seam-allowance offset from generating non-finite cut coordinates.
The live view also fails closed at positive depth if its authored open-vent
edge no longer meets the source-adjacent edges; it does not project a broken
seam by guessing replacement endpoints.

### Live technical flats (EPIC-17/G04)

The advanced **Technical flat** canvas view turns the current recipe draft into
revision-bound front and back SVG drawings. Each face uses its mapped role
geometry and source construction data, rigid sewn-role placement, applicable
saved artwork boundaries, fabric colorway and POM callouts anchored to the
geometry they measure. Supported option values are checked against the exact
draft topology before a face is rendered. Missing source details, unresolved
joins, back-view POMs without geometry anchors, and unreadable text remain
visible as notices or block that drawing; the renderer does not fill gaps by
guessing.

Source-to-view identity reads complete colon-delimited `role`, `mark`, and
`dart` tokens. This prevents a role whose name prefixes another role (for
example, `sleeve` and `sleeveBand`) from inheriting the other role's placement
or moving its geometry and anchored annotations.

Slice 457 adds two approved Woven view conventions bound to the exact pattern
revision. FRONT_FLAT clips the source `front.neckline` strokes only inside the
rendered upper/under collar leaf fills, leaving the open-V segment visible.
BACK_FLAT reflects the sleeve pair on local Y and relocates the two source-scale
detached band details outward to clear the sleeve silhouettes. Neither mapping
changes piece cut geometry, stitch topology, POMs, option values, or source
revision. The back layout expands its viewBox by 41.1474–44.863 cm over the
prior fixed-band output. Source-wide option and rendered audits are in
`docs/research/epic17/S457-woven-front-back-resolution/`. Woven's 56 faces pass
their local checks; integrated V02 remains open on 34 held Polo faces and its
all-seven recipe gate. The Polo residual remains 0.68 cm against 0.25 cm.

Slice 434 adds Polo's source-bound J/FG presentation without moving either
source measurement. The J key stays anchored to `outerStand.frontEnd`; one FG
ring is centered at `outerStand.frontNeckline` and groups three independent
full-text schedule rows (`finished-placket-width`, `front-neck-drop`, and
`stand-front-rise`). Each row retains its own revision, target outline, source
edge, value, tolerance, and text. Only the two approved source IDs bypass
inline label placement because their schedule rows carry the readable text;
other callouts keep the normal overlap-aware placement. Key markers are view
annotations and never add pattern notches or construction joins. Option-wide
rendering is necessary but does not clear a face while separate readability,
construction, or residual gates remain open.

Slice 318 paints a requested colorway area only when emitted silhouette paths,
source-declared reflected edges and mapped view boundaries form exact closed
loops at the same four-decimal coordinates serialized to SVG. The area is
composited once at 16% opacity beneath the unchanged independently stroked
edges. Missing, ambiguous or open contours withhold the complete SVG and
explain which mapped role needs review. Trouser waistband area uses the exact
source waist-edge fragments and mapped waistband side boundaries. This makes
the tint visible on accepted roles; it does not release any previously held
face or infer unfinished construction.

Slice 380 adds the maintainer-approved keyed presentation for Polo's front
`Collar point extension` POM. Its `C` ring is centered on the exact same-revision
`upperCollar.frontTip:end` source anchor; the renderer places the unchanged full
POM text and value in a measured `C` row below construction notices. The key and
row carry the original POM, target outline and revision identity. This is a
view-only callout convention and does not add a physical notch or change pattern
geometry. The all-option diagnostic confirms the two previously recorded C
label collisions clear, while other Polo callout crossings and the 0.68 cm
sleeve residual above the fixed 0.25 cm gate continue to hold all Polo faces.
The production compiler remains fail-closed on that residual. The colorway
render check covers the mapped body/placket/stand/collar roles; the unresolved
sleeve colorway contour is excluded and remains held.

Slice 386 extends the Polo front schedule with approved source-centered open
keys A/B/D/E/FG/H/I for ten current POMs. Distinct POMs that share a key retain
their own full text/value/tolerance schedule rows; one ring is drawn only when
the keyed anchors have exact same-revision coordinates. Each mapping validates
the current source POM, target geometry and source entity. Open rings keep
underlying source strokes visible, and the existing C marker stays filled with
its prior single-row layout. The 17-option browser replay renders all eight
stations and eleven POM rows with unchanged pattern paths and paired-back
output, but source labels and construction marks still crowd H/FG/D and the
center-back I station. This display trial therefore does not pass Polo
readability or release any face; the 0.68 cm sleeve residual and fixed 0.25 cm
gate remain independent holds.

Slice 390 applies the maintainer-approved Polo E/I glyph-only display offsets:
E `(-0.38,-0.34 cm)` and I `(+0.34,-0.32 cm)` relative to their former
source-centered text positions. The renderer scopes these offsets to Polo;
other recipes retain their existing keyed-letter positions. The 0.22 cm keyed
rings remain centered on the exact same-revision POM anchors, and the key/source/target metadata, source
marks and paths, complete schedule rows, other key positions and paired backs
remain fixed. These translations change annotation glyph placement only; they
do not assert pattern construction or erase a nearby mark. The approval permits
17-option verification, not view release. All Polo faces remain held for the
remaining V02 checks and independent 0.68 cm sleeve residual above the fixed
0.25 cm gate.

Slice 400 maps only the exact same-revision Woven front `Finished placket
width` POM and its `buttonPlacket.top` source edge to the approved keyed W
annotation; the live compiler fails closed on missing, duplicate, or mismatched
identity. Its open 0.22 cm ring stays at the source midpoint, renders after a
colorway fill and beneath source strokes, and only the glyph is translated
`(+0.2121,+0.2121 cm)`. The unchanged full POM row remains below the flat. The
28-option production compiler/renderer/Chromium replay preserves source
path/colorway identity and continuous strokes, and confirms the marker and
schedule. This annotation order does not move, remove, or imply a gap in
construction geometry. The approval and successful marker replay do not accept
any view: all 56 Woven and 34 Polo faces remain held for independent topology,
crossing, assembly, and residual gates.

Slice 406 adds four maintainer-approved Woven front display conventions to the
same revision-bound renderer: a D interval marker at the midpoint of the two
source button marks, pocket foreground over only coincident/overlapping
placket strokes, projected collar over the body shoulder from HPS to its first
intersection, and projected collar over both closure plackets while preserving
button-placket over buttonhole-placket beneath it. The source marks, piece
outlines, stitches, POM data and schedule remain unchanged. The view-only clip
metadata names the exact source decision and role contours; the renderer fails
closed if those same-revision contours are unavailable. Its 28-option replay
preserves all paired back SVGs, but other front intersections and the back
sleeve/band crossing remain. The replay therefore releases none of the 56
Woven or 34 Polo faces and does not satisfy all-seven V02 acceptance.

Slice 425 implements the maintainer-approved Polo H locator as a view-only
segmented ring. Only H changes from a continuous open ring; its same-revision
source anchor, 0.22 cm radius, full POM schedule, glyph and targets stay fixed.
The renderer samples source component paths, circles and point marks, keeps
0.045 cm clearance, drops arcs shorter than 0.04 cm, and fails closed unless
2–3 arcs covering at least half the ring remain. All 17 exact S399 output
revisions replay with 60.28–72.22% ring coverage, preserved source paths and
schedule, and zero sampled post-paint source-stroke contacts. This focused
output test does not bypass the live compiler's independent Polo residual
hold: 0.68 cm remains above 0.25 cm, and no Polo face is accepted. The
maintainer rejected S424's 8.654851 cm bicep reduction and retained the
continuous Woven neckline with its 28 front holds; see
`docs/PROJECT-DECISIONS.md` and the S425 packet.

Tee and Tank share a dedicated body-POM set with exact same-block back
endpoints for chest, body length, across shoulder and neck width. The legacy
`TSHIRT_POMS` set remains front-only for Polo. These anchors can be compiled
against the represented back outline when that complete face is renderable;
they do not permit a partial flat. Tee's unresolved sleeve contour continues
to hold both complete faces.

The drawing keeps centimetre coordinates in its SVG. In the live canvas it fits
to the available width and scrolls vertically, so measured labels stay readable
on the dark app surface. The colorway is a light tint over a white drawing
sheet, which preserves technical line contrast for darker fabric choices. Its
`live-draft` token binds one synchronous screen snapshot; it is not a saved
style revision or outside acceptance record. Sewn-role placement is a digital
assembly aid, not a qualified finished silhouette. It does not establish
sewability, fit, factory readiness, or CAD compatibility. Pattern-linked
side/oblique/inside assembled views remain G09/D04; production tech-pack content
remains G05. Generic DXF and the protected export byte identities stay on their
existing paths. S286 adds source-derived Woven collar shoulder station and
exact zero-depth closed-vent view metadata without changing cut geometry. Its
production Chromium review found crossing/separated front components and
conflicting back sleeve-cap ease placement, so both Woven faces remain held
until source-supported assembly produces a coherent view. S287 confirmed that
the current Woven sleeve-cap stitch only locates an aggregate eased interface;
the authored pattern has no front/back cap split marks or sleeve view-instance
rule, so its faces remain held until those source semantics are defined.
The S295 projection map now also records view-only reflection for the Woven
back-lower and yoke roles from their exact source-declared `onFold` center-back
edges. The authored fold edges are excluded from the exterior contour and the
existing face compiler preserves exact component geometry. This does not alter
cut geometry or release a partial live face: the front pair/placket, sleeve
cap, and collar assembly requirements still withhold both complete Woven views.
S297 adds a separate physical-pair reflection contract for the Woven front:
the physical-role source declares two mirrored separate pieces, and the live
front map validates its exact straight `centerFront` edge on local x=0 with the
draft on one side. This is view metadata, not `Piece.onFold`; the source
coordinates and cut shape stay unchanged. Geometry reflection preserves source
IDs and revision binding, while the complete Woven face remains withheld until
the placket instances/overlap, sleeve-cap split, collar landmark and assembled
output are all supported and reviewed.
S298 changes only how repeated live-flat edge holds are presented: identical
geometry messages from one role are grouped with the complete list of source
edge IDs, while distinct roles, stages, and POM/assembly/overlay issues remain
separate. The live issue records, face holds and accepted SVG output are
unchanged.

S324 adds revision-bound, view-only Woven sleeve-cap segmentation by
transferring the ordered sewn-armhole fraction to the ordered sleeve-cap
arclength. It assigns the front cap prefix/side/hem interval and complementary
back interval without drawing a partition seam, validates the authored band
attachment and fold mark, and puts the yoke on the back-facing seam layer. It
also applies the approved view-only closure convention: the source right
button placket overlays a reflected left buttonhole placket. No pattern
coordinates, cut geometry, source stitch graph, or DXF behavior changes. The
mapping is not accepted at the face level: current production Chromium holds
all 56 Woven face requests across 28 option configurations. Front faces fail
exact colorway-contour closure; back faces fail the solved `Woven sleeve-cap
ease` placement. A geometry-only held candidate lacks solved seam placements
and cannot establish joins, crossings, or final readability. Keep both faces
held until the exact conflicts are resolved and complete rendered output
passes review.

Slice 334 corrects two Woven view-traversal correspondences using the exact
authored interface order: the front `armhole` is traversed in reverse against
`sleeve.capLeft`, and the back `yokeSeam` is traversed in reverse against the
coincident, oppositely directed yoke edge. The revision-bound projection map
validates each exception against the current stitch references and source
endpoints. This changes rigid-placement correspondence only; source stitches,
ease, piece coordinates and cut geometry are unchanged. It does not resolve
the remaining sleeve-cap placement conflicts across the option matrix or the
unclosed front colorway contours, so all 56 Woven faces remain held.

Slice 335 adds exact, revision-bound fill-only view boundaries for Woven's
front sleeve, outer stand, upper and under collars, and reflected buttonhole
placket. The sleeve and collar transfer stations implement already-approved
view conventions; they do not add a physical seam, notch or visible partition.
The buttonhole-placket fill closure uses its source-authored `attachmentRaw`
edge after validating the center-front stitch and approved closure A. These
closures make all five role areas topologically closed at the SVG coordinate
precision across all 28 supported Woven configurations. A closed color area
does not prove a valid assembled join: the live renderer now withholds Woven
front/back output while `Woven sleeve-cap ease` or `Outer stand ↔ woven
neckline` exceeds the existing 0.25 cm residual gate, and preserves the
existing inconsistent-transform hold. The 28-case production replay therefore
continues to emit no Woven SVGs. Source geometry, source stitches, cut roles,
layer order, generic DXF and protected export identities remain unchanged;
Woven V02 is still incomplete.

Slice 343 records the maintainer-approved Woven base-seam display at the
face-mapping boundary: `front.neckline` is the single visible front seam and
`yoke.neckline` the single visible back seam; the duplicate
`outerStand.neckline` stroke is suppressed in assembled technical-flat output
while its source path remains available only as a hidden colorway-fill
boundary. The revision-bound validator accepts this exception only for the
exact `Outer stand ↔ woven neckline` source stitch and its validated front/back
edge mapping. It changes no source stitch, cut geometry, rigid role placement,
or residual tolerance elsewhere. All 56 Woven faces remain held because the
independent sleeve-cap ease residual and solved-placement conflict persist;
the display decision does not accept partial output.

Slice 346 applies the approved normalized-arclength collar exterior closure to
both Woven faces and resolves same-revision exterior POMs against their exact
source roles, edges or button mark. A zero-length side-vent edge remains
table-only rather than receiving a false visible anchor. The full 28-option
production replay now emits 56 SVG candidates, but manual review still rejects
every Woven face: front collar contours remain detached/crossing and long back
strokes cross the torso. Emission and closed fill contours are not proof of a
valid assembly; all Woven faces remain held pending a source-supported view
correction.

Slice 372 applies the maintainer-approved Woven back-flat band detail as a
view-only composition. It removes the assembled-position `sleeveBand` outline
and fold mark from BACK_FLAT, then emits two same-revision source outlines and
`bandFold` marks in side gutters using rigid transforms around the exact
`back.centerBack` axis. The annotation distinguishes the full source stitch
(`sleeveBand.top` to full `sleeve.hem`) from the displayed back receiver interval
`[0, 0.5]` and says the details are not at their assembly location. The source
piece, cut geometry and stitch graph are unchanged, and the front output is
byte-identical in the replayed emitted cases. All 28 back SVGs now include the
details, but the independent mirrored sleeve-cap strokes still cross the back
torso. Woven V02 holds remain; emission of the details is not a passed flat.

S306 adds a narrow assembly contract for the Trouser's single closed
waistband source role. The exact ordered zero-ease waist interface yields
front/back edge intervals and separate rigid placements relative to the sewn
leg panels; the back view therefore does not assign one transform to the
whole strip. Slice 307 consumes these intervals in
`src/render/technical-flat-fragment-compiler.ts`. It clips only authored top
and short-end line edges that correspond to the intervals, composes each
fragment transform with the same-revision panel placement, and emits view-only
boundary paths under the original role and source edge IDs. The sewn lower
edge remains represented by body waist geometry once. The complete Trouser
back flat now renders with its top, side and center-back closure boundaries;
the front remains withheld because its current assembled center-front joins
do not coincide exactly. Band artwork that cannot be clipped to a fragment
interval is explicitly held. This compiler changes technical views only: the
draft, role count, stitch graph, DXF and protected exports remain unchanged.

Slice 326 implements the maintainer-approved Trouser front fly repair in the
pattern source. The separate `flyUnderlap` cut role is 3.5 cm wide and follows
the live `flyLength`; `frontRight.flyEdge` joins its `frontEdge`, then its
`shieldEdge` joins the distinct `flyShield.right`, while `frontLeft.flyEdge`
remains on `flyShield.left`. The front mapping records the approved
`behindRoleId: "frontLeft"` relation and validates it against an earlier
visible role on that face; the underlap remains hidden interior support on
both exterior faces. Its lengthwise grainline follows the existing fly
shield's top-to-bottom source-coordinate convention. A separate maintainer
decision adds a midpoint balance mark to `flyUnderlap.shieldEdge` at `t=0.5`,
using the existing `flyShield.left` midpoint notch as a location convention.
The stitch graph actually joins `flyUnderlap.shieldEdge` to `flyShield.right`,
so this is not a seam-matched notch; both underlap short edges remain unmarked
and their finishing method remains unspecified. This changes the Trouser recipe's
piece list so new DXF output includes the new cut piece, while the DXF writer
and all protected legacy hashes stay unchanged. The assembly graph solves all
24 supported option configurations with upright front panels and the existing
waistband fragments. Current browser output still holds all 24 front views for
the open waistband colorway contour and hip-depth callout collision; the 24
backs render and pass their output checks. No face-level V02 acceptance,
physical construction, fit, factory acceptance or CAD compatibility is
claimed from this implementation.

POM leaders use recipe-declared face anchors and resolve against exact
same-revision view geometry. A back point on a role outline uses that role's
assembled output transform; a mark target names an authored mark and must
resolve to its already-composed emitted entity. The Trouser waistband-depth
POM targets the authored waistband `centerBack` mark alongside the existing
back-rise anchor; its leader marker is emitted at that exact point. The Skirt's
front and back quarter panels are generated by the same `panel(m, position)`
source with the same measurements, so its existing waist and hip POMs anchor
to corresponding vertices on either accepted face. Tank chest, body-length,
across-shoulder and neck-width POMs use exact same-draft back vertices already
represented by their source methods; its front neck-drop remains front-only.
The Skirt length POM has no discrete source point and remains table-only until a
truthful geometry anchor is authored. POM values and tolerances stay with the
existing recipe measures. Missing targets or unreadable placement block the
affected view instead of moving a leader to unrelated geometry.

Each garment has its own rule set (called a **recipe** in the code). It says
which measurements, options, pieces, and construction details to use. A tee
and a skirt use different rules and shapes, but the same app tools display,
check, compare sizes, estimate fabric layout, and export both drafts.

### Measurement-first capture contract (G03/M01)

The versioned `measurement-capture.ts` model records an empty, recipe-specific
session before values are entered. A reading keeps the user's original text,
entered unit, unrounded centimetre conversion, source label, optional method,
capture date and measurer, evidence status, and revision. Presets are separate
readings labeled as digital starting values, never wearer measurements. More
than one reading stays visible and requires an explicit choice; conflicting,
blank, nonnumeric and out-of-guardrail selections block the draft with a
field-specific correction. Values outside a software guardrail are retained,
not silently changed.

The source audit in
`docs/research/epic16/MEASUREMENT-HELP-SOURCE-AUDIT.md` found no accepted
apparel procedure for the current recipe-to-pattern mappings. G03/M01 may
explain each field's reference frame, current use, software limit and unresolved
mapping, but must not invent landmark or posture steps. In particular, the
guided skirt route follows the shared 40–100 cm software control and explains
that the Maxi label's 100–120 cm band is currently unavailable. The capture
record is serializable domain data. Slice 246 adds a garment-stage choice
between guided capture and the existing full editor, with recipe-specific
field meaning, current draft use, software limits, source caveats, raw units,
separate readings, optional provenance details and explicit preset acceptance.
No anatomical steps are shown. Slice 247 stores unfinished sessions and text
drafts in an additive project/style-owned capture store with separate
compare-and-swap revisions. Reading history and raw drafts survive reload
without changing design revisions, field-edit history, or recovery records.
Cross-tab conflicts and failed writes stay visible; failed writes block a
garment switch until a retry succeeds. Capture packages use a strict additive
v4 manifest only when needed, while no-capture package v3 bytes remain stable.
Narrow and desktop browser checks cover the guided route, keyboard activation,
accessible field semantics, and WCAG 2.1 A/AA axe rules. A project created by
the first-run bootstrap does not count as the user's decision to leave Garment.

### Custom one-size materialization (G03/M02)

A completed guided session materializes into a separate custom one-size style;
it does not repurpose the starter style. Creation uses a clean recipe-specific
seed, overlays exactly the selected measurement and option readings, records
their existing provenance, and locks the style to that recipe. Because
SaveFile v6 requires the full shared measurement object, fields outside the
recipe receive the fixed `STANDARD_M` schema-only baseline. They are not
capture observations, are not copied from another style, and are not consumed
by the locked recipe. The source style and capture remain intact; the new style,
initial field history/revision, and a new capture-session identity are saved in
one IndexedDB bundle transaction. Reload and style switching resolve captures
by both style and recipe.

Without an explicitly approved grade plan, a custom one-size style exposes its
step-zero pattern files and a single-column POM specification under the label
“One size”. Whole-run Tech Pack, Projector and Marker outputs, graded specs and
nesting, and their frozen capture entries remain unavailable. Legacy styles
retain their previous output gates and protected byte identities. The Check
view validates the selected draft, omits graded-run checks, and states that
whole-run outputs require an approved plan; it does not imply an XS–XL run. This
is digital customization only; no physical fit or population grade is implied.

### Explicit grade plans (G03/M03)

An approved grade plan is a separate, versioned record authored for one custom
one-size style. It records an identified source or product decision, declared
size range, base size, ordered labels, explicit measurement/control/POM changes
and exceptions. It binds to the project and style identity, locked recipe,
immutable design revision, capture revision and a digest of the base design.
Edits return the record to draft; base changes make it stale and require a
fresh review. Approval records user review of the rule document only. It does
not certify drafted geometry, POM reconciliation, cutting quantities, physical
fit or factory readiness.

The local repository's version 8 migration only creates an empty grade-plan
store keyed by style and recipe; it does not rewrite existing project, style,
capture or export rows. Full project backups use package version 6 only when a
grade plan is present. Earlier package versions and SaveFile versions keep
their existing contents and byte identities. Copy imports rebind a plan to the
new style and revision identities and clear review and approval. A custom style
starts with one-size outputs. Its separately approved, current grade plan can
derive only the explicitly declared sizes from authored changes to the base;
the plan does not infer a population chart or fill unstated increments. Slices
251–252 validate every derived block, supported option, measurement and recipe
guidance, seam and notch declaration, POM, and cutting quantity before enabling
size-specific graded outputs or whole-run Tech Pack, Projector, and Marker
files. A plan-driven export also requires the approved base style to be saved
and current. Applicable POMs require exact equality in
unrounded centimetres. A mismatch blocks its size, and any blocked size blocks
the whole run. An explicit not-applicable POM exception must retain its visible
reason and is not a numeric match. Stale, invalid, unapproved, or concurrently
changed plans fail closed. Frozen whole-run captures include the approved plan
binding and output-integrity metadata. Legacy grading and protected export
bytes remain unchanged. These digital checks do not establish physical fit,
sample approval, or factory readiness.

Pattern pieces are created from measurements and selected options. The app
does not draw a separate, unrelated design for each screen or file. Most areas
show or check the same current draft:

- **Pattern:** Flat outlines of the garment's pieces. Piece names, labels, and
  construction instructions appear in a separate, ordered key beside the
  drawing on wide screens and above it on narrow screens. Different text
  styles distinguish labels from instructions without placing text over the
  pattern shapes. Activate a piece by mouse or keyboard to open its related
  measurement page. When fields span pages, links open the other groups; each
  destination highlights and focuses the related fields without changing their
  values. A piece controlled only by design options explains that instead of
  jumping to an unrelated measurement.
- **Body:** A simplified front, back, or side drawing that shows where
  measurements apply. It is not a body scan or photo.
- **Assembled:** A flat diagram of how the cut pieces relate when joined. It is
  not a three-dimensional cloth simulation.
- **Size run:** Pattern pieces at the sizes supported by that garment. Applying
  size rules to make multiple sizes is often called grading.
- **Spec:** The finished measurements each supported size is expected to have
  and the allowed variation from those targets.
- **Nesting:** A proposed arrangement of pieces within a chosen fabric width;
  this is the fabric-layout estimate.
- **Check:** Digital rules and guidance for the current design. Some issues
  affect Export readiness; not every note blocks it.
- **Edit:** A local semantic pattern editor for named corners and curve
  controls. A committed movement is stored with the active style, checked
  across its registered size run, and consumed by its dependent outputs.

G04 adds a separate versioned technical-flat model in
`src/render/technical-flat.ts`. Each vector entity records a stable identity,
its source class and source revision, semantic layer and feature, and geometry
in centimetres. Front and back views have distinct view kinds. Artwork retains
its placement transform and stack order. A callout must point to geometry in
the same view, and missing construction sources are represented as explicit
notices. This model is the V01 contract; explicit role-to-face mapping is now
recorded for all seven admitted recipes in
`src/render/technical-flat-mapping.ts`. Exact role membership is checked
against each drafted block and supported option endpoints. Stitch visibility
remains unresolved until a drawing rule has source evidence; missing
topstitch/pleat data stays visible as a notice. Live rendered flats are still
in progress. `src/render/technical-flat-transform.ts` provides rigid
translation, rotation and reflection for these primitives; cubic path controls,
authored artwork dimensions, source/revision identity and semantic layers are
preserved. Scaling and invalid or overflowing coordinates are rejected. Its
geometry fixtures preserve drafted edge lengths across all seven default
recipes, but it does not assemble or render the live views. The existing
Assembled view remains schematic and is not used as pattern-derived evidence.
`src/render/technical-flat-geometry.ts` now compiles mapped block outlines,
declared dart legs and construction marks into exact, revision-bound vector
source geometry. Point marks keep their source kind and coordinate without an
assumed symbol radius, while line marks retain their authored label metadata.
The compiled paths stay in their component-local coordinates until later V02
assembly rules place them.
The approved Tee/Fitted sleeve projection now uses a straight-edge arclength
landmark for its hidden hem midpoint, with front and back cap/side/hem runs
bound to the exact draft. A separate maintainer-decision tag authorizes the
second sleeve display instance to reflect across that face's assembled body
center axis. The midpoint emits no seam or visible partition line, and source
piece coordinates remain unchanged. This mapping currently remains held in
production output: default sleeve colorway contours do not close, and the
reviewed changed-measurement draft fails the existing sleeve-cap rigid-placement
length check. These conflicts must pass before the affected faces are accepted.
Slices 321–323 extend the projection contract only where a source fact or
explicit maintainer view decision supports it. The Polo outer stand uses its
authored `backCollar`/`frontCollar` endpoint as the shoulder station. Polo
upper/under collar exteriors and Woven stand/upper/under exteriors transfer the
base or stitched-neckline shoulder fraction onto the live exterior edge by
normalized arclength; the transfer is revision-bound and adds no physical
notch or seam. Cubic intervals are split with exact Bézier subcurves. The
current browser replay checks 17 Polo and 28 Woven configurations. S331 closes
the approved Polo stand and upper/under collar color areas with revision-bound
fill-only boundaries. Rendered review then exposed a separate sleeve contour
crossing the bodice interior, so all 34 Polo front/back requests remain held
with no partial output. The S331 browser replay verifies that hold across all
17 configurations. Woven front sleeve/closure mappings remain unresolved, and
Woven back sleeve-cap placement is inconsistent. The collar metadata alone
does not establish assembled joins, crossings, overlap, POM readability or
accepted faces. See the S321–S331 evidence in `docs/research/epic17/` and the
live handoff in `PROJECT-STATE.md`.
`src/render/technical-flat-options.ts` checks raw recipe-option values before
calling a recipe draft, so invalid user values cannot be hidden by a resolver's
fallback. A valid draft must pass role/stitch/POM and front/back source-geometry
checks before its pair is returned. This is a model gate; live UI rendering and
visible finished-seam rules remain in progress.
`src/render/technical-flat-overlays.ts` maps the current saved artwork placements
and selected fabric color/appearance values onto each face using that draft's
cut frames. Placements retain source, asset and revision identity, dimensions,
transform and stack order. Unknown or interior-only targets fail visibly;
missing artwork assets, out-of-frame placements and overlapping placements
carry actionable review notices. The color/texture/shine data remains
presentation metadata until the later live renderer consumes it; this compiler
does not resolve asset bytes or claim that the fabric appearance is rendered.
`src/render/technical-flat-poms.ts` evaluates each face-specific POM method on
the same draft, requires its anchor to be a real vertex on the mapped role, and
creates revision-bound callouts targeting that face's outline. The existing
back anchors cover Trouser back rise, Skirt waist/hip, and Tank chest,
body-length, across-shoulder and neck-width. Trouser waistband depth targets
its explicit `centerBack` mark. Other front anchors remain front-only and
receive a visible omission notice on the back rather than a guessed mirror.
Methods without an anchor on a face remain table-only there. The first
candidate positions use a provisional
source-space character-width estimate. `technical-flat-svg.ts` then measures every label with the active
browser font and deterministically searches nearby positions using those exact
metrics. It preserves each POM's source anchor and geometry target while
moving only its presentation label and leader endpoint. Text boxes keep a small
gap from other labels, visible vector strokes, artwork placement bounds, and
other POM leaders. Leaders for callouts sharing the same exact source vertex
may meet at that represented vertex; same-ray overlap remains blocked by the
measured label-box check, and leaders from distinct vertices may not cross.
The S363 Woven finished-placket-width leader also fails closed when its straight
route crosses an unrelated projected collar outline (`outerStand`,
`innerStand`, `upperCollar`, or `underCollar`). If the measured search finds no
clear label and leader position, the complete face is withheld; the source
anchor and POM are never moved or suppressed. This check does not resolve the
separate Woven sleeve/band crossing.
When no measured position is available, the complete face remains withheld
with a specific collision issue. The renderer's measured
collision checks and 14-face default browser review are recorded in
`docs/research/epic17/G04-V02-LABEL-REFLOW-S273.md`.

Polo's two approved dimension-only POM references are typed in `Pom.viewDimension`
and resolved by `mapPoloDimensionCallouts` from the same drafted block and
revision as the flat. The pointed-collar leaf measurement references the
authored `upperCollar.centerBack` fold edge by its endpoints without drawing
that fold as a garment edge. The back-hem-drop dimension uses the exact
`front.hem.start` and `back.hem.start` source levels; the front level is
projected onto the back flat as an annotation-only dashed bracket one centimetre
outside the back hem. These are measurement/view references, not construction
marks or a front/back stitch join. The renderer validates the named source
identities, includes the annotation in the view bounds, and keeps both marks on
the annotation layer. Slice 340 records the 17-configuration diagnostic and
production replay. The dimensions do not bypass Polo's held status: all 34
faces remain withheld for the sleeve-cap residual and POM-label conflicts.

`src/render/technical-flat-assembly.ts` derives per-face component placements
from ordered `Block.stitches` interfaces. It partitions each interface at exact
cumulative edge-length boundaries, honors explicit source-edge reversal, and
uses the adjoining roles' matching endpoints to solve rigid rotation and
translation. It preserves drafted curves and dimensions. Hidden mapped
components may provide construction links but are excluded from returned
exterior transforms. A bad/missing interface, unplaced visible role, endpoint
residual over 0.25 cm or contradictory cycle returns an explicit issue. The
sole view-specific residual exception is Polo's exact validated S351
`Sleeve-cap ease` arclength representation: that displayed eased seam does not
use rigid endpoint RMS as its correspondence check. The numeric 0.25 cm gate
remains active for every other relation. This is drafted transform evidence
only; it does not merge a component into a face-specific garment contour by
itself or accept any face.

Slice 345 adds an exact-revision Woven sleeve-cap projection to the live flat
pipeline. `technical-flat-projection.ts` validates the approved ordered body
stitch and maps the authored eased cap to the corresponding body interface by
normalized arclength; `technical-flat-geometry.ts` transfers the display path,
and assembly/live rendering emit the shared seam once while suppressing the
duplicate cap stroke. The back-facing yoke seam uses its approved `SEAM` layer.
This changes only the view: source piece coordinates, cut geometry, stitch
graph, authored ease and generic assembly tolerance remain unchanged. The S345
28-configuration production replay emits front candidates but rendered review
does not accept them because collar strokes cross/overlap and ten front POMs
lack geometry anchors. All backs remain held by three open collar colorway
contours. See `docs/research/epic17/G04-V02-WOVEN-EASED-SEAM-PROJECTION-S345.md`
and `docs/research/epic17/S345-woven-sleeve/manual-review.md`; the projection
does not establish physical fit or complete G04 acceptance.

Slice 362 extends the same revision-bound, view-only projection contract to
Woven `outerStand`, `innerStand`, `upperCollar` and `underCollar`. The map
splits the source collar at its source-length shoulder station, transfers each
side onto the exact same-revision body or reversed yoke neckline, and preserves
signed source-normal offsets and stable source-edge identity. Straight and
curved source paths are sampled before transfer so mapped paths follow the
receiver contour instead of spanning it with endpoint chords. Shared source
endpoints are canonicalized to retain exact joins. The renderer validates the
approved fold-reflection pair and builds each mirrored colorway half as its
own closed contour; one exact shared fold-boundary pair is cancelled only
while assembling the fill path. No pattern coordinates, cut geometry, stitch
graph, option values or export output change. Although all 56 Woven render
requests compile cleanly, all remain held: the max-stand-height placket-width
leader crosses unrelated collar lines, and the rejected S361 sleeve/band
candidate still crosses on the back. The current rigid artwork primitive also
cannot be projected as a complete collar area, so collar-targeted artwork now
fails closed instead of moving only its origin; the S362 replay contains no
collar artwork placement. See
`docs/research/epic17/G04-V02-WOVEN-FULL-COLLAR-PROJECTION-S362.md` and its
retained matrix/render evidence.

Slice 336 records an additional source-order rule in the versioned projection
metadata: Woven's `Outer stand ↔ woven neckline` stitch lists the stand edge
from CF to CB, while the `front.neckline` and `yoke.neckline` edges run from CF
or CB toward their shoulder endpoints. The view reverses the yoke (or fallback
back) neckline traversal so the back interface follows the authored stitch
order; it does not alter the stitch graph or contour. Exact topology validation
checks both stand junctions, body center/shoulder endpoints, role identity and
the permitted reversal. The front shoulder station still misses by about
0.71 cm and the back by about 0.27 cm on the default revision, so all Woven
faces remain held. Approved normalized-arclength collar exterior transfers
remain view conventions and do not create physical notches. See
`docs/research/epic17/G04-V02-WOVEN-PLACEMENT-DIAGNOSIS-S336.md` for the full
configuration trace and current holds.

`src/render/technical-flat-svg.ts` renders a validated semantic view in stable
layer order. SVG width and height use physical centimetres and source geometry
remains unscaled. Every emitted entity carries its source and revision IDs;
artwork source assets that are not embedded receive a visible notice. The
browser measures labels with the same SVG font family and user-unit size used
by the output. The rendered text extents expand the view box; measured reflow
avoids label, visible-stroke, artwork-bound and leader overlap. A face stays
withheld when no collision-free placement exists. Production Chromium renders
and parses eleven of fourteen default faces without label collisions; three
defaults remain withheld by source assembly-cycle issues (Woven-shirt back,
Trouser front and Trouser back), with actionable guidance. Slice 274 exercised
32 recipe-scoped option fields at min/max and retained 146 front/back requests:
70 SVGs passed measured label, notice, revision and POM-anchor checks, while 76
views remained withheld by the existing Woven-shirt and Trouser stitch
placement conflicts. The local overlay trace confirmed same-revision artwork
targeting and colorway fills. Accepted Polo and Woven-shirt component outlines
still cross visually and do not form coherent professional flats. Slice 275
records exact interface subdivision and explicit Trouser waist traversal, but
its 146-face matrix has the same 70 accepted SVGs/76 visible holds as S274.
Full role outlines still appear in both faces, and the Woven-shirt and Trouser
source-cycle holds persist. V02 remains open for face-specific source-to-view
correction and a new rendered exit review. No physical fit, factory acceptance
or CAD compatibility is inferred.

Slice 327 closes the exact Trouser front waistband colorway contour from the
two stitched front-waist subpaths and their source-derived face boundaries,
without drawing a duplicate center-front boundary. Its same-anchor callout
layout rule preserves the exact POM targets while allowing two leaders to meet
at the shared `frontLeft.sideUpper` vertex. Fresh production Chromium accepts
all 48 Trouser faces across 24 configurations; an integrated replay accepts
52/146 faces and retains the prior 94 Tee, Fitted, Polo and Woven holds. The
S327 packet records the output checks and screenshots; this remains digital
view evidence and does not establish physical fit or factory acceptance.
S328 adds decision-bound, fill-only closure metadata for the approved Tee/Fitted
sleeve halves. Production review found their projected side paths inside the
bodice and the mirrored instances overlapping across the center. Those four
faces fail closed with the exact source edge and hold reason until a
body-relative transform passes rendered join and overlap review. The integrated
replay remains 52/146 accepted and 94 held; cut geometry is unchanged.

Slice 276 tested reflecting every non-fold edge of a cut-on-fold role across
its local centre axis, then rejected that output after production screenshots
still showed crossed Polo and Woven-shirt contours. `Piece.onFold` describes
pattern cutting, not finished-face visibility or role-instance count. The
current collar sources also lack explicit exterior-edge landmarks at the
front/back split. Do not use a whole-role mirror or stitch length alone as a
finished-face projection rule. Slice 277 defines the explicit G04-owned
projection-mapping metadata already called for by V01's admitted source-to-view
map. It binds exact edge runs and landmarks to the drafted block/revision,
fails closed when the source cannot support a partition, and leaves pattern
cut geometry unchanged. It must not infer split points from a screenshot.

Slice 278 adds a projection-aware path to the source-geometry compiler. It
emits only validated edge runs, records each contributing source edge while
preserving the role-outline ID used by POM anchors, and withholds a visible
face when any included role has an unresolved edge. Slice 279 connects explicit
recipe maps to the live renderer with same-block/revision validation. Its
production output review rejected all eight emitted defaults as incomplete
half-pattern assemblies with crossing lines; V02 remains open. Polo/Woven
collar contours stay held pending exact source landmarks. The maintainer has
authorized view-only fold-axis reflection only when a source-declared
`onFold` role also has an explicit garment center edge on local `x=0` and its
remaining drafted geometry stays on one side. The reflected SVG keeps source
IDs, avoids duplicating the center edge, and does not mutate the draft. A
construction fold on a component such as the Skirt waistband is not a garment
center axis and is explicitly excluded. Face-specific landmarks or
multiplicity still require direct construction evidence; no instance count is
inferred. Slice 281's source review adds fail-closed projection holds for the
Tee/Fitted sleeve roles and the Skirt waistband on both faces. Ordered sleeve
cap interfaces do not define the exterior front/back contour or sleeve view
instances; the Skirt waistband role spans both waist interfaces and its full
strip cannot be shown on either individual face. These holds leave source
geometry intact and keep misleading partial assemblies out of the live view.
The production Chromium evidence and exact issue text are recorded in
`docs/research/epic17/G04-V02-ASSEMBLY-REVIEW-S281.md`.

Slice 282's source audit found that the Skirt waistband stitch lists front and
back waist in the same authored direction, although both panel edges run
center-to-side. Its ordered boundary therefore maps front-side to back-center
and conflicts with the adjacent side-seam endpoints. Reversing only the
back-waist `EdgeRef` makes the junction agree with both authored side
endpoints; the joined length then lands at the straight waistband seam
midpoint and its exact corresponding top-edge point. Slice 283 reverses only
the back-waist stitch reference and compiles the paired boundary from this
ordered relation on the same live block and revision. Each face receives its
matching band segment, reflected only across that sewn-to body's exact center
axis. The emitted connector is provenance-tagged as a view silhouette
boundary; it does not alter the pattern, notch, seam or export geometry. The
waistband's own short `fold` edge remains excluded as a garment axis. Production
Chromium shows coherent Skirt body/band outlines at three waist/ease
configurations without a continuous center-fold line. Slice 284 re-ran all 73
configurations/146 faces: Tank and Skirt front/back are the only four emitted
views; Tee/Fitted sleeve, Polo/Woven collar, Woven vent and Trouser assembly
faces remain held. Same-revision Tank artwork/colorway overlay passes, but
Woven-shirt button visibility and Polo collar depiction remain unverified.
V02 is not accepted. Slice 285 must check available construction references
for exact missing source landmarks; unsupported roles remain visibly held. See
`docs/research/epic17/G04-V02-FACE-SEGMENT-CONTRACT-S282.md`,
`docs/research/epic17/G04-V02-SOURCE-INTERFACE-SEGMENTS-S283.md` and
`docs/research/epic17/G04-V02-INTEGRATED-OUTPUT-REVIEW-S284.md`.

The **Edit** view keeps user-authored deltas against stable recipe-owned
anchors, rather than saving a disconnected picture. Pointer drags and keyboard
coordinate edits become semantic operations; Undo, Redo, Clear and explicit
Rebase operate on that history. A source measurement or option change makes
the edits stale until the user reviews and rebases them. Invalid edits remain
visible and block dependent outputs, including exports invoked outside the
normal button state. Pattern, POM/spec, size run, nesting, relevant views, tech
pack, projector and cutting files read from the same evaluated size block.

Edit remains a 2D pattern editor for representable corner and curve-control
moves. Topology changes such as dart transfer are not offered as final edits.
The Body and Assembled views remain schematic; this work does not add cloth
simulation or prove physical fit, drape, factory acceptance or CAD round-trip
compatibility. Saved styles now have immutable parent-linked revision
snapshots; the project manager can compare and restore them as new revisions.
Users can freeze and retrieve exact bytes for the seven supported digital
outputs after review and Save. These digests do not assert physical fit or
factory acceptance. See the [Slice 238 cross-output editing evidence](docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md)
and [Slice 239 revision evidence](docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md).

## What the shared tools do

- **Guidance and checks** look for incomplete, implausible, or incompatible
  choices. They keep invalid input visible and explain what to correct instead
  of silently changing it. Issues that affect readiness can block export; not
  every advisory note blocks it.
- **Fabric and stretch choices** affect some drafting advice. They do not make
  the app simulate how cloth drapes on a body or automatically reshape the
  pattern draft.
- **Size run** applies the garment's size rules across its supported sizes.
  The process of making multiple sizes is often called grading; it does not
  mean those sizes have been tested on people.
- **Nesting** estimates how pieces might fit within a chosen fabric width. This
  is a planning estimate—not guaranteed fabric savings or a factory cutting
  plan. “Fabric layout” is another way this guide describes the Nesting view.
- **Artwork placement** records a named print, patch, or colour-block area on a
  pattern piece. Its width and height define the rectangle before uniform
  scaling; X/Y offsets are measured from that piece's cut-box centre; rotation
  is in degrees; and a larger stack-order value draws above a smaller one. An
  optional source/asset reference is provenance text only (such as a creator,
  citation, URL, filename, or asset ID); the app does not fetch a URL from that
  field. A separate local file control can attach PNG, JPEG, WebP, or sanitized
  SVG artwork, which is previewed in the Style panel. The image bytes are kept
  outside the saved-design JSON—in browser-local storage for the web app and
  the app's data folder for the desktop app—while the design stores a stable
  local asset ID and optional source-pixel dimensions. Missing local files can
  be restored or replaced. Both picker and drag/drop imports are validated
  before storage; an unsafe or failed replacement leaves the prior asset
  reference intact. The placement preview still shows only its
  rectangle, not artwork on a garment. Import does not change garment geometry
  or exports. The repository also contains twelve source-verified bundled
  textile and print references: eight from The Met and four from the Cleveland
  Museum of Art. In the Style panel's **Local artwork library**, people can
  search, filter, inspect provenance and technical notes, then attach a stable
  `builtin-met-*` or `builtin-cma-*` reference to a new or existing placement.
  The catalog records each institution's API rights evidence separately: The
  Met's public-domain flag is not conflated with CMA's CC0 status. The preview
  resolves from a build-time local asset URL; it does not use the separate
  user-import store, and museum addresses are attribution text rather than
  runtime requests. Per-use suitability guidance is advisory. The collection
  is a small V1 reference set: museum photographs and paper studies are not
  necessarily clean artwork or seamless production tiles.
- **Exports** use the same pattern data. SVG and DXF are outline files used by
  pattern and drawing programs; their lines and curves stay crisp when resized.
  A tiled PDF splits a full-size pattern across regular printer pages; an A0
  PDF uses A0-sized pages, a large standard paper size. A projector file has
  layers to project the pattern at full size onto fabric. The draft Tech Pack
  PDF gives each pattern piece its own labeled, independently scaled overview
  cell; the overview is not to scale and must not be used to cut fabric. The
  PDF also includes calculated size measurements, recipe material/construction
  notes, and a blank fit-record sheet. Long labels and instructions wrap or
  paginate. It is a draft reference, not a finished technical-flat set,
  factory-approved specification, or production release. None of these files
  proves physical fit or successful sewing.

The existing DXF download remains the protected legacy output: its coordinates
use centimeters but the file does not declare units. `exportDxfCentimeters`
is a separate, non-default serialization candidate that adds a centimeter
header and writes coordinates to six decimal places so serialization error
stays well below the fixed `0.001 cm` exchange contour gate. When recipe mark
rules are supplied, it additionally writes resolved notch ticks and
double-ended grainline marks as `MARK_NOTCH` and `MARK_GRAINLINE` entities.
The protected legacy `exportDxf` remains at its existing three-decimal
precision and its recorded byte identities are unchanged. The candidate is
not wired to the UI or selected as an apparel-CAD profile; no receiver
compatibility is claimed.
G04 V03 now uses a named, version-specific **empirical compatibility profile**
for an already installed receiver instead of requiring the receiver to belong
to an “industrial CAD” category. A pass is limited to the exact measured
application/version/workflow and remains subject to all-seven, geometry,
identity, marks, units, repeatability, malformed-input, and readable-output
gates. This label is not ANSI/AAMA/ASTM conformance or factory acceptance.
LibreCAD 2.2.1.5/DXF 2000 is only a candidate from the single Polo M evidence
in S708/S710. The opt-in candidate/package remains separate from and cannot
change legacy `exportDxf` bytes. Current status and bounded checks are in
`PROJECT-STATE.md` and the S722 packet.
`createDxfInterchangePackage` produces a separate versioned JSON manifest for
recipe/piece roles, selected size and grade, options, stitch relationships,
and explicit centimeter units verified against `$INSUNITS=5`. Its SHA-256
binds the exact DXF and canonical manifest revision. It is a C04-bounded
companion record, not an importer or receiver-preservation proof; the DXF
remains the source of CUT/SEW geometry and visible construction marks.
Package creation resolves and validates every declared recipe option, records
defaults as well as supplied values, and hashes that complete option set.
Canonical pattern-block comparison follows JSON object serialization by
omitting optional `undefined` fields. This lets valid option configurations
such as Woven zero-vent produce a source package; it does not prove that a
receiver preserves those values or that the exchange profile passes V03.
The version-3 package manifest also records every source pattern mark's stable
piece-scoped ID, source name/label, kind, DXF entity type/layer, source-space
geometry and one-based entity position in the exact digest-bound drawing. It
declares `adaptive-normal-offset/1`, which adaptively samples the mathematical
allowance offset for this candidate only and includes that algorithm identity
in the canonical package revision. It retains the existing 1 cm recipe
allowance and sew geometry; the source pattern and legacy DXF writer are
unchanged. The version-2 package remains verifiable for existing artifacts.
The visible DXF mark is still required; this companion record identifies it
but does not replace it or prove that a receiver retains either file. See the
S693 and S697 evidence packets for rendered comparison and the fixed-coverage
results. S697 measured maximum coordinate-rounding displacement of
`0.000000703 cm` for the six-decimal candidate, down from `0.000701219 cm` at
three decimals; this addresses source precision only and does not resolve the
measured receiver geometry/mark failures or qualify a receiver/profile.

The project also keeps reference export files. Tests compare new exports with
those references so a change to one view or tool does not silently alter
unrelated files.

## Where information is saved

The browser and desktop versions run on the person's own device. The browser
version stores saved design, recovery, and tour progress with that site's local
data; clearing the site's data can remove them. Imported artwork bytes are kept
separately in the browser's IndexedDB site data. The desktop version stores
those records and imported artwork in the app's local data folder. Neither
version has a user account, hosted database, or cloud workspace.

When someone exports in a browser, the browser handles the download. The
desktop app asks where to save each export and writes that selected file. It
also keeps a small local record of the window size. The app does not scan other
files on the computer; an artwork file is read only after the person chooses or
drops it for import, and its stored copy stays in the app's local data.

The **Control Center** is a separate project-delivery board for the project
maintainer—the person who decides scope and approvals. It is not an account
role inside InfiniDrip, and it does not store user profiles or garment designs.
The board is available only on the same computer and stores its current state
in `ops/control-center/data/board.json`. Both its dashboard and command-line
tool use the same checks before saving. The command-line interface lets
maintainers edit an epic description, transition epic status, link work items,
and attach epic-level evidence through validated commands. The closed Epic 13 groups the nine
completed pre-garment phases but does not approve a garment direction.
“Evidence” means a linked commit, test result, document, or other record that
supports a work item's status.

The future G01–G17 goals are numbered Epic 14–30 in the board. Each has a
numbered Epic record and a matching work card, so the dashboard shows both the
Epic number and its G goal. EPIC-14/G01 is closed with accepted C01/C02/C05/C06
evidence, C03/C04 contracts, a readable draft-pack remediation, and a verified
final review. Its exit report lists every A-01–A-12 disposition and future
gate. This closure does not claim factory readiness, fit, CAD interoperability,
3D simulation, or marketplace service. The conditional shorts packet E remains
held in Epic 20. A maintainer-only
rename command updates dependent work-item links and leaves an audit note;
past evidence text is not rewritten. Planning records do not start product
work or change the app's local-first boundary.

After that verified closure, the maintainer admitted EPIC-15/G02 for a local,
versioned style foundation. Slices 229–234 completed F01: a shared IndexedDB
project/style repository, non-destructive SaveFile migration, per-style
recovery, user-led project/style workflow, and versioned portable package
import/export with referenced artwork. The narrow Electron restart proofs and
the browser/Electron package validation are recorded in the S230–S234 reports;
they do not establish permanent browser storage or physical fit. F01 is Done
with hash-verified evidence. F02 Slices 235–236 add C03-aligned field
definitions and per-style append-only value observations, plus a tested
dependency/recomputation map covering all 85 inputs across the seven current
recipes. The map distinguishes pattern/spec/grade/nesting/views/exports,
mark-only woven controls, surface-art export independence, and the woven-hem
and tank-shoulder propagation gaps. A changed field shows which outputs rebuild;
the active view redraws immediately, while other views and exports regenerate
when opened. The rendered Chromium save/reload proof, output comparisons,
complete matrix and residual risks are recorded in
[`docs/research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md`](docs/research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md).
F02 and F03 are complete. PR #11 merged the reviewed Slice 240 tree to
`origin/main` at `e5155e82dbd21cda5b3f537b950eb4c32a22d215`; Slice 241 verified
the S204/S205/S240 ancestry and closed EPIC-15 at Control Center revision 315.
EPIC-16/G03 is admitted; M01 and M02 are complete. M03's Slice 251 output
integration passed its gates, then independent review required the Slice 252
per-size validation and saved-base export remediation before final review.
Slice 253 is the G03 final review and merge exit; Slice 254 addresses its
independent-audit follow-ups. Loaded revision state is restored before
workspace selectors resynchronize, and an unsaved target-style edit invalidates
plan-driven output just like an unsaved artwork edit. Single/Marker is a
preview scope whose selection does not dirty a style or create undo/recovery
state; its workspace preference is persisted by explicit Save. Because that
setting is currently stored in the style revision, saving a changed preference
can make a bound grade plan stale and require refresh/review/approval again.
Custom one-size styles normalize the preview scope to Single when loaded, since
Marker is unavailable without an approved graded run. This is fail-safe but
means the Marker preview preference is not restored for that style. Exact raw
POM equality remains required without tolerance. See
`docs/research/epic16/S254-G03-AUDIT-CORRECTIONS.md` and
`docs/research/epic16/S256-LOAD-STATE-AND-REVIEW-HANDOFF.md`. EPIC-17 through
EPIC-30 remain Backlog. This digital work
does not establish physical fit, drape, factory
acceptance, supplier readiness, or production readiness.
Slice 237 is now complete: it adds the semantic-anchor operation model,
per-size geometry/stitch/recipe/POM guards, explicit rebase/conflict/undo rules,
and an accessible warning for invalid edits in the still-exploratory Edit
preview. That preview remains outside saved styles and exports; a rendered
Chromium check confirmed the parametric SVG stayed byte-identical before and
after an invalid preview. Slice 238 now connects semantic operations to each
style's SaveFile, recovery and portable package; checks every registered size;
and routes pattern, POM/spec, nesting, relevant views, tech pack, projector and
cutting outputs through the same evaluated geometry. It also resolves woven
hem-turn cutting allowances and makes the tank shoulder-width/strap-width
boundary explicit. The full 1,781-test repository suite passed with 100%
statement, branch, function and line coverage. A production-built Chromium and
Electron proof verified six changed Tee outputs, style isolation, Save/reload,
pending-recovery restart, stale-source blocking and explicit rebase. A second
rendered Woven-shirt trace changed all six exports after a 1 cm→2 cm hem-turn
change and again after a semantic curve edit; the retained screenshot and
hashes cover both steps. The
controlled process-exit proof is not a power-loss or operating-system crash
test; none of this establishes physical fit or factory acceptance. Slice 239
adds immutable revisions, compare/restore-as-new-child and frozen manifests
with exact output bytes. Production-built Chromium and Electron Tee and
Woven-shirt traces confirmed that saved successors do not change earlier
revision or output hashes, and that historical SVG bytes can be retrieved
after profile relaunch. Slice 240 passed the full-repository 100% coverage and
build gates, protected export identities, browser/Electron package restore and
restart, the fresh Tee/Woven-shirt revision replay, and 320/390/1440 px
responsive/Axe checks. The review corrected an invalid `NaN` value rendered by
an empty optional numeric control; non-finite values now render blank and keep
their explicit empty state. The package verifier now creates artwork through
the UI and checks that its saved design matches the immutable revision head.
The evidence-linked final report is
[`docs/release/EPIC-15-G02-FINAL-REVIEW-S240.md`](docs/release/EPIC-15-G02-FINAL-REVIEW-S240.md).
The S240 review and post-merge closure records are
[`docs/release/EPIC-15-G02-FINAL-REVIEW-S240.md`](docs/release/EPIC-15-G02-FINAL-REVIEW-S240.md)
and
[`docs/release/EPIC-15-G02-MERGE-EXIT-S241.md`](docs/release/EPIC-15-G02-MERGE-EXIT-S241.md).
The S238
contract and hashes are in
[`docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md`](docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md).
Slice 239's contract, rendered verification, exact artifact digests and limits
are in
[`docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md`](docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md)
and [`docs/research/epic15/evidence/S239-rendered-verification.json`](docs/research/epic15/evidence/S239-rendered-verification.json).
The semantic model and Slice 237 preview limits are in
[`docs/research/epic15/F03-CONSTRAINED-EDIT-S237.md`](docs/research/epic15/F03-CONSTRAINED-EDIT-S237.md)
and its acceptance evidence is in
[`docs/research/epic15/F03-SLICE-237-EXIT.md`](docs/research/epic15/F03-SLICE-237-EXIT.md).
The detailed G02 packet and gates are in
[`docs/planning/EPIC-15-ADMISSION.md`](docs/planning/EPIC-15-ADMISSION.md).
The Slice 230 contract is at
[`docs/research/epic15/F01-STORAGE-CONTRACT-S230.md`](docs/research/epic15/F01-STORAGE-CONTRACT-S230.md).
Slice 231 adds strict versioned project/style/recovery records and a pure
SaveFile v1–v5 conversion. Slice 232 implements the IndexedDB repository,
revision-checked atomic writes, style switching, recovery, and non-destructive
legacy migration; Electron 44.1.0 / Chromium 152.0.7977.65 passed a real
restart-and-app-file-path-change proof. Slice 233 connects that repository to
application startup, Save/Load, per-style recovery, and an accessible local
project/style manager. The app fails closed with a retryable startup error if
storage or migration fails rather than mounting editing controls over
replacement defaults. Slice 234 adds strict portable package import/export,
collision-safe ID/artwork remapping, staged artwork verification, atomic
record commit, failure rollback, and a browser/Electron restart proof. It
documents its memory ceiling and does not claim bounded-memory streaming,
permanent browser storage, or broader durability. Details are in
[`docs/research/epic15/F01-TRANSACTIONAL-REPOSITORY-S232.md`](docs/research/epic15/F01-TRANSACTIONAL-REPOSITORY-S232.md) and
[`docs/research/epic15/F01-PROJECT-STYLE-WORKFLOW-S233.md`](docs/research/epic15/F01-PROJECT-STYLE-WORKFLOW-S233.md), plus
[`docs/research/epic15/F01-PACKAGE-EXPORT-IMPORT-S234.md`](docs/research/epic15/F01-PACKAGE-EXPORT-IMPORT-S234.md).
Slice 235's field-definition, migration, history, UI and verification record is
in [`docs/research/epic15/F02-FIELD-PROVENANCE-S235.md`](docs/research/epic15/F02-FIELD-PROVENANCE-S235.md).
This work remains deterministic and user-led and does not open new garment,
physical sampling, supplier, paid-service, or production-readiness scope.

## Epic 8: a small helper test, not a clone

Epic 8 tested whether a separate helper could suggest a pattern-piece
arrangement that might use less fabric. It was a bounded helper experiment,
not a clone or fork of another product. The helper could only suggest
placements; InfiniDrip would still own the garment shapes and check whether a
suggestion was safe.

Epic 8 is complete as a no-go decision: the build could not be reproduced
offline and the safety checks could not be verified. The repository keeps
records of the experiment and why it stopped, but no helper is integrated into
or run by the app. The existing Nesting view remains in use. Any retry needs
fresh maintainer approval and must keep the app's own checks and return to the
existing layout if the helper cannot offer a safe result. See the
[Epic 8 exit report](docs/release/EPIC-8-EXIT-REPORT.md).

## G04 technical-flat presentation

The seven supported pattern recipes can render front and back technical flats from one live pattern revision. The renderer preserves source piece/entity identity and coordinates, maps declared construction through revision-bound view metadata, places colorway fills in the declared layer order, and binds POM callouts to same-face source geometry. Unsupported source features and table-only POMs are reported as notices rather than invented. A zoomable canvas supports close inspection of dense construction schedules. S459 reviewed 73 supported configurations and 146 views; it accepted digital V02 output only. It does not establish physical sewing, fit, factory acceptance, or industrial CAD interoperability. CAD receiver/profile rights and round-trip proof remain V03 work; the generic legacy DXF contract remains protected.

The opt-in C04 DXF interchange package writes one named BLOCK/INSERT per
pattern role. Its versioned manifest binds the block name, role, source
revision, and piece-scoped construction marks; expanding the blocks reproduces
the flat drawing without changing its geometry. This does not alter the
protected legacy DXF export. In the single measured CLO 2026.1.310 return,
nine piece names survived with a receiver suffix, while five CUT contours and
three buttonhole points still exceeded the fixed acceptance checks. The
package structure therefore improves source-side identity but does not claim
that CLO or any industrial CAD profile passes G04 V03. See
[`docs/research/epic17/S700-named-piece-package/S700-exit-packet.md`](docs/research/epic17/S700-named-piece-package/S700-exit-packet.md).

S710 adds a separate returned-file audit that checks receiver-rewritten named
blocks against the unchanged schema-v5 source manifest while preserving the
original package's exact-byte hash contract. It checks returned piece and
instance identities, planar INSERT placement, centimeter units, CUT/SEW
vertex sequences, closure, mark layers and entities at the fixed 0.001 cm
limit. A LibreCAD 2.2.1.5 return of the existing Polo M fixture passes with
nine pieces, 18 outlines, 111 mark entities and zero measured XY difference.
The audit checks normalized vertices, per-vertex curve bulges and widths, plus
outline elevation and extrusion; it tolerates identical duplicate vertices
removed by the receiver. It accepts zero Z scale because it does not alter the
flat XY geometry, while rejecting translation, rotation, in-plane scaling and
repeated instances. This is one generic-CAD fixture and a source-side verifier
result; it does not qualify the receiver profile or establish broad exchange
behavior.

S716 exposes that package writer and auditor in the Export panel. Users can
save the opt-in schema-v5 DXF and its integrity-bound JSON package, then select
the JSON package and a returned DXF for a local, accessible pass/fail result.
The files are read in the app and are not uploaded or persisted by this audit
flow. This is a generic package and source-side audit surface; it makes no
receiver or standards claim and does not change the protected legacy DXF path.

S707 adds explicit R2000 layer-table declarations to that opt-in package.
LibreCAD 2.2.1.5 retained the table but saved all nine CUT outline entities on
layer `0` in its Polo M round trip. S708 adds deterministic R2000 block-record
ownership/space records, the referenced continuous linetype, and HANDSEED to
the candidate-only writer. On the same LibreCAD 2.2.1.5 DXF 2000 route and
fixture, the return now preserves all nine CUT assignments, named-piece
identities, 18 outline paths, 111 typed marks, and centimeter units; the
reopened drawing was visually reviewed. This is empirical one-fixture evidence
for the combined source correction, not a formal conformance claim or an
industrial-apparel profile qualification. The legacy DXF contract remains
unchanged and V03 acceptance remains open. See
[`docs/research/epic17/S708-cut-layer-source-audit/S708-exit-packet.md`](docs/research/epic17/S708-cut-layer-source-audit/S708-exit-packet.md)
and the historical [`S707 result`](docs/research/epic17/S707-candidate-layer-table/S707-exit-packet.md).

S725 verified 365/365 source packages for the 73 supported option scenarios
across five sizes and corrected only the opt-in Trouser page gap (5 cm); other
recipes and legacy DXF remain at 2 cm. Source and returned geometry have no
inter-piece intersections. Its LibreCAD return passes at 0.000 cm for nine
pieces, 18 outlines, and 103 marks, and the ten selected fixtures were visually
reviewed. S726 then completed V03 technical acceptance: the ten LibreCAD
2.2.1.5 / Drawing Exchange DXF 2000 fixtures cover all ten serialized
exchange-structure classes, and a saved/reopened Trouser XL grade-boundary
fixture also passes. All 11 selected returns pass at 0.000 cm and were visibly
reviewed. Product-side source verification covers all 365 option × grade
packages; the matrix's 315 normalized shape signatures are not described as
315 receiver round trips. The compatibility claim is limited to the exact 11
fixtures. No standards, industrial-apparel, fit, factory, or production claim
is made. See
[`docs/research/epic17/S726-source-class-and-profile-evidence/S726-exit-packet.md`](docs/research/epic17/S726-source-class-and-profile-evidence/S726-exit-packet.md).

## What is outside the current product

Accounts, profiles, a hosted database, cloud sync, monitoring, email, and
loading artwork from the internet are outside the local app. Any paid or hosted
work stays on hold until the maintainer explicitly approves starting launch
work. Research or planning alone does not add a garment; no new garment family
starts until the nine local-only preparation phases are complete and the
maintainer approves the next garment queue.

No garment has yet been cut, sewn, and fit-tested. Digital checks catch only
the issues they are programmed to check; a physical sample is needed to learn
how a garment behaves in fabric on a person. No fit result is claimed here.

## UIQ-03 and UIQ-04 material clarity

UIQ-03 is merged and deployed in the existing collapsed **Design readiness**
disclosure behind embedded `uiq_guidance`; when disabled, the exact former
readiness checklist remains. The presentation reads caller-owned journey,
readiness, blocker, and note state; fit intent appears only after explicit
Style review. It does not change journey navigation, correction, validation,
saved data, patterns, or export decisions. Its final release proof is
`docs/release/UIQ-03-S738-FINAL-CLOSEOUT.md`.

UIQ-04 material clarity is admitted under
`docs/planning/UIQ-04-INTEGRATION-ADMISSION.md`. It adds the accepted native
read-only material/appearance panel in a collapsed disclosure beside existing
material and appearance controls, visible only during Fit when those controls
are available, behind embedded `uiq_material`. Flag-off,
unknown, or stale retains the exact existing app shell. The panel reuses the
current selected fabric, existing ease guidance, color, and appearance values;
compatibility remains explicitly unknown. Review buttons focus existing
controls without changing them. This is not drape simulation, compatibility
validation, or physical-fit evidence. UIQ-04 is complete: PR #26 merged as
`956c5c5dd1eee83aca9153f759c21c693843b095`, main deployment run 38185891574
passed, both public preview URLs passed live browser checks, and the canonical
board is Done at revision 4394. Full S739 and S740 proof is in
`docs/release/UIQ-04-INTEGRATION-S739-EXIT.md`,
`docs/release/UIQ-04-INTEGRATION-S740-CLOSEOUT.md`, and the linked scoped
evidence. UIQ-05 is now separately admitted as a presentation redesign of the
existing Surface artwork library, not a second catalog. It uses the accepted
native candidate only behind embedded `uiq_artwork`; the original catalog,
rights/assessment data, local-only assets and separate stage/apply actions
remain authoritative. Flag-off/unknown/stale must render the exact legacy
presentation. The active admission and gates are
`docs/planning/UIQ-05-INTEGRATION-ADMISSION.md` and
`docs/planning/UIQ-05-GOAL.md`. Slice 741's pre-merge implementation is in
Review; its exit report and machine evidence are
`docs/release/UIQ-05-INTEGRATION-S741-EXIT.md` and
`docs/research/uiq05/evidence/S741-verification.json`. No other UIQ package or
artwork expansion is admitted. UIQ-07's isolated welcome visual is now
separately admitted for current-main integration into only the existing
first-run tutorial welcome. Its embedded `uiq_welcome` flag preserves the exact
pre-integration view when disabled; existing tutorial actions, local progress,
page heading hierarchy, physical-fit caveat and UIQ-02 foundation remain
authoritative. It is not a login/account-entry flow. The integration shipped
through PR #36 and automatic deployment, with both stable and immutable public
URLs verified and UIQ-07 closed Done at board revision 4464. Slice 755's exact
scope and pre-merge evidence are `docs/release/UIQ-07-INTEGRATION-S755-EXIT.md`
and `docs/research/uiq07-integration/evidence/S755-verification.json`; Slice
756's deployment, live-browser and board proof are in
`docs/release/UIQ-07-INTEGRATION-S756-CLOSEOUT.md` and
`docs/research/uiq07-integration/evidence/S756-public-verification.json`.

## Where to find current project information

Start with the [README](README.md) for the product overview and local setup.
For current work and approved scope, see [Project state](PROJECT-STATE.md),
[Project decisions](docs/PROJECT-DECISIONS.md), and the
[nine-phase local work plan](docs/planning/PRE-GARMENT-EXECUTION.md). The
[Control Center guide](ops/control-center/README.md) explains the separate
maintainer board. The [architecture history](docs/archive/ARCHITECTURE-HISTORY.md)
is old background, not the current system description.
