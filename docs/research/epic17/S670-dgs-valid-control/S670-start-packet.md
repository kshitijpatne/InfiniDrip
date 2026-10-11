# EPIC-17 / G04 V03 — DGS native-control validity — Slice 670 start

## Verified start boundary

- Start: 2026-10-10 10:18:18 UTC. Branch `codex/epic-17-g04`, clean at `fc21c528` after S669. `origin/main` refreshed at `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. S669 is the highest assigned slice; S670 is the next unique number. Control Center board revision is 3956; EPIC-17 and G04-V03 remain In Progress, V01/V02 Done.
- Canonical admission: `docs/planning/EPIC-17-ADMISSION.md`. Current gate matrix and ranked completion plan: `docs/research/epic17/S669-dgs-native-profile-control/V03-GATE-RECONCILIATION-S669.md` and `V03-COMPLETION-PLAN-S669.md`.
- The user-approved `idr-pattern-exchange/2` grainline convention is settled. No design approval is pending. Rights for bounded local CLO/GetonAgain evaluation and C:-only handling are already recorded in `docs/PROJECT-DECISIONS.md`.
- DGS is installed `VID:20250610`. The exact version-matched official 487-page V2024.1 manual and hash, plus documented ASTM/AAMA export/import behavior, are recorded in `docs/research/epic17/S651-getonagain-install-contract/S651-package-and-manual-findings.md`. S669 found no usable local sample and its invalid native control emitted metadata TEXT only; see `docs/research/epic17/S669-dgs-native-profile-control/S669-exit-packet.md`.

## Scope and one decisive check

Search the already-held first-party manual only for native pattern naming, piece/border assignment, and grainline placement/validation steps that can resolve S669's exact DGS message: `[1]Pattern name,Size:M,grainline is outside the border, please check again.` Use the actual DGS UI and a fresh 10×10 cm native rectangle under `C:\G04-CLO-DXF-Exchange\S670-dgs-valid-control\`; do not use or modify any product DXF or production pattern geometry.

If first-party documentation or a directly observed UI workflow supports the fields, save one native control with an explicit nonempty piece name and a visible grainline wholly inside the cut outline. Require DGS's own validator to be clean before export. Only then export one ASTM DXF, parse it independently, and import that exact file once into a fresh DGS document. Capture actual validator state, byte hashes, parsed entity/unit/layer/identity/geometry inventory, and the output render. Do not change DXF encoding, mode, settings, product profile or approved `/2` metadata.

**Decisive pass for the control only:** zero native-validation warnings, nonzero pattern geometry in the exported DXF, and one fresh import registering the same 10×10 cm pattern with a readable render. **Stop:** if manual/UI does not expose the exact correction, validation still warns, geometry is absent, import is 0/0, or the shape/readability differs; retire DGS and move directly to the pre-existing CLO candidate reconciliation. No second DGS permutation.

This native control can validate only that DGS emits/reads its own geometry. It does not pass any product V03 gate or claim ASTM/AAMA conformance. CLO has prior measured Polo failures; no route becomes eligible by default. Preserve all seven recipes, 73 supported options, all required grades, `0.001 cm`, piece/revision/sidecar identity, CUT/SEW, marks/grainline, malformed-input rejection, repeatability, rendered readability, rights, legacy DXF behavior, protected export byte identities, full integrated coverage/build/browser/output gates, final review, PR, safe merge, ancestry, and required deployment. No physical fit, factory acceptance, or production-readiness claim.

## Delegation and verification

No disjoint safe implementation exists: the single manual lookup and native GUI validity/export test are serial and stateful; Codex owns the UI and evidence capture. No other agent will edit this working tree. The high-reasoning check is limited to the exact native-control fields and existing manual facts, not another standards/construction survey. No OpenCode call is necessary.

Focused verification: `npm run control-center:test`, parser/script syntax if added, independent control DXF parse, `git diff --check`, and actual clean validator + import render. Changed production-code coverage is not applicable unless product source is touched (not in scope). Do not rerun full repo coverage/build now. Preserve failure logs/screenshots on any miss.

At exit, record implementation, focused verification/diagnosis, external-agent waits, and maintainer-decision time separately. Only then choose the next source-backed V03 candidate action and update packet, state, context, and canonical board through validated commands. S669's older slice counts/dates are stale; estimate the remaining candidate work from this single result and exact gates, not from prior forecasts.
