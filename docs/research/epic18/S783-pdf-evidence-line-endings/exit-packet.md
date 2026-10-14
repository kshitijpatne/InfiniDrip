# EPIC-18/G05 Slice 783 exit — preserve S782 PDF bytes on Windows

**Status:** Complete at the local verification boundary; updated-head review and release remain S784 gates.  
**Branch:** `codex/epic-18-g05`. **Starting commit:** `19c101dfeff43a8761e431a488ab61d092dae73f`.  
**Board:** revision 4731 before exit replay; EPIC-18 and G05-EXIT remain In Progress.

## Scope and result

S783 adds one path-specific `.gitattributes` binary rule for
`docs/research/epic18/S782-T01-legacy-v1-save/S782-legacy-v1-tech-pack.pdf`.
No production code, test, PDF/ZIP content, rendered evidence, export code,
fixture, baseline, or threshold changed.

The reproduced failure and correction are recorded in
`fresh-checkout-hash-verification.json`. A fresh detached Windows worktree at
the S782 starting commit with `core.autocrlf=true` initially checked out the
PDF as 11,887 CRLF bytes (SHA-256
`03a1c84a35f5d8809cf29daa48b52f0b2cbda6ec58c24c1691de611304efa297`; Git
reported `i/lf w/crlf attr/`). Codex then staged the exact candidate attribute,
removed only the scratch copy of that PDF, and rechecked out that tracked path.
The file returned to the committed 11,686 bytes and SHA-256
`d27d230005e9a97bf6e739ecc109bb03b6219f24368177ee129b81180f9e57c4`; Git
reported `i/lf w/lf attr/-text` and `binary: set`.

The existing checkout's PDF, ZIP and artifact manifest still match their S782
Git blobs. The ZIP remains 3,902 bytes with SHA-256
`9d9bff4729c4239ba16765cf3d82b7efd02a37ad40da4c055f5c659849397665`; its
manifest still records the embedded PDF's 11,686-byte hash above. No output was
regenerated.

## Verification and time

| Gate | Result |
| --- | --- |
| Fresh Windows checkout reproduces original line-ending issue | Pass; 11,887 bytes, CRLF working copy. |
| Candidate binary attribute and forced checkout of the tracked PDF | Pass; exact 11,686-byte committed SHA-256 restored. |
| S782 PDF, ZIP and artifact-manifest working copies versus committed Git blobs | Pass; all three match. |
| Control Center suite for the updated canonical board summaries | Pass; 42/42 at board revision 4731. |
| Product tests, builds, browser/Electron, rendering, protected exports | Not rerun; no product or test source changed, and prior S782 evidence remains valid. |
| Exact updated-head Claude Code/OpenCode reviews and Codex acceptance | Pending in S784 after the S783 commit is pushed. |
| Merge, main workflow/deployment and live preview | Pending in S784. |

S783 began at 2026-10-13 23:51:40 UTC. The `.gitattributes` edit was written at
23:57:56 UTC (6m16s after start); time spent typing that one-line edit was not
separately instrumented. The baseline/candidate/hash shell calls took 6.7s in
total; the Control Center runner reported 2.388s. We ran that board suite
because the canonical summaries changed; no S782 product test, build, browser,
Electron or render gate was repeated. External-agent wait: 0. Maintainer-
decision wait: 0. Exit-packet content was finalized at 2026-10-14 00:08:59
UTC, 17m19s after slice start; subsequent board replay and commit overhead were
not separately instrumented.

The board exit replay adds this packet to G05-EXIT and links that evidence to
EPIC-18, advancing the canonical board to revision 4733 without changing either
work item's In Progress status.

## Holds and next action

The S782 code, regression, full coverage gate, rendered-output review, and prior
two approvals remain unchanged. S783 does not create any additional garment or
release claim. Physical validation, supplier/factory acceptance, code signing,
compliance, production release, paid services and provider-backed features
remain held.

**Single next action:** commit this bounded S783 change once as
`Slice 783: preserve S782 PDF evidence bytes`, push PR #43, then begin S784 by
obtaining fresh read-only Claude Code and OpenCode approvals of the exact new
head and recording Codex acceptance before merge.
