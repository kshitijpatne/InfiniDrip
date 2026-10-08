# S463 V03 receiver-independent fixture pack — start

- Start: 2026-10-08 04:19:48 UTC on `codex/epic-17-g04`, clean HEAD
  `b8462cf6bda2097167ef16c13c3ab49727e2d78e` (Slice 462).
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and remains an ancestor. Highest assigned slice is 462; S463 is unique.
- Canonical board revision 2831; EPIC-17 and G04-V03 are In Progress;
  G04-V01/V02 are Done. The goal is active and matches its admitted objective.
- Current limits allow ordinary work (46% primary, 29% weekly).

## Scope

Prepare a receiver-independent, source-reproducible fixture set for the
already implemented **generic** DXF output, to reduce setup time once an exact
rights-cleared receiver/version is available. Include a simple Tee, a marked
complex Polo, a marked Woven shirt, a source-rule-derived Tee size series, and
one deliberately malformed negative control. Store the generation script,
fixture inputs, source configuration, and SHA-256 manifest together. Report
what these inputs can test and what they cannot prove. Preserve the generic
DXF writer, its byte identities, all gates, and the receiver/profile selection
hold.

## Acceptance and verification

- Generate all fixtures from current recipe/drafting source and the existing
  DXF writer without editing production code.
- Record exact source commit, recipe/options/measurements, size steps, pieces,
  mark/layer inventory, byte length and hash; verify deterministic regeneration.
- Confirm each positive DXF can be parsed into well-formed code/value pairs and
  has closed CUT/SEW contours; negative control is explicitly invalid and is
  never presented as a garment pattern.
- Preserve `src/export/regression.test.ts` and all protected export identities.
  Run focused export and Control Center checks plus staged diff validation.
- V03 stays In Progress. No apparel profile, unit declaration, grade encoding,
  receiver import/export or compatibility claim is accepted by this slice.

## Holds, decisions and ownership

- Blocking external decision: owner-provided lawful local access to an exact
  industrial apparel-CAD receiver/version. No trial, payment, account action,
  vendor contact, file transfer or standard-compatibility claim is authorized.
- Preserve all-seven V02, generic DXF behavior, protected byte identities,
  existing receiver/rights gates and the admitted exclusion list.
- This fixture-generation task is tightly coupled to exporter and drafting
  source contracts; no safe disjoint external coding-agent task is identified.
  Codex retains ownership. OpenCode requires Muse Spark 1.3 xhigh in normal
  mode; no substitute is permitted.

## Exit evidence expected

Generation script and input files; independent structure/inventory/hash
verification; exact receiver-independent limitations; focused tests and board
preflight/replay; timing split among implementation, verification, agent wait,
and maintainer-decision time. Next action: obtain exact receiver access, then
add receiver-specific profile fixtures and observed import/export/round-trip
evidence.
