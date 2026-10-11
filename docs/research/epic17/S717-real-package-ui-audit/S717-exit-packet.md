# EPIC-17 / G04 V03 — S717 real-package UI audit exit

## Result

S717 closes the S716 evidence gap with a real, generated registered Tee M
schema-v5 package. The test passes its paired JSON and DXF through the Export
panel's actual file-selection and click flow, then invokes the production
`auditDxfInterchangeRoundTrip` implementation. The panel's success string
matches the actual report: 3 pieces, 6 outlines, 26 mark entities, and
0.000000 cm maximum geometry difference. The manifest's mark-record count is
not substituted for the auditor's serialized-entity count.

The same panel flow fails closed when the returned DXF has no centimeter
declaration (`role="alert"`, exact reason, no counts) and when the source
package revision digest is tampered (`role="alert"`, exact integrity reason,
no counts). The test uses Node WebCrypto to run the package integrity path in
Vitest's jsdom environment; this is test plumbing and makes no change to the
runtime or product.

This proves local package-to-panel-to-auditor wiring and its user-visible
positive/negative result handling for one registered configuration. It does
not test a CAD receiver, establish a rights-cleared industrial exchange
profile, resolve CLO's measured return failures, or prove seven-recipe,
73-option/grade breadth, repeatability, or receiver-rendered readability.
All V03 gates, thresholds, seven-recipe/options/grades requirements, legacy
DXF behavior, protected export byte identities, and final release gates remain
unchanged.

## Verification

- Focused panel suite: 11/11 passed.
- Changed production panel module coverage: 100% statements, branches,
  functions, and lines. Production source was unchanged in S717.
- The first run exposed an assertion error: manifest mark records did not
  equal the auditor's serialized mark-entity count. The test now compares the
  panel against an independently obtained report from the same production
  auditor; it retains exact pass/fail assertions.
- `git diff --check` and Control Center suite are recorded at closeout below.
- No build, browser/Electron replay, receiver, external CAD application,
  format, setting, encoding, or output change was needed for this test-only
  slice. S716's browser-rendered panel evidence remains the visual UI evidence.

## Time and state

- Start: 2026-10-11 03:33 UTC from S716 commit
  `8c3175fd5778c84485dadb8c838476a445ef4b9f`.
- Close: 2026-10-11 03:35 UTC. Test implementation and diagnosis: about 1m;
  focused verification: about 1m; durable closeout: about 1m; external-agent
  waits: 0m; maintainer-decision time: 0m.
- Refreshed `origin/main` remains `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and is an ancestor. S717 is uniquely reserved and closes without production
  code changes. EPIC-17 and G04-V03 remain In Progress; the goal remains active.
- The two pre-existing untracked S700 coverage diagnostics were not touched.

## Remaining work and next action

S717 clears only the local UI/auditor integration proof. V03 still requires a
qualified, rights-reviewed exchange profile and evidence for receiver
geometry, units, identity, marks/layers, all supported recipes/options/grades,
malformed inputs, repeatability, and readable output. Existing CLO evidence
has fixed-gate failures; no further application or mode trial is queued.
Continue S709's gate matrix with a code-side change only when the saved
source/return evidence supports a decisive correction. At the settled
candidate boundary, run the full repository coverage/build/browser/Electron
and output review once, inventory and remove only unnecessary repository
artifacts, then create/review/merge the PR, verify `origin/main` ancestry and
required deployment, and verify production end to end. Do not claim physical
fit, factory acceptance, or standards conformance without evidence.
