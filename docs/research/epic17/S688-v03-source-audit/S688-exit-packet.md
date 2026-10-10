# EPIC-17 / G04 V03 — S688 source-audit reconciliation — exit

## Result

S688 reconciles the completed read-only Sol high-reasoning audit with actual
source files, the S686 current V03 gate matrix, the S687 hash-pinned CLO
all-entity report, and the previously recorded GetonAgain, DGS, LibreCAD and
OpenCAD trials. The audit found no specific source serialization defect that
explains the measured S685 CLO return failures and no supported production
code correction. The exact return has the unit mismatch, five CUT contour
failures and eight visible mark failures already reported; S687 confirms all
nine returned piece blocks contain only polylines, not hidden typed mark
entities. No new application, import/export, profile, format or encoding trial
was run.

The GetonAgain sign-in work is not an untried route: the authenticated GMS
workspace only opened marker files and its observed DXF output control was
disabled; the DGS module was subsequently exercised and returned blank 0/0
pattern imports plus metadata-only DXF exports. LibreCAD R12 preserves one
fixture's geometry and typed marks but drops the unit declaration and does not
establish an industrial apparel profile. OpenCAD is generic and fails its
malformed-input/profile gates. Results from different receivers cannot be
combined into one passing route.

No user decision, approval, or manual UI action is pending. G04-V03 has no
currently evidenced receiver/profile that can meet the admitted fixed gates.
The smallest prerequisite is access to a specifically named, rights-cleared
receiver/profile that is available for the exact exchange. Until then V03
cannot truthfully pass. Keep EPIC-17 In Progress, G04-V03 Blocked, V01/V02 Done,
and every all-seven/options/grades, `0.001 cm`, malformed-input, repeatability,
readability, legacy DXF and protected-byte requirement unchanged.

## Verification and slice accounting

- Start: 2026-10-10 19:23:49 UTC from clean S687 `c7b4e914` on
  `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  remains an ancestor. S688 is unique after S687. Board start revision 4065;
  validated start commands advanced it to 4067.
- Codex verified the S687 report's pinned source/receiver/report hashes, nine
  piece-block inventory and absence of returned LINE/POINT/CIRCLE marks; read
  the S685 measured output report and the current S686 matrix. Inspected the
  S655 authenticated GMS result, S668 actual DGS import, S669/S670 DGS controls
  and S674 LibreCAD pilot, plus `src/export/dxf-centimeters.ts` and
  `src/export/dxf-interchange-package.ts`. The Sol audit's concrete result is
  that no source serialization defect is causally tied to the measured CLO
  misses; prior source representation trials did not resolve them. Exact route
  evidence is linked from the refreshed gate supplement.
- `npm run control-center:test`: passed 42/42 after the board and matching
  current-state assertions were updated.
- `git diff --check`: passed after all packet/state/test changes.
- No production code or export baseline changed; changed-code coverage is not
  applicable. The full repository coverage/build gate remains due only after
  a qualifying receiver pilot and a settled integrated candidate.
- Validated board replay: start 4065→4067, exit 4067→4071. G04-V03 is Blocked;
  EPIC-17 remains In Progress. V01/V02 remain Done. The board test's current
  status expectations were updated to match this evidence-based state.
- Approximate elapsed slice time: evidence reconciliation and documentation
  about 1 minute; focused verification and durable closeout about 1 minute;
  external-agent wait 0 minutes (the Sol review was already complete before
  this slice);
  maintainer-decision time 0 minutes.

## Next action and final gates

Resume only when a specific, rights-cleared, already available receiver/profile
is evidenced as able to pass the fixed representative pilot. Then verify one
exact Polo M source/sidecar round trip and stop on the first miss. Do not install
another application or vary file encodings without a new measured cause and
named gate. After a successful pilot, run the existing full matrix once, then
the integrated repository-wide 100% coverage/build gate, protected export
identity checks, final rendered/output review, PR review, safe merge, refreshed
`origin/main` ancestry check and required deployment. No fit/factory claims.
