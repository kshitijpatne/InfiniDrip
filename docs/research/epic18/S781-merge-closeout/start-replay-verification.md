# Slice 781 start replay verification

S781 started from S780 commit `bfacbf68ef242f366e77b6c43ed548ee4fe130b8` with PR #43 open against `main`. The active S765 amendment resolves the original admission's historical numbering; S781 is the admitted merge/closeout boundary. Fresh `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor.

## Canonical board replay

The replay began at board revision 4695:

| Change | Revision |
| --- | ---: |
| Add `E-G05-S781-START` to G05-EXIT | 4696 |
| Link the start evidence to EPIC-18 | 4697 |
| Update G05-EXIT with PR #43 and the initial review-gate assessment | 4698 |
| Add this replay report to G05-EXIT | 4699 |
| Link the replay report to EPIC-18 | 4700 |
| Correct this report's digest through validated `importFacts` | 4701–4702 |

At final start replay revision 4702, EPIC-18 and G05-EXIT remain In Progress; G05-T01–T05 and UIQ-10 remain Done; UIQ-09 remains Backlog behind EPIC-19. No item was closed before main verification/deployment.

Start packet SHA-256 is board-bound. The replay report hash is read back from the canonical board evidence record. An initial report draft was corrected after literal-file inspection caught PowerShell backtick/placeholder expansion; the corrected file was rebound at revision 4702. Those digest-only revisions changed no item status or acceptance state.

## Focused verification

`npm run control-center:test` passed 42/42 at board revision 4698 and again at revision 4700. Logs: `control-center-start.txt` (SHA-256 d8aaf84fe9d764b475d3ab4a6321a9041b5c7eacfb6603a2358f6bc0e89954d7) and `control-center-final.txt` (SHA-256 af8656866fdc112eba4a8b4160add4c9d663a6ef968f2dc6854de11e2e878fa1). It also passed 42/42 at revision 4701; log `control-center-post-digest.txt` (SHA-256 1551840a7555fa687782379efadd32e52ffb0fcec2a19925b21275edcf8ab064). A final post-correction run at revision 4702 is captured in `control-center-post-correction.txt`.

## Superseding effective mergeability check

The initial S781 assessment treated the active repository-level `no-crap-code` ruleset as a formal approval requirement on `main`. That conclusion was incorrect. `gh api repos/kshitijpatne/InfiniDrip/rules/branches/main` returned `[]`; classic branch protection returned HTTP 404, `Branch not protected`. `gh pr view 43` reports OPEN, `MERGEABLE`/`CLEAN`, with no review decisions, reviews, requests or check runs. The ruleset record is not evidence that its rules apply to this branch. Full output and interpretation: `mergeability-adjudication.md`.

No effective formal GitHub review gate was returned for `main`. The owner requested two independent internal read-only reviews (Claude Code and OpenCode); no outside GitHub users are to be contacted. After both agents explicitly approve and Codex reconciles the result, refresh ancestry and PR state and attempt normal rebase merge. Do not use admin or bypass options. Keep G05-EXIT In Progress until main CI/deployment and actual preview output pass.