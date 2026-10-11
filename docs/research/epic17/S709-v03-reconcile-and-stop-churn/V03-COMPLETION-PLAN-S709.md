# G04 V03 prioritized completion plan — S709

Prior forecasts are stale. S708 improves one generic-CAD fixture but does not
qualify an industrial apparel receiver. The previous idea to run 73 cases
through LibreCAD before settling this gate is withdrawn: even a perfect result
would not satisfy the board's independent profile requirement.

## 1. Advance source-side return identity and fail-closed behavior

Implement a distinct returned-DXF audit that accepts the *unchanged source
manifest* plus receiver-returned bytes. It must not weaken
`verifyDxfInterchangePackage`'s exact source hash rule. Parse returned named
blocks and compare piece roles/IDs, source revision, option/grade binding,
units, CUT/SEW geometry, marks, and stitch relations to manifest-anchored
expectations; reject missing, duplicate, extra, or mismatched entities.
Also replay the existing malformed/unsupported fixture matrix through the
product verifier/import boundary, requiring visible error or blocked status
and no apparently successful partial output.

**Decisive check:** focused tests validate identity/geometry/marks against the
real saved S708 return, reject deliberate tampering in each bound field, and
show each existing negative fixture fails closed. Require 100% changed-code
statement/branch/function/line coverage; retain legacy byte-identity tests.
**Stop:** if current return data cannot unambiguously bind every required
manifest relation, report the exact missing entity mapping and do not infer it.
No receiver UI operation is needed for this source-side slice.

## 2. Resolve receiver eligibility before expensive receiver breadth

Use existing first-party materials and already-recorded installed-app output
only. Current evidence says CLO's tested apparel mode fails curve/mark/unit
checks, tested GetonAgain/DGS routes do not preserve usable pieces, and
LibreCAD is generic 2D CAD. Do not install software or repeat those modes.
Do not describe LibreCAD as industrial or make ANSI/AAMA/ASTM conformance
claims. A source-side correction is a reason to revisit a receiver only when
it addresses that receiver's measured cause; S708's block-ownership change is
specific to the LibreCAD R2000 layer issue and does not explain CLO's curve
point losses.

**Decisive check:** written exact-build/profile/input-output evidence for one
already-authorized industrial apparel route must establish the relevant
profile semantics and rights before a new run is considered. Existing
records do not establish such an eligible route today.
**Stop:** do not run another route or broad matrix if eligibility evidence is
absent. Keep the industrial-profile gate explicitly unproven and continue
source-side work.

## 3. Qualify one representative current-source exchange, then breadth

Only after item 2 passes, run one current-source Polo fixture through the
qualifying route. Use the S709 returned-file audit to check exact geometry
(`0.001 cm`), units, semantic layers/marks, piece/revision/grade/seam
identity, rendering and clean reopen. Stop on the first measured fixed-gate
failure. Do not change source garment geometry or acceptance limits to fit a
receiver.

**Decisive check:** one source-bound machine report plus actual receiver
overview/detail/reopen reviewed against the same fixture. **Stop:** any
threshold, identity, mark, unit or readability miss retires that exact route
for the tested cause; no variant sweep.

## 4. All-seven, option, grade, repeat and final output evidence

Only after the representative eligible route passes, reuse the existing
seven-recipe/73-option/grade fixtures once through that same profile; execute
one repeated round trip and inspect the returned output cohort. Preserve all
current gates and stop on the first failing supported row. Then run the one
settled Epic/PR full 100% coverage gate, integrated build/browser/Electron and
render/output review; inventory the final diff and remove only unnecessary
repository-local artifacts; review and merge the PR safely; refresh
`origin/main`; verify ancestry, required deployment and production
end-to-end behavior.

**Decisive check:** one complete current-source evidence bundle and passing
integrated gate. **Stop:** no merge/production claim if any gate, cleanup,
ancestry, Actions deployment or production check fails.

## Current route decision and estimate

No receiver/profile is selected or qualified. LibreCAD R2000 is retained only
as a generic empirical file-inspection route; its S708 success does not pass
the industrial-apparel profile gate. The shortest credible work that can
advance now is the source-side returned-file verifier/negative-input checks
in a fresh implementation slice, with no new CAD software or repeated
receiver experiment. Remaining receiver breadth and final integration cannot
be responsibly counted until an eligible profile passes one current-source
pilot. Older 9–14, S649 and S704 forecasts are stale.

All acceptance criteria, seven-recipe/73-option/grade requirements, thresholds,
protected exports, cleanup, merge and production checks remain unchanged. No
physical fit, factory acceptance, or production-readiness claim.
