# S497 OpenCode findings — official CLO startup guidance cross-check

Scope: read-only official-source check for EPIC-17 G04 V03, CLO `2026.1.310`
startup stall recorded in S495/S496. No app, account, setting, file, or
fixture action taken. No CLO launch, install, permission, network, or driver
change made or recommended as approved.

Required context read: `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
`docs/PROJECT-DECISIONS.md`, `docs/OPENCODE-WORKFLOW.md`,
`docs/research/epic17/S497-clo-startup-official-diagnostics/S497-start-packet.md`,
`S497-opencode-handoff.md`, S495 exit packet, S496 exit packet, S493 V03 gate
matrix (`S493-v03-gate-matrix.md`).

## Recorded startup state (from S495/S496 — not re-observed here)

- CLO version: `2026.1.310`.
- S495: fresh launch stayed at "Creating Scene and Library" (~2 min);
  Windows reported the process `Responding: False`. No pattern/project
  opened; no import/export attempted.
- S496: local `authentication.log` recorded `STARTUP`, `REQUEST_LOGIN_START`,
  `LOGIN_SUCCESS` (first launch 09:56:31/09:56:49/09:56:53 local) and a second
  `LOGIN_SUCCESS` at 10:05 local. Startup advanced from "Creating Scene and
  Library" to "Loading CLO"; Windows briefly reported responding, then PID
  64976 `Responding: False` after ~1 minute, before any pattern workspace.
- No matching Windows Application error/crash entry, no `.dmp`/`.mdmp` or
  named crash/error file, no explicit vendor error message found in S496.
- Startup asset cache wrote 66 files and continued writing during startup.
- App displayed an integrated Intel graphics/DX11 performance notice. Exact
  GPU model and driver version were not recorded. No graphics, network,
  firewall, app, or system setting was changed.
- Idle process was closed; CLO not running at closeout.

## Source 1 — disk access rights

- URL:
  `https://support.clo3d.com/hc/en-us/articles/17074279996697-Disk-access-rights-required-when-CLO-is-running`
- Article title: "Disk access rights required when CLO is running".
- Updated date shown: September 28, 2026 08:26. Author shown: CLO TechSupport.
- Exact relevant guidance (paraphrase kept close to source wording):
  - "In order for the CLO to operate normally, sufficient read and write
    permissions are required on the disk in the user's computer", applying to
    "all storage devices ... including hard disk and SSD".
  - "Usually, this task is done in the same way as installing with admin
    rights and running with admin rights, and through this way, various
    unexpected errors also can be prevented."
  - "**Please note** that this may require assistance from the administrator
    of your computer, i.e. your IT or security team."
  - Listed "Common problematic situations" include verbatim: "Unable to launch
    CLO, it is not responding." Other listed situations: file write error
    during install; not responding when using certain functions; installed
    but no default asset files (avatars/garments); unable to save to specific
    folders; not responding/crashes loading or saving certain files;
    "You don't have permission to download" warning.
  - Windows remedy steps: log in with the Windows administrator profile and
    install with administrator privileges ("Run as administrator" + UAC Yes);
    or, after exiting CLO, open the installed CLO executable Properties >
    Security tab > Users > Edit and enable "Read & execute", "Read",
    "Write", then Apply. Guest-privilege logins are directed to the second
    path. macOS path is Full Disk Access (not applicable to this host).
- Applicability to observed symptom:
  - Confirmed fact: one listed symptom sentence textually matches the observed
    class ("Unable to launch CLO, it is not responding" vs. recorded
    `Responding: False` before the workspace).
  - Plausible hypothesis only: insufficient read/write rights on some path
    CLO actually used could produce a launch-time stall. This is NOT
    confirmed: this contributor inspected no local ACLs (Codex owns that
    check per the start packet), and S496 records the cache wrote 66 files
    during startup, which shows writes were occurring to at least that cache
    location. That observation cuts against a blanket disk-denial cause but
    does not prove every required path (install dir, asset/library paths,
    save paths) was writable.
  - Unknown: which exact paths stalled, what the current ACLs are, under
    which privilege the app was installed/run, whether default assets were
    complete, and whether security software played any role.
- Recovery safety: every documented recovery in this article requires an
  owner-authorized setting or permission change (admin-privilege install/run,
  filesystem ACL edit, possible IT/security-team assistance). None is safe
  and non-invasive to perform unilaterally. No reinstall, privilege
  elevation, ACL edit, or antivirus/firewall change is recommended as
  approved. No fix is verified: a practical successful relaunch has not
  occurred.

## Source 2 — Intel HD Graphics 530/630 immediate crash

- URL:
  `https://support.clo3d.com/hc/en-us/articles/360001315067-I-m-using-Intel-HD-Graphic-530-or-630-and-CLO-crashes-immediately-upon-launching`
- Article title:
  "I'm using Intel HD Graphic 530 (or 630) and CLO crashes immediately upon
  launching."
- Updated date shown: July 26, 2026 05:12. Author shown: Laura.
- Exact relevant guidance: the article body is a single pointer — "Please
  refer to the manual, [How to Fix the Error using Intel Graphics Card] ...
  to solve the issue." It states no other remedy itself.
- Necessary official cross-link followed (same support domain):
  - URL:
    `https://support.clo3d.com/hc/en-us/articles/360001773247-How-to-Fix-the-Error-using-Intel-Graphics-Card`
  - Title: "How to Fix the Error using Intel Graphics Card".
  - Updated date shown: August 03, 2026 04:46. Author shown: Lea.
  - Objective: "Learn how to resolve launching error using Intel HD
    Graphics." Operation statement: "Since this crashing is due to a Graphic
    driver which is automatically updated by Microsoft Windows, please
    re-install the Intel graphics driver after deactivating 'Windows
    Automatic Updates'."
  - Case 1: run `gpedit.msc`; enable "Do not include drivers with Windows
    Update"; via Device Manager uninstall the Intel(R) HD Graphics device and
    driver software; reboot; install Intel Driver & Support Assistant;
    reinstall the Intel HD Graphics driver; verify version "23.20.16.4901";
    reboot. Note: the Group Policy option "may not appear" below certain
    Windows versions (lists Windows 7 Home / Windows 10 Home), in which case
    "External Graphics card should be used" (links Computer Specification).
  - Case 2 (if Case 1 does not resolve): download/install the linked "Intel
    Graphics Driver for Windows" (15.60 family link) and approve overwrite
    to the previous version during installation.
- Applicability to observed symptom:
  - Confirmed fact: neither the listed symptom nor the listed hardware scope
    matches this machine's recorded evidence. The article covers an
    *immediate crash upon launching* on specifically *Intel HD Graphics 530
    or 630*. The recorded behavior is a delayed nonresponsive stall *after*
    successful authentication with startup progress ("Creating Scene and
    Library" then "Loading CLO" over ~1–2 minutes), no crash event or dump,
    and an *unspecified* integrated Intel GPU (model not recorded).
  - Per handoff instruction, the 530/630 instructions are NOT generalized to
    an unspecified Intel GPU.
  - The cross-linked fix pins obsolete driver versions (23.20.16.4901 /
    15.60 family) and requires Group Policy change plus driver
    uninstall/reinstall — an owner-authorized, invasive setting/driver
    change, with a Home-edition limitation and an external-GPU fallback that
    is out of scope to recommend.
  - Unknown: exact GPU model, driver version, Windows edition/policy
    availability, and whether graphics plays any causal role here. The
    observed DX11 performance notice is a warning, not evidence of this
    article's crash cause.
- Recovery safety: requires owner-authorized driver/setting changes; not
  safe/non-invasive. No fix is verified.

## Source 3 — general performance guidance

- URL:
  `https://support.clo3d.com/hc/en-us/articles/23390057463577-How-to-Speed-Up-CLO`
- Article title: "How to Speed Up CLO".
- Updated date shown: August 18, 2025 06:58. Author shown: CLO TechSupport.
- Exact relevant guidance:
  - "Problem Situations" list includes verbatim "CLO software becomes
    unresponsive or quits unexpectedly", alongside slow file open/save, slow
    simulation, and render freeze/quit.
  - Remedies are all *post-workspace, in-app or project-level* tuning: show
    frame rate via Settings > Display > Environment; Antialiasing x8 or lower
    for low-end Intel-graphics-only computers; keep Normal Blending / Default
    Rendering / image resolution at default absent special purpose; VBO
    integrated since CLO 2024.2 (no manual toggle); Auto Save default 10 min
    (1–2 min causes frequent writes); Particle Distance default 20 (lower
    values multiply vertex/calculation load); limit OBJ topstitching, prefer
    texture type; animation-containing, custom-avatar, heavy OBJ/FBX trim,
    ultra-high-resolution (>4000x4000) texture, high-res VRAY/PDF/snapshot
    (>200 ppi), and old-version project files as slowdown causes;
    simulation-mode choices (Normal / Fitting / Animation-Stable; GPU only on
    Windows with Nvidia); laptop on power; cooler maintenance; internet noted
    as used only for login/logout, asset download, CLO-SET up/download, and
    crash-log delivery.
  - "See also" links include "Install CLO with administrator privileges"
    (resolves to the Source 1 article ID 17074279996697), "Graphics card
    problems and troubleshooting", and "Visual C++ Redistributable download".
- Applicability to observed symptom:
  - Confirmed fact: the phrase "becomes unresponsive" superficially overlaps,
    but every remedy in this article assumes a reachable workspace, open
    project, or adjustable setting. No project was opened, no settings were
    changed, and the workspace was never reached in S495/S496.
  - This source establishes no startup-stall-before-workspace fix and no
    applicable recovery for the recorded state. Plausible contributor at most:
    general low-end/Intel-graphics slowness cannot be excluded on
    congratulations-free evidence — but that is speculation, not a documented
    match. Unknown dominates.
- Recovery safety: in-app settings tuning is not reachable (workspace never
  exposed) and therefore not an available non-invasive recovery. No fix is
  verified.

## Answer to the assigned question

No listed official source provides a verified, applicable fix for the recorded
startup state (authentication succeeds, initialization hangs at
scene/library/loading before the workspace, process becomes nonresponsive,
Intel graphics/DX11 notice, no event-log error).

- Source 1 establishes that insufficient disk rights *can* present as "Unable
  to launch CLO, it is not responding" and documents admin-install/ACL
  remedies — a plausible hypothesis requiring owner authorization and local
  ACL evidence, not a confirmed cause here (cache writes were observed).
- Source 2 (+ its official cross-link) establishes an immediate-crash fix
  scoped to Intel HD 530/630 with pinned old drivers — does not match the
  observed delayed stall on an unspecified Intel GPU.
- Source 3 establishes in-app/project performance tuning for reachable
  workspaces — does not address a pre-workspace startup stall.

## Minimum additional evidence before any setting/ACL change (read-only)

1. Exact GPU model and driver version, exact text of the graphics/DX11
   notice, and Windows edition/build (Group Policy availability matters for
   any Intel-driver path; model identity matters before applying 530/630
   guidance).
2. Codex's ACL inspection result: install directory and actually-used cache/
   asset/library paths, current user effective rights, install/run privilege
   history (per Source 1's admin-install vs. ACL-edit branches).
3. Whether the 66-file asset download completed or stalled mid-download, free
   disk space, and read-only observation of any quarantined/blocked-file
   signal — without changing security controls.
4. Startup-log lines beyond `LOGIN_SUCCESS` (with secrets redacted), exact
   stall-phase timestamps, and a fresh bounded Application-log re-query at a
   diagnosable relaunch — no repeated blind relaunches.
5. System-requirements comparison for CLO 2026.1.310 against this host's
   CPU/GPU/RAM/OS (official "CLO system requirements (September 2026)" is
   referenced by these articles but was not in the assigned source list, so
   it is noted only as a future lead, not cited as evidence).

## Limits and non-goals observed

- No CAD, format, pattern, product, rights, or legal opinion offered. No
  generic DXF research. No claim that the app is unsuitable or incompatible.
- No uninstalling antivirus/firewall, network-control, ACL, reinstall, or
  privilege-elevation action recommended as approved.
- No fix called verified: no practical successful relaunch occurred.
- Tests, coverage, build, rendered output: not run (not applicable to this
  read-only source task).

## Verification

- All three assigned URLs fetched and cited with exact titles and update
  dates; one necessary same-domain cross-link (Intel fix manual) followed as
  permitted.
- Every claim above is scoped as confirmed fact, plausible hypothesis, or
  unknown. Uncertainty is left explicit.
- Only this file was created in the contributor worktree; no other file
  modified; app/settings/user files untouched.
