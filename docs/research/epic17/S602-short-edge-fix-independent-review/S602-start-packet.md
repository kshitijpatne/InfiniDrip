# EPIC-17 / G04 V03 — independent review of the five Polo short-edge failures — Slice 602 start

## Verified start

- Started `2026-10-09 09:52:21 UTC` from clean S601 commit
  `47515e72c4d3886f89a7809e1985fb5deead6a76` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. Highest assigned slice is 601; S602 is unique. Board revision
  3538 keeps EPIC-17 and G04-V03 In Progress, V02 Done.
- Goal remains active and the admitted objective remains in force. Product-
  development trial use and local-only file handling are confirmed; no further
  permission decision is needed. CLO remains open. All exchange artifacts stay
  under `C:\G04-CLO-DXF-Exchange\S602-short-edge-fix-independent-review\`.
- No product source or pattern is edited by this review. Existing pinned
  S552/S595/S601 evidence is the input; no unchanged CLO test is repeated.

## Objective and handoff

Obtain one independent, read-only technical review of the five repeatable Polo
CUT contour failures and identify a source-supported next action only if a
published interchange rule, exact receiver capability, or geometrically exact
encoding provides a concrete reason it should pass. The review should determine
whether any materially new, measurable local receiver/profile or export
representation remains untested. It must return either (a) one exact falsifiable
proposal with primary evidence, preserved geometry, test inputs, success/fail
metrics, and scope limits, or (b) an evidence-backed finding that the reviewed
sources provide no such proposal. Absence of a proposal is a valid result; do
not invent a fix or recommend repeating prior work.

## Evidence to inspect

- `S552-polo-short-edge-loss-diagnosis/S552-exit-packet.md` and its C:-only
  source-to-output mapping.
- `S536-polo-aama-vertex-preservation/S536-exit-packet.md`.
- `S555-polo-contour-remediation-analysis/S555-exit-packet.md`.
- `S593-polo-cut-output-topology/S593-exit-packet.md`.
- `S595-polo-periodic-spline-roundtrip/S595-exit-packet.md` and pinned hashes.
- `S601-clo-roundtrip-output-render/S601-exit-packet.md`.
- `S547-v03-seven-recipe-gate-reconciliation/V03-CURRENT-GATE-MATRIX-S547.md`,
  `S573-v03-gate-evidence-reconciliation/S573-exit-packet.md`, and the current
  roadmap/admission criteria.
- Read only the relevant checked-in source/docs and authoritative public
  technical documentation necessary to support or reject a specific proposal.

## Prior work that must not be repeated

Prior measured tests cover centimeter and millimeter units; DXF-AAMA, Standard
and ASTM-related routes; R12 POLYLINE and R2000 LWPOLYLINE; connected LINE;
closed, open and periodic degree-one SPLINE encodings; fillet/corner variants;
curve-point import controls; optimizer controls; repeated import/export; and
all-seven M/default two-generation fixture presence. The same tested CLO path
has five known failing Polo CUT contours, mixed CUT/SEW layer assignments, and
one malformed-input failure. S557/S573 already reconcile profile, grade, mark,
identity and rights evidence. Do not make general receiver lists, restate those
results as a new conclusion, repeat CLO file operations, infer CLO internals,
or claim legal/profile conformance beyond primary-source language.

## Acceptance, non-goals, and return format

- This is research-only: no working-tree/product edits, no CLO operations, no
  fixture transfer to a new receiver, no license acceptance, purchase, account,
  contact, hosted upload, scope amendment, or acceptance relaxation.
- Preserve all seven recipes, the 0.001 cm contour threshold, all V03 gates,
  legacy DXF behavior, and protected export identities. No production, fit,
  factory, or launch claims.
- Use primary technical sources; cite direct URLs, publication/revision/date,
  and exact supported claims. Distinguish source fact, measured evidence, and
  inference. State uncertainty and what the source cannot prove.
- Return a concise report with: `WORK FINISHED`; exact new proposal or `none`;
  source citations; mapping to each of the five failures; exact untested
  difference from prior work; falsifiable experiment and pass metric if
  justified; risks and remaining gates. Do not edit this packet or the parent
  worktree.

## Time and gates

Start `09:52:21 UTC`. Track research runtime, Codex review and durable closeout
separately; external-agent wait and maintainer-decision time are separate
entries. Focused verification is packet/board validation and `git diff
--check`; no product code changes, therefore no code coverage or full-repo gate
applies. The single next action after review is either test the exact
evidence-backed candidate in a new bounded slice or continue the already
admitted V03 path with all holds intact.
