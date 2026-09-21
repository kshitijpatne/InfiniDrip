# InfiniDrip local Control Center

This is a repository-local, read-only delivery board. It is not the hosted
user workspace and it does not collect personal measurements or contact a
provider.

## Run it

From the repository root, serve this directory over the repository-managed
Vite toolchain:

```text
npx vite ops/control-center --host 127.0.0.1 --port 4174
```

Then open `http://127.0.0.1:4174/app/`. The dashboard loads the canonical
`data/board.json`, validates it before rendering, and visibly reports malformed
records instead of repairing or hiding them.

## Historical import rule

The baseline includes only facts that can be traced to current exit reports,
durable decisions or known commits. Missing historical dates, owners or proof
are represented by an `incomplete` evidence record; they are never inferred
from chat chronology or a guessed delivery date. The importer retains that
rule. For explicit evidence updates, `import-facts.mjs` accepts only
existing evidence IDs whose repository URI and kind already match the board;
each imported fact must carry a verified commit or SHA-256 proof and a note:

```text
node ops/control-center/import-facts.mjs \
  ops/control-center/data/board.json facts.json /tmp/board-with-facts.json
```

The importer never infers dates, owners, status, acceptance or delivery, and
it never contacts GitHub or a provider.

## State and review rule

The state machine is:

`Draft → Backlog → Ready → In Progress → In Review → Accepted → Closed`

`Blocked` and `Reopened` are explicit side paths. Contributors may submit work
to `In Review`; only an independent reviewer may accept or close it. A closed
item can reopen only when the reviewer records a reason and evidence reference.
