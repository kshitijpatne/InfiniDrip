# G04 V03 shortest completion plan after Slice 672

S649/S669/S671 slice forecasts are stale. Current proof disqualifies the tested
CLO Standard-DXF route (geometry, units, source semantics and rendered
readability), retires the tested DGS routes, and leaves OpenCAD R14 as generic
conversion evidence only. The `/2` grainline convention and all design
approvals are settled. V03 acceptance, all-seven recipes, 73 options, grades,
`0.001 cm`, malformed-input, repeatability, round-trip, readability, legacy
DXF and protected byte-identity gates stay fixed.

## Prioritized completion route

1. **S673 — prove or reject a lossless, source-bound adapter.** Use the exact
   S671 source fixture, S672 CLO output, existing seven-recipe/73-option
   fixtures, and current DXF parser/writer. Prototype only the smallest
   adapter proof: identify an unchanged piece by an exact source-bound stable
   contour, reconcile units explicitly, restore exact CUT/SEW and all typed
   marks/layers from version-bound source data, and fail closed if the
   receiver output cannot bind uniquely or has meaningful edits. Verify one
   CLO representative input→export→adapter→fresh import path in a receiver
   only after a static proof shows each missing field has a deterministic,
   non-ambiguous binding. **Stop:** no unique identity or unsupported edited
   geometry; do not market this as a general CLO or ANSI/AAMA/ASTM profile.
2. **S674 — decide from S673 evidence whether a production-grade bridge is
   viable.** If the prototype can faithfully represent the unchanged and
   edited cases needed by the product, implement it as an opt-in versioned
   profile without altering the legacy DXF writer, then verify source round
   trip, units, marks, identities, malformed-input rejection, and readable
   actual CLO output. Otherwise record a concrete no-go and select a
   rights-cleared alternative receiver or a maintainer-approved scope change;
   do not disguise generic OpenCAD conversion as industrial apparel CAD.
3. **Only after a representative bridge/profile passes**, replay the seven
   recipes, 73 options, required grades and existing negative fixtures. Run
   repeat export/re-import with the same frozen revision and compare all
   required semantics and rendered output. Any failed row blocks V03.
4. **Integrated closure:** review G04-mapped manual findings MQF-004–007,
   MQF-011, MQF-012 and MQF-015; perform final output review; run the full
   repository tests with 100% global coverage, build, browser/Electron checks,
   legacy DXF and protected-identity gates once on the settled candidate;
   review/create the PR; merge safely; verify `origin/main` ancestry and any
   required Actions deployment; then close the board item and goal. Do not
   claim physical fit or factory acceptance.

No further CLO or DGS format/settings/encoding trial is justified by current
evidence. This plan uses no pending approval and does not alter admitted
acceptance.
