# EPIC-17 / G04 V03 — Richpeace package preflight — Slice 482 exit

## Result

S482 attempted a bounded static preflight of the exact Richpeace Garment CAD
V8.0 Free Version-English package linked from the official product page. The
official product page's link redirected through the Richpeace download portal
to the publisher-hosted `soft.richpeace.com` RAR URL recorded in the start
packet. The portal listing identifies a 64 MB package updated 2021-10-13.

The package host did not respond to a no-body `HEAD` request within 15 seconds;
the earlier redirected command-line request also timed out. The web fetcher
could follow the link but could not retrieve the binary. No package bytes were
saved, so there is no file digest, publisher signature, version resource, or
embedded license/EULA to inspect. These are unavailable observations, not
negative findings about the package. No download was allowed to fall into the
default Downloads folder; the required exchange folder remains the only
permitted location for any future package or exchange artifact.

This preflight therefore does not clear evaluation rights, local handling,
package integrity, or Windows 11 behavior. The official product listing still
describes an evaluation copy and lists Windows XP/7/8/10. No installation or
execution is warranted from the currently available evidence. A new attempt
requires both an obtainable package saved only under
`C:\G04-CLO-DXF-Exchange` and explicit action-time approval for installation;
then Gate 0 must verify displayed terms, local handling, exact build/modes, and
host behavior before any fixture is opened.

## Acceptance and preserved boundaries

- Exact publisher source chain and portal listing are recorded; binary digest,
  signature, embedded terms, and exact build remain unavailable.
- No installer was downloaded, unpacked, launched, or installed. No account,
  setting, compatibility mode, fixture, or external file transfer was used.
- No receiver/profile is selected. G04-V03 remains In Progress; V01/V02 remain
  Done. All V03 rights, local-processing, industrial-profile, round-trip,
  grade, and negative-input criteria remain unchanged.
- Legacy DXF behavior and protected export byte identities are untouched.
  There is no production-code or test change; no full repository gate is due.
- CLO remains closed and unused for this slice.

## Verification

- Read-only `HEAD` request to the publisher-hosted RAR URL: timed out after 15
  seconds with `TaskCanceledException`; no response status or body.
- Earlier redirected fetch in S482 also timed out; web navigation exposed the
  portal metadata but could not retrieve the binary.
- Start board replay: revision `2983→2987`. Validated exit replay:
  `2987→2991`. EPIC-17 and G04-V03 remain In Progress.
- `npm run control-center:test`: 42/42 passed; `git diff --check` passes.
- `origin/main` refreshed to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  remains an ancestor of the S481 starting commit and this slice.
- Goal record remains active and aligned with the admitted objective.

## Next action and gate

Continue V03 only if a rights-cleared local receiver/profile becomes available.
For Richpeace, the next step is to obtain the exact package safely under the C:
exchange directory and receive explicit approval before installation. If the
package cannot be obtained or terms/local handling fail Gate 0, retain the V03
hold and seek an already accessible, rights-cleared local receiver; do not
weaken round-trip acceptance or substitute a hosted receiver.

Started `2026-10-08 08:03:10 UTC` from S481 `96608bf`; finished
`2026-10-08 08:07:26 UTC`. Elapsed ~4m16s (implementation/product changes 0m;
focused endpoint/source verification ~1m; durable records/board/Control Center
regression ~3m16s; external-agent waits 0m; maintainer-decision time 0m).
