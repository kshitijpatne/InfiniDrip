# EPIC-17 / G04 V03 — S687 CLO returned-entity audit

## Verified start

- Start: 2026-10-10 19:09:53 UTC, from clean S686 commit `a6543cf1` on
  `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. No `Slice 687:` assignment exists in branch history. The board is
  revision 4061; EPIC-17 and G04-V03 remain In Progress; V01/V02 remain Done.
- S685's source, CLO return and comparison report are hash-pinned in the
  existing C:-only exchange folders. No app operation or export is authorized
  or required for this audit.

## Objective

Audit the S685 comparator's remaining mark failures directly against every
entity in the exact saved CLO output, not only its polylines. For each of the
eight reported misses, check the matched piece block's entity kinds, layers,
and closest returned geometry. Verify the source and receiver hashes. Decide
whether the failure is a comparator omission or an actual loss/displacement in
the saved output. Do not change the source package, receiver file, thresholds,
or production code. If the full DXF structure contradicts S685's report, state
the smallest specific correction and gate it would clear; otherwise close
with the confirmed cause and no speculative encoding trial.

## Scope and gates

- Read-only analysis of the already saved S684/S685 C: files; one reproducible
  diagnostic helper and report may be committed in this packet.
- No new app, import, export, encoding/profile variation, acceptance change,
  legacy export change, or protected-byte baseline update.
- Success: the report is hash-verified and accounts for all eight marks and
  each matched receiver piece block, including non-polyline entity checks;
  focused diagnostic and Control Center checks pass; records/board close out.
- Stop if required C: files or recorded hashes do not match. Do not reinterpret
  changed evidence as a product defect without a source-to-return measurement.

## Required durable output

`S687-exit-packet.md`, `inspect-returned-mark-entities.mjs`, and the generated
`S687-returned-entity-audit.json`. The diagnostic only reads the existing
source, returned DXF and S685 report; it writes its JSON report in this folder.
