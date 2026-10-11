# EPIC-17 / G04 V03 — Grade-bearing DXF source/profile review — Slice 560 start

- Started: 2026-10-09 00:21:45 UTC.
- Start commit: S559 `c07d714`; branch `codex/epic-17-g04`.
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it is an ancestor of HEAD. The working tree was clean before this packet.
- Board start revision 3353; S559 is the highest assigned slice; reserve S560. V01/V02 Done; V03 In Progress.
- Usage at start: primary 10%, ordinary use available.

## Scope

Establish the shortest accurate route to test the grade/size-interchange gate
after S559 showed that CLO relabels a source XS file as M. Reconcile current
publisher documentation, the official profile/standard status and rights
availability, current source writer capabilities, and the already observed
CLO size-format choices. Decide whether a concrete source-backed
grade-bearing fixture can be prepared and imported/exported through a
documented, supportable route without inventing rules, buying a standard, or
repeating S559's one-size run.

## Starting facts

- CLO's current Help Center documents DXF-AAMA/DXF-ASTM/Standard import and
  export; one selected graded size group per exported file; grading included
  in DXF or separately as a Rule File; and an `Export without Grading` switch.
  It does not document the exact syntax/version of the grade-bearing data in
  that public page.
- ASTM's current catalog search result points to D6673-10 as **withdrawn in
  2019**. Its historical D6673-04 product page describes DXF pattern data plus
  a specially formatted ASCII grade-rule file and references AutoCAD V13 DXF.
  The full text is sold; do not retrieve or reproduce a third-party copy.
- Current source produces five separately named-size geometries per recipe,
  but the legacy DXF API accepts a single selected-size piece list and has no
  name, grade-point, or size-group argument. S559's actual CLO output labeled
  XS contours `0_M`/`1_M`/`2_M`.
- The user authorizes local CLO evaluation; all exchange files and screenshots
  remain under `C:\G04-CLO-DXF-Exchange\S560-grade-format-source-review`.

## Exit gates

1. Verify the official standard status and the exact claims current CLO sources
   support. Distinguish current CLO product format choices from active
   consensus-standard status and full normative conformance.
2. Trace the source-side grade tables and one-size writer contract already
   recorded in S559; identify exactly which named-size/point-grade facts are
   absent from DXF output and what a genuine input would require.
3. Use CLO only if an exact supported format and source-backed fixture exists.
   Do not generate or import a synthetic rule file with guessed syntax. Do not
   repeat S559's no-grade one-size trial. No paid purchase or upload.
4. Record whether the grade/size gate has a practical verifiable path, a
   concrete failure, or remains blocked on standards/profile evidence. Keep
   every G04 V03 criterion and hold unchanged; update the current evidence
   matrix, state and board through the validated command layer.

## Non-goals and holds

No standard purchase, third-party document copying, vendor/supplier contact,
cloud upload, app restart, fabricated grading, product-code behavior change,
geometry change, acceptance reduction, broad exporter rewrite, physical/fit/
factory claim, or repeated known contour/unit/CUT-SEW trial. No user decision is
currently expected; any later request must show a concrete source-backed
alternative and effect on the all-seven gate.

## Delegation

No safe disjoint task is available: the slice is a narrow source/rights/profile
reconciliation tied to the one documented CLO route and S559's actual output.
Codex owns it; external wait time is recorded as zero.
