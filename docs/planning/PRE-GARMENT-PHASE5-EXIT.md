# Pre-garment Phase 5 — README and architecture guide

**Status:** accepted on the canonical Control Center board at revision 39 with
evidence `E-PREQUEUE-PHASE5-EXIT`.
**Date:** 2026-09-22.

## Delivered

- Reworked `README.md` to explain the product and its confirmed audience,
  five-stage flow, garment types, outputs, limits, browser and desktop setup,
  local saving, and the boundary before another garment is scheduled.
- Rewrote `ARCHITECTURE.md` as a plain-language account of how measurements and
  choices become garment shapes, how the views share the current design, what
  the temporary Edit preview does, where data is saved, and how the separate
  Control Center works.
- Clarified that Epic 8 was a bounded helper experiment—not a clone—and is
  complete as a proof-only/no-go decision. Its offline build and safety gates
  were not met, so no solver is integrated into or run by the app.
- Recorded the maintainer's audience decision in `docs/PROJECT-DECISIONS.md`
  and added its resolution to the historical newcomer audit. The guides now
  identify both home sewists/DIY makers and independent designers/patternmakers.

## Cold-reader pressure test

Claude Code reviewed the README and OpenCode reviewed the architecture guide in
separate read-only worktrees. Both were prompted to assess the documents as if
they were new readers without coding or sewing/fashion background, and to cite
specific wording that prevented understanding. Their first-pass findings led
to corrections for the audience decision, desktop startup, maintainer role,
view names, Edit-view limits, local file access, artwork placement, saved data,
outputs, and Epic 8 scope/status.

These were AI cold-reader simulations, not interviews or a usability study with
people. They did not render the documents in a browser or test an actual
reader's comprehension. No such human study or physical garment validation is
claimed.

## Verification and limits

- `git diff --check` passes.
- Every relative Markdown link in `README.md` and `ARCHITECTURE.md` resolves.
- Source spot-checks confirmed the desktop development command, browser and
  desktop storage distinction, export-file selection, local window-size record,
  Trouser Edit piece, and Epic 8 no-go boundary.
- No application code, tests, dependencies, export baselines, or services
  changed. The build, coverage, and export-identity suites were not rerun for
  this documentation-only change; their latest full passing results are in
  `PRE-GARMENT-PHASE4-EXIT.md`.
- No garment is claimed to have been cut, sewn, or fit-tested.

Phase 6 remains in Backlog. Its pattern-block legibility and
pattern-to-measurement navigation criteria are recorded as an amendment to
Phase 6, not a new phase. The navigation mapping inventory and a maintainer
decision for blocks linked across measurement pages remain required before
that navigation is implemented; this does not block the independently scoped
legibility work.
