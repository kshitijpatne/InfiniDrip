# G04 V02 — evidence-backed blocker review — Slice 431

## Start boundary and authority

- Started 2026-10-07 17:14:10 UTC from clean `518fdff201b88f2bf7188e71741b2895f5142628` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 430; 431 is reserved. Canonical Control Center board is revision 2544; EPIC-17 and G04-V02 are In Progress, V01 Done, V03 Backlog. Usage at start: ordinary work allowed, primary 18%, weekly 11%.
- Maintainer chose to continue admitted Path 1. No all-seven V02, 0.25 cm gate, V02-before-V03, export, physical-claim, or scope changes are authorized.
- User specifically requests Claude Opus 5.5 research to find verified remedies for the remaining repeated G04 blockers, avoiding speculative renderer trial-and-error. `claude --model claude-opus-5-5 --print ...` returned successfully; delegated work is read-only and isolated.
- Current integrated status from S430: 56/146 accepted, 90/146 held; 56 Woven and 34 Polo faces held. V01 Done, V02 In Progress, V03 Backlog.

## Objective and bounded scope

Independently research whether verifiable, source-faithful remedies exist for the exact remaining V02 blockers, using current repository source, retained same-revision output evidence, pattern-specific documents and carefully selected authoritative references only where they can establish a fact for these patterns:

1. Woven front: the continuous body neckline contacts projected collar contours in all 28 options. Preserve the approved continuous seam and existing collar/order conventions. Determine whether source topology or a pattern-specific source establishes an exact truthful view-layer/placement remedy; assess any proposed remedy against preserving both seam and collar readability.
2. Woven back: mirrored sleeve hem contours cross in all 28 options. Preserve the two mirrored sleeve/band instances and source stitch graph; do not add a gap or relative over/under convention without supporting evidence. Determine whether exact source topology or a pattern-specific source establishes a truthful assembly/view mapping.
3. Polo: exact 17-option production residual is 0.677835 cm, above the fixed 0.25 cm gate; even the best rigid endpoint fit is 0.479302 cm. The source's 43 cm sleeve span is coupled to a bicep-width POM; the previously tested narrowing candidate was rejected. Determine whether any source-backed pattern repair can retain that POM and authored ease, or whether the residual metric is inapplicable to the already approved eased-seam display convention and a separately approved, ease-specific criterion would be required.

The assignment is a targeted evidence review, not code implementation or another sequence of arbitrary render experiments. Reconcile existing exact-source artifacts first. Do not repeat broad construction references already checked. Search externally only for an exact pattern-specific/authoritative source that could settle one of the identified facts; cite URL, author/issuer, relevant passage/page, and the precise fact established. General sewing convention is not evidence about these authored patterns.

## Acceptance and evidence gates

- Attribute every result as directly encoded in current pattern source, supported by an exact pattern-specific reference, an authoritative but non-pattern-specific technical source, or an unverified design decision.
- Cite exact source files/entities/edges/stitches and exact S-slice artifacts/revisions/options; reconcile with actual rendered evidence already retained. Do not claim a fix is verified unless it has been tested against the current source/output and its complete affected option matrix.
- For each blocker, return either a verified source-backed remedy with the minimum required implementation/option-wide/rendered checks, or a precise finding that no verified remedy is established and the specific evidence/maintainer decision still needed.
- Explicitly state the impact of each candidate on geometry, stitch graph, POMs, 0.25 cm gate, legibility, all-seven V02, and which faces remain held.
- No changes to production source, tests, pattern/cut geometry, source stitches, options, current acceptance/gates, board, or protected exports in delegated work. No physical/factory/fit claim, sampling, supplier contact, license purchase, or spending.
- Codex reviews all claims and any web sources. Only after review will the S431 exit packet state whether the findings clear blockers or identify a bounded maintainer decision; face status remains fail-closed.

## Scope boundaries, blockers, and next action

- Preserve prior decisions in `docs/PROJECT-DECISIONS.md`, including the approved S406 Woven view conventions, continuous neckline, rejection of the Polo span reduction, and unchanged 0.25 cm Polo gate.
- Do not reopen resolved markers, POM placement, S406 collar/placket order, or broad construction research.
- V03 remains gated until all-seven V02 passes. S421's receiver-rights evidence is a separate downstream prerequisite; this slice does not start V03.
- No safe production implementation is delegated: Codex retains all geometry and integration ownership. Claude receives a disjoint, read-only evidence-analysis assignment in a separate worktree and must return an explicit `WORK FINISHED` signal.
- Next action after S431: implement a remedy only if Codex verifies that the evidence uniquely supports it; otherwise present the smallest exact, grouped maintainer decision or recommend a documented hold without weakening scope.

## Delegation handoff (Claude Code, read-only)

**Why safe:** independent research and source-artifact reconciliation cannot change production behavior or decisions; Codex owns geometry, implementation, rendered validation, and scope decisions.

**Contributor/model:** Claude Code CLI, `claude-opus-5-5`, xhigh effort, plan/read-only mode. Separate worktree branch `claude/slice-431-g04-blocker-research`.

**Read:** `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, `docs/planning/EPIC-17-ADMISSION.md`, S373/S381/S406/S417/S423/S427/S428/S430 packets and linked matrices/renders; then exact source files those records cite.

**May modify:** no repository files. Return findings in the CLI response only.

**Must not modify:** all repository files, branches, board, tests, baselines, pattern/stitch geometry, production renderers, or decision records.

**Return:** structured JSON with one entry per blocker, source evidence, specific external sources actually checked (or state no exact source exists), verified candidate remedies, assumptions/tradeoffs, held face counts, and `status` plus the explicit line `WORK FINISHED`.

## Start board record

`S431-start-board-commands.json` records the scoped research packet through the validated Control Center command layer. Board statuses and all G04 acceptance/holds are unchanged.

## Codex evidence reconciliation and exit

### Woven back sleeve crossing — no verified remedy established

- **Directly encoded:** the same-revision `live-draft:woven-shirt:14:14` source stitch `Woven sleeve-cap ease` joins `sleeve.capLeft + sleeve.capRight` to `front.armhole + yoke.armholeUpper + back.armholeLower`; `Folded sleeve band ↔ sleeve hem` joins `sleeveBand.top` to `sleeve.hem`. The approved pair metadata declares two sleeve instances reflected about `back.centerBack` (`src/render/technical-flat-projection.ts`, `wovenSleeveCapBoundary` / Woven role map).
- **Existing exact output:** S373 independently intersects the actual S372 Chromium SVG paths for all 28 options. Each back has exactly two same-revision sleeve outlines and exactly one proper hem-to-hem crossing; all 28 paths match S365. The center crossing is on `sleeve.hem` in both instances. S344 already explains the source cap traversal and ease; S370 verifies band details separately and explicitly leaves the main sleeve crossing unresolved. S373/S381/S428 contain no accepted gap or over/under treatment.
- **Claude Opus 5.5 lead, not verified:** a local-Y reflection of one sleeve was suggested as a possible orientation experiment. It is not a source-encoded transform, no exact source mark/edge defines it for this Woven assembly, and the S373 matrix contains no transformed candidate with all cap/underarm/band joins checked. It could invert sleeve handedness or break those joins. Treating it as a fix would be a new view-design decision, not research confirmation. No implementation or candidate render was made.
- **Disposition:** no source-backed non-crossing solution is established. Do not add hem separation or arbitrary order. All 28 Woven backs remain held pending either a specifically approved, accurately labeled view convention with all-28 join/output proof or a documented hold/scope decision.

### Woven front collar/neckline contacts — no verified remedy established

- **Directly encoded:** the body neckline and outer stand base share the source stitch; the continuous body neckline is the approved single base-seam stroke, with the duplicate stand-base stroke suppressed (S342/S343). The outer collar is mapped from the same-revision neckline by the approved normalized-arclength convention (S359). Front placket order and collar-over-plackets clipping are separately approved and implemented (S321/S406).
- **Existing exact output:** S417/S428 retain contacts between the continuous neckline and projected collar contours in all 28 front options. The earlier clip cuts approximately 0.84 cm from each side of the continuous source neckline and was rejected. Repainting the neckline above the collar, deleting collar strokes, or otherwise changing the contact hierarchy has no source/pattern-specific evidence establishing that order and risks a false join or obscured collar edge.
- **Disposition:** no verified view-only treatment clears the contact while preserving a legible, truthful continuous seam and collar. All 28 fronts remain held. No outside source was found that speaks to these exact authored pattern edges; previously checked general collar/construction references cannot settle their display order.

### Polo eased sleeve residual — evidence establishes an acceptance-metric conflict

- **Directly encoded:** `src/drafting/sleeve.ts` sets the cap span from bicep width plus authored ease; Polo’s `Sleeve-cap ease` stitch permits the authored unequal seam lengths. The bicep POM uses the same cap/side junctions. The approved S351 display maps each cap half to its receiving body armhole by normalized arclength (view correspondence, not a cut/stitch edit).
- **Existing exact evidence:** S423 reproduces 0.677835 cm endpoint RMS and 0.958604 cm cap/armhole chord mismatch for each of 17 Polo options; best unconstrained rigid endpoint fit is 0.479302 cm, still above 0.25 cm. S427’s only tested threshold-reaching source-span candidate changes the POM span by −7.269095 cm and materially reshapes the sleeve; it was rejected. S415 confirms the current production metric still reports the residual with the S351 projection present. S332’s visual clearance evidence predates S351, so the current endpoint-gap appearance is not independently verified in this slice.
- **Claude Opus 5.5 proposal, not authorized or implemented:** because S351 intentionally depicts an eased seam by receiving-edge arclength correspondence, make this one named `Sleeve-cap ease` residual informational when that exact validated representation is present, analogous to the narrowly named Woven S344 representation exemption in `technical-flat-assembly.ts`. Keep the numeric 0.25 cm limit enforced for all other joins, wrong-piece/revision checks, joins, crossings, and output gates. This does not alter source geometry or the authored ease, but it changes applicability of the V02 residual gate and therefore requires explicit maintainer approval. It cannot be called a pass until tests and all 17 rendered option pairs demonstrate the seam mapping remains truthful and no other gate is bypassed.
- **Disposition:** without that gate-applicability decision or a separately approved source repair that preserves the POM, all 34 Polo faces remain held. The existing tested source repair is not viable; no alternative construction station is encoded. Preserve the user’s fixed 0.25 cm numeric threshold unless and until the maintainer explicitly approves the narrow applicability rule.

### V03 and overall status

- V03 is blocked first by the explicit V02-before-V03 dependency: the 90 held Woven/Polo views prevent all-seven V02 completion.
- After V02, S421 is still the only receiver-rights research. It qualifies no no-cost industrial apparel receiver: CLO documents relevant DXF functions but its trial requires payment details and converts to paid access; the checked open tools do not establish a rights-cleared apparel-DXF receiver. No receiver/version/profile has been selected and no fixture round trip exists.
- V03 therefore also needs a lawful receiver/profile decision, a recorded rights basis, representative fixtures, import/export round-trip evidence, and a precise profile statement supported by that evidence. No exact format-compatibility claim is supportable now. These are downstream gates, not reasons to weaken V02.

### Claude research method and limits

The exact `claude-opus-5-5` model was verified in CLI stream metadata. The read-only repository audit returned `WORK FINISHED`; it did not have WebSearch/WebFetch tools in its allowed tool set and cited no new external source. Its local-source conclusions above were reconciled against current production files and retained same-revision packets. No general construction searches were repeated. The local-Y reflection and Polo exemption remain proposals, not externally or experimentally verified fixes.

### Exit evidence and time

- No production code, tests, pattern/stitch geometry, options, accepted view, export identity, acceptance criterion or face status changed. S431 resolves the evidence question but does not clear any V02 blocker. Holds remain 56 Woven and 34 Polo; 56 accepted / 90 held overall.
- Board start replay: revision 2544→2546. Exit replay and focused verification are recorded in `S431-exit-*`; V02 remains In Progress, V03 Backlog, EPIC-17 In Progress.
- Slice elapsed 17:14:10–17:43:37 UTC (~29m27s): research/packet reconciliation ~5m; focused source and retained-output validation ~3m; durable records/board and closeout ~1m; implementation 0m; external-agent waits ~20m (including two unusable invocation attempts before the successful exact-model read-only run); maintainer decision wait 0m. These are approximate wall-clock allocations; no implementation was blocked waiting for maintainer input.

**Next action:** request one explicit decision on Polo residual applicability: approve the narrowly named S351 eased-seam exemption while retaining 0.25 cm for every other join, or retain the current metric and keep all 34 Polo faces held. Do not proceed with the Woven local-Y experiment as a claimed fix; only pursue it after a bounded view-decision approval and same-revision all-option join proof. V03 stays gated until all-seven V02 passes and a rights-cleared receiver/profile is evidenced.
