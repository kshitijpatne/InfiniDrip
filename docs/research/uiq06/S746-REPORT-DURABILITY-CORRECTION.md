# Slice 746 — S745 exit-report durability correction

Status: complete on `codex/uiq06-admission` as Slice 746. This narrow
follow-up does not change S745 code, its accepted behavior, or its history.

## Finding

S745's board evidence `E-UIQ06-S745` points to
`docs/release/UIQ-06-S745-EXIT.md` and records SHA-256
`E5E1277AD66DA526D2BA343CE12FEF72DA557A2F48726BCDDB8C8EFCA19A3206`.
However, `.gitignore` contains the repository-wide `release/` ignore pattern,
so the report was omitted when Slice 745 was committed as
`b948c942205af50b5ab38428bc6e9d36b2727f68`. Slice 746 force-added only this
specifically referenced report. `git ls-files --error-unmatch` confirms it is
tracked, its SHA-256 is still
`E5E1277AD66DA526D2BA343CE12FEF72DA557A2F48726BCDDB8C8EFCA19A3206`, and the
board regression test recomputes that digest from the tracked artifact.

## Bounded correction

1. Force-add only the specifically referenced exit report; do not change
   `.gitignore` or any other ignored file. Complete.
2. Verify the report digest and guard it with the canonical board regression.
   Complete; `npm run control-center:test` passes 42/42.
3. Record the correction as its own Slice 746 commit with validated board
   evidence/comment. S745 remains unchanged. Complete at board revision 4414.
4. Shift the still-pending audits one slice later: measurement S747, grade
   exceptions S748, local project/recovery/import/export S749, settled gate and
   PR S750, merge/deployment/live closeout S751. Reconfirm uniqueness before
   each boundary.

## Acceptance

- `git ls-files` includes the exit report and its SHA-256 exactly matches
  `E-UIQ06-S745`.
- The board regression suite passes and explicitly checks the report URI/hash.
- UIQ-06 stays In Progress. S745's commit remains unchanged; no product code,
  tests, runtime data, export baseline, release or deployment changes are made.
- `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `UIQ-06-ADMISSION.md`,
  `UIQ-06-GOAL.md` and `UI-ENHANCEMENT-SEQUENCE.md` all name S746 as this
  correction and S747 as the next feature-surface audit.

No production code, feature behavior, export identity, baseline, release or
deployment changed. The S745 report remains the original acceptance record;
its “next action” text is historical and superseded by this correction and
current project state. S747 is next: audit measurement provenance/history
without changing measurement behavior unless a specific rendered ambiguity is
demonstrated.
