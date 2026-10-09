# EPIC-17 / G04 V03 — Free/local apparel CAD receiver research — Slice 611 exit

## Findings

- Closed 2026-10-09 11:43:29 UTC on `codex/epic-17-g04` from S610 commit
  `538d926a7a65a926fce664857ad2cb6c0caa0618`. At start,
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor;
  tree was clean; board revision was 3574. S611 start replay moved 3574→3576;
  exit replay moves 3576→3578. G04-V02 remains Done and G04-V03/EPIC-17 remain
  In Progress.
- No free/local alternative has been evidenced to satisfy apparel-profile
  import **and** export/round-trip, local handling, and access at once:
  - **Seamly2D:** the current upstream README identifies GPLv3+ open-source
    patternmaking software for Windows/macOS/Linux. Its README does not
    document an apparel-DXF receiver route. A historical open project issue
    requests replacing DXF-AAMA export with DXF-ASTM; this is not evidence of
    current ASTM export or DXF import/round-trip. Do not install/qualify it as
    the G04 receiver based on its free/local status alone. It may suit separate
    pattern-authoring research.
  - **OpenPatterns:** prior S480 fixture assessment failed all three generic
    input fixtures on its block-table assumption and found no DXF writer.
    This is not a receiver candidate for the current fixtures.
  - **Richpeace Super V8:** prior S485 manufacturer-source review verified
    advertised DXF/PLT import and PLT save but no DXF export or AAMA/ASTM
    round-trip; its cloud conversion path and local processing were
    undocumented. Remains unqualified.
  - **garment.dev:** its current site claims AAMA/ASTM DXF import/export checked
    against 34 production files, but access is by invitation and the service
    uses an account and encrypted, backed-up shared library. It is browser-
    based/hosted, outside admitted scope, and local-only handling was not
    verified. Do not request an invite, sign in, or upload patterns under this
    goal.
- Therefore no new receiver is selected or qualified. This review changes no
  acceptance, scope, or status and authorizes no install, upload, account, or
  vendor contact.

## Evidence sources

- Seamly2D upstream, [repository and current README](https://github.com/fashionfreedom/seamly2d): open-source licensing/platform and stated current project scope.
- Seamly2D upstream, [issue #59](https://github.com/FashionFreedom/Seamly2D/issues/59): historical request titled “Replace current DXF-AAMA exports with DXF-ASTM”; it does not prove current format support or import.
- garment.dev, [product site](https://garment.dev/): its own AAMA/ASTM, 34-file, invitation, account and backed-up-library claims; not independently verified and not approved for file transfer.
- Existing candidate evidence: `docs/research/epic17/S480-open-patterns-parser-assessment/`, `S481-v03-candidate-access-reconciliation/`, and `S485-super-v8-format-source/`.
- CLO's official format selector confirms Standard DXF/AAMA/ASTM are selectable on import:
  [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export). This supports one controlled CLO-mode diagnostic; it does not promise that Standard import preserves apparel semantics.

## Gate disposition and next action

No V03 gate clears. All-seven recipes, source-bound CUT/SEW geometry,
stable identity, semantic layers/marks, grades/options, malformed-input
handling, repeated exchange, rendered detail, and a qualified receiver/profile
remain required. The user's CLO product-development/local-processing
confirmation remains specific to the tested CLO work and is not extended to
another service. No hosted service, physical fit, factory acceptance, or
production-readiness claim is made.

Next, use the already authorized/open CLO app for one tightly controlled
diagnostic: import the exact S609 hash-pinned AAMA/R12 source once in
**Standard DXF** mode, holding units, scale, rotation, notches and every other
setting constant; export to ASTM with the S609 settings; compare to the same
0.001 cm source gate. This is source-backed because official CLO help exposes
the format selector and S609/S536 show repeatable vertex loss under AAMA
import. It isolates only the import-mode choice and may quickly show whether
the AAMA parser is implicated. If it fails or loses garment semantics, retain
the hold and do not chase further UI toggles without new evidence. Keep CLO
open during G04 work.

## Verification and time accounting

- S611 start preflight and validated board replay passed at 3574→3576. Final
  command-layer preflight, exit replay, focused Control Center tests,
  documentation-source URL review, and `git diff --check` are recorded at
  close. No production code changed; changed-code coverage is not applicable.
- No independent delegation was safe for this short, source-bound candidate
  triage. No new application was installed and no file was uploaded.
- Elapsed time (11:41:00–11:43:29 UTC): source reconciliation approximately
  1 minute; durable closeout/focused checks approximately 1 minute; external-
  agent waits 0; maintainer-decision time 0.
