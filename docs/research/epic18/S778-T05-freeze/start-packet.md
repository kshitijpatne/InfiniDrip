# Slice 778 start — T05 immutable local-share freeze

**Status:** Started 2026-10-13 16:27:34 UTC. **Owner:** Codex.
**Branch/worktree:** `codex/epic-18-g05` at
`C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp`.

## Verified checkpoint and authority

- Start from clean S777 commit
  `4178b4fcde0836451ddf8693427749d7ce0c4360` on `codex/epic-18-g05`.
  Refreshed `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an
  ancestor.
- Highest numbered slice on `origin/main` is 761; active branch's latest
  assigned slice is 777. Slice 778 is unique and reserved.
- Canonical Control Center board is at revision 4645. EPIC-18 is In Progress;
  G05-T01 through T04 and UIQ-10 are Done; G05-T05 and G05-EXIT are Backlog.
  S777's verified exit evidence is attached to UIQ-10, G05-T04, and EPIC-18.
- No worktree changes were present at start. The overall EPIC-18/G05 goal
  remains active.
- Scope authority is the original admitted
  `docs/planning/EPIC-18-ADMISSION.md`, active ordered boundaries in
  `docs/planning/EPIC-18-S765-RESEQUENCING.md`, the T05 board card, and the
  accepted C04 lifecycle and digest contract in
  `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md` (Slices
  224–226). S777's completed T04/import and rendered-output evidence is in
  `docs/research/epic18/S777-T04-review/`.
- The checkpoint agrees across `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
  `ARCHITECTURE.md`, `docs/PROJECT-DECISIONS.md`, the G05 goal ledger, the
  active S765 addendum, and the canonical board. The addendum is authoritative
  for the S778–S781 sequence; the older numbered rows in the hash-bound
  admission remain historical.
- Usage at start: primary window 7% used, weekly window 17% used; ordinary
  usage is allowed.

## Intended outcome and exact boundary

Implement the first half of T05: explicitly freeze an approved, exact saved
Tech Pack revision as a local digital-share artifact set, with a canonical
manifest and deterministic digests that verify against the actual frozen
files. Use the C04 lifecycle and dual-digest meanings. The local reviewer must
take an explicit action and choose a non-empty field scope; do not infer
approval from a passed check, prior authorship, or imported approval. Bind the
approval reference, selected output artifacts, exact revision ID and revision
content digest together in the frozen manifest. Record actor and time as local
self-attestation only; no authenticated-identity or approver-authority claim.

The frozen `.techpack.zip` and standalone PDF must be generated from the same
current saved revision, stored as the original bytes in the existing
local-only immutable capture path where compatible, independently digest
verified on read/export, and exposed for explicit download. Fail closed if the
revision head or its content digest changes during preparation. The manifest's
canonical packet digest covers its exact approved artifact set and excludes
volatile capture metadata as required by C04. Existing T04 files remain
separate from the whole-project backup and legacy Tech Pack exports.

S778 closes only freeze creation and deterministic manifest/digest behavior.
S779 remains responsible for edit-driven invalidation, visibly stale dependent
checks/approval/current-state, retention of prior frozen bytes, historical
import compatibility, and all eight protected legacy export identities.
S780 owns the settled integrated global gate.

## Acceptance and required gates

1. Focused tests cover explicit approval/freeze eligibility, non-empty scope,
   exact saved revision and head/digest binding, stale/racing heads, selected
   artifact-set binding, deterministic manifest and output digests, byte-level
   integrity rejection, immutable persistence, and supported local downloads.
   Every changed production module/range must reach 100% statement, branch,
   function, and line coverage without weakening existing assertions.
2. Run TypeScript checks and the focused protected export-identity regression;
   no baseline may move. Run Control Center tests after validated board replay
   and final `git diff --check`. Do not run the settled global gate early.
3. Generate actual, synthetic Tee and Woven Shirt frozen PDF/ZIP examples;
   parse manifests and archives, verify hashes and exact source revision,
   render and inspect the PDF, and compare repeat-generation digests/bytes.
   Retain reproducible evidence and label synthetic values accurately.
4. Render and inspect any changed freeze/review controls in Chromium at
   390×844 and 1280×800. Verify keyboard operation, exact revision/scope/
   artifact-set visibility, actionable stale-state guidance, and no horizontal
   page overflow.
5. S778 does not close G05-T05. If a gate fails, retain the failure and use a
   separate next-number remediation slice; do not change acceptance thresholds
   or protected hashes.

## Non-goals, risks, decisions, and delegation

- Preserve every prior frozen byte and the existing draft Tech Pack contract.
  S779 owns the broader invalidation, historical-import, and eight-hash gate;
  S780 owns all-recipe integrated/global/browser/Electron/release checks.
- No network, login, account identity, database, paid service, supplier
  contact, outbound handoff, new garment, physical sewing/fit, factory
  acceptance, production approval, or production-readiness claim.
- C04 already defines the state lifecycle, scope-specific approval invalidation,
  immutable prior packets, audience/purpose, RFC 8785 canonicalization, SHA-256
  revision and packet digest semantics, and local digital-share limit. No
  blocking maintainer decision is open for this boundary. Any UI must state
  that a typed local actor label is self-attested and does not prove identity
  or authority.
- A separate code contributor has no safe disjoint ownership: the approval
  decision, exact revision/head guard, artifact generation, manifest storage,
  and rendered freeze control are one coupled transaction. Codex retains the
  implementation, focused tests, integration, and output review; no external
  coding-agent wait is planned.

## Time accounting

Start: 2026-10-13 16:27:34 UTC. At exit, record implementation, focused
verification, rendered/output review, external-agent wait, and
maintainer-decision time separately. External-agent wait and
maintainer-decision wait start at zero.
