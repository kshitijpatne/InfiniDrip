# CLO 2026.1.310 — local Tee fixture trial

This runbook uses one synthetic Tee fixture only. For all CLO import/export
operations use the byte-verified local copy at
`C:\G04-CLO-DXF-Exchange\Input\tee-standard-m.dxf`. Keep every output and
screenshot inside `C:\G04-CLO-DXF-Exchange` (`Output` and `Evidence`
subfolders). Do not use a repository-local copy as the CLO file path or copy
the receiver output into the repository.

The DXF writer uses centimeter coordinates but does not declare drawing units.
When CLO asks for units, select **centimeters** and record the exact label.
Do not accept an unexplained scale/default. Keep the native project, output and
screenshots inside `C:\G04-CLO-DXF-Exchange` as required by the maintainer;
store only their paths, hashes and analysis in the repository.

1. In CLO 2026.1.310, choose `File > Import > DXF` and open the C: copy above.
   Record the dialog-level profile and unit choices before import.
2. Record warnings; inspect the 2D window for scale/orientation, three piece
   pairs (front/back/sleeve), six closed CUT/SEW outlines and separate pieces.
   Save a screenshot of the import settings and resulting pattern.
3. Save a native `.zprj` copy as
   `C:\G04-CLO-DXF-Exchange\Output\tee-standard-m-clo.zprj`, close/reopen it,
   and verify the pieces remain present. Do not upload the project.
4. Choose `File > Export > DXF`. Record every dialog-level DXF profile,
   unit/size option, and warning. Save as
   `C:\G04-CLO-DXF-Exchange\Output\tee-standard-m-clo-export.dxf`.
5. Reimport that exported copy in CLO and inspect it. Save a screenshot and
   report any missing, merged, reinterpreted or rescaled geometry/marks.
6. Keep the exported DXF, native project and screenshots only in the named C:
   folder. Record their exact paths, lengths, hashes and review findings in the
   durable slice packet. Do not edit the source fixture.

These steps are an observed product workflow, not proof of AAMA/ASTM
conformance. Slice 475 parsed the actual CLO output and compared entity types,
layers, closed contours, bounds and coordinates with the fixture; see
`docs/research/epic17/S475-clo-tee-roundtrip/S475-exit-packet.md`. Its six
source contours matched under C04's 0.001 cm maximum coordinate delta, while
coincident layer multiplicity remains under review. A failure remains a
failure; do not repair geometry manually or change the source fixture.
