# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 645

## Decision summary

S645 finds no untested producer-side encoding route in the current code or
retained experiments that both preserves the exact five Polo CUT curves and
passes the measured receiver. The product's existing R12 writer already
separates CUT/SEW geometry and writes marks; it lacks profile metadata such as
explicit units, stable role/revision identity and source mark IDs. Those are
real future additive-profile gaps, but do not explain the five missing
vertices. A new writer could address metadata only after a receiver/profile
is qualified; it cannot clear geometry without successful receiver evidence.

The five current CUT residuals are confirmed across multiple distinct tested
representations: minimal POLYLINE, R2000 LWPOLYLINE plus units, connected LINE
network, 0.05 cm fillets, degree-1 SPLINE variants, and named BLOCK/INSERT
grouping. S634 maps the five micro-segments to current source allowance output;
S643 shows those regions across all 17 existing Polo M option cases. No
source-side adjustment is justified at the unchanged `0.001 cm` tolerance.

## Gate matrix

| Admitted V03 gate | Latest evidence through S645 | Disposition |
|---|---|---|
| Receiver, documented industrial profile, and rights | CLO local-use authorization is settled, but its documented vendor modes name no current normative edition/conformance. S644's new candidate sources found no eligible local/no-cost two-way apparel receiver. | **Open / blocking.** No qualified profile/receiver. |
| Units and coordinate contract | Legacy writer uses cm, Y flip and 0.001 cm rounding, with no `$INSUNITS`; CLO trial settings selected cm/100%/no rotation. | **Open / blocking.** No qualified receiver-independent units/axis/rounding/grade contract. |
| Source validity and CUT/SEW geometry | Source separates CUT/SEW, but S642 named-block CLO import still passes only 13/18 contours and fails five Polo CUTs. S643 establishes exact source features and all-17-option effect. S536, S590–S594, S635–S642 reject several encoding/geometry candidates. | **Open / blocking.** Preserve source geometry; no candidate passes the unchanged tolerance. |
| Seven recipes, supported options, and grades | Existing cohorts are partial or generic; S642 is Polo M/default. No profile-specific all-seven grade/options round trip passes all gates. | **Open / blocking.** |
| Piece, garment, revision identity, and relationships | S642 proves role block names survive in one Polo M/default fixture. Legacy writer has no piece/revision IDs; S588 tested XDATA lost 56/56 IDs. | **Partial / blocking.** Metadata candidates do not establish round-trip identity. |
| Manufacturing marks and layer/entity semantics | Source uses explicit CUT/SEW and `MARK_<kind>` layers, but output semantics remain mixed/incomplete in CLO. S637/S639 provide specific mark failures. | **Open / blocking.** |
| Malformed/invalid input | S531 records silent acceptance/corruption for a malformed CLO input; not qualified for an apparel profile. | **Open / blocking.** |
| Repeat round trip | Existing generic R14 and bounded CLO generations do not meet the complete apparel profile gates; S642 stopped before export. | **Open / blocking.** |
| Rendered output/readability | Existing captures prove gross piece presence or specific failures, not complete useful-detail review on a passing seven-recipe profile. | **Open / blocking.** |
| Legacy DXF/protected identities | No source writer or output baseline changed in S643–S645. | **Preserved; final integrated gate still due.** |
| V02/all-seven dependency | Board keeps V01/V02 Done; V03/Epic In Progress. | **V02 prerequisite met; V03 incomplete.** |

## Decision and next action

Keep every admitted requirement, threshold and hold unchanged. The next
substantive work requires an eligible receiver/profile that can be locally
tested and preserve the source's five CUT regions. Under current constraints,
the only confirmed receiver is CLO, and its tested paths fail this geometry
gate. The new free/local candidates do not provide eligible two-way apparel
exchange. Do not add a production serializer, repeat encoding trials, alter
the five source curves, relabel generic DXF as industrial, or lower the gate
without new evidence and explicit authority. Keep EPIC-17/V03 In Progress;
the precise external dependency is rights-cleared local receiver access.

## Evidence references

- Legacy writer: `src/export/dxf.ts`; source-to-output audit: S586.
- Additive profile/identity contract and limits: S587; XDATA pilot: S588.
- Exact representation candidates: S536, S590–S594, S635–S642, especially
  S634 topology trace and S642 native comparison.
- Option impact: S380's 17-row matrix and S643 exit packet.
- Receiver availability: S548, S554, S641, S644 packets.
- Current V03 rows remain linked from S644's full matrix; no gate was cleared
  or weakened in S645.
