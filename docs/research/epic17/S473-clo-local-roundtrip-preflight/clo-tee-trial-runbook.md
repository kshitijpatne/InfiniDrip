# CLO 2026.1.310 — local Tee fixture trial

This runbook uses one synthetic Tee copy only. Source fixture:
`docs/research/epic17/S463-v03-receiver-fixture-pack/fixtures/tee-standard-m.dxf`.
Prepared copy:
`docs/research/epic17/S473-clo-local-roundtrip-preflight/inputs/tee-standard-m.dxf`.

The DXF writer uses centimeter coordinates but does not declare drawing units.
When CLO asks for units, select **centimeters** and record the exact label.
Do not accept an unexplained scale/default. Keep the output under this packet's
`receiver-outputs/` folder.

1. In CLO 2026.1.310, choose `File > Import > DXF` and open the prepared Tee
   copy above. Record any dialog-level profile and unit choices before import.
2. Record warnings; inspect the 2D window for scale/orientation, three piece
   pairs (front/back/sleeve), six closed CUT/SEW outlines and separate pieces.
   Save a screenshot of the import settings and resulting pattern.
3. Save a native `.zprj` copy into `receiver-outputs/`, close/reopen it, and
   verify the pieces remain present. Do not upload the project.
4. Choose `File > Export > DXF`. Record every dialog-level DXF profile,
   unit/size option, and warning. Save as
   `receiver-outputs/tee-standard-m-clo-export.dxf`.
5. Reimport that exported copy in CLO and inspect it. Save a screenshot and
   report any missing, merged, reinterpreted or rescaled geometry/marks.
6. Return the exported DXF and screenshots to this packet (or attach them in
   chat). Do not edit the source fixture. Keep the `.zprj` only if needed to
   support reopen observations.

These steps are an observed product workflow, not proof of AAMA/ASTM
conformance. The next slice will parse actual output and compare entity types,
layers, closed contours, bounds and coordinates with the fixture. The C04
maximum coordinate delta is 0.001 cm. A failure remains a failure; do not
repair geometry manually or change the source fixture.
