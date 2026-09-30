# Slice 317 manual production-output review

Reviewed the accepted back SVG screenshot and retained front hold for the default, `waistbandDepth` minimum (2 cm) and maximum (8 cm), and `legOpening` minimum (25 cm) and maximum (65 cm) cases.

- Each accepted back remains a coherent source-mapped Trouser back with `backLeft` and `backRight` outlines. The artwork placement boundary remains on `backLeft` and inside its exact boundary; the replay independently verifies the eleven source edge subpaths are endpoint-connected and closed before sampling the 10 × 10 interior grid (121 samples per case).
- The two back callouts remain separate from all emitted text bounds; every case has an empty overlap list. Both callout leaders retain their exact geometry targets and current output revision.
- Each corresponding front request shows the complete center-front join hold, zero SVGs, and no partial face.
- **Colorway presentation fails visually:** the production SVG reports `#3A4150` and attaches fill attributes to source edges, but its independently stroked open edge subpaths do not enclose painted regions. Raster pixels at the overlay center are `[255,255,255]`, identical to the white paper reference, across all five cases. Do not treat the colorway metadata as a visible color overlay.
- The bundled artwork is only a placement boundary. The SVG does not embed its image content, and this review does not establish clipping, textile appearance, physical fit or factory acceptance.

Full production screenshots and per-case raster/geometry evidence are in this directory's PNG/SVG files and `matrix.json`. The first checker attempt and rendered default candidate are retained as `back-default-candidate.*`; their `isPointInFill` false result was traced to the intentional separate source edge subpaths and replaced with the exact-join/closed-loop check.
