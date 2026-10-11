# EPIC-17 / G04 V03 CLO startup diagnostics — Slice 496 start

## Scope

Read local, non-sensitive startup diagnostics for the existing CLO 2026.1.310
install after the S495 launch remained at “Creating Scene and Library” and the
Windows process was not responding. Determine whether logs or Windows event
records identify a concrete local failure that can be addressed without
changing app/system settings or disturbing the C: exchange files. If evidence
shows an ordinary startup delay with no actionable cause, record that result
and retain the hold.

No reinstall, settings change, authentication/account action, project open,
fixture transfer, import/export, file upload, or source/product change is in
scope. CLO remains closed during the read-only diagnostic. Do not claim that a
startup issue establishes DXF incompatibility.

## Verified start

- Started `2026-10-08 14:04:17 UTC` from clean S495
  `7927620c4f14a6eecbecf1df31d47c471d7284e0` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and
  remains an ancestor. S495 is highest; S496 is unique.
- Board revision 3083; EPIC-17/G04-V03 In Progress, V01/V02 Done. Goal active.
- S495 observed CLO 2026.1.310 (`CLO_Standalone_OnlineAuth_x64.exe`) remain at
  “Creating Scene and Library”; Windows reported PID 1248 as not responding.
  That idle process has been closed. No project or exchange file was open.

## Exit gates

1. Inspect only likely CLO application-log locations and relevant Windows
   Application events around the launch interval; redact account or personal
   data from retained evidence.
2. Record actual error text, event source/time, app/process state, and whether
   evidence supports a specific fix. Treat hypotheses as hypotheses.
3. Do not modify app, network, firewall, GPU, or system settings. Do not relaunch
   the app until diagnostics are complete; if a meaningful correction requires
   an unapproved change, stop with the exact evidence and request that decision.
4. Preserve V03 gates, measured Polo failure, rights boundary, protected export
   identities, and all board statuses. Update durable records and validated
   board only if the diagnostic yields evidence.

## Ownership and next action

Codex owns this read-only local diagnostic; no safe disjoint work package is
available. Next inspect application logs and the bounded Windows event window,
then decide whether a controlled relaunch is warranted.
