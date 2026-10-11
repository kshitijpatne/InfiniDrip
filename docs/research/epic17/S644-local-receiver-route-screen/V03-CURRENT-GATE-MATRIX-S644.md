# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 644

## Decision summary

No newly screened receiver meets the current no-cost, local-file, no-contact,
apparel-CAD import/export requirements. This bounded review does not prove no
such software exists. It adds three newly surfaced candidates to the existing
S548/S554/S641 screens and reconciles them with S643's source-geometry result.

| Candidate | Primary-source evidence | V03 disposition |
|---|---|---|
| PatternSoft | Publisher describes a Windows desktop MIT-licensed app whose data stays local. Its documented output is PDF/SVG; the reviewed capability page does not document DXF import or export. | **Not an exchange receiver.** Useful for local pattern drawing/visual grading research, but no evidence for G04 round trip or apparel DXF profile. |
| MPattern browser CAD editor | Official page says the browser editor imports AAMA/ASTM and R12 DXF for free. Exporting or saving files from that editor requires MPattern Cloud, a paid hosted add-on. | **Excluded.** It cannot provide a no-cost, local-file end-to-end round trip under this task's constraints; do not load product patterns into it. |
| OpenMarker | Official repository describes an offline/local garment marker tool and DXF import, but says it is not production-ready and lists export flow as planned. | **Not yet a round-trip receiver.** Could be reconsidered only after a stable release documents export and a profile appropriate to interchange. No install or file transfer. |

Earlier screens remain decisive for other candidates: Seamly2D exports but
does not import DXF (S641); Valentina's reviewed format documentation is
export-focused; Pro2CAD lacks public no-cost product-use/locality terms
(S548); Optitex's currently accessible official help does not establish
trial rights/local processing (S554); TUKAcad's free edition lacks documented
DXF exchange (S554); CAD4Fashion needs unverified demo access and vendor
contact (S641); garment.dev is hosted (S641). Existing CLO authorization is
settled, but CLO 2026.1.310 fails the Polo pre-export geometry gate in the
tested profiles (S642). OpenCAD Studio has useful generic-DXF evidence but is
not a documented apparel exchange profile (S641 and earlier local trials).

## Gate matrix

| Admitted V03 gate | Latest evidence through S644 | Disposition |
|---|---|---|
| Receiver, documented industrial profile, and rights | CLO is authorized for local product-development testing but no active normative edition or conformance evidence is documented. New no-cost candidate screens found no eligible two-way local apparel receiver. | **Open / blocking.** No qualified receiver/profile. Exact standard claim remains unsupported. |
| Units and coordinate contract | CLO runs selected cm/100%/no rotation; generic R14 is not an apparel-profile contract. | **Open / blocking.** Need defined axes, origin, scale, rounding and grade units. |
| Source validity and CUT/SEW geometry | S642 named-block CLO import passes 13/18 contours; same five Polo CUTs fail at `0.001 cm`. S643 maps them across all 17 S380 option rows; no source repair is supported. | **Open / blocking.** Preserve current geometry and threshold. |
| Seven recipes, supported options, and grades | Existing generic R14 evidence covers a bounded STANDARD_M cohort, not an accepted industrial profile. S642 covers Polo M/default only. | **Open / blocking.** No profile-specific all-seven/options/grade cohort. |
| Piece, garment, revision identity, and relationships | S642 retains nine Polo role names in one fixture; stable revision/relationship identity across the cohort is unproven. | **Partial / blocking.** |
| Manufacturing marks and layer/entity semantics | S637 mark circles are absent in tested CLO output; S639 native button/buttonhole export differs in shape and position. | **Open / blocking.** |
| Malformed and invalid input | S531 records silent acceptance/corruption for a tested malformed CLO input; generic R14 evidence does not qualify an apparel profile. | **Open / blocking.** |
| Repeat-round-trip stability | Generic R14 repeatability is not apparel-profile evidence; S642 stopped before export on the geometry failure. | **Open / blocking.** |
| Rendered output and readability | S642 confirms piece presence only; its failed geometry gate blocked output/reimport review. Other retained CLO renders include concrete mark omissions. | **Open / blocking.** |
| Legacy DXF and protected export identities | No product writer or export baseline changed in S643/S644. | **Preserved so far; integrated regression gate remains due.** |
| V02/all-seven dependency | Board retains V01/V02 Done and V03/Epic In Progress. | **V02 prerequisite met; V03 incomplete.** |

## Next decision gate

All admitted acceptance remains unchanged. Continue only on a distinct, testable
route that does not require a hosted service, spending, vendor contact, or
unverified rights. The new candidate screen found none. If no already-installed
authorized apparel receiver exists, the external dependency is access to a
rights-cleared local industrial apparel CAD receiver that can import and
export the profile and preserve the source coordinates. Do not solve this by
changing source geometry, weakening a gate, or relabeling generic DXF. Keep
V03/Epic In Progress while checking whether existing product-side controls
offer another source-exact route; no new receiver installation or external
contact is authorized by this slice.

## Official references

- PatternSoft publisher: <https://drytrix.com/patternsoft.html> (local Windows desktop/MIT claims; PDF and SVG output listed).
- MPattern editor: <https://www.mpattern.app/en/free-pattern-making-software> (free AAMA/ASTM/R12 import; editor export requires Cloud).
- MPattern Cloud: <https://www.mpattern.app/en/cloud> (editor export and saving require MPCloud).
- OpenMarker repository: <https://github.com/Weilei424/openmarker> (local import capability; DXF export planned; project not production-ready).
- Prior screens: S548, S554, and S641 exit packets in this directory's neighboring slice folders.
