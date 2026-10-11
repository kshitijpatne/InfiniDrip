# EPIC-17 / G04 V03 CLO startup recovery research — Slice 497 start

## Scope

Assess the exact local CLO 2026.1.310 startup failure from S495/S496 against
official CLO support guidance and read-only Windows file permissions. Determine
whether a concrete, low-risk supported recovery is established, or whether the
observations remain insufficient to change any setting. OpenCode independently
checks only official CLO source claims and returns a cited findings report in
its separate worktree; Codex checks actual local ACLs and integrates the result.

No app launch/UI action, permission or graphics/network/firewall setting change,
install/reinstall, account action, project open, DXF transfer, import/export, or
exchange-file mutation is in scope. Preserve the existing V03 gates and prior
actual receiver measurements. A troubleshooting hypothesis is not a verified
fix or a DXF compatibility claim.

## Verified start

- Started `2026-10-08 14:11:53 UTC` from clean S496
  `6914335d17046d15caef968e2cf7189be90192ac` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor. S496 is highest; S497 is unique.
- Board revision 3089; EPIC-17/G04-V03 In Progress; V01/V02 Done. Goal active.
- S495/S496 show two authenticated starts that did not expose a pattern
  workspace, a nonresponsive process, and no matching Windows crash/error
  event or crash dump. Login succeeded; startup reached scene/library loading.
- CLO process is not running. User specifically asked to close it when no
  longer required.
- The official CLO help search returned its disk-access/nonresponse article,
  integrated-Intel graphics guidance, and general performance guidance. These
  sources are leads only; no applicable local cause is confirmed.

## Acceptance and exit gates

1. Check executable and app-cache ACLs without changing them; state exactly
   whether the current user can read/execute/write in the locations CLO
   actually used.
2. Cross-check relevant official CLO instructions for startup nonresponse and
   Intel graphics, reporting article dates and exact applicability. Do not
   follow recommendations to uninstall security software, alter firewall,
   elevate privileges, or change GPU settings.
3. Separate verified cause, plausible hypothesis, and unknown. If no exact
   cause/fix is established, record the minimal support evidence needed and
   retain the hold; do not launch again in this slice.
4. Preserve all V03 criteria, prior Polo failure, layer ambiguity, rights
   boundary, legacy DXF behavior, protected exports, and EPIC/V03 statuses.

## Delegation and ownership

OpenCode's independent scope is limited to an official-source-only written
cross-check; it may write only `S497-opencode-findings.md` in its isolated
worktree, based on this packet and the listed source URLs. Use
`opencode/muse-spark-1.3-contributor-free`, `xhigh`, normal mode. The exact
model was present in the local model list. Require its explicit `WORK FINISHED`
signal and JSON return packet before review. Codex owns local ACL inspection,
source cross-check, current-worktree records, and final decision. If the exact
model/variant is unavailable, stop that delegated run without substitution.

## Sources and next action

- CLO disk access rights and nonresponsive-launch guidance:
  `https://support.clo3d.com/hc/en-us/articles/17074279996697-Disk-access-rights-required-when-CLO-is-running`
- CLO Intel graphics startup guidance:
  `https://support.clo3d.com/hc/en-us/articles/360001315067-I-m-using-Intel-HD-Graphic-530-or-630-and-CLO-crashes-immediately-upon-launching`
- CLO performance guidance:
  `https://support.clo3d.com/hc/en-us/articles/23390057463577-How-to-Speed-Up-CLO`

Next: inspect the exact ACLs and complete the independent official-source
cross-check. Do not change the machine or retry CLO without a verified cause.
