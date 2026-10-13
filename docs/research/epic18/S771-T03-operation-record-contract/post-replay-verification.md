# S771 post-replay verification

The S771 exit packet is
`docs/research/epic18/S771-T03-operation-record-contract/exit-packet.md`.
The validated exit replay added `E-G05-S771-EXIT` to G05-T03 at revision
4586 and to EPIC-18 at revision 4587. The board continues to show EPIC-18 and
G05-T03 In Progress: S771 closes the source-record contract slice, while
S772/S773 remain necessary to complete T03.

## Verified closeout

- S771 start evidence advanced revision 4582→4585, attached the digest-bound
  start packet to G05-T03 and EPIC-18, and started G05-T03 In Progress.
- `E-G05-S771-EXIT` is the verified exit packet, hash-linked to G05-T03 and
  EPIC-18 through the validated exit commands at revisions 4585→4587.
- `npm run control-center:test` passes 42/42 against board revision 4587,
  including the S771 start and exit state. `git diff --check` passes.
- Focused T03 tests pass 13/13 at 100% statement, branch, function and line
  coverage for the changed production module. TypeScript and protected export
  identity 9/9 pass; no export baseline moved.
- The first exit-evidence command was rejected before mutation because its
  manually transcribed digest had 65 characters. The board stayed at 4585;
  the digest was recomputed from the packet, corrected to the 64-character
  SHA-256, and the exact command then succeeded. The follow-on Epic evidence
  command succeeded at revision 4587. No manual board edit was used.

The separate replay-evidence commands below will attach this verification to
G05-T03 and EPIC-18. They are evidence-only and must not change either status.
T03 editing/validation remains S772; component/BOM/pattern reconciliation and
all-recipe rendered/source review remain S773. No recipe operation facts were
seeded, and no physical, supplier, compliance, or production acceptance is
established.
