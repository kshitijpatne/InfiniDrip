# G04 V02 collar construction-reference review — Slice 294

## Start, authority, and boundary

- **Start:** 2026-09-30 09:16:12 UTC.
- **Goal:** audit newly identified primary collar-construction references against the precise Polo outer-cubic and Woven outer-collar/stand landmarks still required by V02. Decide whether either source supplies an exact shoulder-to-visible-contour relationship for these authored patterns. Retain the holds if the reference supports construction generally but cannot be mapped to current pattern topology.
- **Git:** started clean at S293 `baa7aa914ae3ce2e105efb118bedea8feade2fba` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S293 is the highest assigned slice; S294 is reserved.
- **Board:** canonical revision 508; EPIC-17 In Progress, G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog. S293 start and exit are linked.
- **Required context:** the G04 admission and roadmap, current state/context/maintainer decision, S285 reference inventory, S288 Polo outer-cubic audit, S286 Woven collar/stand mapping, current Polo/Woven draft topology and source IDs, and the newly located Massey collar thesis and Müller & Sohn collar-with-stand construction article.
- **Maintainer decision:** collar metadata may be added only with exact source-backed landmarks; Polo/Woven faces remain held until a specific applicable construction reference supplies the missing relation. This review does not authorize approximation from generic examples.

## Acceptance and gates

1. Record the reference identity, primary-source location, construction type and exact landmark/edge relationship it supports.
2. Compare each asserted landmark to the same-revision local outer/stand edges and authored center-back/shoulder/center-front marks. Distinguish explicit source claims from inference and pattern-specific product decisions.
3. If no unique exact correspondence exists for the current contour, retain the existing visible face holds; do not split a curve, add a notch, choose an arbitrary fraction or modify cut geometry.
4. Research-only closeout: preserve links/findings, run Control Center tests, and `git diff --check`; no production tests/build/coverage/export/browser gate applies unless implementation changes.
5. Keep G04-V02 In Progress and G04-V03 Backlog. MQF-004–007/011/012 remain review checks; MQF-015 remains assigned to V03. Preserve all post-G17 deferrals.

## Non-goals and risks

- No change to collar drafting, garment options, source marks, cut geometry, DXF, protected export bytes or renderer; no broad UI, new recipe, G09/D04, G05, physical sample, supplier contact, spending, hosted service, CAD profile or production-readiness claim.
- An academically valid generic collar system or another maker's pattern may establish construction practice without defining an exact point on these authored curves. Do not transfer coordinates, control points or cut shapes from a reference model into InfiniDrip.
- No safe delegated task; source provenance and local topology correspondence are one review boundary. Agent waits 0m; OpenCode is not used.

## Exit record

- **Massey source:** Morris Campbell's 2005 Massey University master's thesis, *Development of a composite collar drafting system*, treats multiple collar forms and studies how changing leaf-edge length/location affects the eventual 3D collar. Its stand-and-fall method combines the front/back body patterns at neckline points, overlaps shoulder lines, drafts a style-dependent outer edge, then places wedge lines from neck points to that edge. This is a drafting construction method, not a point-on-existing-cubic rule for InfiniDrip. It neither supplies the local authored contour nor specifies where the current Polo cubic or Woven straight outer edge crosses the source shoulder station. Its experiments also treat collar shape as construction/style-dependent.
- **Müller & Sohn source:** Sabine David, “Pattern construction for collar with stand” (2022; article identified as adapted from *Damen-Rundschau* 02/2012), gives a convertible separate-stand method, neckline and collar dimensions, and instructions to check the outer edge length. Its separate high-stand and Eton examples are different constructions. None defines an exact shoulder-to-leaf-edge landmark for the current InfiniDrip Polo or Woven role geometry.
- **Local comparison:** Polo's upper/under collar each have one authored `outer` cubic from front tip to center back; authored shoulder marks lie on their base seam segments, and no local outer-edge landmark exists. Woven's Fairfield reference supports the stand/collar assembly and shoulder notches at matched construction seams, while local upper/under outer edges remain unmarked straight runs; neither the generic thesis nor the separate-stand article binds that notch to a specific point on those edges.
- **Conclusion:** the additional primary references support collar construction practice but do not resolve the required local outer-contour correspondence. Keep the current Polo and Woven full-face holds. The exact needed artifact is a construction drawing or pattern specification for the same collar model that marks the shoulder location on the visible outer edge, or a source-authored landmark/relation in the InfiniDrip pattern. No cut geometry, pattern source, marks, DXF, export identity or production code changed. V02 remains In Progress; V03 remains Backlog.
- **Acceptance and findings:** reference identity and local edge trace are recorded; no exact mapping was established. MQF-004–007/011/012 remain review checks and `To be reviewed`; MQF-015 remains assigned to V03. Post-G17 deferrals remain unchanged. No V03 work started.
- **Verification:** research-only. No production test/build/coverage/export/Chromium gate applies. `npm run control-center:test` and `git diff --check` are required for closeout.
- **References:** [Massey University repository record and thesis](https://mro.massey.ac.nz/items/9e9c6d4e-3cb2-4308-b767-027a67aec188); [Müller & Sohn: Pattern construction for collar with stand](https://www.muellerundsohn.com/en/allgemein/pattern-construction-for-collar-with-stand/); prior specific sources remain in S288 and S285.
- **Board and Git:** started clean at S293 `baa7aa914ae3ce2e105efb118bedea8feade2fba`, with refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` an ancestor. Packet/start links and comment are on board revisions 509–511; verified exit evidence was linked to V02 at 512, EPIC-17 at 513, and exit comment recorded at 514 through validated commands. S294 is uniquely reserved; one `Slice 294:` commit contains this review.
- **Elapsed time:** start 09:16:12 UTC; exit 09:20:20 UTC; total 4m08s. Source comparison 2m; documentation/board closeout 1m; Control Center test and diff check 1m; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
- **Next action:** retain both collar holds until the requested specific construction artifact or authored pattern landmark is available; continue only independent V02 work that does not assume those collar boundaries. Do not start V03.
