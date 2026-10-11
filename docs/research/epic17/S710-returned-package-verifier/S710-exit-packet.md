# EPIC-17 / G04 V03 — S710 exit packet

## Result

S710 adds `auditDxfInterchangeRoundTrip(sourcePackage, returnedDxf)` as a
separate source-side verifier. It keeps `verifyDxfInterchangePackage`'s exact
source-byte hash requirement unchanged. The new audit requires the current
schema-v5 source package; binds returned block and INSERT names to the source
manifest; checks centimeter units; rejects in-plane translation, rotation or
scale and repeated INSERT instances; and compares CUT/SEW ordered points,
closure, entity identity, layers and mark entities at the fixed 0.001 cm
limit. Outline comparison covers normalized vertices, elevation, widths,
thickness, extrusion direction and per-vertex curve bulges. Harmless adjacent
duplicate vertices with identical geometry attributes are normalized because
the receiver may remove them; a duplicate with a changed curve/width attribute
is rejected.

## Actual receiver return and diagnosed mistake

S710 replayed the exact saved S708 LibreCAD 2.2.1.5 Polo M return from
`C:\G04-CAD-Interchange\S708-cut-layer-source-audit\` against its unchanged
source manifest. The first audit attempt rejected it because LibreCAD writes
INSERT Z scale as zero. Inspection of the actual INSERT records showed the
flat's X/Y placement, scale and rotation are unchanged; the Z scale cannot
alter the planar drawing. The mistake was in our overly strict transform
check. S710 now permits Z scale 0 or 1 while still checking every transform
that can move, rotate, scale or duplicate the 2D pieces. The actual return also
removes an identical repeated point; the audit now compares normalized paths
while still checking curve bulges, widths and other geometry properties.

The same actual file then passed with 9 pieces, 18 CUT/SEW outlines, 111 mark
entities, declared centimeters, and 0.000 cm maximum XY difference. S708's
already-reviewed LibreCAD output remains the visual evidence; S710 does not
claim a new receiver profile, broad matrix, or industrial-CAD qualification.
The return audit JSON and inspection details remain on C: only.

## Verification

- New return-audit suite: 8/8; changed production module coverage is 100% for
  statements, branches, functions and lines.
- Existing interchange-package suite, including malformed/tampered and
  unsupported inputs: 10/10; package module coverage is 100% for all four
  measures. The existing suite's two matrix-generation tests took 22.64 and
  29.28 seconds; total test time was 62.98 seconds. This is fixture generation
  for the existing option/grade coverage, not repeated CAD testing. No worker
  memory pressure was observed; no runner default changed.
- Protected byte-identity regression: 8/8.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed; only normal CRLF conversion notices.
- Existing rendered S708 output review remains the visual evidence. No CAD
  file, screenshot, temp script or machine path was added to the repository.
- No full repository gate was run; it remains reserved for the settled
  integrated Epic/PR candidate.

## Fixed gates and remaining work

This passes one source-side return audit fixture and verifier negative tests.
It does **not** pass or qualify the receiver/profile requirement. LibreCAD is
generic CAD; the industrial-apparel profile remains unproven. All-seven recipe
and supported-option/grade receiver breadth, a qualifying current-source pilot,
repeatability, full malformed-receiver behavior, and rendered readable-output
evidence remain unproven or failed as recorded in the S709 matrix. V02, fixed
thresholds, protected legacy output identities, all acceptance criteria, and
all holds are unchanged. No app, format, or setting variation was run.

The exact S709 accountability is retained: GetonAgain was installed based on
official free-edition/DXF claims before the installed workflow was verified;
that order was a process mistake. S667/S670 document the tested modes, but do
not establish that every failure was solely the app or solely our source.
S708 found a separate real source-writer structure defect, and S710 found a
separate over-strict verifier assumption. Fixing those source issues advances
the evidence but does not make an ineligible receiver eligible.

## Boundary and timing

- Started 2026-10-11 02:04 UTC from clean S709 commit
  `15274f91cdcf9cd99f6cbb1df0112b0b978860c8`, branch
  `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  remains an ancestor. Board start replay: 4167→4169; validated exit
  evidence/comment: 4169→4171. S710 is the next unique slice after S709.
- Closed 2026-10-11 02:31 UTC, before the S710 commit.
- Elapsed: about 27 minutes. Implementation and actual-output diagnosis: 12m;
  focused audit/package coverage and profile diagnosis: 9m (the existing
  contract suite itself ran 67.56 seconds wall time); protected identity,
  actual-return, type/diff and board checks: 2m; documentation/board closeout:
  4m; external-agent waits: 0m; maintainer-decision time: 0m.
- Goal status remains active. No pause or blocked transition is requested.

## Next action

Use the S709 fixed completion plan and existing measured outputs to select one
source-side change that directly addresses a demonstrated V03 failure. Do not
run another receiver/app/format variant or the 73-option matrix without an
eligible profile and a representative pilot. Preserve the acceptance gates;
continue through the final integrated gate, final necessary-file cleanup,
PR/merge, ancestry, deployment and production end-to-end verification.
