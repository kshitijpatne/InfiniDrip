# EPIC-17 / G04 V03 — Open CAD Studio desktop R14 receiver screen — Slice 624 start

## Verified start

- Started 2026-10-09 14:37:06 UTC from clean S623 commit `c4b1eac82cfcbe9ec49981d7f1d08cf2356b7caa` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S623 is the highest assigned slice; S624 is uniquely reserved. Canonical Control Center revision 3632 keeps G04-V02 Done and G04-V03 / EPIC-17 In Progress. The goal remains active and aligned; this is continuation, not re-admission.
- S623 showed that Open CAD Studio's browser build opens and renders only a synthetic R12 fixture and lists DXF R14 output, but the Save As dialog does not expose a destination folder. No product drawing was submitted and no output was generated. Do not repeat that browser workflow.
- Official release `v2026.40.1` lists a Windows x86-64 portable executable (113,595,808 bytes); the project's README documents headless `--export` with `--target-version R14`. Official project README says the project is GPL-3.0. Source references: https://github.com/HakanSeven12/OpenCADStudio/releases/tag/v2026.40.1, https://github.com/HakanSeven12/OpenCADStudio, https://github.com/HakanSeven12/OpenCADStudio/blob/main/docs/automation/API-SPEC.md.
- The user's written confirmation about product-development evaluation and local processing is specifically for CLO. Do not treat it as consent to send product files to a third-party browser service. This S624 candidate is the official desktop/CLI binary; inspect its published source and verified binary path before using product fixtures. Keep all files, including the portable binary, synthetic input/output, product fixtures if admitted by the local-handling checks, reports and screenshots, strictly under `C:\G04-CLO-DXF-Exchange\S624-opencadstudio-desktop-r14-receiver\`.

## Bounded question

Does the official Open CAD Studio Windows portable build expose a verifiable local headless R14 DXF read/write route, and does that route preserve the synthetic drawing's exact entities and named layers on reopen? If yes, test the same hash-pinned seven default-M recipes and Tee XS/M/XL fixtures from S623 against source geometry, output layers/entities, actual render and malformed-input controls. This is a general CAD R14 candidate screen only; even full geometry success would not by itself establish an apparel-specific industrial profile, garment layer semantics, grading rules, or full V03 acceptance.

## Ordered method and fail-closed gates

1. Download only the exact official Windows portable asset into the named S624 C: directory. Record URL, bytes, SHA-256, Authenticode signer/status, and release tag. Stop before execution if origin, hash/size, or signature cannot be verified against the official release.
2. Review the official source's documented headless `--export` code path for remote transmission behavior and confirm file arguments are ordinary local paths. Do not supply product fixtures until the receiver is running locally, its conversion is performed by the local binary, and exact C: input/output paths are demonstrated with a synthetic fixture.
3. Convert the synthetic R12 fixture to R14 with explicit input/output paths inside the named directory; reopen it with the same local binary. Record process exit codes, logs, output hash, DXF entity/layer inventory, and source/output geometry differences. If local file control, explicit R14 targeting, or reopen cannot be verified, stop this candidate before product fixtures.
4. Only after steps 1–3 pass, generate hash-pinned current-source generic DXF fixtures for the seven base-M recipes and Tee XS/M/XL under the same directory. Perform one explicit R14 conversion and reopen per fixture. Compare CUT/SEW contours and all named `MARK_*` entities at the unchanged `0.001 cm` tolerance without transform, snapping, or geometry editing; compare piece identity and layer inventory; inspect rendered output; and run a malformed-DXF rejection control. Record failures individually; do not omit or repair failed fixtures.
5. Make no industrial profile/exact-compatibility claim unless the exact profile, receiver rights, full required semantics, all seven recipes/options, negative-input behavior, repeated round trip and rendered results support it. If generic R14 geometry passes, keep any apparel-semantic/grade/marks/profile gate that is unproven explicitly open.

## Scope and non-goals

- Candidate-only local R14 exchange screen. No source/recipe/pattern/stitch/cut geometry/DXF writer/product code change, protected baseline change, acceptance relaxation, or face/view status change.
- Preserve V02 Done as recorded and all V03 gates; the candidate cannot bypass source identity, industrial profile, CUT/SEW/mark semantics, grades/options, seven-recipe scope, malformed-input, exact repeated round-trip, rendered readability, rights, or output evidence.
- No CLO action, browser upload, hosted storage, account, vendor contact, paid feature, physical sampling, supplier contact, fit/factory/production-readiness claim, G09/D04 or G05 expansion.
- No safe disjoint delegation: official-source and binary custody, local file execution, geometry comparison, and actual output review form one dependent evidence chain under Codex control.

## Exit evidence and verification

Record exact binary/source identity; input/output SHA-256; signer result; command line and exit code; stdout/stderr; native/opened entity and layer inventory; geometry residual table; malformed-input result; and reviewed actual receiver renders. All import/export evidence stays under the exact C: path. Update the V03 matrix, packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and canonical board through the validated command layer. Validate helpers with `node --check`, S624 start/exit preflights, `npm run control-center:test`, and `git diff --check`. No changed-production-code coverage or full repository gate applies to this research-only slice. Preserve the one full global-coverage/build/output gate for the settled integrated Epic/PR candidate.

## Single next action

Verify the signed official portable release and inspect the exact source path used by its local `--export` conversion before any product file is opened. If those checks pass, use only the synthetic R12 fixture to prove an explicit C:-path R14 write and reopen. If they fail, keep S623's browser preflight hold and close this candidate without sending product data.
