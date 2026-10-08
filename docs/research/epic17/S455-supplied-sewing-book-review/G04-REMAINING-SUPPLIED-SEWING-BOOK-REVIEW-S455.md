# G04 and product-wide review of remaining supplied sewing books — Slice 455

## Start boundary

- Started 2026-10-08 02:26 UTC from clean S454 commit `16ea64244dc211d01232c23b9d2be87fec3a82e6` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice across reachable history is 454; S455 is reserved.
- Canonical board revision 2748: EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held across 73 configurations / 146 faces. Goal record active and aligned with the admitted objective.
- Usage at start: primary 14%, weekly 24%; ordinary usage allowed.
- S454's proposal-only Woven front mask remains unapproved and unimplemented; no work in this slice changes that pending S425 decision or the fixed S370 back-view decision.

## Authority and scope

This slice continues the maintainer's explicit request to evaluate the supplied books as resources for both the current G04 blockers and the broader InfiniDrip product, using independent Claude/OpenCode research where safe. S453 already reviewed only Kim & Kim's supplied first edition and Gareth Kershaw's menswear book. S455 reviews these remaining supplied files:

1. Connie Amaden-Crawford, *A Guide to Fashion Sewing*.
2. Ysabel Hilado, *Fashion Upcycling: The DIY Guide to Sewing, Mending, and Sustainably Reinventing Your Wardrobe*.
3. Claire B. Shaeffer, *High-Fashion Sewing Secrets from the World's Best Designers*.
4. Lee Hollahan, *How to Use, Adapt, and Design Sewing Patterns: From Store-Bought Patterns to Drafting Your Own*.
5. Joi Mahon, *Ultimate Illustrated Guide to Sewing Clothes: A Complete Course on Making Clothing for Fit and Fashion*.

For each title, establish identity/provenance from title/copyright pages where available; inspect contents and only the relevant printed pages/figures; render and visually inspect pages relied upon. Classify each finding as direct construction/content evidence, general convention, or product-design inference. State exactly whether it addresses either current G04 blocker (S454 Woven front neckline/collar contact or S442 fixed-S370 Woven back sleeve/band crossing), another admitted G04 criterion, or a possible later product capability. Avoid treating generic instructions as proof about `live-draft:woven-shirt:14:14`.

## Delegation and ownership

- Codex owns the packet, current-source comparison, state/context/board changes, review, and commit.
- Claude Code is assigned the two independent sewing-technique titles: *A Guide to Fashion Sewing* and *High-Fashion Sewing Secrets*. It writes only `CLAUDE-SEWING-TECHNIQUE-BOOKS.md` in its separate S455 worktree. Use Claude Opus 5.5 as requested; do not substitute a different model if unavailable.
- OpenCode is assigned the two independent pattern-use/fit titles: *How to Use, Adapt, and Design Sewing Patterns* and *Ultimate Illustrated Guide to Sewing Clothes*. It writes only `OPENCODE-PATTERN-AND-FIT-BOOKS.md` in its separate S455 worktree, with Muse Spark 1.3, xhigh, normal mode. Do not use fast mode or another model.
- Codex independently reviews *Fashion Upcycling* in this worktree because its possible value is product-wide sustainability/repair, outside the delegated construction and pattern/fit bundles.
- Reports must use concise paraphrase and exact bibliographic/printed-page/figure references. Do not copy book pages, extended copyrighted text, or illustrations into the repository. Contributors must return explicit `WORK FINISHED` before Codex reads their reports. If the required Claude or OpenCode configuration is unavailable, stop that assignment and record the limitation; no substitution.

## Exact handoff criteria

For each assigned book, identify relevant claims/illustrations, exact printed page and figure (and PDF page index separately where discernible), what a figure demonstrates and what it does not. Explicitly answer:

- Does the material establish a truthful view-only way to show the S454 Woven collar/neckline overlap while retaining the S425 continuous seam decision?
- Does it establish an orientation/instance/placement rule that clears Woven sleeve/band crossings while preserving the fixed S370 side-gutter detail positions?
- What source-to-view, construction annotation, POM/readability, user guidance, pattern education, repair or sustainability capability could it inform elsewhere in InfiniDrip?
- Which conclusions remain convention, inference or product decision, and what exact source-specific fact is still absent?

No one is authorized to alter production code, design choices, pattern/stitch geometry, CAD behavior, face holds, acceptance criteria, protected exports, or S454/S442 decisions. No physical fit, factory acceptance or production-readiness claim. Do not begin V03 ahead of V02 exit.

## Required exit gates

- Verify the reports against the PDFs' metadata/title/copyright/contents and visually inspect every cited page.
- Record quality/provenance limitations and do not reproduce protected material.
- Conclude whether these books materially change G04's immediate next action; avoid another broad source search unless a specific promising title/page remains unchecked.
- Preserve 56 accepted / 90 held and all existing gates, including all-seven V02, V02-before-V03, the 0.25 cm Polo residual gate, legacy DXF, protected export identities, and V03 rights/round-trip evidence.
- Run `npm run control-center:test`, validate board preflight/replay/read, parse the research scripts, and run `git diff --check`. No production-code coverage, build, or export gate is due for this research-only slice.
- Update `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, and this packet at exit; update the canonical board only through its validated command layer.
- Record research, implementation, focused verification, agent waits, and maintainer-decision time separately at exit. Next action is S454's pending neckline choice or a source-backed independent V02 blocker step; do not implement pending mappings without approval.

## Start board record

Validated commands and clone preflight are adjacent. No status transition is authorized.
