# InfiniDrip local Control Center

This is the repository-local delivery board. `data/board.json` is its sole
canonical current-state file. It is not the hosted user workspace, does not
collect personal measurements, and does not contact a provider.

Schema v2 introduces the shared validated command layer used by local CLI
mutations. Browser authoring is scheduled for Slice 185; until that slice
lands, the current dashboard remains read-only.

## Run it

From the repository root, serve this directory over the repository-managed
Vite toolchain:

```text
npx vite ops/control-center --host 127.0.0.1 --port 4174
```

Then open `http://127.0.0.1:4174/app/`. The dashboard loads `data/board.json`,
validates it before rendering, and visibly reports malformed records instead
of repairing or hiding them.

## Validated local commands

Prepare a JSON command and run it through the repository script:

```text
npm run control-center:command -- command.json
```

The optional second argument selects another board path for isolated tests.
The command layer validates the complete input and result, checks an optional
`expectedRevision`, acquires a short-lived local lock, writes a same-directory
temporary file, flushes it, and atomically renames it over the canonical file.
An invalid, stale, busy, or failed save leaves the original board intact.

Supported commands are `editItem`, `updateStatus`, `addEvidence`, and
`addComment`. Status edits cannot be smuggled through `editItem`. Every status
transition requires an actor, selected workflow role, and reason; moving to
`Done` also requires linked non-incomplete evidence.

## Historical import rule

The baseline includes only facts that can be traced to current exit reports,
durable decisions or known commits. Missing historical dates, owners or proof
are represented by an `incomplete` evidence record; they are never inferred
from chat chronology or a guessed delivery date. The importer retains that
rule. For explicit evidence updates, `import-facts.mjs` accepts only
existing evidence IDs whose repository URI and kind already match the board;
each imported fact must carry a verified commit or SHA-256 proof and a note:

```text
node ops/control-center/import-facts.mjs facts.json
```

The optional second argument selects an isolated board path. The importer now
uses the same validated, atomic command layer; it never infers dates, owners,
status, acceptance or delivery, and never contacts GitHub or a provider.

## State and review rule

The current state machine is:

`Backlog → Ready → In Progress → Review → Done`

`Blocked` can be entered from any unfinished state. Contributors can claim
ready work, submit it for `Review`, and unblock it. Reviewers can approve
`Review → Done` or return it to `In Progress`. Maintainers can override,
reopen `Done`, and archive items. These roles are local workflow guidance, not
security enforcement. Legacy v1 labels remain inside old history entries so
the migration does not rewrite historical evidence.
