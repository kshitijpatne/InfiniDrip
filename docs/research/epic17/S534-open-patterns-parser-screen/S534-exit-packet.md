# EPIC-17 / G04 V03 — Open Patterns parser route screen — Slice 534 exit

## Finding

The specific `ksons/astm-parser` / Open Patterns lead is an apparel-specific,
local-source parser and renderer for ASTM/AAMA DXF. Its repository README
describes ASTM/AAMA DXF → Open Pattern Format JSON, then OPF → SVG/PNG. The
package metadata declares ISC, but the repository landing page lists no
standalone LICENSE file; the metadata is useful evidence, not a complete
rights review. The tool's own layer reference maps 1=boundary, 8=internal
lines, and 14=sew lines, and its parser API returns structured pieces and
diagnostics.

It is **not a CAD receiver or DXF round-trip implementation**. The documented
CLI has parse, SVG, and image commands; the code reads DXF and emits OPF. It
does not provide an OPF-to-DXF writer or a CAD authoring/import-export
application. Its tests round-trip fixtures through the OPF JSON schema, which
is not a CAD exchange round trip. Installing it would offer an additional
one-way parser/render check, but it cannot satisfy V03's receiver/profile and
round-trip gates. Static evidence makes a package installation or repeated
synthetic test low-value for the current blocker, so neither was performed.

This candidate independently reinforces why S532's layer-8 CUT/SEW mix is a
semantic concern under the parser's documented mapping. It cannot establish
normative conformance: the repository is a third-party implementation, not a
standards body, and ASTM D6673-10 is withdrawn. It also cannot resolve CLO's
trial-purpose or local-handling terms. No G04 bytes, app UI, package install,
payment, vendor contact, or acceptance change occurred. CLO remains open.

## V03 disposition and next step

Open Patterns is retained as a possible future independent parser/visual
cross-check only, subject to checking the applicable package/dependency rights
before adoption. It is rejected as the V03 CAD receiver. Existing concrete
S531 malformed-input failure, S532 narrow synthetic geometry result, semantic
layer gaps, and all rights/profile/grade/all-seven gates remain unchanged.

The smallest blocker needing maintainer-supplied evidence is written
authorization for CLO that specifically covers product-development pattern
testing under the current Trial License, together with a data-handling basis
that satisfies the local-file requirement. If that cannot be produced, do not
use CLO on G04 files; a different free desktop receiver must first be shown to
have an exact apparel-profile implementation, commercial/development rights,
and local processing. Do not buy software or contact a supplier under this
slice.

## Sources

- Open Patterns, [repository and README](https://github.com/ksons/astm-parser),
  including the documented DXF→OPF→SVG/PNG functions and layer reference.
- Open Patterns, [`@open-patterns/astm-parser` package metadata](https://raw.githubusercontent.com/ksons/astm-parser/main/packages/astm-parser/package.json),
  declaring ISC and a DXF parser dependency.
- Open Patterns, [parser source](https://raw.githubusercontent.com/ksons/astm-parser/main/packages/astm-parser/src/index.ts),
  showing the read/parse/transform API and OPF output.
- Open Patterns, [CLI package metadata](https://raw.githubusercontent.com/ksons/astm-parser/main/packages/cli/package.json),
  declaring the OPF command-line package.
- Prior controlling evidence: S526 CLO rights/data review, S531 malformed
  input, S532 synthetic round trip, and S533 official profile reconciliation.

## Verified closeout

Started `2026-10-08 20:57:55 UTC` from S533 commit `62677af` on
`codex/epic-17-g04`; `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S534 is unique.
Board start replay: `3247→3248→3249`; exit replay and focused checks are
`3249→3250→3251` on G04-V03. Control Center tests passed 42/42; canonical
board validation passed at revision 3251; `git diff --check` passed. No product
code or tests changed; changed-code coverage and the full repository gate do
not apply.

Elapsed `20:57:55–20:59:39 UTC` (~1m44s): source review 1m; focused validation
and durable closeout 44s; external-agent wait 0m; maintainer-decision time 0m.
This one-lead static screen had no safe disjoint delegation.
