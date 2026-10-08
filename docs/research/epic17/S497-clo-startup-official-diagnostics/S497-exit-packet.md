# EPIC-17 / G04 V03 CLO startup diagnosis — Slice 497 exit

## Finding

No official CLO article establishes a verified fix for the two S495/S496
startup stalls. The official disk-rights article explicitly includes “Unable
to launch CLO, it is not responding” and prescribes administrator installation
or a `Users` write ACL on the CLO executable. This is relevant but only a
hypothesis for this host. The local executable and install directory grant
`BUILTIN\Users` read/execute, not write; SYSTEM and Administrators have full
control. The previously observed cache was writable by the current user and
continued to receive files during startup, so a blanket write-denial theory is
not established. No ACL was changed.

The Intel 530/630 article is scoped to immediate launch crashes on those exact
adapters and points to an invasive driver rollback. This host reports
`Intel(R) Graphics`, driver `32.0.101.8826`, status OK; the GPU model was not
identified and the observed failure was a delayed post-login stall. The
article is not an evidence-backed match. CLO's general “How to Speed Up CLO”
article discusses unresponsiveness, but its remedies require a reachable
workspace or project, which S495/S496 did not expose. No settings, driver,
security, network, account, install or permission changes were made.

Exact claims, source dates, applicability, and limitations are in
[`S497-opencode-findings.md`](S497-opencode-findings.md). Official sources:
[disk permissions](https://support.clo3d.com/hc/en-us/articles/17074279996697-Disk-access-rights-required-when-CLO-is-running),
[Intel 530/630 startup crash](https://support.clo3d.com/hc/en-us/articles/360001315067-I-m-using-Intel-HD-Graphic-530-or-630-and-CLO-crashes-immediately-upon-launching),
[Intel driver fix](https://support.clo3d.com/hc/en-us/articles/360001773247-How-to-Fix-the-Error-using-Intel-Graphics-Card),
and [performance guidance](https://support.clo3d.com/hc/en-us/articles/23390057463577-How-to-Speed-Up-CLO).

## Practical-test handoff and limits

The maintainer reported during closeout that CLO is now running. This is a
user-provided status, not yet an observed responsive workspace. S497's scope
prohibited another launch, so no additional input was sent to CLO in this
slice. The next slice may inspect the already-running window and, only if it
has a responsive workspace, continue the authorized local DXF scenarios. Keep
all exchange artifacts under `C:\\G04-CLO-DXF-Exchange`. If it is again
nonresponsive, preserve the exact state and error evidence; do not change
ACLs/drivers or infer that CLO is incompatible.

Prior V03 results remain unchanged: Tee M 6/6 and Woven M 24/24 contour checks
pass; Woven's next-generation check is 114/114; Polo M is 13/18 with five CUT
contours over the unchanged `0.001 cm` tolerance. Rights/local handling,
import-warning interpretation, numeric layer/mark semantics, grading,
malformed-input rejection, and independent-receiver acceptance remain open.
No V03 acceptance gate or compatibility claim is cleared by S497.

## Scope, verification and boundary

- Read official CLO startup/performance sources and the exact executable,
  install-directory ACLs plus read-only GPU driver metadata.
- OpenCode used the required Muse Spark 1.3 contributor model, `xhigh`, normal
  mode in an isolated worktree. Its explicit `WORK FINISHED` report was
  reviewed and selectively copied here. No implementation, test, pattern,
  exchange, account, driver, or settings files were changed.
- No test/build/coverage/render gate applies to this read-only diagnostic
  slice. Board updates use the validated `board-store.mjs` command layer.
- Started `2026-10-08 14:11:53 UTC` from clean S496
  `6914335d17046d15caef968e2cf7189be90192ac`; `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S496 was
  highest; S497 is unique. Board start replay `3089→3091`.
- Approximate elapsed time: source/ACL investigation `2m`; OpenCode wait and
  review `3m`; implementation `0m`; durable records/board and focused board
  verification `2m`; maintainer-decision time `0m`.

**Next action:** reserve S498 from this boundary and inspect the already-running
CLO window. Proceed with the planned import/export fixtures only after a
responsive workspace is visibly available; record every operation and keep
V03 In Progress until all admitted gates pass.
