# EPIC-17 / G04 V03 — GetonAgain free package static inspection — Slice 530 exit

## Result

The official download endpoint responds `200 OK` with `Content-Type: application/zip`, advertises byte ranges, and declares a content length of `260,318,538` bytes (248.2 MiB). A local transfer was started only in `C:\G04-CLO-DXF-Exchange\S530-getonagain-free-package-static-inspection\`. After resuming the partial transfer, observed throughput was about 75 KB/s with an estimated remaining duration above 50 minutes. The transfer was stopped to return to the direct V03 practical-test path requested by the maintainer.

The file retained in that folder is **incomplete**, 7,728,860 bytes, SHA-256 `381A7B3E9DADABB2E91841EED62A2694F12E09D48481EEE4AC8D16339D29734B` (partial-transfer hash only; not a valid package identity). It must not be opened, extracted, executed, or treated as evidence about package contents. No installer or executable was run. Because the archive was incomplete, S530 does not establish the free build's version, bundled license/privacy text, DXF capability, or local-only handling. S529's V2024.1 manual evidence and its limits remain unchanged.

## Scope and gate disposition

- No account, phone number, vendor contact, terms acceptance, cloud function, pattern file, or CAD output was used.
- CLO was not operated, closed, or reopened during this slice; its running state was left alone.
- No V03 acceptance criterion changed or cleared. The free GetonAgain package remains an unqualified lead.
- The practical CLO route is a separate technical question from the incomplete GetonAgain download. S526's recorded Trial License/use and local-handling limits remain explicit and must be reconciled before using G04 product fixtures.

## Verification and closeout

Started `2026-10-08 20:26:04 UTC` from S529 `adae72c` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S530 is unique; board start is `3231→3233`, and exit replay is recorded below. Focused Control Center tests, canonical board validation, replay preflight, and `git diff --check` are required at closeout; no production code/CAD output changed, so changed-code coverage and the full repository gate do not apply.

Elapsed time `20:26:04–20:30:30 UTC` (4m26s): endpoint/package investigation 2m30s; transfer and throughput diagnosis 1m05s; durable closeout 0m51s; external-agent wait 0m; maintainer-decision time 0m.

**Next action:** begin a distinct, bounded CLO DXF practical-test slice without reopening or closing the already-running app. First reconcile the S526 trial-use/local-handling evidence with the maintainer's explicit test instruction; if an applicable restriction remains, do not transmit G04 pattern content under the trial. Any CAD or screenshot evidence must remain under a named C: folder. Preserve every current V03 hold until all receiver, profile, rights, local-data, geometry, semantics, grade, warning, negative-input, and round-trip checks pass.
