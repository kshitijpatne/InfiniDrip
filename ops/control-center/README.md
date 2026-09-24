# InfiniDrip local Control Center

This is the repository-local delivery board. `data/board.json` is its sole
canonical current-state file. It is not the hosted user workspace, does not
collect personal measurements, and does not contact a provider.

Schema v2 uses one shared validated command layer for local CLI and browser
mutations. The dashboard can create and edit items, transition status, add
notes, and create or link evidence without writing JSON directly.

## Run it

From the repository root, start the localhost-only service:

```text
npm run control-center:serve
```

Then open `http://127.0.0.1:4174/app/`. The service binds to `127.0.0.1`, loads
and validates `data/board.json`, and routes every save through the same atomic
command executor as the CLI. Search, filters and detail views are client-side;
refresh reads the persisted canonical file again.

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

The CLI and local UI support `createItem`, `editItem`, `updateStatus`,
`addEvidence`, and `addComment`. The maintainer CLI also supports `createEpic`,
`editEpic`, `renameItem`, `linkItemsToEpic`, `addEpicEvidence`, and
`updateEpicStatus`. `editEpic` changes the Epic description only; status stays
on the evidence-gated status command. Its reason is recorded on the matching
Epic summary card when one exists.
`renameItem` changes dependent work-item references and records the old ID in
an audit note; it cannot rename the protected Epic 13 phases or a numbered
Epic summary card separately from its Epic record. Future Epic
records may start in Backlog without implying execution has begun. Epic closure
requires every linked work item to be Done with verified, non-incomplete
evidence and a verified exit-report reference. For EPIC-13 specifically, the
validated linker and closer require exactly PREQUEUE-PHASE-01 through
PREQUEUE-PHASE-09 in order. New items begin in `Backlog`; their initial history
entry records the actor, role, time and reason. Status edits cannot be smuggled
through `editItem`. Every status transition requires an actor, selected
workflow role, and reason; moving to `Done` also requires linked
non-incomplete evidence.

EPIC-13 membership cannot be assigned or removed through single-item creation
or editing. Its reviewed membership is applied only by the maintainer batch
link command; the UI keeps the reserved option unavailable for ordinary item
edits.

G01–G17 have numbered Epic 14–30 records and matching work cards. Epic 14's
C01/C02/C05/C06 evidence wave is accepted. Lane A is In Progress; C03 is Done
with verified evidence, C04 is In Progress after C03, and G01 final review
remains Backlog behind C04 and all four evidence packets. Continue in that
sequence. Lane E under Epic 20 remains held for explicit garment-direction
approval. Ownership, scope and gates are recorded in the end-to-end capability
roadmap. Backlog registration alone is not work admission.

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
