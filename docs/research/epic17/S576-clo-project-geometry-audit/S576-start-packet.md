# EPIC-17 / G04 V03 — CLO saved-project geometry audit — Slice 576 start

- Started: 2026-10-09 04:45:56 UTC.
- Branch: `codex/epic-17-g04`.
- Start commit: `4177940a` (S575); worktree clean.
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor.
- Start board revision: 3417; EPIC-17 and G04-V03 are In Progress.
- Highest assigned slice: 575; this reserves unique S576.
- Usage check: ordinary work allowed; primary 1%, weekly 68% used.

## Question and bounded scope

S575 established that the exact S574 generation-one DXF contains no source
CUT path within the 0.001 cm gate across the entity paths, but cannot assign
the loss to CLO import or export. S574 already saved the CLO project after
importing the hash-pinned source-derived DXF and another project after
re-importing generation one. This slice examines only those existing local
`.zprj` artifacts and their transparent container structure to determine
whether they preserve per-piece geometry that can settle stage attribution at
the required precision.

Do not reopen, modify, save, import, export, or close CLO. Do not reverse
engineer proprietary/encrypted internals or use untrusted scripts/macros. Use
only transparent standard container/document content; if the project is opaque,
record that limit and stop. Do not send files to any service. Inputs are
read-only from `C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Evidence`;
write only an inspection report under
`C:\G04-CLO-DXF-Exchange\S576-clo-project-geometry-audit\Evidence`.

## Acceptance criteria

- Hash the exact post-import and post-gen1-reimport project files before
  inspection and confirm they match S574's recorded identities.
- Determine project container/file types and inventory any transparently
  accessible geometry records without changing either artifact.
- If a supported readable representation exposes source-piece coordinates,
  map source CUT and SEW paths by piece and evaluate geometry against 0.001 cm.
  State precisely whether the input-stage project retained CUT geometry and
  whether the re-imported output project retained it.
- If it does not expose usable coordinates, classify stage attribution as
  unresolved and explain why. Do not infer geometry from screenshots, rounded
  UI measurements, or filenames.
- Keep all V03/V02 acceptance gates and holds, exact compatibility claim,
  protected export identities, and legacy DXF behavior unchanged.

## Verification and ownership

No production code or tests are in scope. Use a small read-only inspection
helper if needed; syntax-check it, verify report hashes and deterministic
output, run `git diff --check`, and run the focused Control Center suite after
board updates. Full repository coverage/build is not due. No safe independent
delegation exists for this single forensic comparison; Codex owns the review.

The start evidence/comment are applied through the validated command layer at
board revisions 3417→3419, without changing statuses. At exit record separate
implementation/inspection time, focused verification, agent waits, and
maintainer-decision time. Name exactly one next evidence-led action.
