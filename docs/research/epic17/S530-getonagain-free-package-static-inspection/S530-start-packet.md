# EPIC-17 / G04 V03 — GetonAgain free package static inspection — Slice 530 start

## Objective

Statically inspect the official free download identified in S529 to resolve
package identity and any bundled license/privacy/version metadata before
considering execution. This is a local, read-only artifact inspection. The
purpose is to determine whether the free build can plausibly match the
V2024.1 apparel AAMA/ASTM DXF capability already documented by the official
manual.

## Boundaries

- Download only the official ZIP
  `FUZHUANGCAD_MIANFEI_20260306.zip` to
  `C:\G04-CLO-DXF-Exchange\S530-getonagain-free-package-static-inspection\`.
- Enumerate archive contents and inspect text/license/config/version metadata
  without launching, installing, or executing any contained binary or script.
- Do not create an account, submit a phone number, contact the vendor, accept
  terms, invoke cloud functions, or open/import/export pattern files.
- Do not use CLO or alter its current running state.
- Record the archive SHA-256. Any extracted text/metadata stays inside the
  same named C: folder. Preserve existing files; do not overwrite.
- No V03 gate or acceptance criterion changes.

## Acceptance and verification

Identify package date/name, file inventory, product/version indicators, any
license/privacy terms included, and whether static evidence settles AAMA/ASTM
DXF import/export or local-only handling. Treat missing evidence as unresolved.
Verify the official download host, archive hash, board replay/validation,
focused Control Center suite, and `git diff --check`. No production code/CAD
output is expected; full coverage/build gates do not apply.

## Verified start

Started `2026-10-08 20:26:04 UTC` from S529 `adae72c` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S529 is the
highest assigned slice; S530 is reserved. Board revision 3231; validated
start commands advance it to 3233. EPIC-17/G04-V03 In Progress; V01/V02 Done.
The Epic goal remains active and accurate.

## Delegation and gates

No separate safe task exists: package identity and metadata require a single
integrated read-only inspection. Codex owns it. No external-agent waits.
