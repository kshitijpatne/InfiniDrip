# S686 exit — reconcile V03 gates and stop candidate churn

## Result

S686 updates the S682 V03 matrix with S685's exact CLO return measurements,
the S674 LibreCAD R12 result, prior DGS/OpenCAD evidence, and the C04 sidecar
allowance. The full per-gate status, strongest evidence, shared causes, exact
remaining proofs, prioritized path, and stop conditions are in
`V03-GATE-MATRIX-S686.md`.

The approved source package is not the cause demonstrated by the latest CLO
round trip: the source writer and verifier emit and require centimeters, while
the saved CLO return changes the unit label and also differs on five cut
outlines and eight mark geometries. S674 LibreCAD preserved one Polo M's paths
and typed marks but its R12 return dropped the unit label and is generic CAD.
DGS and OpenCAD have their own measured failures. These findings reject the
tested routes; they do not establish a safe source change or prove every
possible receiver behaves the same.

No tested route currently meets the industrial exchange/profile entry gate
and the full fixed V03 criteria. No maintainer approval or design decision is
pending. S686 made no code or acceptance change, started no new application
trial, and does not pass V03. EPIC-17/G04-V03 stays In Progress; V01/V02 stay
Done. Keep all seven recipes, every supported option and grade, the `0.001 cm`
geometry gate, malformed-input and repeatability checks, output readability,
protected export identities, and final full-gate/merge/deployment criteria.

## Bounded Sol review and Codex disposition

The read-only Sol high-reasoning review returned `WORK FINISHED`. It found no
overlooked receiver pass and no evidence-backed source-code repair. It noted
that C04 permits an integrity-bound, version-matched sidecar for grade, piece
identity, and seam relationships. Codex verified this in C04 and S649 and
updated the matrix: the CLO returned-identity result is **unproven**, because
S685 did not test a returned sidecar. The sidecar does not replace drawing
units, geometry, or visible construction marks. The review is advisory and
does not pass any gate.

## Completion path

1. Do not run another receiver, format, or setting variation by default. First
   require a specific already available and rights-cleared route whose
   documented exchange profile can meet G04's industrial contract and C04's
   sidecar limits. A menu label alone is insufficient.
2. If that eligibility proof exists, reuse the current hash-pinned Polo M
   package for one representative exact-file pilot. Check units, all CUT/SEW
   paths at `0.001 cm`, every typed/visible mark, sidecar binding, and saved
   readable output. Stop at the first fixed-gate miss.
3. Only after that pilot passes, run the existing seven-recipe/73-option and
   grade matrices once, followed by malformed-input rejection and repeatable
   round trips. Then run the settled full repository gate, final output
   review, PR, safe merge, ancestry check, and required deployment.

At this boundary, no code change is justified by the measured files. A source
change should be considered only if a later exact comparison isolates a
specific source serialization defect that causes a named failed gate. Older
slice estimates that assumed a qualifying receiver are stale; remaining time
has no defensible finite estimate until route eligibility is evidenced.

## Verification and slice ledger

- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it remains
  an ancestor of the active branch. S685 `ef9cf0c4` was the clean start and
  highest assigned slice; S686 is unique.
- Board start replay: 4057→4059; validated exit evidence/comment replay:
  4059→4061. EPIC-17 and G04-V03 remain In Progress; acceptance is unchanged.
- `npm run control-center:test`: 42/42 passed. `git diff --check` passed; Git
  emitted only its existing LF-to-CRLF working-copy notices.
- No production or test code changed. Changed-code coverage is not applicable.
- External review: one bounded Sol read-only review, returned and reconciled.
  No separate external-agent task or additional review wait was needed.
- Maintainer decisions: 0; no approval is pending.
- Start: 2026-10-10 18:55:01 UTC. Close: 2026-10-10 19:06:24 UTC, about 11m23s
  elapsed. Evidence/matrix review and documentation: about 8m; focused checks
  and board closeout: about 2m; review wait: about 1m; maintainer decision
  time: 0m. These are wall-clock estimates, not instrumented CPU timings.

Next: continue only when an eligible receiver/profile is evidenced; until
then, do not report V03 or EPIC-17 complete. Full repository coverage, final
output review, PR, safe merge, ancestry verification, and any required
deployment remain explicit completion gates. No physical-fit or factory-
acceptance claim is made.
