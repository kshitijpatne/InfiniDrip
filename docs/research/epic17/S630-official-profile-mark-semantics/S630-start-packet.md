# EPIC-17 / G04 V03 — Official profile and mark-semantics source audit — Slice 630 start

## Verified start and authority

- Started `2026-10-09 17:46:54 UTC` from clean S629 commit
  `8a45420b96f8513f02348aabe19d5b247c57aba1` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. Highest assigned slice is S629; reserve unique S630.
- Canonical board revision 3660 keeps G04-V02 Done and G04-V03/EPIC-17 In
  Progress. The S629 exit packet is the latest V03 handoff; it records a
  measured, one-fixture CLO mark-mapping gap. Re-read the current repository
  state and S629 packet before any scoped work.
- G04 and V03 are explicitly admitted. The maintainer's written CLO
  product-development and local-processing authorization is recorded in
  `docs/PROJECT-DECISIONS.md`; user reconfirmed this in the current thread.
  Preserve the C:-only exchange directory and keep CLO open. No additional
  consent step is needed for this bounded research.

## Bounded objective

Determine what the authoritative, publicly inspectable receiver and standards
documentation actually specifies about apparel-pattern marks and the DXF-AAMA
/ DXF-ASTM labels. Inspect official CLO documentation; official ASTM product
records and status; and the freely accessible NISTIR 5969 report, including its
mark-feature model and relevant diagrams. Distinguish a normative interchange
profile from a research information model, a user-interface format label, and
empirical behavior in the pinned S628/S629 CLO files. Decide whether those
sources define a specific, lawful, evidence-backed conversion hypothesis for
the S629 CIRCLE/POINT mismatches. If not, record the documentation boundary
and the next needed V03 evidence without running another receiver experiment.

## Specific sources to inspect

1. CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
   updated 2026-09-28. It documents CLO's Standard DXF/DXF-AAMA/DXF-ASTM
   import/export choices, size-group export behavior, units, grading and
   curve/notch settings. Determine whether it specifies an edition, normative
   entity/layer mapping for authored marks, or semantics sufficient to turn
   output coincidences into manufacturing-mark identity.
2. ASTM, [D6673-10 product record](https://store.astm.org/d6673-10.html) and
   [official Textile Standards catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html).
   The catalog lists D6673-10 as withdrawn in 2019. Check the public official
   product information for scope, referenced ANSI/AAMA-292A material, any
   stated replacement, and what cannot be established from its public listing.
   Do not buy the standard, copy or quote an unauthorized full-text repost, or
   claim its normative mark mappings without lawful access to the source.
3. NIST, [NISTIR 5969: Data Sharing Implementation Based on the Information
   Model for Apparel Pattern Making](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf),
   1997. Inspect its typed pattern/mark model (including Section 2.1 and the
   figures for `mark_feature`, geometry, and pattern-piece relations), and the
   prototype's stated inputs/results/limitations. Determine whether it
   specifies an encoding for DXF-AAMA receiver exchange or only presents an
   EXPRESS/STEP research information model.
4. NIST, [NISTIR 5823: A Survey of Standards for the U.S. Fiber/Textile/Apparel
   Industry](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5823.pdf), only
   for historical catalog context on ANSI/AAMA-292-1993. Do not treat this
   historical listing as proof of current status or conformance.

The ASTM public record and CLO Help Center are product/receiver documents; the
NIST reports are primary government research but are older and do not become
normative interchange standards by being public. Results from unofficial
copies, commercial tutorials, repositories, or user posts may help locate a
lead but cannot establish a conformance claim and are outside this slice's
evidence basis.

## Acceptance and non-goals

- Produce a source-by-source evidence table: exact claim supported, date/scope,
  authority/rights status, what it does not establish, and resulting V03
  disposition.
- Inspect the NIST mark-feature drawing/model sufficiently to determine
  whether it names mark semantics separately from geometry and whether its
  format/model is actually DXF-AAMA/D6673. Do not infer specific CLO export
  behavior or a 1:1 mapping from conceptual type similarity.
- Decide whether a specific D6673/AAMA mark encoding is sourced well enough to
  justify one bounded receiver experiment. If no, explicitly recommend no
  further CLO trial for this issue until a rights-accessible normative mapping
  or another formally documented receiver profile is available. This is a
  bounded evidence outcome, not V03 completion or a proposal to weaken scope.
- No CLO operation, DXF import/export, file transfer, cloud operation,
  purchase, third-party contact, new application install, source/geometry
  edit, production writer change, acceptance/tolerance/hold/status change, or
  V03 compatibility/conformance claim.
- V02 Done; V03 and EPIC-17 In Progress. Preserve all-seven recipe acceptance,
  legacy DXF behavior, protected byte identities, other V03 gates, and all
  claim limits. This slice does not close V03.

## Verification, bounded delegation, and next gate

- Codex owns the repository evidence table, conclusion, records, board and
  integration. An independent read-only Claude Opus 5.5 `xhigh` research check
  may inspect the same official/public sources and return only a separate
  review file; it may not edit shared source, board, scope or status. Require
  explicit `WORK FINISHED`, then reconcile its actual references and claims.
- No production-code changes are expected. Verify source URLs/access and
  claims, any reviewed figure/page, packet consistency, board validity,
  `npm run control-center:test`, and `git diff --check`. No full repo gate is
  due for a documentation/evidence-only slice; it remains required at the
  integrated PR boundary.
- Next: finish the official-source docket, determine whether any
  rights-accessible normative mark mapping exists, close S630 through validated
  board evidence, and choose the next concrete V03 gate using those results.

## Verified board-start evidence

The validated start replay should link this packet and a scope comment to
G04-V03, incrementing board revision 3660 to 3662 without changing statuses.
