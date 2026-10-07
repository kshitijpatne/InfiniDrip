# S427 Control Center test failure notes

Two focused `npm run control-center:test` runs exposed stale regression assertions while reconciling the canonical summaries:

1. The EPIC description now says “Latest integrated tally remains …”; the test still required the previous “Latest verified integrated tally is …” wording. Updated the assertion to the current authoritative board wording.
2. The board summary shortens S425 to “S425 implements the approved Polo H display”; the test expected the longer prior “implements and verifies … segmented-ring display” phrase. Updated the assertion to match the current summary while the detailed S425 matrix/packet remains linked evidence.

No production behavior, board status, evidence reference, acceptance criterion, or face hold was changed to satisfy these checks. Final `npm run control-center:test` passes 42/42; passing output is `S427-control-center-exit.log`.
