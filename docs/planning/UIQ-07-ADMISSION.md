# UIQ-07 isolated welcome-visual candidate admission

Authority: maintainer said “okay proceed” on 2026-10-07 after selecting an
isolated UIQ-07 welcome-visual candidate as safe parallel work during EPIC-17.
This admits one previewable, unshipped native presentation candidate only.
Goal started 2026-10-07 17:27:23 UTC /13:27:23 America/New_York. No numbered
slice is assigned to this candidate.

## Verified base and ownership

- Coordinator checkout F:/designApp, branch `codex/uiq-parallel-candidates`,
  HEAD `50afb32ea8e5bd42ebb73fda13cc863e89fd9d8f`; committed tree matches
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`.
- Local canonical board revision447. UIQ-02 foundation candidate is Done with
  immutable proof `docs/research/uiq-parallel/CANDIDATE-EXIT.json`; UIQ-07 parent
  is Backlog. This packet and a new `UIQ07-CANDIDATE` child track candidate
  review without marking the parent shipped.
- Existing accepted candidates, prior proofs, and active coordinators already
  leave this checkout dirty. This task owns only the new files explicitly listed
  below and its additive board/context records. In particular do not rewrite or
  normalize existing uncommitted source, board, baseline, or old evidence.
- EPIC-17 remains independently active on
  `C:/Users/kshit/.codex/worktrees/epic-17-g04/designApp`, branch
  `codex/epic-17-g04`, at `518fdff201b88f2bf7188e71741b2895f5142628` while Slice431
  is being recorded (S430 is complete; EPIC-17 next action is its own S431).
  That checkout currently has its own S431 evidence and board changes. Do not
  inspect/write its source, board, status, worktree, goal, or contributor sessions;
  do not add any UIQ dependency to G04 closure.
- Prior accepted UIQ-02/03/04/05 proofs are frozen read-only inputs. UIQ-02
  foundation CSS tokens/semantics may be reused by import in the standalone
  preview, not edited or globally mounted.

## Bounded files and presentation contract

Only these new candidate files may contain implementation:

- `src/ui/enhancements/entry/welcome-panel.ts`
- `src/ui/enhancements/entry/welcome-panel.css`
- `src/ui/enhancements/entry/welcome-panel.test.ts`
- `ops/ui-candidates/welcome.html`
- `ops/ui-candidates/welcome-preview.ts`
- `ops/ui-candidates/welcome-verify.mjs`
- `docs/research/uiq07/**` for candidate-specific evidence/review.

This is an original static native welcome backdrop with a typographic
metal-inspired InfiniDrip wordmark, in-family palette, and concise welcome
copy. Use CSS gradients and decorative CSS geometry only: no downloaded,
generated, or bundled image/font asset; no URL-valued CSS; no runtime or build
dependency; no framework/renderer. Keep every selector scoped under `.uiq-entry`
and compose the previously accepted `.uiq-foundation` class without changing
foundation source/tokens. The wordmark remains readable text in forced colors.

The preview must visibly say it is an isolated candidate, not the live app. The
component is static and has no navigation, CTA, account/login/profile, tutorial,
brand-profile, feature-flag, or persistence behavior. Copy must not claim
authentication, cloud access, physical fit, or capabilities not present in the
existing app. Decorative content is `aria-hidden`; the page has one clear
heading and a concise, non-interactive welcome message.

## Exact boundaries and acceptance

Codex owns this small cohesive implementation, review and fixes. No safe
disjoint coding task justifies another contributor/worktree; independent actual
browser checks are still required. No worktree is created for this root-only
candidate. Reviewers use the returned-code diff and rendered candidate, not a
visual concept alone.

Acceptance requires:

1. Candidate typecheck and repository build succeed without changing app entry,
   package/lock/config, or production bundle wiring.
2. Focused component tests cover all executable production branches/functions/
   lines/statements at100%; no silent runtime dependency is introduced.
3. Actual browser review at desktop and narrow 320/390px widths; text and
   decorative layout do not overflow. Check keyboard/document semantics, zoom-
   equivalent reflow, forced-colors, reduced motion, contrast, and mobile
   viewport behavior. Capture evidence.
4. Network log contains no external requests. Hostile HTML-looking text is
   rendered literally; CSS has no external fetch/image/font URLs.
5. Existing accepted UIQ02/03/04/05 proof hashes and protected production files
   remain unchanged. No export identity baseline moves.
6. Codex records reviewer decision and board evidence. Parent UIQ-07 stays
   Backlog/unshipped. The candidate is not committed/pushed/deployed by this
   admission. Production wiring requires the separate UIQ-GATE after settled,
   merged EPIC-17; UIQ-13's conditional gradient pilot is not admitted.

Risks to pressure-test: metallic text can lose contrast under forced colors or
text selection; multi-layer gradients can reduce legibility at small widths;
decorative geometry can imply a sewn-fit or physical garment result; body-level
CSS can leak into the host. The contract addresses these with solid fallback,
selectable visible text, non-semantic abstract decoration, no fit claims, and
root-scoped CSS. Native CSS is intentionally preferred over imagery/renderer.

Usage at goal start: primary21% used, weekly12%, ordinary usage allowed,
no banked reset credits. Luna-max is default when selectable; no model switch is
claimed because this interface exposes no model selector. No delegation or
external wait is needed for the cohesive bounded work. Keep gates focused; no
full global suite is required for a standalone unshipped candidate. If primary
usage is exhausted, record the exact verified boundary and resume after reset.

## Boundary record

| Boundary | Result |
|---|---|
| A — admission and board | Complete; validated board451 start; no slice number |
| I — isolated implementation | Complete in five bounded component/preview files |
| V — focused tests, types/build, browser and no-egress proof | Complete; see exit proof |
| H — reviewer acceptance and durable local handoff | Complete; board456; parent remains Backlog |

Result: accepted isolated candidate only. Source hashes, metrics, screenshots,
and integration holds are in `docs/research/uiq07/CANDIDATE-EXIT.json`. No app
wiring, commit, push or deployment. Any entry-flow integration is a separately
admitted UIQ-GATE after settled, merged EPIC-17.
