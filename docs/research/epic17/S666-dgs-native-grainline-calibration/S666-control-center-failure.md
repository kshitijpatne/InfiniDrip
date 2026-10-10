# S666 first Control Center run — preserved failure and repair

The first `npm run control-center:test` after the six validated S666 exit
commands reached 41/42. The single failure was
`closed Epics 14–16 and admitted G04 status match their evidence`: it expected
the established exact phrase `V01 and V02 are Done`, while the reconciled Epic
description used only `V01/V02 are Done`. This was a protected summary-wording
regression, not a V03 evidence or status failure.

The complete failing console output was preserved in the task execution log.
The board was repaired only through two validated `editEpic` / `editItem`
commands in `S666-exit-repair-command-01.json` and
`S666-exit-repair-command-02.json`, preserving the required exact wording and
current S666/S667 facts. The affected `board.test.mjs` then passed 18/18. A
second validated edit pair (`S666-final-board-wording-command-01/02.json`)
made the wording concise without changing evidence. The final focused Control
Center suite passed 42/42. Final board revision is 3911; EPIC-17 and G04-V03
remain In Progress and V01/V02 remain Done.

The first attempt to apply exit command 3 also returned transient Windows
`EPERM` during atomic rename, with on-disk board still at revision 3903 and no
temporary file left. The same validated command, with expected revision 3903,
then passed to 3904; later commands and repairs completed through 3911. The
command layer preserved the previous canonical board on failure.
