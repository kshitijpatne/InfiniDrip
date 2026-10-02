# G04 V02 — Woven back sleeve crossing evidence review — Slice 381

## Start boundary

- Started 2026-10-02 21:20:53 UTC from clean S380 commit `072708ba4d5aef70c6e8defe39fb834dc923bf4a` on `codex/epic-17-g04`. `origin/main` was refreshed to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, remains an ancestor, and `git status` was clean. Highest assigned slice was 380; S381 is unique. Canonical board started at revision 1950; EPIC-17 and G04-V02 remain In Progress.
- Goal record is active and still needed through admitted G04 completion, final gates, PR and safe merge. Its “Begin by admitting” wording is stale; no goal mutation is available or needed.
- Scope: re-evaluate S373's 28 Woven back hem crossings against current pattern source, approved view mapping and the retained exact-revision emitted paths. Determine whether there is pattern-specific evidence for a display gap that does not imply disconnected hems. Diagnostic and durable evidence only.
- Gates: exact-source/revision and all-28 option reconciliation; inspect retained rendered default crossing close-up; keep every face hold and acceptance threshold; validated board exit and Control Center tests; `git diff --check`. No production code changed, so no changed-code coverage or full repository gate applies to this diagnostic slice.
- No independent safe delegation: this is a bounded comparison of one source edge, approved mapping and its actual emitted geometry. No external agent used.

## Findings

### Source and projection evidence

- **Directly encoded in pattern source:** current `src/drafting/shirt.ts` defines one uncut Woven sleeve piece with `onFold: false`, with continuous `capLeft`, `capRight`, `sideRight`, `hem`, and `sideLeft` edges. The straight `hem` runs between `rightHem` and `leftHem`. The stitch graph attaches the complete `sleeve.hem` edge to `sleeveBand.top`; the band width is derived from that hem length. No notch, break, offset, or sleeve-to-sleeve join is encoded at the crossing station.
- **Previously approved view convention:** two sleeve instances are shown in the back view by reflecting the source sleeve across `back.centerBack`. Each includes the mapped hem run. Both currently use `GARMENT_SILHOUETTE`; the pair's quantity is two. The S321/S344 mappings do not specify over/under order or a local interruption in either hem.
- **Exact retained output evidence:** S373's independent segment trace uses the S372 live Chromium SVGs at `live-draft:woven-shirt:14:14`, for all 28 supported Woven option rows. It records two same-source `pattern:woven-shirt:role:sleeve` paths, one proper hem-to-hem crossing in every back view, identical paths and crossing coordinates to S365, and zero browser errors. The current intervening S380 code is Polo-specific; it does not change Woven mapping or SVG output. The retained current path data still shows both hem strokes continuous through the intersection.
- **Rendered review:** inspected S373's actual annotated crossing close-up. Cyan and orange each trace a distinct reflected sleeve instance; both lines continue through the crossing. It gives no visual or source indication that either physical hem terminates or passes behind the other. Existing whole views and five selected crossing close-ups are retained in `S373-woven-sleeve-crossing/annotated/`.

### Gap proposal disposition

- The former S373 0.60 cm reflected-hem interruption is **not supported by pattern-specific evidence**. Its endpoints are a proposed display interval around the computed intersection, not authored geometry landmarks. Its stated effect is to make one sleeve appear to pass behind another and could falsely suggest a physically interrupted hem; the stitch source explicitly continues the whole hem into the sleeve band.
- No construction reference specific to this pattern's back-view over/under relation or hem interruption is present in the checked S373 evidence. The existing task research/search result already reports no unchecked reference capable of establishing this projection fact; general sewing conventions cannot settle the authored view order.
- Therefore no adjusted gap render is warranted. Do not add the 0.60 cm gap or another visual separation. Keep all 28 Woven back views held for the crossing; all 56 Woven faces and all 34 Polo faces remain held. This decision does not resolve other Woven/Polo blockers or release any face.

## Acceptance and next action

- Passed: exact source semantics and the retained 28/28 output crossing evidence agree; the actual close-up was reviewed; unsupported separation is rejected; all holds and all-seven V02/V02-before-V03/export gates remain intact.
- Unchanged: pattern and cut geometry, stitch graph, view metadata, renderer, export behavior, byte identities, and board acceptance.
- Required G04 gates remain: all-seven-recipe coverage, option-wide joins and readable callouts/overlays, final output review, protected legacy/export checks, and V03 rights/profile plus proved round-trip. No physical fit, factory acceptance or production-readiness claim.
- **Next action:** perform one consolidated Polo 17-option remaining-blocker attribution using S379 matrices and S380 keyed output, separating the now-cleared C marker rows from all other source POM/path and 0.68 cm residual failures. Keep all 34 Polo faces held and preserve the 0.25 cm gate.

## Exit verification and time accounting

- Reused the exact retained S373 trace over 28/28 Woven options and the S365 comparison; the current production change since then is restricted to Polo and has no Woven effect. No regenerated output or geometry change was needed because the question was whether existing source/output supports the proposed gap.
- Existing source trace and actual annotated default crossing close-up were manually inspected. The source-stitch relationship confirms an uninterrupted hem; no evidence supports the display gap.
- Board start/exit records use the validated Control Center command layer, revisions 1950→1960. `npm run control-center:test` passes 42/42 and `git diff --check` passes. Board status validation confirms EPIC-17 and G04-V02 remain In Progress and 14 UIQ entries remain future/backlog items. No production source/test changes; no full Epic gate.
- Approximate elapsed time (6m): implementation 0m; source/output review and reconciliation 2m; focused checks 1m; rendered review 1m; durable packet/state/board closeout 2m; external-agent waits 0m; maintainer-decision time 0m.
