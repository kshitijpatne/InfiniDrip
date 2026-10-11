# EPIC-17 / G04 V03 — S689 route decision

## Decision in plain terms

The measured unit problem can be solved for a CLO Standard DXF test by sending
millimeters and receiving millimeters. That does **not** solve the exchange:
CLO still changes five cut edges and removes eight visible marks. Its returned
file also replaces meaningful piece/layer labels with generic numbers, and
its saved overview is too dark/cropped to prove that a person can read the
result. The millimeter input is therefore a useful diagnosis, not a valid V03
solution. Keep the production centimeter export exactly as it is; reject CLO
Standard as a V03 route.

The safe product-side solution is fail-closed exchange: keep the source pattern
and current export authoritative, compare any receiver return against that
source, and reject a return that changes cut shapes or drops marks. The
existing S680/S681 source/package verifier and S685/S689 exact-file comparison
already provide the main evidence needed for this check. Do not auto-repair a
receiver file from the original source: that could erase legitimate edits made
in the receiver while making the return appear faithful.

No eligible receiver/profile has been evidenced among the already tested
routes. This is a concrete endpoint for the CLO investigation, not a request
for new general sewing research or another software install. Without changing
V03 acceptance, implementation can resume only on a route that is already
available and rights-cleared and can prove the exact drawing/marks, unit,
identity/sidecar, malformed-input, repeatability and readable-output gates.
Do not combine passing results from different receivers. Do not claim a
standards conformance from a menu label. No user design decision or manual UI
action is pending; the remaining unmet fact is technical route qualification.

## Gate reconciliation from actual S689 output

| V03 gate | Result | Strongest evidence and exact remaining proof |
|---|---|---|
| Rights/local handling for this CLO test | Passed for the authorized local evaluation | User's recorded written confirmation; all files stayed under the named C: folder. Rights do not establish technical suitability. |
| Named receiver/profile | Failed for CLO Standard DXF; no tested route qualifies overall | Exact CLO 2026.1.310 Standard DXF import/export. It cannot pass fixed geometry/mark gates on Polo M. No menu label is treated as a standards claim. |
| Source units | Passed | S681 source centimeters/`INSUNITS=5`; S689 transform preserved physical dimensions while declaring mm/`INSUNITS=4`. Production source was not edited. |
| Returned units/scale | Passed for this S689 Polo M pilot | Exact return declares mm/`INSUNITS=4`; it reopened with nine pieces; the comparison copy divided coordinates by ten. The S685 cm-input mismatch is avoided on this exact diagnostic route only. |
| Source geometry, seven recipes/options and source grades | Passed at source/package level; not receiver proof | S680/S681's verified 73 source packages and grade records. |
| Returned cut/sew geometry (`0.001 cm`) | Failed | Nine SEW paths pass. Five of nine CUT paths fail at `0.012742`, `0.012988`, `0.012988`, `0.012988`, and `0.013969 cm` (back, outer stand, upper collar, under collar, inner stand). Five deleted shallow vertices are localized in `S689-difference-localization.json`. The same cut failures appeared in S685. |
| Visible marks and mark types | Failed | 100/108 source drawing mark entities match; 8 do not: one 13.038 cm cut-line mismatch, three buttonhole points each 1.5 cm from expected, and four collar notches 0.816–0.897 cm away. Returned piece blocks contain 125 `LWPOLYLINE` entities and no typed `LINE`, `POINT`, or `CIRCLE` entities. |
| Piece/revision/seam identity | Unproven | CLO returns generic blocks (`0_M`…`8_M`) and numeric layers (`1`, `7`, `8`, `14`). A returned, integrity-bound C04 sidecar was not tested; it cannot restore missing visible geometry. |
| Malformed-input rejection | Failed for prior CLO AAMA probe; unproven for S689 Standard | S531's malformed CLO DXF-AAMA case was silently accepted while omitting inset SEW. S689 used one valid Polo fixture. Do not repeat the known AAMA negative. |
| Repeatability | Unproven | One exact S689 round trip only. A second pass is not justified because the route already fails cut/mark gates. |
| Readable saved output | Unproven | S689's exact return was reopened with all nine parts, but its saved overview PNG is dark and clipped; fine marks cannot be judged. |
| Legacy export and protected byte identities | Preserved in this slice; final integrated gate pending | No product code or baseline changed. Run protected-identity regression on settled final candidate. |
| All-recipe/options receiver matrix; integrated coverage/build; final output review; PR/merge/ancestry/deployment | Pending | They are downstream gates only after one representative receiver/profile pilot passes. Do not run the 73-case matrix on a failed route. |

### Shared-cause grouping

1. **CLO output conversion:** unit convention, five cut-point deletions, eight
   mark misses, and numeric/generic identity are properties of this route's
   measured returned file. The mm normalization resolves only the unit/scale
   part; it does not resolve the other defects.
2. **Route acceptance:** industrial profile qualification, returned sidecar
   identity, malformed-input handling, repeatability and readable output need
   proof on one same receiver/profile. They cannot be assembled from different
   apps' partial results.
3. **Independent source/final gates:** source generation already covers all
   seven recipes/options/grades; legacy export identities are unchanged. These
   do not make the receiver round-trip pass.

## Shortest evidence-supported completion path

1. **Retire CLO Standard for this admitted V03 route.** No further CLO setting,
   scale, or entity-format trials. Decisive evidence is the S689 exact return:
   unit passes, but fixed cut and mark gates fail. Stop condition already met.
2. **Do not patch source geometry/marks.** No source serialization defect is
   tied to the dropped CUT vertices or marks. Faking them back after import
   would misrepresent a receiver edit. Preserve the existing export identity.
3. **Resume only on an already available, rights-cleared exact profile with a
   documented unit and entity contract.** Before importing, its evidence must
   show it can preserve the original CUT/SEW paths and visible typed marks; the
   same receiver must then pass the existing pinned Polo M check including a
   version-bound C04 sidecar. Stop at the first fixed-gate miss. No eligible
   candidate is currently demonstrated, so no next import is scheduled.
4. **Only after one pilot passes:** reuse the existing 73-option and grade
   matrices once; test malformed inputs, repeatability and readable saved
   output. Then run the settled candidate's single full repository 100%
   coverage/build gate, protected export identities, final rendered review,
   PR review, safe merge, `origin/main` ancestry and required automatic
   deployment. No fit, physical sample or factory claim.

Older estimates that assumed a passing receiver are stale. Remaining slice
count/time is not responsibly estimable until a candidate passes preflight;
this is not permission to relax or defer V03 acceptance.

## Exact evidence inventory

All CAD/import/export files are on C: only:
`C:\G04-CAD-Interchange\S689-clo-millimeter-input-test\`.

- Source Polo M (S683): SHA-256
  `a3d8284d3f8e379b6aef2a90a736da660a56c8c7c4be997db7d5c9deebd78c6c`.
- Same-geometry mm input: SHA-256
  `799cb984aa7f7b147f4487e46aeed0be405ea0b8d6fca0126c273b225dcf6c13`.
- Exact CLO return, 80,049 bytes: SHA-256
  `b6187bef2f7ceae9ea04fbaf18fb9c38f016ceb97ee7cb3673bbd47213b669b2`.
- Normalized comparison copy: SHA-256
  `c7e290402aa4810834ce9abfe6c8f14233772251b9187c70cbf721c7bc0328f7`.
- Return inventory, transform, localization, comparison and rendered PNG:
  `Evidence/S689-entity-inventory.json`, `S689-transform-report.json`,
  `S689-difference-localization.json`, `S689-roundtrip-comparison.json`,
  `S689-clo-roundtrip-return-rendered.png`.

The exact return is immutable. The normalized file is only a measurement copy;
it is not presented as a faithful returned CAD exchange file.
