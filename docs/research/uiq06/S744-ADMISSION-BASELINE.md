# Slice 744 — UIQ-06 admission and rendered baseline

## Verified source and coordination

- `origin/main`: `7923a7f4323d713b069817adfd7626f19c7b48f5`, fetched
  2026-10-12. Task worktree started clean at that exact commit.
- Canonical board revision 4404: UIQ-GATE Done; UIQ-02/03/04/05 Done;
  UIQ-06 Backlog with dependency UIQ-GATE; UIQ-07 and later remain Backlog.
- `gh pr list --state open` returned no open pull requests. `git log --all`
  found no Slice commit above 743 and no 744–747 reservation in current docs.
  Old EPIC-17 refs/worktrees are closed history, not live ownership.
- `docs/coordination/TEAM-CONTEXT-REGISTRY.md` is not present in the fetched
  tree. `git worktree list`, refs, board and open-PR state were used to check
  work ownership. The dirty root checkout was not read for scope or changed.
- `npm ci --ignore-scripts` installed the lockfile unchanged. npm reported 22
  existing dependency advisories (11 moderate, 8 high, 3 critical); no audit
  fix or dependency change is in this scope. Focused baseline
  `npm run test -- src/ui/view.test.ts`: 92/92 passed.

## Rendered screen audit

Fresh headless Chromium opened the current Vite app at 1280×900 CSS pixels;
the screenshots in `evidence/` are the unmodified `origin/main` UI.

- **Nesting:** `#nest-readout` renders `Single size · Requires 75.2 cm of
  cloth · Planned with buffer: 82.7 cm · Waste: 56.3% of cloth · On hand: not
  entered · Fit: unknown — enter fabric on hand for a fits/short verdict.`
  followed immediately by `Directional print assumed...` in the same 12px line.
  Rendered wrapping splits “fits/short verdict.Directional print assumed”
  with no separator or hierarchy. This demonstrates poor scanability and a
  merge of decision and caveat; S745 may fix presentation, not estimates.
- **Check:** green appears only with “Digital checks pass — physical
  validation pending”; seven named digital checks have individual values and
  markers. Keep existing check semantics and treatment unless a failing or
  warning state at a narrow viewport reveals a concrete defect.
- **Measurement:** existing measurement screen visibly labels each field,
  displays `Value source & history`, and distinguishes built-in digital
  starting values from user measurements and fit validation. Continue with
  empty/multiple-source, long-text, invalid and saved-history evidence in S746;
  no change is justified from presence alone.
- **Project Manager:** existing panel explicitly says local project, identifies
  current project/style, and separates backup import/export, style actions,
  history and frozen outputs. Check failure, conflict, recovery and narrow
  layouts at S748 before deciding whether to change it.

Baseline screenshot names:

- `evidence/S744-nesting-baseline.png`
- `evidence/S744-check-baseline.png`
- `evidence/S744-measure-baseline.png`
- `evidence/S744-project-baseline.png`

SHA-256 for the captured files from unmodified `origin/main`:

| File | SHA-256 |
|---|---|
| `evidence/S744-nesting-baseline.png` | `D933194524999570713DB4D4B61416090109877A2266548EAA9CCD6FE178C7F8` |
| `evidence/S744-check-baseline.png` | `688D233148DCFA1DF95112748A2CE0E71F6F32A43D76B46FB7CA19B9C335E254` |
| `evidence/S744-measure-baseline.png` | `9537B8129FF554FCD7A7B2876117D168025426FCA12FB3FF51B79C8C1F906F5D` |
| `evidence/S744-project-baseline.png` | `F77DF068C7455E3CB2C28215D3CEF43FA6EDA9662B2832742F2EAA8D2A7CB7D2` |

## Slice 744 result and next boundary

The package has an admitted, bounded execution contract in
`docs/planning/UIQ-06-ADMISSION.md`; the active goal and gates are
`docs/planning/UIQ-06-GOAL.md`. Slice 744 changes no production behavior. The
admission/status/comment commands were applied through the validated Control
Center command layer. Board revision 4408 confirms UIQ-06 In Progress with
the packet, goal and evidence linked and its stale EPIC-17 protection label
removed. The next action is S745 Nesting readout
presentation from this verified main-based branch. No safe parallel
contributor task exists at this shared contract boundary.
