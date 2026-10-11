# EPIC-17 / G04 — S724: complete option/grade matrix on the measured LibreCAD route

## Verified start and reservation

- Start: 2026-10-11 05:16 UTC.
- Branch: `codex/epic-17-g04`; starting HEAD `b10f308e0c6c4d9a08c0040232f109dc9eff1c66` (`Slice 723`).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of HEAD.
- Highest slice in refreshed history is 723; S724 is the next unique slice.
- Canonical board revision 4226. EPIC-17 and G04-V03 are In Progress; V01/V02 are Done. Goal is active and still needed.
- Working tree contained only the two pre-existing untracked S700 coverage diagnostics before this packet.
- Maintainer vetoed any paid candidate/additional CAD software and directed completion using installed tools. S722 already updated V03 from an “industrial receiver” category to one exact empirical app/version/profile. No standard or factory claim is allowed. All numerical and semantic fidelity gates remain fixed.

## Objective

Use the exact LibreCAD 2.2.1.5 / DXF 2000 route that passed S723 representative round trips to test all 73 current canonical option/grade configurations. Reuse the existing S330 option matrix, S680 source package generator and package manifests, S710 source-bound round-trip audit, and the existing C:-only evidence convention. Prove one semantic repeat exchange on the same chosen profile. Keep exact source revisions, option values, files, machine reports and rendered evidence traceable.

## Fixed acceptance gates

- All seven registered recipes and all 73 supported option/grade rows.
- Maximum geometry difference 0.001 cm; no missing or additional contour/mark.
- Centimeter units; source-bound revision, recipe/grade/options, piece identity, stitch relations, CUT/SEW, marks and grainlines.
- One repeat exchange with semantic equality.
- Actual receiver output opens and is readable for each recipe and representative extremes; no held/crossing source output may be described as readable just because the machine audit passes.
- Product-side malformed/unsupported input remains fail-closed through the actual auditor/UI, separately from receiver behavior.
- Preserve legacy DXF and all protected export byte identities; final global 100% coverage, build, browser/Electron and final output review remain at the settled Epic/PR boundary.
- No new CAD installation, purchase, vendor contact, settings/format/entity variation, geometry change, criteria relaxation, ANSI/AAMA/ASTM conformance claim, physical fit or factory claim.

## Existing evidence and scoped use

S723's seven current-source M-size LibreCAD 2.2.1.5/DXF 2000 outputs all passed the existing auditor with 0.000 cm geometry difference and retained units, identity, CUT/SEW and marks. Each saved return reopened and rendered in the already running LibreCAD session. See `S723-exit-packet.md` and the machine report at `C:\G04-CAD-Interchange\S723-librecad-seven-recipe-roundtrip\S723-return-audit.json`.

Reuse `docs/research/epic17/S680-dxf-option-package-coverage/generate-option-packages.ts` against `docs/research/epic17/S330-integrated-browser/matrix.json` (assert exactly 73 rows; expected recipe distribution 1 Tee, 1 Fitted, 1 Tank, 17 Polo, 28 Woven, 1 Skirt, 24 Trouser). Generate all raw source packages, intermediate returns, reports and rendered output only beneath `C:\G04-CAD-Interchange\S724-librecad-option-grade-matrix\`. Do not add generated CAD, test screenshots, scripts or machine-specific paths to the repository.

S723's external audit wrapper produced valid passing results but printed a non-fatal Vite file-URL pre-transform warning. Before trusting matrix output, first invoke the same tracked generator/auditor with a repository-supported runner and ordinary absolute/relative module imports; capture stdout/stderr and confirm its exit status and deterministic source row count. This is harness cleanup, not a reason to change product code or CAD settings.

## Decisive checks and stop conditions

1. Reconcile the source matrix hashes and 73 package manifests to exact S330 recipe/options, S680 package verification and source revision IDs. Any missing/mismatched row means stop before receiver processing and diagnose the generator/matrix join.
2. Process every package through the one S723-measured profile. Prefer a batch path only if it is a documented operation of the *same installed LibreCAD 2.2.1.5 binary* and the exact DXF 2000 writer; preserve the GUI route as the measured representative. Record the precise invocation. Do not silently call a second engine a LibreCAD pass.
3. Run the unchanged S710 auditor for every source/return pair. Stop on first failed row; retain exact input/return and diagnose that row against source evidence. No aggregate pass may hide a failure and no threshold changes.
4. Perform one source → return → second return semantic comparison, with the same receiver/version/output profile. Require equal normalized geometry, layers, identities, units, marks and relations.
5. Reopen in the same receiver and manually inspect each recipe plus option extremes using actual saved return output. Machine-only vector render is supplementary and cannot substitute for receiver evidence.

Do not proceed to a full matrix if the same LibreCAD candidate exposes a repeatable incompatibility in one of the fixed gates. Record precise scope of the empirical profile and the concrete product decision that evidence leaves, then continue independent G04 work without calling the V03 gate passed. Do not mark the goal blocked or alter status autonomously.

## Exit records and gates

At closeout, record 73-row pass/fail/unproven results, exact receiver route, revision/input/output hashes, audit and repeat comparison, rendered inspection, any harness diagnostic, and separate implementation / focused verification / external wait / maintainer decision time. Update PROJECT-STATE, CONTEXT-INDEX and the canonical board via the validated command layer. One commit only: `Slice 724: verify LibreCAD option-grade matrix`. No production code is expected; if a genuine production defect is found, do not mix a source fix into this evidence slice; reserve a new uniquely numbered slice with focused tests and 100% changed-code coverage.

Full repository coverage, final integrated build/browser/Electron review, necessary-file cleanup after inventory, PR, safe merge, refreshed origin ancestry, required automatic deployment and production end-to-end check remain explicit final completion gates.

## Maintainer-directed correction recorded at closeout

The original objective above incorrectly called S330's 73 rows “option/grade
configurations” and required one receiver Save As for every row. The actual
matrix contains 73 option scenarios, all generated at size M. Therefore S724
does **not** claim receiver coverage of 73 grades or all grade-option pairs,
and did not perform 73 repetitive LibreCAD saves. The product's grade support is
a separate source-package gate. The maintainer has since explicitly directed
Codex to refine V03 around what the implementation must guarantee and what an
empirical generic-CAD receiver can actually demonstrate; this correction does
not change the 0.001 cm threshold, supported recipe/options/grades, protected
legacy bytes, or truthful-output requirement.

The actual receiver sample is ten saved-and-reopened M fixtures: seven default
recipes plus Polo `sideVentDepth-min`, Woven `combined-supported`, and Woven
`sideVentDepth-min`. Nine observed layer/entity-count signatures describe
counts only; they are not proof of nine distinct geometries or that all option
behavior is receiver-tested. Keep the empirical compatibility claim limited to
these exact fixtures until the source option/grade matrix and the selected
representative set are recorded separately. Do not copy the old 73-save plan
forward.
