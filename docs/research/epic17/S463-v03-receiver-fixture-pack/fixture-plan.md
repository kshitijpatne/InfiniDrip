# S463 receiver-independent fixture plan

This packet contains generic DXF inputs generated from the current source at
the commit named in `fixture-manifest.json`. The fixtures are prepared for a
future exact receiver/version test; their existence is not an import or
round-trip result.

| Input | What the pattern/source establishes | What a later receiver test must establish |
| --- | --- | --- |
| `tee-standard-m.dxf` | One simple, single-size Tee draft; exact source measurements/options/pieces and serialized CUT/SEW paths. | Scale/orientation selection, contour closure and per-coordinate round trip. |
| `polo-standard-m.dxf` | One complex marked Polo at source defaults; current mark entity/layer inventory is in the manifest. | Whether construction marks/notches are recognized and retained rather than treated as anonymous geometry. |
| `woven-shirt-standard-m.dxf` | One Woven-shirt default draft with its source pieces and marks. | Piece/mark interpretation and retention under the chosen receiver profile. |
| `tee-grade-xs.dxf`, `tee-grade-m.dxf`, `tee-grade-xl.dxf` | Three separately redrafted Tee sizes from the current `TEE.grade` and declared XS/M/XL `TEE.sizes`, with exact source measurements recorded. | Whether the receiver can preserve size identity, grade relationships and correspondence across files. These separate generic DXFs do **not** themselves encode one multi-size graded pattern. |
| `negative-truncated-group-value.dxf` | Deliberately malformed derivative of the Tee fixture with one DXF group code lacking its value. | The selected importer must reject or explicitly report this malformed input; it must not silently repair it and claim a successful pattern import. |

## Explicit generic-DXF limits

These inputs inherit the current writer's limitations: there is no declared
DXF unit variable, stable piece identity/name record, grade rule, or paired
seam relationship. The source coordinate convention is centimeters and Y is
flipped for CAD-up, but those facts are not declared in the DXF stream. Fixture
sidecar metadata helps us audit the expected geometry; it is not part of the
file and cannot make the receiver infer that metadata.

Once an exact lawful receiver/build is available, freeze its version and
settings before testing. Import each positive fixture with explicitly recorded
units/profile settings; capture warnings and native UI evidence; compare
piece/mark counts, orientation, scale and geometry; export through the same
receiver; and compute maximum coordinate deviation against the source
manifest. Test the three size files as a controlled size family, while keeping
native grade-rule exchange open until the chosen profile supports and
demonstrates it. Rejection of the malformed fixture is a negative control.
No standard conformance, industrial compatibility, fit, factory or production
readiness claim follows from this package alone.
