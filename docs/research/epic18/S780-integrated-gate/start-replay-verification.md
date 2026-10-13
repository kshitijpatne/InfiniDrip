# Slice 780 start replay verification

The canonical board was revision 4673 before the S780 start replay. The
validated command files under docs/planning/EPIC-18-S780-*-BOARD-COMMAND.json
recorded the start packet to G05-EXIT at revision 4674, linked it to EPIC-18
at revision 4675, and moved G05-EXIT from Backlog to In Progress at revision
4676. EPIC-18 remains In Progress; G05-T01 through G05-T05 and UIQ-10 remain
Done. This status keeps the shared exit work active through the separate S781
merge/deployment closeout.

The first Control Center run failed 41/42 because its current-state assertion
still expected G05-EXIT to be Backlog. The complete output is preserved in
control-center-start-first-attempt.txt. The board transition is supported by
the admitted S780 packet, so ops/control-center/app/board.test.mjs now checks
the verified start evidence, its links to the item and Epic, the In Progress
status, and the evidence-bound status-history entry. No product source or
acceptance rule changed.

The final npm run control-center:test result is 42/42 at board revision 4676;
the output is preserved in control-center-start-final.txt. The canonical
E-G05-S780-START row resolves to start-packet.md, its SHA-256 matches the file,
and the item/Epic link and current status read back correctly.

## Next action

Profile the previously memory-heavy app coverage range using the current
Vitest worker configuration and one worker, record elapsed time and peak memory
for both, then run the single settled global gate. No worker default changes
are authorized by this measurement alone.
