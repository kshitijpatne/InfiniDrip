# InfiniDrip — Confirmed project decisions

## EPIC-18/G05 — next capability Epic admitted (2026-10-12)

After reconciling the completed EPIC-17/G04 work and the latest UIQ-08/UIQ-01
checkpoint, the maintainer asked to identify the next completed-work boundary,
choose the next goal from current facts, and proceed. EPIC-18/G05 Living
production tech pack is the next numbered capability Epic: EPIC-17 is closed,
EPIC-18's EPIC-15 prerequisite is Done, and the roadmap requires a separate
admission. Start from verified `origin/main`
`e9221ea5033ccfdd91bf1ebb353926f189477d75` in isolated Slice 762. The exact
scope, T01–T05 ordering, acceptance evidence, non-goals, holds and gates are
in `docs/planning/EPIC-18-ADMISSION.md`; the active S765 execution addendum is
`docs/planning/EPIC-18-S765-RESEQUENCING.md`, and the resumable ledger is
`docs/planning/EPIC-18-GOAL.md`. The original 19-slice conditional baseline
was extended by a separately numbered S765 correction after review found a
missed nested package-copy revision link. S765 is complete: package copies
remap inherited-source links that point into copied history and preserve
external provenance; its focused coverage and export-identity gates passed.
The current conditional sequence is 762–781 and preserves all acceptance
gates. S766 started In Progress from S765 commit
`af6191ed8bb465a59da089ec8362ca5741c28d0a`. Its bounded T01 revision-payload,
strict historical payload-v1, and concurrency-safe save contract is in
`docs/research/epic18/S766-T01-revision-payload/start-packet.md`; validated
start evidence is recorded at board revision 4553.

S766's compatibility tests confirm that immutable v2 revision identity covers
all authored T01 content while scoped review approval and its activity
timestamp remain mutable overlays on the live style record. A content/design
revision binds a new T01 child and resets review to DRAFT. The overlay is
excluded only from equality checks against the immutable authored snapshot;
the v2 payload itself still digests the complete T01 record captured when the
revision was created. This preserves the existing review/restore contract
without making authored T01 facts mutable.

S766 completed with five changed production modules at 100% statement,
branch, function and line coverage across 316 focused tests; TypeScript,
Control Center 42/42, protected export identity 9/9 and diff hygiene passed.
Validated exit evidence records board revision 4555. The validated G05-T01
sequence-description correction is recorded by
`docs/planning/EPIC-18-G05-T01-SEQUENCE-UPDATE-BOARD-COMMAND.json` at current
board revision 4556. S767 is next for T01 editing and all-recipe rendered
proof; the full landed S766 SHA is recorded in the S767 start packet.

UIQ-09 remains Backlog pending its EPIC-19/G06 admission and accepted
starter/source contracts; it is not this next goal. UIQ-10 is already linked
to EPIC-18 on the board and therefore must be Done before Epic closure. It
remains Backlog until a separate bounded admission after T01–T03, originally
planned at S773 and moved to S774 by the S765 correction; do not unlink it or
treat general G05 admission as its presentation authorization. No new garment,
physical sample/fit, supplier contact, paid
tool/service, production release, or production-readiness claim is admitted.

## UIQ-01 — close the fulfilled G04 review checkpoint (2026-10-12)

Slice 354 recorded the approved recommendation dispositions against G04; Slices
368 and 418 revalidated those dispositions without changing G04 acceptance,
holds, V02/V03 ordering, or UIQ dependencies. After the S732 G04 closeout, the
maintainer authorized reconciling the stale UIQ-01 Backlog card. Close it as
Done with the existing verified G04 evidence plus the Slice 761 reconciliation
record. This is review/admin closeout only, not a new shipped UI feature. UIQ-09
remains the next ordered package but cannot start until EPIC-19 is explicitly
admitted and the required starter/data scope is accepted.

## UIQ-08 — solid inspection-toolbar integration admitted (2026-10-12)

After the isolated UIQ-08 candidate and candidate-only deployment closeout,
the maintainer said “proceed with next goal,” separately authorizing integration
of the Codex-reviewed solid, opaque grouping into the existing inspection
toolbar. Do not carry glass/translucency into the app: rendered review found no
benefit in its normal-flow position. Use embedded `uiq_inspection_toolbar` with
an exact legacy fallback; it has no remote switch, so rollback requires a code
default change and redeployment. The exact boundary and gates are in
`docs/planning/UIQ-08-INTEGRATION-ADMISSION.md`. No other UIQ, geometry, export,
data, network, baseline or launch-cost scope is admitted.

## EPIC-17/G04 — S732 closeout verified; no additional CAD software

The maintainer-approved S726 V03 evidence definition remains unchanged and
complete. The user vetoed the proposed paid Gerber AccuMark route; that
suggestion is withdrawn. No paid application, new receiver, or further CAD
trial is required. PR #17 contains the reviewed G04 tree and PR #18 corrects
the missing lockfile-matched Playwright Chromium prerequisite. Both are merged;
main workflow `38141301239` passed tests, production build, deterministic
artifact proof, and Pages deployment. A live production browser run exercised
Garment → Measure → Style → Check → Export and the return-audit accepted the
hash-bound XL source package and reviewed LibreCAD return at 0.000000 cm with
zero browser errors. S732 records 158/158 files, 2,366/2,366 tests, and 100%
statements/branches/functions/lines. V03 remains the exact S726 empirical
profile claim, not an industrial, ANSI/AAMA/ASTM, universal DXF, physical-fit,
factory-acceptance, or production-readiness claim. The final S732 closeout PR
and its main workflow are the remaining administrative integration step.

## Prior completed decision — S726 V03 sampling correction / S730 repository hygiene

The maintainer directed Codex to correct V03's acceptance logic and finish
using already installed tools, without another paid receiver. S726 replaces
receiver sampling by every normalized coordinate shape with sampling by each
distinct serialized DXF exchange-structure/semantic class. The product-side
gate still covers all seven recipes, all supported options and five sizes
(365/365 source packages). Ten selected receiver fixtures cover all ten
observed exchange-structure classes; a Trouser XL boundary return adds an
explicit non-default grade check. All 11 exact saved/reopened returns pass the
unchanged 0.001 cm source-bound audit and have rendered review. The 315
normalized coordinate signatures are not claimed as individually round-tripped.

The only compatibility claim is for LibreCAD 2.2.1.5 / Drawing Exchange DXF
2000 and the exact 11 audited/reviewed returns. LibreCAD is generic CAD; the
menu/file label is not evidence of ANSI/AAMA/ASTM conformance or industrial
apparel certification. Keep identity, units, CUT/SEW, typed marks, readable
output, repeat evidence, product-side malformed-input rejection, legacy DXF,
protected export identities, and every release gate unchanged. The detailed
evidence is in the S726 exit packet. No software purchase/install or further
receiver trial is in scope. S727's integrated coverage attempt failed on a
Node/Vitest discovery mismatch, an omitted Trouser measurement inventory row,
and tests carrying superseded pre-S459 expectations. S728 repairs those exact
items and checks Woven open-vent topology fail-closed. Its settled integrated
gate passes: 158 files/2,366 tests at 100% global coverage, production and
Electron builds, Control Center/web release checks, all 73 options/146 faces,
zero named-layer text overlaps, and packaged Electron output parity and
fail-closed cases. The S728 packet links exact logs, hashes and rendered
evidence. V03 acceptance and the receiver claim remain exactly as approved.
S729's final-diff audit discovered thousands of historical render/diagnostic
artifacts in the repository. S730 archives 6,390 unreferenced files
(409,943,310 bytes) to C: after hash verification and retains all 81 required
inputs. The cleaned-tree full coverage gate passes at 100% (158 files/2,366
tests), with build, packaged Electron, focused release suites and Markdown-link
audit passing. No new or paid software is needed. S724/S726 acceptance and the
passing S728 integrated evidence are unchanged. S730 results are in
`docs/research/epic17/S730-repository-evidence-hygiene/S730-exit-packet.md`.
The goal and Epic remain In Progress through PR/merge, ancestry, deployment
and production E2E.

## EPIC-17/G04 — S725 package layout and remaining empirical evidence

S725 establishes that the Trouser receiver's apparent crossings were caused
by tight candidate-page spacing: source and return have nine pieces and zero
inter-piece segment intersections. The opt-in interchange drawing now uses a
5 cm gap for Trouser only; other recipes and the legacy writer keep 2 cm. The
actual LibreCAD 2.2.1.5 / DXF 2000 saved return passes with 0.000 cm geometry
delta, 9 pieces, 18 outlines, and 103 marks. All ten selected receiver outputs
were visually reviewed. The source-side option-by-grade package matrix passes
365/365. This is bounded empirical evidence, not a DXF standards or industrial
CAD claim.

The remaining V03 work is evidence reconciliation, not another software
trial: derive normalized geometry/topology classes from current package
geometry, map existing selected fixtures to those classes, and document the
precise LibreCAD license/rights basis, version, local workflow, and claim
limits. Add no fixture unless an uncovered material class requires one. Keep
the all-seven/options/grades, 0.001 cm, identity/marks/units, repeat,
readability, malformed-input, legacy-byte, protected-export, and release
gates unchanged. See the S725 exit packet.

## EPIC-17/G04 — S724 corrects V03 breadth measurement

The maintainer directed Codex to correct V03's receiver/acceptance logic and
finish with installed tools, with no paid receiver or additional software.
S724 established that the “73 option/grade rows” are 73 M-size option
scenarios. The revised gate keeps all seven recipes, every supported option
and grade size, the 0.001 cm contour limit, protected export identities and
all release gates. Product-side source-package verification must cover every
supported option across every grade size. Actual LibreCAD round-trip evidence
is a precise empirical profile with representative fixtures for each distinct
serialized DXF exchange-structure/semantic class across all seven recipes,
plus a non-default grade-boundary fixture; it must not imply that every CAD UI
row or normalized coordinate shape was imported. Grade/options/stitch relations
that live in the digest-bound manifest are product-package guarantees, not
claims that LibreCAD interprets those fields. Every claimed receiver fixture
still needs exact geometry, units, piece identity, marks, repeat and
readable-output evidence. S723's crowded/crossed Trouser return is a V03
readability issue, not a V02 failure. See the S724 exit packet. No standards,
industrial, physical-fit, factory or production-readiness claim follows.

## EPIC-17/G04 — S722 replaces the industrial receiver gate

The maintainer directed completion using already installed CAD tools and
rejected further paid software. The “industrial CAD receiver/profile” gate is
replaced by an exact named/versioned empirical DXF compatibility profile
proved through actual import/export/reopen and source-bound audits. This does
not claim ANSI/AAMA/ASTM conformance or factory acceptance, and does not make
every installed application a required supported receiver. Compatibility is
claimed only for a named app/version after its evidence passes.

No fidelity gate is relaxed: all seven recipes and 73 supported
option/grade configurations, `0.001 cm` geometry, centimeter units, piece/
revision/grade and stitch identity, CUT/SEW, typed marks/grainlines, malformed
input fail-closed behavior in the product, repeatability, readable output,
legacy DXF, protected byte identities, and final integrated release gates stay
required. LibreCAD 2.2.1.5 DXF 2000 is the leading candidate only; S708/S710
prove one Polo M fixture, not V03. S721's paid AccuMark candidate is expressly
withdrawn and must not be pursued. No purchase, installation, supplier contact
or new software is authorized or needed. See S722's packet for the exact
profile decision and verification plan.

## EPIC-17/G04 — S707 layer-table correction did not preserve CUT (2026-10-11)

S707 added a complete R2000 LAYER table to the opt-in named-piece package and
ran its one planned LibreCAD 2.2.1.5 Drawing Exchange DXF 2000 save/reopen.
LibreCAD retained the `CUT` table entry and all nine named identities, exact
geometry, 111 typed marks, centimeter units and visible output, but saved all
nine CUT outline entities on layer `0`. The layer-table-only hypothesis is
falsified for this receiver route. Do not repeat or vary this route. LibreCAD
remains generic CAD and does not satisfy the industrial-apparel profile gate.
No V03 criterion, threshold, geometry or legacy export identity changed.
Exact result: `docs/research/epic17/S707-candidate-layer-table/S707-exit-packet.md`.

Next: S708 audits the current candidate writer against the already-existing
CLO/LibreCAD input and output files to find the concrete entity-level source
of CUT reassignment. No app search/install or receiver variation is authorized
or needed for that audit. Implement only if the measured evidence supports a
precise code correction; keep every acceptance gate unchanged.

## EPIC-17/G04 — S706 LibreCAD current-package route stopped (2026-10-11)

The exact S705 Polo M candidate was saved and reopened once in LibreCAD 2.2.1.5
using Drawing Exchange DXF 2000. S706 found 9/9 piece/revision identities,
18/18 closed CUT/SEW outlines at 0.000 cm XY residual, 111/111 typed marks
within 0.001 cm, `$INSUNITS=5`, and a visible reopen. The returned drawing
renamed the semantic `CUT` layer to `0`; the route is also generic CAD, not an
industrial apparel profile. This route does not satisfy V03 and must not be
repeated or varied. No source geometry, legacy export, threshold, or acceptance
changed. Exact evidence is in
`docs/research/epic17/S706-librecad-r2000-current-package/S706-exit-packet.md`;
CAD files and render remain under `C:\G04-CAD-Interchange\S706-librecad-r2000-current-package\`.

Next work is a source-side comparison of the exact S703 CLO DXF-ASTM and S706
LibreCAD returns with the current candidate writer. Continue implementation
only if existing entity evidence supports a precise source change; do not
search for or install another receiver. V03 acceptance and every fixed gate
remain unchanged.

## EPIC-17/G04 — approved empirical grainline profile trial (2026-10-10)

The maintainer approved the source-derived, additive `idr-pattern-exchange/2`
grainline convention: emit one `LINE` on `GRAINLINE` inside each same-identity
piece block, using each recipe's existing grainline rule and current CUT
geometry. This authorizes a bounded Polo M DGS re-import with the frozen
`VID:20250610`/`AUTOCAD` route and settings, followed by implementation only
if the trial and other evidence support it. Preserve every existing DXF
entity, source geometry, identity, unit, mark and legacy writer behavior. This
is an empirical vendor-specific candidate; it does not claim ASTM/AAMA
conformance, clear a V03 gate, or relax the all-seven/options/grades,
`0.001 cm`, malformed-input, repeatability, round-trip, output-readability,
rights or protected-byte-identity requirements. Evidence: S662/S663 packets
and the approved trial recorded at the S663 boundary.

## EPIC-17/G04 — GetonAgain free desktop evaluation authorization (2026-10-10)

The maintainer confirms they have written confirmation that GetonAgain may be
used for this product-development evaluation and that its DXF handling may
remain local. They authorize acquiring/installing/running the official
GetonAgain Garment CAD Free Version only if it is genuinely free and necessary.
The official Free Version page labels a downloadable free desktop route. It is
necessary to test only after the other concrete route, CLO 2026.1.310, failed
repeated Polo geometry/mark/negative-input checks and generic OpenCAD R14 was
shown insufficient as an industrial apparel profile. Stop if the official
download requires payment or its DXF path is online-only. Verify exact installed
build, input dialect and local DXF route before importing any G04 fixture.
This permission does not select/qualify a profile or relax any G04 gate, and
is not an independent legal opinion. Keep files under a named C: exchange
folder; do not use the separately advertised GetonAgain online version.
Official product/free/online pages and S650 evidence are in
`docs/research/epic17/S650-getonagain-rights-locality-screen/`.

## EPIC-17/G04 — GetonAgain candidate is not yet authorized (S647)

First-party GetonAgain materials identify Garment CAD V2024.1 as apparel CAD
with ASTM/AAMA DXF import/export and advertise a 15-day trial. S647 found no
first-party confirmation that the trial permits InfiniDrip product-development
interoperability testing or that DXF files are processed locally. The vendor
also advertises a cloud converter for other CAD formats. Do not install/run
this new product or import G04 fixtures until the maintainer explicitly
authorizes use of the candidate and trial rights/local file handling are
confirmed. This does not reopen the confirmed CLO 2026.1.310 local-trial
authorization. See `docs/research/epic17/S647-getonagain-profile-candidate-screen/`.

## EPIC-17/G04 — CLO trial-use and local-processing confirmation (2026-10-08)

The maintainer confirms that written confirmation covers both use of the
existing CLO 2026.1.310 trial for InfiniDrip product-development DXF evaluation
and local processing of imported/exported DXF files. Treat these two concerns
as settled for the bounded local evaluation and do not ask the maintainer to
reconfirm them. This record reflects the maintainer's report; it is not an
independent legal opinion and does not establish an industrial profile,
conformance, receiver acceptance, or permission to send patterns to CLO-SET,
CONNECT, or another hosted service. Continue to keep exchange files under the
named `C:\\G04-CLO-DXF-Exchange\\<slice-folder>` paths and preserve all V03
geometry, semantic, grading, negative-input and round-trip gates.

S538's current-window check found a mismatch between the visible CLO
screenshot and accessibility's Export DXF dialog report. No file operation
was attempted from that inconsistent state. This control limitation does not
reopen the settled authorization decision or establish a CLO format failure.

## EPIC-17/G04 — CLO AAMA round-trip result recorded (S516)

On 2026-10-08, the already-running CLO 2026.1.310 trial was used once through
the visible UI for an AAMA import/export/re-import of the pinned Polo M
fixture. The output rendered and its nine source sewing outlines map to nine
receiver blocks, but five CUT contours each lose one vertex; exact-segment
deviation witnesses of 0.01019–0.01118 cm exceed the unchanged 0.001 cm gate.
This is concrete evidence that this tested local profile path does not meet
Polo cut fidelity. Do not repeat the same test, infer industrial-profile
conformance, select CLO as the rights-cleared receiver, or alter acceptance
from this trial. V03 still requires all-seven fixtures, grade/mark/layer and
negative-control evidence, rights review, and a passing representative
round-trip. Keep CLO running during G04 and close it only when the admitted
goal is complete. See the S516 exit packet.

## EPIC-17/G04 — Bounded local CLO evaluation authorization (S503)

On 2026-10-08, the maintainer explicitly authorized practical DXF
import/export evaluation using the existing installed and signed-in CLO
2026.1.310 trial. This authorization covers the requested local test files and
captures only under `C:\\G04-CLO-DXF-Exchange\\<named-slice-folder>`; it does
not authorize CLO-SET/CONNECT or other cloud uploads, paid access, new
installation, or account changes. Close CLO normally when the test no longer
needs it. This bounded evaluation does not clear the separate receiver-rights
review, authorize a commercial-use claim, establish an industrial exchange
profile, or relax any G04 geometry, mark, grading, negative-input, round-trip,
all-seven, or export-identity gate.

On 2026-10-08, the maintainer clarified that CLO is an ongoing session for the
current G04 work: do not close/reopen it between slices or access attempts;
keep it running while it is still needed, and close it normally once when the
whole admitted goal is complete. The user requested a single defined practical
plan with no redundant reruns. S514's one supported recovery produced a
concrete capture mismatch (CLO target/accessibility paired with a Codex
screenshot), so no input or file operation followed. This is a desktop-helper
failure, not evidence of CLO format failure. The next practical operation is a
single instrumented C:-confined AAMA export/reimport pilot only when the CLO
surface can be visually verified, under the already granted S503 local-trial
authorization. That technical trial does not clear the separate V03
receiver-rights/profile-selection gate. Previously tested Standard cases and
the AAMA-import/ASTM-export matrix are not to be repeated. The S503
authorization's C:-only/no-cloud/no-paid-access/no-install bounds still apply.

## EPIC-17/G04 — CLO API profile source refresh (S515)

On 2026-10-08, current official CLO docs were rechecked. SDK 11.0.0 is listed
for 2026.1.224, not installed 2026.1.310. `ImportDxfOption` has no documented
profile field; `ExportDxfOption.m_ExportDXFFormatType` remains an unmapped
integer. The documented path-only `ExportDXF(path)` opens the options dialog,
so a visible UI profile can be selected without guessing the integer in the
bounded S503 local trial. This does not clear V03 receiver-rights/profile
selection, and safe visual control of the running CLO window is still needed.
Do not repeat already measured Standard/AAMA-import→ASTM-export cases or
download/install the mismatched SDK.

## EPIC-17/G04 — Woven technical-flat display decisions confirmed 2026-10-08

The maintainer approved these view-only decisions for G04 V02:

- On Woven FRONT_FLAT, mask the exact revision-bound `front.neckline` seam strokes only where the same-revision `underCollar` or `upperCollar` fills cover them. Preserve the open-V segment and all source geometry, stitches, POMs and revision identities. This supersedes S425's decision to keep the full neckline visibly continuous across the projected collar silhouettes. It does not assert a physical notch or source seam termination.
- On Woven BACK_FLAT, use the measured local-Y sleeve reflection and move only the two source-scale detached sleeve-band view details outward to clear the sleeve silhouettes. This supersedes S442's decision to keep S370 band positions fixed. It is a view convention; it does not establish source sleeve handedness or authorize cut/stitch geometry edits. The measured displacement is 20.5737–22.4315 cm per side and viewBox width increase is 41.1474–44.863 cm.

Slice 457 implements and verifies both decisions across all 28 Woven options; S459 accepts the integrated seven-recipe V02 review across 73 configurations / 146 front-back views. See `docs/research/epic17/S457-woven-front-back-resolution/S457-exit-packet.md` and `docs/research/epic17/S459-integrated-v02-acceptance-review/S459-exit-packet.md`. G04-V02 is Done. The exact approved S351 Polo exception applies only to its mapped same-revision sleeve-ease relation; the numeric 0.25 cm gate remains for all other relations. V03 remains gated on rights-reviewed receiver/profile selection and witnessed round-trip proof. No physical, factory, or production-readiness claim follows.

_Confirmed directly by Kshitij on 2026-09-10 after the Slice 63 handoff. These
decisions resolve the open questions recorded in that handoff._

## Intended audience — confirmed 2026-09-22

InfiniDrip is intended for both home sewists and DIY makers, and independent
designers and patternmakers. This is the approved audience framing; it is not
evidence of a user study, physical fit, or production validation.

## Development sequence

The required sequence is:

1. Slice 64: perform the Tank rework reality-check.
2. Fix every real-world failure found by that review before moving on.
3. Build the polo end-to-end.
4. Complete Phase C3.

Do not begin polo before the Tank reality-check and any resulting fixes are
closed. Do not move Phase C3 ahead of the polo without a new maintainer decision.

## Physical validation

No physical garment validation has occurred yet. No garment drafted by InfiniDrip
has been confirmed by cutting, sewing, and fitting it on a real body. This remains
the project's highest product risk and must not be represented as complete.

Physical sampling is currently on hold at the maintainer's request because no
manufacturer or printer is available. Do not suggest or schedule physical
sampling, sewing, or measurement validation unless the maintainer explicitly
reopens it.

## Polo V1 — confirmed 2026-09-11

- Construction is **collar plus stand**.
- Base is the loose tee with the current tee sleeve.
- Placket is visible, clean, folded, uses the same body knit with lightweight
  stabilizer, and finishes at 14 cm long × 3 cm wide.
- It has exactly three buttons at 3.5 cm centre-to-centre.
- Meaningful polo dimensions must be user-adjustable with guardrails.
- Finished collar stand: 2 cm default, adjustable 1–3 cm.
- Finished pointed collar leaf: 5 cm default, adjustable 4–7 cm.
- Button centres are 3.5 cm, 7.0 cm, and 10.5 cm below placket top.
- Side vents are excluded from V1.

The build contract and researched construction evidence live in
`research/garments/POLO-RESEARCH.md` and `planning/POLO-V1-SCOPE.md`.

## Garment research

`docs/research/garments/TANK-RESEARCH.md` is durable project documentation.
Every future garment must have an equivalent research document created before
implementation. Each document must record sources, construction rules, conflicts
between sources, estimates, product decisions, and unresolved questions.

## Adjustability and guidance

Tank neckline width must become user-adjustable.

The broader product principle is that every garment aspect should be adjustable
where meaningful. Validity must be protected through guardrails rather than
hidden limits: invalid or incompatible combinations must remain visible and be
detected by the guidance system, which must explain the problem and offer
actionable corrections. Do not silently clamp or replace a user's selection.

## Code signing

Code-signing procurement and implementation have not started.

## Resource-document lineage

`docs/research/ASSET-RESOURCES.md` is the refined, analyzed successor to
`apparel_design_resources.md`. They serve the same purpose. The legacy document
is retained only for provenance and should not be used for current decisions.

## Open-source due diligence — confirmed 2026-09-17

Repository research must go below README-level synthesis. Before a dependency,
port, algorithm, schema, asset, dataset, or implementation idea reaches the
roadmap, verify the exact license and transitive obligations, inspect source and
tests, compare it to actual InfiniDrip behavior, and pressure-test user value,
scalability, maintenance, hidden dependencies, failure modes, and overlap.
Rejected repositories remain in a reasoned ledger rather than disappearing.

Permissive licensing is necessary but not sufficient. No-license sources are
not code-reuse sources; GPL code requires a deliberate distribution decision;
noncommercial data is not usable for the intended commercial product; and a
list's license never clears everything it links. Pattern formulas must also have
clean subject-matter provenance rather than relying on code licensing alone.

Accepted external technology must use the smallest reversible boundary, retain
InfiniDrip-owned validation and deterministic fallback, and preserve pure
drafting, visible-invalid/actionable guidance, 100% coverage, rendered/parsed
verification, and the eight export hashes unless a separately documented and
approved baseline decision says otherwise. An optimizer or linter never proves
physical fit. Full decisions live in
`docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md`.

## Planning decisions confirmed 2026-09-12

- Phase C3 includes a visible Side view. Its initial contract remains
  render-only unless a genuine measurement/data requirement is separately
  approved.
- Edit remains preview-only through Phase 5. A later cross-garment final
  design-editing system must define durable overrides, persistence,
  size/grading semantics, downstream validation, and export behavior first.
- The first woven shirt is a reusable relaxed short-sleeve button-up block with
  a point collar and separate stand, front button placket, back yoke, one simple
  patch pocket, turned sleeve cuff/band, curved hem, small side vent, and six
  or seven evenly spaced buttons. Spacing must become research-derived and
  adjustable. Long/two-piece sleeves, sleeve plackets, complex cuffs, multiple
  pockets, pleated backs, princess seams, decorative details, and Polo V2
  changes are deferred.
- The woven shirt is a digital component-library milestone. Do not schedule or
  suggest physical validation unless the maintainer explicitly reopens it.
- The first trouser is a reusable relaxed casual straight-leg block with a
  separate waistband, simple front closure, and minimal pocket construction.
  Its rise, crotch, seat, waistband, grading, and fit logic should support
  later shorts and joggers.
- Surface design is a separate later Epic after the trouser block.
- OpenCode is preferred for higher-volume research, documentation, UI polish,
  export QA, and test expansion. Claude Code is preferred for shorter,
  high-signal tasks. Codex retains geometry, drafting, garment architecture,
  shared pipeline, data model, grading, exports, physical-validation
  decisions, final review, and integration.

## Refined forward Epic plan

### Woven-shirt button count clarified 2026-09-12

The six or seven evenly spaced buttons are on the front placket. The collar
stand has one additional button. The maintainer confirmed this during Slice 85;
UI, BOM, pattern marks and reports must agree.

### Epic 1 — Phase C3 croquis and views (Slices 80–84)

Complete upper/lower croquis routing, expose the visible Side view, add
cross-garment front/side/back render-contract tests, prove croquis remains
outside drafting, grading, checks, nesting, and exports, then run the C3 exit
gate and update durable context.

### Epic 2 — Phase 4 reusable woven shirt (Slices 85–93)

Research and document the block; define construction and component contracts;
implement the bodice, point collar/stand, placket, button spacing, back yoke,
pocket, sleeve band, curved hem, side vent, recipe integration, and complete
digital gate. Narrow research, documentation, focused tests, and export QA
may be delegated; geometry, drafting, architecture, data-model, grading, and
exports remain Codex-owned.

### Epic 3 — Phase 5 trouser block and later surface foundation (Slices 94–103)

Research and define the reusable trouser measurement/ease, rise, seat,
waistband, grading, closure, and pocket contracts; implement and verify the
straight-leg trouser; define the later shorts/jogger relationship; then keep
surface design independent from unfinished garment geometry.

Every slice must state scope, acceptance criteria, non-goals, dependencies,
ownership, recommended model/reasoning, whether the drafting/data model must
change, and applicable verification gates before work starts.

### UI bug-fix phase before Epic 3 — confirmed 2026-09-12

Before starting Epic 3, the maintainer inserted a dedicated `BUGFIX` phase for
the Slice 93 UI/UX audit. It is split into three sequential tagged epics:
`EPIC-BUGFIX-P1` for correctness and trust, `EPIC-BUGFIX-P2` for usability and
interaction, and `EPIC-BUGFIX-P3` for polish and discoverability. The durable
records and phase rules live in `docs/BUG-LEDGER.md` and
`docs/planning/BUG-FIX-PHASE.md`.

Every bug record must retain a stable ID, separate severity and priority, the
observed reproduction, root cause, fix slice, commit/PR reference, tests, live
or rendered evidence, and closure status. No record may be removed merely
because it was fixed or reclassified. Epic 3 is gated on the three bug-fix
epics' exit reports and the normal 100% coverage, typecheck, production-build,
parsed-output, and legacy-export-identity gates. Physical validation remains
deferred.

## Numeric editing — confirmed 2026-09-12

Measurement and related numeric edit fields use a shared direct-entry plus
click/hold +/- control. The decrement action is on the left, increment on the
right, and native browser number spinners are hidden. A compact Boundary Rail
shows each control's declared lower and upper endpoints and the current value's
position without adding instructional copy. Manual invalid values remain raw
and visible to guidance; only an explicit +/- recovery action moves an invalid
or empty value to a declared boundary. The same interaction applies to every
garment's measurements, recipe-owned numeric options, nesting fabric width,
and open-ended exploratory Edit coordinates (which show open endpoints rather
than invented limits). This is a UI contract only and does not alter drafting,
grading, persistence, exports, or physical-validation status.

## Epic 4 — Component Architecture and Garment Grammar — confirmed 2026-09-13

- The full Priority 1 package is in scope: component architecture, structural
  primitives, and the shared render-only croquis/Side-view library.
- Epic 4 delivers the internal architecture plus one narrowly scoped
  user-facing composition proof. It does not deliver a general-purpose
  configurator or a new garment family.
- Components own geometry and named interfaces; composition owns
  dependency-ordered assembly and seam matching; options are scoped to their
  owning component; downstream consumers read the composed result.
- All seven current recipes — Tee, Fitted tee, Tank, Polo, Woven shirt, Skirt,
  and Trouser — must migrate through the shared grammar. The eight legacy
  export hashes remain unchanged, and the other existing outputs require
  semantic/rendered parity.
- No new garment family is added. An existing garment or variant is the proof
  vehicle when a real composition consumer is needed.
- Edit remains preview-only through Phase 5; surface design, physical
  validation, and production-readiness claims remain outside this Epic.

## Epic 5 — Beginner-facing UI/UX redesign — authorized 2026-09-13; exit confirmed 2026-09-19

The maintainer requests research before implementation and a thorough redesign
from first launch to final export, not isolated cosmetic fixes. The supplied
screenshots establish long measurement panels, a separated assembled preview,
cluttered controls/progress/export layout, weak garment/color/style selection,
distant guidance, and missing field highlights as priorities. Codex must also
find additional issues through actual use, current competitor tools, public
forums, image/video references and historical usability research.

The requested behavior includes keeping controls and the active design visible
together, a reversible in-canvas Assembled toggle, stage-relevant disclosure,
clearer save/load consequences, contextual exports with size first, richer
color/texture/shine editing, and actionable field/seam-linked guidance. Ignored
suggestions remain visible for reconsideration in Check. That request does not
authorize suppressing invalid input or failed geometry into a passing result.

The implementation must preserve all existing garments/features, clean reusable
code, meaningful tests, the full project gate, and unchanged legacy hashes.
Usage-limit pacing and supported quiet autonomous continuation remain required;
no reset credit/account-allowance changes are authorized. No physical sampling
or physical-fit/manufacturing guarantee is authorized. Exact researched design
choices and their verification live in the new UX execution/research records.

The actual history confirms that Epic 4 closed at `816b9ff` (Slice 113) before
Slice 114 began this separate workstream. Slices 114–121 are therefore Epic 5,
not a reopened Epic 4 migration. Epic 5 exits only after the full project gate,
parsed output consumers, eight unchanged legacy hashes, rendered/live seven-
garment matrix, responsive evidence, and durable records pass. The final
accessibility trial uses `axe-core` only in development tests; jsdom's
layout-dependent color contrast is reviewed manually in the live browser. No
physical-fit or production-readiness claim is permitted.

## Epic 6 — Surface design — completed 2026-09-20 (originally confirmed 2026-09-19)

Surface design is an additive layer for prints, patches, colour blocking, and
fabric-preview decoration. It sits above existing pattern pieces and never
modifies drafting geometry, grading, POM checks, nesting, cutting files, or
legacy export bytes when placement is empty. Epic 6 is complete: the headless
contract, Style-panel wiring, optional save/recovery section, true-scale
artwork-space preview, opt-in calibrated print sheet, tech-pack placement
specification, warn-only invalid-entry guidance, and seven-garment exit audit
are merged to `origin/main`.

OpenCode PRs #1–#4 are the reviewed Slices 122–125 batch. Their original base
was the Epic 4 exit, so they are integrated only after review on top of the Epic
5 exit. Slice 123 is intentionally narrowed to the pure placement model and
validation boundary; persistence and Fabric.js SVG-fidelity proof are explicit
Slice 126 stop conditions, not silently assumed complete. Invalid placement data
stays visible to future guidance rather than being clamped. Non-finite or
non-positive resolution inputs are unratable. Surface preview is flat artwork
placement and makes no physical-fit, drape, sewability, manufacturing, or
production-readiness claim.

Piece clipping/on-piece anchoring remains explicitly blocked: Slice 130 defines
a digital cut-box-centre anchor for measured guidance, but it does not clip or
reposition artwork on the garment. Actionable out-of-bounds, low-resolution,
and full-coverage warnings are now implemented as warn-only digital checks;
they do not gate exports or assert physical fit, print quality, sewability,
manufacturing, or production readiness. Fabric.js was proven in a scratch
round-trip but not added because the shipped numeric-control/string-SVG
consumer needs no canvas dependency; any future direct manipulation must
re-verify the then-current version and license before adoption. Embroidery
machine formats, 3D/VTO, signing, packaging, and physical validation remain
outside this Epic.

### Epic 6 Slice 130 — accepted digital contracts

1. Piece-space anchor: artwork centres sit on the named piece's true-scale
   cut-box centre plus the placement offset, evaluated at base size. Any
   artwork corner outside that box warns; edge-touching counts as inside.
2. Print floor: 59 px/cm, derived as `floor(150 / 2.54)`. It is a warn-only
   digital floor; placements without source dimensions are unratable and never
   warn.
3. Full-coverage warning: artwork-to-piece cut-outline area ratio `>= 1`.
   This is a containment/intent cue, not a production ink budget.
4. Source pixel dimensions are optional persisted placement fields. Missing
   dimensions remain unknown rather than failing validation, with no save-format
   version change.

## Epic 7 — Nesting Intelligence Pack — authorized 2026-09-20

Epic 7 is an additive enhancement around the existing deterministic
`nestPieces` shelf estimator. It may expose utilization-derived waste percent,
optional fabric-on-hand fit/shortage, a cutting buffer, and a truthful
directional/nap assumption. It must not change drafted geometry, shelf-pack
placement truth, grainline behavior, export writers, or the eight legacy hashes.

- Cutting buffer: default `10%`, editable `0–50%`, step `1%`; it changes only
  the displayed/planned required length, not the raw estimator result.
- Fabric-on-hand length: optional positive centimetres; blank means unknown and
  must not display a false fit verdict.
- Directional/nap flag: default `true`; advisory only because the current
  estimator already keeps grain upright and never rotates or interlocks.
- Difficulty rating (roadmap 0.5.8), Sparrow/irregular nesting, rotation,
  interlocking, physical validation, and production claims are explicitly out
  of scope.
- New planning values use an optional additive save/recovery section so old
  payloads remain loadable without a format-version bump. Raw invalid direct
  entries remain visible and receive actionable guidance; no silent clamping.

OpenCode owns isolated implementation Slices 132–134 under a Codex-authored
execution packet. Codex owns the actual diff review, defect fixes, full gate,
merge, and push to `origin/main`.

## Epic 8 — true-shape nesting proof — scoped 2026-09-21

The reserved Epic 8 slot is scoped as a **true-shape nesting proof and
controlled redesign**, not as a default replacement of `nestPieces`. The
Codex-authored packet is `docs/planning/EPIC-8-EXECUTION.md`; the research and
license/runtime record is `docs/research/NESTING-REDESIGN-RESEARCH.md`.

- The current deterministic shelf packer remains the default and unconditional
  fallback. A candidate solver may return transforms only; InfiniDrip owns the
  original loops, marks, identities and post-solver validation.
- Sparrow/Jagua is an isolated proof candidate. Top-level Sparrow and
  Sparrow Studio are MIT, while the Jagua-RS collision dependency is MPL-2.0;
  exact revisions, generated WASM artifacts, notices and source/modification
  obligations must be pinned and reviewed before any runtime dependency ships.
- The instance contract must explicitly represent or reject unknown bolt,
  clearance, grain, nap, fold, mirror/pair, quantity, identity and
  multi-material semantics. No silent rotation, unfolding, duplication,
  omission, clamping or fallback is permitted.
- Proof slices do not change UI, persistence, export writers or protected
  hashes. Any later opt-in mode or downstream export use requires a separate
  promotion decision based on deterministic replay, owned validation, benchmark
  improvement, bounded runtime/memory, offline packaging and visible fallback.
- Slice 162 is complete as a contract-only admission decision. Slice 163's safe
  artifact/legal/worker packet is now recorded in
  `docs/research/EPIC-8-SLICE-163-ADMISSION.md`, with InfiniDrip-owned locked
  evidence under `docs/research/epic8/sparrow-wasm/`.
- The packet captures exact revisions, the full locked Rust graph, notices and
  MPL-2.0 obligations, but fails offline reproducibility and worker-containment
  admission: there is no pinned `wasm-pack`, vendored Cargo source, generated
  WASM hash or replay; the inspected worker has no proven hard memory/watchdog
  boundary, runtime candidate schema validation, fixed-seed replay or
  unconditional `nestPieces` fallback.
- Epic 8 therefore takes the proof-only/no-go lane. The original adapter and
  Slices 164–168 are not admitted; `nestPieces` remains the only runtime
  behavior. Reopening requires a new maintainer-authorized packet that closes
  every failed gate. This is not a legal opinion and does not reject MPL-2.0 in
  principle; release counsel must review any future executable distribution.
  The completed Slice 169 exit report is
  `docs/release/EPIC-8-EXIT-REPORT.md`.

## Epic 11 — Polo V2 fidelity packet — authorized 2026-09-20

The product owner authorized Codex to complete the garment-expansion/refinement
research packet and to continue until the goal was complete. The resulting
research-backed execution contract is:

- Epic 11 upgrades the existing stable `polo` recipe; it does not create a
  parallel Polo recipe or new garment family.
- P0 includes a shaped collar/stand derived from the real neckline, shared
  front/back representation, CB/shoulder/CF landmarks, true placket-base clip
  and reinforcement marks, side vents, and an adjustable dropped back hem.
- New defaults are 0.75 cm stand-front rise, 1.5 cm collar-point extension,
  6 cm vent depth and 1.5 cm back drop. Exact bounds and dynamic guidance live
  in `docs/research/garments/POLO-V2-RESEARCH.md`; values remain verbatim and
  are never silently clamped.
- Sleeve rib/band is deferred because no universal reduction was established
  and the draft graph does not receive the selected material's stretch and
  recovery. Upper-collar turn-of-cloth remains deferred to material/physical
  evidence.
- Polo grading remains measurement-driven re-drafting. The supplied CAD
  assignment's isolated point shifts are not a complete grade and will not be
  layered onto the engine.
- Slice 148 completes research and scoping only. Slices 155–161 required Epic 7
  to be Codex-reviewed, merged and pushed; that prerequisite is now satisfied
  at `db14b63`. Epic 11 must not modify Epic 7,
  `nestPieces`, Electron release work or protected export baselines.
- Physical sampling remains paused. Digital seam/output evidence cannot be
  described as proof of fit, collar roll, recovery, wash behavior or production
  readiness.

## Garment-expansion research wave — authorized 2026-09-20

- Slices 149–154 are a research-only wave in this order: casual shorts,
  joggers, cut-and-sew crewneck sweatshirt/pullover hoodie, then jeans, followed
  by cross-family synthesis. Parallel evidence gathering may finish out of
  sequence, but the dependency and eventual implementation order must remain
  explicit.
- Codex owns the shared family contract, shorts, jeans, roadmap decisions,
  contributor review and integration. Claude Code CLI may contribute only the
  two isolated knit-family research files under the binding wave packet.
- Shorts and joggers are evaluated as derivatives of the shipped straight-leg
  trouser, not assumed to be mere length/style toggles. A sweatshirt precedes a
  pullover hood. Jeans require their own denim/construction record.
- A true knitted sweater, zip-up hoodie/lightweight zip jacket, woven chore
  jacket/overshirt and tailored jacket are not part of this wave. They retain
  separate engine or complexity gates.
- Any proposal needing new draft-time material/hardware state, shared source-of-
  truth changes, save migration, baseline movement or physical-performance
  claims is recorded as a future decision, not hidden behind a constant.
- The wave does not authorize implementation. Polo V2 remains the next
  implementation-ready garment geometry epic after its unchanged Epic 7 gate,
  now numbered Slices 155–161.

## Epic 7 and garment-wave closure — decided 2026-09-20

- Epic 7 is complete, Codex-reviewed and pushed to `origin/main` at `db14b63`.
  Epic 11's merge prerequisite is satisfied; this does not itself start Epic
  11 or remove the product owner's scheduling authority.
- Slices 149–154 are complete research, not implementation authority. The
  binding synthesis is `docs/planning/GARMENT-EXPANSION-SYNTHESIS.md`; where a
  contributor proposal differs, the Slice 154 synthesis controls.
- Future implementation order after Polo is casual woven shorts, adult
  crewneck sweatshirt, adult knit jogger, pullover-hoodie extension, then rigid
  five-pocket jeans. Epic numbers remain unassigned because Epic 8 is reserved.
- Automatic geometry derived from nominal fabric stretch/recovery is deferred.
  The first banded garment instead uses explicit user-owned finished band/cuff
  lengths and a ratio-aware stretch-to-fit interface that reports the real
  opening/band relationship without using absolute-centimetre `Stitch.ease`.
- No new ankle/head global measurement or save-version bump is accepted for
  these P0 garments. Hood/cuff dimensions remain recipe options and carry no
  body-fit claim.
- Adult-only P0 resolves drawcord scope for jogger/hoodie. Child sizing, age
  mapping and covered-size behavior require a later explicit legal/product
  decision.
- Buttonhole marks plus BOM/construction text represent eyelet exits in P0.
  A new shared mark kind waits for a consumer that needs distinct geometry.
- Elastic cut length is user-measured/test-fit and recorded; the app does not
  calculate a universal elastic reduction.
- A banded or lined garment may not describe a combined main/rib/lining nest as
  one truthful fabric estimate. Its execution packet must add role/material
  grouping with separate estimates or leave secondary-material yardage unknown.

## Epic 12 — Public Web Platform and Delivery Governance — authorized 2026-09-21

The maintainer authorized the Web Platform Epic to begin after Epic 11. The
approved cost research is the planning baseline, not a purchase order. Slices
171–173 establish the provider-independent execution, local board and static
delivery proof; accounts, domains, subscriptions, deployments and personal-
data collection still require their own explicit gate.

- The maintainer separately approved a zero-cost friend/family preview. It may
  serve only the built Vite `dist/` artifact from `main` through Cloudflare
  Pages Free at a `*.pages.dev` URL, with `noindex, nofollow, noarchive` and
  URL-only access initially. It must remain local-first: no login, database,
  cloud sync, telemetry, email sender or measurement egress. Browser storage
  is per device. The `infinidrip-preview` Direct Upload project and first
  production artifact are now created; the bounded GitHub Actions uploader is
  the active path for subsequent `main` pushes and explicit manual dispatches.
  Its two protected GitHub secrets are configured, and the successful run-6
  deployment is recorded in `docs/release/WEB-PREVIEW-DEPLOYMENT.md`. Paid
  services, custom domain, Access allowlisting and launch infrastructure remain
  deferred.

- The recommended low-volume authenticated-beta envelope is approximately
  $59/month plus a normal domain, using Vercel Pro, Supabase Pro with separate
  staging/production projects, Resend, owned Supabase-backed feature flags,
  Sentry Developer and Better Stack Free. Spend limits and alerts are required
  before accepting public traffic.
- Local-first drafting/export remains available without login or network.
  Cloud sync is opt-in, owner-scoped and conflict-safe; body measurements and
  workspace contents are not analytics or flag-audience data.
- The public web path uses immutable preview/staging/production artifacts.
  Blue and Green are deployment aliases, not diverging source branches. The
  previous healthy production artifact remains the rollback target. Database
  changes use expand → migrate → contract because both production aliases share
  the production database.
- The planned release train is biweekly on Tuesday at 2 PM Eastern, with a
  one-week scope cut and two-business-day code freeze. Security, outage,
  data-loss and user-blocking defects may use an expedited patch record with
  focused evidence and rollback.
- Feature flags control reversible UI/behavior rollout only. They never replace
  authorization/RLS or hide invalid geometry. Every flag declares owner,
  audience, default, expiry, ON/OFF behavior, tests and removal release. A
  `polo_v2` kill switch cannot be shipped until a compatible V1 fallback is
  actually present.
- The repository-local Control Center is the source of delivery truth. A
  contributor may move a work item only to `In Review`; Codex independently
  closes it after evidence. Missing historical evidence remains explicitly
  incomplete rather than invented.
- Slices 172–173 are complete without changing product drafting/export code:
  `ops/control-center/` contains the versioned board, validator, evidence-only
  importer and read-only dashboard; `ops/web/` contains the deterministic
  SHA-256 artifact manifest utility and provider-neutral delivery descriptor.
  The importer requires an existing evidence identity plus a verifiable
  commit/hash and cannot infer dates, owners, status or delivery.
- Slice 174's identity/cloud contract is complete in
  `docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md`. P0 is guest/local mode
  plus explicit-consent, single-owner cloud sync with revision/idempotency
  conflict handling, deny-by-default RLS, expand/migrate/contract migrations,
  export and deletion semantics. SQL, provider SDKs, login UI, accounts and
  personal-data collection remain deferred under the launch-cost hold; the
  named jurisdiction, privacy/terms, consent, retention, auth-method,
  data-region, subprocessor, RLS and support decisions remain a future
  launch re-entry checklist.
- Slice 175's admission audit is recorded in
  `docs/planning/EPIC-12-SLICE-175-ADMISSION.md`. No authoritative record yet
  answers the required launch entity/jurisdiction, data sensitivity, lawful
  basis/consent, data-region/subprocessor, retention/deletion, P0 auth/session,
  anonymous-sharing or operating-ceiling decisions. The welcome/login/profile
  implementation is deferred by the explicit launch-cost hold, not a current
  blocker; provider-neutral fixtures, local evidence and decision
  documentation remain authorized.
- The standing platform threat model is
  `docs/research/WEB-PLATFORM-THREAT-MODEL.md`; no identity/cloud slice may
  collect data until its jurisdiction, retention, deletion, consent and RLS
  decisions are recorded.
- Shorts and sweatshirt geometry may run in parallel after Polo in isolated
  worktrees. Shared registry/UI/persistence/render/nesting/export integration
  is serialized and Codex-owned. Shorts, joggers and jeans may not concurrently
  change the lower-body source of truth.

## Launch-cost hold and no-cost interim platform work — confirmed 2026-09-21

- All work that creates a one-time or recurring launch cost is held until the
  maintainer explicitly says the project is ready for launch. This includes a
  paid hosting or database plan, domain registration, authenticated profiles,
  cloud sync, email delivery, hosted monitoring, paid repository governance,
  code-signing procurement, and any provider-backed operational service.
- The existing zero-cost, URL-only Cloudflare Pages preview and its verified
  GitHub Actions artifact delivery may continue. No new account, plan,
  domain, provider integration, secret, or external data path may be added
  under this hold.
- The unresolved jurisdiction, entity, privacy, data-region, personal-data,
  schema, authentication and support questions are deferred launch decisions,
  not current engineering blockers. They remain the re-entry checklist for
  the held identity/cloud work and must not be inferred during interim work.
- Slice 176 is already assigned to the preview noindex hardening recorded on
  `origin/main` at `ae1afe8`; it must not be reused for a later feature.
- Slice 177 is assigned to this launch-cost hold, no-cost interim re-scope and
  unique slice-sequence correction; it must not be reused for a feature.
- Epic 12's no-cost interim track may prepare local, repository and
  provider-neutral work only: Slice 178's embedded flag contract and rollout
  readiness, Slice 179's local delivery/governance rehearsal, Slice 180's
  synthetic failure/readiness drill, and Slice 181's preview-only/no-go
  handoff. Remote flags, a real Polo V2 rollout, provider promotion, hosted
  monitoring, backup services, email, auth, database, and public-beta claims
  remain deferred.
- The garment implementation queue begins only after this no-cost interim
  track is complete and the maintainer schedules the next family. Its order
  remains casual woven shorts, adult crewneck sweatshirt, adult knit jogger,
  pullover-hoodie extension, then rigid five-pocket jeans.

## Slice 178 local feature lifecycle and Polo readiness — complete 2026-09-22

- The no-cost local flag contract is implemented in
  `src/platform/feature-flags.ts`. Definitions declare owner, audience,
  embedded default, expiry, ON/OFF behavior, removal release, rollout mode and
  fallback availability. Unknown, stale/invalid-expiry and readiness-only
  outcomes are disabled and return explicit diagnostics; deterministic local
  overrides exist only as a contract/test input, not as a hosted control plane.
- The catalog records `polo_v2` as readiness-only with `fallback: none` and no
  live switch. A read-only source audit verified that no Polo V1 renderer or
  parallel recipe remains; the former V1 path was replaced in place. Existing
  legacy-save compatibility remains the current V2 pipeline and was not
  changed.
- No provider, network, account, database, profile, personal-data, drafting,
  persistence, export or authorization behavior was added. Full application
  tests and 100% coverage pass at 105 files / 1,421 tests, with strict
  TypeScript and the production build passing.
- Slice 179 completed the no-cost repository/local delivery boundary. Its
  candidate identity, explicit gates, approval/timestamp, failed-smoke
  selection, freeze checklist, incident route and deferred migration placeholder
  are recorded in `docs/release/SLICE-179-LOCAL-DELIVERY-REHEARSAL.md`. No
  CODEOWNERS or branch-protection setting was invented because ownership and
  required-check settings are external maintainer configuration; no provider
  mutation or cost was introduced.

## Slice 179 local delivery and rollback rehearsal — complete 2026-09-22

- `ops/web/release-rehearsal.mjs` computes a canonical whole-manifest digest
  and strictly validates candidate identity, four explicit gate booleans,
  reviewer approval/timestamp and a previous known-good record.
- Only an all-green, approved candidate is `promotable`. A smoke-only failure
  returns the validated previous candidate as `rolled-back` with
  `operation: "none"`; malformed candidates, missing/failed checks and invalid
  rollback targets are rejected without coercion.
- The freeze/smoke/incident matrix and the explicit no-SQL/no-database
  migration deferral are versioned in the Slice 179 release record. The local
  Control Center references that record and its evidence-file hash.
- The focused, application, coverage, build, manifest and Control Center gates
  are required for acceptance. No auth, profile, cloud sync, database,
  personal-data, hosted monitoring, domain, paid plan or runtime feature flag
  was added. Slice 180 completed the readiness drill; Slice 181 closes the
  no-cost interim without a beta or production claim.

## Slice 180 provider-neutral readiness dry-run — complete 2026-09-22

- The local-only readiness fixture in `ops/readiness/readiness-drill.mjs`
  covers six synthetic local scenarios and two provider-backed scenarios.
  Every scenario must name an owner, runbook, fallback and evidence.
- Provider outage and hosted data deletion are structurally `deferred`, never
  passed. Local export/copy removal is synthetic only; it does not imply a
  primary saved-workspace deletion affordance or hosted deletion behavior.
- The stale-flag case uses a throwaway definition and cannot mutate the real
  catalog or create a live switch. Secret-like and personal-measurement values
  are rejected from fixture records.
- The result is `preview-only` with authenticated-beta and production readiness
  false. No provider, database, auth, monitoring, backup service, garment or
  personal-data behavior was added. Slice 181 closes the no-cost interim.

## Slice 181 preview-only/no-cost exit — complete 2026-09-22

- Slice 181 records the completed repository/local interim in
  `docs/release/EPIC-12-NO-COST-INTERIM-EXIT.md` and synchronizes the local
  Control Center evidence, status history and durable context.
- The exit is preview-only. Epic 12 and `REL-PLATFORM-FOUNDATION` remain
  `In Progress` because profiles, database/schema/RLS, cloud sync, provider
  promotion, hosted operations and the retained launch decision record remain
  deferred until the maintainer explicitly reopens launch readiness and cost
  approval.
- The exact Slice 178, 179, 180 and 181 commit subjects are unique and
  monotonically ordered within the interim. Older duplicate or compound slice
  subjects remain historical evidence; they were not rewritten.
- The garment queue does not begin automatically. Before any new garment
  packet, the maintainer will discuss the first-load tutorial, repository
  cleanup/history question, local delivery board, garment UI/artwork work and
  README/ARCHITECTURE rewrite.

## Slice 183 documentation and next decision gate — complete 2026-09-22

- `README.md` is now the concise newcomer-facing overview of the current
  seven-recipe, local-first product. It does not claim physical fit,
  production readiness, an authenticated beta, or a hosted user workspace.
- `ARCHITECTURE.md` is now a current orientation guide. Its former mixed
  current/history contents are preserved verbatim in
  `docs/archive/ARCHITECTURE-HISTORY.md`, which is historical evidence only.
- Repository cleanup is non-destructive: known local logs and `tmp/` remain
  untouched; tracked release, research, archive, and tooling evidence remains
  in place. Existing duplicate Slice subjects are not rewritten.
- The next implementation boundary is the local Control Center. Before its
  v2 authoring work begins, the maintainer must clarify whether board writes
  are CLI-only or may be initiated in the local UI, which file/event is the
  canonical persistent source, and how contributor/reviewer transitions are
  authorized. Display-only filtering, search, details, history, and evidence
  navigation remain no-cost candidates but must respect that boundary.

## Control Center v2 local-authoring contract — confirmed 2026-09-22

- The local UI may edit and transition board items. The browser and CLI both
  use one validated command layer; neither writes JSON directly.
- `ops/control-center/data/board.json` remains the sole canonical current-state
  file. Full event sourcing and a separate event log are deferred. A board
  revision detects stale saves, and each item retains status history in the
  canonical file.
- Every save validates the complete board and uses a same-directory temporary
  file plus atomic replacement. Busy, stale, invalid, or failed writes must be
  visible and must leave the previous board intact.
- The current workflow is `Backlog → Ready → In Progress → Review → Done`.
  `Blocked` is available from any unfinished state. `Archived` is a
  maintainer-only administrative state. Legacy v1 history labels remain
  preserved as historical evidence rather than being rewritten.
- Contributors may claim ready work, submit review, and unblock work.
  Reviewers may approve `Review → Done` or return it to `In Progress` with a
  reason. Maintainers may override, reopen, archive, or change policy.
  Role selection is workflow guidance, not security enforcement; there is no
  account or authentication boundary.
- Status transitions record actor, selected role, time, and reason. Completion
  requires linked non-incomplete evidence. Item details, notes, dependencies,
  evidence, and history remain visible in the local dashboard.
- Minimum v2 includes local edit/save, persistent transitions, history,
  literal search, status/owner/priority/type filters, detail/evidence views,
  explicit unsaved/saving/saved/error state, and reload persistence.
- Accounts, profiles, multi-user permissions, event sourcing, cloud sync,
  notifications, hosted monitoring, automation, and collaboration features
  remain deferred. The execution record is
  `docs/planning/CONTROL-CENTER-V2-EXECUTION.md`.
- Slice 185 implements this contract with a `127.0.0.1`-only Node service. Its
  browser, CLI, and evidence importer share the validated command executor;
  the browser has no direct filesystem path and the service exposes only
  allowlisted assets, the canonical board API, commands, and referenced
  repository-local evidence.

## No-cost pre-garment sequence — approved 2026-09-22

- Complete the nine phases in `docs/planning/PRE-GARMENT-EXECUTION.md` before
  beginning another garment queue: board dogfooding and planning; read-only
  repository/documentation audit; tutorial research/spec; tutorial
  implementation; README/ARCHITECTURE refinement; existing garment UI/artwork
  refinement; safe local asset import; curated, provenance-verified artwork V1;
  and V1 practice plus an expansion decision.
- Keep the work local and no-cost. Login, profiles, hosted database, cloud
  sync, notifications, hosted monitoring, paid/recurring services and remote
  asset fetching remain deferred until the maintainer explicitly reopens
  launch readiness. The sequence does not authorize a new garment recipe.
- Track the phases in canonical `ops/control-center/data/board.json` with
  distinct ordered items and explicit acceptance criteria. For each completed
  implementation slice, update the relevant phase status, link evidence, and
  leave a concise completion note.
- The next garment queue remains gated on the Phase 9 review and explicit
  maintainer approval of its direction.
- Active development pauses on exhaustion of the primary usage window and
  resumes automatically after reset; the weekly meter is informational.

## Phase 6 Pattern-to-measurement navigation — confirmed 2026-09-22

- Keep the pattern-block legibility and navigation requirements as separate
  acceptance criteria. Use the Slice 197 inventory as the default-options
  mapping baseline and keep option-only blocks distinct from missing links.
- Activating a mapped block opens its first linked measurement group in this
  order: Body measurements, Lengths & shape, Fit allowance. Offer links to all
  other linked groups; each destination highlights the mapped fields and
  focuses the first one.
- Support mouse, Enter, and Space activation with visible keyboard focus.
  Navigation is read-only with respect to measurements and design choices.
  For an option-only block, identify its controlling option group and do not
  navigate to an unrelated measurement.
- Slice 198 implements this behavior locally in the existing UI; it adds no
  account, remote service, database, or paid dependency.

## Post-Phase-9 digital capability direction — confirmed 2026-09-23

- After the approved nine-phase pre-garment sequence, pursue the complete
  capability program in `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md` in
  dependency order. Keep each goal and its unfinished packets visible in the
  canonical Control Center backlog; target dates prompt review and reforecast,
  never bypass a gate. The existing Phase 9 garment-queue approval remains
  required.
- Keep the product user-led. Do not add a user-facing AI designer or prompt
  shortcut. Deterministic pattern, measurement, construction and guidance
  logic may support manual decisions; development agents are separate from
  product functionality.
- The measurement-first route creates one size for a measured person by
  default, with a separately specified and approved grading plan for a size
  run. A measurement-driven mannequin may offer male/female starting presets,
  but its final body shape must follow entered measurements and expose any
  unresolved shape assumptions.
- Reference and upcycling may start with photos for exploratory design.
  Source-garment measurements are recommended and taught in the app; cutting
  feasibility may be asserted only when the necessary panel, material and
  layout evidence is recorded.
- Treat each starter as a separately vetted, editable, industry-relevant
  design. Finish the full view, professional tech-pack, CAD, 3D and change-
  propagation work with explicit evidence; do not close the 3D program after
  a mannequin or first garment demo.
- Keep physical sampling on hold until the maintainer explicitly reopens it
  after the digital capability program. Digital checks and professional
  document review do not establish physical fit, drape, factory acceptance or
  production readiness. The roadmap therefore keeps separate future gates for
  physical sample validation (G15) and live order/quality/shipping operations
  (G16) after the cross-system digital exit (G14); their dates are conditional
  forecasts, not permission to start.

## Artwork library expansion — approved 2026-09-23

- Expand the local artwork-library V1 before closing Phase 9, following the
  recommendation in `docs/planning/ARTWORK-LIBRARY-PHASE9-REVIEW.md`.
- Add only individually provenance- and rights-verified assets that serve
  garment print-design use. Fill underrepresented categories only when a
  suitable asset exists; do not force unrelated work into taxonomy gaps.
- Distinguish source reference photographs and paper studies from clean
  artwork and repeat-verified tiles. Never imply museum reference imagery is
  production-ready; retain advisory suitability guidance and its caveats.
- Keep assets local and bundled, make no runtime network requests, and measure
  bundle impact. This approval authorizes bounded Phase 9 expansion work, not a
  new garment queue, paid service, or remote asset-fetching feature.
- Reassess Phase 9 after the expanded library has been practiced and reviewed.
  A separate explicit garment direction remains required before any garment
  queue begins.

## Phase 9 exit and future artwork-library queue — approved 2026-09-24

- Accept the completed 12-item, ten-category local artwork catalog as a
  bounded reference V1 and close Phase 9. The acceptance includes its recorded
  evidence limitations; it is not a claim of independent user validation,
  dense category coverage, clean production artwork, or verified repeats.
- Queue the denser fashion-oriented production-art library as
  `CAPABILITY-G17`, after completion of the already-scoped G01–G16 program.
  Keep G17 in Backlog; refine its detailed scope at the appropriate future
  gate using `docs/planning/ARTWORK-LIBRARY-G17-QUEUE.md`. This records future
  intent only and authorizes no implementation now.
- Preserve the launch-cost hold: no paid license, service, acquisition, or
  recurring spend without the maintainer explicitly reopening that boundary.
  Any future catalog work remains local and makes no runtime remote requests
  unless separately approved.
- Closing Phase 9, and later organizing its nine readiness items under Epic
  13, does not authorize a garment queue. A separate explicit garment
  direction is still required.

## Epic 13 — Pre-Garment Readiness — approved 2026-09-24

- After refreshing `origin/main` and checking branch history, confirm
  `EPIC-13` is unused before creating it as **Pre-Garment Readiness**.
- Link exactly `PREQUEUE-PHASE-01` through `PREQUEUE-PHASE-09`, in that order,
  only after each is Done and its linked exit evidence is verified. Preserve
  item IDs, phase order, evidence, status history, and historical commits.
- Close Epic 13 only after all nine phases and a verified epic exit report have
  been checked. The close organizes readiness evidence; it does not approve a
  garment direction or start any garment or future-roadmap work.
- Update durable documentation and validate the board/schema and required
  checks. Use one new, unique slice commit; do not rewrite history or merge the
  branch as part of this work.

## Future capability Epic numbering and parallel packets — directed 2026-09-24

- The last completed numbered Epic is Epic 13; Epic 12 remains open for its
  deferred launch-backed work. Rename the future G01–G17 capability goal cards
  to Epic 14–30 in order, showing `EPIC-N: Gxx` in the Control Center. Give
  each a corresponding numbered Epic record and retain Backlog status. Update
  dependencies through the validated command layer; preserve old names in
  historical evidence and notes rather than rewriting that history.
- Track the five post-Phase-9 parallel packets A–E individually. A–D belong
  to Epic 14 (G01), and E belongs to Epic 20 (G07). Each starts in Backlog.
  These are packets within existing goals, not extra numbered Epics; C's later
  3D implementation belongs to Epic 22 (G09).
- This is backlog organization only. The completed Phase 9 and Epic 13 records
  do not themselves authorize roadmap execution. Lane E requires separate
  explicit garment-direction approval and the relevant C01/C03 evidence.
  All existing launch-cost, supplier-contact and physical-sampling holds stand.
- Before the first Epic 14 slice begins, show the maintainer the sequence and
  parallel-boundary diagram in `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md`.
  Reconfirm live dependencies and reserve unique landed slice numbers at
  execution; the C01–C06 IDs remain stable planning packet IDs, not Slice IDs.

## Epic 14 immediate evidence wave — admitted 2026-09-24

- The maintainer saw the ordered Epic 14 diagram, confirmed live dependencies,
  and explicitly admitted Epic 14 after Phase 9. The pre-start diagram gate is
  satisfied.
- Start the immediate disjoint evidence packets together: C01 (seven-recipe
  baseline), C02 (standards and tool comparison), C05 (3D feasibility and
  thresholds), and C06 (starter, assortment, upcycling and supplier evidence).
  Complete and review all four packet exits before stopping this wave; C01 is
  not a stop boundary by itself.
- C03/C04 remain queued until C01/C02 evidence is accepted. Do not start those
  packets as part of this parallel wave. Reconcile conflicts and revise targets
  after the four packet exits.
- This admission does not approve a new garment recipe, supplier contact,
  purchase, hosted service, user-facing AI designer, physical sampling,
  factory-ready claim, or live market/supplier assertion. Lane E remains held
  under Epic 20. The product remains user-led and deterministic for garment
  construction.
- Record observations, source dates, confidence, and unresolved external facts
  separately. Target dates are forecasts, not quality or approval shortcuts.

## EPIC-14 continuation order — directed 2026-09-24

- Finish and review C01, C02, C05, and C06 as the admitted parallel evidence
  wave; do not stop at C01. C01, C02, C05, and C06 are now accepted and the
  parallel wave is complete.
- Slice 220 created separate durable board work items for C03, C04, and G01
  final review. C03 is active; C04 and final review remain queued behind their
  explicit dependencies. Run them in the strict order C03 → C04 → final review.
  C03 consumes C01/C02/C05/C06; C04 depends on C03; final review depends on
  C04 and all four evidence exits. Continue until G01 is closed and merged,
  without requiring another maintainer reminder.
- This sequence authorizes the admitted G01 research/contracts and exit work
  only. It does not reopen physical sampling, supplier contact, paid sources,
  hosted services, or downstream garment implementation.

## EPIC-15 / G02 — Versioned style foundation — admitted 2026-09-24

- After EPIC-14/G01 closed at Slice 228, explicitly admit only EPIC-15/G02.
  Execute F01 → F02 → F03 → final review in order, with Slice 229 as the
  admission record and Slices 230–240 as the baseline contract, implementation,
  and exit sequence. The detailed scope and evidence gates are in
  `docs/planning/EPIC-15-ADMISSION.md`.
- Keep the product local-first, deterministic, and user-led. Do not add a
  user-facing AI design agent, new garment recipe, hosted/cloud feature,
  purchase, live supplier contact, physical sampling, or production-readiness
  claim under this admission.
- Preserve the accepted SaveFile v1–v5 import path, existing artwork IDs and
  bytes, current legacy save/export behavior, full coverage thresholds, and all
  eight protected export byte identities. Migration, recovery, and package
  import must fail visibly and non-destructively.
- The Control Center is canonical for execution state: the Slice 229 admission
  item is Done with verified document evidence; EPIC-15 and F01 are In
  Progress; F02, F03, and final review remain queued behind their explicit
  dependencies. Reforecast dates at each packet exit; dates never waive a
  gate.
- Slice 230 selects IndexedDB as the shared web/Electron renderer repository
  for project, style, recovery, and migration records, subject to the narrow
  Electron `file://` proof and contract at
  `docs/research/epic15/F01-STORAGE-CONTRACT-S230.md`. This does not claim that
  persistence behavior is implemented or that browser-local storage is a
  guaranteed backup. Keep existing artwork byte stores separate and stage/hash
  bytes before publishing style references.
- Slice 231 defines strict record schema version 1 separately from legacy
  SaveFile `v`; stable project/style UUIDs and their names remain distinct from
  recipe and preset IDs. Pure migration delegates historic interpretation to
  the existing SaveFile v1–v5 parser, preserves recovery raw values, and writes
  nothing. The app continues using its legacy store until Slice 232's
  transactional repository is verified.
- Slice 232 implements the shared IndexedDB repository API and migration
  transaction, including strict durability where supported, revision CAS,
  per-style recovery, source-pair SHA-256 idempotency, rollback and the
  Electron `file://` restart/path-change proof. This proves the repository API
  in the tested Electron/Chromium profile; it does not prove browser quota or
  eviction resistance and does not wire app boot or current Save/Load. Keep
  that UI integration in Slice 233 and package import/export in Slice 234.

## Manual UI quality findings and G03–G17 continuity — directed 2026-09-26

- Preserve the maintainer's 15 annotated browser observations as high-priority
  findings in `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md`. They are
  reports for review, not verified root causes or implementation scope.
- Do not add them to the capability roadmap or canonical Control Center until
  the maintainer confirms. Continue the G03–G17 sequence without interruption;
  each related capability exit marks its finding **To be reviewed** and checks
  accepted output against the observation without silently expanding scope.
- Defer findings without a current roadmap owner and any residual scope from
  partial overlaps until after G17 and a maintainer discussion. The requested
  visual-identity, art-placement/material-response, Polo-neck, and export
  reference research is not performed by this intake; conduct it only at the
  appropriate admitted review or after-G17 scope checkpoint.
- A capability's review may establish only digital rendering and data fidelity.
  It does not establish physical fit, sewn construction, fabric print response,
  factory acceptance, or production readiness. Existing launch-cost, supplier,
  physical-sampling and hosted-service gates remain in force.

## EPIC-16 custom one-size output identity — confirmed 2026-09-26

- A custom style without an explicitly approved grade plan is a single-size
  design. Its selected-size pattern exports remain available without grading.
- Whole-run Tech Pack, Projector, and Marker outputs are withheld until the
  user reviews and explicitly approves a grade plan. Existing legacy styles
  keep their current export behavior and protected byte identities.
- This is a digital output policy only; it does not qualify fit or a population
  chart.

## EPIC-16 graded POM reconciliation — confirmed 2026-09-27

- Before any graded per-size or whole-run output is released, each applicable
  generated POM must exactly equal the corresponding user-authored plan target
  in unrounded centimetres. No tolerance or display rounding is used to pass a
  mismatch.
- A mismatched POM blocks that size's graded output. A whole-run artifact is
  blocked if any declared size is blocked or unresolved. The UI must show the
  target, generated value, and raw difference so the user can revise and
  re-approve the plan.
- An explicit `not applicable` exception is not a match. It may be honored only
  where the output can identify the exception and reason; exceptions that
  remove a required drafting input remain unsupported and block the affected
  size and whole run.
- Exact digital correspondence is not a physical measurement tolerance, fit
  acceptance, or standards-conformance claim.

## EPIC-16 custom-style inactive fields — implementation constraint

- SaveFile v6 still requires the shared measurement object. A custom style
  initializes measurements not consumed by its recipe to `STANDARD_M` as
  schema-only padding. These values are not capture observations or recipe
  inputs, are not copied from another style, and the custom style remains
  locked to its recipe. This constraint preserves the protected legacy
  SaveFile shape until a separately admitted schema migration.

## Execution-time efficiency and EPIC-17 admission — confirmed 2026-09-29

The maintainer adopted the complete **Execution-time efficiency (quality gates
remain unchanged)** rules in `AGENTS.md`. They apply to every new or resumed
goal, including work started in a fresh chat. Full coverage thresholds,
acceptance criteria, output evidence and merge requirements remain unchanged;
the rules define when integrated gates run, how failures are diagnosed, and how
test time and memory are measured. Do not lower coverage or remove assertions to
reduce runtime. Do not change model selection to address local test CPU or
memory pressure without evidence that model inference consumes those local
resources.

EPIC-17/G04 remains Backlog. Do not begin its implementation, open an admission
packet, or change its board status until the maintainer explicitly asks to
begin EPIC-17. Completion of EPIC-16 and roadmap ordering do not constitute
admission. The canonical board records this hold in the EPIC-17 work item.
The maintainer explicitly instructed Codex to begin EPIC-17/G04 on
2026-09-29; this satisfies the admission condition and supersedes the hold
above. Slice 261's `docs/planning/EPIC-17-ADMISSION.md` records the authority,
verified start, sequence and gates. The Epic is now In Progress; later work
still follows the admitted packet and current board state.

## EPIC-17 view-only projection metadata — confirmed 2026-09-30

The maintainer authorized G04 to add source-backed view metadata for
construction-aware flats: fold-axis reflection only for source-declared
`onFold` roles where the fold axis is explicit in source evidence, plus
face-specific landmarks and multiplicity rules only where construction
evidence supports them. This metadata may change how existing pattern geometry
is represented in a view; it must not change canonical pattern or cut
geometry. Do not infer a fold axis, split, role instance, or landmark from
appearance, stitching, or screenshots. Polo and Woven-shirt collar splits
remain held until a specific construction reference supplies the missing
front/back landmarks. This authorization does not establish that any
particular role is eligible for reflection.

For the Woven-shirt front closure, the maintainer confirms no construction
reference is available that identifies which physical placket belongs to each
front and which finished placket overlaps on top. Keep the Woven closure and
all complete Woven flats held until source evidence supports its instances and
layer order; do not infer overlap from the current drawing or stitch graph.

**Decision superseded by the later S321 maintainer decision below:** the
maintainer subsequently approved the Polo/Woven collar exterior station
convention, Woven sleeve/band view convention (conditional on output checks),
and Woven closure order A (right button placket above left buttonhole placket).
These explicit design decisions resolve the prior need for an external
construction reference for those view choices only. They do not accept any
face; keep every affected view held until source-topology and rendered checks
pass, and preserve any other Woven hold.
# EPIC-17 / G04 — maintainer decisions, 2026-10-01 (S321)

- Approved Tee/Fitted view-only sleeve mapping: front uses `capLeft`, `sideLeft` and the left hem half; back uses `capRight`, `sideRight` and the right hem half. Display two mirrored sleeve instances. Do not draw a partition line, add a seam, or change cut geometry.
- Approved Woven sleeve/band normalized-arclength transfer as a view convention, with two mirrored sleeve and band instances and yoke on the back-facing seam layer. This remains conditional on generated join, crossing, overlap and readability checks; failures keep affected views held. No stitch graph or cut geometry change is authorized.
- Approved Polo/Woven upper and under collar exterior CB-to-CF normalized-arclength transfer from the sourced base/neckline shoulder fraction. It is a view-only convention and does not assert a physical exterior notch. Polo outer stand uses its source-encoded `backCollar`/`frontCollar` junction.
- Approved Woven closure order A: right button placket above left buttonhole placket. Preserve the all-seven-recipe acceptance criterion; approval alone does not pass any face.
- Trouser front: the maintainer approved the exact S325 source-repair proposal. S326 adds `flyUnderlap` (3.5 cm × live `flyLength`), routes `frontRight.flyEdge` through it to `flyShield.right`, and retains `frontLeft.flyEdge` on `flyShield.left`; both front panels and exact waistband center joins are preserved. The view map records the approved underlap-behind-`frontLeft` relation. All 24 fronts remain held until the full option and rendered-output checks pass; approval alone accepts no face.
- These approvals settle design choices only. Each affected view remains held until its exact configuration passes same-revision topology and rendered-output checks. G04 MQF findings remain review checks; post-G17 deferrals remain unchanged.

## EPIC-17 / G04 — Polo residual gate retained (S357)

- On 2026-10-02, the maintainer selected the option to retain the existing 0.25 cm Polo sleeve-cap residual gate after reviewing S357's source/ease trade-off study.
- Preserve Polo's source-authored 1.5 cm cap ease and existing pattern/POM values. The tested candidate that narrows width and removes ease is not authorized. Keep all 34 Polo faces held until the source revision passes the existing residual, topology, colorway, callout and rendered-output gates.
- This decision changes no V02 acceptance criterion and approves no face; all seven recipes remain required before V03.

## EPIC-17 / G04 — S351 eased-cap residual applicability (2026-10-07)

- The maintainer approved suppressing the endpoint-only rigid residual diagnostic only for the exact `Sleeve-cap ease` relation when the exact same-revision Polo projection map validates and its sleeve role carries decision `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH`.
- The approved S351 display maps `capLeft` to `front.armhole` and `capRight` to `back.armhole` by normalized arclength. Its receiver-edge display intentionally does not share the authored cap endpoint coordinates, so endpoint-only rigid RMS is not applicable to that displayed eased seam.
- Keep the numeric 0.25 cm residual check for every other stitch relation. This decision changes applicability for that one view representation only; it does not change source geometry, stitch graph, ease, POMs, solver behavior, or any other topology, crossing, overlap, revision, identity, callout, output, or acceptance gate.
- This decision accepts no face. Polo remains held until the exact 17-option/34-face output passes every applicable V02 gate, including source/revision identity, joins, crossings, callout and rendered readability. All-seven acceptance and V02-before-V03 remain.

## EPIC-17 / G04 — Trouser fly-underlap source repair (S326)

- The maintainer approved the exact Slice 325 proposal on 2026-10-01: add a physical `flyUnderlap` interior role sized 3.5 cm × current `flyLength`; route `frontRight.flyEdge` to `flyUnderlap.frontEdge`, then `flyUnderlap.shieldEdge` to `flyShield.right`; retain `frontLeft.flyEdge` to `flyShield.left`; place the underlap behind the exterior `frontLeft` layer.
- Preserve both upright front panels, their exact source geometry, and the exact existing front waistband center joins. This approves only the stated source repair and associated view metadata; it does not accept any Trouser face or claim physical sewability.
- Short-edge finishing remains unspecified and must remain explicit in pattern/output documentation. If a required output depends on it, hold that output.
- Keep all 24 Trouser front views held until the supported option matrix and rendered-output checks pass. Preserve all seven recipe acceptance criteria and the unrelated holds.
- No export baseline movement or DXF-writer change is authorized or required. The eight protected SHA fixtures cover legacy Tee/Fitted outputs; the approved new Trouser physical role will naturally appear in new Trouser DXF content. Existing legacy hash identities and tech-pack identity checks remain mandatory.

## EPIC-17 / G04 — Polo sleeve view mapping (S333)

- On 2026-10-01 the maintainer approved the exact S332 Polo sleeve view proposal: FRONT uses `capLeft` start-to-end, `sideLeft` end-to-start, and the left hem half; BACK uses `capRight` start-to-end, `sideRight` start-to-end, and the right hem half, with local-Y reflection for the back view. Reflect each displayed sleeve instance across its sewn-to body's source-declared center axis; show two mirrored instances and no crown-to-hem partition line.
- This is view-only mapping metadata. It authorizes no cut-geometry, stitch-graph, ease, physical-mark, or solver-threshold change and does not waive the 0.25 cm assembly residual gate. Keep each Polo face held unless its exact source revision passes topology, stitch residual, join, crossing, overlap, and rendered-readability checks across the supported option matrix.
- The S332 default diagnostic reported a 0.96 cm shoulder gap and 0.68 cm assembly residual. If the approved mapping does not remove those within the existing solver contract, preserve all 34 Polo holds and bring a separate evidence-backed proposal; do not average/scale transforms or hide the gap.

## EPIC-17 / G04 — Polo dimension-only POM references (S338)

- On 2026-10-01, the maintainer approved both S337 proposed dimension-only references: show the `upperCollar.centerBack` finished-leaf measurement as an annotation referencing its source-declared fold-axis edge, without drawing that edge as a garment seam/cut contour; and show Back hem drop on the back flat using `front.hem.start` Y and `back.hem.start` as the two measurement levels.
- These are view annotations only. The cross-piece reference may show witness/dimension marks but must not imply that the front and back panels join at the hem. Use exact same-revision source identities and preserve the POM method/value. Resolve annotation collision/readability across every Polo option before accepting any affected view.
- This decision approves those two projection conventions only; it does not accept any Polo face, change source/cut/stitch geometry, or waive the 0.25 cm sleeve-cap residual hold or the all-seven-recipe G04 acceptance criterion.

## EPIC-17 / G04 — Trouser fly-underlap balance notch (S339)

- On 2026-10-01, the maintainer approved adding a midpoint balance mark to `flyUnderlap.shieldEdge` at `t: 0.5`, using the existing `flyShield.left` midpoint notch as the chosen location convention.
- The source stitch graph joins `flyUnderlap.shieldEdge` to `flyShield.right`; `flyShield.left` is joined to `frontLeft.flyEdge`. The new mark is therefore an explicit design choice on the underlap, not a matched mark on the sewn counterpart. Preserve the source stitch graph and do not describe the two marks as seam-matched.
- Leave `flyUnderlap.top` and `flyUnderlap.bottom` unmarked. This adds a construction mark only; it does not change cut geometry, either fly stitch, waistband joins, or the explicit statement that short-edge finishing is unspecified.
- The approval resolves the universal per-piece notch/grainline completeness check. It does not claim physical sewability, fit, factory acceptance, or acceptance of any Trouser flat; all 24 Trouser fronts remain subject to their full option-matrix and rendered-output gates.

## EPIC-17 / G04 — Woven eased sleeve-cap view projection (S345)

- On 2026-10-01, the maintainer approved the exact S344 proposal: map `sleeve.capLeft` (underarm→crown) by normalized arclength to `front.armhole` (underarm→shoulder); map `sleeve.capRight` (crown→underarm) to `yoke.armholeUpper` followed by `back.armholeLower`, splitting at the live yoke-edge length fraction. Render each shared body-derived join once on `SEAM` and suppress its duplicate sleeve-cap stroke.
- Retain two reflected sleeve and band instances and put the yoke armhole on the back-facing seam layer, as approved in S321. The projection changes displayed cap curvature and visually depicts the shared join without displaying the ease. Preserve source piece/cut geometry, the source stitch graph, authored +1.5 cm ease, and the generic 0.25 cm assembly threshold. Do not interpret the rendered shared curve as physical seam-length equality or fit evidence.
- Approval is conditional on exact revision/stitch/edge validation and generated-option checks for joins, crossings, overlap, layer order and readable output. Keep every face held when any required gate fails. This decision alone accepts no face and does not change all-seven V02 acceptance or the V02-before-V03 gate.

## EPIC-17 / G04 — Polo sleeve-cap view-only seam projection (S352)

- Decision ID: `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH`. On 2026-10-02, the maintainer approved the S351 proposal to map `sleeve.capLeft` to `front.armhole` and `sleeve.capRight` to `back.armhole` by normalized arclength, from underarm station to shoulder station, for the assembled seam depiction.
- This is a view-only convention for displaying the eased seam on the receiving armhole contour. Preserve the sleeve and body cut outlines, source stitch graph, source ease, solver behavior, and the 0.25 cm assembly-residual gate. It does not assert that the projected contours are physically equal in length or that the source encodes an easing distribution.
- Keep all 34 Polo faces held until exact revision and option-matrix checks validate joins, crossings, overlap, callout readability, and rendered output for all 17 supported configurations. The decision accepts no face and does not relax G04's all-seven-recipe V02 criterion or the V02-before-V03 dependency.

## EPIC-17 / G04 — Woven full-collar view projection (S359 approval)

- On 2026-10-02, the maintainer approved the exact S359 proposal for a revision-bound, piecewise normalized-arclength and signed-normal-offset display projection across `outerStand`, `innerStand`, `upperCollar`, and `underCollar`, onto the exact front body neckline and reversed back yoke neckline, split at the source-length shoulder station.
- Preserve same-revision piece and edge identities, the previously approved exterior station convention, fold-reflected instances, current layer order, and S343's single body-neckline base seam. This is a view convention; it does not assert physical exterior notches, alter cut geometry or source stitches, or establish sewn fit.
- The mapping may bend visible contours and change apparent silhouette, overlap, layer occlusion, and POM placement. Implement only in a separately bounded slice and keep all 56 Woven faces held until every option passes joins, crossings, overlap/layer, colorway closure, exact POM anchoring, and rendered readability. Approval accepts no face and preserves all-seven V02 acceptance and the V02-before-V03 gate.

## EPIC-17 / G04 — Woven detached sleeve-band details (S370 approval)

- On 2026-10-02, the maintainer approved the exact S370 view-only proposal: show two complete source-scale `sleeveBand` outlines as left/right side-gutter details, reflected across the source-declared back center line and rotated only for page fit. Preserve the original outline, grain/fold mark and multiplicity. Label both explicitly “detail only—not at assembly location” and identify their source relation without drawing a false seam connector.
- This approval permits the detached band-only composition after the assembled band projection produced crossings. It does not authorize changing source pattern/cut geometry, the source stitch graph, instance count, seam layers, assembly positions, acceptance gates, or unrelated Woven views.
- In S372, revalidate all 28 Woven options / 56 face identities for source-scale geometry, joins, crossings, text overlap, frame fit and rendered clarity. The main sleeve-outline crossing and any unresolved collar/POM/topology issue keep affected faces held. The approval accepts no face, preserves all-seven V02 and V02-before-V03, and does not support a physical-fit, factory-acceptance or production-readiness claim.

## EPIC-17 / G04 — Polo collar-point keyed POM display (S380 approval)

- On 2026-10-02, the maintainer approved the exact S378 presentation for the Polo front `Collar point extension` POM across all 17 supported option rows: replace only its inline text leader with a `C` marker centered at the same-revision `upperCollar.frontTip:end` endpoint and put the unchanged complete source POM text/value/tolerance in a keyed `C` schedule below the flat.
- This is a view-only display convention. Keep the source-authored horizontal edge-delta measurement, anchor, source geometry, stitch graph and exact target identity unchanged. The marker does not assert an extra physical notch or construction mark.
- The change resolves only the two known base-render `TEXT_COLLISION` rows for this POM. All other Polo callout crossings, the fixed 0.25 cm sleeve-cap residual gate and all 34 Polo holds remain. The approval accepts no face, does not relax the all-seven-recipe V02 criterion or the V02-before-V03 dependency, and makes no physical-fit, factory-acceptance or production-readiness claim.

## EPIC-17 / G04 — Polo FG glyph-only offset (S399 approval)

- On 2026-10-07, the maintainer approved the exact S398 display proposal: move only the Polo FG glyph by `(-0.424264,-0.424264 cm)` from its current text position, across all 17 supported option values.
- Keep the 0.22 cm ring fixed at the shared `(0,8)` source station. Preserve both POM identities, source anchors/targets/revisions, source marks and paths, full-text schedule, pattern/cut geometry, source stitch graph, colorway and paired backs. This is a view-only annotation placement, not a physical notch or pattern construction claim.
- Approval permits implementation and option-wide output verification only. It accepts no face and does not relax the 0.68 cm sleeve-cap residual against the 0.25 cm gate, any other V02 check, all-seven-recipe acceptance, or V02-before-V03. Keep all 34 Polo views held until every applicable output gate passes.

## EPIC-17 / G04 — Woven W marker line preservation (S400 approval)

- On 2026-10-07, the maintainer approved the exact S396 Woven presentation trial for the `Finished placket width` POM: retain its 0.22 cm open ring at the midpoint of the same-revision `buttonPlacket.top` edge; paint the ring after any colorway fill but below all source geometry strokes; move only the W glyph `(+0.2121,+0.2121 cm)`; preserve the unchanged full-text schedule.
- This is annotation presentation only. Preserve the exact source POM identity, target, anchor, revision, value/method/tolerance, source paths, piece/cut/stitch geometry, colorway, and back output. The order lets source lines remain continuous over the ring; it does not alter or conceal the underlying geometry.
- Approval authorizes implementation and 28-option rendered verification only. It accepts no Woven face and does not clear the independent back-hem crossing, other Woven joins/collar/sleeve holds, any Polo hold, the all-seven-recipe V02 requirement, or V02-before-V03. Keep all 56 Woven and 34 Polo faces held until every applicable gate passes.

## EPIC-17 / G04 — Woven V02 view-only trials (S405 approvals)

- On 2026-10-07, the maintainer approved the exact S402 Front button-spacing treatment: a 0.22 cm open ring at the same-revision midpoint of source `button-1` and `button-2`, the D glyph offset `(+0.2121,+0.2121 cm)`, and the unchanged complete POM schedule. The derived station is a view convention, not a physical notch.
- The maintainer approved the exact S403 pocket foreground convention: draw the pocket edge once and suppress only the placket stroke beneath it where those source bounds coincide/overlap. Preserve every source bound, stitch relation and option value.
- The maintainer approved the exact S404 shoulder/collar occlusion trial: show projected `outerStand.collar` above `front.shoulder` and suppress the body shoulder only from HPS to the first projected collar intersection on both sides. The visible shoulder seam start is a view convention, not a source stitch junction.
- These decisions authorize implementation and option-wide re-verification only. They accept no face. All 28 Woven fronts/backs remain held until every applicable same-revision topology, join, crossing, overlap, callout, colorway and rendered-readability check passes; all-seven V02, Polo's unchanged 0.25 cm gate, V02-before-V03 and all CAD/export gates remain unchanged.
- S405 established that Woven placket top/outer edges intersect the projected collar roles in the current 28-option output, while source stitch relations connect each placket to `front.centerFront` and collar roles to their separate neckline/stand/collar edges. The source encodes no collar-over-placket layer. S321's right-placket-over-left-placket decision and the S405-approved shoulder occlusion do not settle that relation. The specific S406 approval below now settles the view convention; it does not release any face.

## EPIC-17 / G04 — Woven center-front collar over closure (S406 approval)

- On 2026-10-07, after reviewing the exact S405 source/output diagnosis, the maintainer approved a view-only order for Woven fronts: keep the button placket above the buttonhole placket; draw the projected collar in front of both; clip only placket outline portions inside the projected collar silhouette.
- This is an explicit display decision because source joins connect the two placket attachment edges to `front.centerFront` and connect collar pieces through their separate stand/neck/collar edges; no collar-to-placket stitch or relative source layer exists. Preserve the right-button-placket-over-left-buttonhole-placket order underneath the collar.
- The approved view hides approximately 0.8–2.7 cm of the upper placket edge depending on option geometry. It does not change cut geometry or source stitches, does not add a physical join, and makes no sewn-construction claim. Approval permits implementation and all-28-option review only; keep all Woven/Polo faces held until every applicable same-revision topology and rendered gate passes.

## EPIC-17 / G04 — Polo H segmented locator and retained holds (S425)

- On 2026-10-07 the maintainer approved the S422 recommendations: reject the S424 Polo bicep-input reduction (raw 38→29.345149 cm; finished span −8.654851 cm) because it lacks pattern-specific construction support and changes the sleeve POM materially; keep the 0.25 cm gate and all Polo faces held. Keep the Woven body neckline as one continuous source seam and retain the 28 front holds because the proposed clip visibly interrupts that seam. Implement the S419 segmented source-centered H ring as an annotation-only view treatment.
- The H marker remains centered at the exact source anchor `(7,0)`, radius 0.22 cm, with unchanged H glyph, same-revision POM targets and complete schedule. The view renderer removes only ring spans within the approved 0.045 cm source-stroke clearance, drops retained arcs shorter than 0.04 cm, and fails closed unless the output retains 2–3 arcs and at least half the circumference. Source paths, marks, cut geometry, source stitches and POM data stay unchanged.
- S425 verifies the current renderer over all 17 exact S399 revision fixtures with zero sampled centerline contacts to component/source-mark strokes, unchanged 11-row schedule and source paths, and rendered default/least-coverage crops. This annotation approval does not accept any view. Polo's independent 0.68 cm residual still exceeds 0.25 cm; all 34 Polo faces and all 56 Woven faces remain held. No physical fit, factory acceptance or CAD compatibility claim is made.

## EPIC-17 / G04 — Polo J/FG keyed POM display (S434 approval)

- On 2026-10-07, the maintainer approved the exact S433 17-option view-only trial: key **J** marks the exact same-revision start of `outerStand.frontEnd` for `Finished collar stand height`; one **FG** ring marks the exact start of `outerStand.frontNeckline` for `Stand front rise`, grouped with the existing `finished-placket-width` and `front-neck-drop` FG schedule rows.
- Keep each POM's own source identity, anchor/target edge, value, tolerance and full schedule text. Use the existing 0.22 cm open rings. The FG ring is a shared display station and not evidence that these measurements share a physical notch. Preserve all source marks/paths, pattern and cut geometry, stitch graph, revision, option values, existing glyph offsets and colorway.
- This approval authorizes implementation and 17-option production/output review only. It accepts no view. All 34 Polo views remain held until all applicable same-revision topology, join, residual, colorway, callout, collision and rendered-readability checks pass. All-seven V02, other residual thresholds, V02-before-V03, legacy DXF, protected exports, CAD rights/round-trip and claim boundaries remain unchanged.

## EPIC-17 / G04 — Retain S370 band layout and Woven back holds (S442)

- On 2026-10-07, after S441's exact-revision 28-option local-Y sleeve trial, the maintainer chose to keep the approved S370 detached-band positions and retain all Woven back holds.
- Do not implement the diagnostic local-Y sleeve reflection or move the detached-band details under this decision. The trial clears measured crossings but conflicts with the fixed S370 positions and is not established by source topology. Preserve pattern/cut geometry, stitch graph, two band details, all-seven V02 acceptance and every current face hold.
- This disposition accepts no view and makes no physical construction claim. Revisit only with source-backed evidence or a separately approved scope/design change; V03 remains gated behind V02.

## EPIC-17 / G04 — V03 receiver sampling correction (S726)

- The maintainer directed that V03 be completed using the available software and that its acceptance logic be corrected rather than repeatedly requiring more applications or equivalent tests. S726 therefore separates full product-side option/grade verification from representative receiver evidence.
- Verify every supported option scenario at every supported grade size using the source-bound package checks. For receiver evidence, require a source-bound saved/reopened fixture for every distinct serialized DXF exchange-structure/semantic class across all seven recipes; add a fixture when a supported option changes that serialized structure. Apply the existing 0.001 cm, identity, units, CUT/SEW, marks, and readability gates to every selected return. Include an explicit non-default grade-boundary sample.
- Exact coordinate/shape variants that preserve the same serialized exchange structure do not each require a separate CAD save. This is a deliberate correction to the earlier “each materially distinct normalized geometry signature” formulation; it does not claim that every shape was individually round-tripped. S726 records 365 source packages, 315 normalized shape signatures, ten receiver structure classes, ten current structure fixtures, and one additional Trouser XL boundary fixture. LibreCAD compatibility is limited to the exact 11 saved/reopened/audited/reviewed returns.
- The empirically tested route is LibreCAD 2.2.1.5 / `Drawing Exchange DXF 2000`, with local files on C:. This does not establish formal DXF conformance, ANSI/AAMA/ASTM support, industrial apparel-CAD certification, universal interoperability, fit, factory acceptance, or production readiness. Preserve all other V03 gates, the protected legacy export identities, and the complete Epic release gate.
