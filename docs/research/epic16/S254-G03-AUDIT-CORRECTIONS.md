# EPIC-16 / G03 Slice 254 — final audit corrections

**Status:** Implementation corrections complete; Codex full verification and
independent S254 audits remain pending. The PR and G03 exit remain open.
**Date:** 2026-09-28
**Parent:** Slice 253 at `e7badf096cd80c84174d1f8ceb0ab6b0407966fc`

## Scope and corrections

Slice 254 addresses the independent S253 audit follow-ups without expanding
G03. When a loaded project replaces the current project, saved revision
counters are now restored before the workspace synchronizes approved size
options. This prevents stale, pre-load selectors from being used as the
comparison base.

The grade-plan integration regression now checks both unsaved artwork changes
and unsaved target-style edits. Either makes the approved run stale, removes
graded sizes and disables plan-driven whole-run outputs until the style is
saved and the plan is refreshed, reviewed, and approved. Loading the saved
project restores its approved size choices.

The Check and run surfaces now distinguish three states: no grade plan exists;
a plan exists and must be refreshed after saving a changed style; and the
current style has unsaved edits, so the size row is explicitly blocked. The
refresh warning appears only when a grade plan exists. Guidance names graded
sizes and whole-run output explicitly. This is guidance only; it adds no new
grade or approval rule.

Single/Marker is a preview-scope selection. The choice itself does not make the
style dirty, create undo/redo history, or trigger recovery persistence. The
selected scope remains a persisted workspace preference and is written on the
next explicit Save. Tests cover the selection from a clean project and while
other design content is unsaved.

## Audit reconciliation

The independent Slice 253 audits used isolated clean worktrees at the reviewed
S252 commit and returned explicit `WORK FINISHED` signals before review.
Claude Code Opus 5.5 high identified the missing target-style edit regression,
the load-order issue, and unclear no-plan/plan-existing guidance. OpenCode
Muse Spark 1.3 xhigh identified that the saved revision base must be restored
before synchronizing workspace selectors. Slice 254 implements these
follow-ups and corrects the relevant test and documentation claims. The
machine-readable S253 record remains at
`docs/research/epic16/evidence/S253-final-review-verification.json`.

## Verification evidence

Before the full gate, the following targeted checks passed:

- `npx vitest run src/ui/app.test.ts -t "gates whole-run outputs on exact plan readiness and invalidates approval after edits"` — passed, including unsaved artwork and target-style changes, save/refresh/review guidance, and restoration after Load.
- `src/ui/view.test.ts` and `src/ui/grade-plan-run-panel.test.ts` targeted guidance checks passed (89 view tests and 7 grade-plan panel tests in the focused run).
- `git diff --check` — passed; Git reports only the repository's configured LF-to-CRLF working-copy notices.

Rendered Chromium evidence used the running application at an isolated local
origin. The production Style view at 320 CSS pixels had 305 CSS pixels of
document width, no horizontal page overflow, and 86 visible controls with
accessible names; at 1280 pixels the document width was 1265 pixels with no
horizontal overflow. A separate isolated render harness used the production
Check and grade-plan panel markup to inspect unsaved guidance at 320 and 1280
pixels. The exact save-current-style block text and size status were readable
without overlap at both widths. The POM table remains inside its own horizontal
scroller: at a 320-pixel viewport the document is 305 pixels wide, while the
table wrapper is 266 pixels wide and its 560-pixel table is scrollable. The
viewport was reset after inspection. The isolated panel harness was not a
saved user project and did not change browser project data.

The complete 100% coverage gate, production and Electron builds, Control
Center suite, protected export identity suite, final rendered/output replay,
and independent S254 reviews are still pending. No baseline has moved and no
merge is claimed.

## Product boundaries

POM reconciliation requires exact equality of raw numeric centimetre values;
there is no rounding allowance or tolerance. A mismatch blocks the affected
size and any whole run containing it. An N/A row must have its explicit reason
and is not a numeric match. It cannot satisfy a requirement for exact numeric
equality. One-size selected outputs stay available under the existing policy;
whole-run files remain withheld until an approved grade plan exists and every
declared size passes. No physical fit, population validity, manufacturing
tolerance, sample approval, or factory-readiness claim is made.
