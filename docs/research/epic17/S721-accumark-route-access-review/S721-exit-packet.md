# EPIC-17 / G04 — S721 AccuMark route and access review

## Result

S721 identifies **Gerber AccuMark Pattern Design** as a concrete, officially
documented apparel-CAD candidate for the admitted DXF exchange profile. Gerber
documents import of ASTM/AAMA DXF from other CAD systems through its Data
Conversion Utility and ASTM/AAMA DXF export for models. This newly verified
official candidate documents both directions. It is a candidate only: no build-specific profile,
rights for this evaluation, local handling, or actual round trip has been
proven.

Official sources:

- [AccuMark Data Conversion Utility](https://help.gerbertechnology.com/AccuMark/AMX/Function_DCU.htm) documents import from other CAD systems, including ASTM/AAMA.
- [AccuMark Export](https://help.gerbertechnology.com/AccuMark/PDS/File_Export_Tab_File.htm) documents ASTM/AAMA DXF export for models and states format choices depend on whether exporting a model or a piece.
- [Gerber Downloads](https://help.gerbertechnology.com/Licensing/Downloads.htm) says the downloads page lists products assigned to the user's license and that licensed products are available there.

The official pages reviewed do not document a public, self-serve free trial.
This does **not** prove that Gerber never offers an evaluation seat; it means
no such access route is established by the evidence available in this slice.

## Local availability check

Read-only Windows uninstall-registration lookup for Gerber/AccuMark/Lectra
and checks of the expected Program Files directories returned no entries.
The current app/window inventory also contained no AccuMark process/window.
The user's online license assignment was not checked; no account data was accessed.
CLO remained running; the computer-use capture
surface displayed Codex rather than CLO, so no receiver input was sent.

## Gate disposition

- **Candidate profile identified:** official AccuMark documentation describes bidirectional ASTM/AAMA DXF operations.
- **Exact receiver build/profile:** unproven; no local AccuMark installation is available to identify.
- **Rights and local handling:** unproven for AccuMark; the recorded written evaluation/local-handling confirmation applies to CLO, not AccuMark.
- **Geometry, units, piece/revision/grade/seam identity, CUT/SEW, marks, grades/options, malformed input, repeatability and readable output:** unproven for AccuMark; no files were transferred or exchanged.
- **CLO/DGS/LibreCAD/OpenCAD:** S719/S720 evidence remains controlling; no route or V03 gate status changes here.
- **Acceptance:** unchanged. V01/V02 Done; V03 and EPIC-17 remain In Progress. No conformance, physical-fit, factory-acceptance or production-readiness claim.

## Next action and stop condition

The shortest candidate path is a locally available AccuMark Pattern Design
build with an assigned license or evaluation seat and confirmed local
evaluation rights. If that access becomes available within the admitted
no-spending/no-supplier-contact scope, run the existing hash-pinned
representative pilot once, then stop on any fixed-gate miss. Do not install,
purchase, contact a supplier, or run all-seven breadth until rights and the
representative pilot pass. Do not repeat CLO or any settled encoding/mode
variation. If no assigned evaluation access is available, the admitted V03
receiver gate remains unresolved; no existing candidate can be declared
passing.

## Verification and slice closeout

- Start: 2026-10-11 04:39:48 UTC from `0d09b4969e24a9f1e9bbcc5ce1be21e921edcadd`; branch `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor; board start revision 4211.
- Unique slice: 721, after verified highest assigned slice 720.
- Work: read-only first-party documentation review and local installation lookup; no implementation, installation, vendor contact, CAD exchange, acceptance change or source geometry change.
- Verification: `npm run control-center:test` 42/42; `git diff --check` passed. No production code changed, so changed-code coverage and full repository gate were not due.
- Time: 2m09s from recorded start to closeout; implementation 0m, focused evidence review and verification 2m09s, external-agent wait 0m, maintainer decision time 0m.
- The two pre-existing untracked S700 coverage diagnostics remain untouched.

## Completion status

This review improves route identification but does not clear V03. Keep all
existing final gates: full repository tests and 100% coverage on the settled
candidate, integrated build/browser/Electron/output review, necessary-file
cleanup, reviewed PR, safe merge, refreshed ancestry, required deployment and
production end-to-end verification.
