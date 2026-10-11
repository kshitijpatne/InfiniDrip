# EPIC-17 / G04 V03 — GetonAgain DXF contract preflight — Slice 653 exit

## Outcome

Reviewed the hash-verified first-party Garment CAD V2024.1 manual's printed
pages 239–241, both extracted text and rendered page images. The manual
establishes that the desktop presents separate ASTM/AAMA, TIIP, and Auto CAD
import modes and ASTM, AAMA, and Auto CAD export modes, plus unit/base-size/
grading/seam/mark controls. It documents that RUL export cannot preserve
size-varying drill or buttonhole counts, and that the RUL route omits quilt/sew
lines. The exact entity/layer/version/identity/mark semantics remain
undocumented.

The manual is now translated into a stop-first, ordered installed-build
preflight in `V03-GETONAGAIN-DXF-CONTRACT-S653.md`. GetonAgain is authorized for
bounded evaluation based on the maintainer's recorded written-use/local-file
confirmation and official Free Version approval, but it is not installed,
selected, or qualified. Two consent processes still show the matching
GetonAgain setup caption; only the maintainer can approve Windows security UI.
No login or pattern import occurred.

## Gate disposition

- Candidate evaluation authorization: **passed by maintainer confirmation**;
  this is not an independent legal opinion.
- Installed version and actual local desktop input route: **unproven**.
- Exact receiver/profile and input entity contract: **unproven**.
- V03 technical acceptance gates: unchanged; none passed or waived.
- V01/V02: Done. G04-V03: Blocked pending installation handoff and subsequent
  technical preflight. EPIC-17: In Progress.

## Verification and slice accounting

- Start: 2026-10-10 01:08:32 UTC, clean S652 HEAD
  `d9e79066c414d7c9a2e78b0ddc4aee5a6a31aa23`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; board
  revision 3755. S652 was the highest assigned slice; S653 reserved uniquely.
  Validated board replay: `3755→3756→3757→3758→3759→3760→3761`.
- Manual review: extracted exact section text, inspected printed pp. 239–241
  images, verified the PDF hash against S651; no app operation.
- Focused verification: board changes validated through the command layer.
  The initial Control Center run caught missing canonical S459/S457 summary
  wording; the board description was corrected to retain those established
  acceptance clauses. Final focused Control Center suite: **42/42 passed**;
  `git diff --check` passed. No production source/test change; changed-code
  coverage is not applicable.
- Approximate elapsed work: 4 minutes; manual review/evidence synthesis 1m,
  packet/context/board closeout and verification 3m; external-agent waits 0m;
  maintainer-decision wait during this slice 0m (the earlier consent handoff
  remains live).

## Next action

The maintainer must approve the matching GetonAgain Windows consent prompt.
Then reserve the next unique slice and verify installation/build and the actual
local DXF route before any authentication or fixture exchange. If registration
or cloud conversion is required, stop at that concrete point. Do not repeat
CLO/OpenCAD variants or import a fixture until the exact input and sidecar
contract match existing source evidence.
