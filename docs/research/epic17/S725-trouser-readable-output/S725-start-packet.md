# EPIC-17 / G04 — S725 Trouser receiver readability diagnosis

## Start and reservation

- Start: 2026-10-11 06:02 UTC.
- Branch: `codex/epic-17-g04`; starting commit S724 `84191188da1c202320d7bf437ccf48d2772b391d`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- Highest assigned slice on this branch is 724; origin/main's highest is 260. S725 is the next unique slice.
- Canonical board revision 4234. EPIC-17/G04-V03 In Progress; V01/V02 Done; goal active.
- Two pre-existing S700 untracked coverage diagnostics remain untouched. No other dirty worktree state.
- A bounded, read-only high-reasoning review is complete from S724. No new delegation is independent/safe for this integrated output diagnosis; Codex owns the work.

## Objective

Measure the exact Trouser M source and saved LibreCAD return that S723 visually described as crowded/crossing. Attribute each crossing to actual entity geometry, inter-piece spacing, or screen-scale rendering. Correct only the opt-in CAD candidate drawing layout if that is the demonstrated cause. Do not change pattern cut geometry, seam graph, source pattern mapping, legacy DXF output, or protected byte identities. Re-run the existing source-bound receiver audit and inspect the saved/reopened result in the already installed LibreCAD 2.2.1.5 session.

## Fixed gates and exclusions

- Every source CUT/SEW contour and construction-mark coordinate must remain source-equivalent under the existing audit, with maximum delta `0.001 cm`; no entity can be hidden or dropped to make the image appear cleaner.
- Preserve centimeter units, named piece/revision identity, manifest transforms, mark identity, and the 0.000 cm target already achieved by the receiver fixtures.
- Actual saved/reopened LibreCAD output must be legible at whole-layout and detail scale, with no misleading inter-piece crossing or obscured outlines. Machine audit alone does not pass readability.
- Keep the existing ten LibreCAD fixtures, seven recipes, all supported option and grade source-output coverage, repeatability, product-side fail-closed checks, legacy DXF, protected identities, standards/physical/factory limitations, and final release gates unchanged.
- Raw CAD, scripts, reports and rendered previews remain under `C:\G04-CAD-Interchange\S725-trouser-readable-output\`; no machine artifacts go into the repository.
- Do not re-import or re-export a previously passed format/setting variant. One exact regenerated candidate is allowed only after the source diagnosis predicts the change and the existing exact profile can verify it.

## Decisive checks

1. Bind the exact S723 Trouser source and return hashes/revision; parse per-piece geometry and calculate actual CUT/SEW bounds, inter-piece gaps and line crossings. Identify which layer/entity pairs produce the visible crowding.
2. If crossings are real source entities, preserve the hold and report the exact conflict. If geometry is disjoint but the full-layout presentation is too dense, change only candidate view spacing and keep exact per-piece coordinates/identity/marks bound by the manifest.
3. Focused tests must prove the candidate drawing transform/gap and every moved outline/mark's exact source-relative geometry; require 100% changed-production-code coverage. Preserve the legacy exporter snapshot tests.
4. Regenerate only the Trouser M fixture into the named C: folder. Audit it against the exact source manifest, open/review in LibreCAD, save once through the already measured DXF 2000 route, reopen, and audit the return. Stop on any fidelity failure; do not vary receiver, format, or settings.

At closeout, record measured cause, any narrowly supported fix, actual rendered evidence, focused tests/coverage, board revision, commit, and separate implementation/focused verification/reviewer wait/maintainer-decision time. Full repository gate remains at the settled integrated Epic/PR candidate.
