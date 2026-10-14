# S782 exit-evidence hash reconciliation

During the S783 final consistency audit, canonical board evidence
`E-G05-S782-EXIT` recorded SHA-256
`ef3eb2ec8da2e682ec9a9bf85f1fa6cad121379e6cf7003e7b000e28ab19f131` for
`docs/research/epic18/S782-T01-legacy-v1-save/exit-packet.md`. That recorded
hash did not match the packet in the S782 commit or the Windows checkout. The
S782 committed packet is at `19c101dfeff43a8761e431a488ab61d092dae73f`; its
Git blob SHA-1 is `cfb951fad5461ef7dc2f5c3765b6b14ac15214f7`, the canonical LF
blob SHA-256 is
`181eae71350e7542ab6bca6fe5af094883d55ac71eb9bc872a8ea980a267d403`, and the
`core.autocrlf=true` Windows working copy SHA-256 is
`3e7c77ba9f392e433fde64badd65b59be33b0d264a0f6c4d5542fe1b5c9fe159`.

The S782 exit packet has been restored to the immutable S782 commit content.
Its old next-action text is a historical checkpoint. The subsequent S782
review approvals, Claude's reproduced Windows PDF finding, and the S783/S784
sequence are preserved in the S783 admission, start and exit packets and in the
two sanitized reviewer reports. This addendum records the gap without
rewriting S782 history or changing its production acceptance.

The new board evidence reference for this addendum is the current reconciliation
record. It supplements the historical `E-G05-S782-EXIT` entry and keeps
EPIC-18/G05-EXIT In Progress. The validated replay advances the board from
revision 4733 to 4735; it changes no product state and requires no product test
rerun.
