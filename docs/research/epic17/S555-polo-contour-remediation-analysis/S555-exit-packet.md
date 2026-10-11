# EPIC-17 / G04 V03 — Polo contour remediation analysis — Slice 555 exit

## Verified boundary

- Started 2026-10-08 23:39:24 UTC from `501c613` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Start board revision 3333; validated start replay 3333→3335. G04-V03 remains In Progress.
- CLO 2026.1.310 remains open. The maintainer's written authorization for product-development DXF evaluation and local processing is recorded and resolved. No repeat permission check was needed.
- Slice 555 is unique after S554.

## Result

The actual InfiniDrip emitter in `src/export/dxf.ts` writes a minimal R12 DXF with closed `POLYLINE` contours and one `VERTEX` per path point. Coordinates round to 0.001 cm. S552's five affected Polo incoming edges are 0.04562–0.04696 cm, roughly 46 coordinate-rounding increments; their missing corners deviate 0.012736–0.013970 cm from the replacement chords, above the unchanged 0.001 cm gate.

S536 already converted the same geometry to R2000 `LWPOLYLINE` with a units declaration, and CLO still dropped the same five vertices. The cm/mm comparisons, Standard/AAMA comparison, optimizer/Draw Curve Points settings and S518 native-project parser attempt are also settled. S518 cannot tell whether CLO drops the point during import or export.

Codex independently checked Autodesk's official DXF references. The available POLYLINE/VERTEX fit flags mark curve/spline-fit data; they do not mean “preserve this garment corner.” LWPOLYLINE's vertex coordinates, identifier, bulge and closed flags define path data; the entity change already failed in S536. Extra precision has no published connection to CLO's observed behavior and would change the byte output. Companion POINT entities would not reconnect a missing contour vertex. Replacing the closed contour with separate LINE entities would change its representation and apparel-profile reconstruction is unproven.

Claude Opus 5.5 independently returned `WORK FINISHED` and recommended **no new trial**. It could not fetch the CLO or Autodesk primary pages in its session and did not inspect C: analysis JSON; Codex verified the Autodesk source definitions directly and checked S536/S552 evidence. The first Claude run reached its turn ceiling without a result and was not treated as completed work; the second bounded print-mode run supplied the completed independent review. See `codex-analysis.md` for the evidence ledger and exact limitations.

## Gate disposition

- **No candidate repair:** there is no primary-source-backed, materially different DXF representation change that is shown to preserve the exact closed cut path and plausibly avoid the observed CLO loss. No CLO trial, production-code change, or pattern change is justified in this slice.
- **Still failed:** the five Polo CUT outlines remain above 0.001 cm on the tested CLO route.
- **Still unresolved/held:** CLO import-versus-export stage, exact industrial profile edition/conformance, CUT/SEW and mark semantics, grades/options, malformed-input rejection, independent receiver acceptance, and the all-seven two-generation round trip.
- **Unchanged:** V03 acceptance, seven-recipe requirement, all tolerances, legacy DXF behavior, protected export identities, source/cut geometry, and claim limits. No physical, factory, or production-readiness claim.

## Next action

Do not repeat a CLO scenario on these same Polo contours without newly published CLO vertex-preservation behavior or a measurable pre-export checkpoint. Continue with the consolidated V03 evidence matrix and source-backed receiver/access conditions; if no qualifying receiver or mechanism exists under the current no-contact/no-spend/no-hosted constraints, preserve the hold and bring the concrete scope/access decision to the product owner without weakening any gate.

## Verification and time

- External review: Claude Opus 5.5, read-only, isolated worktree based on `501c613`; final explicit `WORK FINISHED` received. Its worktree remains unchanged. OpenCode was not used; its required Muse Spark configuration was unavailable earlier.
- `node --check` for S555 board preflight/replay, board preflight, Control Center tests and `git diff --check` are recorded in the closeout. No production code changed, so no changed-code coverage or full repository gate applies.
- Elapsed 23:39:24–23:46:35 UTC: source/fixture analysis about 3m30s; independent review/tool wait about 2m; durable records and focused checks about 1m40s; maintainer-decision time 0m; production implementation 0m.

**Single next action:** reconcile each still-open V03 criterion with the existing seven-recipe evidence and identify only a genuinely untested gate that the currently authorized CLO route can resolve; do not re-run known failure scenarios.
