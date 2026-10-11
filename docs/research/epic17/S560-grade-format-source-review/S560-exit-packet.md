# EPIC-17 / G04 V03 — Grade-bearing DXF source/profile review — Slice 560 exit

## Outcome

S560 closes the source/profile question with the grade/size gate still held.
No supported, source-backed grade-bearing fixture was found in the current
product writer, the retained CLO installation samples, or the public CLO
exchange guidance. No grade syntax was fabricated, no standard was purchased,
and no redundant one-size CLO round trip was run. The existing CLO session
remains open for later evidence-backed scenarios.

## Verified evidence

- **CLO official guidance:** the current Help Center describes DXF-AAMA,
  DXF-ASTM, and Standard DXF import/export; says one size group is selected
  per exported file; and exposes a choice to include grading in the DXF or
  export it separately as a Rule File. It does not identify the Rule File
  syntax/version or the exact grade-point serialization. The source confirms
  that a practical product path exists, but not how to author a conforming
  grade-bearing fixture. Source: <https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export>.
- **ASTM official catalog:** D6673-04 describes DXF pattern geometry plus a
  specially formatted ASCII grade-rule table and refers to AutoCAD V13 DXF.
  The ASTM textile standards catalog lists D6673-10 as withdrawn in 2019. The
  historical title/status is not evidence that CLO's DXF-AAMA menu option is
  withdrawn or that CLO claims D6673 conformance. The full standard is paid;
  this slice did not purchase or reproduce it. Sources:
  <https://store.astm.org/d6673-04.html> and
  <https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html>.
- **NIST primary report:** NISTIR 5969 explains that ANSI/AAMA-292 did not
  define transfer of grading growth values; it used a grading-rule identifier
  that referred to information elsewhere. Its prototype had only one-size
  files, and the report warns that the DXF translation loses growth values
  when they exist in the model. This independently supports the need for an
  identified grade-rule representation; it is a 1990s report and does not
  establish current CLO implementation behavior. Source:
  <https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf>.
- **Product source and S559:** current product grading tables can produce
  separate XS/S/M/L/XL geometries, but the legacy writer receives one
  selected-size `Piece[]` and has no size-group or grade-point argument. S559's
  one-size XS geometry round trip passed 6/6 CUT/SEW outline checks at
  0.001 cm, but CLO named its output blocks `0_M`, `1_M`, and `2_M`. Thus it
  did not preserve XS identity or demonstrate an actual size nest.
- **Candidate-source check:** no licensed grade-bearing example was present in
  the installed CLO program folder; the public CLO page does not provide a
  sample or syntax. Public repository leads were not used because they did not
  establish both a suitable license and a writer/receiver fixture. No files
  were uploaded or placed outside the named C: exchange folders.

## Gate disposition

| Gate | S560 result |
|---|---|
| CLO evaluation authorization/local DXF processing | Settled by maintainer's written confirmation; no reconfirmation required. |
| CLO UI route | Documented grading-in-DXF and Rule File options; exact grade representation remains undocumented in checked public guidance. |
| ASTM grade-rule profile | Historical D6673 describes a separate ASCII grade-rule file; D6673-10 is withdrawn, and no current normative/profile conformance is established. |
| Source-generated grade relationship | Not present in the legacy DXF writer contract; separate per-size files are not a grade-bearing fixture. |
| Named-size identity and round trip | Still fails/not established by S559; do not repeat its one-size test. |
| All-seven graded configurations and V03 | Still held. No acceptance criteria or other V03 holds changed. |

## Scope and checks

This was evidence and state reconciliation only. No source or test behavior was
changed, so no production-code coverage or repository-wide test gate was due.
Focused validation: Control Center command-layer tests 42/42; board replay
preflight passed at revision 3355; validated exit commands advanced the board
to 3357; `git diff --check` and syntax checks for slice scripts passed. Actual
CLO output evidence remains the retained S559 render and measured output; this
slice intentionally did not produce another output because there was no real
grade-bearing input. No test or product source changed, so the full repository
gate was not due.

No independent, low-risk delegated task had disjoint ownership; external-agent
wait time was zero. At the S560 boundary (00:26:47 UTC), elapsed time was 5m02s:
research and durable documentation 4m02s, focused verification 0m08s, board and
state closeout 0m52s, external-agent waits 0m, and maintainer-decision time 0m.
The slice started at 00:21:45 UTC from S559 `c07d714`; the refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
Board revisions were 3353→3355→3357. S560 is the next unique slice after S559.

## Decision and next action

No maintainer decision is needed now. The next bounded step is to locate a
rights-clear, primary-source grade-bearing fixture/specification compatible
with a currently documented receiver path, then use CLO once on that exact
fixture only if the profile and source truth are established. Keep source
geometry, the legacy export path, protected byte identities, and all V03 gates
unchanged. If no lawful, exact source/profile can be found, present the
remaining evidence-backed decision before any purchase or scope change.

V01/V02 remain Done; V03 remains In Progress. No physical fit, factory
acceptance, or production-readiness claim is made.
