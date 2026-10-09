# S630 official profile and mark-semantics source audit

## Decision summary

The official sources establish that CLO exposes DXF-AAMA and DXF-ASTM modes,
and that ASTM D6673-10 was withdrawn in 2019 with no replacement identified
on its current ASTM record. NISTIR 5969 supplies a typed research model for
apparel pattern marks and reports a prototype translator to historical
ANSI/AAMA-292. Figure 2.9 depicts a `mark_feature` with `feature_type` and
`location` to a `point`; Figure 2.10 defines point coordinates X and Y. Neither
the model nor its prose specifies a `MARK/CIRCLE/POINT`-to-DXF layer encoding
or a receiver contract for CLO 2026.1.310. NISTIR 5969 describes its
AAMA-292 basis as AutoCAD Version 11 DXF; ASTM D6673-10 instead names Version
13 DXF. The tested S628 `$ACADVER` is AC1009, which Autodesk identifies as
R11/R12 rather than AC1012/R13. Therefore S630 has **no sourced
mark-conversion hypothesis** for another receiver trial. Treat S629 as an
empirical mismatch for the tested CLO DXF-AAMA build and fixture; preserve
the V03 hold. This is a documentation and version-identity limit, not evidence
that every receiver/profile fails.

## Source findings

| Source and authority | What it establishes | What it cannot establish here |
| --- | --- | --- |
| CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated 2026-09-28; lines 42–69, 79–89 | CLO's help names Standard DXF / AAMA / ASTM import choices; DXF-AAMA, DXF-ASTM, Standard DXF export choices; scale, annotation, notch and curve options; export is one size group per file and grading can be included or provided via a Rule File. | It does not identify the underlying normative edition/profile version, the format's precise conformance scope, or an entity/layer mapping for source `MARK_*` LINE/CIRCLE/POINT semantics. It says nothing that would resolve S629's output geometry. A menu label alone is not a profile conformance claim. |
| ASTM, [D6673-10 product record](https://store.astm.org/d6673-10.html) and [official textile standards catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html) | The current public ASTM record identifies *Standard Practice for Sewn Products Pattern Data Interchange—Data Format*, edition D6673-10, **Withdrawn 2019**, **No replacement**, last updated 2019-01-09, and no PDF download. Public scope/abstract says 2D sewn pattern piece exchange and grade-rule-table exchange; it excludes representation of relationships between pieces / correspondence between 2D or 3D geometries and cites AutoCAD Version 13 DXF. | The public product record does not expose the full technical clauses needed to certify the exact mark-layer/entity mapping. No purchase or use of unofficial full-text reposts was authorized. Withdrawn status does not prove the format is unusable in practice, but it prevents calling D6673-10 the current active ASTM standard. The catalog's “no replacement” is the status of that ASTM item; it does not prove no vendor-specific industrial profile exists. |
| NIST, [NISTIR 5969](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf) (1997), Section 2.1 / Figures 2.6–2.10, Section 3.3–3.4 and conclusion | The report defines a STEP/EXPRESS Pattern Information Model. `MARK_FEATURE` is typed as drill hole, lift-and-plunge, stacking, facing, or cut-entry point; Figure 2.9 models `mark_feature` with `feature_type` and `location` to a point, while Figure 2.10 defines point coordinates X and Y (printed pp. 16–17; PDF pp. 20–21). It separately names geometric `POINT`, `LINE`, `ARC`, and `POLYLINE` concepts. Section 3.3 describes a prototype translator from the EXPRESS/STEP model to ANSI/AAMA-292 DXF and says AAMA-292 used 14 information layers (printed pp. 18–19; PDF pp. 22–23). Two military-garment samples were used; the report says piece geometry was captured but grading was not demonstrated because both were single-size (PDF pp. 23–24). | This is **historical government research, not a current normative DXF profile**. The model separates mark type from point location, but specifies no mark size/radius and has no button or buttonhole mark type. Figure 2.9 does not provide a DXF entity/layer mapping. Section 3.3 reports a prototype translation but the published description does not give an auditable per-mark map into exact AAMA-292 records or say how CLO handles marks. NISTIR 5969 describes the historical ANSI/AAMA-292 basis as AutoCAD Version 11 DXF (printed p. 2); this is not the Version 13 DXF requirement stated by ASTM D6673-10. Conceptual equivalence (e.g. “drill hole” and a buttonhole) does not establish a receiver mapping. |
| NIST, [NISTIR 5823](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5823.pdf) (historical survey), pp. 13–15 and Appendix standards list | Records ANSI/AAMA-292-1993 as a historical apparel pattern-data interchange standard and identifies it as DXF-based (indexed lines 289–298, 332–341, 820–830). | It is a historical survey and cannot establish present status, current rights holder, compatibility, conformance, or current layer details. |
| Autodesk, [DXF HEADER Section Group Codes](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm) | Defines `$ACADVER` AC1009 as R11/R12 and AC1012 as R13; S628's pinned output records AC1009. | This identifies the drawing database version code only; it does not establish apparel-profile conformance or mark semantics. It is a supplemental primary reference used only to interpret the already-recorded S628 header. |

## S629-specific consequence

S629 tested source-authored `MARK_*` content in one Woven size-M fixture using
the permitted CLO 2026.1.310 DXF-AAMA path. At the unchanged `0.001 cm`
threshold, 13 separate line target geometries match, while 8 button circles
become 12-vertex approximations with excessive chord sagitta and 8 source
buttonhole points do not appear as distinct point markers. The new public
sources do not specify a layer/primitive change that would remove those
failures. In particular, the NIST mark-feature model identifies semantic
categories, but it is not an authority to silently map source points to an
assumed DXF-AAMA drill-hole layer. Rewriting the input to try such a guessed
layer would be another blind trial.

## S630 disposition and next evidence dependency

- No additional CLO operation is justified by these sources. Do not rerun a
  different label/entity/layer permutation without a rights-accessible
  normative table, receiver-specific technical documentation, or other
  source-backed encoding rule.
- This finding does not clear V03 and does not weaken acceptance. All-seven
  coverage, exact geometry, semantic mark/grade/identity, units, negative
  input, repeatability, rendering, rights/profile and representative round-trip
  gates stay in force.
- The next strategic work is to locate an accessible, current receiver's own
  technical specification/conformance guide or a legitimately readable
  normative profile text that gives an exact mark and curve mapping. The ASTM
  record says D6673-10 has no replacement; NISTIR 5969 alone is insufficient.
  Once such a source is available, use it to formulate one falsifiable
  fixture/profile trial and run it only after its input/output mapping and
  rights basis are pinned. Until then, describe the CLO result exactly as a
  measured failure in that tested mode, not a universal industry failure.

## Research access and confidence

All normative/status claims above rely on CLO Help Center, ASTM's official
product/catalog records, and NIST's official publication host. The NISTIR
figures cited above were rendered and visually inspected from the official
PDF. NISTIR 5969 is freely readable but predates the tested CLO build by
decades. ASTM's public record provides scope/status, not the full D6673-10
document. Autodesk's DXF header reference was consulted only to interpret
the S628 `$ACADVER` value. This audit makes no present-day legal opinion or
industrial conformance claim.

Independent Claude Opus 5.5 `xhigh` source review returned explicit
`WORK FINISHED`; the return is recorded in `claude-review-return.md`. It
independently agrees that none of the named sources supplies an authorized,
specific encoding for the S629 circle/point failures. It additionally
highlights the distinction between NISTIR 5969's Version 11 AAMA basis,
ASTM D6673-10's Version 13 scope, and the tested AC1009/R11-R12 output.
Codex checked this against the visible NIST diagrams, the S628 header record,
and Autodesk's DXF header reference. The clean detached review worktree
contained no accepted changes.
