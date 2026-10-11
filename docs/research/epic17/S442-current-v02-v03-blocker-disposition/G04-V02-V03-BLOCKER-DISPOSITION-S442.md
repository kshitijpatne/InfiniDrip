# EPIC-17 / G04 current blocker disposition — Slice 442

## Start boundary

- Started 2026-10-07 21:24:08 UTC from clean S441 commit `9f0adbb4ec2cd0567c2380104a7f8b56d91b5922` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice was 441; reserve 442.
- Canonical board revision 2652: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held across 73 options / 146 faces. Goal was checked at S441 boundary and remains active with matching objective.
- Usage at start: 37% primary / 20% weekly; ordinary use allowed.
- Validated S442 start replay advanced board 2652→2654 without changing item statuses or tallies.

## Authority and scope

Record the maintainer's S441 response to keep the approved S370 detached-band positions and retain all Woven back holds. Reconcile the exact current remaining V02 and V03 blockers from the latest source/output evidence, distinguishing a proven local pass from an accepted face and an unmet Epic gate. This is a documentation/board-only slice; it does not reopen or repeat S417/S437, S436, or S421.

### Accepted decision at slice start

The maintainer selected **keep S370 positions and retain holds** for the S441 local-Y sleeve candidate. The candidate is not authorized for implementation because source does not establish that orientation and its successful render requires moving each approved band detail outward 20.5737–22.4315 cm and expanding the viewBox by 41.1474–44.863 cm. Keep Woven backs held; preserve the S370 positions, source geometry, and stitch graph.

The user's separate Polo FG exact mapping approval is already captured by the S434 decision and implementation; S442 changes no Polo metadata.

## Questions S442 answers from existing evidence

1. What exact same-revision V02 holds remain after the S441 decision?
2. Which Polo output checks are locally clear, and why is Polo not counted as accepted?
3. What still gates V03 after V02, based on documented rights evidence and fixture proof requirements?
4. Is any additional user decision required now, or can the current records continue to guide fail-closed work?

## Verified current disposition

### V02 blockers

1. **Woven FRONT_FLAT — 28 held faces:** S417 traces one symmetric contact per side in every exact option between the visible continuous `front.neckline` base-seam path and the projected upper/under-collar exterior contours, at about `x=±0.8424 cm, y=8.1727 cm` (coordinates vary slightly by option). The body-to-stand base join is source-encoded; the collar exterior station is an approved normalized-arclength display convention and is not a physical notch or direct body-to-exterior stitch. The S425/S437 maintainer disposition is to keep the body neckline continuous and retain these 28 holds; the alternative removes roughly 0.8426–0.8433 cm per side of visible seam. This is a resolved fail-closed choice, not permission to clip the seam.
2. **Woven BACK_FLAT — 28 held faces:** the source has one complete sleeve hem joined to each sleeve band and defines no hem split or sleeve-to-sleeve over/under relation. S373/S437 retain the full hems and hold the crossing. S441's rendered local-Y trial clears geometry only by relocating S370 band details and expanding the viewBox; the maintainer chose to preserve S370 positions and all back holds. Do not implement the local-Y candidate.
3. **Polo — 34 held faces, with no current local defect identified:** S436 reconciles the latest S432–S435 same-row current outputs. Across 17 options / 34 faces, it finds no current local compiler/render/overlay/POM/residual or measured text-readability blocker; source omissions such as `sideVentDepth=min` are preserved as defined. This audit did not accept any face. Hold Polo in the integrated matrix until the all-seven V02 review can be completed; do not invent a Polo defect or silently accept it ahead of the established review.
4. **V02 exit remains blocked:** G04 acceptance requires passing live front/back technical flats for every supported option of all seven recipes, with joins, topology, layers/overlap, POM anchoring/readability, colorway and output evidence. Five recipes account for the current 56 accepted faces; Woven's 56 unresolved faces prevent all-seven exit. The canonical board remains 56 accepted / 90 held across 73 options / 146 faces.

### V03 and final-merge gates

- **V03 cannot start until V02 passes.** S421's official-source rights review did not qualify a demonstrably no-cost industrial apparel receiver. CLO is a documented receiver candidate, but the checked trial requires payment details and converts to paid service; the public evidence checked for Valentina/Seamly2D/LibreCAD does not establish a suitable receiving profile. No receiver/version/profile is selected.
- After V02, select a lawful receiver/profile only on verified rights evidence, then prove representative import and export/round-trip fixtures for geometry, identity/count, centimeter scale, construction semantics (notches/labels/grades as supported), and preservation/unsupported-content behavior. Until observed, make no exact AAMA/ASTM or other industrial format compatibility claim.
- The S441 TypeScript build failure reproduces on exact S440 production source and is a separate integrated build/PR gate, not a V02 topology acceptance failure. It must be diagnosed before safe merge. Protected export byte identities and legacy DXF remain required.

### Decision/hold boundary

No unresolved user choice is needed to honor the current safe disposition: retain Woven holds and do not change acceptance. Remaining progress depends on newly source-backed construction/topology facts that support a truthful view, or an explicit future maintainer-authorized scope/design change. Do not ask the user for general geometry or references already examined; do not weaken all-seven acceptance. S417/S437 already settle the front-contact outcome under current scope, so no repeated front audit is scheduled.

## Required evidence and method

- Reuse S441's exact local-Y all-28 matrix and decision response; S437/S417's exact Woven post-clip contacts and topology; S436/S435's current 17-option Polo acceptance audit and text-output evidence; S421's official-source CAD rights research; and the admission packet's unchanged V02/V03 gates.
- Confirm canonical board/status/evidence at this slice start and after exit. If the current S406 Woven or S434 Polo source revision differs from linked fixtures, stop and record the mismatch instead of generalizing old results.
- State explicitly which facts are source encoded, which are prior maintainer decisions, and which are acceptance/dependency gates. Do not infer a physical seam order or acceptance from a passing local test.

## Acceptance and non-goals

- Preserve 56 accepted / 90 held; no face acceptance/release, option, source geometry, stitch graph, renderer mapping, POM, schedule, colorway, threshold, export identity, or workflow-status changes.
- Keep all-seven V02 acceptance and V02-before-V03 unchanged. Do not start V03 implementation while V02 remains In Progress.
- Do not expand into CAD vendor contact/trials or spending, physical sampling, supplier contact, G05, G09/D04, UI redesign, hosted service, or physical/factory/production-readiness claims.
- Do not perform redundant S417/S437 or S436 analyses. If evidence still describes a resolved or superseded Polo blocker, identify the newer evidence that supersedes it.

## Verification and exit

- Validate start and exit command sequences against the canonical Control Center schema, then replay through `executeBoardCommand`.
- Run `npm run control-center:test`, canonical board read validation, and `git diff --check`.
- No production source/test changes, so changed-code coverage, exports, build, and full-Epic gates are not run in this documentation-only slice. The S441-reproduced baseline TypeScript build issue remains a recorded final-candidate blocker.
- Exit packet/state/board must link the explicit S441 hold decision and current blocker disposition, preserve the board count and statuses, and identify the next single safe action.

## Start evidence

Start commands: `S442-start-board-commands.json`; isolated preflight and validated replay scripts are adjacent.

## Findings and exit evidence

### Disposition

The only newly open S441 design choice is resolved: **preserve S370 band-detail positions and keep the 28 Woven backs held.** The successful local-Y geometry trial is rejected for implementation under that fixed layout; no further approval is needed to honor the decision. S434's Polo FG approval remains implemented and source-bound.

The remaining V02 blockers are exactly the two retained Woven classes: 28 front neckline/collar contacts under the approved continuous seam, and 28 back full-hem crossings under the approved S370 band footprint. Current Polo evidence has no local output failure but all 34 faces remain unaccepted until all-seven review. Five other supported recipes account for the present 56 accepted faces. Integrated tally remains 56/90 over 73 options / 146 faces. No new acceptance decision or criteria relaxation is available under the current authorization.

V03 remains unavailable until V02 passes. After that gate, its separate blockers are identifying a rights-cleared industrial apparel receiver/profile and observing representative import/export round trips that establish actual feature/identity/scale behavior. S421 is prerequisite evidence, not receiver qualification. The existing exact-S440 TypeScript failure must also be corrected or otherwise verifiably resolved before the final merged build gate; it does not change V02's geometry acceptance.

No further user decision is required to maintain the current fail-closed scope. The only meaningful unblock is new source-backed pattern/construction evidence that yields a truthful Woven view under the retained decisions, or a separately authorized future change to those constraints/acceptance. Do not repeat S417/S437, S436, or S421 as if they were unreviewed.

### Exit verification

- S442 start commands were first preflighted with an incorrect expected count of six S441 evidence references; the committed S441 board contains seven (start plus six exit links). The start preflight was corrected to use the exact S441 commit board and seven references, then reproduced 2652→2654. Canonical start replay already advanced the board to 2654 exactly once.
- An attempt to reuse S441's validator after the S442 start correctly failed because that verifier is pinned to S441's historical exit revision 2652. S442 uses its own current-revision validator instead.
- S442 exit commands preflighted 2654→2657 and replayed successfully through `executeBoardCommand`. Current board validation confirms revision 2657, EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog, both S442 evidence references present, and the 56 accepted / 90 held tally unchanged. `npm run control-center:test` passes 42/42; focused `node --check` passes for the S442 command harness; `git diff --check` passes with only the repository's LF→CRLF advisory.

No production source or test change is authorized or made in this slice. No physical fit, factory acceptance, industrial CAD compatibility, or production-readiness claim is made.

**Next action:** retry the specifically authorized Claude Opus 5.5 xhigh read-only research after its stated session reset, with a bounded question: can any source-supported Woven front/back view mapping satisfy the unchanged S370 position, continuous neckline, full source hems, exact cap/band joins and all 28 option renders? If that exact setup remains unavailable or returns no substantiated mapping, preserve holds and report the evidence; do not substitute a model or silently alter scope. V03 stays gated.

Elapsed 2026-10-07 21:24:08–21:29:11 UTC (5m03s): implementation 0m; source/evidence reconciliation about 1m; packet, decision record, state/context and board updates about 2m45s; focused preflight/replay/Control Center verification about 1m15s; external-agent waits 0m; maintainer-decision time 0m within this slice (the layout decision preceded S442). Times approximate.
