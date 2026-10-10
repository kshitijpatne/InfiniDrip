# S673 source-bound adapter feasibility findings

## Decision

**No-go for an adapter around the tested CLO Standard-DXF export.** The exact
S672 export has a unique correspondence to its frozen source for this one
fixture (nine distinct source SEW contours map to nine distinct blocks
`0_M`–`8_M`), so a pinned input can help identify the pieces. That does not
make the export lossless: five CUT contours exceed the geometry gate, units
change incorrectly, and typed mark/source-layer semantics do not survive.

The observed CLO conversion maps an untouched import into the same lossy DXF
that a user could produce by editing those contours to the exported points.
The DXF does not record edit intent or a source-geometry revision. An adapter
can fail closed on the difference, but cannot safely decide to restore the
original CUT/marks without potentially overwriting a real CAD edit. Doing so
would also use a sidecar as a substitute for required geometry/marks, contrary
to the accepted C04 contract. An unchanged-fixture-only restoration is not a
safe, complete CAD round trip. No production integration is justified.

## Source audit

`src/export/dxf.ts` exposes a write-only legacy DXF R12 renderer. It flattens
pieces into laid-out CUT/SEW polylines, flips Y, serializes no receiver-stable
piece/revision identity or explicit units/header, and returns only an ENTITIES
section. `src/export/pattern-mark.ts` emits LINE/CIRCLE/POINT geometry on
`MARK_*` layers but does not serialize mark IDs/labels. There is no product DXF
importer in the current source tree. The existing writer is protected by byte
identity tests and remains unchanged.

The S672 input/output analysis proves for this one exact file that source SEW
contours distinguish the nine source pieces. It does not prove durable identity
through arbitrary edits, another revision, another recipe/option/grade, or a
generic DXF received without a matching source. Source CUT recovery from the
export would require guessing or overwriting geometry. The output does not
carry source `CUT`, `SEW`, and `MARK_*` semantics, `$INSUNITS=5` centimeters,
or explicit piece IDs; it carries numeric layers, receiver ordinal blocks,
and `$INSUNITS=4` with unscaled centimeter-sized coordinates.

The accepted C04 contract allows a version-matched sidecar for grade, piece
identity and seam relationships if the file format cannot carry them. It
requires the actual DXF path to retain CUT/SEW, typed marks, coordinates,
units, scale, orientation and separately selectable pieces. It does not allow
a sidecar to replace missing/changed geometry or visible marks. Reference:
`docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`, CAD
contract and fixture acceptance section.

## Free local receiver screen

OpenMarker was checked as a possible no-cost local alternative from its
first-party repository. Its README identifies it as an offline-first garment
layout/nesting tool under Apache-2.0, but also says it is under development,
not production-ready, supports DXF import only, and still lists export of
saved layouts as planned. It cannot currently satisfy V03 import/export or
round-trip evidence, so no files were sent to or opened in it and it was not
installed. First-party source: https://github.com/Weilei424/openmarker
(`README.md`, `LICENSE`).

Hosted browser editors remain excluded by G04's no-hosted-service boundary.
The existing OpenCAD R14 experiment remains generic parser/converter evidence,
not a documented apparel CAD receiver/profile. DGS is retired by S667–S670;
CLO Standard is disqualified by S672. No alternate format trial is proposed.

## Smallest technical requirement to proceed

The next candidate must be rights-reviewed and must demonstrably import and
export pattern DXF locally while retaining every CUT/SEW path and visible
typed mark to `0.001 cm`, unit/origin/orientation, and distinct piece
selection. It must support a C04 version-bound sidecar for permitted identity,
grade and seam-relationship data, reject malformed/unsupported input without
silent repair, and produce a readable native/rendered result. Existing
GetonAgain and CLO approvals do not make their failed routes eligible. Until a
candidate meets that entry gate, do not change source geometry, the legacy
writer, protected byte baselines or V03 acceptance.

No physical fit, factory-acceptance, standards-conformance or production-
readiness claim follows.
