# EPIC-17 / G04 V03 — DXF profile contract map — Slice 587 exit

## Result

S587 mapped the exact current CLO DXF-AAMA guide against S586's product
writer findings and checked only the primary DXF metadata references needed
for units and application identity. This identifies which data the candidate
profile documents, which fields are generic DXF facilities, and what still
requires an observed round trip. It does not create an AAMA conformance
claim.

## Field-by-field contract

| Field | Product writer / retained evidence | CLO profile evidence | Generic DXF evidence | Safe conclusion |
|---|---|---|---|---|
| Profile identity | S558 names the tested candidate `CLO 2026.1.310 / DXF-AAMA`. | CLO's current guide lists Standard DXF/AAMA/ASTM import choices, DXF-AAMA export, and says it produces the same output as the older Gerber DXF-AAMA choice. | Not applicable. | This is the named tested profile, not proof of conformance to a particular AAMA edition. |
| Units and scale | Product coordinates are centimetres; S586 shows no `$INSUNITS`. S536's changed header/entity encoding did not repair Polo corners. | CLO asks for the input pattern CAD unit and separately sets output scale/unit. | Autodesk documents `$INSUNITS` group 70 value `5` for centimetres, describing it as the default drawing units for AutoCAD DesignCenter blocks. | A standards-based writer may declare centimetres as metadata, but CLO's documented workflow still asks the user to set scale; verify actual measured round-trip scale. The header is not a corner-loss repair. |
| CUT/SEW | Product writes separate `CUT` and `SEW` layers. S557 observes nine mixed semantic layer assignments in CLO's seven outputs. | CLO exposes a swap-cutting/sewing option and warns that these types may change with exporter settings. It does not publish a `CUT`/`SEW` layer-name-to-output-layer contract in the guide. | Group code 8 is a layer name; generic layer labels do not define apparel manufacturing meaning. | Keep source CUT/SEW identity explicit. Do not infer CLO's numeric output layers from the AAMA label; round-trip semantics remain failed/held. |
| Piece identity | The DXF writer does not serialize piece names or revision IDs. CLO output pieces can be associated uniquely by SEW geometry, not embedded source identity. | CLO guide describes size-group selection, not stable piece/revision identifiers. | DXF provides generic names, handles, block references, and XDATA. Autodesk says XDATA is grouped by registered application name and the application defines its internal sequence/meaning; an entity handle is a drawing reference, not a product UUID. | Stable InfiniDrip piece/revision IDs would be product metadata. A registered-app XDATA route is technically representable but has no documented CLO preservation guarantee and no apparel-standard meaning. |
| Mark IDs and labels | Source emits `MARK_<kind>` geometry and omits each source mark name/optional label. | CLO says pattern annotation can be imported, but does not define which DXF entities or IDs/labels are retained, nor a mark-kind semantic map. | XDATA can carry application-defined strings and values; APPID registration is required. | Do not claim mark identity/label compatibility. One targeted XDATA preservation test can decide whether that product-specific metadata survives this receiver path. |
| Grading | Product export receives one selected-size `Piece[]`; no grade relationship is serialized. All S586 fixtures are M/default. | CLO documents one selected size group per DXF and says grade info may be included in DXF or exported as a Rule File; “Export without Grading” is current-size-only. | Generic DXF attributes alone do not establish apparel grade rules. | Source-backed sizes/rules must be generated and compared before testing CLO's grade route. S559/S562 source size correspondence is not a passed exchange. |
| Format/version | Current writer emits minimal R12-style entities and no header. | CLO labels choices AAMA/ASTM/Standard; its guide does not disclose an exact normative AAMA edition or layer/mark schema. | Autodesk defines generic DXF headers and metadata. | Adding a generic header does not turn a file into a verified industrial apparel profile. Retain the narrow profile identity and measure all claims. |

## Evidence interpretation

CLO's guide says the selected DXF format is an industrial CAD pattern format;
it names AAMA and ASTM modes, units, pattern annotation, and cut/sew swapping.
That is enough to identify the documented CLO mode and its visible controls.
It does not specify layer names, stable piece/revision IDs, label entities,
mark IDs, XDATA support, or an AAMA edition. Its UI scale selection means
`$INSUNITS` alone cannot establish what a CLO import used. Autodesk's generic
DXF documentation says `$INSUNITS=5` means centimetres for DesignCenter block
insertion; XDATA content is application-defined. Neither source makes those
generic fields apparel-CAD semantics.

S536 already tested a geometry-identical R2000 `LWPOLYLINE` input with an
`$INSUNITS` declaration and still measured the same five Polo CUT-corner
failures. The next trial should therefore isolate a different, specifically
measurable property: whether registered-app XDATA IDs survive CLO DXF-AAMA
import/export. It may address source entity identity only if the returned
IDs are intact; it cannot repair the Polo geometry failure or establish
industrial meaning for the IDs.

## Next action

S588: make one temporary, geometry-identical Polo M diagnostic DXF under
`C:\G04-CLO-DXF-Exchange\S588-xdata-retention-pilot`, adding registered-app
XDATA that assigns stable product piece-role and mark IDs to existing source
entities. Keep coordinates, CUT/SEW layers, ordering, and all visible
geometry unchanged. Use the already-running CLO 2026.1.310 DXF-AAMA route
once, then parse the returned file to measure XDATA retention, piece/mark
association, layer behavior, units, and the already known contour residual.
This is an evidence pilot, not production code or a standards claim. Do not
continue the XDATA route if the receiver drops or reassigns IDs. Preserve all
V03 gates and the legacy writer.

## Sources

- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated 2026-09-28. Its import table documents format choice, operator-selected unit, pattern annotation, cut/sew swapping and curve-point optimization. Its export table documents one size group per file, AAMA/ASTM/Standard modes, grade data in DXF or Rule File, scale, and current-size-only export.
- Autodesk, [HEADER Section Group Codes (DXF)](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm), `$INSUNITS` group 70 mapping; the page scopes its description to DesignCenter block units.
- Autodesk, [About Extended Data (DXF)](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-A2A628B0-3699-4740-A215-C560E7242F63.htm), registered application groups, limits, and application-defined XDATA sequence/meaning.
- Autodesk, [APPID (DXF)](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-6E3140E9-E560-4C77-904E-480382F0553E.htm) and [DXF Group Codes in Numerical Order](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-3F0380A5-1C15-464D-BC66-2C5F094BCFB9.htm), for registered application names, name/layer/handle groups, and XDATA group codes.
- Retained product facts and limitations: S586 exit packet and C:-only source-profile report; S536 exact changed-encoding result; S558 official profile-identity disposition; S573 current V03 acceptance matrix.

## Verification and state

- Compared every row with the S586 machine report and retained packets; no
  source/output fixture was regenerated or changed. Board start/exit replay
  is 3461→3463→3465; the replay adds S587 evidence and comment without
  changing EPIC-17/G04-V03 or V02 status.
- `node --check` for all S587 scripts, `npm run control-center:test` (42/42),
  board preflight, and `git diff --check` passed at start. No production code
  changed, so no coverage or full repository gate is due in this slice.
- S587 start: 2026-10-09 06:24:24 UTC; verified exit at 06:26:46 UTC.
  Elapsed time separately: primary-source review 0m45s; report/matrix
  analysis 0m35s; focused script/board tests 0m30s; durable packet/context/
  board closeout 0m32s; implementation 0m; external-agent waits 0m;
  maintainer-decision time 0m. Total 2m22s. No physical-fit,
  factory-acceptance, or production-readiness claim is made.
