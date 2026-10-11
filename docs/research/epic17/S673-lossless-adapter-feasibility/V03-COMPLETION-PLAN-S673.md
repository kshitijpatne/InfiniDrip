# G04 V03 shortest completion plan after Slice 673

Older S649/S660/S669/S671 estimates are stale. CLO Standard-DXF, tested DGS
routes and generic OpenCAD R14 do not qualify. The source-bound recovery
adapter is a no-go under C04 because it would have to reconstruct lost
geometry/marks and cannot safely separate receiver simplification from CAD
edits. `/2` grainline and all other design approvals are settled. V03's
all-seven/73-option/grade, `0.001 cm`, rights, typed-mark, malformed-input,
repeatability, round-trip, rendered-output, legacy and byte-identity gates
remain unchanged.

## Next ordered actions

1. **S674 — screen documented free/local pattern-CAD candidates.** Search
   first-party docs/repositories only for a receiver that is locally runnable,
   rights-compatible with product-development evaluation, and explicitly
   supports DXF import and export. Exclude hosted-only services, nesting-only
   tools without export, and candidates with no import/export contract.
   OpenMarker is already excluded: its first-party README says export remains
   planned. Do not download/install until primary evidence clears this entry
   screen. If no candidate qualifies, stop candidate research and report the
   exact missing receiver capability; do not retest CLO/DGS/OpenCAD.
2. **One representative proof on the first qualifying receiver.** Use the
   existing exact Polo fixture. Import and inspect, export, parse/re-import in
   a clean project, and verify geometry, units, source identities, CUT/SEW,
   marks, warning state and readable rendered output. **Stop** on any miss at
   `0.001 cm` or any unsupported/lost semantic. The product's own direct DXF
   writer may not be represented as an industrial profile without this proof.
3. **Only after representative pass**, add the C04 version-matched sidecar
   for permitted identity/grade/seam relations, verify tamper/revision
   mismatch rejection, reuse negative fixtures, verify two repeat rounds, then
   run S627's seven-recipe/73-option cohort and S559/S562 grade fixtures.
   Every row must pass.
4. **Integrated closure:** review G04-mapped MQF-004–007, MQF-011, MQF-012,
   MQF-015; inspect final output; run the full repository tests with 100%
   coverage, build, browser/Electron, legacy DXF and protected identity gates
   once on the settled candidate; review/create PR; safely merge; verify
   `origin/main` ancestry and required deployment; then close board and goal.
   No physical fit or factory claim.

The completion estimate is now **unbounded until S674 finds an eligible
receiver**. Once found, size the work from the measured representative result;
older 1–2 / 2–4 slice estimates assumed a viable DGS candidate and are stale.
No scope or acceptance changes are proposed.
