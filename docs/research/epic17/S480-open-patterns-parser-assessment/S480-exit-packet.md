# EPIC-17 / G04 V03 — Open Patterns parser assessment — Slice 480 exit

## Result

S480 assessed the pinned Open Patterns repository at commit
`1afefdb8e9e01a7a7d7222adef8432d639fcb1b3` as a possible local independent
read-back parser. Its parser package (`@open-patterns/astm-parser@1.0.0`) and
the related CLI and SVG packages declare ISC. The parser depends on
`dxf-parser@1.1.2` (MIT); the isolated runner used `tsx@4.21.0` (MIT) and
`esbuild@0.27.7` (MIT). No InfiniDrip dependency or source was changed.

The repository's source is decisive about the input model: `_transform`
iterates `dxf.blocks`, requires `piece name` and `size` text keys in each
block, and expects numeric ASTM/AAMA layer identifiers. `buildSnapshot`
assembles layer-1 boundary runs, reports disconnected runs but retains only
the first chain, and closes a boundary implicitly. Missing/unrecognized unit
metadata warns and defaults to inches. These behaviors make it unsafe to
interpret its output as a source-truth geometry oracle without additional
format checks. Its CLI has `parse` (DXF→JSON), `svg` (DXF→SVG), and `image`
(DXF→raster) commands; source inspection found no DXF writer.

All three exact S463 generic M fixtures were hash-verified and attempted
locally: Tee `0b6cba95…5165fc9` (6,750 bytes), Polo
`796e537e…594fca` (24,261 bytes), and Woven `9fe52d80…65196a5` (14,923
bytes). Each threw the same `TypeError: Cannot convert undefined or null to
object` at `Object.keys(dxf.blocks)` in `ASTMParser._transform`. No OPF pieces,
JSON result, or render was produced. The raw exceptions and complete hashes
are retained in
`C:\G04-CLO-DXF-Exchange\Evidence\S480-open-patterns-parser\parser-results.json`;
the runner and cloned source are in that same named C: exchange directory.
No fixture left the local machine.

**Decision:** Open Patterns is not a usable read-back parser for the current
generic fixtures and cannot perform a DXF round trip because it has no DXF
writer. Do not select it as the V03 receiver/profile, integrate it, or claim
ASTM/AAMA compatibility from its name, README, or layer table. No raster/SVG
review was possible because parsing failed before producing OPF. This is a
candidate rejection, not a change to V03 acceptance.

## Scope and gates

- All-seven V02 acceptance remains accepted as recorded by S459. V03 still
  requires a rights-reviewed industrial receiver/profile and witnessed
  representative import/export/round-trip behavior, including size/grade
  semantics and negative-case handling.
- CLO remains closed for further pattern trials under S479's rights hold.
  Legacy DXF behavior and every protected export byte identity are unchanged.
- No external code was integrated, no pattern/output geometry changed, and no
  standards, physical-fit, factory-acceptance, or production-readiness claim
  was made. G04-V03 and EPIC-17 remain In Progress.
- The 5 vulnerabilities reported by npm's local audit during isolated tool
  setup are not product dependencies; no audit fix was applied. The clone and
  installed tool runtime remain confined to the C: exchange directory.

## Verification and boundary

- Fixture SHA-256 assertions and parser invocation: 3/3 fixtures checked;
  3/3 failed consistently at the absent block-table assumption, as expected
  from the exact source code. No output artifact is treated as a parse/render
  pass.
- Source capability check: package/CLI entry points and parser/snapshot source
  inspected at the pinned commit; no DXF writer exists in the package command
  surface. Dependency license declarations were checked for the used runtime.
- Canonical board start replay: `2967→2971`; validated exit replay:
  `2971→2975`; statuses remain In Progress. Control Center tests and diff
  checks pass: `npm run control-center:test` 42/42 and `git diff --check`.
- Full repository coverage/build/output gate is reserved for the settled
  integrated Epic/PR candidate; this evidence-only slice changed no product
  source or tests.

Started `2026-10-08 07:45:46 UTC` from S479 commit `aa6cf64`; refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
S479 was the highest prior slice; S480 is unique.

Elapsed accounting (approximate, total 8m36s): product implementation 0m;
focused source, license, fixture-hash, runtime, and board verification 5m;
durable records and board closeout 3m36s; external-agent waits 0m;
maintainer-decision time 0m. Full repository gate is deferred to the settled
integrated Epic/PR candidate.

**Next action:** use S465–S471 candidate research without repeating general
search to determine whether an already-known free/local receiver is lawfully
available and meets the industrial profile and round-trip requirements. If
none does, record the exact access dependency and continue only independent
V03 evidence work; do not spend, contact a supplier, upload fixtures, or weaken
the admitted acceptance criteria.
