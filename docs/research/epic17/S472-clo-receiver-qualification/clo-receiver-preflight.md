# CLO 2026.1.310 V03 receiver preflight

This is a preflight only. Do not open an S463 fixture until all Gate 0 items
are resolved and recorded. Do not send account, billing, payment, or license-key
details to Codex.

## Gate 0 — before any fixture

1. **Trial and license eligibility:** CLO's published web trial is for users
   who qualify for its Individual license (hobbyists, freelancers,
   self-employed people, or one-person companies). Enterprise/academic trials
   require vendor contact, which G04 excludes. Confirm only the applicable
   category; if the Individual license does not apply, stop.
2. **No-charge condition:** the official 14-day trial automatically starts the
   chosen paid plan unless canceled. If the trial is active and no paid plan is
   wanted, cancel the trial through the CLO account page and verify CLO shows
   cancellation/expiration before renewal. CLO says cancellation does not end
   access before the expiration date. This is an owner action; Codex will not
   inspect the billing account or change subscription state.
3. **Exact installed build:** verify Help/About says CLO 2026.1.310 and record
   that string. The build number currently comes from the owner's report.
4. **Menus, without opening a pattern:** record the exact File > Import and
   File > Export DXF labels and the modes/options shown. The vendor guide
   documents Standard DXF, DXF-AAMA and DXF-ASTM, but the installed build's
   actual choices must be observed.
5. **Local handling:** confirm ordinary DXF import/export uses local file
   paths without a cloud conversion/marker or pattern upload. If the operation
   requires a cloud service, stop; hosted services are outside G04.

If any item is unclear, keep all fixtures unopened and report the specific
unknown. Do not include credentials, billing data, or any private/production
patterns.

## Gate 1 — only after Gate 0 passes

Use copies of the six positive and one negative synthetic fixtures in
`S463-v03-receiver-fixture-pack/fixtures/`; leave repository originals
read-only. Keep all outputs local and return the files/screenshots to the
workspace for independent comparison.

For `tee-standard-m.dxf`, `polo-standard-m.dxf`, and
`woven-shirt-standard-m.dxf`, import with the explicit `DXF-ASTM` and/or
`DXF-AAMA` profile actually exposed by the installed version; record the
selected mode and units. Inspect scale, orientation, piece count, closed CUT
outlines, SEW outlines, marks, labels, notches, allowance, grading, warnings,
and any dropped/reinterpreted entities. Save an unedited native copy, export
using the selected apparel-DXF mode, then reopen the output in CLO. Preserve
every output and screenshot.

Import/export observations must distinguish product menu labels from observed
behavior. Compare output against the S463 manifest for coordinate deviation,
units, orientation, piece/entity/layer/mark counts, contour closure and
retained semantics. Test `tee-grade-xs.dxf`, `tee-grade-m.dxf`, and
`tee-grade-xl.dxf` separately; these are separate generic single-size files,
not a native grade-rule set. Import the malformed negative fixture last and
require an explicit rejection/report.

## Required exact profile record

Record product/build, license/right basis (category only), local/cloud result,
exact import/export labels, profile selected, unit settings, warnings,
native-save/reopen behavior, each fixture's screenshots and result, and
maximum coordinate delta. Limit the compatibility statement to the specific
CLO build/profile and observed fixtures. A menu label alone does not establish
standard-wide conformance; ASTM D6673-10 is withdrawn (see S460).
