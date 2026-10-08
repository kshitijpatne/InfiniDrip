# EPIC-17 / G04 V03 — apparel DXF profile evidence reconciliation — Slice 533 exit

## Finding

The official ASTM record says ASTM D6673-10, the sewn-product pattern data
interchange practice, was **withdrawn in 2019 with no replacement**. The
official ASTM D6673-04 record describes the standard as a 2D flat-pattern CAD
exchange with associated grade-rule-table exchange, but explicitly says it
does not represent relationships between pieces or correspondence between 2D
and 3D sewn geometry. The standard's complete normative text is not available
publicly on the ASTM product page, so this review does not claim conformance
to its detailed requirements.

NIST's *Data Sharing Implementation Based on the Information Model for Apparel
Pattern Making* describes ANSI/AAMA-292 as published in 1993, built on
AutoCAD Release 11 DXF, and a near-term/interim solution. It contrasts the
historical DXF convention with a broader STEP-based apparel information model.
This historical report does not establish the present status or current
normative text of ANSI/AAMA-292A. CLO's current help documents selectable
DXF-AAMA/DXF-ASTM import and export, size/grading controls, and general
compatibility claims, but gives no exact standards edition, normative clause
mapping, or conformance certificate.

S532 selected CLO's DXF-AAMA mode and observed header `AC1009`, which Autodesk
documents as AutoCAD R11/R12. That is consistent with inspecting the historical
AAMA lineage, but is not proof of AAMA-292A conformance and says nothing by
itself about the separate ASTM export mode. In the exact S532 output, outer
CUT geometry appears three times on numeric layers `1`, `14`, and `8`, while
the inset SEW contour also occupies layer `8`. S525 already found layer-8 CUT /
SEW mixing across all seven representative recipe exports. These observations
show unresolved semantic mapping in tested outputs; without the accessible
normative edition and a qualified receiver, they do not identify the exact
standard clause violated. The applicable AAMA layer descriptions found in
vendor support material are supplementary evidence only, not a substitute for
the normative standard.

## V03 evidence map

| Gate | Status | Evidence and limit |
|---|---|---|
| Named documented industrial profile | **Not established** | CLO exposes AAMA/ASTM options. ASTM D6673-10 is withdrawn without replacement; AAMA-292 is documented historically as an interim profile, but its current edition/status and full normative rules are not established here. |
| Exact receiver/version and applicable rights | **Held** | CLO 2026.1.310 is observed, but S526's current Trial License terms exclude commercial/for-profit purpose; project authorization to operate locally does not itself clear that license gate. No alternate receiver has passed the same rights/build review. |
| Local-only data handling | **Unverified** | S526 found CLO's terms permit remote authentication/connectivity and do not guarantee local-only processing. S531–S533 used synthetic data only; no product-pattern transfer or telemetry claim. |
| Positive geometry round trip | **Narrow pass only** | S532's simple synthetic CUT/SEW contours remained within 0.000004 cm across two exports; not representative apparel coverage. S523/S525 contain earlier recipe-specific matrices, with unresolved semantic findings. |
| Semantic layer/mark preservation | **Not passed** | S532 duplicates CUT geometry and mixes CUT/SEW on layer 8; S525 found this mix across all seven recipes, 78 source marks without exact direct-geometry matches, and five Polo CUT misses. Unmatched direct geometry is not automatically data loss, but complete semantic mapping is unproven. |
| Malformed-input handling | **Failed for tested case** | S531's malformed synthetic AAMA input was silently accepted while the inset SEW contour disappeared. This is bounded to the tested build, profile and settings. |
| All-seven representative fixtures, grade and full round-trip | **Not cleared** | Prior matrices contribute evidence, but no single rights-qualified receiver/profile has passed all required representative round-trip and semantic checks. |

## Decision and next action

No acceptance criterion changes. V03 remains In Progress, with EPIC-17 open;
V01/V02 remain Done. The evidence does not support an exact compatibility or
production-readiness claim. Repeating CLO's same synthetic fixture cannot
resolve the missing normative profile/status, applicable rights, local-only
handling, or seven-recipe semantic evidence.

The smallest remaining external prerequisite is a receiver/profile route whose
exact edition/build, use rights, and local-data boundary are documented. The
current CLO trial is not such a route under S526's evidence. If the maintainer
can provide written authorization that specifically covers product-development
testing in the exact CLO license, plus an acceptable data-handling basis, then
resume profile-conformance work against the accessible applicable specification
and representative fixtures. Otherwise keep CLO open but do not use it for
further G04 pattern tests; select a no-cost receiver only after its rights,
build-specific AAMA/ASTM capability, and local handling are proven. Do not
buy software, contact suppliers, or weaken the admitted gates in this slice.

## Sources

- ASTM, [D6673-10 (withdrawn 2019, no replacement)](https://store.astm.org/d6673-10.html).
- ASTM, [D6673-04 scope and stated limitations](https://store.astm.org/d6673-04.html).
- NIST, [NISTIR 5969, *Data Sharing Implementation Based on the Information Model for Apparel Pattern Making*](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf), especially pp. 5 and 22–24; historical context, not a current standard.
- CLO, [2D Pattern (DXF) Import/Export help](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated September 28, 2026.
- Autodesk, [DXF `$ACADVER` identifiers](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm), identifying AC1009 as R11/R12 and AC1012 as R13.
- Romans CAD, [AAMA layer convention](https://support.romans-cad.com/support/solutions/articles/12000047368-aama-layer-convention), used only as vendor guidance, not normative evidence.

## Verified closeout

Started `2026-10-08 20:54:16 UTC` from S532 commit
`21c5eb7085a972bc69ba5fb6cf6d8bbfb4cb8867` on `codex/epic-17-g04`;
refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an
ancestor. S533 is unique. Board start revision was 3243; the start replay is
`3243→3244→3245`; validated exit replay is `3245→3246→3247` on G04-V03.
Control Center tests passed 42/42; canonical board validation passed at
revision 3247; `git diff --check` passed. No code or tests changed;
changed-code coverage and the full repository gate do not apply.

Elapsed `20:54:16–20:57:16 UTC` (3m): source review/reconciliation 2m;
focused validation and durable closeout 1m; external-agent wait 0m;
maintainer-decision time 0m. No safe disjoint delegation existed for this
single evidence reconciliation.
