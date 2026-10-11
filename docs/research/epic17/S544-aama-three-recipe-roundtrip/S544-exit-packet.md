# EPIC-17 / G04 V03 — remaining DXF-AAMA recipe trials — Slice 544 exit

## Result and blocker

S544 did not reach an import or export. It preflighted the exact three source
fixtures and copied them into the named S544 C: folder; all three copy hashes
match the S498 source hashes. No output DXF was created and no source or
pattern data was imported into CLO.

The live computer-use selection returned one running CLO 2026.1.310 window.
Its screenshot showed only a blank/synthetic square in the 2D window, while
its accessibility tree repeatedly reported a focused `Export DXF` modal with
the `DXF-AAMA` format and a Cancel control. `list_windows()` returned only the
main CLO window, not an owned modal. Pressing Escape and re-activating the
returned main window refreshed the screenshot but left the accessibility
modal report unchanged. A supported `Raise` action failed with an
unknown-outcome error. Because visible target and accessibility state did not
agree, no import/export action or further coordinate input was attempted.

There was one corrected path assumption: the S498 inputs are in the top-level
`C:\\G04-CLO-DXF-Exchange\\Input`, not under `S498-practical-retest\\Input`.
The first copy attempt failed before copying anything; the correct files were
located, independently hash-checked, and copied. This did not alter the
sources or any output. S544's `Output` and `Evidence` folders remain empty.

This is a concrete computer-use state mismatch, not a CLO format error and not
evidence for/against DXF-AAMA compatibility. V03 remains In Progress and all
criteria remain held. CLO remains open as requested. The S544 C: source copies
are retained for resumption.

## Input identity

- Tee: `Input/tee-standard-m.dxf`, 6,750 bytes, SHA-256
  `0B6CBA95C9AFD4CC6F17A2171F67303E0891BABB94828816C149767935165FC9`.
- Polo: `Input/polo-standard-m.dxf`, 24,261 bytes, SHA-256
  `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
- Woven: `Input/woven-shirt-standard-m.dxf`, 14,923 bytes, SHA-256
  `9FE52D808EC94A6B8AB86A3B55066B11E6BB1B6AD4BF34E480AE9060165196A5`.

All reside under `C:\\G04-CLO-DXF-Exchange\\S544-aama-three-recipe-roundtrip`.

## Gate disposition

- **Passed:** all three input paths resolved, source identities reverified,
  C:-only copies created; board status kept unchanged.
- **Not run:** CLO import/export, geometry matching, grading, semantic audit,
  rendered pattern inspection, and new output hash review.
- **Unchanged:** all-seven same-profile requirement, exact-profile/edition,
  rights and local-handling decisions, 0.001 cm geometry gate, semantics,
  malformed-input, grading/options, V02 result, legacy DXF, and protected
  output identities. No conformance or production claim.

## Verification, timing, and next step

- S544 board replay: start `3287→3289`, exit `3289→3291`; both used the
  validated Control Center command layer after preflight. `npm run
  control-center:test` passed 42/42. No production code/tests changed;
  changed-code coverage and the full repository gate are not due.
- Started `2026-10-08 22:09:10 UTC` from clean S543
  `4327d8770baeb462ea7074f13369f5ff230c9bd5`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. S544 is
  unique. Elapsed time through board exit: 4m27s total, split as 3m03s
  fixture preparation, path diagnosis, and UI-state verification; 1m24s
  focused verification and closeout; 0m external-agent waits; 0m maintainer
  decisions.

**Next:** start a fresh supported computer-use observation of the existing
running CLO process; verify its actual visible window and accessibility tree
agree before acting. If a fresh observation still reports an invisible modal,
stop and report the exact mismatch rather than importing blindly. Resume the
same hash-pinned S544 sources and profile once the app state is targetable; keep
CLO open throughout the remaining G04 work.
