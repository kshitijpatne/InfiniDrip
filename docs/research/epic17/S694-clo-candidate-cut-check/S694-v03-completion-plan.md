# G04 V03 prioritized completion plan after S694

## Route decision

Keep the already-installed CLO 2026.1.310 Standard DXF path as a **candidate
for one causally justified empirical recheck**, not as a qualified profile.
S694 proves that the S693 candidate still misses the fixed CUT gate and three
buttonhole anchors; it also confirms the return strips mark entity types and
semantic layer names. Do not test another application, file format, import or
export setting, text encoding, or fixture. Do not claim ANSI/AAMA or ASTM
conformance. Rights/local handling is already authorized and is not the
technical failure.

## Ordered work groups

### 1. Diagnose the actual returned CUT differences, then make at most one supported candidate-encoding correction

**Evidence to resolve:** S694's real Standard-DXF return has seven CUT
residuals over `0.001 cm`; all nine SEW paths and two placket CUT paths pass.
The largest error is the inner stand at `0.039767881 cm`. The four stand/collar
maxima occur at source index 182 and y=`75.791 cm`; source and returned vertex
counts differ. These are observed facts, not a settled cause. This is the same
route and Polo M option as S689, but with the new S693 adaptive candidate.

**Work:** Compare the exact S693 input with its exact CLO return at the
localized source vertices, especially shared stand/collar index 182; inspect
the owning source curves and the import/export's emitted polyline
types/point sequences. Determine whether the residual is caused by our
candidate's approximation or by CLO re-fitting the polyline. This is a
read-only source/output diagnosis; do not touch
physical pattern geometry, seam allowances, legacy export, or thresholds.
If it proves our candidate representation is the source of the error, only a
candidate-package change that preserves the exact source cut locus may be
implemented. If CLO changes an otherwise exact submitted path, do not distort
our geometry to compensate; retire this candidate route instead.

**Decisive check:** focused tests and 100% changed-module coverage plus actual
rendering of the exact candidate; then **one** same-route CLO Standard DXF
round trip on the same Polo M file. Every CUT and SEW path must be at or below
`0.001 cm` and the output must have no crossings/topology changes.

**Stop:** if no candidate-encoding change is causally supported, or if passing
requires changing physical geometry or tolerance, retire CLO Standard for
this candidate. If the one recheck has any path over the fixed gate, stop
receiver trials on that route. Do not keep adding geometry experiments.

### 2. Clear visible-mark and identity gates only after geometry passes

**Cause to resolve:** S694 matches 105/108 visible mark geometries but loses
three buttonhole anchor points; every returned mark has also been flattened
into `LWPOLYLINE` geometry on numeric layers. The existing source package
already binds mark IDs, geometry and the exact source drawing digest, but no
sidecar was associated with a rewritten return.

**Work:** inspect the exact three source anchors and returned block geometry.
Define a candidate-only, source-bound visible representation only if it
preserves each buttonhole's represented position and distinct identity without
claiming an unmeasured physical size. Separately prove that a returned-file
sidecar can be tied to the exact return hash and unambiguously map every piece,
revision, grade, mark and seam relation; reject missing or ambiguous matches.
Do not use a sidecar to fill missing receiver geometry.

**Decisive check:** one same-route export/import return, exact coordinate
comparison, mark/type/layer inventory, and sidecar tamper/mismatch tests. The
returned visible positions and the sidecar's exact file digest must both
verify; every piece must map uniquely.

**Stop:** a missing visible mark, ambiguous piece mapping, unbound sidecar, or
required physical-size assumption keeps the route unqualified. No unrelated
callout or cosmetic changes.

### 3. Prove route eligibility and remaining route gates using existing evidence

After geometry, marks and identity pass on one exact valid Polo M round trip,
first write a precise empirical receiver/profile record: full CLO build, exact
Standard-DXF import/export route, units, settings, file/sidecar contract and
evidence supporting its apparel/industrial use. The menu label alone is not
that record. If this route cannot meet the admission's documented profile and
input-contract gate, it does not qualify even if geometry is later fixed.

Only after that Gate 0 passes, use the existing malformed/unsupported inputs
and two frozen-revision generations once on the same receiver/profile. Require
explicit rejection with no partial drawing, silent repair or clamping and
repeatable semantic/geometry output. Then run the existing seven-recipe,
73-option and grade matrix once through that same route and inspect
whole/detail saved output. Any failed row holds V03; do not narrow the matrix
or borrow results from a different application.

### 4. Integrated completion

When no product changes remain, run the single full repository 100% coverage,
build, browser/Electron and output-replay gate; recheck protected export byte
identities; review final rendered output and applicable manual findings; curate
the final diff to necessary product/project files; create and review the PR;
merge safely; refresh `origin/main` and verify ancestry; confirm any required
automatic deployment and live HTTP 200. No physical-fit, sampling, factory
acceptance, standards-conformance or production-readiness claim.

## Estimate and current stop point

The previous 9–14 slice estimate is stale. S694 adds a real source-candidate
return, but no route has yet passed all gates. The shortest credible path is
one source/output diagnosis, at most one causally supported serializer change
and same-route recheck, then the existing staged gates above. The actual
remaining slices cannot be estimated honestly until the CUT diagnosis shows a
safe correction; this does not pause or close the overall EPIC goal.

No next receiver import is authorized by this plan until step 1's source/output
diagnosis names a specific change and its distinct gate. The current goal
continues with that read-only diagnosis as the next action.
