# InfiniDrip — Architecture

How the app fits together, in plain language. Read the top to re-orient; skim the
layers when you need detail. Updated every slice with only need-to-know changes.

## Open-source integration boundary — 2026-09-17 audit

External repositories do not become architectural authority merely because a
license permits reuse. `GarmentRecipe -> Component/Interface/Stitch -> Block`
remains the owned drafting seam, and the completed grammar is not replaced by
OpenPattern, GarmentCode, FreeSewing, or a Python/3D runtime. External code may
enter only through a narrow adapter whose failure cannot corrupt drafting,
guidance, persistence, or existing exports.

The approved research boundaries are:

- accessibility automation may run only in the test harness and supplements
  manual keyboard/focus/zoom/viewport review;
- property generation and geometry oracles remain test-only, seeded/bounded,
  and cannot become alternate pattern truth;
- any future irregular-nesting solver receives owned flattened loops and
  constraints, returns seed plus transforms, and is followed by InfiniDrip's
  own overlap/boundary/grain/fold/nap/quantity validation. The current shelf
  packer remains the deterministic fallback;
- external garment grammars may motivate optional typed metadata only when a
  real recipe consumes it. Current recipes and legacy export bytes must remain
  unchanged;
- no awesome list, topic tag, dataset license, model weight, body asset, or
  transitive dependency inherits the top-level repository's license by
  implication.

The detailed license/evidence/pressure-test record is
`docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md`. These boundaries add no current
runtime dependency and do not change the Slice 119B -> 120 -> 121 sequence.

## Current workspace redesign boundary — Epic 5 / Slice 121 final checkpoint

The current beginner-facing workspace uses five actual stages: Garment,
Measure, Style, Check, and Export. Stage completion is readiness-derived, not
index-derived: `styleReviewed` is set only on Style → Next, the current Check
review is required, and the true Export gate is shared by the desktop menu and
export buttons. Measurement, material, option, and target edits invalidate
review and file confirmation; export size, nesting scope, fabric width, and
color edits invalidate file confirmation. A delayed old desktop write cannot
confirm a newer revision.

Measure exposes body/length groups and Style exposes ease/options groups.
Correction routes reveal the named stage/group and focus its field; navigation
restores focus on the current stage. More views retains all seven views and
supports Escape, outside-click, and selection focus. Skip introduction does not
complete readiness. Journey persistence is v2 with legacy v1 acceptance, and
historical `exported` resets on load. The selected-garment header, named Style
combobox, and local rail containment fix are within this UI boundary. Garment
selection is a descriptive seven-card library with upper/lower-body grouping.
Fit intent and material choices are card presentations backed by the existing
native selects. Untouched garment changes use the garment-family material
default; an explicit material choice persists across garment changes and
remains subject to compatibility guidance. Stage changes reset the bounded
inspector to the new context.
Appearance is a contextual Style control, not a drafting input. Its compact
palette opens a hue/saturation wheel, exact Hex/native color entry, lightness,
four screen texture cues, and shine. The optional appearance save extension
defaults to the legacy smooth cue when absent. `applyAppearanceToSvg` decorates
only the assembled preview; pattern, nesting, and export consumers continue to
receive the original color and geometry contracts.

Slice 118 makes target semantics explicit across upper, skirt, and trouser
assembled silhouettes by adding render-only `data-edge="ease"` metadata. Body or
Pattern lenses with no direct target remain undimmed and expose a one-click route
to the assembled lens. Field-backed warnings with visible targets render as
translucent, collision-aware notes with arrows to the actual SVG target. Notes
are screen-only; Ignore applies to the current draft, the panel and Check can
restore it, and any design change clears the dismissal. A cleared warning
removes its note automatically; dismissed advice remains a mild Check-stage
reconsideration cue.

The persistent workspace boundary now tracks `outputRevision` against a
`savedRevision` baseline. A successful Save marks the current revision clean.
Load validates the existing local snapshot before either applying it directly
when clean or opening a modal replacement decision when dirty. Keep editing and
Escape preserve the current draft and restore the initiating control's focus;
accepting the replacement runs the existing synchronized restore path and marks
that loaded revision clean. This is orchestration around the existing v5
payload, not a schema change.

Slice 119B adds a separate `patternworks_recovery_v1` envelope for unfinished
local drafts. It retains raw invalid strings, offers explicit Recover/Discard
choices, and keeps recovered invalid work paused so the existing Save, drafting,
and export validity contracts cannot be bypassed. The `beforeunload` guard
protects dirty browser work. A bounded 30-snapshot UI history powers visible
Undo/Redo and keyboard shortcuts while leaving native text, textarea, select,
and contenteditable editing untouched. History is a UI editing aid, not a
second geometry or persistence truth. Spatial guidance overflow counts all
additional warnings when the active lens cannot display every note, including
warnings without a direct target.

Slice 120 makes the Check-to-Export boundary explicit in the UI layer. The
selected-size picker appears before the output actions and drives only the four
selected-size files plus Single size nesting; each format carries visible
purpose/scope metadata and an accessible description. Tech Pack and Projector
remain whole graded-run outputs. The existing button IDs and export writers are
the stable integration seam, so format copy and layout do not create a second
export path.

The Single size nesting renderer now obtains its block from `draftAtSize` with
the active export step. The graded marker continues to use `gradedMarker` for
all sizes. The selected-size label and canvas are synchronized on picker change;
the nesting change does not alter drafting geometry, export bytes, or legacy
baselines.

Slice 121 closes the Epic 5 UI boundary with a structural accessibility audit.
The inspection section and its scrollable viewport now have distinct landmark
names, and the current appearance chip uses an explicit image role for its
screen-only color label. The dev-only `axe-core` audit covers the welcome,
Measure, Style, Assembled, Check, Export, More Views, and dirty Load states;
jsdom's layout-dependent color contrast rule is excluded there and is reviewed
in the live browser matrix. These semantics do not alter geometry, drafting,
persistence, or export consumers.

No drafting geometry, export writers, or export baselines changed. The
workspace save payload gained an optional appearance extension with a legacy
default. Slice 119B is committed as `bd08991`; focused history/persistence/view
checks passed 106/106, the spatial geometry fallback passed 1/1, TypeScript and
diff checks passed, and live rendered recovery plus Undo/Redo evidence was
inspected. Slice 119A focused checks recorded UI app/view 157/157, clean TypeScript,
and live rendered dirty-load protection at the desktop viewport. Slice 118
focused checks recorded UI app/view 156/156 before the final placement
refinement, targeted app 2/2 afterward, renderer contracts 55/55,
and clean TypeScript/diff checks. Slice 117 affected focused verification passes
201/201 across
`app.test.ts`, `appearance.test.ts`, `persist.test.ts`, and `view.test.ts`;
`npx tsc --noEmit` is clean. The prior
Slice 115B checkpoint passed 207/207 across the five affected UI test files.
Live browser verification
covered all seven garments through the five stages and all seven analysis
views through the reversible Assembled lens. Responsive checks at
1280/900/700/560/390×844 found no page overflow; narrow inspector and
field-to-canvas focus behavior remained usable, and More views passed Escape
and outside-click checks. Slice 116 live checks rendered the seven garment,
four fit, and five material cards; default Woven shirt material was Cotton
woven without a warning, while an explicit Cotton jersey selection surfaced
the compatibility warning. Slice 117 live checks entered a custom Hex color,
selected the wheel with pointer and keyboard, enabled Fine weave and 60% shine,
and kept the editor visible beside the body canvas; the assembled preview
contained the expected texture and sheen definitions. Screenshots were inline
only, not durable artifacts.
Epic 5 / Slice 121 is now the final redesign gate: 85 test files / 1,102 tests
pass, coverage is 100% across statements/branches/functions/lines, TypeScript
and production build pass, parsed consumers and all eight legacy hashes pass,
and the rendered/live seven-garment plus responsive matrix is recorded in the
Epic 5 exit report. This remains digital evidence only; physical fit, sewn
validation and production readiness are deferred.

## Epic 6 surface design — completed Slices 122–130

Epic 6 is complete and merged to `origin/main`. Surface design is an additive
layer above existing pattern pieces: it owns artwork placement, preview,
optional save/recovery state, print-sheet output, tech-pack placement
specification, and warn-only invalid-entry guidance. It does not modify
drafting, grading, POM checks, nesting, cutting writers, or export gating.
Empty artwork preserves the eight legacy export hashes. The shipped preview and
print sheet are artwork-space, true-scale digital outputs; they are not drape,
fit, sewability, manufacturing, or production-readiness simulations.

The final Slice 130 mounted-app audit covers all seven recipes and one style's
artwork through the panel, preview, print sheet, tech pack, save/load,
warning dismissal/reappearance, role correction, measured bounds/resolution/
coverage guidance, and responsive widths. The digital anchor is a true-scale
cut-box-centre contract for warn-only guidance; it does not clip or reposition
artwork on the garment. On-piece clipping, embroidery machine formats, 3D/VTO,
signing, packaging, and physical validation remain out of scope.

### Epic 6 foundation checkpoint — Slices 122–125 (historical)

Surface design is an additive layer above existing pattern pieces. The current
foundation has no app wiring and therefore cannot change drafting, grading,
checks, nesting, persistence, tech-pack output, cutting files, or legacy export
bytes. `src/surface/placement.ts` owns plain placement data and actionable
validation; `src/surface/transform.ts` owns true-scale rectangle corners,
bounding boxes, overlap measurement, and effective-resolution measurement;
`src/render/surface-overlay.ts` serializes supplied polygons into an escaped,
z-ordered SVG group. The overlay test consumes `artworkCorners` directly so the
headless math and renderer have a checked integration seam.

Placement validation reports invalid input rather than clamping it. Effective
resolution rejects non-finite or non-positive pixel/geometry values and returns
unknown for unratable input. Piece clipping remains deferred; Slice 130's
guidance adds measured warn-only checks without changing the flat placement
visualization; it is not a drape, fit, sewability, or production-readiness
simulation.

Slice 126 wires that foundation into the app without widening its authority.
`src/surface/store.ts` owns the per-garment/style book (sizes never enter the
key), raw-preserving parsing, index-addressed edits, and lazy problem lists;
`PlacementTransform` is the single canonical transform type across model, math,
and UI. Persistence carries artwork as an optional save/recovery section with
no format-version bump: absent means empty, malformed in a current file is
rejected, and raw invalid values survive round-trips for lazy validation. The
Style panel hosts add/edit/remove with the shared numeric controls, rails, and
steppers; rows are addressed by position so duplicate or hostile ids cannot
drift; unplaceable entries are listed with their error and skipped by the
true-scale artwork-space preview. Surface state never reaches drafting,
grading, checks, nesting, export gating, or cutting-file writers.

Slice 127 adds the output boundary, still without touching geometry. The
tech-pack writer appends an artwork-placement page only for non-empty sets, so
empty artwork leaves the four-page document byte-identical. The new
`src/export/surface-sheet.ts` renders one style's artwork at true scale with
the locked 10 cm calibration square; unplaceable entries are named with their
error, never silently dropped. A Current-style-artwork export scope carries
the opt-in Print sheet button, disabled with an artwork reason while the
style is empty. Artwork-space centimetres are the print specification and
piece association is by role name — no on-piece anchor is invented. Cutting
files never include placement, with or without artwork in state.

Slice 128 reports invalid placements through the shared guidance panel
without widening its authority. `src/guidance/surface-notes.ts` owns the
pure validity-to-note mapping with control-resolution keys; the app appends
those notes beside (never inside) the geometry guidance, routes surface
fields to the fit step for correction, and reuses dismissal, persistence,
and reappearance behavior unchanged. Panel rows carry the same Set-aside
affordance canvas spatial cues offer, because artwork warnings have no
canvas target to anchor a cue to. Slice 130 extends this mapping with
true-scale cut-box frames, optional source dimensions, and deterministic
warn-only bounds, resolution-floor, and coverage notes; it does not widen
surface authority into drafting or export gating.

Slices 126–130 are now integrated and pushed after Codex review. The shared
architecture still keeps surface state outside drafting, grading, checks,
nesting, export gating, and cutting-file writers: native surface text/number
edits commit on focusout without replacing the active control, selects commit
on change, and steppers use a private surface-step event. The mounted-app exit
audit covers direct entry, invalid placement recovery, persistence, style
isolation, all seven garments, assembled preview, print sheet, tech pack,
surface warnings and correction focus, and responsive widths
1280/900/700/560/390. No physical-fit, manufacturing, or
production-readiness claim is implied.

Slice 130 adds `src/surface/piece-frames.ts`, which owns the digital anchor
contract: per-role true-scale cut frames at base size, artwork corners centred
on the piece-box centre plus placement offset, containment checks, area ratios,
and source-dimension resolution. These values are measured from the live draft,
never stored. `src/guidance/surface-notes.ts` adds bounds, resolution-floor
(59 px/cm), and full-coverage (ratio >= 1) warnings beside validity notes,
with control-resolution keys for Review focus. Source pixel dimensions remain
optional persisted fields; absent means unratable, never a failure. No
save-format version change or export gating change was introduced.

The 2026-09-21 post-merge audit preserves that optional-field contract at the
UI boundary: clearing a source-dimension control removes the field instead of
creating `NaN`. Review focus chooses `dy` when only the artwork centre is
vertically out of frame and chooses the lower-resolution source axis when the
resolution warning is asymmetric. These are guidance/input repairs only; the
surface layer remains warn-only and additive.

Slice 130 closes the Epic with the completed guidance boundary after Slice
129's cross-garment exit audit. One style's artwork is exercised end to end on
all seven garments through the real mounted app; the surface architecture
remains additive and the boundary statements above stand as the shipped
contract.

### Prior Slice 115A presentation notes

The newly authorized UI/UX work is research/audit-first. The implemented
seven-recipe grammar and `GarmentRecipe` → composed `Block` → consumer boundary
remain unchanged. `docs/planning/UX-REDESIGN-EXECUTION.md` defines Epic 5 and
Slices 114–121;
`docs/research/UX-REDESIGN-RESEARCH.md` records actual defects and source evidence.

The planned presentation boundary is a stable analytical canvas with a
reversible Assembled mode, task-stage navigation and a bounded grouped inspector.
Tour familiarity must be separate from design readiness. Guidance targets must
come from real render metadata; no-target cases must not dim the whole figure,
and Side remains explicitly schematic. Appearance controls will be render-only;
workspace recovery must not weaken numeric, geometry or export validity.
Slice 115A implements a viewport-height CSS studio with a bounded inspector.
Measurement pages derive from body/finished roles and recipe option groups;
inputs remain mounted while page visibility changes, and guidance reveals the
target page before focus. No measurement value is silently modified by grouping.
The shared inspection frame contains mutually exclusive analysis/assembled
hosts. The lens swaps zoom/scroll context without changing the selected view,
Body projection or transient Edit snapshot; Edit drag is blocked in Assembled.
Highlight matching is per host and leaves unmatched figures undimmed.
Workspace actions live in the persistent header, independent of export controls.

Stage navigation/readiness, richer selectors, spatial notes and workspace
recovery remain planned. The old journey chips still require replacement in
Slice 115. This checkpoint is not a full-gate pass. Drafting, export writers,
save schemas and all legacy baselines remain untouched.

## Previous Epic 3 boundary — Slice 104

The pre-Epic 3 checkout and BUGFIX/FC-01 exit are verified on the actual
`main` branch. The first trouser is a separate reusable relaxed casual
straight-leg woven recipe. Its durable research and contract live in
`docs/research/garments/TROUSER-RESEARCH.md`; the slice-by-slice execution and
exit gate live in `docs/planning/EPIC-3-EXECUTION.md`.

Slice 94 established the research-only boundary. The future lower-body contract adds
explicit body `crotchDepth`, `thigh`, and `knee` measurements plus a finished
`inseam`, while preserving the existing upper-body meaning of `length`. The
trouser recipe owns numeric front/back rise ease, waistband depth, thigh/knee
ease, leg opening, fly, and pocket controls. The draft will own four explicit
front/back leg roles, a separate full waistband, a simple fly shield, and
paired pocket bags; it will not silently reuse skirt, top, or render-only
geometry.

The lower-body body-vs-finished distinction, raw invalid-input behavior,
recipe-owned option persistence, size grading, named interfaces, and generic
output consumers remain shared architecture. Exact crotch curves, fly/pocket
outlines, and allowance values are implementation decisions for Slices 96–98
and must be recorded/tested before use. Digital geometry/checks are not fit or
physical validation; surface design remains a later independent Epic.

Slice 95 implements the shared lower-body data contract without registering a
garment. `Measurements` now carries explicit sitting `crotchDepth`, body
`thigh`/`knee`, and finished `inseam` fields; `length` retains its upper-body
meaning. `trouser-contract.ts` owns the recipe's numeric rise, waistband,
leg-fit, fly, and pocket option definitions and preserves finite invalid live
values for guidance. The save format is v5, with v4 accepted as a legacy
source whose missing lower-body fields default from `STANDARD_M`; existing
garment drafts and export bytes remain untouched. The full checkpoint is 74
test files / 969 tests at 100% coverage with typecheck/build, parsed outputs,
and unchanged legacy hashes.

Slice 96 adds the reusable `draftTrouserLegs()` geometry without registering a
recipe or changing an existing writer. Four off-fold roles (`frontLeft`,
`frontRight`, `backLeft`, `backRight`) use quartered finished station widths;
the side and inner-leg paths are shared for exact seam matching, while named
front/back cubic crotch curves end at independently derived rise references.
The live draft exposes waist, seat, hip depth, thigh, knee, inseam, leg opening,
rise, grain, and crease changes through real edges/marks. Focused tests pass
7/7 plus typecheck; waistband, fly, pocket, UI, and full output integration
remain later slices.

Slice 97 adds the explicit lower-body component boundary without registering a
recipe. `trouserWaistband` drafts one full off-fold strip whose lower edge
matches the four live leg waist edges; `trouserFly` drafts a fixed-width shield
whose two attachment edges match live front-fly line marks. The composed block
keeps the leg seams and adds named waistband/fly stitches, button/buttonhole,
center, and fold marks. The skirt waistband remains untouched and is not a
silent substitute. Focused leg/component tests pass 12/12 plus typecheck;
pockets, recipe/UI, and output integration remain later slices.

Slice 98 completes the minimal pocket/sewability boundary without registering
the recipe. `trouserPocket` creates paired off-fold quadrilateral bags whose
`opening` edges exactly match live `pocketOpening` marks on the mirrored front
panels; `draftTrouserWithPockets()` adds the two real pocket stitches to the
existing eight seams. The pocket angle, opening, drop, and bag depth are
recipe-owned numeric controls; pocket-specific guidance reports range and
front-panel/rise/knee/hem violations without clamping. The V1
`TROUSER_ALLOWANCES` map and `TROUSER_NOTCHES` table cover all eight roles, and
focused tests render/resolve the actual marks and grainlines. Focused
trouser tests pass 21/21 plus typecheck; recipe/UI, full output integration,
and live browser verification remain later slices.

Slice 99 completes the trouser-wide guidance and table boundary without
registering the recipe. `trouserGuidance()` owns actionable no-clamp checks for
body ordering, rise/waistband/fly reach, positive dimensions, straight-leg
progression, and pocket placement. `TROUSER_GRADE`/`TROUSER_SIZES` redraft the
shared XS–XL run; `TROUSER_POMS` reads finished and body-reference values from
the assembled block; and `TROUSER_TECH_PACK` names the four-panel body,
waistband, fly/fastening, and paired-bag operations. Focused tests pass 27/27
across the trouser contract and geometry/table suites, with the full digital
coverage gate at 100% across all four metrics. Recipe/UI and live browser
integration were the next boundary at that point.

Slice 100 registers `TROUSER` as the first-class lower-body recipe. The recipe
owns the complete fields/options/style/draft/check/guidance/grade/POM/notch/
allowance/tech-pack contract and declares `lower` plus the `frontLeft` Edit
role; the optional region/edit-role fallback preserves legacy recipe objects.
Generic Pattern, Size run, Spec, Nesting, Check, Guidance, persistence, and
export routing now see the trouser through the shared recipe/block contracts.
Trouser Body front/back/pair, Side, and assembled presentation consume the
actual live four-panel/component block, so the renderer is not a second source
of geometry. Side remains a labelled schematic drafting envelope, and Edit
remains transient preview-only. The Slice 100 checkpoint passes 79 test files /
1,007 tests, 100% coverage across all four metrics, typecheck, and production
build. Parsed trouser output and live responsive browser review remain Slices
101–102; no physical-fit or production-readiness assertion is implied.

Slice 101 proves the registered recipe against actual output consumers. The
generic SVG, DXF, tiled PDF, A0 PDF, projector, marker, and tech-pack writers
remain the shared output spine. The recipe explicitly opts into page-local
tiled-PDF coordinates and whole-piece multi-page A0 overflow because the
L-size trouser's actual nest exceeds one A0 sheet; the default paths for
legacy recipes are unchanged, preserving the eight export hashes. The parsed
artifact evidence is 16 SVG polygons, 16 DXF polylines, 80 tiled pages, 8 A0
pages with in-bounds coordinates, 5 projector layers / 80 polygons, and a
4-page tech pack. A0 fold/no-notch/oversize branches and tiled page placement
are directly tested; rendered A0, tiled, and tech-pack pages were inspected
from the generated evidence files. Full `npm test` and `npm run coverage` pass
at 80 files / 1,013 tests and 100% across statements/branches/functions/lines;
TypeScript and production build pass. Live responsive browser audit remains
Slice 102; no physical-fit or production-readiness assertion is implied.

Slice 102 completes the live application audit without changing the shared
contract or writer boundary. The actual in-app browser exercised the valid
Trouser through Pattern, Body front/back/side/pair, assembled preview, Size
run, Spec, Nesting, Check, Edit, Guidance, persistence, and all six export
buttons. Body mutations changed finished geometry; invalid pocket values and
an in-range pocket-bag/short-inseam combination remained visible and produced
actionable, field-linked guidance rather than clamping. All six existing
garments passed live Pattern/Body/Spec/Check spot checks. Page-level responsive
checks at 1280/900/700/560/390 reported no horizontal overflow, while the
inspection surface remained its own scroll/layout concern. Slice 103 then
passed the final code, parsed-output, legacy-hash, and rendered-evidence gate
and recorded the durable Epic 3 exit report checkpoint. No physical-fit or
production-readiness assertion is implied.

Slice 104 adds the shared numeric editing primitive used by measurements,
recipe options, nesting fabric width, and exploratory Edit coordinates. The
editable number is flanked by explicit minus/plus actions with bounded
click/hold repetition. Its Boundary Rail exposes exact declared endpoints and
the current valid position; under/over/empty states remain visible without
silently rewriting manual input. Open-ended Edit coordinates show `−∞` and
`+∞` endpoints. This is presentation and interaction glue only: drafting,
grading, persistence, and all export writers remain unchanged.

The Slice 104 final gate passed on the actual branch: all 80 test files / 1,021
tests pass, coverage is 100% across statements/branches/functions/lines,
TypeScript and the 92-module production build pass, the parsed output
consumers and all eight legacy hashes pass, and the live cross-garment control
audit is clean. Source commits are `d391cdc` (shared implementation) and
`ae9701b` (final delegation-path coverage). The durable exit record is in
`docs/planning/EPIC-3-EXECUTION.md`; no physical-fit or production-readiness
assertion is implied.

Epic 4 current boundary — Slice 109

Epic 4 is confirmed as Component Architecture and Garment Grammar. The
component foundation (`Component`, `Interface`, `Stitch`, ordered assembly,
structural drafting helpers, and render-only croquis) is now adopted behind the
existing `GarmentRecipe`/`Block` seam. `src/drafting/grammar.ts` supplies the
typed dependency graph: node-owned parameter resolvers run in dependency order,
components expose named edge/mark interfaces, and composition validates final
stitch references before returning the assembled `Block`. All seven current
recipes — Tee, Fitted tee, Tank, Polo, Woven shirt, Skirt, and Trouser — now
declare a grammar and route their public draft through it. The downstream
engine still receives only the composed `Block`; no consumer owns a second
geometry source. One bounded user-facing composition proof uses the existing
Tee/Fitted selector, with no full configurator or new garment family.

The migration preserves the staged component/helper APIs where they remain
public or tested. Structural reuse is deliberately concrete: bodice/panels,
sleeves, neckline/collar/stand, plackets, bands, waistband, pocket, dart, vent,
and hem helpers are reused only where the current garments have real
consumers. Croquis and Side remain presentation-only and are not imported by
drafting. The final downstream, live, parsed-output, and Epic 4 exit evidence is
tracked in `docs/planning/EPIC-4-EXECUTION.md`.

Desktop Release is a separate platform boundary. Its observed Electron
architecture and remaining signed/offline packaging work are recorded in
`docs/research/DESKTOP-RELEASE-RESEARCH.md`; the shell hardening in `electron/`
does not alter drafting, exports, or the composed `Block` contract.

### Post-Epic-6 execution boundary — EPIC 7, EPIC 9, and EPIC 10

The durable execution packets are `docs/planning/EPIC-7-EXECUTION.md`,
`docs/planning/EPIC-9-EXECUTION.md`, and
`docs/planning/EPIC-10-EXECUTION.md`. EPIC 9 may harden the Electron shell,
native-save boundary, menu/window lifecycle, and developer-only packaged
verification, but it must continue to consume the existing export and
persistence contracts. Offline packaged evidence is host/package-specific;
signing, updater feeds, installers, and cross-OS claims remain outside the
architecture until separately authorized and evidenced.

The current EPIC 9 evidence is recorded in
`docs/release/EPIC-9-EXIT-REPORT.md`: the supported result is a Windows x64
unpacked package with native-save and menu/window checks. The package is not
signed, and no installer, update feed, or other operating-system result is
implied. Release verification is a developer harness boundary; it does not
become a second export or persistence implementation.

EPIC 10's property generators, fixtures, and `@flatten-js/core` comparisons
are test-only. They inspect existing flattened geometry and serialization
contracts; they are not alternate drafting truth and cannot enter production
imports. The oracle exposed a real concave seam-allowance offset loop in the
default trouser back and one extreme woven-shirt input. Codex repaired that
specific production defect with a local crossing-loop trim in
`src/render/allowance.ts`; it is not a replacement geometry engine, and all
eight legacy hashes remain unchanged. The repair is covered by ordinary
permanent assertions and a focused allowance regression test.

The integrated quality boundary now includes bounded seeded properties for
surface placement, invalid guidance, deterministic persistence and old-save
compatibility, finite/deterministic geometry across all seven recipes, and
empty-placement export identity. The evidence is recorded in
`docs/release/EPIC-10-EXIT-REPORT.md`. All parsed outputs, truthful
invalid-state behavior, and the prohibition on physical-fit or
production-readiness claims remain standing invariants.

Epic 7 is the completed additive Nesting Intelligence Pack, contributed in an
isolated OpenCode workstream and integrated through Codex at `db14b63`. It
derives waste percentage, buffered planned
length, optional fabric-on-hand fit/shortage, and a truthful directional-print
notice around `nestPieces`, but it may not alter drafted geometry, shelf-pack
placement truth, grainline behavior, export writers, or legacy hashes. The
buffer is 10% by default with a 0–50% editable range. Difficulty ratings,
Sparrow/irregular nesting, rotation/interlocking, physical validation, and
production claims remain outside this Epic. Codex owned review, merge and push.

Slice 132 delivers the pure planning layer as `src/export/nesting-intelligence.ts`:
buffer validation and planned-length math, waste share from utilization, an
optional fabric-on-hand fits/short-by verdict that stays unknown for blank or
invalid input, and the truthful no-rotation nap notice. Unratable input yields
null, never a fabricated number. `nestPieces` placement truth, geometry, grain
rules, exports, and save schemas are untouched by this slice.

Slice 133 wires those metrics into the fabric view without widening engine
authority. Planning controls (buffer with shared rail/steppers, optional
on-hand length, directional checkbox) and live readouts (required, planned,
waste %, on-hand state, fits/short-by-X, nap notice) live in a stable panel
that draw() syncs imperatively, reusing the generic rail/stepper machinery.
Save/recovery carry an optional additive section with no version bump;
invalid inputs stay visible with field-linked warn-only guidance and never
pause the draft or gate exports. Planning state is global like fabric width;
single-size versus marker scope stays truthful per draw.

Slice 134 closes the Epic with a seven-garment exit audit and a release
report, adding no product behavior beyond the audit itself. The planning
layer, panel, persistence, and guidance boundaries above stand as the
shipped contract; parsed output consumers and legacy hashes are verified
with planning state present.

### Epic 8 proof-only boundary — true-shape nesting no-go

Epic 8's Slice 162 proof contract and Slice 163 artifact/legal/worker packet
are complete, but no solver runtime is admitted. The execution packet is
`docs/planning/EPIC-8-EXECUTION.md`; the research record is
`docs/research/NESTING-REDESIGN-RESEARCH.md`; the admission records are
`docs/research/EPIC-8-SLICE-162-ADMISSION.md` and
`docs/research/EPIC-8-SLICE-163-ADMISSION.md`; the final exit record is
`docs/release/EPIC-8-EXIT-REPORT.md`. The additive
`nesting-proof-contract.ts` represents only an explicit single-material,
non-fold, non-mirrored, finite-loop subset and rejects unknown facts.

The InfiniDrip-owned evidence captures exact Sparrow/Jagua/Sparrow Studio
revisions, a locked Cargo graph, full transitive notices, source/license
hashes, build flags and MPL-2.0 obligations. Admission still fails because no
offline vendor/source-replacement build, pinned `wasm-pack`, generated WASM
hashes, local Rust replay, hard memory/watchdog proof, runtime message
validation, deterministic replay or unconditional shelf-result adapter exists.
This is a durable proof-only/no-go boundary, not a license rejection.

InfiniDrip remains authoritative for cut/sew loops, piece identity, marks,
folds, quantities, grain, nap, mirrored pairs, clearance, bounds and overlap.
The adapter must reject unknown or unsupported apparel semantics rather than
silently rotate, unfold, duplicate, omit or clamp them. Candidate transforms
are applied to the original typed loops and revalidated by owned code; timeout,
malformed output, cancellation, license/artifact failure or any validation
failure returns the deterministic shelf result visibly. The current packer is
the default and unconditional fallback.

The current proof leaves UI, persistence, writers, Electron packaging and
legacy bytes untouched. A later re-open would need a new maintainer-authorized
packet closing every failed gate before any adapter, worker, validator,
benchmark or opt-in mode is implemented. This boundary does not claim physical
fit, production-marker quality, sewability or guaranteed material savings.

### Epic 11 implementation boundary — Polo V2 fidelity

The binding research and execution records are
`docs/research/garments/POLO-V2-RESEARCH.md` and
`docs/planning/EPIC-11-EXECUTION.md`. Epic 7 is merged and reviewed, so that
gate is satisfied. Slices 155–161 now wire the shaped collar/stand,
placket-base marks, vent topology, dropped back hem, POMs, actionable
guidance, front/back previews, option metadata, persistence compatibility and
report construction details into Polo. Slice 160 closes the downstream
cross-size, surface, nesting and export pressure matrix. Slice 161 records the
reviewed exit evidence in `docs/release/EPIC-11-EXIT-REPORT.md`. Epic 11 never
changes the nesting estimator or planning-state semantics.

Polo V2 remains the existing `polo` recipe and the ordinary composed `Block`
pipeline. Its redesign replaces the V1 rectangular stand/collar with shaped
curves derived from each size's actual front/back neckline interfaces. One pure
geometry contract must provide lower/upper stand seams, collar bases and
CB/shoulder/CF landmarks to both drafting and front/back schematic rendering.
The stand lower seam must equal the body neckline; the collar bases must equal
the measured stand upper seam. Endpoint spans are never accepted as arc-length
proof.

The Slice 155 contract consumes the real front/back neckline `Edge` values,
returns measured lower/upper stand paths and equal collar bases, and records
CB/shoulder/CF landmarks on every path. Slice 156 maps those paths into the
four physical cut-on-fold stand/collar roles and uses multi-edge interfaces
for the real front/back and upper-stand seams. Slice 157 adds the two diagonal
placket-base clips and named reinforcement line. Slice 158 keeps the Polo
lower-body transform local to `polo.ts`: zero vent/zero drop returns the
original bodice topology; nonzero vents end the sewn `side` edge at aligned
`ventTop` marks, add an open `vent` edge with its own allowance, and move only
the back hem by `backHemDrop`. Finite invalid combinations remain visible
through issue records and guidance; non-finite source geometry has no
fabricated fallback. Slice 159 maps the same pure collar facts into front/back
Body and assembled schematics, keeps optional croquis presentation fields inert
for other garments, and routes all eight option owners through UI, persistence
and guidance without changing the save version or export writers.

Slice 160 verifies the complete V2 option matrix across XS/M/XL, boundary and
crossed-risk inputs, recovery and undo/redo, narrow/wide marker determinism,
surface placement, and every output consumer. The Polo recipe uses the
existing whole-piece A0 overflow writer when true-scale pieces cannot fit one
portrait sheet; this is recipe-scoped and does not alter `nestPieces`, the
Epic 7 planning contract or protected legacy bytes. Option-aware tech-pack
construction text and guidance now follow the live vent/drop topology. No
physical-fit or production-readiness claim is implied.

### Epic 12 platform boundary — public web and delivery governance

Epic 12 begins with a provider-independent execution contract in
`docs/planning/EPIC-12-EXECUTION.md` and the threat/data record in
`docs/research/WEB-PLATFORM-THREAT-MODEL.md`. The current Vite/Electron app
remains local-first: drafting, guidance, persistence and exports work without
login or network. No provider SDK, account, cloud schema, deployment alias or
feature-flag fetch is present. Slices 172–174 add only repository-local
operations artifacts; they do not change the product runtime or authorize
external mutation.

The repository-local Control Center under `ops/control-center/` is a separate,
read-only operations surface. Its versioned board schema, validator, evidence
importer and dashboard record work-item state without guessing missing history;
contributors can submit review, but only an independent reviewer can close an
item. The `ops/web/` manifest utility records a sorted SHA-256 inventory of a
Vite `dist/` directory. These artifacts are provider-neutral and are never a
source of drafting, persistence or authorization truth.

The approved interim friend/family preview is a static exception to the
provider-independent planning gate: only the built `dist/` artifact may be
served from Cloudflare Pages Free, with `noindex, nofollow, noarchive` in the
HTML and URL-only access. It remains local-first; browser storage is the only
user-data store, and the preview must not add auth, cloud sync, telemetry,
email, measurement egress or a database. The repository-side noindex hardening
is recorded on `origin/main` at `ae1afe8`. The first successful automated
direct-upload deployment is recorded in
`docs/release/WEB-PREVIEW-DEPLOYMENT.md` for `main` commit `6ac4edd`; the
stable share URL is `https://infinidrip-preview.pages.dev/` and the immutable
evidence URL is `https://9160f7f6.infinidrip-preview.pages.dev`. The verified
`.github/workflows/pages-deployment.yml` workflow runs the full gates on every
`main` push (or manual dispatch) and uploads only the resulting `dist/`
artifact. Its Cloudflare token is CI-only in protected GitHub secrets and is
never application runtime state or repository content; the current user-owned
token expires 2027-03-20 and must be rotated before expiry. A failed workflow
does not replace the last healthy production artifact.

Slice 174's provider-independent identity/cloud contract is recorded in
`docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md`. It defines owner-only
workspaces, separate profile/identity rows, explicit sync consent, append-only
revision/idempotency semantics, deny-by-default RLS/grants, expand/migrate/
contract sequencing, and export/deletion/backup-retention behavior. This is a
design boundary only: no provider SDK, SQL migration, login UI, account or
personal-data collection is present. Local persistence remains usable if
identity, cloud sync or flags are unavailable.

Slice 175's admission audit is recorded in
`docs/planning/EPIC-12-SLICE-175-ADMISSION.md`. Its welcome/login/profile shell
is blocked until the maintainer records the required jurisdiction, privacy,
consent, retention, auth/session, data-region, subprocessor, RLS and support
decisions. No UI, provider SDK, SQL/RLS migration or personal-data flow may be
inferred while that gate is open; provider-neutral fixtures and local evidence
remain the only authorized continuation.

The future web layer is additive. A static immutable Vite artifact may be
served publicly without changing drafting or export truth. Auth/profile/cloud
workspace data are separate owner-scoped records with deny-by-default RLS and
opt-in, conflict-safe sync; they never replace the local save path. Body
measurements and pattern/workspace contents are not telemetry. Feature flags
control reversible UI/behavior rollout only and never authorization, invalid
state suppression or physical-fit claims.

Blue and Green are immutable production deployment aliases pointing at the
same approved artifact lineage, not long-lived divergent branches. Preview and
staging are separate; production aliases share a transition-safe production
database. Promotion, rollback, code freeze, migration and evidence rules are
defined in the Epic 12 packet. Any future hosted or auth implementation must
preserve the existing full coverage, parsed-output and export-byte identity
gates and receive a separate provider/cost/privacy approval before collecting
personal data.

The Epic 11 exit gate is complete. The six Slice 155–160 commits and the
current output evidence are summarized in the durable exit report, and the
reviewed handoff is pushed to `origin/main` at `3057c6c`; no physical
validation, material-performance, sewability or production claim follows from
the digital pipeline.

The nine physical Polo roles remain unchanged. The front retains its on-fold
slit and named placket attachment interfaces; V2 adds the internal
`placketBaseClipLeft`, `placketBaseClipRight` and
`placketBaseReinforcement` marks derived from the existing 1 cm attachment
allowance rather than an exterior centre-front seam or extra piece. The body
side edge becomes a sewn interface ending at aligned
vent-top marks, followed by open vent edges. Only the back hem extends by the
selected drop. Zero vent depth restores the uninterrupted V1 side/hem topology
instead of emitting zero-length edges.

Four recipe-owned numeric options extend the existing recipe-option map
(introduced in save v3 and carried by the current v5 format) without a
save-version bump: `standFrontRise`, `collarPointExtension`,
`sideVentDepth`, and `backHemDrop`. Invalid combinations remain verbatim and
visible to actionable guidance. Sleeve-rib negative ease and upper-collar
turn-of-cloth remain outside the draft until material stretch/recovery is an
explicit geometry input or physical evidence supports a bounded contract.
Grading continues to re-draft from each size's measurements; no second manual
point-grade system is introduced.

### Slices 149–154 completed research boundary — next garment families

`docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md` defines a documentation-only
dependency audit for casual shorts, joggers, cut-and-sew sweatshirt/pullover
hoodie, and jeans. No new recipe, draft input, component or persistence field is
architecturally accepted merely because it appears in a research packet.

The research classification is: reuse unchanged, parameterized derivative, new
component contract, new engine input, or physical unknown. Existing block reuse
must be construction-correct for the target garment and every curved interface
must be validated by its real seam path, not endpoint span. Material stretch,
recovery, rib reduction, elastic behavior, denim shrinkage and hardware bulk
remain explicit inputs/unknowns; research must not replace them with universal
fixed values.

Claude's two isolated files did not own architecture. Codex reviewed them and
reconciled all findings in
`docs/planning/GARMENT-EXPANSION-SYNTHESIS.md`. No garment implementation is
authorized by the research wave. Epic 11 implementation remains Slices
155–161; its Epic 7 gate is now satisfied.

The accepted cross-family seam is a ratio-aware stretch-to-fit interface for
explicit user-owned band/cuff lengths. It reports actual opening and band path
lengths and their ratio; it does not reuse absolute-centimetre `Stitch.ease`,
derive geometry from nominal stretch, or assert recovery. Automatic material
geometry, new ankle/head body fields, a save bump and universal elastic/rib/
shrinkage constants are deferred.

Shorts require a lower-body upper-block result with separate trouser and short
continuations so the anatomical knee is never relocated. Joggers use the same
lower-body foundation but own their pull-on waist and pocket containment.
Sweatshirt P0 requires real neck/cuff/hem bands; its hood addition changes the
body neckline and walks its live seam. Rigid jeans reuse only the base lower-
body balance and require new yoke, pocket, fly and waistband components.

Multi-material garments expose a current truth boundary: `nestPieces` accepts
one width and all pieces. Their execution packets must add role/material
grouping with separate estimates or leave secondary-material yardage explicitly
unknown; they may not call a combined main/rib/lining nest a truthful bolt.

Epic 3 is closed at the integrated straight-leg trouser plus shared numeric
editing boundary. Shorts and joggers remain documented derivatives only;
surface design, physical validation, and production-readiness work are outside
this boundary. The actual branch and all exact gate evidence are recorded in
`docs/planning/EPIC-3-EXECUTION.md`.

BF-P1-02: the UI's current design verdict combines input validity, all recipe/
plausibility guidance and geometric checks. Check, Style, journey and all six
export handlers share this gate; failed geometric checks also reach Guidance.
Geometry-only reports/writers remain stable. Finished totals update in place,
and status copy identifies digital checks without physical/production claims.

BF-P1-03: current persistence stores intentional workspace state alongside
measurements, color and recipe options: garment, style, stretch material, view,
Body projection, export size, fabric width and nesting scope. `FIELDS` and
`inputError` are the shared edit/save/load contract; invalid current saves are
rejected with an actionable message. Exploratory Edit geometry remains transient.

BF-P1-04: export completion is an explicit state transition. Electron marks the
journey exported only after `saveFile` confirms a write; cancel, rejection and
browser-start failures remain incomplete with actionable status. Input, recipe,
option, material, fit-target, size and nesting changes invalidate prior output.

BF-P1-05: the woven assembled preview renders both front and back detail groups
from the woven option contract. Front closure/collar/pocket/button geometry,
back yoke, sleeve-band cue, curved hem and side vent cues remain tied to their
live options; the renderer remains unchanged for non-woven calls.

BF-P1-06: the shell uses responsive grid/flex breakpoints. At narrow widths the
controls, workspace and inspection columns stack, toggle/export rows wrap, and
SVG previews stay within the available width without horizontal overflow.

BF-P1-01: measurement inputs retain raw numeric values; empty/nonfinite fields
are explicit incomplete UI states. `inputError` checks declared field/option
bounds and the app pauses drawing and export with associated corrections until
inputs are valid. Ease accepts -30 through 30 without clamping. Drafting and
export writers are unchanged. See `docs/planning/BUGFIX-P1-EXECUTION.md`.

BF-P2-01: the main canvas is owned by a bounded inspection section with a
keyboard-reachable viewport and local Fit/Zoom controls. SVG aspect ratios are
preserved while portrait drawings are capped and centered; component-heavy
linear layouts shelf-wrap so woven pieces keep readable labels. Body exposes a
combined Front + Back view plus single Front/Back focus and an explicitly
schematic Side view. The extra Body focus choices are included in the existing
version-4 workspace payload; export writers remain unchanged.

BF-P2-02: the assembled garment is rendered in its own titled, collapsible
secondary preview section, separate from the active analytical canvas. Recipe
option metadata can declare a construction group, display unit, and concise
feature/correction help; controls render those declarations as grouped
fieldsets without changing the underlying numeric option state.

BF-P2-03: option spotlighting is a presentation link, not a generic dimmer.
Woven assembled details expose a real marker for every option, and the UI
searches both analytical and assembled SVG surfaces before fading anything.
Material/stretch selection is separately named from Color; a knit material on
the woven-shirt recipe remains user-selected but raises a warning and blocks
the digital readiness gate until reviewed.

BF-P2-04: woven option guidance uses each option's declared unit and emits a
single appropriate correction for button counts. The export toolbar labels
Selected size formats separately from whole graded-run formats; Tech Pack and
Projector explicitly ignore the selected-size picker. Export writer code and
legacy baselines remain untouched.

BF-P2-05: journey step chips are non-actionable status while the coached tour
is active; only the welcome Start/Skip actions and sequential Back/Next path
can change steps. After a confirmed Electron write, the journey persists Done
with the five-of-five checklist. Start maps to the Pattern canvas so hidden
disclosure cannot leave a stale Side or Edit surface visible.

BF-P2-06: the shell exposes semantic landmarks/headings, named inspection SVGs,
and pressed state for the view, garment, material/color, and nesting controls.
The Edit route keeps pointer handles as an exploratory surface but also renders
validated x/y coordinate inputs for every handle; finite changes use the same
`moveHandle` engine and invalid values remain visible. Guidance notes carry
field metadata and delegate Review actions to the matching control after each
redraw.

BF-P3-01: fresh workspaces choose material defaults from the garment's
construction family (knit-oriented garments use Cotton jersey; woven-oriented
garments use Cotton woven) while saved material choices remain explicit. Style
guidance names the numeric-input interaction and immediate preview update, and
the journey checklist describes the available garment registry without a stale
hardcoded subset.

BF-P3-02: the Nesting view's scope controls expose the actual consequence of
each mode in both visible labels and accessible descriptions: Single size uses
the selected size, while Graded marker includes every graded size. The nesting
engine and export writers remain unchanged.

BF-P3-03: the shell has a visible InfiniDrip product heading and main landmark
above the workspace, while the Color group is named by its visible heading and
each swatch keeps a visible color name. P2 semantic panel headings remain the
section hierarchy for the working surfaces.

FC-01: the Body inspection contract stays aligned with the active garment. The
Woven shirt passes finished waist/hip widths and hip depth from the same
coordinates used by its draft, so both front/back figures expose dimensions and
side-seam overlays for every declared lower field. Garment changes reapply and
restore the shared Body projection toolbar, including the existing lower Side
schematic, and spotlighting tracks hover and focus independently with focus
taking precedence. This is a presentation-only contract; export writers and
physical validation are unchanged.

Slice 93: the woven-shirt component-library exit audit verifies closed geometry
and sewability across XS–XL, all Pattern/Body/Side/Size run/Spec/Nesting/Check/
preview-Edit routes, and parsed SVG/DXF/tiled-PDF/A0/projector/tech-pack output.
It corrected the yoke centre-back fold closure and passes independent woven neck
geometry into Body and assembled previews; omitted renderer inputs preserve
existing output. This is digital evidence only; physical validation remains
outstanding. The final gate is 72 test files / 918 tests with 100% coverage,
typecheck/build, parsed output consumers and unchanged legacy export hashes.

Slice 92: `src/drafting/recipe.ts` registers the complete woven-shirt recipe and
routes its options, guidance, graded POMs, notches, allowances, tech-pack BOM,
pattern/spec/check/nesting/export pipeline, and assembled preview through the
existing engine. `src/render/garment.ts` adds schematic placket, buttons, yoke,
pocket, and vent details; existing garment output remains byte-identical when
the optional woven visual is absent. This is digital integration evidence only;
physical sewing and fit validation remain outstanding.

Slice 91: `src/drafting/shirt.ts` adds independent woven sleeve-cap geometry
fitted to the assembled armscye, a matching folded band, curved body hems and
an explicit open vent edge/mark. The vent is excluded from the sewn side seam;
the existing knit sleeve is unchanged.

Slice 90: `src/drafting/shirt.ts` splits the real back armhole with de Casteljau
geometry into a lower-back piece and folded two-layer yoke. The yoke carries
neckline/shoulder/upper-armhole edges, the lower back carries lower-armhole/
side/hem edges, and their yoke seams match exactly. One front patch pocket
joins a named placement mark; collar composition now follows the yoke neckline.

Slice 89: `src/drafting/shirt.ts` adds two full-length folded front plackets.
Their attachment edges match the real centre-front seam; button and buttonhole
marks use the same live six/seven count and finished spacing, while the collar
stand carries one additional button/hole pair. Both placket joins are explicit
stitches and invalid fractional counts produce no fabricated partial group.

Slice 88: `src/drafting/shirt.ts` composes two folded stand layers and two
folded pointed-collar layers from the woven body's measured front+back neckline.
Their four named stitches cover body↔stand, stand↔under-collar,
inner-stand↔upper-collar and the complete layered collar outer seam. Stand
height and collar depth remain live recipe choices.

Slice 87: `src/drafting/shirt.ts` adds a woven-only front/back body component.
The separate front has a real centre-front edge; the back is on fold; both
panels expose named shoulder, armhole, three-part side and hem boundaries. The
declared shoulder and side stitches match, while neck, waist and hip inputs
genuinely move the draft. Knit `bodice()` remains untouched.

Slice 86: `src/drafting/shirt-contract.ts` now separates woven-shirt body data
from recipe-owned construction choices. `Measurements.neck` is an independent
body circumference with a backward-compatible persistence fallback. The option
contract defines finished overlap/spacing semantics, six or seven front-placket
buttons plus one stand button, and explicit quantities for the 16 physical
roles. No woven geometry is drafted yet; named interfaces remain a Slice 87+
implementation obligation.

Slice 85: `docs/research/garments/WOVEN-SHIRT-RESEARCH.md` establishes the
evidence boundary for the woven block. Neck/body independence, front overlap,
usable collar/stand seams, sleeve-length semantics, yoke layers and physical
quantities require a Slice 86 contract. Existing Piece/mark/interface machinery
is reusable; knit bodice/sleeve and Polo geometry are not silently adopted.
No implementation/model changes. Six/seven front buttons exclude the stand button.

Slice 67: `renderBodyPair()` is the Body-tab composition boundary. It renders
front and back schematics side by side, passing each recipe's derived neckline
and the same live measurements into `renderBody()`. `renderBody()` accepts a
front/back position so depth and metadata stay honest: Tank neck-drop is
front-only, while shared width/strap/armhole geometry and hover ownership remain
available on both panels. The existing nesting utilization percentage was
verified as already shipped, so no duplicate nesting change was introduced.

Slice 68: `Piece.marks` holds internal construction geometry (cut/fold/placement
lines and button/buttonhole points), intentionally outside the piece outline so
it never changes seam allowance, bounds, nesting, or stitching interfaces.
Canvas and every cutting writer translate these marks at true scale; projector
mirrors off-fold marks for single-layer cutting while retaining centre-fold marks
once. `GarmentOption` schemas belong to recipes, and save version 3 persists a
map of numeric options by recipe id separately from `Measurements`. Polo is the
first planned consumer; no Polo recipe or garment geometry exists in this slice.

Slice 69: `polo.ts` drafts only Polo V1's resolved shell: front/back Bodice,
actual tee Sleeve, internal centre-front slit, and separate button/buttonhole
placket pieces. `MarkRef` extends a stitching `Interface` to name either an
exterior edge or a specific left/right side of an internal line mark. This lets
the two raw slit sides check against their real placket attachment lines without
misrepresenting a cut-on-fold front as a centre-front seam. `matchedNotch()`
remains deliberately exterior-edge-only. `PoloOptions` keeps live dimensions
outside `Measurements`; values pass through unchanged, awaiting Slice 70's
guidance guardrails and collar/stand geometry.

Slice 70: `draftPolo()` layers a pair of cut-on-fold stand pieces and a pair of
cut-on-fold pointed-collar pieces over `draftPoloShell()`. Physical quantities
are roles rather than passive “cut two” text, so a later nesting/export pass
cannot silently omit a layer. Collar/stand interfaces use real exterior edges;
only the slash-to-placket seam uses `MarkRef`. `poloGuidance()` is a pure,
option-aware extension of normal sleeved-top guidance: values remain verbatim,
then invalid V1 range, button-end clearance, hem clearance, and stand/leaf
relationships get actionable warnings. Recipe/UI pipeline integration remains
Slice 71/72 work.

Slice 71: `POLO` joins `GARMENTS` as a conventional `GarmentRecipe`: no special
pipeline exists. Its nine real pieces flow through generic grading, POM/spec,
notch/grainline checking, nesting, tech-pack, and writers. `POLO_NOTCHES` reuses
the exact tee table only for unchanged front/back/sleeve pieces; placket, stand,
and collar layers declare their own marks. `POLO_POMS` reports placket length /
width, button spacing, finished stand height, and collar-leaf depth alongside
the standard tee POMs. `POLO_STYLES` prevents a Polo target from being labelled
as a tee. Live recipe-option routing is deliberately Slice 72 work.

Slice 72: optional `GarmentOptions` now flows through recipe drafting, guidance,
grading, readiness, marker/projector, tech pack, fit-record prediction, and the
app's per-size exports. Existing garments receive `{}` and remain unchanged.
`mountApp()` overlays each recipe's defaults with its persisted raw option map;
Polo controls update that map only, so no design preference enters
`Measurements`. `PoloVisual`/`PoloBodyVisual` show the selected finished front
details on schematic views only—explicitly not simulated collar roll or drape.

Slice 73: the final Polo gate exercises the same option-aware recipe through
every graded size and output writer. Real SVG DOM parsing, pdf-lib parsing for
tiled/A0/tech-pack PDFs, DXF mark checks, and whole-run marker assertions prove
that nine physical roles and live dimensions survive export without changing
legacy baselines. This establishes digital sewability evidence only; physical
collar roll, placket recovery, fit, and wash behavior remain unresolved until a
sample is cut and sewn.

Slice 74: `render/polo-details.ts` is the shared flat schematic for Polo's
front stand, pointed collar leaf, and placket details in the Body and assembled
views. Its construction regions carry the same `option-*` keys used by the UI
rows, so finished Polo controls can spotlight the feature they affect. Polo's
Pattern canvas opts into a three-shelf layout (body pieces, plackets, collar /
stand pieces) to keep nine labels and marks legible. The Edit view remains an
explicit front-only in-memory override and is not part of the downstream draft
or export graph; this is a known product-contract gap, not evidence that edits
are applied to the final design.

Slice 78: the Edit view makes that contract explicit in the UI: it is an
exploratory, front-piece-only preview. Its in-memory handle and dart changes do
not enter the parametric draft graph, assembled preview, checks, grading,
nesting, persistence, or exports. This is a deliberate quarantine, not a
final-design editing model. If Edit is later promoted to a final-design
override, the model must change first to represent the override durably and
define its size/grading semantics; all downstream consumers must then receive
that state through validation and export rather than reading the editor SVG
directly.

Slice 79: `render/croquis.ts` is the render-layer croquis library. It exposes
upper- and lower-body geometry by explicit `front`, `side`, and `back` views;
the side paths are schematic envelopes because no side measurements exist.
Croquis geometry is presentation scaffolding only and cannot enter drafting,
grading, checks, nesting, or exports. Existing annotated Body and assembled
renderers remain unchanged in this extraction slice; a future UI slice may
expose side views after defining their product contract.

Slice 80: `upperCroquisFigure()` is now the shared upper-body render contract
for the annotated Body view. It owns the measured torso and sleeve paths and
returns the anchors used by Body's dimensions and measurement-to-edge overlays.
`render/body.ts` still owns SVG styling, labels, overlays, and Polo detail
composition; it resolves each recipe's real neckline and passes that geometry
into the contract. Tank's sleeveless armhole and strap point remain recipe/live
measurement-aware. This preserves the existing Tee/Tank/Polo Body output while
making the figure geometry reusable. The contract remains render-only: no
drafting, data model, grading, checks, nesting, Edit, or export writer consumes
it. Lower-body routing is Slice 81 and visible Side UI is Slice 82.

Slice 81: `lowerCroquisFigure()` is now the shared lower-body render contract
for the annotated Skirt Body view. It owns the measured waist/hip envelope,
structural leg chain, silhouette path, and anchors for the lower annotations.
`render/skirt-figure.ts` retains only skirt-specific cloth geometry and the
presentation layer around that body, so cloth remains visibly distinct and
outside the body contract. Front/back lower croquis paths use the shared
figure; the side path remains a schematic profile until side measurements exist.
This is still render-only and cannot feed drafting, grading, checks, nesting,
Edit, or exports. Visible Side UI remains Slice 82.

Slice 82: the Body view has a separate `Front + Back` / `Side` presentation
selector. `render/croquis-view.ts` frames the shared `upperCroquisPath()` or
`lowerCroquisPath()` side envelope and labels it `SIDE · SCHEMATIC`. It emits no
measurement dimensions or edge spotlight groups because the product has no
side-specific measurements. The selector is UI-only state: changing it does not
touch the drafting model, recipe options, grading, checks, nesting, Edit, or any
export writer. Returning to Front + Back restores the existing annotated
upper/lower renderers unchanged.

Slice 83: `render/croquis-contract.test.ts` drives the render contract from the
actual `GARMENTS` registry, so adding or removing a recipe cannot silently leave
one region out of the Front/Side/Back checks. It parses upper and lower Body
outputs, verifies the side renderer consumes the named side path without
measurement annotations, and calls the complete export family after side
rendering to prove the render layer remains pure. No croquis API is imported by
the drafting or export writers, and no export baseline moves as part of C3.

Slice 84: Phase C3 is complete. Upper and lower Body renderers consume shared
front/back croquis contracts, the user-facing Body selector exposes the named
Side envelopes, and the registry-driven tests cover all five current garments.
The final gate confirms croquis remains a presentation-only layer: the
pre-C3-to-HEAD diff has no drafting/data/grading/checks/nesting/export-writer
changes, and all legacy export hashes remain unchanged. Side output is honest
schematic guidance, not evidence of physical fit, sewability, or production
readiness. The next architecture milestone is the researched woven-shirt
component library; its garment research document must precede implementation.

Slice 75: the root `tsconfig.json` is type-check-only (`noEmit: true`). Vite is
the sole renderer build, so `npm run build` cannot place compiled `.js` siblings
beside TypeScript sources and alter Vite's module-resolution choice for a dev
server.

Slice 76: Polo's Pattern canvas layout is a presentation concern layered over
the unchanged piece geometry. Polo slots reserve a title lane based on the
component label, while compact construction-mark labels can render beside their
mark. The shared Polo preview helper now draws the stand as two neckline-following
edges and the collar leaves down onto the front; it does not alter drafted pieces,
stitches, allowances, or exports.

Forward boundaries confirmed 2026-09-12: C3's visible Side view is a
presentation-layer feature built on `render/croquis.ts`; it must not enter
drafting, grading, checks, nesting, or exports unless a later approved
contract requires real side measurements. Edit remains a preview-only
front-piece override through Phase 5. A future final Edit system must change
the design model first so overrides are durable, validated, gradeable, and
exportable.

The next garment architecture milestones are a reusable woven-shirt component
library (point collar/stand, button placket, back yoke, patch pocket, sleeve
band, curved hem, side vent), followed by a reusable straight-leg trouser
block (waistband, closure, pockets, rise/seat logic, and grading). Surface
design is intentionally later and independent from unfinished garment
geometry. External references routed in `CONTEXT-INDEX.md` inform these
contracts but do not override current code or authorize universal formulas.

**Governing plan:** as of Slice 44, `docs/planning/MVP-PLAN.md` (operative — the 6-month
execution plan) and `docs/planning/ROADMAP.md` (strategic — competitor analysis + long-term
scope + the cut list) are the current planning documents. This file describes
the engine as it exists; it does not restate the forward plan.

**Architectural fork, Phase A complete (Slice 51), Phase B complete (Slice 57):**
`docs/planning/COMPONENT-ARCHITECTURE.md` is the design doc for the Interface/Stitch/
Component work below — read it before touching `drafting/`. Seam knowledge
is now real, declared data: every `Block` carries a required `stitches`
field (`readonly Stitch[]`), populated by each recipe's own draft function
— `sleevedTopStitches(frontSideEdges, hasDart)` for tee/fitted (one builder,
two call sites, differing only in which front edges form the side seam and
whether a dart exists), a plain `SKIRT_STITCHES` constant for the skirt
(only one variant, no builder needed). `garmentReport`
(`guidance/garment-check.ts`) assembles a garment's full check list from
TWO sources now, in a fixed order that preserves the pre-migration ordering
exactly: `stitchChecks(b, b.stitches)` first, then `recipe.checks(b, m)` for
whatever isn't a stitch — a hem or waist meeting the fold square, a property
of ONE panel with no "other side" to compare against. The old hand-written
seam/cap/dart checks in `tshirt-checks.ts`/`skirt.ts` are gone; what
remains there (`dartLegCheck`, `frontHemWidth`) are genuinely independent
utilities, kept because they're still used and tested on their own, not
migration leftovers.

Slice 51 (A3) closed the last Phase-A gap: **matched notches now read their
edge name off the stitch they mark**, via `matchedNotch(stitch, side, t,
edgeIndex?)` in `stitch.ts`. `tshirt-notches.ts` (tee), `fitted-tables.ts`,
and `skirt.ts`'s notch tables no longer re-type an edge name a stitch already
declares — so a matched-seam notch can't silently drift from the seam it
marks the way two independently hand-typed table entries could. NOT
derived, deliberately: the armhole/sleeve-cap notches, because the stitch
they'd come from (sleeve-cap ease) is multi-edge AND eased — there's no
single matched point on a seam whose whole point is that its two sides
*aren't* the same length. Those stay hand-authored, same boundary logic as
the panel-owned hem/waist-square checks. Byte-identity gated: `tee`/`fitted`
SVG output (which embeds resolved notch positions) is unchanged per
`regression.test.ts`'s SHA-256 baseline; skirt has no export baseline, so
its notch table is instead proven field-for-field against the pre-migration
literal values in `stitch.test.ts`. Phase A (stitches as data) is now fully
closed; Phase B (components) is next.

Slice 52 (B1) opened Phase B: `component.ts` adds `ComponentResult` (a
component's pieces by role, its own internal stitches, and the interfaces
it exposes for another component to sew onto) and `assembleComponents`, the
ordered merge helper that turns N `ComponentResult`s + a recipe's connecting
stitches into a `Block`. Zero consumers yet — tee/fitted/skirt keep drafting
exactly as before — so this is pure new infrastructure, proven only against
synthetic data. B2 (extract Bodice) is where a real recipe consumes it for
the first time, which is also the first real test of whether the shape is
right.

Slice 53 (B2) closed that test: `bodice.ts` extracts the exact ~90%
`draftFront`/`draftBack` shared (§2.2) — same construction points, same
edges, same control points — parameterised by the three things that
actually differed (neck depth, neckline control point, centre edge name).
`draftFront`/`draftBack` stay exported from `tshirt.ts` as thin wrappers
over the new `bodice` Component, so nothing downstream (armholeLength,
fitted's `draftBack` reuse, existing tests) had to change. `draftTshirt`
now calls `assembleComponents` for real. Deliberately NOT touched: the
fitted front. It shares `bodice`'s neckline/shoulder/armhole prefix but then
diverges into dart edges and a shifted hem — genuinely different geometry
past that point, not the same duplication B2 was scoped to close. Folding it
into `bodice` (a `dart?` param, per §5's taxonomy) is a real candidate for a
later slice, not assumed here.

Slice 54 (B3) is the first Phase-B slice that's a real FIX, not just
infrastructure or extraction. §2.4's latent coupling — `draftSleeve` fit its
cap to a re-drafted generic tee bodice, not the bodice actually in the block
being assembled — is closed at both real consumers. `draftTshirt` measures
the armhole off the `bodice` pieces it just drafted; `draftFitted` (now also
on `assembleComponents`) measures it off `draftFittedFront`'s own armhole
edge, not a generic one. The new `sleeve.ts` Component takes
`targetArmhole: number` as a param instead of re-deriving it — so a future
bodice whose armhole genuinely differs (raglan, dropped shoulder, a shirt
block) can no longer silently get a sleeve fitted to the wrong number.
Byte-identical at STANDARD_M by construction, exactly as §2.4 predicted:
fitted's front reuses the tee front's exact armhole curve, so the "fixed"
number and the old re-derived one come out numerically equal — the fix is
structural (measuring the real thing), not a value change.

Slice 55 (B4 part 1) extracted Neckline — deliberately narrower than §6's
full spec. `neckline.ts`'s `NecklineParams` is typed with all four shapes
now, but `necklineEdge` implements only `"crew"`, throwing for `"v"`/
`"scoop"`/`"boat"` and for any non-zero `widthEase`/`frontDrop` (a silently-
ignored param would be a footgun once one becomes reachable). The 0.55/0.6
control-point factor moved from `bodice.ts` into `necklineEdge` itself — it
was always part of what "crew" means, not a bodice concern. `bodice.ts` AND
`fitted.ts`'s `draftFittedFront` both call it now, closing a second
duplication B2 had flagged and left alone: fitted's front neckline matched
the tee's only by construction before, not by a shared code path. B4 part 2
(the real fix) is where "v" gets actual curve math, widthEase/frontDrop get
wired to do something, and the guardrails get built and exercised for real —
none of that has a live code path yet, so building it now would be
speculative.

Slice 56 (B4 part 2) closed Phase B: `necklineEdge` implements real "v"
geometry (a straight line to a point — no curve, the true-to-life V),
applies `widthEase`/`frontDrop` for real, and returns real `notes` for
both §6 guardrails (shoulder-seam width, armhole-depth front drop), neither
of which can fire at `NECKLINE_DEFAULT`. Deliberately NOT done, decided
before coding: `NecklineParams` still isn't threaded through `BodiceParams`
or any recipe — nothing outside `neckline.test.ts` can reach a non-default
value yet. A v-neck tee isn't draftable end-to-end; that wiring is its own
slice, once a UI control exists to drive and test it against — building it
speculatively now would be backwards from how every prior Phase B slice
proved itself against something real. Byte-identical at
`NECKLINE_DEFAULT`: `bodice.ts`/`fitted.ts` now pass 2 new required params
(`shoulderHalf`, `armholeDepth`, always already in scope) but every
pre-existing test, including the SHA-256 baseline, passed unmodified — the
guardrails are mathematically silent at default measurements.

**Phase B is now fully closed: B1 (types) → B2 (Bodice) → B3 (Sleeve, fixed
§2.4) → B4 (Neckline, both parts).** Next is Phase C: re-express the skirt
via components (C1), then the real test — a tank (bodice + no sleeve +
different neckline) in hours, not a slice-run (C2). If it isn't, Phase B
isn't actually finished, whatever the checklist says.

Slice 57 (B5) added Waistband — different in character from B1-B4: no
waistband code existed anywhere to extract, so this is Phase B's first
genuinely NEW component. `waistband.ts` drafts a plain strip cut on the
fold (same convention as the skirt panels), sized to double to the
existing finished-waist number by construction. `closure` is deliberately
geometry-inert — real waistbands are cut identically regardless of button
vs. hook, unlike Neckline's `shape`, which genuinely would change the
curve. `draftSkirt` wires it in via `assembleComponents` for real: unlike
B2-B4, this is NOT byte-identity gated (`regression.test.ts` never covered
skirt), so `skirt.test.ts`, `stitch.test.ts`, and the golden-master file
were updated to the new correct shape rather than preserved — the skirt
now really has 3 pieces and 2 stitches. Verified against the real export
pipeline end-to-end (SVG/DXF/tech-pack), not just unit tests, per the
project's standing "bugs get caught by rendering" discipline.

**Phase B/C's core claim, empirically proven (Slice 59):** a genuinely new
garment — the tank (bodice + no sleeve + a v-neck front) — took one new
~90-line recipe file, one real capability added to `bodice.ts`
(`necklineParams`, wiring Slice 56 had deliberately deferred until a real
second consumer needed it), a 5-line style table, and one `GarmentRecipe`
object. Zero engine-layer files touched — checked, not assumed: the garment
picker, the "is this a top" figure logic, and the style panel all already
walk `GARMENTS`/`recipe.fields` generically. `sleevedTopPanelChecks`/
`frontHemWidth` were reusable verbatim (read first to confirm neither is
actually sleeve-specific); `sleevedTopGuidance` was not (it calls
`rolePiece(block,"sleeve")`), so `tankGuidance` is that function minus
`armholeMatch`. Byte-identical for tee/fitted: `necklineParams` defaults to
`NECKLINE_DEFAULT`, so their output is provably unaffected — the 8/8
SHA-256 baseline passed unmodified. This is the slice the whole migration
was staked on; it passed.

Slice 60 closed the two real gaps that "cheap" glossed over. `neckline.ts`
gained real "scoop" curve math (`scoopControlFactors` — a genuinely new
design decision, flagged as starting values, not inherited from any prior
curve like crew's numbers were; **superseded at Slice 62** — see the
"Standing principle" section below, `scoopControlFactors` no longer exists);
the tank's front moved from v (a stand-in,
picked only because it was the sole non-crew shape that existed) to scoop
(the real default). Separately: `render/garment.ts` and `render/body.ts`
took only `Measurements`, no recipe — genuinely garment-blind, so both drew
a sleeveless tank as a short-sleeve tee. Both gained a `hasSleeve` param
(default `true`, byte-identical for tee/fitted); `app.ts` computes it the
same way it already computes `isTop`. The mutation-testing found a real
gap in the safety net itself: hardcoding `hasSleeve = true` in `app.ts` was
caught by NOTHING — every existing test proved the render functions correct
in isolation, none proved `app.ts` wires them right. A new DOM-level
integration test in `app.test.ts` closes that: it clicks the tank button
and inspects the actual rendered SVG, which is the only kind of test that
could have caught the bug as originally reported.

`Block` importing `Stitch` from `stitch.ts` — which itself imports `Block`
from `block.ts` — is a real circular reference, resolved with `import type`:
type-only imports are erased at compile time and never enter the runtime
module graph, so the cycle exists only at the type level, which TypeScript
resolves without complaint. Confirmed empirically (`tsc --noEmit` raised no
cycle-related errors), not assumed.

The migration's safety net is a FROZEN golden master
(`drafting/garment-check-golden.ts`) — real `garmentReport` output for tee/
fitted/skirt across several measurement points, captured and verified
correct BEFORE any production code changed, then used as the comparison
target throughout. This matters specifically because Slice 49's own
equivalence tests compared declared stitches against `recipe.checks` — a
comparison that would have become self-referential (or simply wrong) the
moment `recipe.checks` was narrowed to panel-only, exactly the "a test that
mirrors the output proves nothing" trap this project's testing discipline
exists to catch. Recorded truth from before the change, not the thing being
changed, is what makes the proof real.

## The one big idea

Everything runs off **one object: `measurements`** (your body numbers, in cm).
Change a number and the whole picture is rebuilt from scratch — there's no hidden
state to fall out of sync, because every layer is just a *function* of those
numbers:

The UI is the only part that isn't a pure function: it catches your typing and
presses "rebuild." (The one deliberate exception is the freeform **Edit** view —
see the `edit/` layer below — which holds a hand-edited snapshot that is a manual
override, explicitly outside the parametric flow.)

## The layers

**geometry — the alphabet.**
A `Point` is `{x, y}` in centimetres (real cm, so it maps to real cloth).
`distance` is just Pythagoras. A curve is a *Bézier*: it runs start → end, and its
two control points are **magnets** that bend the line toward them without ever
touching it. `cubicLength` measures a curve by walking it in tiny steps and adding
them up — quietly the most important tool in the whole app.

**drafting — measurements become a pattern.**
A `Piece` is a closed outline of named `Edge`s (each one a straight line or a
curve). Drafting drops a few construction points (neck, shoulder, underarm, hem)
and connects them. Edges carry *names* ("armhole", "side") so other layers can ask
a piece "how long is your armhole?" The clever bit: the sleeve cap's height is
**solved** — a quick guess-and-check loop finds the height that makes the cap the
same length as the armhole.

*This is also exactly what makes Slice 48's component work additive rather
than a rewrite: every edge is already named, which is the one precondition a
formal `Interface`/`Stitch` layer needs. Today a seam relationship (front
shoulder ↔ back shoulder) exists only as a hand-written assertion inside the
checker — construction knowledge encoded in its own verification, backwards.
`COMPONENT-ARCHITECTURE.md` covers why and how that becomes declared data.* The garment-specific recipe also lives here: the
t-shirt drafting math, its **notch rules** (`tshirt-notches.ts`), its **fabric/ease
guidance** tables (`ease.ts`), its **grade table** (`tshirt-grade.ts`), and its
**POM list** (`tshirt-pom.ts`). Two pure engines also live in drafting: **grading**
(`grading.ts` — re-draft the block over a size run) and **POM measuring** (`pom.ts`
— read a measurement off the live geometry).

**render — pattern becomes a picture.**
Pure translation, no decisions. `pieceToPath` walks a piece's edges into one SVG
string (`M` move, `L` line, `C` curve, `Z` close). Everything is a **string**, not
live page elements — which is why it tests without a browser (you just search the
text). This layer also draws the seam-allowance cutting line, **notches and
grainlines** (`notch.ts`), the graded **nest** (`nest.ts` — overlaid size outlines
as tree rings), the **fabric nest** (`fabric.ts` — the shelf-packed pieces on a
bolt, for the estimator), and the **freeform editor** (`editor.ts` — the piece
outline plus its draggable handle dots). On screen, cm × a scale = pixels.

**export — the pattern leaves the screen.**
Screen drawing is for *looking*; export is for *making*, so it's its own layer with
one shared spine. `flattenPiece` turns each piece into two true-scale point loops —
the **sew line** and the **cut line** — and `layoutPieces` packs them side by side.
Thin format writers ride on top: `exportSvg`, `exportDxf` (CUT/SEW layers), and
`exportPdf` (tiled, print-at-home). Two **real-world writers** (Fable F1) sit
beside them on the same spine: `exportProjectorSvg` (one seamless cm-true
canvas, a toggleable Inkscape-convention layer per graded size, cut-on-fold
pieces unfolded to full width via `unfold.ts`) and `exportA0Pdf` (single-page A0,
whole pieces shelf-packed via `nestPieces`, kept folds marked "PLACE ON FOLD").
Both embed the locked 10 cm calibration square (`calibration.ts`) — the scale
anchor the user verifies before cutting. Their tests parse the files with real
parsers (DOMParser / pdf-lib) and measure geometry out of the parsed result;
`regression.test.ts` pins the pre-F1 writers byte-identical by SHA-256. The **nesting estimator** (`nesting.ts`) is a
sibling helper on this spine, and the **graded marker** (`marker.ts`) feeds it the
whole size run at once (size-labelled) instead of one garment. A width-aware **shelf pack** onto a bolt with a true
(polygon-area, shoelace) utilization read-out. It leaves the cutting-file exports
untouched (rotating pieces there would misplace the SVG notches/grainlines, which
are re-derived from the original piece), and it carries no rotation — under a
grain-constrained bounding box, rotation is geometrically inert.

**guidance — the chef tasting the soup.**
Each check is one fact you could verify with a tape measure: "cap matches armhole,"
"shoulder shouldn't pass the side seam," "armhole not too shallow." The UI also
feeds in a **fabric ease note** here — advice, never an instruction the engine acts
on. Guidance grew up into the **production-readiness checker** (`check.ts` engine +
`tshirt-check.ts` recipe): the same tape-measure facts, rolled into one pass/fail
"can this be made?" verdict (matched seams, cap ease within a band, hem square to
the fold, notches/grain declared, the size run grows monotonically). The engine
primitives are garment-agnostic; which edges pair up and what the thresholds are is
recipe.

**Sewability is not fit (Slice 45).** The checker above verifies geometry — do
seam lengths agree, is the hem square — and never claimed otherwise. Closing
that gap needs a real body, not more geometry: `drafting/fit-compare.ts` reads
every POM off the exact block that gets cut (`sampleSpec`, the same block the
tech-pack sketch draws), and `compareFit` checks a real sewn garment's
measurements against that prediction, per-POM, against each POM's own declared
tolerance. `withinTolerance` is `true`/`false` when a tolerance exists and
`null` when it doesn't — never an invented pass on a number the POM was never
given a tolerance for. There is no in-app field to type the actual numbers back
in yet; the loop closes on paper via the tech-pack's 4th page.

**Body view ↔ controls linking (Slices 29–30).** The body figure is the one place
a measurement becomes visible as a body, so it carries the teaching load. It emits
two parallel maps, both keyed by the measurement FIELD name:
- `data-dim="<field>"` — the dimension line (what the number *is*), Slice 29.
- `data-edge="<field>"` — the outline segments the number *shapes*, Slice 30.

The UI owns no geometry: one `spotlight(field)` in app.ts lifts groups whose field
matches to opacity 1 and drops the rest to 0.15. The silhouette is grouped as
`data-edge="figure"` — deliberately never a field name, so it always falls to the
dimmed state and the UI needs no special case for it. Ownership is
non-overlapping (each segment belongs to exactly one measurement), so a hover has
one unambiguous answer. Because the body SVG is re-rendered on every change, the
spotlight is re-applied after each draw via `activeDim`.

**A figure is a BODY; a garment is drawn ON it (Slice 43).** `renderSkirtBody` draws
two shapes: a `data-part="silhouette"` lower body (waist → hip flare → crotch → two
legs to y=118) and a `data-part="cloth"` skirt draped just outside it. Nothing is
drawn above the waist line — a head or shoulder stub would be decoration carrying no
data, and the tee's stub is a legacy the skirt does not inherit. The legs are
structural rather than measured: they exist so a hem always lands ON a body, and they
outrun the longest hem the length slider allows. Because a hip is shaped by a CURVE,
`data-edge="hip"` is a pair of `<path>` overlays, not `<line>`s — the edge overlay
must follow the outline, never its chord. A silhouette is emitted from a CHAIN of
cubic segments that can be walked in either direction, so the left side is the right
side reversed; emitting both sides forwards produces a path that never visits the far
hip, and every "right width / right height" test still passes on it.

**Three tiers of validation (Slice 31 built tiers 2–3; 32–34 surface them).** The
geometric checks answer one question — *does the pattern sew together?* Real use
showed that's necessary but not sufficient: a chest of 160 cm sews together fine,
so the app declared it production-ready. `guidance/plausibility.ts` adds two tiers,
both **warnings, never clamps** (the app cautions; the user decides):
- **Anthropometric plausibility** (`plausibilityChecks` + `MEASUREMENT_BOUNDS`) —
  is each number sane for a real adult garment?
- **Proportional coherence** (`coherenceChecks` + `RATIO_BOUNDS`: chest↔shoulder,
  chest↔length, bicep↔chest) — are the numbers sane *relative to each other*? This
  catches an internally mismatched set even when each value passes its own bound.
`guide()` folds all three tiers into one note list, and `guidanceMarkup` heads the
panel with a verdict ("⚠ N to review" / "✓ Looks production-ready"). Every note is
stateful (names its current value) and leads with a severity ICON from the exposed
`SEVERITY_ICON` map (⚠ / ℹ / ✓) so severity is never colour-only — Fable's journey UI
reads the same map rather than inventing glyphs.

**Garment-scoped (Slice 41).** Both tiers take `recipe.fields` and only judge a
bound or ratio when every field it needs is in that set — a field the garment
doesn't expose (chest, on a skirt) sits frozen at its default and must never be
flagged. `guide()` and every `app.ts` reader of `measurementsPlausible`/
`implausibleFields` pass `recipe.fields` through; the tee exposes every field these
tiers touch, so its behaviour is unchanged.

**Body vs finished (`drafting/facets.ts`, Slice 34).** A raw number is ambiguous on
its own — "Chest 100" could be the wearer or the shirt. Each field is classified as
a BODY measurement (taken off a person; the garment may add ease) or a FINISHED
dimension (a garment size chosen directly), and where ease applies the finished value
is exposed: chest gains full ease (mirrors the draft's `(chest+ease)/4`), the sleeve
gains half (`bicep + ease*0.5`). Every classification traces to how the draft USES
the number, so it can't drift from the geometry. `measurementFacet` / `MEASURE_ROLE`
/ `roleTag` are the exposed data — the last of the Phase-A contract Fable's F2 renders
(it labels; it never recomputes ease). The honest-
surfacing half (Slice 32) makes green *conditional*: `measurementsPlausible(m)` — no
out-of-range field, no bad ratio — is the single gate the UI reads. While it is
false, the check view's "Ready to cut" banner and the style panel's "you're making a
X ✓" both withhold green, and every out-of-range field gets an amber outline (driven
by `implausibleFields`, the same list `plausibilityChecks` now builds on). So a set
that sews together (`report.ok` true) but is an impossible body can never *read*
validated.

WHERE THE BOUNDS COME FROM (a plan correction worth recording). The roadmap assumed
bounds could be read off "the size chart grading already uses". There is no such
chart: grading is RELATIVE — per-step deltas (`TSHIRT_GRADE`) around the user's own
base, so a chest of 160 just shifts the whole run up, it never falls "off" anything.
The only absolute human-scale number in the engine is `STANDARD_M`. So the bounds
are DECLARED in `plausibility.ts`, seeded from published adult apparel ranges and
centred on `STANDARD_M` (each ~50% of its range), deliberately loose — they catch
the absurd, not the merely unusual. The table stays SHARED across garments, but since
Slice 41 it is READ through `recipe.fields`, so each garment is only ever judged on
the measurements it actually exposes — a skirt is never told its chest is wrong.
Adding `hipDepth` in Slice 42 exercised exactly that: it sits in the same table, and
the tee is structurally blind to it.

**The raw measurement set** is `chest, shoulderWidth, bicep, length, armholeDepth,
sleeveLength, waist, hip, hipDepth, neckWidthEase, neckDrop, strapWidth, ease`. Adding one means touching six registries
in lockstep — the `Measurements` struct + `STANDARD_M`, `MEASUREMENT_BOUNDS`,
`MEASURE_ROLE` (facets), `FIELDS` (controls), `persist`'s BOUNDS + read, and the
`fields` list of every recipe that wants it. A field added after v1 is read
LENIENTLY in `persist` (defaulted from `STANDARD_M`, never required) so older saves
keep loading — `waist`/`hip` (s37) and `hipDepth` (s42) all work this way.

**No drafting constant that a body actually varies may stay a constant.** `hipDepth`
was `HIP_DROP = 20`, duplicated in the draft and the figure and driven by nothing;
Slice 42 made it a real field. When such a constant becomes editable it can open
failure modes that were previously unreachable, and the fix is a guidance note, not
a clamp — `skirtGuidance` warns when `length <= hipDepth` would fold the panel over
itself.

**style — declare a target, see the gap (prescriptive).**
A style is a **box of ranges** per measurement. You **pick a target fit** and the
panel reports the signed distance to it on every axis (e.g. "Ease +9 cm", "Length
−13 cm"), and confirms once you're inside every range. Selecting a target **writes
no measurement** — you close each gap yourself with the sliders.

**edit — freeform, on purpose outside the parametric flow.**
A pure engine for moving points on *any* piece. `pieceHandles` exposes a piece's
draggable **handles** — a **vertex** at each corner, plus two **control** magnets
per curve edge. `moveHandle(piece, handle, to)` returns a NEW piece with that
handle dragged, moving both edges that share a vertex so the outline stays closed.
`nearestHandle` is hit-testing; `editorViewBox` + `viewboxPointToCm` map the pointer
into cm. It's garment-agnostic and knows nothing about t-shirts. `moveHandle` is the
reusable primitive dart manipulation will later rotate around an apex.

**ui — the only impure layer.**
`mountApp` holds the `measurements`, builds the page once, then wires each input:
on change it makes a **new** measurements object and calls `draw()`, which rebuilds
canvas + guidance + style. A **View** toggle swaps the main canvas between
**Pattern**, the graded **Size run** (nest), the **Spec** sheet, the **Nesting**
estimate, the production-readiness **Check**, and the freeform **Edit** view. The
export buttons live here too. **Save/Load** (`persist.ts`) serialise measurements +
fabric to `localStorage` as versioned, validated JSON. The **Edit** view snapshots
the front into `editedFront`; three thin mouse handlers (down/move/up) turn a drag
into `moveHandle` calls, a **Reset** button re-drafts from measurements, and the
snapshot never feeds back into `measurements` — freeform is a manual override, so
the parametric core stays consistent everywhere else.

## Why it stays clean

- **Pure functions = cheap tests.** Most layers are "inputs → outputs," so a test
  is one line: feed known numbers, check the answer. That's why 100% coverage came
  easily and why the lower layers need no browser.
- **Strict TypeScript = free enforcement.** Unused code is a *compile error*, and
  the build fails if coverage ever drops below 95%.

## Where things live

  geometry/   points, distance, Bézier + curve length; rotation about a pivot
  drafting/   measurements -> pieces; t-shirt recipe; notch rules; fabric/ease
              guidance; grading engine + grade table; POM measuring + POM list;
              dart engine (dart.ts) + fitted/darted recipe (fitted.ts);
              the garment registry (recipe.ts) + the shared Block type (block.ts:
              role-keyed piece collection; blockPieces = engine, rolePiece = recipe);
              AllowanceSpec (allowance.ts) — per-edge seam allowance, recipe-owned
  render/     pieces -> SVG string; seam allowance; notches + grainlines; graded
              nest; fabric nest; freeform editor; garment view; body view; theme
              (body view = measurements -> annotated figure, engine-independent;
              it emits TWO tagged maps the UI drives — `data-dim` per dimension
              line, `data-edge` per outline segment a measurement shapes);
              neckline-path.ts (s61) — the one place a real `necklineEdge()`
              result becomes a drawable SVG curve; shared by garment.ts and
              body.ts so neither can draw a neckline shape unsynced from it
              polo-details.ts (s74) — shared stand/collar/placket schematic and
              option-to-feature tags for Body and assembled views
  export/     pieces -> true-scale cutting files (SVG, DXF, tiled PDF); shared
              layout spine; nesting estimator (shelf pack + utilization);
              tech-pack document (techpack.ts — 3-page sketch + POM table + BOM;
              callout leaders driven by an optional Pom.anchor on the front);
              real-world files (projector.ts — layered seamless SVG; a0.ts —
              one-page A0 PDF; unfold.ts — mirror-on-fold; calibration.ts —
              the 10 cm scale square both embed)
  guidance/   tape-measure checks; production-readiness checker, recipe-driven
              (check.ts primitives + garment-check.ts)
  style/      style table; target-fit gap (prescriptive)
  edit/       freeform edit engine: handles, moveHandle, hit-test, viewbox/pointer
  ui/         the impure shell; sliders, fabric + style selectors, a Tee/Fitted
              garment toggle, the view toggle
              (Pattern/Size run/Spec/Nesting/Check/Edit), freeform drag handlers,
              save/load persistence; the guided journey (journey.ts — pure step/
              disclosure/checklist maps + markup; app.ts applies them: a coached
              Start→Measure→Fit→Refine→Output path that progressively reveals
              the views, persists to localStorage, and celebrates an export
              honestly — no green while measurements are implausible)

## A change, start to finish

You type Length = 80 → `applyChange` makes a new measurements object → `draw()`
re-drafts the pieces → the canvas redraws longer, guidance re-checks, the style
panel re-reads the gap, and — if you're in Size run / Spec / Nesting / Check view —
that view recomputes around the new numbers. One input, one rebuild, everything
stays consistent. (The Edit view is the deliberate exception: its snapshot is a
manual override and only a Reset re-syncs it to the measurements.)

## Engine vs. recipe (how new garments get added)

Two kinds of code live here. The **engine** doesn't care what garment it is —
geometry, the Piece/Edge model, the renderer, seam allowance, the notch engine
(`notch.ts`), the grading loop (`grading.ts`), the POM query helpers (`pom.ts`),
the nest renderers (`nest.ts`, `fabric.ts`), export + the nesting estimator, the
checker primitives (`check.ts`), the recipe-driven report (`garment-check.ts`), the
freeform edit engine (`edit/`), and the dart engine (`dart.ts`). The
**recipe** is the garment-specific part — the drafting math, the guidance rules,
the style table, the notch rules (`tshirt-notches.ts`), the fabric/ease guidance
(`ease.ts`), the grade increments (`tshirt-grade.ts`), the POM list
(`tshirt-pom.ts`), the fitted/darted front (`fitted.ts` + `fitted-tables.ts`), and
the per-garment check spec. All of it is bundled into one `GarmentRecipe`
(`recipe.ts`), which is the only thing the engine is handed.

Adding a new garment in the SAME family (a top) = writing a new recipe. A
structurally different garment (a bottom) does NOT yet plug in — be honest about
where the split is real:

  REAL (garment-agnostic today): grading, POM engine, layout, SVG/DXF/PDF export,
  nesting, renderBlueprint, the edit engine, and Block itself (s25).

  SKIRT PROVES THE SPLIT (s38): a structurally different garment — `drafting/skirt.ts`,
  front/back panels with no sleeve/armhole/neckline — runs through the whole engine
  (draft, recipe-owned checks/guidance, grade, POM, export, nest, readiness) with
  only a recipe added and registered in GARMENTS. The garment toggle, controls (now
  re-rendered per garment's `fields`), and plausibility all follow.

  NO TEE-SHAPED SPOTS REMAIN (as of s40). The two figures were the last: the assembled
  view (`renderGarment`) and the body view (`renderBody`) were tee-hardcoded, so app.ts
  now gates both on `isTop` and draws `renderSkirtGarment` / `renderSkirtBody` (in
  `render/skirt-figure.ts`) for the skirt. The style suggester became recipe-owned in
  s39 (`recipe.styles`: `TEE_STYLES` / `SKIRT_STYLES`). The app is fully garment-general
  — every engine and UI surface reads the recipe rather than assuming a tee.

  Skirt bridge, COMPLETE: Block (s25) → recipe-owned checks (s35) → recipe-owned
  guidance (s36) → per-garment Measurements (s37) → the skirt recipe (s38).

  The post-s40 review queue is CLOSED: guidance garment-scoping (s41), `hipDepth` as
  a real field (s42), and the skirt body croquis rebuilt against it (s43).

## Where the roadmap plugs in (what's left, slices 19–20)

**Already built:** notches & grainlines; fabric/ease guidance; grading (tree-ring
nest); the POM spec sheet; the **nesting estimator** (`export/nesting.ts` +
`render/fabric.ts`); the **production-readiness checker** (`guidance/check.ts` +
`guidance/tshirt-check.ts`); the **freeform editor** (`edit/` engine +
`render/editor.ts` + an Edit view in `ui`); and the **fitted/darted recipe**
(`drafting/dart.ts` engine + `drafting/fitted.ts`), shown via a Tee/Fitted toggle in
the Pattern view.

  *Note on the editor's shape:* an earlier version of this map predicted the editor
  would be "a new impure surface, a sibling of `ui`." It landed lighter than that:
  the geometry is a **pure `edit/` engine**, and the interaction is just another
  **view inside the existing `ui` shell** (three mouse handlers), not a second
  mount. Same capability, less machinery — flagged here so the map matches reality.

- **Tech-pack document (15b).** The measured spec sheet is done; what's left is
  packaging: a flat sketch with callout leaders, a PDF doc writer on the export
  spine, and editable BOM/construction stubs. New writer on the export spine.
- **Fitted/darted recipe (19) — built.** The dart is baked into the outline as two
  named leg edges meeting at the apex, so the apex is a real vertex dart manipulation
  can rotate.
- **Garment generalization (20) — built.** A `GarmentRecipe` (`drafting/recipe.ts`)
  bundles the draft fn, notch table, POM list, grade rule, size run, and check spec.
  Every view reads it; `gradeRun` takes the draft fn; `Pom.measure` takes the shared
  `Block`; `renderBlueprint` and `exportSvg` take notches as a parameter instead of
  importing the tee's table. Adding a garment touches no engine file.
- **Dart manipulation + truing (21) — built.** `transferDart` pivots the wedge about
  the apex onto another straight seam, anchoring the fold so it never moves; every
  seam length survives (the conservation law, tested). `trueSeam` blends the corner
  the old dart leaves behind. Both are pure engine in `drafting/dart.ts`, on top of
  `geometry/rotate.ts`; the Edit view drives them.

- **Per-size export (22) — built.** `drafting/grading.ts` exposes `draftAtSize` —
  one garment drafted at one grade step — which `gradeRun` now uses internally, so
  the size picker, the Spec sheet, and the Size-run nest all agree on what a size is.
  The export buttons draft the picked size and name the file `<garment>-<SIZE>`.

- **Tech-pack document (23) — built, now 4 pages (45).** `export/techpack.ts`
  composes a PDF on the tiled-PDF spine: real-piece flat sketch (base size) +
  graded POM table + recipe BOM/construction + a **Fit Record** page (45) — the
  same POMs at the sample size, blank ruled space for a real sewn measurement.
  Callout leaders are opt-in per POM via `Pom.anchor?`. The first render of the
  Fit Record page had a real bug — a hardcoded-cm header ran text off the page
  edge — caught by rendering the PDF to an image and looking at it, the same
  discipline that caught the Slice 43 silhouette bug. Fixed by sizing every
  column off `page.width`; a regression test now parses the real rule
  coordinates out of the content stream and checks they stay inside the page,
  on both supported page sizes.

- **Body view (24) — built.** `render/body.ts`: measurements → an annotated
  upper-body figure, engine-independent. Its lower-body sibling is
  `render/skirt-figure.ts` (`renderSkirtBody`, rebuilt in s43): a real croquis with
  legs, plus the skirt drawn as separate cloth over it, annotating all four raw
  skirt fields (waist, hip, hipDepth, length).

- **Block generalization (25) — built.** `Block` is a role-keyed piece collection;
  the engine walks `blockPieces`, only a recipe names a role via `rolePiece`.

- **Seam allowance (26) — built, two bugs fixed.** Per-edge `AllowanceSpec` on the
  recipe; the corner offset is now exact (2×2 solve, was 0.707 cm at a right angle)
  and fold edges take zero (was +4 cm of chest). The two hardcoded constants are gone.

- **POM tolerances (27) — built.** Each POM carries an optional ±; a Tol column in
  the Spec view and the tech-pack PDF.

- **Graded marker (28) — built.** `gradedMarker` nests the whole size run on one
  bolt (size-labelled), as a Single/Marker toggle on the Nesting view.

- **Slider ↔ body-view linking (29) — built.** Body dimensions are tagged
  `data-dim`; hovering a measurement row spotlights its dimension. Pure UI.

**What was left as of Slice 29, now closed:** a structurally different garment (a
bottom) plugs in as of the skirt bridge (Slices 35–43) — recipe-owned checks,
recipe-owned guidance, per-garment `Measurements`, the skirt recipe itself, and
both views all shipped. See the "Sewability is not fit" and Fit Record notes
above for what replaced "photo→pattern → upcycle planner" as the next honest
gap (ROADMAP.md §1.5 cut photo→pattern from v1 entirely — active research
frontier, not a buildable feature on this timeline).

## Desktop shell (Slices 46–47)

The app was, until this slice, exactly "a locally hosted webpage" — `npm run
dev` and a browser tab. `electron/main.cts` + `electron/preload.cts` change
that without forking any renderer code: a `BrowserWindow` loads the identical
app (dev: the Vite dev server; packaged: the same `dist/` `npm run build`
already produces), and the ONLY new capability is one IPC channel,
`save-file` — the renderer asks main to save, main owns the native dialog and
the actual `fs.writeFile`, `contextIsolation` stays on throughout.
`src/ui/app.ts`'s `download()` checks `window.electronAPI` first and falls
back to the pre-Slice-46 Blob/`<a>` trick when it's absent, so the app is
still, correctly, a plain website when it isn't running inside Electron.

Both source files are `.cts`, not `.ts` — TypeScript always compiles a `.cts`
file to CommonJS regardless of the root `package.json`'s `"type": "module"`,
which is the one thing this layer needed to not fight the rest of the build
over. `electron/tsconfig.json` is a separate, Node-context config; the
`src/`-scoped `tsc --noEmit` gate and the 100%-coverage Vitest suite never see
this directory at all.

**This layer has its own gate, and it is deliberately NOT the Vitest suite.**
`electron/verify-save.cjs` launches the real Electron app via Playwright's
official Electron support, stubs only the native OS save dialog (the one
piece that can't be scripted), clicks a real export button, and confirms a
real file with real content lands on disk — proving the actual IPC round
trip, which a jsdom-based unit test cannot do (jsdom has no real IPC, no real
dialog, no real filesystem). Run via `npm run electron:verify` (needs `npm
run dev` running separately) or `electron:verify-packaged` (against a real
`electron-builder` output); needs a display (`xvfb-run` in CI/containers).

**Product identity, made consistent everywhere (Slice 47).** `app.setName
("InfiniDrip")` runs before `whenReady()` — without it, `app.getName()`
returns `"Electron"` in dev mode (verified: it does not read `package.json`
at all when launched by pointing electron directly at a `.cjs` file rather
than a directory). The actual LIVE bug, though, was `index.html`'s own
`<title>` tag — visible in every browser tab, and in the desktop window
chrome too since Electron syncs its window title to the page's `<title>` by
default. Both `package.json`'s `name` and the electron-builder `appId` also
carried the project's old internal name; `linux.executableName` is now
pinned explicitly rather than left to electron-builder's default (which
derives from `package.json`'s `name`, not `productName` — a real,
platform-specific inconsistency worth not depending on implicitly).

**A real `Menu`, not the Electron default.** `buildMenu()` in `main.cts`
gives File a working Export submenu — the same six kinds as the Output
step's buttons, same labels — while keeping Edit/View/Window at Electron's
already-sensible defaults (undo/redo/cut/copy/paste/select-all all
genuinely worked before this slice too; that was checked empirically, not
assumed, before any code was written to "fix" something that wasn't
broken). A menu click sends one IPC message naming which export was picked;
`app.ts` clicks the real matching button rather than main owning any export
logic, so the menu and the mouse are provably one code path.

**Window-state persistence uses synchronous file I/O on purpose** — the one
deliberate exception to the async pattern the rest of this layer follows.
The state file is a few dozen bytes, written once on the window's `close`
event; an async write there risks the process exiting before it lands
(Electron does not wait for a fire-and-forget promise before quitting),
silently losing the save on every ordinary quit. Sync removes that race
entirely rather than requiring an `event.preventDefault()`/`finally()`
dance to paper over it.

`electron/verify-menu-and-window.cjs` extends the Slice 46 e2e pattern: a
real launch, a real click on the real native menu via Electron's own Menu
API (Playwright cannot click an OS-level menu), a real resize → close →
relaunch → check-bounds round trip on the SAME profile (persistence is the
point), and a real `win.title()` check. Four checks, run against both dev
mode and a real unsigned `electron-builder` output.

Explicitly not here yet: code signing (MVP-PLAN.md §1.4, a separate
procurement track with its own lead time) and auto-update — there is no
real release feed to point it at yet, and code that compiles against
nothing to update FROM is not something this project ships unverified.

## Standing principle added after Slice 60: no silent geometry reuse (extended Slice 61, 62, 63)

Slice 60's own verification (100% coverage, mutation-tested, "all green")
still shipped a body view that drew a visibly different torso from the
actual pattern, from identical measurements — `render/body.ts` computed
chest width with its own never-reconciled formula instead of `derive()`'s.
Passing tests proved the code did what it was told; it never proved what it
was told was correct. Two rules follow, for every garment from here on:

1. **No garment recipe may silently reuse another garment's geometry**
   (an armhole curve, a body-width formula) **without an explicit, stated
   reason.** The tank's Slice 59 armhole reused the sleeved bodice's curve —
   built to fit a sleeve — for a sleeveless garment, unflagged as a
   simplification at the time. "It happened to reuse cleanly" and "it's
   correct for this garment" are different claims; conflating them is the
   failure mode this rule closes.
2. **Verification must include checking rendered output against the
   claimed source of truth, not just that tests pass.** A render layer that
   independently re-derives a number `derive()` already computes correctly
   is exactly the kind of drift unit tests alone won't catch if both sides
   are tested only against themselves. See PROJECT-STATE.md's "Active
   directive: Tank rework" for the concrete fix plan and the research
   standard (real, cross-vetted sources for garment construction data —
   never recycled from one of our own existing garments) adopted alongside
   it.

**Slice 61 closed item 1 of that plan, and the principle held on its own
audit.** `render/body.ts`'s chest width now reads `derive().chestWidthHalf`;
both `body.ts` and `garment.ts`'s neckline curves now come from a real
`necklineEdge()` call through one shared function
(`render/neckline-path.ts`), so a crew/v/scoop can't drift between the two
views again. Applying rule 2 to `render/skirt-figure.ts` (the mandated
audit, not an afterthought) found the identical bug already sitting in that
file: `figureOf()`'s waist/hip half-width was its own independent
approximation, computed a few lines away from `renderSkirtGarment`'s correct
formula in the SAME file. Fixed the same way rule 1 prescribes — one shared
`skirtWidths()` in `skirt.ts`, every consumer reads it, no second formula
left to drift. Every new test reads the real source of truth and checks the
rendered SVG against it directly (not a hardcoded literal that could itself
drift unnoticed) — including a new equivalence test in `recipe.test.ts` that
redrafts each top garment and confirms its declared `frontNeckline`/
`backNeckline` reproduces the actual drafted edge, closing the same
"declared but never verified" gap rule 2 exists to prevent.

**Slice 62 found a THIRD kind of gap, one level deeper than either rule
anticipated: the source of truth `render/` was now faithfully syncing to
was itself wrong.** Rule 2's own audit made this visible — rendering the
real curve everywhere at once is what turned a numbers-only bug into a
screenshot anyone could see. `necklineEdge()`'s curve (dating to Slice
55/56, well before the tank existed) never met the centre-front/back fold
at a right angle; every drafting source checked agrees that's the one rule
that keeps a curve from spiking when mirrored on the fold, and ours broke
it. Rebuilt as a true quarter-ellipse (control points pinned on the axis
that makes each tangent perpendicular to the line it meets, using the
standard 0.5523 Bézier circle-approximation constant). A direct consequence
of enforcing that rule: the curve's shape became fully determined by its
two endpoints, which is why `scoopControlFactors` (Slice 60) could be
deleted outright — there was no shape left for it to express. Scoop is now
crew geometry plus depth/width, matching what the drafting sources say a
scoop actually is. Widening the tank's front neckline then surfaced a real,
independent bug (shoulder-seam length mismatch, since the shoulder tip
point never moves) — caught by `stitchChecks` failing during verification,
not predicted in advance; fixed by widening the back equally
(`TANK_BACK_NECKLINE`). `regression.test.ts`'s tee/fitted export baseline
moved for only the second time ever (the first was Slice 45's tech-pack
page) — the old bytes encoded the exact bug being fixed, so keeping them
"unchanged" would have meant keeping the bug. Extends rule 2 with a
corollary: verification against a claimed source of truth is only as good
as that source — when the source itself is suspect (a formula nobody has
independently checked against a real reference), verify the source too,
not just the sync to it.

**Slice 63 extends the principle again, from geometry to the measurement
surface itself.** Two findings, both from verification, neither assumed
going in. First: `necklineEdge()` and `sleevelessArmhole()` both compute
"warn, never clamp" guidance notes, and NOTHING in the codebase was reading
either — every caller destructured `notes` and dropped it. Harmless while
every neckline parameter was a fixed recipe constant nobody could push out
of range; it stops being harmless the moment a parameter is a live slider.
Fixed for the tank specifically (`tankGuidance` now recomputes and surfaces
both), flagged as a real gap for every other neckline call too, not fixed
wholesale here. Second, and the bigger one: the render preview views
(`render/body.ts`/`render/garment.ts`) were still drawing the tank's
shoulder corner at the full sleeved `shoulderHalf` — the exact "preview
doesn't match the real pattern" gap Slice 61 fixed for the neckline, simply
never checked for the strap because the strap didn't exist as a concept
before this slice. Fixed proactively, before being told a third time.
Separately, a real product decision from Kshitij reshaped the slice's
scope mid-flight: rather than the engine resolving
`docs/research/garments/TANK-RESEARCH.md`'s open
strap-width question by picking a winner, `strapWidth` and `neckDrop` both
shipped as genuine user-adjustable measurements — joining `Measurements`
itself, with the same plausibility bounds, UI slider, and save/load support
every other field gets. The standing principle going forward: no garment
dimension gets hardcoded to a single value when the person could reasonably
want a different one; the guidance engine's warn-never-clamp checks are
what keep an extreme combination visible, not an engine-side ceiling on the
input itself. This is why `sleevelessArmhole()`'s guardrails exist and why
Slice 63 made sure they actually reach the person, not just compute.

**Maintainer clarification after Slice 63:** this principle applies to every
meaningful garment aspect, not dimensions alone. Prefer user-adjustable
parameters with explicit, actionable compatibility guidance. Do not silently
clamp or replace an invalid combination. Slice 64 promoted Tank neckline width
from a recipe constant to a user control. The durable decision record is
`docs/PROJECT-DECISIONS.md`.

**Slice 64 closes that Tank follow-through.** `neckWidthEase` is a finished
linear adjustment applied to the derived front and back neckline widths; its
guardrails explain how to correct an incompatible value. `sleevelessArmhole()`
is the single source for Tank armhole geometry, and `armholePathCommand()`
translates its line/curve edge into both body and assembled previews so visual
evidence cannot drift from the drafted piece. `GarmentRecipe.techPackForFabric`
allows materials and construction to follow the selected fabric family while
preserving a recipe's default pack for callers that have no fabric selection.

**Slice 65 makes those controls legible in use.** Body-view hover metadata now
owns Tank strap, armhole, and neckline regions with the same exact paths as the
silhouette. Controls expose finished chest/hip totals beside the user-owned
ease input. The `fitted` recipe id remains stable for saved data, while its
product label is `Darted tee` so construction method is not confused with a
style target such as `Fitted tee`.
