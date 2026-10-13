# Slice 780 — Control Center atomic-write diagnostics

The Control Center command layer reported two transient Windows `EPERM`
rename failures while replacing the canonical board. In both cases, the
command had already been checked against the current expected revision.

| Command | Attempt result | Read-back before retry | Validated retry |
| --- | --- | --- | --- |
| `EPIC-18-S780-LINK-RENDERED-EPIC-BOARD-COMMAND.json` | Rename of a uniquely named `.board.json.<pid>.<uuid>.tmp` to `board.json` returned `EPERM`. | Board remained at revision 4685; no board temp or lock file remained. | Re-executing the same JSON at expected revision 4685 succeeded and advanced to 4686. |
| `EPIC-18-S780-UPDATE-EXIT-DESCRIPTION-BOARD-COMMAND.json` | The same atomic rename returned `EPERM`. | Board remained at revision 4690; no board temp or lock file remained. | Re-executing the same JSON at expected revision 4690 succeeded and advanced to 4691. |

The command layer reloaded the canonical board and checked `expectedRevision`
on every attempt. The failed attempts did not apply their mutations; the
successful retries applied each edit once. No direct board-file edit, lock
removal, process termination, or relaxed revision check was used. The result
is included so a future task can distinguish these transient writes from the
separate `electron:pack` output-path failures.
