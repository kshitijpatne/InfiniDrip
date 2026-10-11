# G04 supplied menswear-book review — Slice 453

## Start boundary

- Started 2026-10-08 01:41:58 UTC from clean S452 `3b0832cc8e39f05c429535cd8e23e47e2b02c464` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. The highest slice across reachable history is 452; S453 is reserved.
- Canonical Control Center revision 2725: EPIC-17/G04 and G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held across 73 configurations / 146 faces. Goal record active and matches the admitted objective.
- Usage at start: primary 8%, weekly 23%; ordinary usage allowed.

## Authority and scope

This slice continues the maintainer-authorized proposal-only Woven source-design study and the explicit request to assess user-supplied books as resources for G04 and the wider product. It inspects only the supplied `Patternmaking for Menswear: Classic to Contemporary` (Myoungok Kim and Injoo Kim) and `Patternmaking for Menswear` (Gareth Kershaw) PDFs for exact page/figure evidence about woven shirt components, sleeve-cap/front-back identity, collar/stand construction, closure/band details, and technical flats.

The review is evidence-only. It may record whether a specific figure supports an existing proposal or materially changes the unresolved design question. It may not alter production source, pattern/cut geometry, stitch graph, projection/view metadata, POMs, face holds, V02 acceptance, fixed S370 band positions, V03 gates, exports or board status. Do not reproduce copyrighted pages or extended text; record bibliographic page/figure references and concise analytical findings only. Do not purchase or access restricted material.

## Controlling blocker evidence

- Source revision: `live-draft:woven-shirt:14:14`.
- S451's two trial candidates conflict with existing maintainer decisions: collar foreground masks `0.8426–0.8433 cm` of visible neckline seam on each side (S425); local-Y back reflection clears sleeve crossings only after moving fixed S370 band details `20.5737–22.4315 cm` outward per side and expanding the viewBox `41.1474–44.863 cm`.
- All 56 Woven views and 34 Polo views remain held. V02 all-seven acceptance, V02-before-V03, the 0.25 cm gate, legacy DXF and protected identities are unchanged.
- Existing qualified web sources are in S449/S450. Do not repeat broad research; inspect only the two supplied titles for specific figures not previously inspected.

## Delegation and ownership

- Codex owns this packet, state/context/architecture/decision updates, board replay, integrated review and commit.
- Claude Code is assigned only the Kim & Kim title, writing `CLAUDE-KIM-MENSWEAR.md` in its separate S453 worktree. It must use the requested Claude Opus 5.5 model; if unavailable, stop that assignment and report the exact limitation.
- OpenCode is assigned only the Kershaw title, writing `OPENCODE-KERSHAW-MENSWEAR.md` in its separate S453 worktree with Muse Spark 1.3, xhigh reasoning, normal mode. This exact model/variant is present in the configured model list; never substitute another configuration.
- The output files are disjoint. Agents may not edit shared state, board, source, renderer, tests, or each other's output. Both must return explicit `WORK FINISHED` before Codex reviews any worktree result. A summary is not proof: Codex checks book title/page/figure identity, PDF metadata, and visual pages itself.
- No independent implementation task is safe; view semantics remain controlled by unresolved maintainer choices. Agent waits and decision time are recorded separately at exit.

### Exact handoff prompts

**Claude / Kim & Kim:** Read the current `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, the S449/S450/S451/S452 G04 packets, and the S425/S442 decision entries before reviewing. Inspect only the user-supplied `F:\tank-sketches\patternbooks\Patternmaking for menswear - classic to contemporary -- Myoungok Kim; Injoo Kim; Bloomsbury Publishing -- ( WeLib.org ).pdf`. Identify exact relevant printed pages, figure numbers, and PDF page indices for woven shirt collars/stands, front/back sleeve-cap identity and notches, cuff/band joins, and paired-sleeve/back-flat presentation. Render and inspect cited figures; do not rely on extracted text alone. For each finding state what the book directly depicts/says, what is only a general construction convention, what it cannot establish about `live-draft:woven-shirt:14:14`, and whether it changes either exact S451 proposal or its tradeoff. No web search, code, source/view/board edits, copyrighted figure copies or extended quotations. Write only `docs/research/epic17/S453-supplied-menswear-book-review/CLAUDE-KIM-MENSWEAR.md` in your worktree, leave it uncommitted, and return explicit `WORK FINISHED` plus the required JSON status/summary/file/page/figure/rendering/limitations report.

**OpenCode / Kershaw:** Read the same current project context and S449/S450/S451/S452 plus S425/S442 decisions. Inspect only the user-supplied `F:\tank-sketches\patternbooks\Patternmaking for menswear -- Kershaw, Gareth -- ( WeLib.org ).pdf`. Identify exact printed pages, figure numbers, and PDF page indices for woven shirt and polo construction, collar/stand and closure order, sleeve front/back identity and band/cuff joins, and any front/back technical-flat example. Render and inspect cited figures; do not rely on extracted text alone. For each finding separate depicted/source fact, generic convention, inference and product decision, state whether it supports or fails to settle the exact S451 alternatives and why. No web search, code, source/view/board edits, copyrighted figure copies or extended quotations. Write only `docs/research/epic17/S453-supplied-menswear-book-review/OPENCODE-KERSHAW-MENSWEAR.md` in your worktree, leave it uncommitted, and return explicit `WORK FINISHED` plus a concise JSON status/summary/file/page/figure/rendering/limitations report. Use Muse Spark 1.3, xhigh, normal mode only; if that exact setup is unavailable, stop without substituting.

## Acceptance and non-goals

Pass only if the book/page/figure and visual-inspection status are verified, each finding is classified as direct construction evidence, generic convention, or no support, exact relevance/limits for S425 and S442 are stated, no copyrighted image/text is copied, and all production state remains unchanged. No face may be released from this review.

Non-goals: no semantic mapping implementation; no scope revision; no general web search; no new garment or UI work; no physical sampling, fit/factory/production-readiness claim; no V03 receiver selection or compatibility claim.

## Required checks and exit record

- Validate both agent outputs against the source PDFs and inspect cited figures at readable resolution.
- Preserve exact source/book page numbering and separate PDF page index from printed page number where they differ.
- Run the Control Center tests and board preflight/replay/read/evidence checks; run `git diff --check`. No production test/build/export gate is due for research-only work.
- Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `ARCHITECTURE.md` only as needed to link the new evidence without changing product claims, `docs/PROJECT-DECISIONS.md` only if a genuine new decision is approved, and the canonical board through validated commands.
- At close, record whether the supplied books change either next action, the pending S451 choices, current holds/tally, all gate status, elapsed research/implementation/focused verification/external waits/maintainer-decision time, and one next action.

## Integrated findings and Codex review

Both contributors returned explicit `WORK FINISHED`; Codex reviewed the actual reports and independently checked source pages and project output.

- **Kim & Kim supplied PDF:** Codex rendered its title page (PDF p.2), confirming this is the 2014 first edition, not the publisher-qualified 2025 second edition cited in S449. Codex also inspected the two-piece shirt-collar drawing (PDF p.91) and finished collar/stand pieces (PDF p.94). These support that separate stand and collar components and their pattern marks are established construction concepts; they do not establish the InfiniDrip revision's visible layer or projection. The supplied copy's provenance and rights remain unassessed.
- **Kershaw supplied PDF:** Codex independently inspected the cited pattern/flat pages reported by OpenCode, including collar/stand and paired front/back illustrations. They provide useful general shirt and polo construction examples, but not source-specific mapping or a paired detached-band layout matching this Woven revision. The copy's provenance and rights remain unassessed.
- **General reusable value:** The reports document sleeve-cap front/back notch identity, collar/stand and upper/under-collar piece construction, and cuff/band attachment examples. These may inform future construction references, provided they are not treated as source-specific facts or transplanted dimensions. No figure is copied into the repository.
- **S407 collar-trial correction:** Codex inspected the actual baseline and trial PNGs and the trial matrix for `live-draft:woven-shirt:14:14`. The visible neckline runs continuously through the open V between the projected collar leaves; the leaf contours meet it at approximately `x=±0.8424 cm`. The S407 trial removes the neckline from center front out to those intersections (`0.8426–0.8433 cm` per side). That removed segment is inside the open V, where the leaves do not cover it. Therefore the packet's former description that this interval is hidden beneath foreground collar material is geometrically false. This trial must not be presented as an evidence-backed foreground-occlusion fix. A valid opaque-collar candidate would need to mask only the neckline portions actually inside each projected leaf silhouette, then demonstrate its endpoints and all-option output; that is a new proposal and still conflicts with S425's continuous-visible-neckline decision.
- **S442/S370 back hold:** Neither book shows detached side-gutter bands in the current layout or provides a source-specific sleeve pose that can preserve S370 positions while clearing the 28 crossings. The S441 outward layout still requires the previously measured large band relocation and viewBox expansion. Preserve S370 positions and the 28 back holds.

No book evidence settles the S425 or S442 product decisions. Keep all 56 Woven faces and 34 Polo faces held, tally 56 accepted / 90 held over 73 configurations / 146 faces, and preserve all-seven V02, V02-before-V03, 0.25 cm Polo residual, legacy DXF, protected export identities and V03 rights/round-trip gates. No source, renderer, test, geometry, acceptance, hold or production claim changed.

## Exit verification and handoff

- `npm run control-center:test`: 42/42 passed.
- Board exit preflight: 2727→2731 passed; validated command replay produced revision 2731. EPIC-17 and G04-V02 remain In Progress, V03 Backlog, tally 56 accepted / 90 held.
- `git diff --check` passed.
- No production code changed. Full build, global coverage, export identity and browser gates are not due for this evidence-only slice.
- Elapsed from 2026-10-08 01:41:58 UTC to 02:03:53 UTC: implementation 0m; source/report review about 7m; focused verification about 2m; rendered output/PDF inspection about 3m; external-agent waits about 15m (overlapped); maintainer decision time 0m; durable records and board closeout about 5m. Approximate wall-clock duration 22m.
- **Current blockers:** source-specific Woven front collar/neckline visible-layer choice; Woven back sleeve crossings under the fixed S370 layout; existing Polo held faces/0.25 cm sleeve residual; then V03 profile-rights and round-trip evidence. No new material information is needed from the maintainer about the books.
- **Next action:** create a bounded proposal-only Woven front-mask trial from the exact projected collar silhouettes (not the invalid center-to-intersection clip), render and measure every applicable option, then ask for a decision only if the trial has a concrete output and clearly states its effect on S425. Preserve all holds meanwhile. Resume G04 directly from this S453 boundary; the goal record is active and accurate.
